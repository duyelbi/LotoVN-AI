'use client';

import React from 'react';
import { EvenOddStat, TimeRange } from '@/lib/types';
import { BarChart2 } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, Cell, XAxis, YAxis } from 'recharts';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';

interface FrequencyChartClientProps {
  evenOdd: EvenOddStat[];
  range: TimeRange;
}

const chartConfig = {
  percentage: {
    label: 'Tỷ lệ xuất hiện',
  },
} satisfies ChartConfig;

/**
 * Vẽ biểu đồ cột tỷ lệ Chẵn/Lẻ qua shadcn `ChartContainer` (Recharts + theme CSS
 * variable, tooltip/trục theo đúng dark theme của app). Recharts cần DOM/browser
 * nên đây là Client Component riêng, được `FrequencyChart` (Server Component)
 * render sau khi fetch xong dữ liệu.
 */
export function FrequencyChartClient({ evenOdd, range }: FrequencyChartClientProps) {
  return (
    <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-5 space-y-4">
      <div>
        <h3 className="font-bold text-slate-100 text-sm flex items-center gap-2">
          <BarChart2 className="w-4 h-4 text-teal-400" />
          <span>Phân Bố Tỷ Lệ Chẵn / Lẻ ({range} kỳ)</span>
        </h3>
        <p className="text-xs text-slate-400 mt-1">
          Phần lớn các kỳ quay có phân bố 3 Chẵn - 3 Lẻ hoặc 4 Chẵn - 2 Lẻ / 2 Chẵn - 4 Lẻ.
        </p>
      </div>
      <ChartContainer config={chartConfig} className="aspect-auto h-56 w-full pt-2">
        <BarChart data={evenOdd} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
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
            {evenOdd.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={index % 2 === 0 ? 'var(--color-chart-1)' : 'var(--color-chart-2)'}
              />
            ))}
          </Bar>
        </BarChart>
      </ChartContainer>
    </div>
  );
}
