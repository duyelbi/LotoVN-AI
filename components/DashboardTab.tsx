'use client';

import React, { useState, useEffect } from 'react';
import { LotteryType, DrawRecord, NumberStat, EvenOddStat, HighLowStat, TrendDataPoint } from '@/lib/types';
import { NumberBall } from './NumberBall';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  Cell,
  CartesianGrid,
} from 'recharts';
import {
  BarChart2,
  TrendingUp,
  Clock,
  Flame,
  AlertTriangle,
  Search,
  Filter,
  RefreshCw,
  PlusCircle,
  CheckCircle2,
  SlidersHorizontal,
  Bookmark,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface DashboardTabProps {
  selectedLottery: LotteryType;
  favoriteNumbers: number[];
  onToggleFavorite: (num: number) => void;
}

export const DashboardTab: React.FC<DashboardTabProps> = ({
  selectedLottery,
  favoriteNumbers,
  onToggleFavorite,
}) => {
  const [statsData, setStatsData] = useState<{
    numberStats: NumberStat[];
    evenOdd: EvenOddStat[];
    highLow: HighLowStat[];
    trend: TrendDataPoint[];
    hotNumbers: NumberStat[];
    coldNumbers: NumberStat[];
    overdueNumbers: NumberStat[];
    latestDraw: DrawRecord | null;
    totalDrawsAnalyzed: number;
  } | null>(null);

  const [drawHistory, setDrawHistory] = useState<DrawRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<number>(30);
  const [searchNumber, setSearchNumber] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showAddDrawModal, setShowAddDrawModal] = useState(false);
  const [newDrawInput, setNewDrawInput] = useState({
    id: '',
    numbersStr: '',
    bonusNumber: '',
  });
  const [submittingDraw, setSubmittingDraw] = useState(false);
  const [drawSuccessMsg, setDrawSuccessMsg] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [statsRes, drawsRes] = await Promise.all([
        fetch(`/api/stats?type=${selectedLottery}&limit=${timeRange}`),
        fetch(`/api/draws?type=${selectedLottery}&limit=${timeRange}`),
      ]);
      const statsJson = await statsRes.json();
      const drawsJson = await drawsRes.json();

      setStatsData(statsJson);
      setDrawHistory(drawsJson.draws || []);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadData();
    }, 0);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedLottery, timeRange]);

  const handleAddDraw = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingDraw(true);
    setDrawSuccessMsg(null);

    try {
      const nums = newDrawInput.numbersStr
        .split(',')
        .map((x) => parseInt(x.trim()))
        .filter((n) => !isNaN(n) && n > 0 && n <= (selectedLottery === 'mega645' ? 45 : 55));

      if (nums.length !== 6) {
        alert('Vui lòng nhập đúng 6 số hợp lệ, cách nhau bởi dấu phẩy (ví dụ: 3, 11, 18, 24, 33, 42)');
        setSubmittingDraw(false);
        return;
      }

      const res = await fetch('/api/draws', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: newDrawInput.id || `#01${Math.floor(100 + Math.random() * 900)}`,
          lotteryType: selectedLottery,
          drawDate: new Date().toISOString().split('T')[0],
          numbers: nums,
          bonusNumber: newDrawInput.bonusNumber ? parseInt(newDrawInput.bonusNumber) : undefined,
          jackpotValue: 35000000000,
          hasWinner: false,
        }),
      });

      if (res.ok) {
        setDrawSuccessMsg('Đã cập nhật kỳ quay và kiểm chứng tỷ lệ trúng tự động!');
        setShowAddDrawModal(false);
        setNewDrawInput({ id: '', numbersStr: '', bonusNumber: '' });
        await loadData();
      } else {
        const err = await res.json();
        alert(err.error || 'Lỗi khi thêm kỳ quay');
      }
    } catch (error) {
      console.error(error);
      alert('Lỗi kết nối khi cập nhật kỳ quay');
    } finally {
      setSubmittingDraw(false);
    }
  };

  if (loading || !statsData) {
    return (
      <div className="py-20 flex flex-col items-center justify-center gap-4">
        <div className="w-10 h-10 border-4 border-teal-500/20 border-t-teal-400 rounded-full animate-spin" />
        <p className="text-sm text-slate-400 font-medium">
          Đang tính toán ma trận tần suất & kỳ gan...
        </p>
      </div>
    );
  }

  // Filtered number stats table
  const filteredStats = statsData.numberStats.filter((stat) => {
    if (searchNumber && stat.number !== parseInt(searchNumber)) {
      return false;
    }
    if (statusFilter !== 'all' && stat.status !== statusFilter) {
      return false;
    }
    return true;
  });

  return (
    <div className="space-y-8 pb-12">
      {/* Top Banner: Time Range & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/60 p-4 rounded-2xl border border-slate-800/80">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-100 flex items-center gap-2.5">
            <span>Thống Kê Tần Suất & Kỳ Gan</span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase bg-teal-500/10 text-teal-400 border border-teal-500/30">
              {selectedLottery === 'mega645' ? 'Mega 6/45' : 'Power 6/55'}
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Minh bạch dữ liệu từ {statsData.totalDrawsAnalyzed} kỳ quay gần nhất. Mọi kỳ quay đều độc lập về mặt xác suất.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
            {[10, 30, 50].map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => setTimeRange(num)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  timeRange === num
                    ? 'bg-slate-800 text-teal-300 border border-slate-700'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {num} kỳ
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setShowAddDrawModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700/80 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
          >
            <PlusCircle className="w-4 h-4 text-teal-400" />
            <span>Thêm Kỳ Quay Mới</span>
          </button>
        </div>
      </div>

      {drawSuccessMsg && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3 flex items-center justify-between text-xs text-emerald-300">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{drawSuccessMsg}</span>
          </div>
          <button
            type="button"
            onClick={() => setDrawSuccessMsg(null)}
            className="text-emerald-400 hover:text-emerald-200 underline text-xs"
          >
            Đóng
          </button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Latest Draw */}
        <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
              <span>Kỳ Quay Mới Nhất</span>
              <span className="font-semibold text-teal-400">
                {statsData.latestDraw?.id || 'N/A'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mb-3">
              Ngày: {statsData.latestDraw?.drawDate || '--'}
            </p>
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            {statsData.latestDraw?.numbers.map((n) => (
              <NumberBall key={n} number={n} size="sm" status="default" />
            ))}
            {statsData.latestDraw?.bonusNumber && (
              <NumberBall
                number={statsData.latestDraw.bonusNumber}
                size="sm"
                status="bonus"
              />
            )}
          </div>
        </div>

        {/* Card 2: Most Frequent (Hot) */}
        <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
              <span className="flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-teal-400" />
                Số Nóng (Xuất Hiện Nhiều)
              </span>
              <span className="text-[11px] text-slate-500">
                Top {statsData.hotNumbers.length}
              </span>
            </div>
            <p className="text-xs text-slate-500 mb-3">
              Xuất hiện vượt trên 25% kỳ vọng toán học
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {statsData.hotNumbers.slice(0, 4).map((s) => (
              <NumberBall
                key={s.number}
                number={s.number}
                size="sm"
                status="hot"
                drought={s.drought}
              />
            ))}
          </div>
        </div>

        {/* Card 3: Highest Drought (Gan Cực Đại) */}
        <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                Số Gan Lâu Chưa Về Nhất
              </span>
              <span className="text-[11px] text-amber-400/90 font-medium">
                Kỳ gan cực đại
              </span>
            </div>
            <p className="text-xs text-slate-500 mb-3">
              Độ gan ≥ 8 kỳ (vẫn có xác suất 1/45 - 1/55)
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {statsData.overdueNumbers.slice(0, 4).map((s) => (
              <NumberBall
                key={s.number}
                number={s.number}
                size="sm"
                status="gan_cuc_dai"
                drought={s.drought}
                showDroughtBadge
              />
            ))}
          </div>
        </div>

        {/* Card 4: Even / Odd Balance */}
        <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
              <span>Phân Bố Chẵn / Lẻ Phổ Biến</span>
              <span className="text-[11px] text-indigo-400 font-medium">
                {statsData.evenOdd[0]?.label || '--'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mb-3">
              Tỷ lệ 3 Chẵn - 3 Lẻ & 4 Chẵn - 2 Lẻ chiếm đa số
            </p>
          </div>
          <div className="flex items-center gap-2">
            {statsData.evenOdd.slice(0, 2).map((eo) => (
              <div
                key={eo.label}
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl p-2 text-center"
              >
                <div className="text-xs font-bold text-slate-200">{eo.label}</div>
                <div className="text-[11px] text-teal-400 font-medium mt-0.5">
                  {eo.percentage}%
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Visual Charts Grid (Recharts) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Number Frequency Distribution */}
        <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-100">
                Top 15 Số Xuất Hiện Nhiều Nhất
              </h3>
              <p className="text-xs text-slate-400">
                Tần suất xuất hiện (lần) trong {timeRange} kỳ quay
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="inline-block w-3 h-3 rounded bg-teal-500/80" />
              <span className="text-slate-400">Số lần</span>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={statsData.numberStats
                  .slice()
                  .sort((a, b) => b.count - a.count)
                  .slice(0, 15)}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="number" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#090d16',
                    borderColor: '#334155',
                    borderRadius: '0.75rem',
                    fontSize: '12px',
                    color: '#f8fafc',
                  }}
                  formatter={(value: any) => [`${value} lần`, 'Xuất hiện']}
                  labelFormatter={(label: any) => `Số ${label}`}
                />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {statsData.numberStats
                    .slice()
                    .sort((a, b) => b.count - a.count)
                    .slice(0, 15)
                    .map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.status === 'hot' ? '#14b8a6' : '#6366f1'}
                      />
                    ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Top Overdue Numbers (Kỳ Gan) */}
        <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-100">
                Top 15 Số Gan (Lâu Chưa Về Nhất)
              </h3>
              <p className="text-xs text-slate-400">
                Số kỳ liên tiếp chưa xuất hiện trong bảng kết quả
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="inline-block w-3 h-3 rounded bg-amber-500/80" />
              <span className="text-slate-400">Kỳ gan</span>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={statsData.overdueNumbers.slice(0, 15)}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="number" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#090d16',
                    borderColor: '#334155',
                    borderRadius: '0.75rem',
                    fontSize: '12px',
                    color: '#f8fafc',
                  }}
                  formatter={(value: any) => [`Gan ${value} kỳ`, 'Độ gan']}
                  labelFormatter={(label: any) => `Số ${label}`}
                />
                <Bar dataKey="drought" radius={[6, 6, 0, 0]}>
                  {statsData.overdueNumbers.slice(0, 15).map((entry, index) => (
                    <Cell
                      key={`cell-drought-${index}`}
                      fill={entry.drought >= 8 ? '#f59e0b' : '#64748b'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* FULL FREQUENCY TABLE (BẢNG TẦN SUẤT CHI TIẾT) */}
      <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-slate-100">
              Bảng Tần Suất & Chỉ Số Gan ({selectedLottery === 'mega645' ? '45 Bóng' : '55 Bóng'})
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Nhấp vào một con số để đánh dấu yêu thích cá nhân.
            </p>
          </div>

          {/* Search & Filter Controls */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="relative">
              <input
                type="number"
                placeholder="Tìm số (1-55)..."
                value={searchNumber}
                onChange={(e) => setSearchNumber(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 pl-8 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-teal-500/60 w-36"
              />
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2" />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-teal-500/60"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="hot">Số Nóng (Hot)</option>
              <option value="warm">Tần suất trung bình (Warm)</option>
              <option value="cold">Số Lạnh (Cold)</option>
              <option value="gan_cuc_dai">Gan Cực Đại (≥8 kỳ)</option>
            </select>
          </div>
        </div>

        {/* Interactive Number Matrix Grid */}
        <div className="p-6">
          <div className="grid grid-cols-5 sm:grid-cols-9 md:grid-cols-11 gap-3">
            {filteredStats.map((stat) => {
              const isFav = favoriteNumbers.includes(stat.number);
              return (
                <div
                  key={stat.number}
                  onClick={() => onToggleFavorite(stat.number)}
                  className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer select-none group ${
                    isFav
                      ? 'bg-teal-500/10 border-teal-500/50 shadow-sm shadow-teal-500/10'
                      : 'bg-slate-950 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900'
                  }`}
                >
                  <div className="relative">
                    <NumberBall
                      number={stat.number}
                      size="md"
                      status={stat.status}
                      drought={stat.drought}
                    />
                    {isFav && (
                      <Bookmark className="w-3.5 h-3.5 text-teal-400 absolute -top-1 -right-2 fill-teal-400" />
                    )}
                  </div>

                  <div className="text-center">
                    <div className="text-[11px] font-bold text-slate-300">
                      {stat.count} <span className="text-[10px] text-slate-500">lần</span>
                    </div>
                    <div className="text-[10px] text-slate-500">
                      Gan <span className="font-semibold text-slate-400">{stat.drought}k</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* HISTORICAL DRAWS TABLE */}
      <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-100">Lịch Sử Quay Thưởng</h3>
            <p className="text-xs text-slate-400">
              Danh sách kết quả các kỳ quay gần nhất
            </p>
          </div>
          <span className="text-xs text-slate-500 font-medium">
            Hiển thị {drawHistory.length} kỳ
          </span>
        </div>

        {/* Mobile View: Vertical Card List (< 768px) */}
        <div className="md:hidden p-4 space-y-3">
          {drawHistory.map((draw) => (
            <div
              key={draw.id}
              className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3.5 space-y-3 shadow-sm"
            >
              <div className="flex items-center justify-between text-xs border-b border-slate-800/60 pb-2">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-teal-400 text-sm">#{draw.id}</span>
                  <span className="text-slate-400">{draw.drawDate}</span>
                </div>
                <span className="font-semibold text-slate-300 text-xs">
                  {draw.jackpotValue.toLocaleString('vi-VN')} đ
                </span>
              </div>

              <div>
                <div className="text-[10px] uppercase tracking-wider font-semibold text-slate-500 mb-1.5">
                  Dãy số trúng thưởng
                </div>
                <div className="flex items-center gap-1.5 overflow-x-auto py-1 -mx-1 px-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                  {draw.numbers.map((n) => (
                    <div key={n} className="shrink-0">
                      <NumberBall number={n} size="sm" status="default" />
                    </div>
                  ))}
                  {selectedLottery === 'power655' && (
                    <>
                      <span className="text-slate-600 font-bold px-0.5 shrink-0">+</span>
                      {draw.bonusNumber ? (
                        <div className="shrink-0">
                          <NumberBall
                            number={draw.bonusNumber}
                            size="sm"
                            status="bonus"
                          />
                        </div>
                      ) : (
                        <span className="text-slate-600 shrink-0">--</span>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop View: Horizontal Table (>= 768px) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-xs font-semibold text-slate-400 bg-slate-950/60">
                <th className="py-3.5 px-6">Kỳ quay</th>
                <th className="py-3.5 px-6">Ngày quay</th>
                <th className="py-3.5 px-6">Dãy số trúng thưởng</th>
                {selectedLottery === 'power655' && (
                  <th className="py-3.5 px-6 text-center">Số đặc biệt</th>
                )}
                <th className="py-3.5 px-6 text-right">Jackpot (VNĐ)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs">
              {drawHistory.map((draw) => (
                <tr
                  key={draw.id}
                  className="hover:bg-slate-800/30 transition-colors"
                >
                  <td className="py-4 px-6 font-bold text-teal-400">#{draw.id}</td>
                  <td className="py-4 px-6 text-slate-400">{draw.drawDate}</td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {draw.numbers.map((n) => (
                        <NumberBall key={n} number={n} size="sm" status="default" />
                      ))}
                    </div>
                  </td>
                  {selectedLottery === 'power655' && (
                    <td className="py-4 px-6 text-center">
                      {draw.bonusNumber ? (
                        <NumberBall
                          number={draw.bonusNumber}
                          size="sm"
                          status="bonus"
                        />
                      ) : (
                        <span className="text-slate-600">--</span>
                      )}
                    </td>
                  )}
                  <td className="py-4 px-6 text-right font-medium text-slate-300">
                    {draw.jackpotValue.toLocaleString('vi-VN')} đ
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Add New Draw (for testing accuracy tracking) */}
      {showAddDrawModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <h3 className="text-base font-bold text-slate-100 mb-1">
              Cập Nhật Kỳ Quay Mới ({selectedLottery === 'mega645' ? 'Mega 6/45' : 'Power 6/55'})
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Khi thêm kỳ quay, hệ thống tự động kiểm chứng và tính tỷ lệ trúng cho các bộ số đã gợi ý trước đó!
            </p>

            <form onSubmit={handleAddDraw} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Mã kỳ quay (tùy chọn)
                </label>
                <input
                  type="text"
                  placeholder="#01315"
                  value={newDrawInput.id}
                  onChange={(e) => setNewDrawInput({ ...newDrawInput, id: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  6 Số Trúng Thưởng (cách nhau bằng dấu phẩy) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="ví dụ: 3, 11, 18, 24, 33, 42"
                  value={newDrawInput.numbersStr}
                  onChange={(e) => setNewDrawInput({ ...newDrawInput, numbersStr: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-teal-500"
                />
              </div>

              {selectedLottery === 'power655' && (
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Số Đặc Biệt (Bonus Ball)
                  </label>
                  <input
                    type="number"
                    placeholder="ví dụ: 17"
                    value={newDrawInput.bonusNumber}
                    onChange={(e) => setNewDrawInput({ ...newDrawInput, bonusNumber: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-teal-500"
                  />
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddDrawModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200 bg-slate-800/80 transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submittingDraw}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-950 bg-teal-400 hover:bg-teal-300 transition-colors disabled:opacity-50"
                >
                  {submittingDraw ? 'Đang cập nhật...' : 'Lưu & Kiểm Chứng Tự Động'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
