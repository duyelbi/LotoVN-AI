'use client';

import React, { useState } from 'react';
import {
  loginWithGoogle,
  loginWithEmail,
  registerWithEmail,
  isFirebaseConfigured,
} from '@/lib/firebase';
import { X, Shield, Lock, Mail, AlertCircle, Sparkles } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (isRegistering) {
        await registerWithEmail(email, password);
      } else {
        await loginWithEmail(email, password);
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(
        err.message || 'Không thể đăng nhập. Vui lòng kiểm tra email/mật khẩu hoặc định cấu hình Firebase.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError(null);
    setLoading(true);
    try {
      await loginWithGoogle();
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Đăng nhập Google thất bại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-500/20 text-teal-400 flex items-center justify-center font-bold text-sm">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100">
                {isRegistering ? 'Đăng Ký Tài Khoản Tùy Chọn' : 'Đăng Nhập Tùy Chọn'}
              </h3>
              <p className="text-xs text-slate-400">Lưu số yêu thích và theo dõi trên nhiều thiết bị</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

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

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-xs text-red-300">
              {error}
            </div>
          )}

          {/* Google Sign-in */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading || !isFirebaseConfigured}
            className="w-full flex items-center justify-center gap-2.5 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700/80 text-slate-200 font-medium text-sm border border-slate-700 transition-all disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4 text-teal-400" />
            <span>Tiếp tục với Google</span>
          </button>

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

            <button
              type="submit"
              disabled={loading || !isFirebaseConfigured}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-teal-500 to-indigo-600 hover:from-teal-400 hover:to-indigo-500 text-slate-950 font-bold text-sm shadow-md transition-all disabled:opacity-50"
            >
              {loading
                ? 'Đang xử lý...'
                : isRegistering
                ? 'Đăng ký tài khoản'
                : 'Đăng nhập'}
            </button>
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
      </div>
    </div>
  );
};
