'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { CronLogRecord } from '@/lib/types';
import { useAppState } from '@/components/providers/AppProviders';
import { Button } from '@/components/ui/button';
import { RefreshCw, CheckCircle2, XCircle } from 'lucide-react';

type ViewState = 'checking' | 'ready';

/**
 * Dashboard nội bộ: xem lịch sử các lần đồng bộ kỳ quay (`cron_logs`) và chạy đồng bộ
 * thủ công. Không có link nào trong Navbar/Footer trỏ tới trang này — chỉ truy cập được
 * qua URL trực tiếp. Không phải Server Component vì Firebase Auth ở app này là
 * client-only — gate thật sự nằm ở server (`lib/admin-auth.ts` verify ID token trên mọi
 * API gọi ở đây); phần client chỉ redirect ra khỏi trang nếu không phải admin.
 */
export function AdminDashboard() {
  const router = useRouter();
  const { user, authLoading } = useAppState();
  const [state, setState] = useState<ViewState>('checking');
  const [logs, setLogs] = useState<CronLogRecord[]>([]);
  const [running, setRunning] = useState(false);

  const loadLogs = useCallback(async () => {
    if (!user) return;
    try {
      const idToken = await user.getIdToken();
      const res = await fetch('/api/admin/cron-logs', {
        headers: { Authorization: `Bearer ${idToken}` },
      });
      if (res.status === 401) {
        router.replace('/');
        return;
      }
      const json = await res.json();
      setLogs(json.logs || []);
      setState('ready');
    } catch (err) {
      console.error('Error loading cron logs:', err);
      router.replace('/');
    }
  }, [user, router]);

  useEffect(() => {
    if (authLoading) return; // Firebase chưa xác định xong trạng thái đăng nhập
    if (!user) {
      router.replace('/');
      return;
    }
    loadLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user]);

  const handleRunSync = async () => {
    if (!user) return;
    setRunning(true);
    try {
      const idToken = await user.getIdToken();
      const res = await fetch('/api/cron/sync-draws', {
        headers: { Authorization: `Bearer ${idToken}` },
      });
      const json = await res.json();
      if (res.ok || res.status === 207) {
        toast.success(json.success ? 'Đồng bộ thành công' : 'Đồng bộ xong nhưng có lỗi một phần — xem chi tiết bên dưới');
        await loadLogs();
      } else {
        toast.error(json.error || 'Chạy đồng bộ thất bại');
      }
    } catch (err) {
      console.error('Error triggering sync:', err);
      toast.error('Không thể kết nối máy chủ');
    } finally {
      setRunning(false);
    }
  };

  if (state === 'checking') {
    return (
      <div className="py-20 flex items-center justify-center text-slate-400 text-sm">
        Đang kiểm tra quyền truy cập...
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-100">Quản Trị: Đồng Bộ Kỳ Quay</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Lịch sử các lần đồng bộ (tự động hàng ngày qua Cloud Scheduler, hoặc chạy tay ở đây).
          </p>
        </div>
        <Button
          onClick={handleRunSync}
          disabled={running}
          className="bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold h-auto py-2.5 px-5 border-0 shrink-0"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${running ? 'animate-spin' : ''}`} />
          {running ? 'Đang chạy...' : 'Chạy Đồng Bộ Ngay'}
        </Button>
      </div>

      {logs.length === 0 ? (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-8 text-center text-slate-400 text-sm">
          Chưa có lần đồng bộ nào được ghi lại.
        </div>
      ) : (
        <div className="space-y-3">
          {logs.map((log) => (
            <div
              key={log.id}
              className={`bg-slate-900/80 border rounded-2xl p-4 sm:p-5 ${
                log.success ? 'border-slate-800' : 'border-red-500/40'
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2 text-xs">
                  {log.success ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-400 shrink-0" />
                  )}
                  <span className="font-semibold text-slate-200">
                    {new Date(log.runAt).toLocaleString('vi-VN')}
                  </span>
                  <span className="text-slate-500">•</span>
                  <span className="text-slate-400">
                    {log.triggeredBy === 'scheduler' ? 'Cloud Scheduler' : `Admin (${log.triggeredByEmail})`}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {(['mega645', 'power655'] as const).map((type) => {
                  const r = log.results[type];
                  return (
                    <div key={type} className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 text-xs">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-bold text-teal-300">
                          {type === 'mega645' ? 'Mega 6/45' : 'Power 6/55'}
                        </span>
                        {r.source && (
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                              r.source === 'official'
                                ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                                : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                            }`}
                          >
                            {r.source === 'official' ? 'Chính chủ' : 'Cộng đồng'}
                          </span>
                        )}
                      </div>
                      {r.error ? (
                        <p className="text-red-400">Lỗi: {r.error}</p>
                      ) : (
                        <p className="text-slate-400">
                          Thêm mới: <span className="text-slate-200 font-semibold">{r.inserted.length}</span>
                          {r.inserted.length > 0 && ` (${r.inserted.join(', ')})`}
                          {' · '}Bỏ qua (đã có): {r.skipped.length}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
