'use client';

import React, { useState } from 'react';
import { Cpu, Play, RotateCcw, CheckCircle2 } from 'lucide-react';

/**
 * Mô phỏng Monte Carlo ngay trên trình duyệt (không gọi API) minh hoạ Định luật
 * Số Lớn cho Mega 6/45: quay ngẫu nhiên N kỳ giả lập, cho thấy mọi con số hội tụ
 * về cùng một tần suất kỳ vọng ~13.3%.
 */
export const MonteCarloSimulator: React.FC = () => {
  const [simDrawsCount, setSimDrawsCount] = useState<number>(0);
  const [simResults, setSimResults] = useState<{
    number: number;
    count: number;
    percent: string;
  }[]>([]);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);

  const runSimulation = (total: number) => {
    setIsSimulating(true);
    setTimeout(() => {
      const ballsCount = 45; // Mega 6/45
      const counts = new Array(ballsCount + 1).fill(0);

      for (let i = 0; i < total; i++) {
        const drawn = new Set<number>();
        while (drawn.size < 6) {
          const ball = Math.floor(Math.random() * ballsCount) + 1;
          drawn.add(ball);
        }
        drawn.forEach((ball) => counts[ball]++);
      }

      const results = [];
      for (let num = 1; num <= ballsCount; num++) {
        results.push({
          number: num,
          count: counts[num],
          percent: ((counts[num] / total) * 100).toFixed(1),
        });
      }

      setSimResults(results);
      setSimDrawsCount(total);
      setIsSimulating(false);
    }, 150);
  };

  return (
    <div className="bg-slate-900/90 border-2 border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-100 flex items-center gap-2">
            <Cpu className="w-5 h-5 text-teal-400" />
            <span>Phòng Thí Nghiệm: Mô Phỏng Quay Số Monte Carlo (Mega 6/45)</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Khám phá Định luật Số Lớn (Law of Large Numbers): Khi số kỳ quay càng lớn, tần suất xuất hiện của mọi con bóng đều hội tụ về mức trung bình ngang bằng nhau.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => runSimulation(1000)}
            disabled={isSimulating}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition-colors cursor-pointer"
          >
            1,000 Kỳ
          </button>
          <button
            type="button"
            onClick={() => runSimulation(10000)}
            disabled={isSimulating}
            className="px-4 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs font-extrabold transition-colors cursor-pointer shadow-md"
          >
            10,000 Kỳ
          </button>
          {simDrawsCount > 0 && (
            <button
              type="button"
              onClick={() => {
                setSimResults([]);
                setSimDrawsCount(0);
              }}
              className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-slate-200"
              title="Làm mới"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {simDrawsCount === 0 ? (
        <div className="bg-slate-950 border border-dashed border-slate-800 rounded-2xl p-10 text-center space-y-3">
          <Play className="w-8 h-8 text-teal-400 mx-auto opacity-80" />
          <h3 className="text-sm font-bold text-slate-300">
            Nhấn nút &quot;1,000 Kỳ&quot; hoặc &quot;10,000 Kỳ&quot; để bắt đầu kiểm chứng
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Hệ thống sẽ giả lập lồng cầu quay ngẫu nhiên ngay trên trình duyệt của bạn để kiểm chứng xem liệu có số nào &quot;được ưu ái&quot; hơn các số khác hay không.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-400 bg-slate-950 px-4 py-2.5 rounded-xl border border-slate-800">
            <span>Đã mô phỏng: {simDrawsCount.toLocaleString()} kỳ quay ngẫu nhiên</span>
            <span className="text-teal-400">
              Kỳ vọng lý thuyết mỗi số: ~13.33% ({Math.round((simDrawsCount * 6) / 45)} lần)
            </span>
          </div>

          <div className="grid grid-cols-5 sm:grid-cols-9 md:grid-cols-15 gap-2 max-h-72 overflow-y-auto p-2 bg-slate-950/60 rounded-xl border border-slate-800">
            {simResults.map((res) => {
              const diff = Math.abs(parseFloat(res.percent) - 13.3);
              return (
                <div
                  key={res.number}
                  className="bg-slate-900 border border-slate-800 rounded-lg p-2 text-center"
                >
                  <div className="text-xs font-black text-slate-200">
                    #{res.number < 10 ? `0${res.number}` : res.number}
                  </div>
                  <div
                    className={`text-[11px] font-bold mt-1 ${
                      diff < 0.8 ? 'text-emerald-400' : 'text-slate-400'
                    }`}
                  >
                    {res.percent}%
                  </div>
                  <div className="text-[9px] text-slate-600">{res.count} lần</div>
                </div>
              );
            })}
          </div>

          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3.5 flex items-start gap-3 text-xs text-emerald-300">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <strong>Kết luận kiểm chứng:</strong> Khi chạy đủ {simDrawsCount.toLocaleString()} kỳ, toàn bộ 45 số đều dao động quanh ngưỡng 13.3%. Điều này chứng minh rằng &quot;số nóng&quot; trong ngắn hạn chỉ là biến động thống kê ngẫu nhiên, không phải là thuộc tính cố định của con số.
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
