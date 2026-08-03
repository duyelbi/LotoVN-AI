import React, { Suspense } from 'react';
import type { Metadata } from 'next';
import './globals.css';
import { AppProviders } from '@/components/providers/AppProviders';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';

export const metadata: Metadata = {
  title: {
    default: 'LotoVN AI — Minh Bạch Dữ Liệu & Giáo Dục Xác Suất Vietlott',
    template: '%s | LotoVN AI',
  },
  description:
    'Ứng dụng thống kê xổ số Mega 6/45 và Power 6/55 với trợ lý AI học thuật, minh bạch toán học xác suất, không tâm linh.',
};

/** Root layout: bọc `AppProviders`, render Navbar (sticky, cần Suspense vì dùng `useSearchParams`) + Footer chung cho mọi route. `{children}` là nội dung riêng của từng page. */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" className="dark">
      <body
        className="bg-slate-950 text-slate-100 antialiased selection:bg-teal-500/30 selection:text-teal-200"
        suppressHydrationWarning
      >
        <AppProviders>
          <div className="min-h-screen flex flex-col font-sans pb-20 md:pb-0">
            <Suspense fallback={<header className="h-16 bg-slate-950 border-b border-slate-800" />}>
              <Navbar />
            </Suspense>
            <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
              {children}
            </main>
            <Footer />
          </div>
        </AppProviders>
      </body>
    </html>
  );
}
