import { NextRequest, NextResponse } from 'next/server';
import { getDraws, addDraw, saveCronLog } from '@/lib/db';
import { fetchLatestDrawsFromSource } from '@/lib/vietlott-source';
import { verifyAdminRequest } from '@/lib/admin-auth';
import { CronLogResult, LotteryType } from '@/lib/types';

const LOTTERY_TYPES: LotteryType[] = ['mega645', 'power655'];

/**
 * Endpoint đồng bộ kỳ quay mới nhất từ nguồn dữ liệu Vietlott (xem `lib/vietlott-source.ts`).
 * Idempotent — chạy lại nhiều lần không tạo bản ghi trùng, vì chỉ insert `id` chưa có trong DB.
 * Lỗi ở 1 loại vé số không chặn loại còn lại, và mọi lần chạy (kể cả lỗi) đều được ghi vào
 * `cron_logs` để hiển thị trên `/admin`.
 *
 * 2 cách gọi được chấp nhận:
 * - Header `Authorization: Bearer <CRON_SECRET>` — Cloud Scheduler gọi hàng ngày.
 * - Header `Authorization: Bearer <Firebase ID token của admin>` — nút "Chạy đồng bộ ngay" trên `/admin`.
 */
export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = req.headers.get('authorization');
  const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

  let triggeredBy: 'scheduler' | 'admin';
  let triggeredByEmail: string | undefined;

  if (cronSecret && bearerToken === cronSecret) {
    triggeredBy = 'scheduler';
  } else {
    const { isAdmin, email } = await verifyAdminRequest(req);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    triggeredBy = 'admin';
    triggeredByEmail = email;
  }

  const results: Record<LotteryType, CronLogResult> = {
    mega645: { inserted: [], skipped: [] },
    power655: { inserted: [], skipped: [] },
  };

  for (const lotteryType of LOTTERY_TYPES) {
    try {
      const existingDraws = await getDraws(lotteryType, 10);
      const existingIds = new Set(existingDraws.map((d) => d.id));

      const { draws: latestFromSource, source } = await fetchLatestDrawsFromSource(lotteryType, 3);
      results[lotteryType].source = source;

      for (const draw of latestFromSource) {
        if (existingIds.has(draw.id)) {
          results[lotteryType].skipped.push(draw.id);
          continue;
        }
        await addDraw(draw);
        results[lotteryType].inserted.push(draw.id);
      }
    } catch (error: any) {
      console.error(`Error syncing draws for ${lotteryType}:`, error);
      results[lotteryType].error = error?.message || 'Lỗi không xác định';
    }
  }

  const success = LOTTERY_TYPES.every((t) => !results[t].error);
  const runAt = new Date().toISOString();

  await saveCronLog({ runAt, triggeredBy, triggeredByEmail, results, success });

  return NextResponse.json(
    { success, syncedAt: runAt, results },
    { status: success ? 200 : 207 }
  );
}
