# VISUAL & UI/UX AUDIT — CHỢ: THỊ TRẤN VIỆT NAM 3D

## 1. Đánh Giá Đồ Họa 3D & Bản Sắc Việt Nam

### A. Điểm Mạnh Hiện Tại
- Bố cục 4 phân khu rõ ràng: Nhà lồng Chợ Bến Thành ở phía Bắc (`z = -34`), Cổng Chào & Bến Sông ở phía Nam (`z = 26..38`), Nhà Văn Hóa ở phía Tây (`x = -26`), Phố Dân Cư ở phía Đông (`x = 26`).
- Đèn lồng Hội An treo dọc phố chợ, cây Mai Vàng, Đào Tết, Phượng Vĩ và Đa cổ thụ.
- Hiệu ứng thời tiết động 3D (mưa rơi xiên gió, hạt nhiệt nắng gắt, cánh hoa xuân bay) và pháo hoa đêm hội rực rỡ.

### B. Những Điểm Cần Nâng Cấp Đồ Họa (Visual Upgrade Targets)
1. **Kiến trúc Nhà Phố Việt Nam (`buildVietnameseShophouses`)**:
   - **Vấn đề**: Các dãy nhà phố hai bên (`x = ±38`) hiện chỉ là khối hộp đơn giản với mái chóp.
   - **Giải pháp**: Thiết kế lại thành tổ hợp kiến trúc Nhà Phố Cổ & Shophouse Việt Nam 5–9 bộ phận: tầng trệt cửa cuốn/khung gỗ, tầng lầu có **cửa chớp gỗ xanh truyền thống**, ban công sắt mỹ thuật trồng **giàn hoa giấy đỏ hồng**, mái hiên ngói che mưa và đèn tường vàng ấm.
2. **Chi tiết Đường Phố Việt Nam (Cột Điện, Dây Điện & Đèn Đường)**:
   - **Vấn đề**: Đường phố chưa có cột điện bê tông và đường dây điện chằng chịt kèm đèn đường — một nét đặc trưng không thể thiếu của phố thị Việt Nam.
   - **Giải pháp**: Bổ sung hệ thống cột điện phố chợ, xà sứ, đường dây điện võng tự nhiên (`TubeGeometry` / `Line`) và đèn đường cao áp tự động tỏa sáng vàng ấm khi trời tối.
3. **Mô hình Nhân vật 3D (`createCharacterMesh`)**:
   - **Vấn đề**: Chưa hiển thị khác biệt hình học giữa Nón Lá, Mũ Bảo Hiểm Xe Máy và Khăn Rằn Nam Bộ, cũng như chưa có tà Áo Dài tung bay.
   - **Giải pháp**: Xây dựng mô hình 3D chi tiết cho từng loại mũ (Nón lá chóp nón + quai lụa, Mũ bảo hiểm nửa đầu + kính chắn gió, Khăn rằn kẻ caro + tóc) và từng loại trang phục (Áo dài có 2 tà trước/sau chuyển động theo nhịp bước chân, Áo bà ba xẻ tà cài nút, Áo thun phố thị).
4. **Môi trường & Ánh sáng (PBR & Atmospheric Depth)**:
   - Tinh chỉnh `ACESFilmicToneMapping`, sương mù chân trời (`THREE.FogExp2`) hòa quyện theo giờ ngày/đêm, và mặt sân gạch bông/đá rửa có chiều sâu vật liệu.

## 2. Đánh Giá Giao Diện UI/UX & Mobile-First
- **Điểm mạnh**: Giao diện tối màu sang trọng, thanh công cụ dưới đáy có thể thu gọn (`Phím H`), hỗ trợ cần gạt ảo đa điểm và chạm mặt đất để chạy (Tap-to-Move).
- **Cải tiến cần thực hiện**:
  - Loại bỏ hoàn toàn các chấm nhấp nháy gây nhiễu thị giác (`@keyframes pulse` dots) theo đúng chuẩn thiết kế 3D hiện đại.
  - Thêm hiển thị **Phân Khu Hiện Tại (Current Zone Badge)** trên HUD để người chơi luôn biết mình đang ở khu vực nào (*Khu Chợ Trung Tâm, Quán Trà Đá, Bến Sông Quê, Nhà Văn Hóa, Phố Dân Cư*).
  - Bổ sung nút chuyển nhanh kênh chat (**Toàn Thị Trấn** vs **Quanh Đây 18m**) và nút **Bạn Bè (`👫 Bạn Bè`)**.
