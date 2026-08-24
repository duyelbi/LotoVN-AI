import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminRequest } from '@/lib/admin-auth';
import { LotteryType, DrawRecord } from '@/lib/types';
import { addDrawsBulk, getMongoDb } from '@/lib/db';
import { fetchFromOfficialSource, fetchFromCommunitySource } from '@/lib/vietlott-source';

export async function POST(req: NextRequest) {
  try {
    const { isAdmin } = await verifyAdminRequest(req);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { id, type } = body;

    if (!id || !type || (type !== 'mega645' && type !== 'power655')) {
      return NextResponse.json({ error: 'Invalid id or type' }, { status: 400 });
    }

    const lotteryType = type as LotteryType;

    // Check which sources already exist in DB
    const db = await getMongoDb();
    const existingDocs = await db.collection<DrawRecord>('draws')
      .find({ id, lotteryType })
      .project({ source: 1 })
      .toArray();
    const existingSources = new Set(existingDocs.map(d => d.source));

    const drawsToInsert: any[] = [];
    type SourceStatus = 'exists' | 'found' | 'not_found' | 'error';
    const results: Record<string, SourceStatus> = {
      official: existingSources.has('official') ? 'exists' : 'not_found',
      community: existingSources.has('community') ? 'exists' : 'not_found',
    };

    // Only fetch community if not already in DB
    if (!existingSources.has('community')) {
      try {
        const allCommunityDraws = await fetchFromCommunitySource(lotteryType, 0);
        const communityDraw = allCommunityDraws.find((d) => d.id === id);
        if (communityDraw) {
          drawsToInsert.push({ ...communityDraw, source: 'community' });
          results.community = 'found';
        }
      } catch (err) {
        console.warn(`[sync-single] Lỗi khi lấy nguồn cộng đồng cho ${id}:`, err);
        results.community = 'error';
      }
    }

    // Only fetch official if not already in DB
    if (!existingSources.has('official')) {
      try {
        let officialDraw = null;
        for (let page = 0; page < 10; page++) {
          const pageDraws = await fetchFromOfficialSource(lotteryType, 100, page);
          officialDraw = pageDraws.find((d) => d.id === id);
          if (officialDraw || pageDraws.length === 0) {
            break;
          }
        }
        if (officialDraw) {
          drawsToInsert.push({ ...officialDraw, source: 'official' });
          results.official = 'found';
        }
      } catch (err) {
        console.warn(`[sync-single] Lỗi khi lấy nguồn chính chủ cho ${id}:`, err);
        results.official = 'error';
      }
    }

    let inserted = 0;
    if (drawsToInsert.length > 0) {
      const bulkResult = await addDrawsBulk(drawsToInsert);
      inserted = bulkResult.upsertedCount;
    }

    return NextResponse.json({
      success: true,
      results,
      drawsFound: drawsToInsert.length,
      inserted,
    });
  } catch (error) {
    console.error('[sync-single] Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
