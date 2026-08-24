'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { CronLogRecord, DrawRecord } from '@/lib/types';
import { useAppState } from '@/components/providers/AppProviders';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  RefreshCw,
  CheckCircle2,
  XCircle,
  LogOut,
  User as UserIcon,
  Database,
  ShieldCheck,
  Layers,
  Calendar,
  Sparkles,
  Filter,
  Search,
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AdminGroupedDraw } from '@/lib/types';

type ViewState = 'checking' | 'ready';

interface AdminOverviewData {
  totalDraws: number;
  megaDrawsCount: number;
  powerDrawsCount: number;
  officialSourceCount: number;
  communitySourceCount: number;
  latestMegaDraw?: DrawRecord;
  latestPowerDraw?: DrawRecord;
  recentDraws: DrawRecord[];
}

/**
 * Đọc body JSON một cách an toàn. Khi route handler crash, Next trả về 500 với body rỗng
 * hoặc HTML — lúc đó `res.json()` ném SyntaxError và che mất lỗi thật.
 */
async function readJsonSafe(res: Response): Promise<any> {
  const text = await res.text();
  if (!text) {
    return { error: `Máy chủ trả về lỗi ${res.status} (body rỗng)` };
  }
  try {
    return JSON.parse(text);
  } catch {
    return { error: `Máy chủ trả về dữ liệu không hợp lệ (HTTP ${res.status})` };
  }
}

/**
 * Dashboard nội bộ: Xem thông tin chi tiết bảng `draws`, phân loại luồng dữ liệu chính/phụ,
 * và lịch sử các lần chạy đồng bộ kỳ quay (`cron_logs`).
 */
export function AdminDashboard() {
  const router = useRouter();
  const { user, isAdmin, authLoading, handleLogout } = useAppState();
  const [state, setState] = useState<ViewState>('checking');
  const [logs, setLogs] = useState<CronLogRecord[]>([]);
  const [overview, setOverview] = useState<AdminOverviewData | null>(null);
  const [running, setRunning] = useState(false);
  const [fullSyncRunning, setFullSyncRunning] = useState(false);

  const [adminDraws, setAdminDraws] = useState<AdminGroupedDraw[]>([]);
  const [loadingDraws, setLoadingDraws] = useState(false);
  const [filterType, setFilterType] = useState('all');
  const [filterLimit, setFilterLimit] = useState('100');
  const [filterSyncStatus, setFilterSyncStatus] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [syncingDraw, setSyncingDraw] = useState<string | null>(null);

  // Missing Draws States
  const [missingDraws, setMissingDraws] = useState<any[]>([]);
  const [isScanningMissing, setIsScanningMissing] = useState(false);
  const [showMissingModal, setShowMissingModal] = useState(false);
  const [isSyncingMissing, setIsSyncingMissing] = useState(false);

  // Cron Logs Pagination
  const [logsPage, setLogsPage] = useState(1);
  const logsPerPage = 10;
  const logsTotalPages = useMemo(() => Math.ceil(logs.length / logsPerPage), [logs.length]);
  const paginatedLogs = useMemo(
    () => logs.slice((logsPage - 1) * logsPerPage, logsPage * logsPerPage),
    [logs, logsPage]
  );

  const handleAdminLogout = async () => {
    await handleLogout();
    toast.success('Đã đăng xuất tài khoản Admin.');
    router.replace('/');
  };

  const loadLogs = useCallback(async () => {
    if (!user) return;
    try {
      const idToken = await user.getIdToken();
      const res = await fetch('/api/admin/cron-logs', {
        headers: { Authorization: `Bearer ${idToken}` },
      });
      if (res.status === 401 || res.status === 403) {
        router.replace('/');
        return;
      }
      const json = await readJsonSafe(res);
      if (!res.ok) {
        toast.error(`Lỗi hệ thống: ${json.error || `HTTP ${res.status}`}`);
        setState('ready');
        return;
      }
      
      setLogs(json.logs || []);
      if (json.overview) {
        setOverview(json.overview);
      }
      setState('ready');
    } catch (err) {
      console.error('Error loading cron logs:', err);
      toast.error('Lỗi kết nối hoặc parse dữ liệu');
      setState('ready');
    }
  }, [user, router]);

  useEffect(() => {
    if (authLoading) return;
    if (!user || !isAdmin) {
      router.replace('/');
      return;
    }
    loadLogs();
  }, [authLoading, user, isAdmin, loadLogs, router]);

  const loadDraws = useCallback(async () => {
    if (!user) return;
    setLoadingDraws(true);
    try {
      const idToken = await user.getIdToken();
      const res = await fetch(`/api/admin/draws?type=${filterType}&limit=${filterLimit}&syncStatus=${filterSyncStatus}&page=${currentPage}`, {
        headers: { Authorization: `Bearer ${idToken}` },
      });
      const json = await readJsonSafe(res);
      if (res.ok) {
        setAdminDraws(json.draws || []);
        if (json.pagination) {
          setTotalPages(json.pagination.totalPages || 1);
        }
      } else {
        toast.error(`Lỗi tải dữ liệu kỳ quay: ${json.error || `HTTP ${res.status}`}`);
      }
    } catch (err) {
      console.error('Error loading draws:', err);
    } finally {
      setLoadingDraws(false);
    }
  }, [user, filterType, filterLimit, filterSyncStatus, currentPage]);

  useEffect(() => {
    if (!authLoading && user && isAdmin) {
      loadDraws();
    }
  }, [authLoading, user, isAdmin, loadDraws]);

  const handleRunSync = async () => {
    if (!user) return;
    setRunning(true);
    try {
      const idToken = await user.getIdToken();
      const res = await fetch('/api/cron/sync-draws', {
        headers: { Authorization: `Bearer ${idToken}` },
      });
      const json = await readJsonSafe(res);
      if (res.ok || res.status === 207) {
        if (json.success) {
          toast.success('Đồng bộ thành công');
        } else {
          toast.warning(json.error || 'Đồng bộ xong nhưng có lỗi một phần — xem chi tiết bên dưới');
        }
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

  const handleFullSync = async (source?: 'official') => {
    if (!user) return;

    setFullSyncRunning(true);
    try {
      const idToken = await user.getIdToken();
      const url = source === 'official' ? '/api/cron/sync-draws?full=true&source=official' : '/api/cron/sync-draws?full=true';
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${idToken}` },
      });
      const json = await readJsonSafe(res);
      if (res.ok || res.status === 207) {
        if (json.success) {
          toast.success('Đồng bộ lịch sử thành công');
        } else {
          toast.warning(json.error || 'Đồng bộ xong nhưng có lỗi một phần — xem chi tiết bên dưới');
        }
        await loadLogs();
      } else {
        toast.error(json.error || 'Chạy Full Sync thất bại');
      }
    } catch (err) {
      console.error('Error triggering full sync:', err);
      toast.error('Lỗi khi chạy đồng bộ toàn bộ (Full Sync)');
    } finally {
      setFullSyncRunning(false);
    }
  };

  const handleSyncSingle = async (id: string, type: string) => {
    if (!user) return;
    setSyncingDraw(id);
    try {
      const idToken = await user.getIdToken();
      const res = await fetch('/api/cron/sync-single', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ id, type }),
      });
      const json = await readJsonSafe(res);
      if (res.ok) {
        const r = json.results || {};
        const inserted = json.inserted ?? 0;

        if (inserted > 0) {
          toast.success(`Đã đồng bộ thêm ${inserted} nguồn mới cho kỳ ${id}`);
          loadDraws();
        } else {
          const details: string[] = [];
          if (r.official === 'exists') details.push('Chính chủ: ✓ đã có');
          if (r.official === 'not_found') details.push('Chính chủ: không tìm thấy');
          if (r.official === 'error') details.push('Chính chủ: lỗi kết nối');
          if (r.community === 'exists') details.push('Cộng đồng: ✓ đã có');
          if (r.community === 'not_found') details.push('Cộng đồng: không tìm thấy');
          if (r.community === 'error') details.push('Cộng đồng: lỗi kết nối');
          toast.info(`Kỳ ${id}: ${details.join(' · ')}`);
        }
      } else {
        toast.error(`Đồng bộ thất bại: ${json.error}`);
      }
    } catch (err) {
      console.error(err);
      toast.error('Lỗi gọi API đồng bộ');
    } finally {
      setSyncingDraw(null);
    }
  };

  const handleScanMissing = async () => {
    if (!user) return;
    setIsScanningMissing(true);
    try {
      const idToken = await user.getIdToken();
      const res = await fetch('/api/admin/missing-draws', {
        headers: { Authorization: `Bearer ${idToken}` },
      });
      const json = await readJsonSafe(res);
      if (res.ok) {
        setMissingDraws(json.missingDraws || []);
        setShowMissingModal(true);
      } else {
        toast.error(`Lỗi quét kỳ quay rỗng: ${json.error}`);
      }
    } catch (err) {
      console.error(err);
      toast.error('Không kết nối được server');
    } finally {
      setIsScanningMissing(false);
    }
  };

  const handleSyncMissingDraws = async () => {
    if (!user || missingDraws.length === 0) return;
    setIsSyncingMissing(true);
    let successCount = 0;
    try {
      const idToken = await user.getIdToken();
      for (const draw of missingDraws) {
        const res = await fetch('/api/cron/sync-single', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${idToken}`,
          },
          body: JSON.stringify({ id: draw.id, type: draw.lotteryType }),
        });
        if (res.ok) {
          successCount++;
        }
      }
      toast.success(`Đã đồng bộ ${successCount}/${missingDraws.length} kỳ quay`);
      setShowMissingModal(false);
      loadDraws();
      loadLogs();
    } catch (err) {
      console.error('Error syncing missing draws:', err);
      toast.error('Có lỗi xảy ra trong quá trình đồng bộ hàng loạt');
    } finally {
      setIsSyncingMissing(false);
    }
  };

  if (authLoading || state === 'checking') {
    return (
      <div className="py-20 flex items-center justify-center text-slate-400 text-sm">
        Đang kiểm tra quyền truy cập...
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <h1 className="text-xl font-black text-slate-100">Quản Trị: Đồng Bộ & Cơ Sở Dữ Liệu</h1>
            <Badge variant="outline" className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-300 border-amber-500/30">
              Admin Mode
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-slate-400">
            Giám sát dữ liệu bảng <code className="text-teal-400 font-mono">draws</code> & lịch sử đồng bộ tự động (<code className="text-teal-400 font-mono">cron_logs</code>).
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300">
            <UserIcon className="w-3.5 h-3.5 text-teal-400" />
            <span className="font-medium">{user?.email}</span>
          </div>

          <Button
            onClick={handleAdminLogout}
            variant="outline"
            className="border-slate-800 hover:border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-slate-100 font-semibold h-auto py-2.5 px-3.5 text-xs shrink-0 cursor-pointer"
            title="Đăng xuất khỏi tài khoản Admin"
          >
            <LogOut className="w-3.5 h-3.5 mr-1.5 text-red-400" />
            <span>Đăng Xuất</span>
          </Button>
        </div>
      </div>

      {/* KPI Overview Cards */}
      {overview && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-slate-900/80 border-slate-800">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="flex items-center justify-between text-slate-400 text-xs font-normal">
                <span>Tổng Số Kỳ Quay (Bảng draws)</span>
                <Database className="w-4 h-4 text-teal-400" />
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 space-y-2">
              <div className="text-2xl font-black text-slate-100">{overview.totalDraws} <span className="text-xs font-normal text-slate-500">kỳ</span></div>
              <div className="text-[11px] text-slate-400 flex items-center justify-between pt-1 border-t border-slate-800/60">
                <span>Mega 6/45: <strong className="text-teal-300">{overview.megaDrawsCount}</strong></span>
                <span>Power 6/55: <strong className="text-indigo-300">{overview.powerDrawsCount}</strong></span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/80 border-slate-800">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="flex items-center justify-between text-slate-400 text-xs font-normal">
                <span>Phân Loại Nguồn Dữ Liệu</span>
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 space-y-2">
              <div className="flex items-center gap-2 pt-1">
                <Badge variant="outline" className="bg-emerald-500/10 text-emerald-300 border-emerald-500/30 font-bold px-2.5 py-0.5">
                  Chính Chủ: {overview.officialSourceCount}
                </Badge>
                <Badge variant="outline" className="bg-amber-500/10 text-amber-300 border-amber-500/30 font-bold px-2.5 py-0.5">
                  Dự Phòng: {overview.communitySourceCount}
                </Badge>
              </div>
              <p className="text-[10px] text-slate-500 pt-1">Tránh trùng lặp qua Idempotent Key `#ID`</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/80 border-slate-800">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="flex items-center justify-between text-slate-400 text-xs font-normal">
                <span>Kỳ Mới Nhất Mega 6/45</span>
                <Calendar className="w-4 h-4 text-teal-400" />
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 space-y-2">
              <div className="text-lg font-bold text-teal-300">
                {overview.latestMegaDraw ? overview.latestMegaDraw.id : 'N/A'}
              </div>
              <div className="text-xs text-slate-400">
                {overview.latestMegaDraw ? `Ngày quay: ${overview.latestMegaDraw.drawDate}` : 'Chưa có dữ liệu'}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/80 border-slate-800">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="flex items-center justify-between text-slate-400 text-xs font-normal">
                <span>Kỳ Mới Nhất Power 6/55</span>
                <Calendar className="w-4 h-4 text-indigo-400" />
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 space-y-2">
              <div className="text-lg font-bold text-indigo-300">
                {overview.latestPowerDraw ? overview.latestPowerDraw.id : 'N/A'}
              </div>
              <div className="text-xs text-slate-400">
                {overview.latestPowerDraw ? `Ngày quay: ${overview.latestPowerDraw.drawDate}` : 'Chưa có dữ liệu'}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Button
          onClick={handleRunSync}
          disabled={running || fullSyncRunning}
          className="bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold h-auto py-2.5 px-6 border-0 shadow-lg shadow-teal-500/10 cursor-pointer"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${running ? 'animate-spin' : ''}`} />
          {running ? 'Đang chạy...' : 'Đồng Bộ Nhanh'}
        </Button>

        <AlertDialog>
          <AlertDialogTrigger
            disabled={running || fullSyncRunning}
            className="inline-flex items-center justify-center rounded-md border border-indigo-500/50 hover:border-indigo-400 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 hover:text-indigo-200 font-bold h-auto py-2.5 px-6 cursor-pointer text-sm"
          >
            <Database className={`w-4 h-4 mr-2 ${fullSyncRunning ? 'animate-bounce' : ''}`} />
            {fullSyncRunning ? 'Đang tải...' : 'Full Sync Lịch Sử'}
          </AlertDialogTrigger>
          <AlertDialogContent className="bg-slate-900 border-slate-800 text-slate-200 p-6 sm:max-w-xl">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-xl">Xác nhận đồng bộ toàn bộ</AlertDialogTitle>
              <AlertDialogDescription className="text-slate-400 mt-2 text-sm leading-relaxed">
                Hệ thống hiện đang có <strong>{overview?.totalDraws || 0}</strong> kỳ quay. 
                Chức năng này sẽ quét lại toàn bộ lịch sử (từ trước tới nay) để tải về các kỳ quay còn thiếu.
                <br /><br />
                <em>Lưu ý: Các kỳ quay đã tồn tại sẽ tự động được bỏ qua (không tạo bản sao trùng lặp). Việc quét có thể mất vài phút, bạn có chắc chắn muốn tiếp tục không?</em>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="bg-transparent border-t-0 mx-0 mb-0 px-0 pt-5 pb-0 flex flex-col gap-3 sm:flex-col sm:space-x-0 w-full items-stretch">
              <AlertDialogAction onClick={() => handleFullSync()} className="bg-indigo-600 text-white hover:bg-indigo-500 shadow-lg shadow-indigo-500/20 w-full sm:w-full h-11">
                Đồng bộ nhanh (Nguồn Cộng đồng - Khuyên dùng)
              </AlertDialogAction>
              <AlertDialogAction onClick={() => handleFullSync('official')} className="bg-slate-700 text-slate-200 hover:bg-slate-600 w-full sm:w-full h-11">
                Đồng bộ chậm (Trực tiếp từ Vietlott.vn)
              </AlertDialogAction>
              <AlertDialogCancel className="bg-slate-800/50 text-slate-300 border-slate-700 hover:bg-slate-800 hover:text-white sm:mt-0 w-full sm:w-full h-11">
                Huỷ
              </AlertDialogCancel>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <Button
          onClick={handleScanMissing}
          disabled={isScanningMissing || running || fullSyncRunning}
          variant="outline"
          className="border-amber-500/50 hover:border-amber-400 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 hover:text-amber-200 font-bold h-auto py-2.5 px-6 cursor-pointer"
        >
          <Search className={`w-4 h-4 mr-2 ${isScanningMissing ? 'animate-pulse' : ''}`} />
          {isScanningMissing ? 'Đang quét...' : 'Quét Lỗ Hổng Dữ Liệu'}
        </Button>
      </div>

      {/* Missing Draws Dialog */}
      <Dialog open={showMissingModal} onOpenChange={setShowMissingModal}>
        <DialogContent className="bg-slate-900 border-slate-800 text-slate-200 sm:max-w-2xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-lg">Kết quả quét lỗ hổng dữ liệu</DialogTitle>
            <DialogDescription className="text-slate-400 text-sm">
              {missingDraws.length === 0
                ? 'Không tìm thấy kỳ quay nào bị thiếu hoàn toàn. Dữ liệu đầy đủ!'
                : `Phát hiện ${missingDraws.length} kỳ quay chưa có trong cơ sở dữ liệu.`}
            </DialogDescription>
          </DialogHeader>

          {missingDraws.length > 0 && (
            <div className="overflow-y-auto flex-1 min-h-0 rounded-lg border border-slate-800">
              <Table className="w-full text-xs">
                <TableHeader className="sticky top-0 z-10 bg-slate-900">
                  <TableRow className="border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider hover:bg-transparent">
                    <TableHead className="py-2 px-3 h-auto">Mã Kỳ</TableHead>
                    <TableHead className="py-2 px-3 h-auto">Loại</TableHead>
                    <TableHead className="py-2 px-3 h-auto">Ngày Quay</TableHead>
                    <TableHead className="py-2 px-3 h-auto">Bộ Số (Cộng đồng)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="font-mono">
                  {missingDraws.map((d) => (
                    <TableRow key={`${d.lotteryType}-${d.id}`} className="hover:bg-slate-800/50 border-slate-800/60">
                      <TableCell className="py-2 px-3 font-bold text-slate-200">{d.id}</TableCell>
                      <TableCell className="py-2 px-3">
                        <Badge variant="outline" className={d.lotteryType === 'mega645' ? 'bg-teal-500/10 text-teal-300 border-teal-500/30' : 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30'}>
                          {d.lotteryType === 'mega645' ? 'Mega' : 'Power'}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-2 px-3 text-slate-300">{d.drawDate}</TableCell>
                      <TableCell className="py-2 px-3">
                        <div className="flex items-center gap-1 flex-wrap">
                          {d.numbers?.map((num: number) => (
                            <span key={num} className="w-5 h-5 rounded-full bg-slate-800 text-slate-200 text-[10px] font-bold flex items-center justify-center">
                              {num < 10 ? `0${num}` : num}
                            </span>
                          ))}
                          {d.bonusNumber && (
                            <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-bold flex items-center justify-center ml-1">
                              {d.bonusNumber < 10 ? `0${d.bonusNumber}` : d.bonusNumber}
                            </span>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          <DialogFooter className="pt-4 flex flex-col sm:flex-row gap-2">
            {missingDraws.length > 0 && (
              <Button
                onClick={handleSyncMissingDraws}
                disabled={isSyncingMissing}
                className="bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isSyncingMissing ? 'animate-spin' : ''}`} />
                {isSyncingMissing ? 'Đang đồng bộ...' : `Đồng bộ ${missingDraws.length} kỳ thiếu`}
              </Button>
            )}
            <Button variant="outline" onClick={() => setShowMissingModal(false)} className="border-slate-700 text-slate-300 hover:bg-slate-800">
              Đóng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Table: Draws Data Collection */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-teal-400" />
            <h2 className="text-sm font-bold text-slate-200">Dữ Liệu Bảng `draws`</h2>
          </div>
          
          {/* Filters Toolbar */}
          <div className="flex flex-wrap items-center gap-2">
            <Select value={filterType} onValueChange={(v) => { setFilterType(v || 'all'); setCurrentPage(1); }}>
              <SelectTrigger className="w-[130px] h-8 bg-slate-950 border-slate-800 text-xs text-slate-300">
                <SelectValue placeholder="Loại xổ số">
                  {{ all: 'Tất cả loại', mega645: 'Mega 6/45', power655: 'Power 6/55' }[filterType] || filterType}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả loại</SelectItem>
                <SelectItem value="mega645">Mega 6/45</SelectItem>
                <SelectItem value="power655">Power 6/55</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-md px-3 h-8">
              <Checkbox
                id="filterMissing"
                checked={filterSyncStatus === 'missing'}
                onCheckedChange={(checked) => { setFilterSyncStatus(checked ? 'missing' : 'all'); setCurrentPage(1); }}
                className="border-slate-700 data-[state=checked]:bg-amber-500 data-[state=checked]:text-white"
              />
              <label
                htmlFor="filterMissing"
                className="text-xs font-medium text-slate-300 leading-none cursor-pointer select-none"
              >
                Thiếu dữ liệu
              </label>
            </div>

            <Select value={filterLimit} onValueChange={(v) => { setFilterLimit(v || '50'); setCurrentPage(1); }}>
              <SelectTrigger className="w-[100px] h-8 bg-slate-950 border-slate-800 text-xs text-slate-300">
                <SelectValue placeholder="Số lượng">
                  {{ '50': '50 dòng', '100': '100 dòng', '500': '500 dòng', all: 'Tất cả' }[filterLimit] || filterLimit}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="50">50 dòng</SelectItem>
                <SelectItem value="100">100 dòng</SelectItem>
                <SelectItem value="500">500 dòng</SelectItem>
                <SelectItem value="all">Tất cả</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 bg-slate-950 border-slate-800"
              onClick={loadDraws}
              disabled={loadingDraws}
            >
              <Filter className={`w-3.5 h-3.5 text-slate-400 ${loadingDraws ? 'animate-pulse text-teal-400' : ''}`} />
            </Button>
          </div>
        </div>

        <div className="overflow-y-auto relative min-h-[300px] max-h-[600px] bg-slate-950/50 rounded-lg">
          {loadingDraws && adminDraws.length === 0 ? (
            <div className="p-4 space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex gap-4">
                  <Skeleton className="h-10 w-[80px] bg-slate-800" />
                  <Skeleton className="h-10 w-[100px] bg-slate-800" />
                  <Skeleton className="h-10 w-[120px] bg-slate-800" />
                  <Skeleton className="h-10 flex-1 bg-slate-800" />
                </div>
              ))}
            </div>
          ) : adminDraws.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              Không có dữ liệu phù hợp với bộ lọc.
            </div>
          ) : (
            <Table className="w-full text-left text-xs relative">
              <TableHeader className="hidden md:table-header-group sticky top-0 z-10 bg-slate-900 border-b border-slate-800 shadow-sm">
                <TableRow className="border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider hover:bg-transparent">
                  <TableHead className="py-2.5 px-3 h-auto">Mã Kỳ</TableHead>
                  <TableHead className="py-2.5 px-3 h-auto">Loại Xổ Số</TableHead>
                  <TableHead className="py-2.5 px-3 h-auto">Ngày Quay</TableHead>
                  <TableHead className="py-2.5 px-3 h-auto min-w-[200px]">Bộ Số (Chính Chủ)</TableHead>
                  <TableHead className="py-2.5 px-3 h-auto min-w-[200px]">Bộ Số (Cộng Đồng)</TableHead>
                  <TableHead className="py-2.5 px-3 h-auto text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="font-mono">
                {adminDraws.map((d) => (
                  <TableRow key={`${d.lotteryType}-${d.id}`} className="flex flex-col md:table-row hover:bg-slate-800/50 transition-colors border-slate-800/60 border-b p-4 md:p-0 gap-2 md:gap-0 relative">
                    {loadingDraws && (
                       <div className="absolute inset-0 bg-slate-900/10 backdrop-blur-[1px] z-10"></div>
                    )}
                    <TableCell className="block md:table-cell py-1 md:py-2.5 px-0 md:px-3 font-bold text-slate-200 border-b border-slate-800/40 md:border-0 pb-3 md:pb-2.5">
                      <div className="flex justify-between items-center md:block">
                        <span>{d.id}</span>
                        <span className="md:hidden text-slate-400 font-normal">{d.drawDate}</span>
                      </div>
                    </TableCell>
                    <TableCell className="block md:table-cell py-1.5 md:py-2.5 px-0 md:px-3">
                      <div className="flex justify-between items-center md:justify-start">
                        <span className="md:hidden font-semibold text-slate-400">Loại:</span>
                        <Badge
                          variant="outline"
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            d.lotteryType === 'mega645'
                              ? 'bg-teal-500/10 text-teal-300 border-teal-500/30'
                              : 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30'
                          }`}
                        >
                          {d.lotteryType === 'mega645' ? 'Mega 6/45' : 'Power 6/55'}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell py-2.5 px-3 text-slate-400 font-sans">{d.drawDate}</TableCell>
                    
                    {/* Official Numbers */}
                    <TableCell className="block md:table-cell py-1.5 md:py-2.5 px-0 md:px-3">
                      <div className="flex justify-between items-center md:justify-start">
                        <span className="md:hidden font-semibold text-slate-400">Kết quả (Chính Chủ):</span>
                        {d.official ? (
                          <div className="flex items-center gap-1">
                            {d.official.numbers.map((num) => (
                              <span
                                key={num}
                                className="w-5 h-5 md:w-5 md:h-5 rounded-full bg-slate-800 text-slate-200 text-[10px] font-bold flex items-center justify-center"
                              >
                                {num < 10 ? `0${num}` : num}
                              </span>
                            ))}
                            {d.official.bonusNumber && (
                              <span className="w-5 h-5 md:w-5 md:h-5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-bold flex items-center justify-center ml-1">
                                {d.official.bonusNumber < 10 ? `0${d.official.bonusNumber}` : d.official.bonusNumber}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-500 text-xs">—</span>
                        )}
                      </div>
                    </TableCell>

                    {/* Community Numbers */}
                    <TableCell className="block md:table-cell py-1.5 md:py-2.5 px-0 md:px-3 border-t border-slate-800/40 md:border-0 pt-3 md:pt-2.5 mt-2 md:mt-0">
                      <div className="flex justify-between items-center md:justify-start">
                        <span className="md:hidden font-semibold text-slate-400">Kết quả (Cộng Đồng):</span>
                        {d.community ? (
                          <div className="flex items-center gap-1">
                            {d.community.numbers.map((num) => (
                              <span
                                key={num}
                                className="w-5 h-5 md:w-5 md:h-5 rounded-full bg-slate-800 text-slate-200 text-[10px] font-bold flex items-center justify-center"
                              >
                                {num < 10 ? `0${num}` : num}
                              </span>
                            ))}
                            {d.community.bonusNumber && (
                              <span className="w-5 h-5 md:w-5 md:h-5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-bold flex items-center justify-center ml-1">
                                {d.community.bonusNumber < 10 ? `0${d.community.bonusNumber}` : d.community.bonusNumber}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-500 text-xs">—</span>
                        )}
                      </div>
                    </TableCell>

                    {/* Action */}
                    <TableCell className="block md:table-cell py-1.5 md:py-2.5 px-0 md:px-3 text-right md:text-right font-sans">
                      <div className="flex justify-between items-center md:justify-end mt-2 md:mt-0">
                        <span className="md:hidden font-semibold text-slate-400">Thao tác:</span>
                        {(!d.official || !d.community) ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleSyncSingle(d.id, d.lotteryType)}
                            disabled={syncingDraw === d.id}
                            className="h-6 text-[10px] bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800"
                          >
                            <RefreshCw className={`w-3 h-3 mr-1 ${syncingDraw === d.id ? 'animate-spin text-teal-400' : ''}`} />
                            Đồng bộ
                          </Button>
                        ) : (
                          <CheckCircle2 className="w-4 h-4 text-emerald-500/50" />
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs text-slate-400">
              Hiển thị trang <span className="font-semibold text-slate-200">{currentPage}</span> / {totalPages}
            </div>
            <Pagination className="justify-end w-auto mx-0">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious 
                    href="#" 
                    onClick={(e) => { e.preventDefault(); if (currentPage > 1) setCurrentPage(p => p - 1); }}
                    className={currentPage <= 1 || loadingDraws ? 'pointer-events-none opacity-50' : 'cursor-pointer'} 
                  />
                </PaginationItem>
                
                {currentPage > 2 && (
                  <PaginationItem>
                    <PaginationLink href="#" onClick={(e) => { e.preventDefault(); setCurrentPage(1); }}>1</PaginationLink>
                  </PaginationItem>
                )}
                {currentPage > 3 && (
                  <PaginationItem>
                    <PaginationEllipsis />
                  </PaginationItem>
                )}
                
                {currentPage > 1 && (
                  <PaginationItem>
                    <PaginationLink href="#" onClick={(e) => { e.preventDefault(); setCurrentPage(currentPage - 1); }}>{currentPage - 1}</PaginationLink>
                  </PaginationItem>
                )}
                
                <PaginationItem>
                  <PaginationLink href="#" isActive>{currentPage}</PaginationLink>
                </PaginationItem>

                {currentPage < totalPages && (
                  <PaginationItem>
                    <PaginationLink href="#" onClick={(e) => { e.preventDefault(); setCurrentPage(currentPage + 1); }}>{currentPage + 1}</PaginationLink>
                  </PaginationItem>
                )}

                {currentPage < totalPages - 2 && (
                  <PaginationItem>
                    <PaginationEllipsis />
                  </PaginationItem>
                )}
                {currentPage < totalPages - 1 && (
                  <PaginationItem>
                    <PaginationLink href="#" onClick={(e) => { e.preventDefault(); setCurrentPage(totalPages); }}>{totalPages}</PaginationLink>
                  </PaginationItem>
                )}

                <PaginationItem>
                  <PaginationNext 
                    href="#" 
                    onClick={(e) => { e.preventDefault(); if (currentPage < totalPages) setCurrentPage(p => p + 1); }}
                    className={currentPage >= totalPages || loadingDraws ? 'pointer-events-none opacity-50' : 'cursor-pointer'} 
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </div>

      {/* Cron Logs Section */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-200 flex items-center gap-2">
            <RefreshCw className="w-4 h-4 text-teal-400" />
            <span>Lịch Sử Chạy Cronjob Đồng Bộ</span>
          </h2>
          {logs.length > 0 && (
            <span className="text-[10px] text-slate-500">{logs.length} bản ghi</span>
          )}
        </div>

        {logs.length === 0 ? (
          <div className="bg-slate-950/50 rounded-lg p-8 text-center text-slate-400 text-sm">
            Chưa có lần đồng bộ nào được ghi lại.
          </div>
        ) : (
          <>
            <div className="overflow-y-auto relative max-h-[500px] bg-slate-950/50 rounded-lg">
              <Table className="w-full text-left text-xs table-fixed">
                <TableHeader className="sticky top-0 z-10 bg-slate-900 border-b border-slate-800 shadow-sm">
                  <TableRow className="border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider hover:bg-transparent">
                    <TableHead className="py-3 px-4 h-auto w-[160px]">Thời Gian</TableHead>
                    <TableHead className="py-3 px-4 h-auto w-[160px]">Nguồn Kích Hoạt</TableHead>
                    <TableHead className="py-3 px-4 h-auto">Mega 6/45</TableHead>
                    <TableHead className="py-3 px-4 h-auto">Power 6/55</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedLogs.map((log) => (
                    <TableRow
                      key={log.id}
                      className={`hover:bg-slate-800/50 transition-colors border-slate-800/60 border-b ${
                        !log.success ? 'bg-red-500/5' : ''
                      }`}
                    >
                      <TableCell className="py-3 px-4 align-top">
                        <div className="flex items-center gap-2">
                          {log.success ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                          ) : (
                            <XCircle className="w-4 h-4 text-red-400 shrink-0" />
                          )}
                          <span className="font-semibold text-slate-200 text-[11px]">
                            {new Date(log.runAt).toLocaleString('vi-VN')}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="py-3 px-4 text-slate-400 align-top">
                        <span className="break-words">
                          {log.triggeredBy === 'scheduler' ? 'Cloud Scheduler' : `Admin (${log.triggeredByEmail})`}
                        </span>
                      </TableCell>
                      {(['mega645', 'power655'] as const).map((type) => {
                        const r = log.results[type];
                        return (
                          <TableCell key={type} className="py-3 px-4 align-top">
                            <div className="space-y-1">
                              {r.source && (
                                <Badge
                                  variant="outline"
                                  className={`px-2 py-0 rounded text-[9px] font-semibold ${
                                    r.source === 'official'
                                      ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                                      : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                                  }`}
                                >
                                  {r.source === 'official' ? 'Chính chủ' : 'Cộng đồng'}
                                </Badge>
                              )}
                              <div>
                                {r.error ? (
                                  <p className="text-red-400 text-[11px] break-words">Lỗi: {r.error}</p>
                                ) : (
                                  <p className="text-slate-400 text-[11px] leading-relaxed break-words">
                                    Thêm mới: <span className="text-slate-200 font-semibold">{r.inserted.length}</span>
                                    {r.inserted.length > 0 && (
                                      <span className="block text-[10px] text-slate-500 mt-0.5 break-words">
                                        {r.inserted.join(', ')}
                                      </span>
                                    )}
                                    <span className="block">Bỏ qua (đã có): {r.skipped.length}</span>
                                  </p>
                                )}
                              </div>
                            </div>
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Cron Logs Pagination */}
            {logsTotalPages > 1 && (
              <div className="flex justify-center pt-2">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        href="#"
                        onClick={(e) => { e.preventDefault(); if (logsPage > 1) setLogsPage(p => p - 1); }}
                        className={logsPage <= 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                      />
                    </PaginationItem>

                    {Array.from({ length: logsTotalPages }, (_, i) => i + 1)
                      .filter(p => p === 1 || p === logsTotalPages || Math.abs(p - logsPage) <= 1)
                      .map((p, idx, arr) => (
                        <React.Fragment key={p}>
                          {idx > 0 && arr[idx - 1] < p - 1 && (
                            <PaginationItem><PaginationEllipsis /></PaginationItem>
                          )}
                          <PaginationItem>
                            <PaginationLink
                              href="#"
                              isActive={p === logsPage}
                              onClick={(e) => { e.preventDefault(); setLogsPage(p); }}
                            >
                              {p}
                            </PaginationLink>
                          </PaginationItem>
                        </React.Fragment>
                      ))}

                    <PaginationItem>
                      <PaginationNext
                        href="#"
                        onClick={(e) => { e.preventDefault(); if (logsPage < logsTotalPages) setLogsPage(p => p + 1); }}
                        className={logsPage >= logsTotalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
