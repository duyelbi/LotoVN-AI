import React from 'react';
import { BookOpen } from 'lucide-react';
import { MonteCarloSimulator } from './MonteCarloSimulator';

/**
 * Nội dung trang Education (`/education`): giáo dục xác suất tĩnh (sự kiện độc lập,
 * ngụy biện người đánh bạc, bảng so sánh xác suất) + `<MonteCarloSimulator />` (client island).
 * Không phụ thuộc lottery đang chọn — nội dung giống nhau cho cả Mega 6/45 và Power 6/55.
 */
export const EducationTab: React.FC = () => {
  return (
    <div className="space-y-10 pb-16">
      {/* Top Banner */}
      <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-6 sm:p-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/30 text-sky-400 text-xs font-semibold uppercase tracking-wider mb-3">
          <BookOpen className="w-3.5 h-3.5" />
          <span>Học Xác Suất & Minh Bạch Dữ Liệu</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-100 tracking-tight">
          Xổ Số Hoạt Động Như Thế Nào &amp; Tại Sao Không Có &quot;Công Thức Trúng&quot;?
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-2 max-w-3xl leading-relaxed">
          Triết lý của LotoVN AI là minh bạch tuyệt đối về thống kê toán học. Nền tảng này giúp bạn hiểu đúng bản chất của sự kiện ngẫu nhiên độc lập, nhận diện các ngụy biện tâm lý phổ biến và đọc hiểu dữ liệu một cách có trách nhiệm.
        </p>
      </div>

      {/* SECTION 1: INTERACTIVE MONTE CARLO SIMULATOR ISLAND */}
      <MonteCarloSimulator />

      {/* SECTION 2: CORE EDUCATIONAL LESSONS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Lesson 1: Independent Random Events */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-3">
          <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/30 text-teal-400 flex items-center justify-center font-bold text-sm">
            01
          </div>
          <h3 className="text-base font-bold text-slate-100">
            Sự Kiện Ngẫu Nhiên Độc Lập (Independent Events)
          </h3>
          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
            Trong một hệ thống quay số lồng cầu công bằng, mỗi kỳ quay là một sự kiện hoàn toàn độc lập với tất cả các kỳ quay trước đó. Quả bóng không có &quot;trí nhớ&quot;. Việc một số chưa xuất hiện trong 20 kỳ liên tiếp (số gan) KHÔNG làm tăng xác suất xuất hiện của nó trong kỳ thứ 21.
          </p>
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs text-teal-300">
            <strong>Ví dụ trực quan:</strong> Khi tung một đồng xu công bằng, nếu bạn nhận được 5 lần ngửa liên tiếp, xác suất ra ngửa ở lần thứ 6 vẫn đúng bằng 50%, không hề thay đổi.
          </div>
        </div>

        {/* Lesson 2: Gambler's Fallacy */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center font-bold text-sm">
            02
          </div>
          <h3 className="text-base font-bold text-slate-100">
            Ngụy Biện Của Người Đánh Bạc (The Gambler&apos;s Fallacy)
          </h3>
          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
            Đây là niềm tin sai lầm rằng nếu một sự kiện xảy ra thường xuyên hơn mức bình thường trong quá khứ, nó sẽ &quot;phải&quot; ít xảy ra hơn trong tương lai (hoặc ngược lại) để &quot;cân bằng&quot;.
          </p>
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs text-amber-300">
            <strong>Lời khuyên khoa học:</strong> Đừng bao giờ đặt cược số tiền vượt kiểm soát chỉ vì tin rằng một con &quot;số gan cực đại&quot; đã sắp đến lúc &quot;bắt buộc phải về&quot;.
          </div>
        </div>

        {/* Lesson 3: Why match rates are 0-2 numbers */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 flex items-center justify-center font-bold text-sm">
            03
          </div>
          <h3 className="text-base font-bold text-slate-100">
            Phổ Phân Bố Siêu Bội: Tại Sao Thường Chỉ Khớp 0 - 2 Số?
          </h3>
          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
            Nhiều người ngạc nhiên khi thấy bộ số chọn theo thống kê thường chỉ khớp 0 đến 2 bóng. Trên thực tế, đây chính là minh chứng cho tính trung thực của toán học xác suất: tổng xác suất khớp 0, 1 hoặc 2 số chiếm hơn <strong>98.4%</strong> tổng số khả năng xảy ra!
          </p>
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs text-indigo-300">
            <strong>Sự minh bạch của LotoVN AI:</strong> Chúng tôi không giấu giếm các lần gợi ý khớp 0 hoặc 1 số, vì đó chính là thực tế khách quan của mọi hệ thống xổ số.
          </div>
        </div>

        {/* Lesson 4: Perspective on 1 in 8.14 Million */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-3">
          <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/30 text-sky-400 flex items-center justify-center font-bold text-sm">
            04
          </div>
          <h3 className="text-base font-bold text-slate-100">
            Học Cách Đọc Hiểu Số Liệu Có Trách Nhiệm
          </h3>
          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
            Thống kê lịch sử là một công cụ tuyệt vời để khám phá toán học, rèn luyện tư duy phân tích dữ liệu và thỏa mãn trí tò mò khoa học. Hãy coi xổ số như một hình thức giải trí nhỏ nhặt, không phải là kênh đầu tư hay chiến lược tài chính.
          </p>
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs text-sky-300">
            <strong>Trách nhiệm:</strong> Luôn đặt giới hạn chi tiêu giải trí rõ ràng và dừng lại khi cảm thấy mệt mỏi hoặc căng thẳng.
          </div>
        </div>
      </div>

      {/* SECTION 3: COMPARISON TABLE */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 sm:p-8">
        <h3 className="text-lg font-bold text-slate-100 mb-2">
          Bảng So Sánh Xác Suất: Trúng Jackpot vs Các Sự Kiện Trong Đời Sống
        </h3>
        <p className="text-xs text-slate-400 mb-6">
          Giúp bạn hình dung con số 1 trên 8.14 triệu và 1 trên 28.98 triệu trong bối cảnh thực tế:
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 bg-slate-950/60">
                <th className="py-3 px-4">Sự kiện</th>
                <th className="py-3 px-4">Xác suất ước tính</th>
                <th className="py-3 px-4">So sánh với Mega 6/45</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              <tr>
                <td className="py-3.5 px-4 font-semibold text-slate-200">
                  Tung đồng xu ra Ngửa
                </td>
                <td className="py-3.5 px-4 text-teal-400 font-bold">1 / 2 (50%)</td>
                <td className="py-3.5 px-4 text-slate-400">
                  Dễ xảy ra hơn gấp 4 triệu lần
                </td>
              </tr>
              <tr>
                <td className="py-3.5 px-4 font-semibold text-slate-200">
                  Rút trúng quân Át Bích từ bộ bài 52 lá
                </td>
                <td className="py-3.5 px-4 text-teal-400 font-bold">1 / 52 (~1.92%)</td>
                <td className="py-3.5 px-4 text-slate-400">
                  Dễ xảy ra hơn gấp 156 nghìn lần
                </td>
              </tr>
              <tr>
                <td className="py-3.5 px-4 font-semibold text-slate-200">
                  Khớp đúng 2 bóng trong Mega 6/45
                </td>
                <td className="py-3.5 px-4 text-teal-400 font-bold">
                  1 / 7.3 (~13.6%)
                </td>
                <td className="py-3.5 px-4 text-slate-400">
                  Hiện tượng phổ biến nhất của các gợi ý
                </td>
              </tr>
              <tr>
                <td className="py-3.5 px-4 font-semibold text-slate-200">
                  Khớp đúng 3 bóng trong Mega 6/45
                </td>
                <td className="py-3.5 px-4 text-indigo-400 font-bold">
                  1 / 57 (~1.76%)
                </td>
                <td className="py-3.5 px-4 text-slate-400">
                  Thỉnh thoảng xuất hiện trong kiểm chứng
                </td>
              </tr>
              <tr>
                <td className="py-3.5 px-4 font-semibold text-slate-200">
                  Bị sét đánh trong suốt cuộc đời
                </td>
                <td className="py-3.5 px-4 text-amber-400 font-bold">
                  1 / 15,300 (~0.0065%)
                </td>
                <td className="py-3.5 px-4 text-slate-400">
                  Dễ xảy ra hơn Jackpot gấp 530 lần
                </td>
              </tr>
              <tr className="bg-slate-950/60 font-bold">
                <td className="py-3.5 px-4 text-teal-300">
                  Trúng Jackpot Mega 6/45
                </td>
                <td className="py-3.5 px-4 text-teal-400">
                  1 / 8,145,060 (~0.000012%)
                </td>
                <td className="py-3.5 px-4 text-teal-300">Xác suất chuẩn xác</td>
              </tr>
              <tr className="bg-slate-950/60 font-bold">
                <td className="py-3.5 px-4 text-indigo-300">
                  Trúng Jackpot 1 Power 6/55
                </td>
                <td className="py-3.5 px-4 text-indigo-400">
                  1 / 28,989,675 (~0.0000034%)
                </td>
                <td className="py-3.5 px-4 text-indigo-300">
                  Khó hơn Mega 6/45 khoảng 3.5 lần
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
