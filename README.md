# 🏮 Chợ Thị Trấn Việt Nam 3D — Sân Chơi Mở (Open Social Playground)

**Chợ Thị Trấn Việt Nam 3D** là một thế giới xã hội 3D trực tuyến ngay trên trình duyệt (Node.js + Express + Socket.IO + SQLite + Three.js), nơi bất kỳ ai cũng có thể mở link và bước vào một thị trấn Việt Nam sống động trong **dưới 10 giây** — không cần tạo tài khoản hay mật khẩu.

---

## ✨ Điểm Nổi Bật

1. **Vào Chơi Trong < 10 Giây (Zero-Friction Onboarding)**:
   - Chọn nhanh 1 trong 6 nhân vật mẫu đậm chất Việt Nam (*Cô Hàng Hoa, Chú Bác Ba, Bạn Trẻ Dạo Phố, Nghệ Sĩ Đường Phố, Đầu Bếp Chợ Đêm, Học Sinh Phố Cổ*) hoặc bấm **Vào Chơi Ngay**.
   - Hỗ trợ link mời trực tiếp vào phòng cùng bạn bè: `/?room=ABCD` hoặc gợi ý tên qua `/?name=Lan`.
   - Bảo vệ danh tính không mật khẩu bằng **Mã định danh tự động (`playerToken`)** kèm **Mã khôi phục 6 ký tự (`recoveryCode`)** để chuyển thiết bị an toàn.

2. **Thị Trấn Sống 9 Khu Vực (`[-64m, +64m]`)**:
   - **Chợ Trung Tâm & Đài Phun Nước**: Sạp hàng truyền thống, Loa Phường, Cây Đa Ước Nguyện (treo lời chúc 36 giờ), Bảng Vàng Cột Mốc Cộng Đồng.
   - **Phố Ẩm Thực Đêm & Sân Khấu Mở (Phía Bắc)**: Bàn ghế nhựa đỏ vỉa hè, lẩu nghi ngút khói, Sân Khấu Mở (biểu diễn nối tiếp 45 giây + pháo giấy).
   - **Công Viên Hồ Sen & Sân Làng (Phía Tây)**: Hồ sen, cầu gỗ đỏ ngắm cảnh, bàn cờ tướng ghế đá, sân Kéo Co Cộng Đồng 2 phe.
   - **Làng Nghề & Vườn Cộng Đồng (Phía Đông)**: Bàn Chuốt Gốm & Đan Nón Lá hợp tác 2–3 người (nhận kỷ vật Làng Nghề), Vườn Cộng Đồng tưới cây nở hoa.
   - **Bến Sông Chợ Nổi & Đồi Ngắm Cảnh (Phía Nam)**: Thuyền chợ nổi miền Tây, Bến Thả Đèn Hoa Đăng trên sông, Đồi Ngắm Hoàng Hôn & Thả Diều.
   - **Tuyến Xe Điện Xanh Nội Thị**: Xe điện chạy vòng quanh 5 trạm dừng, bấm `[E]` để lên/xuống xe ngắm cảnh cùng bạn bè.

3. **Hoạt Động Giao Lưu & Văn Hóa Việt**:
   - **Trà Đá Vỉa Hè & Ghế Ngồi Chung**: Ngồi cùng nhau 60 giây nhận xu, trà đá và **Điểm Thân Thiết (Affinity)** mở khóa danh hiệu (*Người Quen Phố Chợ → Bạn Trà Đá → Tri Kỷ Thị Trấn*).
   - **Đá Cầu Vòng Tròn, Bầu Cua, Lô Tô, Câu Cá, Kéo Co, Giờ Vàng Chợ Đông**.
   - **Lịch Lễ Hội Việt Nam Tự Động**: Tết Nguyên Đán, Tết Trung Thu, Quốc Khánh 2/9, Mùa Hoa Sen Hạ (hỗ trợ thử nhanh qua URL `?festival=trungthu`, `?festival=tet`).
   - **Sổ Tay Sưu Tầm 24 Kỷ Vật Văn Hóa** & **Chế Độ Chụp Ảnh Bưu Thiếp (Photo Mode)**.

4. **An Toàn, Đa Ngôn Ngữ & Thân Thiện Mọi Thiết Bị**:
   - Song ngữ **Tiếng Việt / English (`vi` / `en`)**.
   - Chống XSS, lọc từ nhạy cảm tiếng Việt, giới hạn tần suất (Rate Limiting), nút **Chặn (Block)** & **Báo Cáo (Report)** ngay khi bấm vào người chơi.
   - Chế độ **Tương phản cao (WCAG AA)**, **Giảm chuyển động**, **Joystick tay trái**, và tự động hạ cấu hình khi FPS thấp trên điện thoại yếu.

---

## 🚀 Chạy Nhanh Trong 60 Giây

### 1. Cài đặt & Khởi động
```bash
npm install
npm start
```
Mở trình duyệt tại: **http://localhost:3000**

### 2. Kiểm tra Cú pháp & Chạy Smoke Test Tự Động
```bash
npm run build
npm test
```

### 3. Biến Môi Trường (`.env`)
Sao chép `.env.example` sang `.env` (tùy chọn):
```ini
PORT=3000
DB_PATH=./world.db
CORS_ORIGIN=*
ADMIN_KEY=change-me-admin-secret
```

### 4. Chạy với Docker
```bash
docker build -t cho-viet-3d .
docker run -d -p 3000:3000 -v cho_data:/app/data --name cho-viet-3d cho-viet-3d
```

---

## 🗂️ Kiến Trúc Thư Mục

- `server/index.js` — Express + Socket.IO server, xác thực `playerToken`, phân phòng (tối đa 30 người/phòng công khai + phòng riêng 4 ký tự), lọc chat `nearby` 18m, Area-of-Interest 80m.
- `server/world.js` — Trạng thái thế giới, NPC theo khung giờ, sạp hàng, câu cá, nhà riêng & sổ lưu bút.
- `server/persistence.js` — SQLite schema & migration tự động không mất dữ liệu cũ (`world.db`).
- `server/moderation.js` — Bộ lọc ngôn từ tiếng Việt, chuẩn hóa Unicode NFC, Rate Limiter theo socket.
- `server/seats.js` — Quản lý 19 ghế ngồi chung & thưởng Điểm Thân Thiết khi ngồi trò chuyện.
- `server/activities/index.js` — Điều phối Giờ Vàng, Sân Khấu Mở, Kéo Co, Làng Nghề Hợp Tác, Cây Đa Ước Nguyện, Cột Mốc Cộng Đồng, Xe Điện Xanh.
- `shared/world-layout.js` — Tọa độ 9 khu vực (`ZONES`), 19 ghế (`SEATS`), 5 trạm xe điện (`BUS_STOPS`).
- `shared/festivals.js` — Lịch lễ hội Việt Nam & cấu hình trang trí.
- `client/index.html`, `client/js/town-expansion.js`, `client/i18n.js`, `client/css/open-playground.css` — Giao diện 3D Three.js, Onboarding <10s, i18n, Accessibility, Photo Mode, PWA.
- `scripts/smoke-test.js` — Kịch bản kiểm thử tự động toàn diện (Bảo mật, Chống chiếm tên, Chat, Đá cầu, Ghế ngồi, Ước nguyện).
