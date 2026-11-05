# ROADMAP EXECUTION — CHỢ: THỊ TRẤN VIỆT NAM 3D

> Bảng theo dõi thực thi 8 Phase nâng cấp toàn diện dự án `jinsong2293/cho`.
> Nguyên tắc: Behavior-preserving, commit ≤ 300 dòng diff, kiểm thử tự động trước mỗi commit, dừng và xin ý kiến khi gặp quyết định kiến trúc lớn.

---

## 🚦 Đồ Thị Phụ Thuộc (Dependency Graph)

```text
PHASE 0 (Baseline Khảo Sát) ──► BẮT BUỘC chạy trước
     │
     ├──► PHASE 1 (Refactor Client) ──► BLOCKING cho Phase 5, 7
     │         │
     │         ├──► PHASE 2 (Testing) ──► BLOCKING cho Phase 4, 6
     │         │
     │         ├──► PHASE 3 (Security)  ──► Song song được
     │         │
     │         └──► PHASE 4 (Network)   ──► Sau Phase 2
     │                   │
     │                   └──► PHASE 5 (State Store) ──► Sau Phase 1
     │                             │
     │                             └──► PHASE 7 (UX Mạng) ──► Sau Phase 1 + 5
     │
     ├──► PHASE 6 (DAL / Postgres Prep) ──► Độc lập, làm bất kỳ lúc nào
     │
     └──► PHASE 8 (Docs) ──► Làm cuối cùng
```

---

## 📋 Danh Sách & Tiến Độ Các Phase

| Phase | Trọng Tâm | Phụ Thuộc | Trạng Thái | Blocking Cho |
| :--- | :--- | :--- | :---: | :--- |
| **Phase 0** | Baseline khảo sát toàn diện (chỉ đọc, không sửa code) | Không | 🟡 Đang làm | Mọi Phase sau |
| **Phase 1** | Tách monolith `client/index.html` (7.314 dòng) thành ES Modules gốc | Phase 0 | ⬜ Chưa làm | Phase 5, 7 |
| **Phase 2** | Kiểm thử tự động nghiệp vụ (`node:test`, `node:assert`, `c8`) | Phase 0 | ⬜ Chưa làm | Phase 4, 6 |
| **Phase 3** | Bảo mật, Rate Limiting, Helmet, CSP & Dependency Hardening | Phase 0 | ⬜ Chưa làm | Song song |
| **Phase 4** | Tối ưu đồng bộ mạng (Delta Encoding, Interest Mgmt, Adaptive Tick) | Phase 2 | ⬜ Chưa làm | Phase 5 |
| **Phase 5** | Quản lý trạng thái client (`core/state.js`), ESLint, Prettier | Phase 1 | ⬜ Chưa làm | Phase 7 |
| **Phase 6** | Chuẩn bị DAL trừu tượng hóa DB (SQLite → PostgreSQL) | Độc lập | ⬜ Chưa làm | Scale sau này |
| **Phase 7** | UX khi rớt mạng / reconnect / offline PWA | Phase 1, 5 | ⬜ Chưa làm | Trải nghiệm mạng yếu |
| **Phase 8** | Tài liệu dự án (`README`, `CONTRIBUTING`, `API.md`, `DEVELOPMENT`) | Cuối cùng | ⬜ Chưa làm | Bàn giao |

---

## 🔍 Chi Tiết Task Từng Phase

### PHASE 0 — Baseline Khảo Sát
- **Mục tiêu**: Lập báo cáo tình trạng toàn diện: kiến trúc, quy mô LOC, dependency, CVE, nợ kỹ thuật, rủi ro bảo mật kèm `file:line`.
- **Rủi ro**: Không có (chỉ đọc, không sửa code).
- **Tiêu chí nghiệm thu**: Báo cáo Markdown đầy đủ 5 mục (A, B, C, D, E); dừng chờ User duyệt.
- **Trạng thái**: 🟡 Đang làm (Hoàn thành khảo sát, trình User duyệt).

### PHASE 1 — Tách Monolith `client/index.html`
- **Mục tiêu**: Tách `client/index.html` thành ES Modules `<script type="module">` (`core/`, `three/`, `systems/`, `ui/`).
- **Rủi ro**: Vỡ scope biến toàn cục, mất kết nối Three.js/Socket.IO, vỡ giao diện.
- **Tiêu chí nghiệm thu**: `index.html` < 300 dòng; mỗi module < 500 dòng; 0 lỗi F12 console; smoke test xanh 100%.
- **Trạng thái**: ⬜ Chưa làm (BLOCKING bởi Phase 0).

### PHASE 2 — Kiểm Thử Nghiệp Vụ (`node:test`)
- **Mục tiêu**: Bộ unit test độc lập cho Kinh tế, Bầu Cua, Lô Tô, Câu Cá, Đá Cầu, Kéo Co, Moderation, Auth, XSS, Socket Payload.
- **Rủi ro**: Mock thiếu ngữ cảnh dẫn đến test ảo không phản ánh đúng logic server.
- **Tiêu chí nghiệm thu**: Coverage hàm nghiệp vụ ≥ 70%, mỗi test < 1s, chạy bằng `node --test`.
- **Trạng thái**: ⬜ Chưa làm (BLOCKING bởi Phase 0).

### PHASE 3 — Bảo Mật & Dependency
- **Mục tiêu**: Helmet, CSP, CORS, Socket payload validator, thay thế `innerHTML` rủi ro, bảo vệ endpoint tĩnh.
- **Rủi ro**: Chặn nhầm resource hợp lệ (Three.js CDN/local, Socket.IO polling, inline styles).
- **Tiêu chí nghiệm thu**: 0 CVE, payload invalid bị từ chối 100%, CSP không chặn render WebGL.
- **Trạng thái**: ⬜ Chưa làm.

### PHASE 4 — Tối Ưu Mạng (Network Bandwidth)
- **Mục tiêu**: Giảm ≥ 50% băng thông qua Delta Encoding, Area-of-Interest (40m), Adaptive Tick, Quantization.
- **Rủi ro**: Lệch state client-server, pop-in giật hình, lag khi nhiều thực thể xuất hiện.
- **Tiêu chí nghiệm thu**: 30 bot test băng thông < 15KB/s/client; deep equal test snapshot; CPU server tăng ≤ 15%.
- **Trạng thái**: ⬜ Chưa làm (BLOCKING bởi Phase 2).

### PHASE 5 — Quản Lý State & Code Quality
- **Mục tiêu**: Store bất biến tối giản `< 100 dòng` (`client/src/core/state.js`), JSDoc `AppState`, Flat ESLint + Prettier.
- **Rủi ro**: Regress các hàm UI cũ đọc biến toàn cục.
- **Tiêu chí nghiệm thu**: Gỡ sạch `window.` trong `ui/*`, 0 warning ESLint, bundle size tăng ≤ 5KB gzip.
- **Trạng thái**: ⬜ Chưa làm (BLOCKING bởi Phase 1).

### PHASE 6 — Tầng Dữ Liệu DAL (Postgres Prep)
- **Mục tiêu**: Thư viện DAL trừu tượng hóa DB (`server/db/`) tách khỏi `better-sqlite3` cụ thể, viết migration script.
- **Rủi ro**: Sai lệch kiểu dữ liệu JSON giữa SQLite và PostgreSQL, deadlock transaction.
- **Tiêu chí nghiệm thu**: Không còn `db.prepare` trong `server/world.js` / `server/index.js`, test DAL xanh trên SQLite in-memory và `pg-mem`.
- **Trạng thái**: ⬜ Chưa làm.

### PHASE 7 — UX Mạng & Reconnect
- **Mục tiêu**: State machine mạng, exponential backoff, client prediction di chuyển khi mất mạng, khóa event tiền tệ, offline PWA.
- **Rủi ro**: Khách bị trùng giao dịch (double spending) khi kết nối chập chờn.
- **Tiêu chí nghiệm thu**: Tắt/bật mạng không mất vị trí/tiền, không uncaught exception, test Slow 3G mượt.
- **Trạng thái**: ⬜ Chưa làm (BLOCKING bởi Phase 1, 5).

### PHASE 8 — Tài Liệu Dự Án
- **Mục tiêu**: `README.md`, `CONTRIBUTING.md`, `docs/DEVELOPMENT.md`, `docs/API.md`, `docs/ARCHITECTURE.md`.
- **Rủi ro**: Tài liệu không khớp implementation thực tế.
- **Tiêu chí nghiệm thu**: Người mới cài đặt ≤ 10 phút, `API.md` phủ 100% Socket.IO events.
- **Trạng thái**: ⬜ Chưa làm (Làm cuối cùng).

---

## 🚀 Nhật Ký Nâng Cấp Bổ Sung (Sprint Feature Enhancements)

### 1. Hệ Thống Chống Đi Xuyên Tường & Va Chạm Trượt (Collision & Sliding System)
- **Module**: `shared/colliders.js` (UMD dùng chung cả Client và Server).
- **Vật thể bảo vệ**:
  - Nhà Lồng Chợ Bến Thành & Tháp Đồng Hồ (`z ≈ -34`).
  - Đài Sen Vàng Trung Tâm (`0, 0`).
  - Sới Bầu Cua Tôm Cá Hội Chợ (`-8, -16`).
  - Quán Trà Đá Vỉa Hè (`0, 13.5`).
  - Nhà Văn Hóa Thị Trấn (`-26, 0`).
  - Dãy Nhà Phố 2 bên Đông - Tây (`x = ±38`).
  - Phố Dân Cư Đông (3 tiệm kinh doanh).
  - 6 Sạp Hàng Trung Tâm (`INITIAL_STALL_DEFS`).
  - Nước Sông Nam Bộ & Đầm Sen Tây (chống rơi xuống nước, chỉ cho phép đi trên Bến Cầu Tàu Gỗ và Đồi Ngắm Cảnh).
  - Rào chắn giới hạn bản đồ `BOUNDS` (`[-58, 58] x [-58, 58]`).
- **Thuật toán**: Sliding Collision (thử trục X và trục Z độc lập, tự động trượt mượt mà dọc mép tường, không kẹt cứng).
- **Kiểm thử**: `scripts/test-colliders.js` (100% pass 7/7 kịch bản).

### 2. Tối Ưu Hóa Trải Nghiệm Chơi Trên Di Động (Mobile UI/UX Optimization)
- **Cần Gạt Cảm Ứng Nổi (Dynamic Floating Joystick)**:
  - Cho phép chạm bất kỳ đâu ở nửa dưới bên trái (`clientX < 48vw`), tâm cần gạt tự động xuất hiện dưới ngón cái.
  - Ngăn chặn hoàn toàn việc xoay camera `OrbitControls` khi đang di chuyển bằng ngón cái trái.
  - Nhẹ nhàng trả về vị trí nghỉ mặc định khi nhả tay.
- **Cụm Nút Hành Động Ngón Cái Phải (`#mobile-action-pad`)**:
  - Nút Nhảy (`🎪 Nhảy`) / Bật đệm nhún hội chợ (kèm rung nhẹ xúc giác `haptic feedback`).
  - Nút Xe Máy (`🛵 Xe máy`) bật/tắt tốc độ cao, có hiệu ứng phát sáng `.bike-on`.
  - Nút Ngữ Cảnh Lớn (`💬 Trò chuyện` / `🏪 Quản lý sạp` / `☕ Uống trà đá` / `🎣 Câu cá` / `🎲 Lắc bầu cua`).
  - Kích thước chạm đạt chuẩn công thái học: 56x56px (nhỏ) và 68x68px (chính).
- **Tránh Chạm Nhầm & Tối Ưu Màn Hình Hẹp**:
  - Ngăn ngừa kích hoạt nhầm Tap-to-Move khi ngón tay đang rê cần gạt.
  - Modal tự co giãn `max-height: 86vh` và cuộn êm, không bị tràn màn hình.
- **Kiểm thử & Bằng chứng**:
  - `scripts/test-mobile-ui.js` (Playwright mô phỏng iPhone/Pixel 390x844).
  - Ảnh bằng chứng: `docs/evidence/mobile/mobile-hud-controls.png` và `docs/evidence/mobile/mobile-modal-responsive.png`.

