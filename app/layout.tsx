import React from 'react';
import type { Metadata } from 'next';
import './globals.css';
import { AppProviders } from '@/components/providers/AppProviders';

const appUrl = process.env.APP_URL || 'https://lotovn-ai-308915299258.asia-southeast1.run.app';

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: {
    default: 'LotoVN AI — Thống Kê Minh Bạch & Giáo Dục Xác Suất Vietlott',
    template: '%s | LotoVN AI',
  },
  description:
    'Ứng dụng thống kê xổ số Vietlott Mega 6/45 và Power 6/55 với trợ lý AI học thuật, minh bạch toán học xác suất, phân tích số nóng/gan, không yếu tố tâm linh.',
  keywords: [
    'thống kê vietlott',
    'mega 645',
    'power 655',
    'xác suất vietlott',
    'loto vietlott ai',
    'tần suất số gan',
    'thống kê xổ số',
    'giáo dục xác suất',
  ],
  authors: [{ name: 'LotoVN AI Team' }],
  creator: 'LotoVN AI',
  publisher: 'LotoVN AI',
  icons: {
    icon: '/icon.png',
    shortcut: '/icon.png',
    apple: '/icon.png',
  },
  openGraph: {
    type: 'website',
    locale: 'vi_VN',
    url: appUrl,
    siteName: 'LotoVN AI',
    title: 'LotoVN AI — Thống Kê Minh Bạch & Giáo Dục Xác Suất Vietlott',
    description:
      'Nền tảng thống kê dữ liệu minh bạch và giáo dục xác suất Vietlott Mega 6/45 & Power 6/55 với Trợ lý AI học thuật.',
    images: [
      {
        url: '/logo.png',
        width: 1024,
        height: 1024,
        alt: 'LotoVN AI Logo',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'LotoVN AI — Minh Bạch Dữ Liệu Vietlott',
    description: 'Thống kê tần suất, phân tích xác suất học thuật Vietlott Mega 6/45 & Power 6/55.',
    images: ['/logo.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'LotoVN AI',
  applicationCategory: 'EducationalApplication',
  operatingSystem: 'All',
  description: 'Ứng dụng thống kê minh bạch dữ liệu & giáo dục xác suất cho xổ số Vietlott (Mega 6/45, Power 6/55).',
  url: appUrl,
  inLanguage: 'vi',
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
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body
        className="bg-slate-950 text-slate-100 antialiased selection:bg-teal-500/30 selection:text-teal-200"
        suppressHydrationWarning
      >
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
