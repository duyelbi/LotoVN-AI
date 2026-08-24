import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || '')
  .split(',')
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

/**
 * Giải mã JWT Payload tương thích với Edge Runtime của Next.js Middleware.
 */
function decodeJwtPayload(token: string): { email?: string; exp?: number } | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    let base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) {
      base64 += '=';
    }
    const jsonString = atob(base64);
    return JSON.parse(jsonString);
  } catch {
    return null;
  }
}

/**
 * Edge pre-check cho `/admin`: decode JWT `__session` (không verify chữ ký — Edge
 * không chạy firebase-admin). Gate thật: `app/admin/layout.tsx` + `verifyAdminIdToken`,
 * và mọi API admin đều gọi `verifyAdminRequest`.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Kiểm tra nếu route cần bảo vệ quyền Admin
  if (pathname.startsWith('/admin')) {
    const sessionCookie = request.cookies.get('__session')?.value;

    if (!sessionCookie) {
      return NextResponse.redirect(new URL('/', request.url));
    }

    const payload = decodeJwtPayload(sessionCookie);
    if (!payload || !payload.email || !payload.exp) {
      return NextResponse.redirect(new URL('/', request.url));
    }

    // Kiểm tra hết hạn token (exp là Unix timestamp tính bằng giây)
    const isExpired = payload.exp * 1000 < Date.now();
    if (isExpired) {
      return NextResponse.redirect(new URL('/', request.url));
    }

    // Kiểm tra email có nằm trong danh sách ADMIN_EMAILS
    const email = payload.email.toLowerCase();
    const isAdmin = ADMIN_EMAILS.length > 0 && ADMIN_EMAILS.includes(email);
    if (!isAdmin) {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
