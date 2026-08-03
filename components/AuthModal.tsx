'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  loginWithGoogle,
  loginWithGoogleRedirect,
  loginWithEmail,
  registerWithEmail,
  linkPendingGoogleCredential,
  TransientStorageError,
  GoogleAccountLinkRequiredError,
  isFirebaseConfigured,
  AuthCredential,
  User,
} from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Shield, Lock, Mail, AlertCircle, Sparkles, Link2 } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  /** Set bởi `AppProviders` khi `signInWithRedirect` quay lại với `auth/account-exists-with-different-credential`. */
  pendingGoogleLink?: { email: string; credential: AuthCredential } | null;
  onLinkConsumed?: () => void;
}

/**
 * Modal đăng nhập/đăng ký tuỳ chọn (Firebase Email/Password + Google).
 * Nếu tài khoản là Admin (`ADMIN_EMAILS`), tự động điều hướng tới `/admin`.
 */
export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  pendingGoogleLink,
  onLinkConsumed,
}) => {
  const router = useRouter();
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (pendingGoogleLink) {
      setEmail(pendingGoogleLink.email);
      setIsRegistering(false);
    }
  }, [pendingGoogleLink]);

  const linkNotice = pendingGoogleLink
    ? `Email ${pendingGoogleLink.email} đã đăng ký bằng mật khẩu. Đăng nhập bằng mật khẩu bên dưới để tự động liên kết tài khoản Google.`
    : null;

  const checkAdminAndRedirect = async (loggedUser: User) => {
    try {
      const idToken = await loggedUser.getIdToken();
      const res = await fetch('/api/admin/check', {
        headers: { Authorization: `Bearer ${idToken}` },
      });
      const json = await res.json();
      if (json.isAdmin) {
        toast.success('Xin chào Admin! Đang chuyển hướng tới trang Quản trị...');
        router.push('/admin');
        return true;
      }
    } catch {
      // ignore
    }
    return false;
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      let user: User | null = null;
      if (isRegistering) {
        user = await registerWithEmail(email, password);
      } else {
        user = await loginWithEmail(email, password);
      }
      if (pendingGoogleLink) {
        await linkPendingGoogleCredential(pendingGoogleLink.credential);
        onLinkConsumed?.();
        toast.success('Đã liên kết tài khoản Google — lần sau có thể đăng nhập bằng cả 2 cách.');
      }
      if (user) {
        const isAdmin = await checkAdminAndRedirect(user);
        if (!isAdmin) {
          toast.success(`Đăng nhập thành công! Xin chào ${user.displayName || user.email}`);
        }
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      if (err.code === 'auth/email-already-in-use') {
        setError('Email này đã được đăng ký — có thể bạn đã từng đăng nhập bằng Google. Thử "Tiếp tục với Google" ở trên.');
      } else {
        setError(
          err.message || 'Không thể đăng nhập. Vui lòng kiểm tra email/mật khẩu hoặc định cấu hình Firebase.'
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError(null);
    setLoading(true);
    const toastId = toast.loading('Đang mở trang đăng nhập Google...');
    try {
      const user = await loginWithGoogle();
      toast.dismiss(toastId);
      if (user) {
        const isAdmin = await checkAdminAndRedirect(user);
        if (!isAdmin) {
          toast.success(`Đăng nhập Google thành công! Xin chào ${user.displayName || user.email}`);
        }
        onSuccess();
        onClose();
      }
    } catch (err: any) {
      toast.dismiss(toastId);
      if (err instanceof GoogleAccountLinkRequiredError) {
        setError(err.message);
      } else if (err instanceof TransientStorageError) {
        setError('Trình duyệt gặp sự cố tạm thời. Đang tải lại trang, vui lòng thử lại...');
        setTimeout(() => window.location.reload(), 1500);
      } else {
        setError(err.message || 'Không thể đăng nhập bằng Google.');
      }
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-0 overflow-hidden text-slate-100">
        {/* Header */}
        <DialogHeader className="p-6 border-b border-slate-800/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-500/20 text-teal-400 flex items-center justify-center font-bold text-sm">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-slate-100">
                {isRegistering ? 'Đăng Ký Tài Khoản Tùy Chọn' : 'Đăng Nhập Tùy Chọn'}
              </DialogTitle>
              <p className="text-xs text-slate-400">Lưu số yêu thích và theo dõi trên nhiều thiết bị</p>
            </div>
          </div>
        </DialogHeader>

        {/* Disclaimer box */}
        <div className="bg-teal-500/10 border-b border-teal-500/20 px-6 py-3 flex items-start gap-2.5">
          <Shield className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
          <p className="text-xs text-slate-300 leading-relaxed">
            <strong className="text-teal-300">Hoàn toàn tùy chọn:</strong> LotoVN AI cho phép bạn sử dụng đầy đủ 100% chức năng thống kê và trợ lý AI mà không cần đăng nhập.
          </p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {!isFirebaseConfigured && (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 flex items-start gap-2.5 text-xs text-amber-300">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <strong>Chế độ Không Cần Đăng Nhập:</strong> Firebase API Key chưa được cài đặt trong biến môi trường. Bạn vẫn có thể trải nghiệm toàn bộ tính năng và dữ liệu ngay lập tức!
              </div>
            </div>
          )}

          {linkNotice && (
            <div className="bg-teal-500/10 border border-teal-500/30 rounded-xl p-3 flex items-start gap-2.5 text-xs text-teal-300">
              <Link2 className="w-4 h-4 shrink-0 mt-0.5" />
              <div>{linkNotice}</div>
            </div>
          )}

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-xs text-red-300">
              {error}
            </div>
          )}

          {/* Google Sign-in */}
          <Button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading || !isFirebaseConfigured}
            className="w-full flex items-center justify-center gap-2.5 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700/80 text-slate-200 font-medium text-sm border border-slate-700 transition-all disabled:opacity-50 h-auto"
          >
            <Sparkles className="w-4 h-4 text-teal-400" />
            <span>Tiếp tục với Google</span>
          </Button>

          <div className="flex items-center gap-3 my-2">
            <div className="h-px bg-slate-800 flex-1" />
            <span className="text-xs text-slate-500 uppercase font-medium">hoặc email</span>
            <div className="h-px bg-slate-800 flex-1" />
          </div>

          {/* Email / Password Form */}
          <form onSubmit={handleEmailSubmit} className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Email
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-teal-500/50"
                />
                <Mail className="w-4 h-4 text-slate-500 absolute right-3.5 top-2.5" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Mật khẩu
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-teal-500/50"
              />
            </div>

            <Button
              type="submit"
              disabled={loading || !isFirebaseConfigured}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-teal-500 to-indigo-600 hover:from-teal-400 hover:to-indigo-500 text-slate-950 font-bold text-sm shadow-md transition-all disabled:opacity-50 h-auto border-0"
            >
              {loading
                ? 'Đang xử lý...'
                : isRegistering
                ? 'Đăng ký tài khoản'
                : 'Đăng nhập'}
            </Button>
          </form>

          {/* Switch Register/Login */}
          <div className="text-center pt-2">
            <button
              type="button"
              onClick={() => {
                setIsRegistering(!isRegistering);
                setError(null);
              }}
              className="text-xs text-slate-400 hover:text-teal-400 underline transition-colors"
            >
              {isRegistering
                ? 'Đã có tài khoản? Đăng nhập ngay'
                : 'Chưa có tài khoản? Đăng ký mới'}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
