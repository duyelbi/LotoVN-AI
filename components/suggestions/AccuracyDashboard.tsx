import React, { Suspense } from 'react';
import Link from 'next/link';
import { LotteryType, SuggestionFilter } from '@/lib/types';
import { getSuggestionLogs } from '@/lib/db';
import { Skeleton } from '@/components/ui/skeleton';
import { CheckCircle2 } from 'lucide-react';

interface AccuracyDashboardProps {
  lotteryType: LotteryType;
  filter: SuggestionFilter;
}

const FILTER_TABS: { id: SuggestionFilter; label: string }[] = [
  { id: SuggestionFilter.All, label: 'Tất cả xổ số' },
  { id: SuggestionFilter.Mega645, label: 'Mega 6/45' },
  { id: SuggestionFilter.Power655, label: 'Power 6/55' },
];

/** Skeleton hiển thị trong lúc bảng đối soát độ chính xác đang fetch dữ liệu. */
function AccuracyDashboardSkeleton() {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <Skeleton className="h-6 w-72 bg-slate-800" />
        <Skeleton className="h-8 w-32 rounded-xl bg-slate-800" />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-20 rounded-xl bg-slate-800" />
        ))}
      </div>
    </div>
  );
}

/** Fetch nhật ký gợi ý theo `filter` rồi tính toán các chỉ số đối soát (đã khớp bao nhiêu, trung bình khớp...). */
async function AccuracyDashboardContent({ lotteryType, filter }: AccuracyDashboardProps) {
  const suggestionLogs = await getSuggestionLogs(
    filter === SuggestionFilter.All ? undefined : (filter as unknown as LotteryType)
  );

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

  const avgMatched = totalEvaluated > 0 ? (totalMatchedBalls / totalEvaluated).toFixed(2) : '0';

  return (
    <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-6 sm:p-8 space-y-6">
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-teal-400" />
            <span>Bảng Đối Soát Độ Chính Xác Lịch Sử (Accuracy Tracking)</span>
          </h2>
          <div className="flex items-center flex-wrap bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs shrink-0">
            {FILTER_TABS.map((item) => (
              <Link
                key={item.id}
                href={`/suggestions?type=${lotteryType}&filter=${item.id}`}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                  filter === item.id
                    ? 'bg-slate-800 text-teal-300 border border-slate-700 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
        <p className="text-xs text-slate-400 mt-1">
          LotoVN AI minh bạch 100%: Mỗi bộ số khi được tạo sẽ có trạng thái "Đang chờ kỳ quay". Ngay khi kết quả chính thức được cập nhật, hệ thống tự động tính số lượng bóng khớp.
        </p>
      </div>

      {/* Real Accuracy Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-center">
          <span className="text-[10px] uppercase font-bold text-slate-500 block">Đã đối soát</span>
          <span className="text-lg font-black text-slate-200 mt-1 block">{totalEvaluated} bộ</span>
        </div>
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-center">
          <span className="text-[10px] uppercase font-bold text-teal-400 block">Trung bình khớp</span>
          <span className="text-lg font-black text-teal-300 mt-1 block">{avgMatched} / 6 bóng</span>
        </div>
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-center">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">Khớp 1-2 bóng</span>
          <span className="text-lg font-black text-slate-300 mt-1 block">
            {matchCounts['1'] + matchCounts['2']} lần
          </span>
        </div>
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-center">
          <span className="text-[10px] uppercase font-bold text-emerald-400 block">Khớp 3 bóng (Giải ba)</span>
          <span className="text-lg font-black text-emerald-300 mt-1 block">{matchCounts['3']} lần</span>
        </div>
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-center col-span-2 sm:col-span-1">
          <span className="text-[10px] uppercase font-bold text-amber-400 block">Khớp &gt;= 4 bóng</span>
          <span className="text-lg font-black text-amber-300 mt-1 block">{matchCounts['4+']} lần</span>
        </div>
      </div>
    </div>
  );
}

/**
 * Bảng đối soát độ chính xác lịch sử trên trang Suggestions. Tự fetch dữ liệu và tự
 * bọc Suspense/Skeleton — page.tsx chỉ cần render `<AccuracyDashboard lotteryType={...} filter={...} />`.
 */
export function AccuracyDashboard(props: AccuracyDashboardProps) {
  return (
    <Suspense fallback={<AccuracyDashboardSkeleton />}>
      <AccuracyDashboardContent {...props} />
    </Suspense>
  );
}
