# Prompt: Sắp xếp lại Navbar, khởi tạo shadcn/ui, thay loading spinner bằng skeleton

> Dán nguyên file này vào Antigravity làm prompt cho task. Đọc `AGENTS.md` ở root repo trước khi bắt đầu — mọi rule ở đó vẫn áp dụng cho task này, đặc biệt phần "Lỗi đã biết" (đừng viết lại `grid-cols-15` sai trong `MonteCarloSimulator.tsx`).

## Bối cảnh

App đã hoàn thành migrate sang App Router thật (4 route: `/`, `/suggestions`, `/chat`, `/education`, xem `components/Navbar.tsx`, `app/layout.tsx`, `components/providers/AppProviders.tsx`). Giờ cần polish 3 việc độc lập nhau, làm tuần tự theo đúng thứ tự dưới đây, mỗi việc xong phải chạy được trước khi sang việc tiếp theo:

1. Sắp xếp lại vị trí bộ chuyển Mega/Power trong Navbar
2. Khởi tạo shadcn/ui và áp dụng cho vài chỗ cụ thể (không làm tràn lan)
3. Thay loading spinner bằng skeleton đúng hình dạng nội dung thật

## Việc 1 — Di chuyển Lottery Switcher trong Navbar

File: `components/Navbar.tsx`

Hiện tại header có 2 hàng:
- Hàng 1: Logo — **Lottery Switcher (Mega 6/45 / Power 6/55)** — nút Đăng nhập
- Hàng 2 (chỉ desktop, `hidden md:flex`): 4 tab điều hướng (Thống Kê, Bộ Gợi Ý, Trợ Lý AI, Học Tập)

Đổi thành:
- Hàng 1: Logo — nút Đăng nhập (chỉ còn identity bar, bỏ Lottery Switcher ra khỏi hàng này)
- Hàng 2: 4 tab điều hướng (bên trái, giữ nguyên) — **Lottery Switcher (bên phải, cùng hàng)**, dùng `justify-between` cho hàng 2 để 2 nhóm tách 2 đầu

Lưu ý:
- Đây là chuyển vị trí trong desktop nav (`nav` có class `hidden md:flex` bên trong header). Mobile bottom tab bar (`md:hidden fixed bottom-0`) không đụng vào — Lottery Switcher trên mobile vẫn giữ nguyên ở hàng 1 (header) vì mobile không có "hàng 2" — không đủ chỗ để nhét thêm switcher vào bottom nav 4 ô.
- Giữ nguyên toàn bộ class Tailwind, màu sắc, style của Lottery Switcher — chỉ đổi vị trí trong cây JSX, không đổi giao diện của chính nó.
- Giữ nguyên logic `buildLinkWithLottery`, `href` với query `?type=`.

## Việc 2 — Khởi tạo shadcn/ui

Project đã có sẵn `class-variance-authority`, `clsx`, `tailwind-merge`, `lucide-react` — đúng dependency shadcn CLI cần, chưa từng chạy init. Tailwind đang ở v4 (`app/globals.css` chỉ có `@import "tailwindcss";`) — dùng chế độ shadcn cho Tailwind v4 (CSS variables).

```
npx shadcn@latest init
```

Khi CLI hỏi:
- Style: mặc định (New York hoặc tương đương bản mới nhất)
- Base color: **slate** (khớp theme "Sophisticated Dark" hiện tại — nền slate/zinc, accent teal/indigo)
- CSS variables: yes

Sau đó add đúng 4 component sau, KHÔNG add thêm gì ngoài danh sách này:

```
npx shadcn@latest add skeleton dialog button select
```

Việc init sẽ tạo `components.json` và `components/ui/*`. Không sửa `tailwind.config` thủ công nếu CLI đã tự xử lý qua `@theme` trong `globals.css`.

### Áp dụng `Button`

Thay các nút đang lặp lại class Tailwind thủ công bằng `<Button>` từ `components/ui/button.tsx` ở các nút chính:
- Nút "Tạo Bộ Số" trong `SuggestionsView.tsx`
- Nút "Cập Nhật Kỳ Mới" và nút submit trong modal "Thêm Kỳ Quay Mới" trong `DashboardView.tsx`
- Nút submit/toggle trong `AuthModal.tsx`

**Bắt buộc**: giữ nguyên y hệt màu sắc/gradient/bo góc hiện có bằng cách dùng prop `className` để override hoặc tạo thêm `variant` tùy chỉnh trong `button.tsx` (ví dụ variant `"gradient"` cho nút gradient teal→indigo). KHÔNG được để nút đổi sang màu mặc định của shadcn (thường là màu trung tính) — nếu không chắc giữ được đúng style, giữ nguyên `<button>` thường ở chỗ đó, đừng đổi.

### Áp dụng `Dialog`

Thay modal tự viết (`fixed inset-0 ... bg-slate-950/80 backdrop-blur-sm`) bằng `<Dialog>` ở 2 chỗ:
- `AuthModal.tsx`
- Modal "Thêm Kỳ Quay Mới" trong `DashboardView.tsx`

Giữ nguyên nội dung bên trong (form, text, class Tailwind của các element con) — chỉ thay phần khung modal/overlay/close-button bằng component `Dialog`/`DialogContent`/`DialogHeader`/`DialogClose` của shadcn.

### Áp dụng `Select`

Thay `<select>` thuần bằng `<Select>` của shadcn ở:
- Dropdown lọc trạng thái (Hot/Warm/Cold/Gan) trong `DashboardView.tsx`
- Dropdown lọc lottery trong danh sách log gợi ý ở `SuggestionsView.tsx` (nếu có)

## Việc 3 — KHÔNG làm trong task này

Skeleton cho `app/loading.tsx`/`app/suggestions/loading.tsx` KHÔNG nằm trong task này nữa — xem `docs/refactor/dashboard-suggestions-streaming.md` (làm sau task này). Task đó chuyển sang skeleton **theo từng section** (Suspense riêng cho KPI cards, chart, bảng...) thay vì 1 skeleton cho cả trang, nên phần khung `<Skeleton>` sẽ được dùng trực tiếp trong từng component con ở task kia, không cần sửa `app/loading.tsx` ở đây.

## Ràng buộc — KHÔNG được làm

- KHÔNG đổi copy tiếng Việt, KHÔNG đổi logic nghiệp vụ, KHÔNG đổi API routes.
- KHÔNG add thêm shadcn component ngoài `skeleton`, `dialog`, `button`, `select` trong task này — nếu thấy chỗ khác cũng nên đổi, ghi chú lại thay vì tự ý làm thêm.
- KHÔNG đổi màu sắc/theme hiện có (dark slate/zinc + teal/indigo accent) khi áp Button/Dialog/Select.
- KHÔNG động vào `components/MonteCarloSimulator.tsx` (đã fix xong bug `grid-cols-15`, xem `AGENTS.md`).

## Tiêu chí hoàn thành

- Desktop: hàng 2 của Navbar có 4 tab bên trái + Lottery Switcher bên phải, hàng 1 chỉ còn Logo + Đăng nhập.
- Mobile: không đổi gì so với hiện tại.
- `npx shadcn@latest add skeleton dialog button select` chạy xong, `components/ui/` có 4 file tương ứng.
- AuthModal và modal Thêm Kỳ Quay dùng `Dialog`, đóng bằng Esc/click-outside hoạt động, giao diện giống hệt trước khi đổi.
- 2 dropdown filter dùng `Select`, hoạt động đúng như `<select>` cũ.
- `npx tsc --noEmit` không lỗi. Tự kiểm tra bằng `npm run dev` ở 375px/768px/1440px.
