'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAppState } from '@/components/providers/AppProviders';
import { LotteryType, TimeRange, TIME_RANGE_OPTIONS } from '@/lib/types';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface DashboardControlsProps {
  selectedLottery: LotteryType;
  range: TimeRange;
}

/**
 * Thanh điều khiển đầu trang Dashboard: tiêu đề, bộ chọn khoảng thời gian (TimeRange).
 * Là phần duy nhất của Dashboard không phụ thuộc data fetch nên hiện ngay lập tức, không cần Suspense.
 */
export function DashboardControls({ selectedLottery, range }: DashboardControlsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAppState();
  const [totalDraws, setTotalDraws] = useState<number | null>(null);

  useEffect(() => {
    if (user) {
      fetch(`/api/draws/count?type=${selectedLottery}`)
        .then(res => res.json())
        .then(data => {
          if (data && typeof data.count === 'number') {
            setTotalDraws(data.count);
          }
        })
        .catch(console.error);
    }
  }, [user, selectedLottery]);

  const optionsToShow = user 
    ? TIME_RANGE_OPTIONS 
    : [TimeRange.Last10, TimeRange.Last30, TimeRange.Last50];

  return (
    <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-4 sm:p-6 backdrop-blur-sm space-y-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-500/10 text-teal-400 border border-teal-500/30">
              {selectedLottery === 'mega645' ? 'Vietlott Mega 6/45' : 'Vietlott Power 6/55'}
            </span>
            <span className="text-xs text-slate-400">
              {range === TimeRange.All 
                ? (totalDraws !== null ? `Phân tích tất cả ${totalDraws} kỳ quay` : 'Phân tích tất cả kỳ quay')
                : `Phân tích ${range} kỳ quay gần nhất`}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-100 mt-1 tracking-tight">
            Bảng Tần Suất &amp; Thống Kê Minh Bạch
          </h1>
        </div>

        <div className="flex items-center justify-end gap-3 w-full md:w-auto mt-2 md:mt-0">
          {/* Time Range Selector */}
          <Select
            value={range.toString()}
            onValueChange={(val) => {
              router.push(`${pathname}?type=${selectedLottery}&range=${val}`);
            }}
          >
            <SelectTrigger className="w-[160px] bg-slate-950 border-slate-800 text-xs font-semibold h-9 rounded-xl">
              <SelectValue>
                {range === TimeRange.All 
                  ? (totalDraws !== null ? `Tất cả (${totalDraws})` : 'Tất cả') 
                  : `${range} kỳ gần nhất`}
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="bg-slate-900 border-slate-800 text-slate-100 rounded-xl">
              {optionsToShow.map((r) => (
                <SelectItem
                  key={r}
                  value={r.toString()}
                  className="text-xs focus:bg-slate-800 focus:text-teal-300 cursor-pointer rounded-lg"
                >
                  {r === TimeRange.All 
                    ? (totalDraws !== null ? `Tất cả (${totalDraws})` : 'Tất cả') 
                    : `${r} kỳ gần nhất`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
