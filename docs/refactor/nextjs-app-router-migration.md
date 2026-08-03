# Prompt: Migrate LotoVN AI từ tab-trong-1-URL sang Next.js App Router thật

> Dán nguyên file này vào Antigravity làm prompt cho task. Đọc `AGENTS.md` ở root repo trước khi bắt đầu — mọi rule ở đó vẫn áp dụng cho task này.

## Bối cảnh

Hiện tại toàn bộ app chạy trên **1 URL duy nhất** (`/`). `app/page.tsx` là Server Component fetch dữ liệu ban đầu rồi render `components/AppClientShell.tsx` (client component) — chính `AppClientShell` giữ state `activeTab` (`'dashboard' | 'suggestions' | 'chat' | 'education'`) và render 1 trong 4 tab bằng `dynamic()` import, không đổi URL. Navbar chỉ gọi `setActiveTab`, không phải navigation thật.

Điều này bỏ phí gần hết sức mạnh của Next.js App Router: không có URL riêng cho từng màn hình (không share link được, không back/forward được), không có `loading.tsx`/`error.tsx` tự động theo route, mọi trang dùng chung 1 `metadata`.

## Mục tiêu

Chuyển 4 tab hiện tại thành 4 route thật, dùng đúng các quy ước file của App Router (`layout.tsx`, `page.tsx`, `loading.tsx`, `error.tsx`), đồng thời **giữ nguyên 100% giao diện, hành vi nghiệp vụ, và API routes hiện có** — đây là refactor cấu trúc, không phải viết lại tính năng.

## Cấu trúc thư mục hiện tại (tham khảo)

```
app/
  page.tsx              # Server Component, fetch stats/draws/suggestions cho lottery mặc định, render AppClientShell
  layout.tsx             # <html>, metadata chung, không có Navbar/Footer
  globals.css
  api/{chat,draws,stats,suggestions}/route.ts   # KHÔNG đụng vào các route này

components/
  AppClientShell.tsx     # 'use client' — giữ activeTab, selectedLottery, user, favoriteNumbers; render Navbar + 1 trong 4 tab qua dynamic import; render Footer
  Navbar.tsx              # 'use client' — nhận activeTab/onSelectTab/selectedLottery/onSelectLottery/user/... qua props, render nav ngang (desktop) + bottom tab bar (mobile)
  Footer.tsx
  DashboardTab.tsx        # nhận initialStats/initialDraws qua props, tự fetch lại khi đổi filter
  SuggestionsTab.tsx      # nhận initialSuggestions qua props
  ChatTab.tsx             # thuần client, gọi /api/chat
  EducationTab.tsx        # gần như static, chứa <MonteCarloSimulator /> (client island)
  MonteCarloSimulator.tsx
  AuthModal.tsx            # modal đăng nhập, mở/đóng qua state của AppClientShell

lib/
  db.ts        # getLotteryStats, getDraws, getSuggestionLogs, addDraw, saveSuggestionLog — GIỮ NGUYÊN, không đổi signature
  gemini.ts     # getGemini() singleton — GIỮ NGUYÊN
  types.ts      # có LotteryStats, DrawRecord, SuggestionRecord...
  firebase.ts   # auth, onAuthStateChanged, logOut, User
```

## Cấu trúc thư mục mục tiêu

```
app/
  layout.tsx                 # Server Component: <html>, metadata mặc định, render <AppProviders> bọc Navbar + {children} + Footer
  loading.tsx                 # fallback tối giản cho root (hiếm khi hit vì mỗi route con có loading riêng)
  error.tsx                    # 'use client', error boundary chung — UI tiếng Việt, nút "Thử lại" gọi reset()
  not-found.tsx                # 404 tiếng Việt

  page.tsx                     # = màn Dashboard hiện tại. Server Component, đọc searchParams.type, fetch getLotteryStats + getDraws, render <DashboardView>. export const metadata riêng.
  loading.tsx                  # (đã liệt kê ở trên — dùng chung cho "/")

  suggestions/
    page.tsx                   # Server Component, đọc searchParams.type, fetch getSuggestionLogs, render <SuggestionsView>. metadata riêng.
    loading.tsx

  chat/
    page.tsx                   # Server Component mỏng, chỉ render <ChatTab /> (client). metadata riêng.

  education/
    page.tsx                   # Server Component thuần, render nội dung tĩnh + <MonteCarloSimulator />. metadata riêng.

  api/...                       # KHÔNG đụng vào

components/
  providers/
    AppProviders.tsx           # 'use client' MỚI — context giữ user (Firebase), favoriteNumbers + toggleFavorite, isAuthModalOpen/openAuthModal/closeAuthModal. Bọc children + render <AuthModal> khi mở.
  Navbar.tsx                    # SỬA: bỏ activeTab/onSelectTab/selectedLottery/onSelectLottery/user/onOpenAuthModal/onLogout props. Dùng next/link tới '/', '/suggestions', '/chat', '/education' (giữ query ?type=... hiện tại nếu có). Active tab = so sánh usePathname(). Lottery switcher: Link tới cùng pathname nhưng đổi query type. User/favorites lấy từ useAppState() (context ở AppProviders).
  DashboardTab.tsx → đổi tên thành DashboardView (giữ nguyên logic bên trong, chỉ đổi cách nhận initialStats/initialDraws — vẫn nhận qua props từ page.tsx)
  SuggestionsTab.tsx → SuggestionsView (tương tự)
  ChatTab.tsx                  # giữ nguyên, chỉ bớt prop selectedLottery nếu lấy được từ searchParams trong page.tsx cha rồi truyền xuống
  EducationTab.tsx             # giữ nguyên
  AppClientShell.tsx           # XOÁ sau khi migrate xong (chức năng đã tách vào layout.tsx + providers/AppProviders.tsx + từng page.tsx)
```

## State toàn cục xử lý thế nào

- **`selectedLottery` (mega645/power655)** → chuyển thành **URL search param** `?type=`, KHÔNG giữ trong React state nữa. Mỗi `page.tsx` đọc `searchParams.type` (giống cách `app/page.tsx` hiện tại đang làm), fetch dữ liệu tương ứng ngay trên server. Nút chuyển Mega/Power trong Navbar là `<Link href={`${pathname}?type=mega645`}>` — đổi lottery mà vẫn giữ đúng route đang xem.
- **`user` (Firebase) + `favoriteNumbers` (localStorage) + trạng thái mở AuthModal** → chuyển vào `components/providers/AppProviders.tsx` (client context), đặt trong `app/layout.tsx` bọc toàn bộ `{children}`. Đây là state không cần SSR, hợp lý để giữ ở client.
- **`activeTab`** → KHÔNG còn là state — suy ra trực tiếp từ route (`usePathname()` trong Navbar).

## Loading & Error

- Chuyển đúng phần skeleton/spinner hiện đang render trong `DashboardTab` khi `loading || !statsData` (dòng đầu component) thành `app/loading.tsx` — Next.js tự hiện khi Server Component `page.tsx` đang await fetch. Làm tương tự cho `suggestions/loading.tsx`.
- Chú ý: `DashboardTab` vẫn cần giữ 1 state loading NHỎ cho việc đổi filter `timeRange` (10/30/50 kỳ) sau khi trang đã load xong — đây là fetch phía client, không phải page load, không liên quan `loading.tsx`. Không xoá state đó.
- `app/error.tsx` bắt lỗi không mong muốn (khác với trường hợp Mongo lỗi — trường hợp đó `lib/db.ts` đã tự fallback về seed data nên không throw). Nội dung tiếng Việt, có nút "Thử lại".

## Các bước thực hiện (làm tuần tự, mỗi bước phải chạy được)

1. Tạo `components/providers/AppProviders.tsx`, di chuyển toàn bộ logic auth + favorites + auth-modal-open từ `AppClientShell.tsx` sang đây, export `useAppState()` hook.
2. Sửa `app/layout.tsx`: import `AppProviders`, `Navbar`, `Footer`, render `<AppProviders><Navbar />{children}<Footer /></AppProviders>`. Giữ nguyên `<html lang="vi" className="dark">`.
3. Sửa `Navbar.tsx`: bỏ props điều khiển tab/lottery/user, dùng `usePathname()` + `useSearchParams()` + `useAppState()`. Giữ nguyên y hệt class Tailwind/markup hiện có — chỉ đổi phần logic điều hướng.
4. Đổi `app/page.tsx` hiện tại thành nội dung Dashboard: giữ phần fetch song song `getLotteryStats`/`getDraws`, bỏ phần render `AppClientShell`, thay bằng render thẳng `DashboardView` (đổi tên từ `DashboardTab`, giữ nguyên nội dung file, chỉ rename). Thêm `export const metadata`.
5. Tạo `app/suggestions/page.tsx`, `app/chat/page.tsx`, `app/education/page.tsx` theo cấu trúc mục tiêu ở trên.
6. Tạo `app/loading.tsx`, `app/suggestions/loading.tsx`, `app/error.tsx`, `app/not-found.tsx`.
7. Xoá `components/AppClientShell.tsx` sau khi không còn import ở đâu.
8. Chạy `npx tsc --noEmit`, sửa hết lỗi type.
9. Chạy `npm run dev`, tự kiểm tra bằng tay cả 4 route ở 375px/768px/1440px: Dashboard (`/`), Suggestions (`/suggestions`), Chat (`/chat`), Education (`/education`), cả 2 lottery (`?type=mega645`, `?type=power655`), nút yêu thích số, đăng nhập/đăng xuất, nút back/forward của trình duyệt.

## Ràng buộc — KHÔNG được làm

- KHÔNG đổi logic/response shape của bất kỳ route nào trong `app/api/`.
- KHÔNG đổi nội dung tiếng Việt, class Tailwind, hay bố cục UI đang có — đây là refactor cấu trúc file/routing, không phải redesign.
- KHÔNG đổi package manager (giữ `bun`), không thêm UI library mới.
- KHÔNG để sót props/behaviour nào của các Tab component gốc khi rename/di chuyển.

## Phase 2 (optional — chỉ làm nếu Phase 1 đã ổn định và được yêu cầu riêng)

- Thêm `export const revalidate = 300` (5 phút) cho `app/page.tsx` và `app/suggestions/page.tsx` — dữ liệu quay số chỉ đổi vài lần/tuần, cache ISR giảm tải MongoDB.
- Cân nhắc tách nhỏ hơn nữa Dashboard thành nhiều Server Component con (KPI cards, 2 biểu đồ, bảng tần suất, lịch sử quay) mỗi cái bọc `<Suspense>` riêng để streaming — chỉ làm nếu thực sự cần cải thiện tốc độ, không làm nếu chỉ để "cho đẹp".

## Tiêu chí hoàn thành

- 4 URL riêng biệt hoạt động, mỗi URL load thẳng đúng nội dung kể cả khi mở tab mới (F5 không mất trạng thái tab).
- Nút back/forward trình duyệt hoạt động đúng giữa các tab.
- `npx tsc --noEmit` không lỗi.
- Giao diện ở cả 3 breakpoint (mobile/tablet/desktop) giống hệt trước khi refactor — so sánh bằng mắt.
- `AppClientShell.tsx` đã bị xoá, không còn import chết.
