import { NextResponse } from 'next/server';
import { verifyAdminRequest } from '@/lib/admin-auth';

/**
 * Endpoint kiểm tra quyền admin cho user hiện tại qua Firebase ID token.
 * Trả về { isAdmin: true/false, email: string }.
 */
export async function GET(req: Request) {
  const result = await verifyAdminRequest(req);
  return NextResponse.json(result);
}
