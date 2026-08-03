import React, { Suspense } from 'react';
import { LotteryType, TimeRange } from '@/lib/types';
import { getLotteryStats } from '@/lib/db';
import { Skeleton } from '@/components/ui/skeleton';
import { FrequencyChartClient } from './FrequencyChartClient';

interface FrequencyChartProps {
  lotteryType: LotteryType;
  range: TimeRange;
}

/** Skeleton hiển thị trong lúc biểu đồ chẵn/lẻ đang fetch dữ liệu. */
function FrequencyChartSkeleton() {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 h-72 flex flex-col justify-between">
      <Skeleton className="h-5 w-56 bg-slate-800" />
      <Skeleton className="h-44 w-full rounded-xl bg-slate-800" />
    </div>
  );
}

/** Fetch số liệu chẵn/lẻ rồi giao cho `FrequencyChartClient` (Recharts) vẽ biểu đồ. */
async function FrequencyChartContent({ lotteryType, range }: FrequencyChartProps) {
  const stats = await getLotteryStats(lotteryType, range);
  return <FrequencyChartClient evenOdd={stats.evenOdd} range={range} />;
}

/**
 * Biểu đồ phân bố tỷ lệ Chẵn/Lẻ trên Dashboard. Tự fetch dữ liệu và tự bọc
 * Suspense/Skeleton — page.tsx chỉ cần render `<FrequencyChart lotteryType={...} range={...} />`.
 */
export function FrequencyChart(props: FrequencyChartProps) {
  return (
    <Suspense fallback={<FrequencyChartSkeleton />}>
      <FrequencyChartContent {...props} />
    </Suspense>
  );
}
