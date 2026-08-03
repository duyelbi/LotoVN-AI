import React from 'react';
import type { Metadata } from 'next';
import { EducationTab } from '@/components/EducationTab';

export const metadata: Metadata = {
  title: 'Học Xác Suất & Minh Bạch Dữ Liệu | LotoVN AI',
  description:
    'Hiểu đúng bản chất của sự kiện ngẫu nhiên độc lập, ngụy biện người đánh bạc và định luật số lớn trong xổ số Vietlott.',
};

/** Trang Education (`/education`) — nội dung tĩnh, không phụ thuộc lottery đang chọn. */
export default function EducationPage() {
  return <EducationTab />;
}
