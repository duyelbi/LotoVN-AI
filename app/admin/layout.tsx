import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifyAdminIdToken } from '@/lib/admin-auth';

/**
 * Gate server cho `/admin`: verify chữ ký Firebase ID token trong cookie `__session`.
 * `proxy.ts` chỉ decode JWT ở Edge (không verify); layout này mới là chặn thật trước khi render.
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const token = (await cookies()).get('__session')?.value;
  const { isAdmin } = await verifyAdminIdToken(token);
  if (!isAdmin) {
    redirect('/');
  }
  return children;
}
