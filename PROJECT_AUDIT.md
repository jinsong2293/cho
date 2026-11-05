# PROJECT AUDIT — CHỢ: THỊ TRẤN VIỆT NAM 3D

## 1. Tổng Quan Dự Án (Repository Overview)
- **Tên dự án**: CHỢ — Thị Trấn Việt Nam 3D (`jinsong2293/cho`)
- **Mục tiêu cốt lõi**: Thế giới xã hội 3D nhiều người chơi (Multiplayer 3D Social Town) mang đậm bản sắc văn hóa đời thường Việt Nam, kết hợp giao lưu cộng đồng, kinh doanh sạp chợ truyền thống, mini-game dân gian và hoạt động do người chơi tự khởi xướng.
- **Công nghệ sử dụng**:
  - **Frontend**: HTML5, CSS3 (Custom Glassmorphic Design System), Three.js (`r128+` local bundle `/libs/three.min.js` & `/libs/OrbitControls.js`), Socket.IO Client, Web Audio API synthesizer.
  - **Backend**: Node.js, Express (`^5.3.0`), Socket.IO (`^4.8.4`).
  - **Database**: SQLite (`better-sqlite3` `^13.0.3`) lưu trữ bền vững tại `market.db`.

## 2. Cấu Trúc Thư Mục Hiện Tại
```text
/
├── client/
│   └── index.html          # Ứng dụng 3D WebGL + UI/UX + Socket.IO Client + Web Audio
├── server/
│   ├── config.js           # Cấu hình cổng, CORS, đường dẫn SQLite, tickRate (20Hz)
│   ├── index.js            # Máy chủ HTTP Express + Socket.IO + Game Loop 20Hz
│   ├── persistence.js      # Tầng lưu trữ SQLite (players, quests, leaderboard)
│   └── world.js            # Trạng thái thế giới (Server-Authoritative State)
├── shared/
│   └── constants.js        # Hằng số dùng chung (GOODS, MARKET_EVENTS, QUESTS_CONFIG)
├── three.min.js            # Thư viện Three.js phục vụ nội bộ (Zero-404)
├── OrbitControls.js        # Điều khiển góc nhìn 3D
└── package.json            # Cấu hình scripts & dependencies
```

## 3. Các Tính Năng Đang Hoạt Động Tốt (Preserved Core Systems)
1. **Hệ thống Kinh Doanh Sạp Chợ**:
   - 6 sạp hàng trung tâm quanh Đài Sen Vàng (*Sạp Trái Cây Miền Tây, Quán Cà Phê Vợt & Nước Mía, Tiệm Phở Bò & Bánh Mì Sài Gòn, Hàng Nón Lá & Hoa Xuân, Bách Hóa Tổng Hợp, Tiệm Trầm Hương*).
   - Nhập sỉ hàng hóa từ **Chợ Đầu Mối**, bày hàng lên mẹt tre, nâng cấp sạp (Cấp 1 → 3), thuê phụ quán đứng bán (+15% giá bán).
   - 10 NPC khách hàng đi chợ tự động với hội thoại mặc cả dí dỏm và mua hàng thật, cộng doanh thu trực tiếp cho chủ sạp.
2. **Hệ thống Sự Kiện Loa Phường & Thời Tiết Động 3D**:
   - 5 sự kiện thời tiết (*Nắng Gắt 40°C, Mưa Rào Chiều Phố Chợ, Đoàn Khách Tây Ba Lô, Ghe Hàng Miền Tây, Lễ Hội Hoa Xuân*) tác động trực tiếp đến hệ số giá mua/bán và hiệu ứng hạt 3D.
3. **Hệ thống Bầu Cua Tôm Cá & Gánh Lô Tô**:
   - Máy trạng thái Bầu Cua đồng bộ toàn máy chủ (`betting` 20s → `rolling` 4s → `result` 7s) kèm hoạt ảnh bát úp lắc xúc xắc 3D.
4. **Bốn Phân Khu Thị Trấn**:
   - Khu Chợ Trung Tâm, Phố Dân Cư (Nhà riêng & Tiệm sửa xe/Tạp hóa), Bến Sông Quê (Câu cá), Nhà Văn Hóa (Bảng tin sự kiện cộng đồng do người chơi tạo).

## 4. Các Điểm Hạn Chế & Lỗi Kiến Trúc Đã Phát Hiện Cần Khắc Phục Ngay
1. **Hệ thống Nhân vật 3D (`createCharacterMesh`) chưa phản ánh trang phục tùy chỉnh**:
   - Dù có bảng chọn Nón Lá / Mũ Bảo Hiểm / Khăn Rằn và Áo Bà Ba / Áo Dài / Áo Thun, hàm `createCharacterMesh` hiện tại mới chỉ đổi màu khối trụ thân áo và luôn gắn cố định Nón Lá.
   - Ngoại hình tùy chỉnh chưa được lưu vào SQLite (`persistence.js`) và chưa đồng bộ đầy đủ khi người chơi mới vào phòng.
2. **Bong bóng chat 3D trên đầu nhân vật chưa được kích hoạt khi chat**:
   - Hàm `showFloatingSpeechOnChar` đã có nhưng sự kiện `socket.on('chat_message')` chưa gọi hàm này, khiến người chơi đứng cạnh nhau trong không gian 3D không thấy bong bóng hội thoại nổi lên trên đầu nhân vật.
3. **Thiếu phân tách Chat Toàn Thị Trấn vs Chat Gần (Proximity Chat) & Hệ thống Kết Bạn (Friend System)**:
   - Người chơi chưa có danh sách bạn bè lưu trữ bền vững, chưa biết bạn bè đang đứng ở khu vực nào trong thị trấn và chưa có nút chạy nhanh tới chỗ bạn bè.
4. **Kiến trúc Nhà Phố Việt Nam (`buildVietnameseShophouses`) còn đơn giản**:
   - Các tòa nhà shophouse ngoại vi hiện chỉ gồm khối hộp + mái chóp + 1 thanh ban công, thiếu cửa chớp gỗ phố cổ, giàn hoa giấy ban công, mái hiên ngói, cột điện và đường dây điện phố thị đặc trưng Việt Nam.
5. **Thiếu hoạt động vận động tập thể trực tiếp giữa sân chợ**:
   - Cần bổ sung hoạt động **Đá Cầu Kiểng Tập Thể** ngay tại sân chợ để người chơi cùng nhau tâng cầu, tạo combo kỷ lục chung của thị trấn.
