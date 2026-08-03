'use client';

import React, { useEffect } from 'react';

/** Error boundary toàn app (Next.js error convention). Chỉ bắt lỗi ngoài dự kiến — lỗi MongoDB đã tự fallback về seed data trong `lib/db.ts` nên không throw tới đây. */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Unhandled app route error:', error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[450px] space-y-4 text-center px-4">
      <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center font-bold text-xl">
        !
      </div>
      <h2 className="text-xl font-bold text-slate-100">Đã xảy ra lỗi không mong muốn</h2>
      <p className="text-xs sm:text-sm text-slate-400 max-w-md">
        Hệ thống tạm thời gặp sự cố trong quá trình xử lý yêu cầu. Vui lòng thử lại hoặc tải lại trang.
      </p>
      <button
        type="button"
        onClick={() => reset()}
        className="px-5 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs transition-all shadow-md cursor-pointer"
      >
        Thử lại
      </button>
    </div>
  );
}
