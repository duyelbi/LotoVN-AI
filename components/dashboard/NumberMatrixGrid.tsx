'use client';

import React, { useState } from 'react';
import { NumberStat, LotteryType, GAN_THRESHOLD } from '@/lib/types';
import { NumberBall } from '@/components/NumberBall';
import { useAppState } from '@/components/providers/AppProviders';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, Bookmark } from 'lucide-react';

interface NumberMatrixGridProps {
  numberStats: NumberStat[];
  lotteryType: LotteryType;
}

/**
 * Phần tương tác (search, filter trạng thái, click-to-favorite) của bảng tần suất.
 * Nhận `numberStats` đã fetch sẵn từ `NumberMatrix` (Server Component) qua props —
 * lọc/tìm kiếm hoàn toàn phía client, không gọi lại API.
 */
export function NumberMatrixGrid({ numberStats, lotteryType }: NumberMatrixGridProps) {
  const { favoriteNumbers, toggleFavorite } = useAppState();
  const [searchNumber, setSearchNumber] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filteredStats = numberStats.filter((stat) => {
    if (searchNumber.trim() !== '') {
      const target = parseInt(searchNumber.trim(), 10);
      if (!isNaN(target) && stat.number !== target) return false;
    }
    if (statusFilter !== 'all') {
      if (statusFilter === 'hot' && stat.status !== 'hot') return false;
      if (statusFilter === 'cold' && stat.status !== 'cold') return false;
      if (statusFilter === 'gan' && stat.drought < GAN_THRESHOLD) return false;
    }
    return true;
  });

  return (
    <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-5 sm:p-6 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="font-bold text-slate-100 text-base">
            Bảng Tần Suất Chi Tiết Toàn Bộ {lotteryType === 'mega645' ? '45' : '55'} Con Số
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Click vào con số bất kỳ để lưu vào danh sách Yêu Thích cá nhân.
          </p>
        </div>

        {/* Filter & Search Toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
            <input
              type="text"
              placeholder="Tìm số..."
              value={searchNumber}
              onChange={(e) => setSearchNumber(e.target.value)}
              className="w-28 bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-teal-500/50"
            />
          </div>

          <Select
            value={statusFilter}
            onValueChange={(val) => { if (val) setStatusFilter(val); }}
          >
            <SelectTrigger className="bg-slate-950 border-slate-800 text-xs text-slate-300 h-8 px-3 rounded-xl">
              <SelectValue placeholder="Tất cả trạng thái" />
            </SelectTrigger>
            <SelectContent className="bg-slate-900 border-slate-800 text-slate-200 text-xs">
              <SelectItem value="all">Tất cả trạng thái</SelectItem>
              <SelectItem value="hot">Số Nóng</SelectItem>
              <SelectItem value="cold">Số Lạnh</SelectItem>
              <SelectItem value="gan">Số Gan (&gt;= 8 kỳ)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Matrix Grid of All Numbers */}
      <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-9 gap-3">
        {filteredStats.map((stat) => {
          const isFav = favoriteNumbers.includes(stat.number);
          return (
            <div
              key={stat.number}
              className={`p-3 rounded-xl border transition-all flex flex-col items-center justify-between text-center relative ${
                stat.status === 'hot'
                  ? 'bg-teal-500/5 border-teal-500/20 hover:border-teal-500/40'
                  : stat.status === 'cold'
                  ? 'bg-slate-950/40 border-slate-800/60 hover:border-slate-700'
                  : stat.drought >= GAN_THRESHOLD
                  ? 'bg-amber-500/5 border-amber-500/20 hover:border-amber-500/40'
                  : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700'
              }`}
            >
              {isFav && (
                <Bookmark className="w-3.5 h-3.5 text-teal-400 fill-teal-400 absolute top-2 right-2" />
              )}

              <NumberBall
                number={stat.number}
                status={stat.status}
                size="md"
                drought={stat.drought}
                showDroughtBadge
                isFavorite={isFav}
                onClick={() => toggleFavorite(stat.number, lotteryType)}
              />

              <div className="mt-2 space-y-0.5 w-full">
                <div className="text-xs font-bold text-slate-200">{stat.count} lần</div>
                <div className="text-[10px] text-slate-500">{stat.frequencyPercent}%</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
