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

// Vận tốc di chuyển
const MOVE_SPEED = 6.0;

module.exports = {
  GOODS,
  MARKET_EVENTS,
  STALL_COST,
  STALL_UPGRADE_COSTS,
  HIRE_STAFF_COST,
  GACHA_COST,
  QUESTS_CONFIG,
  DAY_LENGTH,
  TICK_RATE,
  MAX_PLAYERS,
  INITIAL_MONEY,
  MIN_NICKNAME_LENGTH,
  MAX_NICKNAME_LENGTH,
  MOVE_SPEED,
};
