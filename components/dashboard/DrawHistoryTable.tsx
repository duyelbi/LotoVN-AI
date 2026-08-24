import React, { Suspense } from 'react';
import { LotteryType, TimeRange } from '@/lib/types';
import { getDraws } from '@/lib/db';
import { Skeleton } from '@/components/ui/skeleton';
import { History } from 'lucide-react';

import { DrawHistoryClient } from './DrawHistoryClient';

interface DrawHistoryTableProps {
  lotteryType: LotteryType;
  range: TimeRange;
}

/** Skeleton hiển thị trong lúc lịch sử quay thưởng đang fetch dữ liệu. */
function DrawHistorySkeleton() {
  return (
    <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-5 sm:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-6 w-48 bg-slate-800" />
        <Skeleton className="h-9 w-64 bg-slate-800 rounded-lg" />
      </div>
      <div className="space-y-3 h-[400px]">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-14 w-full rounded-xl bg-slate-800" />
        ))}
      </div>
    </div>
  );
}

/** Fetch danh sách kỳ quay rồi render bảng (desktop) / card list (mobile). */
async function DrawHistoryTableContent({ lotteryType, range }: DrawHistoryTableProps) {
  const draws = await getDraws(lotteryType, range);

  return (
    <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-5 sm:p-6 space-y-4">
      {/* We pass the draws and range to Client Component to render the title, search box and table */}
      <DrawHistoryClient draws={draws} range={range} />
    </div>
  );
}

/**
 * Bảng lịch sử quay thưởng trên Dashboard (bảng ở desktop, card list ở mobile).
 * Tự fetch dữ liệu và tự bọc Suspense/Skeleton — page.tsx chỉ cần render
 * `<DrawHistoryTable lotteryType={...} range={...} />`.
 */
export function DrawHistoryTable({ lotteryType, range }: DrawHistoryTableProps) {
  return (
    <Suspense key={`${lotteryType}-${range}`} fallback={<DrawHistorySkeleton />}>
      <DrawHistoryTableContent lotteryType={lotteryType} range={range} />
    </Suspense>
  );
}
