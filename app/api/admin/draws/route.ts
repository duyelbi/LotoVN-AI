import { NextRequest, NextResponse } from 'next/server';
import { getMongoDb } from '@/lib/db';
import { verifyAdminRequest } from '@/lib/admin-auth';
import { DrawRecord } from '@/lib/types';

export async function GET(req: NextRequest) {
  const { isAdmin } = await verifyAdminRequest(req);
  if (!isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type') || 'all';
    const syncStatus = searchParams.get('syncStatus') || 'all';
    const limitParam = searchParams.get('limit') || '50';
    const limit = limitParam === 'all' ? 'all' : Number(limitParam);
    const page = Math.max(1, Number(searchParams.get('page') || 1));

    const db = await getMongoDb();
    const col = db.collection<DrawRecord>('draws');

    const matchStage: any = {};
    if (type !== 'all') {
      matchStage.lotteryType = type;
    }

    // 1. Count total grouped records
    const countPipeline: any[] = [
      { $match: matchStage },
      { $group: { _id: { id: '$id', lotteryType: '$lotteryType' }, sourceCount: { $sum: 1 } } }
    ];

    if (syncStatus === 'missing') {
      countPipeline.push({ $match: { sourceCount: { $lt: 2 } } });
    }
    
    countPipeline.push({ $count: 'total' });

    const countResult = await col.aggregate(countPipeline).toArray();
    const totalRecords = countResult.length > 0 ? countResult[0].total : 0;
    const totalPages = limit === 'all' ? 1 : Math.ceil(totalRecords / (limit as number));

    // 2. Fetch data
    const dataPipeline: any[] = [
      { $match: matchStage },
      {
        $group: {
          _id: { id: '$id', lotteryType: '$lotteryType' },
          id: { $first: '$id' },
          lotteryType: { $first: '$lotteryType' },
          drawDate: { $first: '$drawDate' },
          docs: { $push: '$$ROOT' },
          sourceCount: { $sum: 1 }
        }
      }
    ];

    if (syncStatus === 'missing') {
      dataPipeline.push({ $match: { sourceCount: { $lt: 2 } } });
    }

    dataPipeline.push({ $sort: { drawDate: -1 } });

    if (limit !== 'all') {
      const skip = (page - 1) * (limit as number);
      dataPipeline.push({ $skip: skip });
      dataPipeline.push({ $limit: limit });
    }

    const groupedDocs = await col.aggregate(dataPipeline).toArray();

    const draws = groupedDocs.map((doc: any) => {
      const official = doc.docs.find((d: any) => d.source === 'official');
      const community = doc.docs.find((d: any) => d.source === 'community');
      return {
        id: doc.id,
        lotteryType: doc.lotteryType,
        drawDate: doc.drawDate,
        official: official || undefined,
        community: community || undefined,
      };
    });

    return NextResponse.json({ 
      draws, 
      pagination: {
        total: totalRecords,
        page,
        limit,
        totalPages
      }
    });
  } catch (error: any) {
    console.error('Error in GET /api/admin/draws:', error);
    return NextResponse.json(
      { error: 'Lỗi hệ thống khi tải kỳ quay' },
      { status: 500 }
    );
  }
}
