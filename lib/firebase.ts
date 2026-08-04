'use client';

import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  setPersistence,
  browserLocalPersistence,
  GoogleAuthProvider,
  signInWithCredential,
  signInWithPopup,
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

export const GOOGLE_CLIENT_ID =
  process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
  '308915299258-ujkjfst5hknnh0g13ies9cu59cdl2pc0.apps.googleusercontent.com';

export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey && firebaseConfig.apiKey.length > 5 && firebaseConfig.projectId
);

const app = isFirebaseConfigured
  ? !getApps().length
    ? initializeApp(firebaseConfig)
    : getApp()
  : null;

export const auth = app ? getAuth(app) : null;

/** Lỗi IndexedDB thoáng qua đã biết của Firebase JS SDK. */
function isTransientStorageError(err: any): boolean {
  const message = String(err?.message || '');
  const code = String(err?.code || '');
  return (
    err?.name === 'InvalidStateError' ||
    /database (connection )?is closing/i.test(message) ||
    /hidden/i.test(message) ||
    (code === 'auth/internal-error' && /database/i.test(message))
  );
}

export class TransientStorageError extends Error {
  constructor() {
    super('Trình duyệt gặp sự cố tạm thời khi lưu phiên đăng nhập.');
    this.name = 'TransientStorageError';
  }
}

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
 * Đăng nhập Google bằng Google Identity Services ID Token (One Tap / GIS Button).
 * Không mở tab mới, không mở popup, xác thực tức thì trong màn hình hiện tại.
 */
export async function loginWithGoogleCredential(idToken: string): Promise<User | null> {
  if (!auth) {
    throw new Error('Firebase chưa được định cấu hình.');
  }
  try {
    await setPersistence(auth, browserLocalPersistence);
  } catch (e) {
    console.warn('LotoVN AI: setPersistence warning', e);
  }

  try {
    const credential = GoogleAuthProvider.credential(idToken);
    const res = await signInWithCredential(auth, credential);
    return res.user;
  } catch (err: any) {
    console.error('LotoVN AI: loginWithGoogleCredential error ->', err);
    if (err?.code === 'auth/account-exists-with-different-credential') {
      const email: string | undefined = err.customData?.email;
      const pendingCredential = GoogleAuthProvider.credential(idToken);
      if (email) {
        throw new GoogleAccountLinkRequiredError(email, pendingCredential);
      }
    }
    throw err;
  }
}

/**
 * Đăng nhập Google tổng hợp: Đặt persistence về localStorage để không bị lỗi IndexedDB,
 * mở Popup đăng nhập Google và trả về User trực tiếp.
 */
export async function loginWithGoogle(): Promise<User | null> {
  if (!auth) {
    throw new Error('Firebase chưa được định cấu hình. Vui lòng kiểm tra file biến môi trường.');
  }
  try {
    await setPersistence(auth, browserLocalPersistence);
  } catch (e) {
    console.warn('LotoVN AI: setPersistence warning', e);
  }

  const provider = new GoogleAuthProvider();
  try {
    const res = await signInWithPopup(auth, provider);
    return res.user;
  } catch (err: any) {
    console.error('LotoVN AI: loginWithGoogle error ->', err);
    if (err?.code === 'auth/account-exists-with-different-credential') {
      const email: string | undefined = err.customData?.email;
      const pendingCredential = GoogleAuthProvider.credentialFromError(err);
      if (email && pendingCredential) {
        throw new GoogleAccountLinkRequiredError(email, pendingCredential);
      }
    }
    if (err?.code === 'auth/popup-closed-by-user') {
      throw new Error('Bạn đã đóng cửa sổ đăng nhập Google.');
    }
    if (err?.code === 'auth/popup-blocked') {
      // Nếu popup bị trình duyệt chặn hoàn toàn, chuyển hướng redirect
      await signInWithRedirect(auth, provider);
      return null;
    }
    if (isTransientStorageError(err)) {
      throw new TransientStorageError();
    }
    throw err;
  }
}

export async function loginWithGoogleRedirect(): Promise<void> {
  if (!auth) {
    throw new Error('Firebase chưa được định cấu hình.');
  }
  const provider = new GoogleAuthProvider();
  await signInWithRedirect(auth, provider);
}

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
    return null;
  }
}

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
  try {
    await setPersistence(auth, browserLocalPersistence);
  } catch (e) {
    // ignore
  }
  const res = await signInWithEmailAndPassword(auth, email, pass);
  return res.user;
}

export async function registerWithEmail(email: string, pass: string): Promise<User | null> {
  if (!auth) {
    throw new Error('Firebase chưa được định cấu hình.');
  }
  try {
    await setPersistence(auth, browserLocalPersistence);
  } catch (e) {
    // ignore
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
