import { NextRequest, NextResponse } from 'next/server';
import { getCronLogs, getAdminDataOverview } from '@/lib/db';
import { verifyAdminRequest } from '@/lib/admin-auth';

/** Trả lịch sử cron_logs và tổng quan dữ liệu bảng draws, chỉ admin mới xem được. */
export async function GET(req: NextRequest) {
  const { isAdmin } = await verifyAdminRequest(req);
  if (!isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const [logs, overview] = await Promise.all([
      getCronLogs(20),
      getAdminDataOverview(),
    ]);

    return NextResponse.json({ logs, overview });
  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: error.message || 'Lỗi hệ thống' },
      { status: 500 }
    );
  }
}
