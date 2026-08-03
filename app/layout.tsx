import type {Metadata} from 'next';
import './globals.css'; // Global styles

export const metadata: Metadata = {
  title: 'LotoVN AI — Minh Bạch Dữ Liệu & Giáo Dục Xác Suất Vietlott',
  description: 'Ứng dụng thống kê xổ số Mega 6/45 và Power 6/55 với trợ lý AI học thuật, minh bạch toán học xác suất, không tâm linh.',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="vi" className="dark">
      <body className="bg-slate-950 text-slate-100 antialiased" suppressHydrationWarning>{children}</body>
    </html>
  );
}
