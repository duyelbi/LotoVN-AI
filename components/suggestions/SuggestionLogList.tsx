import React, { Suspense } from 'react';
import { LotteryType, SuggestionFilter } from '@/lib/types';
import { getSuggestionLogs } from '@/lib/db';
import { NumberBall } from '@/components/NumberBall';
import { Skeleton } from '@/components/ui/skeleton';
import { Clock, CheckCircle2, History } from 'lucide-react';

interface SuggestionLogListProps {
  lotteryType: LotteryType;
  filter: SuggestionFilter;
}

/** Skeleton hiển thị trong lúc nhật ký gợi ý đang fetch dữ liệu. */
function SuggestionLogListSkeleton() {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-4">
      <Skeleton className="h-6 w-56 bg-slate-800" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-44 rounded-xl bg-slate-800" />
        ))}
      </div>
    </div>
  );
}

/** Fetch nhật ký gợi ý theo `filter` rồi render danh sách card kết quả đối chiếu. */
async function SuggestionLogListContent({ lotteryType, filter }: SuggestionLogListProps) {
  const suggestionLogs = await getSuggestionLogs(
    filter === SuggestionFilter.All ? undefined : (filter as unknown as LotteryType)
  );

  return (
    <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-6 sm:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
        <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
          <History className="w-4 h-4 text-teal-400 shrink-0" />
          <span>Nhật Ký Các Bộ Số Đã Gợi Ý ({suggestionLogs.length})</span>
        </h3>
        <span className="text-xs text-slate-400">
          Cập nhật tự động theo kết quả chính thức
        </span>
      </div>

      {suggestionLogs.length === 0 ? (
        <div className="text-center py-12 text-slate-500 text-sm">
          Chưa có nhật ký gợi ý nào cho lựa chọn này. Hãy bấm "Tạo Bộ Số Gợi Ý" ở trên!
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {suggestionLogs.map((log) => {
            const isEvaluated = log.status === 'evaluated';
            const matchedSet = new Set(log.matchedNumbers || []);

            return (
              <div
                key={log.id}
                className={`p-5 rounded-2xl border transition-all space-y-3 ${
                  isEvaluated
                    ? (log.matchCount || 0) >= 3
                      ? 'bg-emerald-950/20 border-emerald-500/30'
                      : 'bg-slate-950 border-slate-800'
                    : 'bg-slate-950/60 border-slate-800/80'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-teal-400">
                      {log.lotteryType === 'mega645' ? 'Mega 6/45' : 'Power 6/55'}
                    </span>
                    <span className="text-slate-500">•</span>
                    <span className="text-slate-400">
                      {new Date(log.createdAt).toLocaleDateString('vi-VN')}
                    </span>
                  </div>

                  {isEvaluated ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                      <CheckCircle2 className="w-3 h-3" />
                      Đối soát: Khớp {log.matchCount} số (Kỳ {log.targetDrawId})
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/30">
                      <Clock className="w-3 h-3" />
                      Đang chờ kỳ quay mới
                    </span>
                  )}
                </div>

                {/* 6 Balls Grid */}
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  {log.suggestedNumbers.map((item) => {
                    const isHit = matchedSet.has(item.number);
                    return (
                      <NumberBall
                        key={item.number}
                        number={item.number}
                        status={isHit ? 'matched' : 'default'}
                        size="md"
                      />
                    );
                  })}
                </div>

                {/* Accuracy Note */}
                {isEvaluated && (
                  <p className="text-[11px] text-slate-400 border-t border-slate-800/60 pt-2 leading-relaxed">
                    {(log.matchCount || 0) >= 3 ? (
                      <span className="text-emerald-300 font-semibold">
                        🎉 Bộ số trúng giải! Khớp {log.matchCount} con số ({log.matchedNumbers?.join(', ')}).
                      </span>
                    ) : (log.matchCount || 0) > 0 ? (
                      <span>Khớp {log.matchCount} con số ({log.matchedNumbers?.join(', ')}). Tiếp tục theo dõi chu kỳ kế tiếp.</span>
                    ) : (
                      <span>Kỳ này chưa khớp con số nào. Xác suất độc lập luôn biến động ngẫu nhiên.</span>
                    )}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/**
 * Danh sách nhật ký các bộ số đã gợi ý trên trang Suggestions. Tự fetch dữ liệu và tự
 * bọc Suspense/Skeleton — page.tsx chỉ cần render `<SuggestionLogList lotteryType={...} filter={...} />`.
 */
export function SuggestionLogList(props: SuggestionLogListProps) {
  return (
    <Suspense fallback={<SuggestionLogListSkeleton />}>
      <SuggestionLogListContent {...props} />
    </Suspense>
  );
}
