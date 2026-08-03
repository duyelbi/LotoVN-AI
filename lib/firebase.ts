'use client';

import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithRedirect,
  getRedirectResult,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  linkWithCredential,
  AuthCredential,
  User,
} from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '',
};

export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey && firebaseConfig.apiKey.length > 5 && firebaseConfig.projectId
);

const app = isFirebaseConfigured
  ? !getApps().length
    ? initializeApp(firebaseConfig)
    : getApp()
  : null;

export const auth = app ? getAuth(app) : null;

/** Lỗi IndexedDB thoáng qua đã biết của Firebase JS SDK (firebase/firebase-js-sdk#2710) — thường do tab mất focus khi popup Google mở/đóng. Không có fix chính thức từ Firebase, cách xử lý cộng đồng khuyến nghị là tải lại trang sạch. */
function isTransientStorageError(err: any): boolean {
  const message = String(err?.message || '');
  return err?.name === 'InvalidStateError' || /database connection is closing/i.test(message);
}

/** Ném ra khi gặp `isTransientStorageError` — `AuthModal` bắt lỗi này để tự reload trang thay vì hiện thông báo kỹ thuật khó hiểu. */
export class TransientStorageError extends Error {
  constructor() {
    super('Trình duyệt gặp sự cố tạm thời khi lưu phiên đăng nhập.');
    this.name = 'TransientStorageError';
  }
}

/**
 * Firebase project này bật "1 tài khoản / 1 email" (không `allowDuplicateEmails`) — nếu
 * 1 email đã đăng ký bằng Email/Password rồi thử "Đăng nhập Google" với cùng email, Firebase
 * từ chối thẳng bằng lỗi `auth/account-exists-with-different-credential` thay vì tự gộp.
 * Ném lỗi này ra để `AuthModal` hướng dẫn người dùng đăng nhập lại bằng mật khẩu rồi tự
 * động liên kết Google vào tài khoản đó (xem `linkPendingGoogleCredential`).
 */
export class GoogleAccountLinkRequiredError extends Error {
  email: string;
  pendingCredential: AuthCredential;
  constructor(email: string, pendingCredential: AuthCredential) {
    super(`Email ${email} đã đăng ký bằng phương thức khác.`);
    this.name = 'GoogleAccountLinkRequiredError';
    this.email = email;
    this.pendingCredential = pendingCredential;
  }
}

/**
 * Đăng nhập Google bằng điều hướng cả trang (`signInWithRedirect`) thay vì popup —
 * popup (`signInWithPopup`) gây lỗi IndexedDB "database connection is closing" thoáng
 * qua (firebase-js-sdk#2710) khi tab mất focus lúc popup mở/đóng, gặp thật ở local.
 * Hàm này điều hướng đi luôn nên không trả về user ở đây — dùng `consumeGoogleRedirectResult`
 * ở lần tải trang kế tiếp để lấy kết quả.
 */
export async function loginWithGoogleRedirect(): Promise<void> {
  if (!auth) {
    throw new Error('Firebase chưa được định cấu hình. Vui lòng kiểm tra file biến môi trường (API Key, Project ID).');
  }
  const provider = new GoogleAuthProvider();
  try {
    await signInWithRedirect(auth, provider);
  } catch (err: any) {
    if (isTransientStorageError(err)) {
      throw new TransientStorageError();
    }
    throw err;
  }
}

/**
 * Gọi 1 lần khi app khởi động (`AppProviders`) để lấy kết quả sau khi
 * `signInWithRedirect` điều hướng quay lại. Trả về `null` nếu không có redirect
 * Google nào đang chờ xử lý (tải trang bình thường, không phải quay về từ Google).
 */
export async function consumeGoogleRedirectResult(): Promise<User | null> {
  if (!auth) return null;
  try {
    const res = await getRedirectResult(auth);
    return res?.user ?? null;
  } catch (err: any) {
    if (err?.code === 'auth/account-exists-with-different-credential') {
      const email: string | undefined = err.customData?.email;
      const pendingCredential = GoogleAuthProvider.credentialFromError(err);
      if (email && pendingCredential) {
        throw new GoogleAccountLinkRequiredError(email, pendingCredential);
      }
    }
    if (isTransientStorageError(err)) {
      throw new TransientStorageError();
    }
    throw err;
  }
}

/** Liên kết credential Google đang chờ (từ `GoogleAccountLinkRequiredError`) vào user vừa đăng nhập bằng email/mật khẩu — sau đó có thể đăng nhập bằng cả 2 cách. */
export async function linkPendingGoogleCredential(pendingCredential: AuthCredential): Promise<void> {
  if (!auth?.currentUser) {
    throw new Error('Cần đăng nhập trước khi liên kết tài khoản Google.');
  }
  await linkWithCredential(auth.currentUser, pendingCredential);
}

export async function loginWithEmail(email: string, pass: string): Promise<User | null> {
  if (!auth) {
    throw new Error('Firebase chưa được định cấu hình.');
  }
  const res = await signInWithEmailAndPassword(auth, email, pass);
  return res.user;
}

export async function registerWithEmail(email: string, pass: string): Promise<User | null> {
  if (!auth) {
    throw new Error('Firebase chưa được định cấu hình.');
  }
  const res = await createUserWithEmailAndPassword(auth, email, pass);
  return res.user;
}

export async function logOut(): Promise<void> {
  if (!auth) return;
  await firebaseSignOut(auth);
}

export { onAuthStateChanged };
export type { User, AuthCredential };
