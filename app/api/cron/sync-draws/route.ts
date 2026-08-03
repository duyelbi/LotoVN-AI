import { NextRequest, NextResponse } from 'next/server';
import { getDraws, addDraw } from '@/lib/db';
import { fetchLatestDrawsFromSource } from '@/lib/vietlott-source';
import { LotteryType } from '@/lib/types';

const LOTTERY_TYPES: LotteryType[] = ['mega645', 'power655'];

/**
 * Endpoint được Cloud Scheduler gọi hàng ngày để đồng bộ kỳ quay mới nhất từ nguồn
 * dữ liệu cộng đồng (xem `lib/vietlott-source.ts`). Idempotent — chạy lại nhiều lần
 * trong ngày không tạo bản ghi trùng, vì chỉ insert những `id` chưa có trong DB.
 * Yêu cầu header `Authorization: Bearer <CRON_SECRET>` để tránh bị gọi công khai.
 */
export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = req.headers.get('authorization');

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const results: Record<LotteryType, { inserted: string[]; skipped: string[]; source?: 'official' | 'community' }> = {
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
      return NextResponse.json(
        { error: `Đồng bộ ${lotteryType} thất bại`, details: error?.message, results },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({
    success: true,
    syncedAt: new Date().toISOString(),
    results,
  });
}
