import { NextRequest, NextResponse } from 'next/server';
import { countUniqueDraws } from '@/lib/db';
import { LotteryType } from '@/lib/types';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const typeParam = searchParams.get('type') as LotteryType;
    const type: LotteryType = typeParam === 'power655' ? 'power655' : 'mega645';
    const count = await countUniqueDraws(type);
    return NextResponse.json({ count });
  } catch (error: unknown) {
    console.error('Error in GET /api/draws/count:', error);
    return NextResponse.json({ count: 0 }, { status: 500 });
  }
}
