import { NextRequest, NextResponse } from 'next/server';
import { addDraw, saveCronLog, getRecentDrawSourceKeys } from '@/lib/db';
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

  const isFullSync = req.nextUrl.searchParams.get('full') === 'true';
  const forceSource = req.nextUrl.searchParams.get('source');

  const results: Record<LotteryType, CronLogResult> = {
    mega645: { inserted: [], skipped: [] },
    power655: { inserted: [], skipped: [] },
  };

  for (const lotteryType of LOTTERY_TYPES) {
    try {
      if (isFullSync) {
        // --- CHẾ ĐỘ FULL SYNC ---
        const { fetchFromCommunitySource, fetchAllFromOfficialSource } = await import('@/lib/vietlott-source');
        const { addDrawsBulk } = await import('@/lib/db');
        
        let allDraws;
        let actualSource: 'official' | 'community' = 'community';
        
        if (forceSource === 'official') {
          actualSource = 'official';
          allDraws = await fetchAllFromOfficialSource(lotteryType);
        } else {
          allDraws = await fetchFromCommunitySource(lotteryType, 0); // 0 = lấy hết
        }
        
        // Gắn thêm meta data
        const drawsToInsert = allDraws.map(draw => ({
          ...draw,
          source: actualSource,
          syncedAt: new Date().toISOString()
        }));
        
        const bulkResult = await addDrawsBulk(drawsToInsert);
        results[lotteryType].source = actualSource;
        results[lotteryType].inserted = [`Quét ${allDraws.length} kỳ quay: Thêm mới ${bulkResult.upsertedCount}, Cập nhật ${bulkResult.modifiedCount} (Nguồn: ${actualSource})`];
      } else {
        // --- CHẾ ĐỘ CRON HẰNG NGÀY (MẶC ĐỊNH) ---
        const existingSet = await getRecentDrawSourceKeys(lotteryType, 20);

        const { draws: latestFromSource, source } = await fetchLatestDrawsFromSource(lotteryType, 3);
        results[lotteryType].source = source;

        for (const draw of latestFromSource) {
          if (existingSet.has(`${draw.id}-${source}`)) {
            results[lotteryType].skipped.push(draw.id);
            continue;
          }

          await addDraw({
            ...draw,
            source,
            syncedAt: new Date().toISOString(),
          });
          results[lotteryType].inserted.push(draw.id);
        }
      }

    } catch (error: any) {
      console.error(`Error syncing draws for ${lotteryType}:`, error);
      results[lotteryType].error = error?.message || 'Lỗi không xác định';
    }
  }

  const success = LOTTERY_TYPES.every((t) => !results[t].error);
  const runAt = new Date().toISOString();

  // Ghi log là "best effort": nếu MongoDB không kết nối được thì bản thân saveCronLog
  // cũng ném lỗi. Không bắt ở đây thì route crash và Next trả 500 với body rỗng,
  // khiến phía client vỡ ở `res.json()` thay vì nhận được thông báo lỗi rõ ràng.
  let logError: string | undefined;
  try {
    await saveCronLog({ runAt, triggeredBy, triggeredByEmail, results, success });
  } catch (error: any) {
    console.error('Không ghi được cron log:', error);
    logError = error?.message || 'Không ghi được cron log';
  }

  return NextResponse.json(
    { success: success && !logError, syncedAt: runAt, results, ...(logError ? { error: logError } : {}) },
    { status: success && !logError ? 200 : 207 }
  );
}
