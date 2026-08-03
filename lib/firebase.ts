'use client';

import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
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

export async function loginWithGoogle(): Promise<User | null> {
  if (!auth) {
    throw new Error('Firebase chưa được định cấu hình. Vui lòng kiểm tra file biến môi trường (API Key, Project ID).');
  }
  const provider = new GoogleAuthProvider();
  const res = await signInWithPopup(auth, provider);
  return res.user;
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
export type { User };
