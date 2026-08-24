import { NextRequest, NextResponse } from 'next/server';
import { getDraws, addDraw } from '@/lib/db';
import { verifyAdminRequest } from '@/lib/admin-auth';
import { LotteryType } from '@/lib/types';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const typeParam = searchParams.get('type') as LotteryType;
    const type: LotteryType = typeParam === 'power655' ? 'power655' : 'mega645';
    const limitParam = searchParams.get('limit');
    const limit = limitParam === 'all' ? 'all' : Number(limitParam || 30);

    const draws = await getDraws(type, limit);
    return NextResponse.json({ draws, count: draws.length });
  } catch (error: any) {
    console.error('Error in GET /api/draws:', error);
    return NextResponse.json(
      { error: 'Failed to fetch draw history' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { isAdmin } = await verifyAdminRequest(req);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const {
      id,
      lotteryType,
      drawDate,
      numbers,
      bonusNumber,
      jackpotValue,
      hasWinner,
    } = body;

    if (!id || !lotteryType || !Array.isArray(numbers) || numbers.length !== 6) {
      return NextResponse.json(
        { error: 'Dữ liệu kỳ quay không hợp lệ. Cần đủ 6 số và mã kỳ quay.' },
        { status: 400 }
      );
    }

    const created = await addDraw({
      id,
      lotteryType,
      drawDate: drawDate || new Date().toISOString().split('T')[0],
      numbers: numbers.map((n: any) => Number(n)).sort((a, b) => a - b),
      bonusNumber: bonusNumber ? Number(bonusNumber) : undefined,
      jackpotValue: Number(jackpotValue) || 20000000000,
      hasWinner: Boolean(hasWinner),
    });

    return NextResponse.json({ success: true, draw: created }, { status: 201 });
  } catch (error: any) {
    console.error('Error in POST /api/draws:', error);
    return NextResponse.json(
      { error: 'Không thể thêm kỳ quay mới', details: error?.message },
      { status: 500 }
    );
  }
}
