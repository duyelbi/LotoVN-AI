import React, { Suspense } from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';

/**
 * Layout cho nhóm route công khai — `/`, `/suggestions`, `/chat`, `/education` — render
 * Navbar (sticky, cần Suspense vì dùng `useSearchParams`) + Footer. Route group `(main)`
 * không xuất hiện trong URL. `/admin` nằm ngoài group này nên không kế thừa Navbar/Footer.
 */
export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col font-sans pb-20 md:pb-0">
      <Suspense fallback={<header className="h-16 bg-slate-950 border-b border-slate-800" />}>
        <Navbar />
      </Suspense>
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {children}
      </main>
      <Footer />
    </div>
  );
}
