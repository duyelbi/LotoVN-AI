import { getApps, initializeApp, App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

// Trên Cloud Run, initializeApp() không tham số tự dùng Application Default
// Credentials từ service account đã gắn sẵn — không cần key JSON riêng.
// Ở local dev cần chạy `gcloud auth application-default login` một lần
// (xem AGENTS.md, phần "Trang Admin").
let adminApp: App | null = null;
function getAdminApp(): App {
  if (!adminApp) {
    adminApp =
      getApps().length > 0
        ? getApps()[0]
        : initializeApp({ projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID });
  }
  return adminApp;
}

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || '')
  .split(',')
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

interface AdminCheckResult {
  isAdmin: boolean;
  email?: string;
}

/**
 * Verify Firebase ID token (header `Authorization: Bearer` hoặc cookie `__session`)
 * và kiểm tra email có nằm trong `ADMIN_EMAILS`. Đây là ranh giới bảo mật thật —
 * Edge `proxy.ts` chỉ decode JWT để chặn sớm UI, không verify chữ ký.
 */
export async function verifyAdminIdToken(idToken: string | null | undefined): Promise<AdminCheckResult> {
  if (!idToken || ADMIN_EMAILS.length === 0) {
    return { isAdmin: false };
  }

  try {
    const decoded = await getAuth(getAdminApp()).verifyIdToken(idToken);
    const email = decoded.email?.toLowerCase();
    return { isAdmin: Boolean(email && ADMIN_EMAILS.includes(email)), email };
  } catch (error) {
    console.warn('verifyAdminIdToken: invalid ID token', error);
    return { isAdmin: false };
  }
}

export async function verifyAdminRequest(req: Request): Promise<AdminCheckResult> {
  const authHeader = req.headers.get('authorization');
  const idToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
  return verifyAdminIdToken(idToken);
}
