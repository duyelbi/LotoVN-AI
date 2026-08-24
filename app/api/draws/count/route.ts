import { NextRequest, NextResponse } from 'next/server';
import { getMongoDb } from '@/lib/db';
import { LotteryType } from '@/lib/types';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const typeParam = searchParams.get('type') as LotteryType;
    const type: LotteryType = typeParam === 'power655' ? 'power655' : 'mega645';
    
    const db = await getMongoDb();
    
    const pipeline = [
      { $match: { lotteryType: type } },
      { $group: { _id: "$id" } },
      { $count: "count" }
    ];
    
    const result = await db.collection('draws').aggregate(pipeline).toArray();
    const count = result.length > 0 ? result[0].count : 0;
    
    return NextResponse.json({ count });
  } catch (error: any) {
    console.error('Error in GET /api/draws/count:', error);
    return NextResponse.json({ count: 0 }, { status: 500 });
  }
}
