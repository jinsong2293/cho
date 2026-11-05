/*
 * Shared constants used between client & server.
 * Chợ Thị Trấn Việt Nam 3D — Sầm Uất & Vui Nhộn
 */

// Danh mục hàng hóa đậm chất Chợ Việt Nam
const GOODS = [
  { id: "apple",  name: "Xoài Cát Hòa Lộc",       buy: 1400, sell: 2100, category: "Trái cây",  color: 0xfacc15, icon: "🥭", desc: "Ngọt lịm thơm lừng chuẩn đặc sản miền Tây" },
  { id: "orange", name: "Sầu Riêng Ri6 Chín Cây", buy: 2200, sell: 3400, category: "Trái cây",  color: 0x84cc16, icon: "🍈", desc: "Múi vàng cơm dày hạt lép, bao ăn bao sượng" },
  { id: "carrot", name: "Nước Mía Siêu Sạch",     buy: 1000, sell: 1600, category: "Giải khát", color: 0xa3e635, icon: "🥤", desc: "Ép tắc thơm mát lạnh giải nhiệt ngày hè" },
  { id: "bread",  name: "Bánh Mì Sài Gòn",        buy: 1500, sell: 2300, category: "Ẩm thực",   color: 0xd97706, icon: "🥖", desc: "Full topping chả lụa, pate, thịt nướng giòn rụm" },
  { id: "cake",   name: "Phở Bò Gia Truyền",      buy: 2600, sell: 4000, category: "Ẩm thực",   color: 0xef4444, icon: "🍜", desc: "Nước dùng ninh xương 24h thơm nức cả góc chợ" },
  { id: "coffee", name: "Cà Phê Sữa Đá Phin",     buy: 1800, sell: 2900, category: "Giải khát", color: 0x78350f, icon: "☕", desc: "Đậm đà chuẩn vị vỉa hè Việt Nam" },
  { id: "tea",    name: "Bún Đậu Mắm Tôm Mẹt",    buy: 2400, sell: 3700, category: "Ẩm thực",   color: 0xa855f7, icon: "🍱", desc: "Đậu rán giòn, chả cốm, mắm tôm đánh bông" },
  { id: "flower", name: "Hoa Mai & Đào Chợ Tết",  buy: 1900, sell: 3000, category: "Hoa tươi",  color: 0xf43f5e, icon: "🌸", desc: "Hoa tươi khoe sắc rước tài lộc về nhà" },
  { id: "toy",    name: "Nón Lá & Mây Tre Đan",   buy: 3000, sell: 4600, category: "Thủ công",  color: 0xfbbf24, icon: "👒", desc: "Thủ công mỹ nghệ truyền thống Việt Nam" },
  { id: "gem",    name: "Trầm Hương & Ngọc Phố Cổ", buy: 8000, sell: 13500, category: "Đặc sản", color: 0x10b981, icon: "💎", desc: "Kỳ trân dị bảo thượng hạng dành cho phú hộ" },
];

// Sự kiện Loa Phường Thị Trấn Việt Nam gắn liền với Thời Tiết Động
const MARKET_EVENTS = [
  {
    id: "hot_summer",
    title: "🔥 Nắng Gắt Đỉnh Điểm 40°C!",
    description: "Trời nắng gắt tỏa nhiệt! Bà con đổ xô giải nhiệt, giá Giải khát & Trái cây tăng +45%!",
    weather: "heatwave",
    sellMultiplier: 1.15,
    buyMultiplier: 1.0,
    boostCategory: ["Giải khát", "Trái cây"],
  },
  {
    id: "tropical_rain",
    title: "🌧️ Cơn Mưa Rào Chiều Phố Chợ!",
    description: "Mưa rơi mát mẻ khắp thị trấn! Phở Bò nóng hổi & Bánh Mì Sài Gòn đắt khách (+45% giá bán)!",
    weather: "rain",
    sellMultiplier: 1.15,
    buyMultiplier: 1.0,
    boostCategory: ["Ẩm thực"],
  },
  {
    id: "tourists_visit",
    title: "🎒 Đoàn Khách Tây Ba Lô Ghé Thăm Chợ!",
    description: "Trời nắng đẹp, du khách quốc tế mê mẩn quà Việt! Giá bán mọi mặt hàng tăng +35%!",
    weather: "clear",
    sellMultiplier: 1.35,
    buyMultiplier: 1.0,
    boostCategory: null,
  },
  {
    id: "mekong_boats",
    title: "🚤 Ghe Hàng Miền Tây Về Trong Mưa Phùn!",
    description: "Nông sản về ngập bến! Giá nhập sỉ toàn bộ hàng ở Chợ Đầu Mối giảm sốc -25%!",
    weather: "rain",
    sellMultiplier: 1.0,
    buyMultiplier: 0.75,
    boostCategory: null,
  },
  {
    id: "lantern_festival",
    title: "🏮 Lễ Hội Hoa Bay & Đèn Lồng Phố Cổ!",
    description: "Cánh hoa bay rợp trời! Nhóm Ẩm thực, Hoa tươi & Đặc sản tăng giá +45%!",
    weather: "blossom",
    sellMultiplier: 1.15,
    buyMultiplier: 1.0,
    boostCategory: ["Ẩm thực", "Hoa tươi", "Đặc sản"],
  },
];

// Chi phí và cấp độ sạp hàng
const STALL_COST = 5000;
const STALL_UPGRADE_COSTS = {
  2: 8000,   // Nâng cấp lên Cấp 2 (Kiot Khang Trang)
  3: 20000,  // Nâng cấp lên Cấp 3 (Tiệm Lớn Phố Cổ)
};
const HIRE_STAFF_COST = 10000;
const GACHA_COST = 2000;

// Các nhiệm vụ trong trò chơi (Ưu tiên Giao Lưu & Khám Phá trước, Kinh Doanh tùy chọn)
const QUESTS_CONFIG = [
  { id: "join_town", title: "Bà con mới nhập hộ khẩu", description: "Gia nhập Thị Trấn Chợ Việt Nam", target: 1, reward: 2000 },
  { id: "social_greet", title: "Lời chào cao hơn mâm cỗ", description: "Gửi lời chào hoặc biểu cảm giao lưu 3 lần", target: 3, reward: 2500 },
  { id: "sit_tea_together", title: "Trà đá vỉa hè rôm rả", description: "Ngồi ghế trà đá hoặc ghế công viên nghỉ chân", target: 1, reward: 2500 },
  { id: "kick_shuttlecock_5", title: "Nghệ nhân Đá Cầu Kiểng", description: "Tham gia tâng cầu kiểng 5 cú cùng bà con", target: 5, reward: 3500 },
  { id: "make_a_wish", title: "Gửi điều ước lành", description: "Thả 1 Đèn Hoa Đăng hoặc treo điều ước lên Cây Ước Nguyện", target: 1, reward: 3000 },
  { id: "buy_wholesale", title: "Buôn tận gốc, bán tận ngọn", description: "Nhập ít nhất 5 món hàng từ Chợ Đầu Mối", target: 5, reward: 3500 },
  { id: "own_stall", title: "Mở sạp khai trương", description: "Thuê sạp hàng đầu tiên của bạn trong chợ", target: 1, reward: 5000 },
  { id: "stock_goods", title: "Bày hàng lên mẹt tre", description: "Đưa 5 sản phẩm lên sạp để bán cho bà con", target: 5, reward: 4000 },
  { id: "sell_customers", title: "Buôn may bán đắt", description: "Bán thành công 5 đơn hàng cho khách đi chợ", target: 5, reward: 6500 },
  { id: "upgrade_stall", title: "Nâng cấp Kiot phố chợ", description: "Nâng cấp sạp hàng lên Cấp 2", target: 1, reward: 9000 },
  { id: "hire_worker", title: "Ông bà chủ nhàn hạ", description: "Thuê 1 phụ quán đứng bán hàng tự động", target: 1, reward: 12000 },
  { id: "play_gacha", title: "Thử vận may Lô Tô Hội Chợ", description: "Quay số Lô Tô Hội Chợ 1 lần", target: 1, reward: 3000 },
];

// Thời gian & Thông số mạng
const DAY_LENGTH = 120000;          // 2 phút cho 1 ngày đêm
const TICK_RATE = 20;               // 20 Hz server tick
const MAX_PLAYERS = 50;
const INITIAL_MONEY = 15000;        // Tiền khởi điểm: 15.000đ
const MIN_NICKNAME_LENGTH = 2;
const MAX_NICKNAME_LENGTH = 16;

// Cấu hình Hệ Thống Bất Động Sản, Xây Nhà & Cửa Hàng Nội Thất
const HOUSING_CONFIG = {
  plotCost: 10000, // Chi phí mua lô đất nền có sổ đỏ: 10.000đ
  levels: [
    { level: 0, name: "Chưa Mua Đất", title: "Cư Dân Tự Do", cost: 0, desc: "Chưa sở hữu bất động sản tại thị trấn." },
    { level: 1, name: "Nhà Mái Lá Quê Hương", title: "Chủ Đất Sơ Cấp", cost: 15000, desc: "Khuôn viên đất riêng, nhà tre mái lá tranh mộc mạc, giàn mướp và chum nước." },
    { level: 2, name: "Nhà Gỗ Ba Gian", title: "Hộ Dân An Cư", cost: 35000, desc: "Cột gỗ lim chắc chắn, mái ngói âm dương đỏ au, hàng rào dâm bụt." },
    { level: 3, name: "Nhà Phố Cổ Hội An", title: "Gia Đình Khá Giả", cost: 80000, desc: "Tường vàng nghệ tây rực rỡ, lồng đèn ngũ sắc, giàn hoa giấy tím trước ban công." },
    { level: 4, name: "Biệt Thự Nhà Vườn", title: "Thương Gia Thành Đạt", cost: 180000, desc: "Sân gạch bát tràng thênh thang, hòn non bộ phong thủy, hồ cá koi và cổng tam quan." },
    { level: 5, name: "Dinh Thự Hoàng Gia", title: "Đại Phú Hộ Thị Trấn", cost: 380000, desc: "Mái đao thếp vàng lưỡng long chầu nguyệt, đèn lụa cung đình lộng lẫy tột đỉnh." },
  ],
  items: [
    // Nội thất phòng khách
    { id: "sap_gu", name: "Sập Gụ Tủ Chè Cổ", category: "Nội thất", price: 12000, icon: "🛋️", comfort: 15, desc: "Gỗ gụ quý chạm khắc tích cổ, thể hiện đẳng cấp gia chủ" },
    { id: "ban_ghe_mun", name: "Bộ Ghế Gỗ Mun Chạm Rồng", category: "Nội thất", price: 28000, icon: "🪑", comfort: 25, desc: "Gỗ mun đen tuyền uy nghiêm, tay ngai chạm long phụng" },
    { id: "trang_ky_huong", name: "Bộ Tràng Kỷ Gỗ Hương", category: "Nội thất", price: 45000, icon: "✨", comfort: 40, desc: "Hương gỗ ngào ngạt, vân mây uốn lượn tuyệt mỹ" },
    { id: "ban_tra_dao", name: "Bàn Trà Đạo Gỗ Trắc", category: "Nội thất", price: 18000, icon: "🍵", comfort: 20, desc: "Bàn trà nguyên khối đãi khách quý thưởng trà đàm đạo" },
    // Tranh & Nghệ thuật
    { id: "tranh_dong_ho", name: "Tranh Đông Hồ 'Vinh Hoa'", category: "Trang trí", price: 8000, icon: "🖼️", comfort: 10, desc: "Tranh khắc gỗ dân gian trên giấy điệp lấp lánh" },
    { id: "tranh_tu_binh", name: "Bộ Tranh Tứ Bình Tùng Cúc Trúc Mai", category: "Trang trí", price: 16000, icon: "🎋", comfort: 18, desc: "Biểu trưng cho 4 mùa phú quý bình an" },
    { id: "den_long_ngu_sac", name: "Cặp Đèn Lồng Lụa Ngũ Sắc", category: "Trang trí", price: 6500, icon: "🏮", comfort: 8, desc: "Tỏa ánh sáng lung linh ấm áp mỗi khi đêm về" },
    { id: "cong_chieng_dong", name: "Cồng Chiêng Tây Nguyên Đồng Đỏ", category: "Trang trí", price: 22000, icon: "🔔", comfort: 22, desc: "Âm vang núi rừng đại ngàn rước tài lộc" },
    // Ngoại thất & Cảnh quan sân vườn
    { id: "hon_non_bo", name: "Hòn Non Bộ Phong Thủy", category: "Sân vườn", price: 32000, icon: "🏞️", comfort: 30, desc: "Tiểu cảnh non xanh nước biếc tụ khí sinh tài" },
    { id: "be_ca_koi", name: "Bể Cá Chép Vàng & Cá Koi", category: "Sân vườn", price: 42000, icon: "🐟", comfort: 35, desc: "Đàn cá thong dong bơi lội rước vận may" },
    { id: "gieng_nuoc_co", name: "Giếng Nước Cổ Đá Ong", category: "Sân vườn", price: 15000, icon: "🪣", comfort: 15, desc: "Giếng làng rêu phong nước ngọt trong veo" },
    { id: "mai_vang_co", name: "Cây Mai Vàng Cổ Thụ", category: "Sân vườn", price: 26000, icon: "🌼", comfort: 24, desc: "Hoa nở vàng rực bốn mùa đại cát đại lợi" },
    { id: "dao_phai_bac", name: "Chậu Đào Phai Xứ Bắc", category: "Sân vườn", price: 24000, icon: "🌸", comfort: 22, desc: "Sắc hoa xuân thắm đượm hương vị Tết cổ truyền" },
    { id: "gian_hoa_giay", name: "Giàn Hoa Giấy Tím Rực Rỡ", category: "Sân vườn", price: 14000, icon: "🌺", comfort: 16, desc: "Bao phủ hiên nhà thơ mộng như phố cổ Hội An" }
  ]
};

// Vận tốc di chuyển
const MOVE_SPEED = 6.0;

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    GOODS,
    MARKET_EVENTS,
    STALL_COST,
    STALL_UPGRADE_COSTS,
    HIRE_STAFF_COST,
    GACHA_COST,
    QUESTS_CONFIG,
    HOUSING_CONFIG,
    DAY_LENGTH,
    TICK_RATE,
    MAX_PLAYERS,
    INITIAL_MONEY,
    MIN_NICKNAME_LENGTH,
    MAX_NICKNAME_LENGTH,
    MOVE_SPEED,
  };
}

if (typeof window !== "undefined") {
  window.GameConstants = {
    GOODS,
    MARKET_EVENTS,
    STALL_COST,
    STALL_UPGRADE_COSTS,
    HIRE_STAFF_COST,
    GACHA_COST,
    QUESTS_CONFIG,
    HOUSING_CONFIG,
    DAY_LENGTH,
    TICK_RATE,
    MAX_PLAYERS,
    INITIAL_MONEY,
    MIN_NICKNAME_LENGTH,
    MAX_NICKNAME_LENGTH,
    MOVE_SPEED,
  };
  window.HOUSING_CONFIG = HOUSING_CONFIG;
}
