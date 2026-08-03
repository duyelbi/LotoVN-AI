import React, { Suspense } from 'react';
import { LotteryType, TimeRange } from '@/lib/types';
import { getLotteryStats } from '@/lib/db';
import { NumberBall } from '@/components/NumberBall';
import { Skeleton } from '@/components/ui/skeleton';
import { Flame, Clock, AlertTriangle } from 'lucide-react';

interface KpiCardsProps {
  lotteryType: LotteryType;
  range: TimeRange;
}

/** Skeleton hiển thị trong lúc `KpiCardsContent` đang fetch dữ liệu. */
function KpiCardsSkeleton() {
  return (
    <div className="space-y-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-4">
        <div className="flex justify-between items-center">
          <Skeleton className="h-5 w-48 bg-slate-800" />
          <Skeleton className="h-6 w-32 bg-slate-800" />
        </div>
        <div className="flex flex-wrap gap-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-10 w-10 rounded-full bg-slate-800" />
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((card) => (
          <div key={card} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
            <Skeleton className="h-5 w-36 bg-slate-800" />
            <Skeleton className="h-4 w-full bg-slate-800" />
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5, 6].map((b) => (
                <Skeleton key={b} className="h-8 w-8 rounded-full bg-slate-800" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Fetch số liệu và render khối "Kết quả mới nhất" + 3 card Nóng/Lạnh/Gan. */
async function KpiCardsContent({ lotteryType, range }: KpiCardsProps) {
  const statsData = await getLotteryStats(lotteryType, range);
  const { latestDraw, hotNumbers, coldNumbers, overdueNumbers } = statsData;

  return (
    <div className="space-y-4">
      {/* SECTION 1: LATEST DRAW SUMMARY */}
      {latestDraw && (
        <div className="bg-gradient-to-r from-slate-900 via-slate-900/90 to-slate-900 border border-slate-800/90 rounded-2xl p-5 sm:p-6 shadow-lg">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-teal-400 uppercase tracking-wider">
                  Kỳ quay gần nhất #{latestDraw.id}
                </span>
                <span className="text-slate-500 text-xs">• {latestDraw.drawDate}</span>
              </div>
              <h2 className="text-base font-bold text-slate-200 mt-0.5">
                Kết Quả Mới Nhất Dữ Liệu
              </h2>
            </div>
            <div className="text-left sm:text-right">
              <span className="text-xs text-slate-400">Ước tính Jackpot:</span>
              <div className="text-base sm:text-lg font-black text-amber-400">
                {(latestDraw.jackpotValue / 1000000000).toFixed(1)} Tỷ VNĐ
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3 bg-slate-950/80 p-4 rounded-xl border border-slate-800/80">
            {latestDraw.numbers.map((num) => (
              <NumberBall
                key={num}
                number={num}
                status="default"
                size="lg"
              />
            ))}
            {latestDraw.bonusNumber && (
              <div className="flex items-center gap-2 ml-2 pl-3 border-l border-slate-800">
                <span className="text-xs text-sky-400 font-semibold">Bonus:</span>
                <NumberBall
                  number={latestDraw.bonusNumber}
                  status="bonus"
                  size="lg"
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* SECTION 2: HOT / COLD / GAN SUMMARY CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Hot Numbers Card */}
        <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Flame className="w-5 h-5 text-teal-400" />
              <h3 className="font-bold text-slate-200 text-sm">Top Số Nóng ({range} kỳ)</h3>
            </div>
            <span className="text-[11px] text-teal-400 font-semibold bg-teal-500/10 px-2 py-0.5 rounded-full border border-teal-500/20">
              Tần suất cao
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Các con số xuất hiện với số lần nhiều nhất trong {range} kỳ vừa qua.
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            {hotNumbers.map((stat) => (
              <div key={stat.number} className="text-center">
                <NumberBall
                  number={stat.number}
                  status="hot"
                  size="md"
                />
                <span className="block text-[10px] text-teal-400 font-bold mt-1">
                  {stat.count} lần
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Cold Numbers Card */}
        <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-indigo-400" />
              <h3 className="font-bold text-slate-200 text-sm">Top Số Lạnh ({range} kỳ)</h3>
            </div>
            <span className="text-[11px] text-indigo-400 font-semibold bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20">
              Tần suất thấp
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Các con số xuất hiện ít lần nhất trong chuỗi {range} kỳ phân tích.
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            {coldNumbers.map((stat) => (
              <div key={stat.number} className="text-center">
                <NumberBall
                  number={stat.number}
                  status="cold"
                  size="md"
                />
                <span className="block text-[10px] text-slate-400 font-bold mt-1">
                  {stat.count} lần
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Overdue / Gan Card */}
        <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
              <h3 className="font-bold text-slate-200 text-sm">Số Gan Lâu Chưa Về</h3>
            </div>
            <span className="text-[11px] text-amber-400 font-semibold bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
              Số kỳ vắng mặt
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Số kỳ liên tiếp trôi qua mà con số chưa từng quay lại trong lồng cầu.
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            {overdueNumbers.slice(0, 6).map((stat) => (
              <div key={stat.number} className="text-center">
                <NumberBall
                  number={stat.number}
                  status="gan_cuc_dai"
                  size="md"
                  drought={stat.drought}
                  showDroughtBadge
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Khối "Kết quả mới nhất" + 3 card Nóng/Lạnh/Gan trên Dashboard.
 * Tự fetch dữ liệu và tự bọc Suspense/Skeleton — page.tsx chỉ cần render
 * `<KpiCards lotteryType={...} range={...} />`, không cần import Skeleton riêng.
 */
export function KpiCards(props: KpiCardsProps) {
  return (
    <Suspense fallback={<KpiCardsSkeleton />}>
      <KpiCardsContent {...props} />
    </Suspense>
  );
}
