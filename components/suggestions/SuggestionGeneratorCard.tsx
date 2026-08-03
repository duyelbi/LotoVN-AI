'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { LotteryType, SuggestionRecord } from '@/lib/types';
import { NumberBall } from '@/components/NumberBall';
import { useAppState } from '@/components/providers/AppProviders';
import { Button } from '@/components/ui/button';
import {
  Sparkles,
  ShieldAlert,
  BarChart3,
  RefreshCw,
  Cpu,
} from 'lucide-react';

interface SuggestionGeneratorCardProps {
  selectedLottery: LotteryType;
}

/**
 * Banner tạo bộ số gợi ý mới (POST /api/suggestions) + hiển thị kết quả vừa tạo.
 * Đây là dữ liệu tạo ra ngay lúc bấm nút, không phải initial page data, nên là
 * Client Component thuần, không nằm trong luồng Suspense/streaming của trang.
 */
export function SuggestionGeneratorCard({ selectedLottery }: SuggestionGeneratorCardProps) {
  const router = useRouter();
  const { user, favoriteNumbers, toggleFavorite } = useAppState();
  const userId = user?.uid;

  const [currentSuggestion, setCurrentSuggestion] = useState<SuggestionRecord | null>(null);
  const [generating, setGenerating] = useState(false);

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
        toast.success('Đã khởi tạo thành công bộ số gợi ý mới!');
        // Refresh server components (AccuracyDashboard & SuggestionLogList)
        router.refresh();
      } else {
        toast.error(json.error || 'Lỗi khi tạo bộ số gợi ý');
      }
    } catch (err) {
      console.error(err);
      toast.error('Không thể kết nối tới máy chủ');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-6 sm:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/30 text-teal-400 text-xs font-semibold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Gợi Ý Dữ Liệu Thống Kê &amp; Tracking Minh Bạch</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-100 tracking-tight">
              Tạo Bộ Số Thống Kê &amp; Kiểm Chứng Tỷ Lệ Thực Tế
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 max-w-2xl leading-relaxed">
              Bộ số được thuật toán tạo ra dựa trên việc cân bằng giữa tần suất xuất hiện và chu kỳ gan lịch sử. Hệ thống tự động theo dõi và đối soát độ chính xác thực tế khi có kỳ quay mới.
            </p>
          </div>

          <Button
            type="button"
            onClick={handleGenerateSuggestion}
            disabled={generating}
            className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 font-black text-sm shadow-lg shadow-teal-500/20 transition-all flex items-center justify-center gap-2.5 cursor-pointer shrink-0 disabled:opacity-50 border-0 h-auto"
          >
            {generating ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Thuật toán đang phân tích...</span>
              </>
            ) : (
              <>
                <Cpu className="w-4 h-4" />
                <span>Tạo Bộ Số Gợi Ý ({selectedLottery === 'mega645' ? 'Mega 6/45' : 'Power 6/55'})</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {/* RECENTLY GENERATED SUGGESTION DISPLAY */}
      {currentSuggestion && (
        <div className="bg-slate-900 border-2 border-teal-500/40 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xl relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div>
              <span className="text-xs font-bold text-teal-400 uppercase tracking-wider">
                Bộ số vừa khởi tạo thành công
              </span>
              <h2 className="text-lg font-bold text-slate-100">
                Gợi Ý Dữ Liệu Cho {currentSuggestion.lotteryType === 'mega645' ? 'Mega 6/45' : 'Power 6/55'}
              </h2>
            </div>
            <span className="text-xs text-slate-400">
              Khởi tạo lúc: {new Date(currentSuggestion.createdAt).toLocaleTimeString('vi-VN')}
            </span>
          </div>

          {/* 6 Balls Grid */}
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 p-4 bg-slate-950 rounded-xl border border-slate-800">
            {currentSuggestion.suggestedNumbers.map((item) => (
              <div key={item.number} className="text-center space-y-1 w-20">
                <NumberBall
                  number={item.number}
                  status="default"
                  size="xl"
                  isFavorite={favoriteNumbers.includes(item.number)}
                  onClick={() => toggleFavorite(item.number, selectedLottery)}
                />
                <span className="block text-[10px] text-teal-300 font-bold leading-tight">
                  {item.statSummary.split(',')[0]}
                </span>
              </div>
            ))}
          </div>

          {/* Detailed Item Reasoning */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {currentSuggestion.suggestedNumbers.map((item) => (
              <div
                key={item.number}
                className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800 text-xs space-y-1"
              >
                <div className="flex items-center justify-between font-bold text-slate-200">
                  <span className="text-teal-400">Quả bóng #{item.number < 10 ? `0${item.number}` : item.number}</span>
                  <span className="text-[10px] text-slate-500 font-normal">{item.statSummary}</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">{item.aiReasoning}</p>
              </div>
            ))}
          </div>

          {/* Overall Analysis & Disclaimer Notice */}
          <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-4 space-y-2 text-xs">
            <div className="font-bold text-slate-200 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-teal-400" />
              <span>Phân Tích Cấu Trúc Tổng Thể:</span>
            </div>
            <p className="text-slate-300 leading-relaxed">{currentSuggestion.overallAnalysis}</p>

            <div className="pt-2 border-t border-slate-800/80 flex items-start gap-2 text-[11px] text-slate-400">
              <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <span>{currentSuggestion.disclaimer}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
