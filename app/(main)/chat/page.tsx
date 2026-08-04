import React from 'react';
import type { Metadata } from 'next';
import { LotteryType } from '@/lib/types';
import { ChatTab } from '@/components/ChatTab';

export const metadata: Metadata = {
  title: 'Trợ Lý AI Thống Kê & Xác Suất',
  description:
    'Hỏi đáp bằng tiếng Việt tự nhiên với trợ lý AI grounded dữ liệu thực tế 30 kỳ quay gần nhất của Mega 6/45 và Power 6/55.',
  openGraph: {
    title: 'Trợ Lý AI Thống Kê & Xác Suất | LotoVN AI',
    description:
      'Hỏi đáp bằng tiếng Việt tự nhiên với trợ lý AI grounded dữ liệu thực tế 30 kỳ quay gần nhất của Mega 6/45 và Power 6/55.',
    url: '/chat',
  },
  twitter: {
    title: 'Trợ Lý AI Thống Kê & Xác Suất | LotoVN AI',
    description:
      'Hỏi đáp bằng tiếng Việt tự nhiên với trợ lý AI grounded dữ liệu thực tế 30 kỳ quay gần nhất của Mega 6/45 và Power 6/55.',
  },
};

interface PageProps {
  searchParams?: Promise<{
    type?: string;
  }>;
}

/** Trang Chat (`/chat`) — chỉ parse `?type=` từ URL rồi render `<ChatTab />`. */
export default async function ChatPage(props: PageProps) {
  const searchParams = await props.searchParams;
  const rawType = searchParams?.type;
  const selectedLottery: LotteryType = rawType === 'power655' ? 'power655' : 'mega645';

  return <ChatTab selectedLottery={selectedLottery} />;
}
