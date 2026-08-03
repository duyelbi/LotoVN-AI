'use client';

import React, { useState, useEffect } from 'react';
import { LotteryType, SuggestionRecord } from '@/lib/types';
import { NumberBall } from './NumberBall';
import {
  Sparkles,
  ShieldAlert,
  Clock,
  CheckCircle2,
  AlertTriangle,
  BarChart3,
  HelpCircle,
  TrendingUp,
  Bookmark,
  RefreshCw,
  Cpu,
  ArrowRight,
} from 'lucide-react';

interface SuggestionsTabProps {
  selectedLottery: LotteryType;
  userId?: string;
  favoriteNumbers: number[];
  onToggleFavorite: (num: number) => void;
}

export const SuggestionsTab: React.FC<SuggestionsTabProps> = ({
  selectedLottery,
  userId,
  favoriteNumbers,
  onToggleFavorite,
}) => {
  const [suggestionLogs, setSuggestionLogs] = useState<SuggestionRecord[]>([]);
  const [currentSuggestion, setCurrentSuggestion] = useState<SuggestionRecord | null>(null);
  const [loadingLogs, setLoadingLogs] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [filterLottery, setFilterLottery] = useState<'all' | LotteryType>('all');

  const loadLogs = async () => {
    setLoadingLogs(true);
    try {
      const url =
        filterLottery === 'all'
          ? '/api/suggestions'
          : `/api/suggestions?type=${filterLottery}`;
      const res = await fetch(url);
      const json = await res.json();
      setSuggestionLogs(json.suggestions || []);
    } catch (err) {
      console.error('Error fetching suggestion logs:', err);
    } finally {
      setLoadingLogs(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadLogs();
    }, 0);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterLottery]);

  const handleGenerateSuggestion = async () => {
    setGenerating(true);
    try {
      const res = await fetch('/api/suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lotteryType: selectedLottery,
          userId,
        }),
      });
      const json = await res.json();
      if (res.ok && json.suggestion) {
        setCurrentSuggestion(json.suggestion);
        await loadLogs();
      } else {
        alert(json.error || 'Lỗi khi tạo bộ số gợi ý');
      }
    } catch (err) {
      console.error(err);
      alert('Không thể kết nối tới máy chủ');
    } finally {
      setGenerating(false);
    }
  };

  // Calculate realistic historical accuracy metrics
  const evaluatedLogs = suggestionLogs.filter((s) => s.status === 'evaluated');
  const totalEvaluated = evaluatedLogs.length;
  const matchCounts = { '0': 0, '1': 0, '2': 0, '3': 0, '4+': 0 };

  let totalMatchedBalls = 0;
  evaluatedLogs.forEach((s) => {
    const count = s.matchCount || 0;
    totalMatchedBalls += count;
    if (count === 0) matchCounts['0']++;
    else if (count === 1) matchCounts['1']++;
    else if (count === 2) matchCounts['2']++;
    else if (count === 3) matchCounts['3']++;
    else matchCounts['4+']++;
  });

  const avgMatched =
    totalEvaluated > 0
      ? Number((totalMatchedBalls / totalEvaluated).toFixed(1))
      : 0;

  return (
    <div className="space-y-10 pb-12">
      {/* Top Banner: Generator Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-slate-900/90 border border-slate-800/80 rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xl">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/30 text-teal-400 text-xs font-semibold uppercase tracking-wider mb-3">
            <Cpu className="w-3.5 h-3.5" />
            <span>AI Thống Kê & Minh Bạch Dữ Liệu</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-100 tracking-tight">
            Bộ Gợi Ý Số Cân Bằng & Kiểm Chứng Thực Tế
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-2 leading-relaxed">
            LotoVN AI phân tích lịch sử tần suất để tạo bộ số tham khảo kết hợp cân bằng giữa số nóng, số ấm và số gan. Mỗi bộ số được lưu lại với timestamp không thể chỉnh sửa để đối chiếu trung thực tỷ lệ trúng khi có kết quả mới.
          </p>
        </div>

        <button
          type="button"
          onClick={handleGenerateSuggestion}
          disabled={generating}
          className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-teal-500 to-indigo-600 hover:from-teal-400 hover:to-indigo-500 text-slate-950 font-extrabold text-sm shadow-lg shadow-teal-500/20 transition-all cursor-pointer disabled:opacity-50 shrink-0"
        >
          {generating ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Đang phân tích xác suất...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              <span>Tạo Bộ Số ({selectedLottery === 'mega645' ? 'Mega 6/45' : 'Power 6/55'})</span>
            </>
          )}
        </button>
      </div>

      {/* RESULT CARD: Current Generated Suggestion */}
      {currentSuggestion && (
        <div className="bg-slate-900/90 border-2 border-teal-500/40 rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 px-4 py-1.5 bg-teal-500/20 border-l border-b border-teal-500/30 rounded-bl-xl text-xs font-bold text-teal-300">
            Mới Tạo • {new Date(currentSuggestion.createdAt).toLocaleTimeString('vi-VN')}
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-400 mb-2">
            <span>Mã gợi ý:</span>
            <span className="font-mono text-slate-300 font-bold">{currentSuggestion.id}</span>
            <span>•</span>
            <span className="uppercase text-teal-400 font-semibold">
              {currentSuggestion.lotteryType === 'mega645' ? 'Mega 6/45' : 'Power 6/55'}
            </span>
          </div>

          <h3 className="text-lg sm:text-xl font-bold text-slate-100 mb-6">
            Bộ 6 Số Tham Khảo Thống Kê
          </h3>

          {/* Number Balls Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
            {currentSuggestion.suggestedNumbers.map((item) => {
              const isFav = favoriteNumbers.includes(item.number);
              return (
                <div
                  key={item.number}
                  className="bg-slate-950 border border-slate-800 rounded-2xl p-4 flex flex-col items-center justify-between text-center gap-3 relative group hover:border-slate-700 transition-all"
                >
                  <div className="relative">
                    <NumberBall number={item.number} size="lg" status="default" />
                    <button
                      type="button"
                      onClick={() => onToggleFavorite(item.number)}
                      className="absolute -top-1 -right-2 p-1 text-slate-500 hover:text-teal-400 transition-colors"
                      title="Lưu số yêu thích"
                    >
                      <Bookmark
                        className={`w-4 h-4 ${isFav ? 'fill-teal-400 text-teal-400' : ''}`}
                      />
                    </button>
                  </div>

                  <div>
                    <div className="text-xs font-bold text-teal-300">
                      {item.statSummary}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1.5 leading-normal">
                      {item.aiReasoning}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Overall AI Analysis */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 mb-4">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-indigo-400" />
              <span>Phân Tích Cân Bằng Của Trợ Lý LotoVN AI</span>
            </h4>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              {currentSuggestion.overallAnalysis}
            </p>
          </div>

          {/* Educational Disclaimer */}
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3.5 flex items-start gap-3">
            <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-200/90 leading-relaxed">
              <strong>Minh Bạch Xác Suất:</strong> {currentSuggestion.disclaimer}
            </p>
          </div>
        </div>
      )}

      {/* TRACKING ĐỘ CHÍNH XÁC (TỶ LỆ TRÚNG LỊCH SỬ - REALISTIC MATCH RATES) */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-teal-400" />
              <span>Dashboard Kiểm Chứng: Tỷ Lệ Trúng Lịch Sử</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
              Được ghi log không chỉnh sửa, phản ánh trung thực xác suất thực tế của thống kê xổ số.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium">Lọc theo:</span>
            <select
              value={filterLottery}
              onChange={(e) => setFilterLottery(e.target.value as any)}
              className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-teal-500"
            >
              <option value="all">Tất cả xổ số</option>
              <option value="mega645">Mega 6/45</option>
              <option value="power655">Power 6/55</option>
            </select>
          </div>
        </div>

        {/* HONEST PROBABILITY BANNER (EXPLAINING WHY MOST MATCH 0-2 NUMBERS) */}
        <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="max-w-2xl">
              <div className="flex items-center gap-2 mb-2">
                <ShieldAlert className="w-4 h-4 text-teal-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-teal-300">
                  Tại sao tỷ lệ khớp chủ yếu là 0 đến 2 số?
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Trong toán học phân phối siêu bội (Hypergeometric Distribution), khi bạn chọn ngẫu nhiên 6 bóng trong 45 bóng (hoặc 55 bóng), xác suất để bạn <strong>khớp 0 số chiếm ~42.4%</strong>, <strong>khớp 1 số chiếm ~42.4%</strong>, và <strong>khớp 2 số chiếm ~13.6%</strong>. Khớp 3 số chỉ xảy ra với xác suất 1.76%, và khớp 4+ số là trường hợp vô cùng hiếm gặp (dưới 0.1%).
              </p>
              <p className="text-xs text-slate-400 mt-2">
                <strong>Bài học minh bạch:</strong> Thống kê tần suất giúp bạn hiểu sự phân bố trong quá khứ, nhưng không thể can thiệp vào xác suất ngẫu nhiên này.
              </p>
            </div>

            {/* Realistic Summary Metrics */}
            <div className="grid grid-cols-3 gap-3 shrink-0">
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-center">
                <div className="text-xs text-slate-500 mb-1">Đã kiểm chứng</div>
                <div className="text-lg font-extrabold text-slate-100">{totalEvaluated}</div>
                <div className="text-[10px] text-slate-500 mt-0.5">bộ số gợi ý</div>
              </div>

              <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-center">
                <div className="text-xs text-slate-500 mb-1">Trung bình khớp</div>
                <div className="text-lg font-extrabold text-teal-400">{avgMatched} / 6</div>
                <div className="text-[10px] text-teal-400/80 mt-0.5">chuẩn xác suất</div>
              </div>

              <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-center">
                <div className="text-xs text-slate-500 mb-1">Khớp ≥ 3 số</div>
                <div className="text-lg font-extrabold text-indigo-400">
                  {matchCounts['3'] + matchCounts['4+']}
                </div>
                <div className="text-[10px] text-indigo-400/80 mt-0.5">trường hợp hiếm</div>
              </div>
            </div>
          </div>

          {/* Probability Distribution Bar */}
          <div className="mt-6 pt-6 border-t border-slate-800/80">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
              <span>Phân bố số lần khớp trên toàn bộ các kỳ đã kiểm chứng:</span>
              <span className="font-semibold text-slate-300">100% minh bạch</span>
            </div>
            <div className="grid grid-cols-5 gap-2 text-center">
              {[
                { label: '0 Số', count: matchCounts['0'], desc: '42% kỳ vọng' },
                { label: '1 Số', count: matchCounts['1'], desc: '42% kỳ vọng' },
                { label: '2 Số', count: matchCounts['2'], desc: '14% kỳ vọng' },
                { label: '3 Số', count: matchCounts['3'], desc: '1.8% kỳ vọng' },
                { label: '4+ Số', count: matchCounts['4+'], desc: 'Hiếm gặp' },
              ].map((m) => {
                const percent =
                  totalEvaluated > 0
                    ? Math.round((m.count / totalEvaluated) * 100)
                    : 0;
                return (
                  <div
                    key={m.label}
                    className="bg-slate-950 border border-slate-800 rounded-xl p-3 flex flex-col justify-between"
                  >
                    <div className="text-xs font-bold text-slate-300">{m.label}</div>
                    <div className="text-base font-extrabold text-teal-400 my-1">
                      {m.count} <span className="text-xs font-normal text-slate-500">({percent}%)</span>
                    </div>
                    <div className="text-[10px] text-slate-500">{m.desc}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* LOGS TABLE / CARDS */}
        <div className="space-y-4">
          <h3 className="text-base font-bold text-slate-200">
            Chi Tiết Lịch Sử Gợi Ý & Kết Quả Đối Chiếu
          </h3>

          {loadingLogs ? (
            <div className="py-12 flex items-center justify-center">
              <RefreshCw className="w-6 h-6 text-teal-400 animate-spin" />
            </div>
          ) : suggestionLogs.length === 0 ? (
            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-8 text-center text-slate-400 text-sm">
              Chưa có lịch sử gợi ý nào. Hãy tạo bộ số mới ở nút trên!
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {suggestionLogs.map((log) => {
                const isEvaluated = log.status === 'evaluated';
                return (
                  <div
                    key={log.id}
                    className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4 hover:border-slate-700 transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-slate-300">
                          {log.id}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-800 text-slate-300 border border-slate-700">
                          {log.lotteryType === 'mega645' ? 'Mega 6/45' : 'Power 6/55'}
                        </span>
                      </div>

                      <div className="text-xs text-slate-500">
                        {new Date(log.createdAt).toLocaleDateString('vi-VN')}
                      </div>
                    </div>

                    {/* Suggested Balls */}
                    <div>
                      <div className="text-xs text-slate-400 mb-2">Bộ 6 số đã gợi ý:</div>
                      <div className="flex items-center gap-2 flex-wrap">
                        {log.suggestedNumbers.map((item) => {
                          const isMatched =
                            isEvaluated &&
                            log.matchedNumbers?.includes(item.number);
                          return (
                            <NumberBall
                              key={item.number}
                              number={item.number}
                              size="sm"
                              status={isMatched ? 'matched' : 'default'}
                            />
                          );
                        })}
                      </div>
                    </div>

                    {/* Verification Result Banner */}
                    <div
                      className={`rounded-xl p-3 border text-xs ${
                        !isEvaluated
                          ? 'bg-slate-950 border-slate-800 text-slate-400'
                          : log.matchCount === 0
                          ? 'bg-slate-950/80 border-slate-800 text-slate-400'
                          : 'bg-teal-500/10 border-teal-500/30 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between font-bold mb-1">
                        <span>
                          {isEvaluated
                            ? `Đối chiếu kỳ ${log.targetDrawId || 'mới'}:`
                            : 'Trạng thái:'}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[11px] ${
                            !isEvaluated
                              ? 'bg-slate-800 text-slate-400'
                              : log.matchCount === 0
                              ? 'bg-slate-800 text-slate-400'
                              : 'bg-teal-500/20 text-teal-300'
                          }`}
                        >
                          {!isEvaluated
                            ? 'Chờ kỳ quay mới'
                            : `Khớp ${log.matchCount} / 6 số`}
                        </span>
                      </div>

                      <p className="text-[11px] text-slate-400 mt-1 leading-normal">
                        {log.overallAnalysis}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
