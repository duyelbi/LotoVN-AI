import React from 'react';
import Link from 'next/link';

/** Trang 404 (Next.js not-found convention) — hiện khi route không khớp. */
export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[450px] space-y-4 text-center px-4">
      <div className="text-5xl font-black text-teal-400">404</div>
      <h2 className="text-xl font-bold text-slate-100">Không tìm thấy trang</h2>
      <p className="text-xs sm:text-sm text-slate-400 max-w-md">
        Trang bạn đang truy cập không tồn tại hoặc đã được di chuyển.
      </p>
      <Link
        href="/"
        className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-teal-300 border border-slate-800 font-semibold text-xs transition-all cursor-pointer"
      >
        Về trang chủ Thống kê
      </Link>
    </div>
  );
}
