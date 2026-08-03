'use client';

import React from 'react';
import { ShieldCheck, Cpu, Database } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-950 border-t border-slate-800/80 py-10 mt-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
          <div className="space-y-1.5">
            <div className="flex items-center justify-center md:justify-start gap-2">
              <div className="w-6 h-6 rounded-lg bg-teal-500/20 text-teal-400 font-black flex items-center justify-center text-xs">
                VN
              </div>
              <span className="font-bold text-slate-200 text-sm">
                LotoVN <span className="text-teal-400">AI</span>
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-900 border border-slate-800 text-slate-400">
                Minh Bạch Dữ Liệu
              </span>
            </div>
            <p className="text-xs text-slate-500 max-w-md">
              Ứng dụng thống kê học thuật và giáo dục xác suất xổ số Vietlott (Mega 6/45 & Power 6/55). Tích hợp MongoDB, Recharts & Google Gemini.
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs text-slate-400">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-teal-400" />
              <span>Không tâm linh</span>
            </div>
            <span>•</span>
            <div className="flex items-center gap-1.5">
              <Cpu className="w-4 h-4 text-indigo-400" />
              <span>AI Grounded</span>
            </div>
            <span>•</span>
            <div className="flex items-center gap-1.5">
              <Database className="w-4 h-4 text-sky-400" />
              <span>MongoDB / Seed</span>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-600 gap-4">
          <p>
            © {new Date().getFullYear()} LotoVN AI. Các kỳ quay xổ số là sự kiện ngẫu nhiên độc lập 100%.
          </p>
          <p className="text-slate-500">
            Thống kê chỉ để tham khảo học thuật • Không có công thức hay AI nào dự báo được kết quả tương lai
          </p>
        </div>
      </div>
    </footer>
  );
};
