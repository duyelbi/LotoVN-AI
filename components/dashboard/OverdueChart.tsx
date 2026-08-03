import React, { Suspense } from 'react';
import { LotteryType, TimeRange } from '@/lib/types';
import { getLotteryStats } from '@/lib/db';
import { Skeleton } from '@/components/ui/skeleton';
import { OverdueChartClient } from './OverdueChartClient';

interface OverdueChartProps {
  lotteryType: LotteryType;
  range: TimeRange;
}

/** Skeleton hiển thị trong lúc biểu đồ cao/thấp đang fetch dữ liệu. */
function OverdueChartSkeleton() {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 h-72 flex flex-col justify-between">
      <Skeleton className="h-5 w-56 bg-slate-800" />
      <Skeleton className="h-44 w-full rounded-xl bg-slate-800" />
    </div>
  );
}

/** Fetch số liệu cao/thấp rồi giao cho `OverdueChartClient` (Recharts) vẽ biểu đồ. */
async function OverdueChartContent({ lotteryType, range }: OverdueChartProps) {
  const stats = await getLotteryStats(lotteryType, range);
  return <OverdueChartClient highLow={stats.highLow} lotteryType={lotteryType} range={range} />;
}

/**
 * Biểu đồ phân bố tỷ lệ Cao/Thấp trên Dashboard. Tự fetch dữ liệu và tự bọc
 * Suspense/Skeleton — page.tsx chỉ cần render `<OverdueChart lotteryType={...} range={...} />`.
 */
export function OverdueChart(props: OverdueChartProps) {
  return (
    <Suspense fallback={<OverdueChartSkeleton />}>
      <OverdueChartContent {...props} />
    </Suspense>
  );
}
