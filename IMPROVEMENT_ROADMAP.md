# IMPROVEMENT ROADMAP — CHỢ: THỊ TRẤN VIỆT NAM 3D (SÂN CHƠI MỞ & THỊ TRẤN SỐNG)

## PHASE 0 — Kết Quả Kiểm Toán Nhanh (Đã Xác Nhận & Khắc Phục Triệt Để)

1. **Lỗ hổng lộ file tĩnh (`/libs`)**: Trong `server/index.js`, `app.use("/libs", express.static(path.join(__dirname, "..")))` trước đây phục vụ toàn bộ thư mục gốc repository (`/libs/world.db`, `/libs/server/index.js`, `/libs/package.json`). **Đã sửa**: Whitelist tuyệt đối chỉ `/libs/three.min.js` và `/libs/OrbitControls.js`; mọi đường dẫn khác trả về HTTP 404.
2. **Lỗ hổng XSS qua `innerHTML`**: Trong `client/index.html`, `addChatMessage()` và các hàm render modal chèn trực tiếp chuỗi người chơi vào `innerHTML`. **Đã sửa**: Bọc toàn bộ dữ liệu động qua `escapeHtml()` và chuyển hiển thị tin nhắn chat sang `textContent` an toàn.
3. **Danh tính & Chiếm quyền tài khoản**: Server trước đây chỉ định danh bằng `nickname`. **Đã sửa**: Bổ sung cơ chế không mật khẩu (`playerToken` băm SHA-256 lưu trong cột `token_hash` + Mã khôi phục 6 ký tự `recoveryCode`). Nếu người lạ nhập trùng tên sẽ bị từ chối với mã `NICKNAME_TAKEN` kèm 3 tên gợi ý đẹp.
4. **Thiếu kiểm soát tốc độ & tần suất (Rate-limit & Anti-cheat)**: **Đã sửa**: Thêm `server/moderation.js` giới hạn tần suất (`chat` ≤1 tin/giây & ≤8 tin/10 giây, `emote` ≤2/giây, `move` ≤30/giây, `action` ≤6/giây) và kẹp biên bản đồ `[-64, 64]` + giới hạn bước nhảy tối đa mỗi bước trong `world.updatePlayerMove()`.
5. **Kênh Chat `nearby` & Lịch sử Chat**: **Đã sửa**: Server lọc khoảng cách thực tế `<= 18m` trước khi gửi `chat_message` kênh `nearby`, đồng thời lưu tối đa 30 tin nhắn lịch sử kênh `town` cho từng phòng.
6. **Kiểm duyệt & An toàn cộng đồng**: **Đã sửa**: Tạo `server/moderation.js` (chuẩn hóa Unicode NFC, lọc từ nhạy cảm tiếng Việt có/không dấu thành `***`), thêm tính năng **Chặn (`blockPlayer`)**, **Báo cáo (`reportPlayer` ghi vào bảng SQLite `reports`)** và lệnh quản trị `adminCommand` bảo vệ bởi `ADMIN_KEY`.
7. **Phòng chơi & Khả năng mở rộng**: **Đã sửa**: Tự động chia phòng công khai (`public-1`, `public-2`... tối đa 30 người/phòng) và hỗ trợ tạo/vào phòng riêng 4 ký tự (`?room=ABCD`), tự dọn phòng riêng trống sau 10 phút.
8. **Onboarding < 10 Giây & Trợ năng (Accessibility & i18n)**: **Đã sửa**: Thiết kế lại màn hình vào chơi với 6 bộ nhân vật mẫu Việt Nam, gợi ý tên ngẫu nhiên, đếm người online (`/api/online`), đa ngôn ngữ `vi`/`en` (`client/i18n.js`), chế độ Tương phản cao WCAG AA, Giảm chuyển động, Joystick tay trái và nút **Đi tới... (`openGoToModal`)**.
9. **Kiến trúc Không gian Dữ liệu hóa & Thị Trấn Sống (Phases 8–12)**: **Đã sửa**: Dữ liệu hóa 9 khu vực (`shared/world-layout.js`), 19 ghế ngồi chung (`server/seats.js`), 7 hoạt động hợp tác (`server/activities/index.js`), 4 phân khu mở rộng (Phố Ẩm Thực Đêm & Sân Khấu Bắc, Công Viên Hồ Sen & Sân Làng Tây, Làng Nghề & Vườn Cộng Đồng Đông, Bến Sông Chợ Nổi & Đồi Ngắm Cảnh Nam), Tuyến Xe Điện Xanh 5 trạm, Lịch Lễ Hội Việt Nam (`shared/festivals.js`), Cây Đa Ước Nguyện, Điểm Thân Thiết & Danh hiệu xã hội, Sổ Tay Sưu Tầm 24 kỷ vật, Chế độ Chụp Ảnh Bưu Thiếp và `window.__perfReport()`.

---

## Bảng Theo Dõi Tiến Độ Các Phase (Phase 0 → Phase 12)

| Phase | Hạng Mục Trọng Tâm | Trạng Thái | File Đã Tạo / Cập Nhật |
| :--- | :--- | :--- | :--- |
| **Phase 0** | Kiểm toán nhanh bảo mật, mạng, UX, trợ năng & không gian | ✅ Hoàn thành | `IMPROVEMENT_ROADMAP.md` |
| **Phase 1** | An toàn & Nền tảng (Whitelist `/libs`, chống XSS `escapeHtml`, `playerToken` + `recoveryCode`, Rate-limit, `server/moderation.js`, Chặn/Báo cáo, Chat `nearby` 18m, 30 tin lịch sử) | ✅ Hoàn thành | `server/index.js`, `server/moderation.js`, `server/persistence.js`, `client/index.html`, `client/i18n.js` |
| **Phase 2** | Vào chơi trong < 10 giây (Nút lớn VÀO CHƠI NGAY, tên gợi ý 🎲, 6 thẻ nhân vật mẫu, 3 thẻ hướng dẫn ngắn, mã phòng `?room=ABCD`, `/api/online`) | ✅ Hoàn thành | `client/index.html`, `client/js/town-expansion.js`, `client/css/open-playground.css` |
| **Phase 3** | Giao lưu là trung tâm (Phòng ≤30 người & phòng riêng 4 ký tự, Cô Loa chào đón người mới, Chat nhanh ngữ cảnh, Giờ Vàng, Thả hoa đăng & Làng nghề hợp tác, Tab chat) | ✅ Hoàn thành | `server/world.js`, `server/index.js`, `server/activities/index.js`, `client/js/town-expansion.js` |
| **Phase 4** | Thiết kế đồng bộ & Hiệu năng (Design tokens `:root`, HUD gọn, Tự động chọn mức đồ họa Thấp/Vừa/Cao theo FPS) | ✅ Hoàn thành | `client/css/open-playground.css`, `client/js/town-expansion.js` |
| **Phase 5** | Dễ tiếp cận & Đa ngôn ngữ (`client/i18n.js` vi/en, Phóng to chữ, Mục tiêu chạm ≥44px, Tương phản cao, Giảm chuyển động, Tay thuận cần gạt, Nút "Đi tới…", ARIA) | ✅ Hoàn thành | `client/i18n.js`, `client/css/open-playground.css`, `client/index.html`, `client/js/town-expansion.js` |
| **Phase 6** | Triển khai & Lan tỏa (PWA `manifest.webmanifest` + `sw.js` + `icon.svg`, OpenGraph/Twitter cards, `package.json`, `.env.example`, `Dockerfile`, `README.md`, Luật chơi vui vẻ) | ✅ Hoàn thành | `client/manifest.webmanifest`, `client/sw.js`, `client/icon.svg`, `.env.example`, `Dockerfile`, `README.md`, `package.json` |
| **Phase 7** | Kiểm thử tự động (`scripts/smoke-test.js` với `npm test`) | ✅ Hoàn thành | `scripts/smoke-test.js` (12/12 nhóm kiểm thử tự động vượt qua 100%) |
| **Phase 8** | Nền tảng Không gian (`shared/world-layout.js`, `server/seats.js`, `server/activities/index.js`, Xe điện xanh 5 trạm, Xe máy đèo bạn) | ✅ Hoàn thành | `shared/world-layout.js`, `server/seats.js`, `server/activities/index.js`, `server/world.js` |
| **Phase 9** | Mở rộng Thị trấn 9 Khu vực (`docs/zones/*.md`, Phố Đêm & Sân Khấu Bắc, Hồ Sen & Sân Làng Tây, Làng Nghề & Vườn Đông, Chợ Nổi & Đồi Nam) | ✅ Hoàn thành | `docs/zones/night-food-stage.md`, `docs/zones/lotus-park-village.md`, `docs/zones/craft-village-garden.md`, `docs/zones/floating-market-hill.md`, `client/js/town-expansion.js` |
| **Phase 10** | Thị trấn sống (Nhịp ngày Sáng-Trưa-Chiều-Tối, NPC có lịch sống & tự tăng hoạt động khi vắng, Lịch lễ hội `shared/festivals.js` & `?festival=trungthu`, Cầu vồng sau mưa) | ✅ Hoàn thành | `shared/festivals.js`, `server/world.js`, `client/js/town-expansion.js` |
| **Phase 11** | Dấu ấn người chơi (Cột mốc cộng đồng & Bảng Vàng, Cây Ước Nguyện & Đèn Hoa Đăng, Điểm Thân Thiết & Danh hiệu xã hội, Chế độ Chụp ảnh & Sổ Sưu Tầm, Sổ lưu bút nhà riêng) | ✅ Hoàn thành | `server/activities/index.js`, `server/world.js`, `shared/constants.js`, `client/index.html`, `client/js/town-expansion.js` |
| **Sprint 3B** | Sửa Giao diện & Cảnh 3D Theo Ảnh Thực Tế (HUD 1 hàng, chống chồng chéo, Camera thứ ba, Bầu trời & Fog, Vành đai khép kín, Thời tiết 1 nguồn chuẩn) | ✅ Hoàn thành | `client/index.html`, `client/css/open-playground.css`, `shared/weather.js`, `scripts/test-hud-overlap.js`, `scripts/test-weather-consistency.js`, `docs/evidence/3B/` |
| **Giai đoạn Sửa Ngay (Việc 1-5)** | Màn hình vào game v2, i18n 100% khóa, Sửa toàn diện Bầu Cua, Thống nhất Thời tiết & Dọn repo | ✅ Hoàn thành | `client/index.html`, `client/i18n.js`, `client/css/open-playground.css`, `client/js/town-expansion.js`, `shared/weather.js`, `scripts/test-i18n.js`, `scripts/test-baucua-round.js`, `scripts/test-weather-consistency.js`, `client/libs/` |

---

## Kết Quả Nghiệm Thu (`npm run build && npm test`)

- **Kiểm tra cú pháp (`npm run build`)**: Tất cả 11 module Server, Shared và Client vượt qua `node -c` không có lỗi.
- **Kiểm thử tự động (`npm test` / `scripts/smoke-test.js`)**:
  - Chặn truy cập trái phép `/libs/world.db`, `/libs/package.json`, `/libs/server/index.js` (`HTTP 404`).
  - Phục vụ `/libs/three.min.js`, `/health`, `/manifest.webmanifest` (`HTTP 200`).
  - Cấp `playerToken` + `recoveryCode` và chặn kẻ mạo danh (`NICKNAME_TAKEN` + 3 tên gợi ý).
  - Lọc từ nhạy cảm tiếng Việt thành `***` và chặn rò rỉ chat `nearby` ngoài bán kính `18m`.
  - Xác nhận hoạt động Đá cầu (`kickShuttlecock`), Ghế ngồi chung (`sitSeat`), Cây Đa Ước Nguyện (`createWish`), Kéo Co (`pullTugOfWar`), Sân Khấu Đêm (`performStage`), Báo cáo vi phạm (`reportPlayer`) và Phòng riêng 4 ký tự (`createPrivateRoom`).

---

## SPRINT 3B — Sửa Giao Diện & Cảnh 3D Theo Ảnh Chụp Thực Tế (Hoàn Thành Xuất Sắc)

| Hạng Mục | Trước Khi Sửa (Before) | Sau Khi Sửa (After) | Kết Quả Đo Lường Thực Tế |
| :--- | :--- | :--- | :--- |
| **Bố cục HUD** | Chiếm tới 71.9% chiều cao (desktop-wide 1080×540); 2 thanh trên cùng đè nhau, 27 nút dàn ngang che kín đáy màn hình, dải chỉ số tràn 2 dòng | CSS Grid cố định (`#ui-layer`); Top HUD đúng 1 hàng duy nhất (cao 38px), Bottom Dock gom 27 nút thành 1 nút Ngữ cảnh thích ứng + 4 icon phụ (cao 36px) | Chiếm **13.7%** tại 1080×540 (ngân sách ≤14%); Chiếm **11.3%** tại 360×640 (ngân sách ≤18%); **0 chồng chéo, 0 chữ bị cắt** |
| **Thẻ Thành Tựu & Loa Phường** | Đè cố định vĩnh viễn lên dải chỉ số (che mất Kho/Sạp/Ngày), không có nút đóng | Dạng Toast tự trượt vào, tự động thu gọn sau 4s (thành tựu) và 6s (loa phường), có nút ✕ đóng ngay | Tuyệt đối không che thanh Top HUD hoặc dải chỉ số |
| **Góc Nhìn Camera & Nhân Vật** | Camera đặt quá xa `(0, 14, 19)`, người chơi lọt thỏm không nhìn thấy, thị trấn chiếm <50% màn hình | Góc nhìn ngôi thứ ba chuẩn game xã hội: `(0, 2.5, 5.2)`, camera bám mượt theo chuyển động, thị trấn chiếm ≥85% khung nhìn, nhân vật ở 1/3 dưới | Thấy rõ trang phục, nón lá, áo dài/bà ba; có **Vòng sáng hổ phách (Aura)** dưới chân để nhận biết "đây là tôi"; phím `F1` hoặc chạm để đặt lại góc nhìn |
| **Bầu Trời & Đường Chân Trời** | Mặt phẳng xanh đơn điệu lơ lửng giữa khoảng đen/xanh trống rỗng, không có bầu trời hay sương mù | Bán cầu úp ngược **Sky Dome** 3D động + Fog sương mù chân trời (`FogExp2`) hòa sắc mượt mà theo nhịp thời gian & thời tiết | Không còn cảm giác "bản đồ lơ lửng trên bàn"; chân trời chuyển màu êm ái |
| **Khép Kín Không Gian (Enclosure)** | Đường nhựa chạy cụt ngang giữa bãi cỏ, viền vỉa hè kết thúc đột ngột không lý do | **Phía Bắc**: Cổng Làng Cổ Kính Đất Việt (mái ngói rêu phong, câu đối đỏ, lũy tre xanh); **Phía Nam**: Bờ Kè Sông Đá có lan can gỗ, hoa súng, thuyền tam bản; **Viền bao**: Vành đai 22 đồi nhấp nhô | Đường và không gian thị trấn được kết thúc tự nhiên, ấm cúng và trọn vẹn |
| **Mặt Đất & Ánh Sáng** | Mặt sân đồng màu phẳng lì, thiếu chiều sâu bóng đổ | Sân Chợ Gạch Bát Tràng đỏ ấm, vỉa hè lát đá hoa cương, đường đất nện sỏi, thảm cỏ xanh tự nhiên, ánh sáng ấm | Có chiều sâu không gian, độ bóng phản chiếu nước thay đổi theo thời tiết |
| **Dữ Liệu Thời Tiết Đồng Bộ** | Chip thời tiết ghi Mưa nhưng Banner ghi Nắng gắt 40°C, cảnh 3D không mưa | Tạo `shared/weather.js` làm **Single Source of Truth** duy nhất với 5 trạng thái chuẩn (`clear`, `heatwave`, `rain`, `blossom`, `cloudy`) | Chip Top bar, Banner Loa phường, Sky Dome, Fog và Hạt mưa/nắng/hoa 3D **đồng bộ 100%** |
| **Kiểm Thử Tự Động & Evidence** | Chưa có bài test đo lường chồng chéo tự động | Xây dựng `scripts/test-hud-overlap.js` chạy Chromium headless test 4 độ phân giải (360×640, 768×1024, 1080×540, 1366×768) | Chụp đầy đủ 8 ảnh đối chứng trước/sau lưu tại `docs/evidence/3B/`: `before-*.png` và `after-*.png` |

