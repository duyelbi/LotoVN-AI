'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { toast } from 'sonner';
import { LotteryType, TimeRange, TIME_RANGE_OPTIONS } from '@/lib/types';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { PlusCircle, CheckCircle2 } from 'lucide-react';

interface DashboardControlsProps {
  selectedLottery: LotteryType;
  range: TimeRange;
}

/**
 * Thanh điều khiển đầu trang Dashboard: tiêu đề, bộ chọn khoảng thời gian (TimeRange)
 * và modal "Thêm Kỳ Quay Mới". Là phần duy nhất của Dashboard không phụ thuộc data
 * fetch nên hiện ngay lập tức, không cần Suspense.
 */
export function DashboardControls({ selectedLottery, range }: DashboardControlsProps) {
  const router = useRouter();
  const pathname = usePathname();

  const [showAddDrawModal, setShowAddDrawModal] = useState(false);
  const [submittingDraw, setSubmittingDraw] = useState(false);
  const [drawSuccessMsg, setDrawSuccessMsg] = useState<string | null>(null);
  const [newDrawInput, setNewDrawInput] = useState({
    id: '',
    numbersStr: '',
    bonusNumber: '',
  });

  const handleAddDraw = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingDraw(true);
    setDrawSuccessMsg(null);
    try {
      const nums = newDrawInput.numbersStr
        .split(/[,.\s]+/)
        .map((n) => parseInt(n.trim(), 10))
        .filter((n) => !isNaN(n) && n > 0);

      const maxBall = selectedLottery === 'mega645' ? 45 : 55;
      if (nums.length !== 6 || nums.some((n) => n > maxBall)) {
        toast.error(`Vui lòng nhập đủ 6 số hợp lệ (từ 1 đến ${maxBall})`);
        setSubmittingDraw(false);
        return;
      }

      const payload: any = {
        id: newDrawInput.id.startsWith('#') ? newDrawInput.id : `#${newDrawInput.id}`,
        lotteryType: selectedLottery,
        drawDate: new Date().toISOString().split('T')[0],
        numbers: nums,
        jackpotValue: 20000000000,
        hasWinner: false,
      };

      if (selectedLottery === 'power655' && newDrawInput.bonusNumber) {
        payload.bonusNumber = parseInt(newDrawInput.bonusNumber, 10);
      }

      const res = await fetch('/api/draws', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (res.ok) {
        toast.success(`Đã thêm thành công kỳ quay ${payload.id}`);
        setDrawSuccessMsg(`Đã thêm thành công kỳ quay ${payload.id}`);
        setShowAddDrawModal(false);
        setNewDrawInput({ id: '', numbersStr: '', bonusNumber: '' });
        // Refresh all Server Component data via streaming SSR
        router.refresh();
      } else {
        toast.error(json.error || 'Lỗi khi thêm kỳ quay');
      }
    } catch (err) {
      console.error(err);
      toast.error('Không thể kết nối máy chủ');
    } finally {
      setSubmittingDraw(false);
    }
  };

  return (
    <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-4 sm:p-6 backdrop-blur-sm space-y-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-500/10 text-teal-400 border border-teal-500/30">
              {selectedLottery === 'mega645' ? 'Vietlott Mega 6/45' : 'Vietlott Power 6/55'}
            </span>
            <span className="text-xs text-slate-400">
              Phân tích {range} kỳ quay gần nhất
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-100 mt-1 tracking-tight">
            Bảng Tần Suất &amp; Thống Kê Minh Bạch
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Time Range Selector */}
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            {TIME_RANGE_OPTIONS.map((r) => (
              <Link
                key={r}
                href={`${pathname}?type=${selectedLottery}&range=${r}`}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                  range === r
                    ? 'bg-slate-800 text-teal-300 border border-slate-700 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {r} kỳ gần nhất
              </Link>
            ))}
          </div>

          <Button
            type="button"
            onClick={() => setShowAddDrawModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-extrabold text-xs transition-all shadow-md cursor-pointer shrink-0 border-0 h-auto"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Cập nhật kỳ mới</span>
          </Button>
        </div>
      </div>

      {drawSuccessMsg && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{drawSuccessMsg}</span>
        </div>
      )}

      {/* ADD DRAW MODAL */}
      <Dialog open={showAddDrawModal} onOpenChange={setShowAddDrawModal}>
        <DialogContent className="bg-slate-900 border border-slate-800 text-slate-100 max-w-md w-full shadow-2xl p-6 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-100">Cập Nhật Kỳ Quay Mới</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddDraw} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Mã kỳ quay (VD: #01125)
              </label>
              <input
                type="text"
                required
                placeholder="01125"
                value={newDrawInput.id}
                onChange={(e) => setNewDrawInput({ ...newDrawInput, id: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Bộ 6 số trúng thưởng (cách nhau bởi khoảng trắng hoặc dấu phẩy)
              </label>
              <input
                type="text"
                required
                placeholder="05 12 18 24 33 41"
                value={newDrawInput.numbersStr}
                onChange={(e) => setNewDrawInput({ ...newDrawInput, numbersStr: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-teal-500"
              />
            </div>

            {selectedLottery === 'power655' && (
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Số đặc biệt Bonus (Power 6/55)
                </label>
                <input
                  type="number"
                  placeholder="08"
                  value={newDrawInput.bonusNumber}
                  onChange={(e) => setNewDrawInput({ ...newDrawInput, bonusNumber: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-teal-500"
                />
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                type="button"
                onClick={() => setShowAddDrawModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200 bg-transparent border-0 h-auto hover:bg-slate-800/50"
              >
                Hủy
              </Button>
              <Button
                type="submit"
                disabled={submittingDraw}
                className="px-4 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs shadow-md border-0 h-auto"
              >
                {submittingDraw ? 'Đang lưu...' : 'Lưu kỳ quay'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
