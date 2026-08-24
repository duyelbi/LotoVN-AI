import { NextRequest, NextResponse } from 'next/server';
import { getAdminGroupedDraws } from '@/lib/db';
import { verifyAdminRequest } from '@/lib/admin-auth';

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

    const { draws, pagination } = await getAdminGroupedDraws({
      type,
      syncStatus,
      limit,
      page,
    });

    return NextResponse.json({ draws, pagination });
  } catch (error: unknown) {
    console.error('Error in GET /api/admin/draws:', error);
    return NextResponse.json(
      { error: 'Lỗi hệ thống khi tải kỳ quay' },
      { status: 500 }
    );
  }
}
