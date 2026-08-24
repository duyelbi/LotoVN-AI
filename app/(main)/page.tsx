import React from 'react';
import type { Metadata } from 'next';
import { LotteryType, TimeRange, TIME_RANGE_OPTIONS, DEFAULT_TIME_RANGE } from '@/lib/types';
import { DashboardControls } from '@/components/dashboard/DashboardControls';
import { KpiCards } from '@/components/dashboard/KpiCards';
import { FrequencyChart } from '@/components/dashboard/FrequencyChart';
import { OverdueChart } from '@/components/dashboard/OverdueChart';
import { NumberMatrix } from '@/components/dashboard/NumberMatrix';
import { DrawHistoryTable } from '@/components/dashboard/DrawHistoryTable';

export const metadata: Metadata = {
  title: 'Thống Kê & Tần Suất Vietlott',
  description:
    'Bảng tần suất xuất hiện, thống kê số nóng, số gan lâu chưa về, phân bố chẵn/lẻ và cao/thấp cho Vietlott Mega 6/45 và Power 6/55.',
  openGraph: {
    title: 'Thống Kê & Tần Suất Vietlott | LotoVN AI',
    description:
      'Bảng tần suất xuất hiện, thống kê số nóng, số gan lâu chưa về, phân bố chẵn/lẻ và cao/thấp cho Vietlott Mega 6/45 và Power 6/55.',
    url: '/',
  },
  twitter: {
    title: 'Thống Kê & Tần Suất Vietlott | LotoVN AI',
    description:
      'Bảng tần suất xuất hiện, thống kê số nóng, số gan lâu chưa về, phân bố chẵn/lẻ và cao/thấp cho Vietlott Mega 6/45 và Power 6/55.',
  },
};

interface PageProps {
  searchParams?: Promise<{
    type?: string;
    range?: string;
  }>;
}

/** Trang Dashboard (`/`). Mỗi khối UI bên dưới tự fetch dữ liệu và tự stream qua Suspense riêng — trang này chỉ parse searchParams rồi compose lại. */
export default async function DashboardPage(props: PageProps) {
  const searchParams = await props.searchParams;
  const rawType = searchParams?.type;
  const selectedLottery: LotteryType = rawType === 'power655' ? 'power655' : 'mega645';

  const rawRange = searchParams?.range;
  const parsedRange = rawRange === 'all' ? 'all' : (rawRange ? parseInt(rawRange, 10) : DEFAULT_TIME_RANGE);
  const range: TimeRange = TIME_RANGE_OPTIONS.includes(parsedRange as TimeRange)
    ? (parsedRange as TimeRange)
    : DEFAULT_TIME_RANGE;

  return (
    <div className="space-y-8 pb-12">
      <DashboardControls selectedLottery={selectedLottery} range={range} />
      <KpiCards lotteryType={selectedLottery} range={range} />
      
      <DrawHistoryTable lotteryType={selectedLottery} range={range} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <FrequencyChart lotteryType={selectedLottery} range={range} />
        <OverdueChart lotteryType={selectedLottery} range={range} />
      </div>

      <NumberMatrix lotteryType={selectedLottery} range={range} />
    </div>
  );
}
