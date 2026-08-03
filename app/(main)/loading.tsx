import React from 'react';

export default function Loading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[450px] space-y-3">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-teal-500" />
      <p className="text-sm font-medium text-slate-400">Đang tải dữ liệu thống kê xổ số...</p>
    </div>
  );
}
