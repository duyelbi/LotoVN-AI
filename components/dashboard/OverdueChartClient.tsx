'use client';

import React from 'react';
import { HighLowStat, LotteryType, TimeRange } from '@/lib/types';
import { TrendingUp } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, Cell, XAxis, YAxis } from 'recharts';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';

interface OverdueChartClientProps {
  highLow: HighLowStat[];
  lotteryType: LotteryType;
  range: TimeRange;
}

const chartConfig = {
  percentage: {
    label: 'Tỷ lệ xuất hiện',
  },
} satisfies ChartConfig;

/**
 * Vẽ biểu đồ cột tỷ lệ Cao/Thấp qua shadcn `ChartContainer` (Recharts + theme CSS
 * variable, tooltip/trục theo đúng dark theme của app). Recharts cần DOM/browser
 * nên đây là Client Component riêng, được `OverdueChart` (Server Component) render
 * sau khi fetch xong dữ liệu.
 */
export function OverdueChartClient({ highLow, lotteryType, range }: OverdueChartClientProps) {
  return (
    <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-5 space-y-4">
      <div>
        <h3 className="font-bold text-slate-100 text-sm flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-indigo-400" />
          <span>Phân Bố Tỷ Lệ Cao / Thấp ({range} kỳ)</span>
        </h3>
        <p className="text-xs text-slate-400 mt-1">
          Số Thấp ({lotteryType === 'mega645' ? '1-22' : '1-27'}) vs Số Cao ({lotteryType === 'mega645' ? '23-45' : '28-55'}).
        </p>
      </div>
      <ChartContainer config={chartConfig} className="aspect-auto h-56 w-full pt-2">
        <BarChart data={highLow} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
          <CartesianGrid vertical={false} strokeDasharray="3 3" />
          <XAxis
            dataKey="label"
            fontSize={11}
            interval={0}
            angle={-15}
            textAnchor="end"
            tickLine={false}
            axisLine={false}
          />
          <YAxis fontSize={11} tickLine={false} axisLine={false} width={28} />
          <ChartTooltip
            cursor={false}
            content={
              <ChartTooltipContent
                formatter={(value) => [`${value}%`, ' Tỷ lệ xuất hiện']}
              />
            }
          />
          <Bar dataKey="percentage" radius={[6, 6, 0, 0]}>
            {highLow.map((entry, index) => (
              <Cell
                key={`cell-hl-${index}`}
                fill={index % 2 === 0 ? 'var(--color-chart-2)' : 'var(--color-chart-3)'}
              />
            ))}
          </Bar>
        </BarChart>
      </ChartContainer>
    </div>
  );
}
