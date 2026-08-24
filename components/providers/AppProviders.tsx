'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Toaster, toast } from 'sonner';
import { LotteryType } from '@/lib/types';
import {
  auth,
  onAuthStateChanged,
  logOut,
  consumeGoogleRedirectResult,
  GoogleAccountLinkRequiredError,
  TransientStorageError,
  User,
  AuthCredential,
} from '@/lib/firebase';

import { AuthModal } from '@/components/AuthModal';

interface AppStateContextType {
  user: User | null;
  isAdmin: boolean;
  authLoading: boolean;
  favoriteNumbers: number[];
  toggleFavorite: (num: number, lotteryType: LotteryType) => void;
  isAuthModalOpen: boolean;
  openAuthModal: () => void;
  closeAuthModal: () => void;
  handleLogout: () => Promise<void>;
  loadFavoritesForLottery: (type: LotteryType) => void;
  pendingGoogleLink: { email: string; credential: AuthCredential } | null;
  clearPendingGoogleLink: () => void;
}

const AppStateContext = createContext<AppStateContextType | undefined>(undefined);

/**
 * Context provider bọc toàn bộ app trong `app/layout.tsx`, giữ state client-only
 * xuyên suốt các route: user Firebase, trạng thái admin (xác minh server-side qua /api/admin/check),
 * danh sách số yêu thích (localStorage), trạng thái mở AuthModal, và toast Sonner.
 */
export function AppProviders({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [activeLotteryType, setActiveLotteryType] = useState<LotteryType>('mega645');
  const [pendingGoogleLink, setPendingGoogleLink] = useState<{ email: string; credential: AuthCredential } | null>(null);

  // Lazy state initialization for favorite numbers from localStorage
  const [favoriteNumbers, setFavoriteNumbers] = useState<number[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const saved = localStorage.getItem(`lotovn_fav_mega645`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Subscribe to Firebase auth changes & sync __session cookie for Next.js Middleware
  useEffect(() => {
    if (!auth) {
      console.warn('LotoVN AI: Firebase Auth chưa khởi tạo (kiểm tra NEXT_PUBLIC_FIREBASE_* trong .env.local).');
      setAuthLoading(false);
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, async (current) => {
      console.log('LotoVN AI: Firebase Auth State Changed ->', current?.email || 'Chưa đăng nhập');
      setUser(current);
      if (current) {
        try {
          const idToken = await current.getIdToken();
          document.cookie = `__session=${idToken}; path=/; max-age=3600; SameSite=Lax`;
          const res = await fetch('/api/admin/check', {
            headers: { Authorization: `Bearer ${idToken}` },
          });
          const json = await res.json();
          setIsAdmin(Boolean(json.isAdmin));
        } catch (e) {
          console.warn('LotoVN AI: Admin check error', e);
          setIsAdmin(false);
        }
      } else {
        document.cookie = '__session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax';
        setIsAdmin(false);
      }
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Lấy kết quả đăng nhập Google sau khi `signInWithRedirect` điều hướng quay lại trang.
  // Chỉ chạy 1 lần khi app khởi động — `getRedirectResult` tự trả `null` nếu không có
  // redirect Google nào đang chờ xử lý (tải trang bình thường).
  useEffect(() => {
    if (!auth) return;
    consumeGoogleRedirectResult()
      .then((redirectedUser) => {
        if (redirectedUser) {
          toast.success('Đăng nhập Google thành công!');
        }
      })
      .catch((err: any) => {
        if (err instanceof GoogleAccountLinkRequiredError) {
          setPendingGoogleLink({ email: err.email, credential: err.pendingCredential });
          setIsAuthModalOpen(true);
        } else if (err instanceof TransientStorageError) {
          toast.error('Trình duyệt gặp sự cố tạm thời khi đăng nhập Google. Vui lòng thử lại.');
        } else {
          toast.error(err?.message || 'Đăng nhập Google thất bại.');
        }
      });
  }, []);

  const loadFavoritesForLottery = useCallback((type: LotteryType) => {
    setActiveLotteryType(type);
    try {
      const saved = localStorage.getItem(`lotovn_fav_${type}`);
      setFavoriteNumbers(saved ? JSON.parse(saved) : []);
    } catch (e) {
      console.warn('Cannot read favorites from localStorage', e);
    }
  }, []);

  const toggleFavorite = useCallback((num: number, lotteryType: LotteryType) => {
    setFavoriteNumbers((prev) => {
      const exists = prev.includes(num);
      const updated = exists ? prev.filter((x) => x !== num) : [...prev, num];
      try {
        localStorage.setItem(`lotovn_fav_${lotteryType}`, JSON.stringify(updated));
      } catch (e) {
        // ignore
      }
      return updated;
    });
  }, []);

  const openAuthModal = useCallback(() => setIsAuthModalOpen(true), []);
  const closeAuthModal = useCallback(() => setIsAuthModalOpen(false), []);
  const clearPendingGoogleLink = useCallback(() => setPendingGoogleLink(null), []);

  const handleLogout = useCallback(async () => {
    await logOut();
    document.cookie = '__session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax';
    setUser(null);
    setIsAdmin(false);
  }, []);

  return (
    <AppStateContext.Provider
      value={{
        user,
        isAdmin,
        authLoading,
        favoriteNumbers,
        toggleFavorite,
        isAuthModalOpen,
        openAuthModal,
        closeAuthModal,
        handleLogout,
        loadFavoritesForLottery,
        pendingGoogleLink,
        clearPendingGoogleLink,
      }}
    >
      <Toaster position="top-right" richColors theme="dark" />
      {children}
      {isAuthModalOpen && (
        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={closeAuthModal}
          onSuccess={() => {}}
          pendingGoogleLink={pendingGoogleLink}
          onLinkConsumed={clearPendingGoogleLink}
        />
      )}
    </AppStateContext.Provider>
  );
}

/** Hook đọc `AppStateContext`. Phải gọi bên trong `AppProviders` (đã bọc sẵn ở root layout). */
export function useAppState() {
  const context = useContext(AppStateContext);
  if (!context) {
    throw new Error('useAppState must be used within an AppProviders');
  }
  return context;
}
