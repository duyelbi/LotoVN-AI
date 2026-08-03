import React from 'react';
import type { Metadata } from 'next';
import { LotteryType, SuggestionFilter, DEFAULT_SUGGESTION_FILTER } from '@/lib/types';
import { SuggestionGeneratorCard } from '@/components/suggestions/SuggestionGeneratorCard';
import { AccuracyDashboard } from '@/components/suggestions/AccuracyDashboard';
import { SuggestionLogList } from '@/components/suggestions/SuggestionLogList';

export const metadata: Metadata = {
  title: 'Bộ Gợi Ý & Kiểm Chứng Độ Chính Xác | LotoVN AI',
  description:
    'Tạo bộ số gợi ý cân bằng thuật toán và theo dõi tỷ lệ trúng thực tế đối soát tự động khi có kết quả mới.',
};

interface PageProps {
  searchParams?: Promise<{
    type?: string;
    filter?: string;
  }>;
}

/** Trang Suggestions (`/suggestions`). Mỗi khối UI bên dưới tự fetch dữ liệu và tự stream qua Suspense riêng — trang này chỉ parse searchParams rồi compose lại. */
export default async function SuggestionsPage(props: PageProps) {
  const searchParams = await props.searchParams;
  const rawType = searchParams?.type;
  const selectedLottery: LotteryType = rawType === 'power655' ? 'power655' : 'mega645';

  const rawFilter = searchParams?.filter;
  const filter: SuggestionFilter =
    rawFilter === SuggestionFilter.Mega645 || rawFilter === SuggestionFilter.Power655
      ? rawFilter
      : DEFAULT_SUGGESTION_FILTER;

  return (
    <div className="space-y-10 pb-12">
      <SuggestionGeneratorCard selectedLottery={selectedLottery} />
      <AccuracyDashboard lotteryType={selectedLottery} filter={filter} />
      <SuggestionLogList lotteryType={selectedLottery} filter={filter} />
    </div>
  );
}
