'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { LotteryType } from '@/lib/types';
import { useAppState } from '@/components/providers/AppProviders';
import {
  BarChart2,
  Sparkles,
  MessageSquare,
  BookOpen,
  User as UserIcon,
  LogOut,
  LogIn,
  ShieldCheck,
} from 'lucide-react';

export type NavTab = 'dashboard' | 'suggestions' | 'chat' | 'education';

/**
 * Header toàn app: logo, điều hướng 4 route chính (desktop: hàng tab + bottom bar
 * trên mobile), bộ chuyển Mega/Power, và khu vực đăng nhập. Active tab suy ra từ
 * `usePathname()`, lottery đang chọn suy ra từ `?type=` — không giữ state riêng.
 */
export const Navbar: React.FC = () => {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user, openAuthModal, handleLogout } = useAppState();

  const typeParam = searchParams.get('type');
  const selectedLottery: LotteryType = typeParam === 'power655' ? 'power655' : 'mega645';

  const getActiveTab = (): NavTab => {
    if (pathname.startsWith('/suggestions')) return 'suggestions';
    if (pathname.startsWith('/chat')) return 'chat';
    if (pathname.startsWith('/education')) return 'education';
    return 'dashboard';
  };

  const activeTab = getActiveTab();

  const tabs: {
    id: NavTab;
    path: string;
    label: string;
    shortLabel: string;
    icon: React.ReactNode;
    desc: string;
  }[] = [
    {
      id: 'dashboard',
      path: '/',
      label: 'Thống Kê & Tần Suất',
      shortLabel: 'Thống Kê',
      icon: <BarChart2 className="w-4 h-4" />,
      desc: 'Bảng tần suất, số nóng/gan, phân bố chẵn lẻ',
    },
    {
      id: 'suggestions',
      path: '/suggestions',
      label: 'Bộ Gợi Ý & Kiểm Chứng',
      shortLabel: 'Gợi Ý',
      icon: <Sparkles className="w-4 h-4 text-teal-400" />,
      desc: 'Gợi ý cân bằng & kiểm chứng tỷ lệ trúng thực tế',
    },
    {
      id: 'chat',
      path: '/chat',
      label: 'Trợ Lý AI Thống Kê',
      shortLabel: 'Trợ Lý AI',
      icon: <MessageSquare className="w-4 h-4 text-indigo-400" />,
      desc: 'Hỏi đáp thống kê bằng tiếng Việt tự nhiên',
    },
    {
      id: 'education',
      path: '/education',
      label: 'Học Xác Suất & Minh Bạch',
      shortLabel: 'Học Tập',
      icon: <BookOpen className="w-4 h-4 text-sky-400" />,
      desc: 'Hiểu đúng sự kiện độc lập & ngụy biện cờ bạc',
    },
  ];

  const buildLinkWithLottery = (basePath: string) => {
    return selectedLottery === 'power655' ? `${basePath}?type=power655` : basePath;
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-slate-950/90 border-b border-slate-800/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-between py-2.5 sm:py-0 sm:h-16 gap-3">
            {/* Logo & Brand */}
            <Link href={buildLinkWithLottery('/')} className="flex items-center gap-3 group">
              <img
                src="/logo.png"
                alt="LotoVN AI"
                className="w-9 h-9 rounded-xl shadow-md shadow-teal-500/20 shrink-0 object-cover group-hover:scale-105 transition-transform"
              />
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-100 text-lg tracking-tight group-hover:text-teal-300 transition-colors">
                    LotoVN <span className="text-teal-400 font-extrabold">AI</span>
                  </span>
                  <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-900 border border-slate-800 text-slate-400">
                    <ShieldCheck className="w-3 h-3 text-teal-400" />
                    Minh Bạch Dữ Liệu
                  </span>
                </div>
                <p className="text-xs text-slate-500 hidden md:block">
                  Thống kê học thuật & giáo dục xác suất Vietlott
                </p>
              </div>
            </Link>

            {/* Lottery Switcher for Mobile Header (< 768px) */}
            <div className="md:hidden flex items-center bg-slate-900/90 p-1 rounded-xl border border-slate-800 shrink-0">
              <Link
                href={`${pathname}?type=mega645`}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  selectedLottery === 'mega645'
                    ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Mega 6/45
              </Link>
              <Link
                href={`${pathname}?type=power655`}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  selectedLottery === 'power655'
                    ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Power 6/55
              </Link>
            </div>

            {/* User Auth (Optional Firebase Login) */}
            <div className="flex items-center gap-2 shrink-0">
              {user ? (
                <div className="flex items-center gap-2">
                  <div
                    className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300"
                    title={user.email || 'Tài khoản người dùng'}
                  >
                    {user.photoURL ? (
                      <img
                        src={user.photoURL}
                        alt="avatar"
                        className="w-5 h-5 rounded-full object-cover"
                      />
                    ) : (
                      <UserIcon className="w-3.5 h-3.5 text-teal-400" />
                    )}
                    <span className="hidden sm:inline truncate max-w-[120px]">
                      {user.displayName || user.email?.split('@')[0]}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent hover:border-slate-800 transition-colors cursor-pointer"
                    title="Đăng xuất"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={openAuthModal}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800/80 text-slate-300 hover:text-slate-100 border border-slate-800 text-xs font-medium transition-all cursor-pointer"
                >
                  <LogIn className="w-3.5 h-3.5 text-teal-400" />
                  <span>Đăng nhập</span>
                  <span className="hidden sm:inline text-slate-500">(tùy chọn)</span>
                </button>
              )}
            </div>
          </div>

          {/* Desktop Navigation Row 2 (>= 768px): Tabs + Lottery Switcher, wraps as one flow */}
          <nav className="hidden md:flex w-full items-center flex-wrap gap-2 py-2 border-t border-slate-800/50">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <Link
                  key={tab.id}
                  href={buildLinkWithLottery(tab.path)}
                  className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl transition-all whitespace-nowrap shrink-0 cursor-pointer select-none ${
                    isActive
                      ? 'bg-slate-900 text-teal-300 border border-slate-700/80 shadow-sm shadow-teal-500/10'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50 border border-transparent'
                  }`}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                </Link>
              );
            })}

            {/* Lottery Switcher for Desktop Header — pushed to the end of its line, wraps to its own line if no room */}
            <div className="flex items-center bg-slate-900/90 p-1 rounded-xl border border-slate-800 shrink-0 ml-auto">
              <Link
                href={`${pathname}?type=mega645`}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  selectedLottery === 'mega645'
                    ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Mega 6/45
              </Link>
              <Link
                href={`${pathname}?type=power655`}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  selectedLottery === 'power655'
                    ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Power 6/55
              </Link>
            </div>
          </nav>
        </div>
      </header>

      {/* Mobile Fixed Bottom Navigation Bar (< 768px) */}
      <nav
        aria-label="Mobile Bottom Navigation"
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-slate-950/95 border-t border-slate-800/90 backdrop-blur-lg px-2 py-1.5 shadow-xl"
      >
        <div className="grid grid-cols-4 gap-1 max-w-md mx-auto">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <Link
                key={tab.id}
                href={buildLinkWithLottery(tab.path)}
                className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all cursor-pointer select-none ${
                  isActive
                    ? 'bg-slate-900/90 text-teal-300 border border-slate-800 shadow-sm shadow-teal-500/10'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40 border border-transparent'
                }`}
              >
                <div className={`${isActive ? 'scale-110 text-teal-300' : ''} transition-transform`}>
                  {tab.icon}
                </div>
                <span
                  className={`text-[11px] font-semibold tracking-tight mt-1 truncate max-w-full ${
                    isActive ? 'text-teal-300' : 'text-slate-400'
                  }`}
                >
                  {tab.shortLabel}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
};
