# Prompt: Streaming SSR theo từng section cho Dashboard & Suggestions

> Dán nguyên file này vào Antigravity làm prompt cho task. Đọc `AGENTS.md` ở root repo trước khi bắt đầu.
>
> **Làm task này SAU khi `docs/refactor/navbar-shadcn-skeleton.md` đã xong** — task đó đã add sẵn component `Skeleton`/`Dialog`/`Select` của shadcn, task này dùng lại `Skeleton` để build fallback cho từng section.

## Bối cảnh

Hiện tại `app/page.tsx` và `app/suggestions/page.tsx` `await` hết dữ liệu cần thiết rồi mới render toàn bộ trang 1 lần — `app/loading.tsx`/`app/suggestions/loading.tsx` hiện 1 spinner/skeleton chung cho CẢ trang trong lúc chờ.

Mục tiêu: mỗi khối UI (KPI cards, 2 biểu đồ, bảng tần suất, bảng lịch sử quay / dashboard kiểm chứng, danh sách log gợi ý) tự fetch phần dữ liệu của mình và có `<Suspense>` riêng — khối nào xong trước hiện trước, không phải đợi khối chậm nhất. Đây là kiến trúc streaming SSR đúng cách của Next.js App Router (Server Components + Suspense), tận dụng đúng thế mạnh Next.js thay vì mô hình "fetch-tất-rồi-render" hiện tại.

Refactor này **thay thế hoàn toàn cách tiếp cận** đã mô tả trước đây (tách thành component thuần presentational nhận props từ cha) — giờ mỗi component con tự fetch dữ liệu của mình, không nhận data qua props nữa.

## Bước 0 — Request-level cache cho data fetching (làm trước tiên, bắt buộc)

Nhiều Suspense boundary sẽ gọi các hàm trong `lib/db.ts` trong CÙNG 1 request (cùng 1 lượt tải trang). Nếu không cache, MongoDB sẽ bị query lặp lại nhiều lần một cách lãng phí cho cùng 1 lượt tải.

Bọc `getLotteryStats`, `getDraws`, `getSuggestionLogs` bằng `cache()` từ package `react` (tính năng "Request Memoization" — chỉ cache trong phạm vi 1 request, không cache xuyên request, không cần lo dữ liệu bị cũ giữa các lần tải khác nhau):

```ts
// lib/db.ts
import { cache } from 'react';

export const getDraws = cache(async (lotteryType: LotteryType, limit = 50): Promise<DrawRecord[]> => {
  // giữ nguyên 100% nội dung hàm hiện tại, chỉ bọc thêm cache()
});

export const getLotteryStats = cache(async (lotteryType: LotteryType, timeRangeDraws = 30) => {
  // giữ nguyên 100% nội dung hàm hiện tại
});

export const getSuggestionLogs = cache(async (lotteryType?: LotteryType): Promise<SuggestionRecord[]> => {
  // giữ nguyên 100% nội dung hàm hiện tại
});
```

Không đổi signature, không đổi logic bên trong — chỉ export dưới dạng đã bọc `cache()`.

## Bước 1 — Thêm URL param `range` cho Dashboard, `filter` cho Suggestions

`app/page.tsx`: thêm đọc `searchParams.range`, validate chỉ nhận `'10' | '30' | '50'`, mặc định `'30'`, parse ra number.

`app/suggestions/page.tsx`: thêm đọc `searchParams.filter`, validate chỉ nhận `'all' | 'mega645' | 'power655'`, mặc định `'all'`.

Đây là thay thế cho state `timeRange` (Dashboard) và `filterLottery` (Suggestions) hiện đang là client state gây refetch client-side — chuyển hẳn sang URL param giống hệt cách `type` (lottery) đang hoạt động, để đổi filter cũng kích hoạt streaming lại đúng cách thay vì fetch ngầm qua `/api/stats`/`/api/suggestions`.

## Bước 2 — Tách Dashboard thành async Server Component + Suspense

Tạo `components/dashboard/`, mỗi file là **async Server Component** (KHÔNG có `'use client'`), tự gọi hàm đã cache ở Bước 0, nhận `lotteryType` + `range` qua props (không nhận data đã fetch sẵn):

```
components/dashboard/
  DashboardControls.tsx     # 'use client' — nút chọn range (Link tới ?range=), nút "Thêm Kỳ Quay Mới" + AddDrawModal. Không phụ thuộc data, hiện ngay lập tức, KHÔNG bọc Suspense.
  KpiCards.tsx                # async Server Component — card "Kết Quả Mới Nhất" + Top Số Nóng/Lạnh/Gan
  FrequencyChart.tsx           # async Server Component — biểu đồ Recharts tần suất/chẵn-lẻ
  OverdueChart.tsx              # async Server Component — biểu đồ Recharts độ gan/cao-thấp
  NumberMatrix.tsx               # async Server Component — fetch numberStats rồi render <NumberMatrixGrid> (client, xem Bước 3)
  DrawHistoryTable.tsx            # async Server Component — bảng lịch sử quay thưởng (card mobile + table desktop)
  skeletons.tsx                    # export các Skeleton fallback tương ứng: KpiCardsSkeleton, ChartSkeleton, NumberMatrixSkeleton, DrawHistorySkeleton — dùng <Skeleton> của shadcn, đúng kích thước/bố cục khối thật tương ứng
```

`app/page.tsx` viết lại thành:

```tsx
export default async function DashboardPage(props: PageProps) {
  const searchParams = await props.searchParams;
  const selectedLottery = /* parse type, giữ nguyên logic cũ */;
  const range = /* parse range, mặc định 30 */;

  return (
    <div className="space-y-8 pb-12">
      <DashboardControls selectedLottery={selectedLottery} range={range} />

      <Suspense fallback={<KpiCardsSkeleton />}>
        <KpiCards lotteryType={selectedLottery} range={range} />
      </Suspense>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Suspense fallback={<ChartSkeleton />}>
          <FrequencyChart lotteryType={selectedLottery} range={range} />
        </Suspense>
        <Suspense fallback={<ChartSkeleton />}>
          <OverdueChart lotteryType={selectedLottery} range={range} />
        </Suspense>
      </div>

      <Suspense fallback={<NumberMatrixSkeleton />}>
        <NumberMatrix lotteryType={selectedLottery} range={range} />
      </Suspense>

      <Suspense fallback={<DrawHistorySkeleton />}>
        <DrawHistoryTable lotteryType={selectedLottery} range={range} />
      </Suspense>
    </div>
  );
}
```

`app/page.tsx` không còn `await Promise.all(...)` — bản thân hàm `DashboardPage` gần như không await gì (chỉ await `searchParams`), nên trả về gần như tức thì, các `<Suspense>` con tự lo phần chờ dữ liệu riêng.

## Bước 3 — Phần interactive của NumberMatrix (search, filter trạng thái, click-to-favorite)

`NumberMatrix.tsx` (Server Component, async) fetch xong `numberStats` rồi render:

```tsx
export default async function NumberMatrix({ lotteryType, range }: Props) {
  const stats = await getLotteryStats(lotteryType, range);
  return <NumberMatrixGrid numberStats={stats.numberStats} lotteryType={lotteryType} />;
}
```

`components/dashboard/NumberMatrixGrid.tsx` (`'use client'`, MỚI) giữ state `searchNumber`/`statusFilter` (y hệt logic filter hiện có trong `DashboardView.tsx`, chỉ copy sang, không viết lại), tự filter mảng `numberStats` đã nhận qua props (KHÔNG gọi API lại), và dùng `useAppState()` (từ `AppProviders`) để lấy `favoriteNumbers`/`toggleFavorite` cho phần click-to-favorite.

## Bước 4 — Thêm kỳ quay mới → làm mới toàn bộ section qua `router.refresh()`

`DashboardControls.tsx` (chứa `AddDrawModal`): sau khi POST `/api/draws` thành công, gọi `router.refresh()` (từ `next/navigation`, hook `useRouter()`) thay vì tự fetch lại data như `loadData()` cũ. `router.refresh()` chạy lại toàn bộ Server Component trong `page.tsx` — nhờ Bước 0, `getDraws`/`getLotteryStats` chạy lại (cache chỉ sống trong 1 request, request mới thì fetch lại đúng dữ liệu mới) — các Suspense boundary hiện skeleton lại rồi stream dữ liệu mới. Xoá hẳn hàm `loadData()`/state `loading` cũ trong `DashboardView.tsx` (nếu còn sót lại từ refactor trước) vì không còn cần thiết.

## Bước 5 — Áp dụng tương tự cho Suggestions

Tạo `components/suggestions/`:

```
components/suggestions/
  SuggestionGeneratorCard.tsx   # 'use client' — GIỮ NGUYÊN là client component. Banner + nút "Tạo Bộ Số" + card kết quả vừa tạo (currentSuggestion). Đây là dữ liệu tạo ra ngay lúc bấm nút (POST /api/suggestions), không phải initial page data — không thuộc phạm vi streaming.
  AccuracyDashboard.tsx           # async Server Component — fetch getSuggestionLogs(lotteryType hoặc undefined theo filter), tính toán matchCounts/avgMatched/totalEvaluated, render banner giải thích xác suất + số liệu tổng hợp
  SuggestionLogList.tsx            # async Server Component — fetch cùng getSuggestionLogs (đã cache ở Bước 0, không query lại), render lưới card log. Dropdown filter đổi thành <Link> tới ?filter=
  skeletons.tsx                     # AccuracyDashboardSkeleton, SuggestionLogListSkeleton
```

`app/suggestions/page.tsx`:

```tsx
export default async function SuggestionsPage(props: PageProps) {
  const searchParams = await props.searchParams;
  const selectedLottery = /* giữ nguyên logic cũ */;
  const filter = /* parse filter, mặc định 'all' */;

  return (
    <div className="space-y-10 pb-12">
      <SuggestionGeneratorCard selectedLottery={selectedLottery} />

      <Suspense fallback={<AccuracyDashboardSkeleton />}>
        <AccuracyDashboard lotteryType={selectedLottery} filter={filter} />
      </Suspense>

      <Suspense fallback={<SuggestionLogListSkeleton />}>
        <SuggestionLogList lotteryType={selectedLottery} filter={filter} />
      </Suspense>
    </div>
  );
}
```

Sau khi `SuggestionGeneratorCard` tạo gợi ý mới thành công (POST `/api/suggestions`), gọi `router.refresh()` để `AccuracyDashboard`/`SuggestionLogList` tự cập nhật theo log mới — thay cho `loadLogs()` cũ.

## Ràng buộc — KHÔNG được làm

- KHÔNG đổi copy tiếng Việt, KHÔNG đổi class Tailwind của các khối UI khi di chuyển — copy nguyên JSX sang vị trí mới.
- KHÔNG đổi logic tính toán (`calculateNumberStats`, `matchCounts`, v.v.) — chỉ đổi CHỖ gọi và CÁCH data tới component.
- KHÔNG đổi `app/api/*/route.ts` — các route này vẫn cần giữ nguyên vì các Client Component (`DashboardControls`, `SuggestionGeneratorCard`, `NumberMatrixGrid`) vẫn gọi qua `fetch()` bình thường cho hành động POST/tương tác, streaming chỉ áp dụng cho INITIAL data (GET lúc load trang).
- KHÔNG quên bọc `cache()` ở Bước 0 trước khi tách component — nếu bỏ qua bước này, mỗi Suspense boundary sẽ tự query MongoDB riêng, gây chậm và lãng phí.
- KHÔNG để `NumberMatrix.tsx`/`KpiCards.tsx`/... có `'use client'` — chúng phải là Server Component thuần để streaming hoạt động. Phần cần tương tác (search/filter/favorite) tách riêng ra component `'use client'` con như Bước 3.

## Tiêu chí hoàn thành

- Mở `/` với MongoDB chưa cấu hình hoặc mạng chậm: các section xuất hiện dần theo thứ tự sẵn sàng, không phải đợi tất cả rồi hiện cùng lúc. Kiểm tra rõ bằng DevTools → Network → throttle "Slow 3G".
- Đổi range (`?range=`)/lottery (`?type=`)/filter (`?filter=`) qua Link, có `useTransition` để tránh cảm giác "trắng trang" khi chuyển.
- Thêm kỳ quay mới → toàn bộ section Dashboard tự cập nhật qua `router.refresh()`, không cần F5 thủ công. Tương tự khi tạo gợi ý mới ở Suggestions.
- Xác nhận `getDraws`/`getLotteryStats`/`getSuggestionLogs` chỉ chạy đúng 1 lần mỗi hàm cho mỗi lượt tải trang dù nhiều Suspense boundary cùng gọi (thêm tạm `console.log` để đếm trong lúc test, xoá trước khi coi là xong).
- `npx tsc --noEmit` không lỗi. Giao diện giống hệt trước khi refactor ở 375px/768px/1440px — so sánh bằng mắt.
