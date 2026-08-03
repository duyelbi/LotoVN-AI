import { NextRequest, NextResponse } from 'next/server';
import { getCronLogs } from '@/lib/db';
import { verifyAdminRequest } from '@/lib/admin-auth';

/** Trả lịch sử các lần chạy đồng bộ kỳ quay gần nhất, chỉ admin mới xem được (xem `lib/admin-auth.ts`). */
export async function GET(req: NextRequest) {
  const { isAdmin } = await verifyAdminRequest(req);
  if (!isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const logs = await getCronLogs(20);
  return NextResponse.json({ logs });
}
