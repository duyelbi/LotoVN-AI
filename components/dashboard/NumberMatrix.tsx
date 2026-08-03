import React, { Suspense } from 'react';
import { LotteryType, TimeRange } from '@/lib/types';
import { getLotteryStats } from '@/lib/db';
import { Skeleton } from '@/components/ui/skeleton';
import { NumberMatrixGrid } from './NumberMatrixGrid';

interface NumberMatrixProps {
  lotteryType: LotteryType;
  range: TimeRange;
}

/** Skeleton hiển thị trong lúc bảng tần suất chi tiết đang fetch dữ liệu. */
function NumberMatrixSkeleton() {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-5">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <Skeleton className="h-6 w-64 bg-slate-800" />
        <Skeleton className="h-8 w-36 rounded-xl bg-slate-800" />
      </div>
      <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-9 gap-3">
        {Array.from({ length: 18 }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-xl bg-slate-800" />
        ))}
      </div>
    </div>
  );
}

/** Fetch toàn bộ numberStats rồi giao cho `NumberMatrixGrid` (Client) xử lý phần search/filter/favorite. */
async function NumberMatrixContent({ lotteryType, range }: NumberMatrixProps) {
  const stats = await getLotteryStats(lotteryType, range);
  return <NumberMatrixGrid numberStats={stats.numberStats} lotteryType={lotteryType} />;
}

/**
 * Bảng tần suất chi tiết toàn bộ các con số trên Dashboard. Tự fetch dữ liệu và tự
 * bọc Suspense/Skeleton — page.tsx chỉ cần render `<NumberMatrix lotteryType={...} range={...} />`.
 */
export function NumberMatrix(props: NumberMatrixProps) {
  return (
    <Suspense fallback={<NumberMatrixSkeleton />}>
      <NumberMatrixContent {...props} />
    </Suspense>
  );
}
