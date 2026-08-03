import React from 'react';
import type { Metadata } from 'next';
import './globals.css';
import { AppProviders } from '@/components/providers/AppProviders';

export const metadata: Metadata = {
  title: {
    default: 'LotoVN AI — Minh Bạch Dữ Liệu & Giáo Dục Xác Suất Vietlott',
    template: '%s | LotoVN AI',
  },
  description:
    'Ứng dụng thống kê xổ số Mega 6/45 và Power 6/55 với trợ lý AI học thuật, minh bạch toán học xác suất, không tâm linh.',
};

/**
 * Root layout thật (áp dụng cho MỌI route, kể cả `/admin`) — chỉ `<html>/<body>` +
 * `AppProviders`. Navbar/Footer KHÔNG nằm ở đây nữa — chuyển sang `app/(main)/layout.tsx`
 * để `/admin` không kế thừa nav công khai (tránh hydration mismatch khi `/admin` redirect
 * client-side, và đúng ý: admin là luồng tách biệt, không có link/chrome trỏ qua lại).
 */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" className="dark">
      <body
        className="bg-slate-950 text-slate-100 antialiased selection:bg-teal-500/30 selection:text-teal-200"
        suppressHydrationWarning
      >
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
