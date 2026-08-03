import React, { Suspense } from 'react';
import { LotteryType, TimeRange } from '@/lib/types';
import { getDraws } from '@/lib/db';
import { NumberBall } from '@/components/NumberBall';
import { Skeleton } from '@/components/ui/skeleton';
import { History } from 'lucide-react';

interface DrawHistoryTableProps {
  lotteryType: LotteryType;
  range: TimeRange;
}

/** Skeleton hiển thị trong lúc lịch sử quay thưởng đang fetch dữ liệu. */
function DrawHistorySkeleton() {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-4">
      <Skeleton className="h-6 w-48 bg-slate-800" />
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-12 w-full rounded-xl bg-slate-800" />
        ))}
      </div>
    </div>
  );
}

/** Fetch danh sách kỳ quay rồi render bảng (desktop) / card list (mobile). */
async function DrawHistoryTableContent({ lotteryType, range }: DrawHistoryTableProps) {
  const draws = await getDraws(lotteryType, range);

  return (
    <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-5 sm:p-6 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
        <h3 className="font-bold text-slate-100 text-base flex items-center gap-2">
          <History className="w-4 h-4 text-teal-400 shrink-0" />
          <span>Lịch Sử Quay Thưởng ({draws.length} kỳ gần nhất)</span>
        </h3>
        <span className="text-xs text-slate-400 font-medium">
          Dữ liệu đối soát minh bạch
        </span>
      </div>

      {/* Desktop Table (>= 640px) */}
      <div className="hidden sm:block overflow-x-auto rounded-xl border border-slate-800">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-950 text-slate-400 uppercase font-semibold text-[11px] border-b border-slate-800">
            <tr>
              <th className="py-3 px-4">Kỳ quay</th>
              <th className="py-3 px-4">Ngày quay</th>
              <th className="py-3 px-4">Bộ số trúng thưởng</th>
              <th className="py-3 px-4 text-right">Ước tính Jackpot</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 bg-slate-900/40">
            {draws.map((draw) => (
              <tr key={draw.id} className="hover:bg-slate-800/40 transition-colors">
                <td className="py-3.5 px-4 font-bold text-teal-300">{draw.id}</td>
                <td className="py-3.5 px-4 text-slate-400">{draw.drawDate}</td>
                <td className="py-3.5 px-4">
                  <div className="flex flex-wrap items-center gap-1.5">
                    {draw.numbers.map((n) => (
                      <NumberBall key={n} number={n} status="default" size="sm" />
                    ))}
                    {draw.bonusNumber && (
                      <div className="flex items-center gap-1 ml-1 pl-2 border-l border-slate-800">
                        <span className="text-[10px] text-sky-400 font-medium">Bonus</span>
                        <NumberBall number={draw.bonusNumber} status="bonus" size="sm" />
                      </div>
                    )}
                  </div>
                </td>
                <td className="py-3.5 px-4 text-right font-bold text-amber-400">
                  {(draw.jackpotValue / 1000000000).toFixed(1)} Tỷ
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card List (< 640px) */}
      <div className="sm:hidden space-y-3">
        {draws.map((draw) => (
          <div key={draw.id} className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-teal-300">{draw.id}</span>
              <span className="text-slate-400">{draw.drawDate}</span>
            </div>
            <div className="flex flex-wrap items-center gap-1.5 py-1">
              {draw.numbers.map((n) => (
                <NumberBall key={n} number={n} status="default" size="sm" />
              ))}
              {draw.bonusNumber && (
                <div className="flex items-center gap-1 ml-1 pl-1.5 border-l border-slate-800">
                  <NumberBall number={draw.bonusNumber} status="bonus" size="sm" />
                </div>
              )}
            </div>
            <div className="text-right text-xs font-bold text-amber-400">
              Jackpot: {(draw.jackpotValue / 1000000000).toFixed(1)} Tỷ VNĐ
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Bảng lịch sử quay thưởng trên Dashboard (bảng ở desktop, card list ở mobile).
 * Tự fetch dữ liệu và tự bọc Suspense/Skeleton — page.tsx chỉ cần render
 * `<DrawHistoryTable lotteryType={...} range={...} />`.
 */
export function DrawHistoryTable(props: DrawHistoryTableProps) {
  return (
    <Suspense fallback={<DrawHistorySkeleton />}>
      <DrawHistoryTableContent {...props} />
    </Suspense>
  );
}
