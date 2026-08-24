import { NextRequest, NextResponse } from 'next/server';
import { getMongoDb } from '@/lib/db';
import { verifyAdminRequest } from '@/lib/admin-auth';
import { LotteryType } from '@/lib/types';
import { fetchFromCommunitySource } from '@/lib/vietlott-source';

export async function GET(req: NextRequest) {
  const { isAdmin } = await verifyAdminRequest(req);
  if (!isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const typeParam = searchParams.get('type') || 'all';

    const db = await getMongoDb();
    const col = db.collection('draws');

    const typesToScan: LotteryType[] = typeParam === 'all' 
      ? ['mega645', 'power655'] 
      : [typeParam as LotteryType];

    const allMissingDraws = [];

    for (const type of typesToScan) {
      // 1. Get all IDs currently in the database for this lottery type
      const dbDocs = await col.find(
        { lotteryType: type },
        { projection: { id: 1 } }
      ).toArray();
      
      const dbIds = new Set(dbDocs.map(doc => doc.id));

      // 2. Fetch all historical draws from community JSONL
      let communityDraws = [];
      try {
        communityDraws = await fetchFromCommunitySource(type, 0);
      } catch (err) {
        console.error(`[missing-draws] Lỗi tải dữ liệu cộng đồng cho ${type}:`, err);
        continue;
      }

      // 3. Find completely missing draws
      for (const draw of communityDraws) {
        if (!dbIds.has(draw.id)) {
          allMissingDraws.push({
            id: draw.id,
            lotteryType: draw.lotteryType,
            drawDate: draw.drawDate,
            numbers: draw.numbers,
            bonusNumber: draw.bonusNumber
          });
        }
      }
    }

    // Sort by draw date descending (newest missing draws first)
    allMissingDraws.sort((a, b) => new Date(b.drawDate).getTime() - new Date(a.drawDate).getTime());

    return NextResponse.json({
      success: true,
      missingDraws: allMissingDraws,
      count: allMissingDraws.length
    });
  } catch (error) {
    console.error('[missing-draws] Lỗi quét dữ liệu trống:', error);
    return NextResponse.json({ error: 'Lỗi máy chủ nội bộ' }, { status: 500 });
  }
}
