import React from 'react';
import type { Metadata } from 'next';
import { AdminDashboard } from '@/components/admin/AdminDashboard';

export const metadata: Metadata = {
  title: 'Quản Trị | LotoVN AI',
  robots: { index: false, follow: false },
};

/**
 * Trang admin (`/admin`) — nằm ngoài route group `(main)` nên KHÔNG có Navbar/Footer công
 * khai, tự lo layout riêng (xem `app/layout.tsx`). Gate thật nằm ở server
 * (`lib/admin-auth.ts` verify ID token trên mọi API route bên dưới), không dựa vào UI.
 */
export default function AdminPage() {
  return (
    <div className="min-h-screen max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <AdminDashboard />
    </div>
  );
}
