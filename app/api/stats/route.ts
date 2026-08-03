import { NextRequest, NextResponse } from 'next/server';
import { getLotteryStats } from '@/lib/db';
import { LotteryType } from '@/lib/types';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const typeParam = searchParams.get('type') as LotteryType;
    const type: LotteryType = typeParam === 'power655' ? 'power655' : 'mega645';
    const limit = Number(searchParams.get('limit') || 30);

    const stats = await getLotteryStats(type, limit);
    return NextResponse.json(stats);
  } catch (error: any) {
    console.error('Error in /api/stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch lottery statistics', details: error?.message },
      { status: 500 }
    );
  }
}
