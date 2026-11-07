/*
 * Authoritative world state for Chợ Thị Trấn Việt Nam 3D — Sân Chơi Mở & Thị Trấn Sống.
 * Supports multi-room sharding (public <=30 players + 4-char private rooms),
 * data-driven zones (shared/world-layout.js), scheduled NPCs, festivals (shared/festivals.js),
 * seats (server/seats.js), cooperative activities (server/activities/index.js),
 * social affinity titles, collection book, and house guestbooks.
 */

const {
  GOODS,
  MARKET_EVENTS,
  STALL_COST,
  STALL_UPGRADE_COSTS,
  HIRE_STAFF_COST,
  GACHA_COST,
  DAY_LENGTH,
  INITIAL_MONEY,
  HOUSING_CONFIG,
  LOTTERY_CONFIG,
  BANK_CONFIG,
  GARAGE_CONFIG,
  MARKET_SIGNALS,
  HAGGLE_CONFIG,
  STALL_RENT_PER_DAY,
  STAFF_WAGE_PER_DAY,
  STALL_EARN_CAP_PER_DAY,
  LEVEL_THRESHOLDS,
  LEVEL_TITLES,
  LEVEL_UNLOCKS,
} = require("../shared/constants");
const {
  BOUNDS,
  ZONES,
  BUS_STOPS,
  clampToBounds,
  getZoneAt,
} = require("../shared/world-layout");
const Colliders = require("../shared/colliders");
const { getActiveFestival } = require("../shared/festivals");
const {
  getPlayer,
  upsertPlayer,
  progressPlayerQuest,
  getLeaderboard,
  getSocialTitle,
  loadStalls,
  saveStall,
} = require("./persistence");
const { sanitizeText, sanitizeNickname } = require("./moderation");
const { getWeatherState, WEATHER_STATES } = require("../shared/weather");
const seatsManager = require("./seats");
const activitiesManager = require("./activities");

const MAX_ROOM_PLAYERS = 30;
const players = {};
const stalls = {};
const customers = [];
const rooms = new Map(); // roomId -> { id, isPrivate, createdAt, emptySince, chatHistory: [] }

function ensureRoom(roomId = "public-1", isPrivate = false) {
  if (!rooms.has(roomId)) {
    rooms.set(roomId, {
      id: roomId,
      isPrivate: Boolean(isPrivate),
      createdAt: Date.now(),
      emptySince: null,
      chatHistory: [],
    });
    seatsManager.ensureRoomSeats(roomId);
    activitiesManager.ensureRoomActivities(roomId);
  }
  return rooms.get(roomId);
}
ensureRoom("public-1", false);

function getPlayersInRoom(roomId = "public-1") {
  return Object.values(players).filter((p) => (p.roomId || "public-1") === roomId);
}

/**
 * Tự động chọn phòng công khai đông vui nhất còn chỗ (< 30 người) hoặc phòng riêng theo mã 4 ký tự
 */
function assignRoom(requestedRoomCode = null) {
  if (requestedRoomCode && typeof requestedRoomCode === "string") {
    const cleanCode = requestedRoomCode.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, "").slice(0, 12);
    if (cleanCode) {
      const isPriv = !cleanCode.startsWith("PUBLIC-");
      ensureRoom(cleanCode, isPriv);
      return cleanCode;
    }
  }

  let bestRoom = null;
  let bestCount = -1;
  for (const [rId, rMeta] of rooms.entries()) {
    if (rMeta.isPrivate) continue;
    const count = getPlayersInRoom(rId).length;
    if (count < MAX_ROOM_PLAYERS && count > bestCount) {
      bestRoom = rId;
      bestCount = count;
    }
  }

  if (bestRoom) return bestRoom;

  let idx = 1;
  while (rooms.has(`public-${idx}`)) idx++;
  const newPublicId = `public-${idx}`;
  ensureRoom(newPublicId, false);
  return newPublicId;
}

function createPrivateRoom() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 4; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  ensureRoom(code, true);
  return code;
}

function addRoomChatHistory(roomId, chatEntry) {
  const r = ensureRoom(roomId);
  r.chatHistory.push(chatEntry);
  if (r.chatHistory.length > 30) {
    r.chatHistory.shift();
  }
}

function getRoomChatHistory(roomId = "public-1") {
  const r = ensureRoom(roomId);
  return r.chatHistory;
}

// 6 Sạp Hàng Truyền Thống & Phố Thị Việt Nam tại Khu Chợ Bến Thành (Hai Cánh Đông - Tây)
const INITIAL_STALL_DEFS = [
  // Cánh Tây Chợ Bến Thành (x = -15)
  {
    id: "stall-1",
    name: "Sạp Trái Cây Miền Tây",
    x: -15,
    z: -25,
    color: 0x16a34a,
    category: "Trái cây",
    goods: { apple: 15, orange: 12 },
  },
  {
    id: "stall-3",
    name: "Tiệm Phở Bò & Bánh Mì Sài Gòn",
    x: -15,
    z: -30,
    color: 0xd97706,
    category: "Ẩm thực",
    goods: { bread: 16, cake: 10, tea: 8 },
  },
  {
    id: "stall-5",
    name: "Bách Hóa Tổng Hợp Phố Chợ",
    x: -15,
    z: -35,
    color: 0x0d9488,
    category: "Tổng hợp",
    goods: { apple: 10, bread: 10, coffee: 8, tea: 6 },
  },
  // Cánh Đông Chợ Bến Thành (x = +15)
  {
    id: "stall-2",
    name: "Quán Cà Phê Vợt & Nước Mía",
    x: 15,
    z: -25,
    color: 0x0284c7,
    category: "Giải khát",
    goods: { coffee: 14, carrot: 16 },
  },
  {
    id: "stall-4",
    name: "Hàng Nón Lá & Hoa Xuân",
    x: 15,
    z: -30,
    color: 0xe11d48,
    category: "Thủ công",
    goods: { toy: 12, flower: 14 },
  },
  {
    id: "stall-6",
    name: "Tiệm Trầm Hương & Ngọc Phố Cổ",
    x: 15,
    z: -35,
    color: 0x9333ea,
    category: "Đặc sản",
    goods: { gem: 8, flower: 12, toy: 8 },
  },
];

function initStalls() {
  // Lưu bền: phục hồi sạp từ SQLite (chủ sạp, hàng, doanh thu, cấp, giá) — hết cảnh restart mất sạp
  const persisted = new Map(loadStalls().map((stall) => [stall.id, stall]));
  INITIAL_STALL_DEFS.forEach((def) => {
    const saved = persisted.get(def.id);
    stalls[def.id] = {
      id: def.id,
      name: saved ? saved.name : def.name,
      owner: saved ? saved.owner : null,
      goods: saved ? saved.goods : { ...def.goods },
      earnings: saved ? saved.earnings : 0,
      level: saved ? saved.level : 1,
      hasStaff: saved ? saved.hasStaff : false,
      priceFactor: saved ? saved.priceFactor : 1,
      dailyEarnings: 0,
      dailyEarningsDay: 0,
      position: { x: def.x, z: def.z },
      color: def.color,
      category: def.category,
    };
    if (!saved) saveStall(stalls[def.id]);
  });
}
initStalls();

// Danh sách NPC có lịch sống theo giờ & hướng dẫn mềm (Phase 10.2 & Cải tiến trật tự khu vực)
const CUSTOMER_DEFS = [
  {
    name: "Cô Ba Sài Gòn",
    type: "nonla",
    role: "shopper",
    homeZone: "central_market",
    waypoints: [
      { x: -11.0, z: -10.0, wait: 6000, dialog: "Trái cây Miền Tây hôm nay tươi rói, mọng nước quá!" },
      { x: -10.5, z: 0.0, wait: 5000, dialog: "Ghé bách hóa mua ít đồ khô về nấu cơm trưa nào." },
      { x: -11.0, z: 9.5, wait: 6000, dialog: "Mùi phở bò thơm nức cả góc phố Sài Gòn!" },
      { x: -4.0, z: 0.0, wait: 5000, dialog: "Ngắm đài sen vàng buổi sáng thấy lòng nhẹ nhõm ghê." }
    ]
  },
  {
    name: "Chị Tư Trà Đá",
    type: "nonla",
    role: "tea_host",
    homeZone: "tea_table_corner",
    waypoints: [
      { x: -16.0, z: 27.0, wait: 7000, dialog: "Trà đá vỉa hè bến sông mát rượi, mời bà con dừng chân nghỉ ngơi!" },
      { x: -14.0, z: 28.0, wait: 6000, dialog: "Hạt hướng dương giòn rụm, trà chanh thanh mát ngắm cảnh sông nước!" },
      { x: -18.0, z: 28.0, wait: 7000, dialog: "Nước mía siêu sạch vừa ép xong, ngọt lịm thơm mùi tắc!" },
      { x: -16.0, z: 30.0, wait: 7000, dialog: "Tiếng đàn guitar acoustic êm đềm bên bến đò quê hương!" }
    ]
  },
  {
    name: "Chú Ba Bầu Cua",
    type: "nonla",
    role: "host",
    homeZone: "bau_cua_booth",
    waypoints: [
      { x: -48.0, z: -14.0, wait: 7000, dialog: "Bầu cua tôm cá, lắc đều tay mở liền tay! Ai may mắn rinh thưởng nào!" },
      { x: -46.0, z: -16.0, wait: 6000, dialog: "Cược con cua, bắt con tôm, trúng lớn nhân 3 tiền thưởng nghen bà con!" },
      { x: -50.0, z: -16.0, wait: 7000, dialog: "Sới Bầu Cua bên hồ thơ mộng, ghé thử vận may đầu xuân đi!" }
    ]
  },
  {
    name: "Bác Năm Thợ Xây",
    type: "helmet",
    role: "builder",
    homeZone: "residential_housing_estate",
    waypoints: [
      { x: 48.0, z: 20.0, wait: 8000, dialog: "Khu dân cư đang mở bán đất nền sổ đỏ 10.000đ! Mau dựng nhà an cư lạc nghiệp nào!" },
      { x: 50.0, z: 23.0, wait: 7000, dialog: "Từ nhà tranh vách nứa lên biệt thự nhà vườn, dinh thự hoàng gia khang trang lắm!" },
      { x: 46.0, z: 23.0, wait: 8000, dialog: "Sắm thêm sập gụ tủ chè, hòn non bộ, bể cá Koi cho gia thất vượng tài nhé!" }
    ]
  },
  {
    name: "Chú Bảy Miền Tây",
    type: "nonla",
    role: "fisher",
    homeZone: "floating_market_hill",
    waypoints: [
      { x: -1.5, z: 33.0, wait: 8000, dialog: "Gió sông thổi mát rượi, cá cắn câu giật mỏi cả tay!" },
      { x: 1.5, z: 35.0, wait: 7000, dialog: "Xuồng ba lá chở đầy dừa xiêm ngọt lịm cập bến rồi nghen!" },
      { x: 0.0, z: 38.0, wait: 9000, dialog: "Bến sông Chợ Nổi nước trong xanh, chiều ngồi ngắm hoàng hôn hết ý!" }
    ]
  },
  {
    name: "Chị Ninja Lead",
    type: "helmet",
    role: "shopper",
    homeZone: "central_market",
    waypoints: [
      { x: 11.0, z: -10.0, wait: 5000, dialog: "Chủ quán cho ly cà phê vợt nhiều sữa ít đá mang về nha!" },
      { x: 10.5, z: 0.0, wait: 6000, dialog: "Trầm hương với ngọc phố cổ tiệm này tinh xảo quá." },
      { x: 11.0, z: 9.5, wait: 6000, dialog: "Hoa xuân rực rỡ quá, mua chậu hoa về đón Tết thôi!" },
      { x: 4.0, z: 0.0, wait: 5000, dialog: "Tấp xe vỉa hè mua nhanh lẹ rồi còn kịp về đón con!" }
    ]
  },
  {
    name: "Anh Tây Ba Lô",
    type: "tourist",
    role: "explorer",
    homeZone: "night_food_stage",
    waypoints: [
      { x: -4.5, z: -41.0, wait: 7000, dialog: "Bánh tráng nướng and xiên que here taste incredible!" },
      { x: 4.5, z: -41.0, wait: 7000, dialog: "I love Vietnamese nightlife! Everyone is so friendly!" },
      { x: 0.0, z: -38.0, wait: 8000, dialog: "The night stage lights are so colorful and vibrant!" }
    ]
  },
  {
    name: "Bác Tổ Trưởng",
    type: "nonla",
    role: "guide",
    homeZone: "lotus_park_village",
    waypoints: [
      { x: -34.0, z: -3.0, wait: 8000, dialog: "Bà con nhớ giữ gìn vệ sinh chung, cùng xây dựng thị trấn văn minh nha!" },
      { x: -36.0, z: 3.0, wait: 7000, dialog: "Bảng tin cộng đồng có thông tin hoạt động mới, mời bà con ghé xem!" },
      { x: -32.0, z: 0.0, wait: 8000, dialog: "Sân Làng chiều nay mát mẻ, chuẩn bị hội kéo co tưng bừng!" }
    ]
  },
  {
    name: "Bé Na Đá Cầu",
    type: "helmet",
    role: "kid",
    homeZone: "shuttlecock_court",
    waypoints: [
      { x: 46.5, z: -16.0, wait: 6000, dialog: "Cú tâng cầu khéo quá! Ai vào sân thể thao so tài không?" },
      { x: 49.5, z: -16.0, wait: 7000, dialog: "Đá cầu kiểng phải giữ thăng bằng chuẩn bài nha!" },
      { x: 48.0, z: -13.5, wait: 8000, dialog: "Hoan hô! Lên khán đài cổ vũ cho các tuyển thủ nào!" }
    ]
  },
  {
    name: "Cô Năm Bánh Chưng",
    type: "nonla",
    role: "artisan",
    homeZone: "craft_village_garden",
    waypoints: [
      { x: 36.0, z: -2.0, wait: 8000, dialog: "Nồi bánh chưng lá dong sôi sùng sục, thơm nức cả làng nghề!" },
      { x: 39.0, z: 1.0, wait: 7000, dialog: "Gạo nếp cái hoa vàng với đỗ xanh loại một mới ngon chuẩn vị!" },
      { x: 37.0, z: -5.0, wait: 8000, dialog: "Nghề làm bánh truyền thống giữ hồn Tết quê hương bà con ơi!" }
    ]
  },
  {
    name: "Anh Shipper Vui Tính",
    type: "helmet",
    role: "shopper",
    homeZone: "east_commercial_street",
    waypoints: [
      { x: 34.0, z: 12.0, wait: 6000, dialog: "Ghé tiệm độ xe thay nhớt rồi chạy đơn tiếp cho kịp khách!" },
      { x: 20.0, z: 0.0, wait: 6000, dialog: "Đại lộ Đông - Tây rộng thênh thang, phóng xe máy êm ru!" },
      { x: 2.5, z: 12.0, wait: 6000, dialog: "Đơn bánh mì nóng hổi, cà phê đá giao ngay trong một nốt nhạc!" }
    ]
  },
  {
    name: "Ông Đồ Thầy Minh",
    type: "nonla",
    role: "elder",
    homeZone: "lotus_park_village",
    waypoints: [
      { x: -42.0, z: 6.0, wait: 9000, dialog: "Hồ sen thơm ngát, lòng người an yên... Nét chữ nết người." },
      { x: -45.0, z: 9.0, wait: 8000, dialog: "Mỗi đóa hoa đăng là một lời nguyện ước bình an cho muôn nhà." },
      { x: -40.0, z: 4.0, wait: 9000, dialog: "Trời chiều bảng lảng bóng hoàng hôn trên mặt nước hồ sen..." }
    ]
  },
  {
    name: "Chú Sáu Xích Lô",
    type: "nonla",
    role: "cyclo",
    homeZone: "central_market",
    waypoints: [
      { x: -3.5, z: 14.0, wait: 7000, dialog: "Ai đi xích lô dạo mát ngắm đại lộ thị trấn không nào?" },
      { x: -3.5, z: -14.0, wait: 7000, dialog: "Xích lô thong thả qua tháp đồng hồ Bến Thành, gió mát lộng!" },
      { x: -3.5, z: 0.0, wait: 8000, dialog: "Bà con mỏi chân cứ lên xe chú Sáu chở dạo quanh một vòng!" }
    ]
  },
  {
    name: "Ca Sĩ Phố Đêm",
    type: "tourist",
    role: "singer",
    homeZone: "night_food_stage",
    waypoints: [
      { x: 0.0, z: -45.0, wait: 9000, dialog: "Xin gửi tới quý bà con thị trấn giai điệu quê hương ngọt ngào!" },
      { x: -2.0, z: -43.0, wait: 7000, dialog: "Cảm ơn những tràng pháo tay nồng nhiệt của bà con đêm nay!" },
      { x: 2.0, z: -43.0, wait: 7000, dialog: "Âm nhạc kết nối mọi người! Cùng hát vang lên nào!" }
    ]
  },
];

const CUSTOMER_DIALOGS = [
  "Bớt cho cô 2 ngàn mua thêm hành ngò đi chủ quán!",
  "Cho ly nước mía nhiều tắc ít đá nha con ơi!",
  "Bún đậu mắm tôm quán này thơm nức cả góc chợ!",
  "Mua trái sầu riêng Ri6 về nịnh vợ mới được!",
  "Bánh mì Sài Gòn giòn rụm, ăn 1 ổ ghiền luôn!",
  "Chào bà con mới ghé chợ nhé! Ra bàn trà đá ngồi chơi!",
  "Sân Làng đang thiếu 1 người kéo co nè, ai ra phụ một tay không?",
  "Tối nay lên Phố Ẩm Thực Đêm nghe hát loa kẹo kéo vui lắm!",
];

// Thoại theo thời tiết (người bán & khách đều "sống" theo trời)
const CUSTOMER_WEATHER_DIALOGS = {
  heatwave: [
    "Nóng đỉnh điểm! Vào đây ngay một ly giải khát mát băng kệ!",
    "Trời 40 độ mà bà con ơi, mía ép lạnh đâu ra đây hết!",
  ],
  rain: [
    "Mưa rào mát quá, mùa này bún đậu bán đắt hàng lắm!",
    "Trời mưa mà chợ vẫn tấp nập, phở nóng bốc khói ngút ngàn!",
  ],
};

function initCustomers() {
  customers.length = 0;
  for (let i = 0; i < CUSTOMER_DEFS.length; i++) {
    const def = CUSTOMER_DEFS[i];
    const initialWp = def.waypoints[0];
    customers.push({
      id: `npc-${i + 1}`,
      name: def.name,
      npcType: def.type,
      role: def.role,
      homeZone: def.homeZone,
      waypoints: def.waypoints,
      waypointIndex: 0,
      x: initialWp.x,
      z: initialWp.z,
      targetX: initialWp.x,
      targetZ: initialWp.z,
      targetStallId: null,
      state: "idle",
      bubble: "",
      bubbleTimer: 0,
      idleTimer: 2500 + Math.random() * 3500,
    });
  }
}
initCustomers();

let serverTime = 0;
let eventsQueue = [];

// Nhịp ngày — Mỗi khung giờ một chỗ nóng (Phase 10.1)
let currentHotspotPhase = "morning";
const HOTSPOT_SCHEDULE = {
  morning: {
    id: "morning",
    zoneId: "central_market",
    label: { vi: "☀️ Chợ Sớm & Cà Phê Sáng", en: "☀️ Morning Market & Coffee" },
    announcement: "📢 [Loa Phường] Bình minh lên rồi! Chợ Trung Tâm & Quán Trà Đá đang tấp nập bánh mì nóng, cà phê thơm!",
  },
  noon: {
    id: "noon",
    zoneId: "lotus_park_village",
    label: { vi: "🪷 Trưa Mát Hồ Sen & Bóng Đa", en: "🪷 Cool Noon at Lotus Lake" },
    announcement: "📢 [Loa Phường] Trời trưa nắng ấm, mời bà con ghé Công Viên Hồ Sen nằm võng dưới gốc đa và uống nước mía mát lạnh!",
  },
  afternoon: {
    id: "afternoon",
    zoneId: "lotus_park_village",
    label: { vi: "🪁 Chiều Hội Đá Cầu, Thả Diều & Kéo Co", en: "🪁 Afternoon Kites, Shuttlecock & Tug-of-War" },
    announcement: "📢 [Loa Phường] Gió chiều lồng lộng! Sân Đá Cầu và Sân Làng đang mở hội Kéo Co, Thả Diều rộn ràng!",
  },
  night: {
    id: "night",
    zoneId: "night_food_stage",
    label: { vi: "🎤 Phố Ẩm Thực Đêm & Sân Khấu Loa Phường", en: "🎤 Night Food Street & Open Stage" },
    announcement: "📢 [Loa Phường] Đèn lồng đã thắp sáng! Phố Ẩm Thực Đêm & Sân Khấu Ca Nhạc chính thức khai trương!",
  },
};

function computeHotspotPhase(timeOfDay) {
  if (timeOfDay < 0.28) return "morning";
  if (timeOfDay < 0.5) return "noon";
  if (timeOfDay < 0.75) return "afternoon";
  return "night";
}

// Sự kiện Loa Phường Thị Trấn
let currentEventIndex = 0;
let currentMarketEvent = MARKET_EVENTS[0];
let marketEventTimer = 35000;

// Rương Lộc / Bao Lì Xì May Mắn
let activeSupplyDrop = {
  id: "drop-1",
  active: true,
  x: 0,
  z: -6,
  respawnTimer: 0,
};

function spawnSupplyDrop() {
  const angle = Math.random() * Math.PI * 2;
  const dist = 5 + Math.random() * 14;
  activeSupplyDrop = {
    id: `drop-${Date.now()}`,
    active: true,
    x: Number((Math.cos(angle) * dist).toFixed(1)),
    z: Number((Math.sin(angle) * dist).toFixed(1)),
    respawnTimer: 0,
  };
  eventsQueue.push({
    type: "supply_spawn",
    drop: activeSupplyDrop,
    time: Date.now(),
  });
}

// Hội Chợ Dân Gian: Bầu Cua Tôm Cá Thị Trấn
const BAU_CUA_ANIMALS = [
  { id: "nai", name: "Nai", icon: "🦌" },
  { id: "bau", name: "Bầu", icon: "🎃" },
  { id: "ga", name: "Gà", icon: "🐓" },
  { id: "ca", name: "Cá", icon: "🐟" },
  { id: "cua", name: "Cua", icon: "🦀" },
  { id: "tom", name: "Tôm", icon: "🦐" },
];

let bauCuaRound = {
  roundId: 1,
  state: "betting",
  timer: 18000,
  bets: {},
  lastDice: ["bau", "cua", "tom"],
  history: [
    ["bau", "cua", "tom"],
    ["ca", "ga", "ga"],
    ["tom", "nai", "bau"],
  ],
};

// Bàn Trà Đá Vỉa Hè Bờ Sông (Tọa độ x: -8, z: 27)
const TEA_TABLE = {
  x: -8,
  z: 27,
  seatedPlayers: [],
};

function getDay() {
  return Math.floor(serverTime / DAY_LENGTH) + 1;
}

function getTimeOfDay() {
  return (serverTime % DAY_LENGTH) / DAY_LENGTH;
}

function addAffinity(nickname, pts = 5, reason = "") {
  const p = players[nickname];
  if (p) {
    p.affinity = (p.affinity || 0) + pts;
    p.socialTitle = getSocialTitle(p.affinity);
    upsertPlayer(nickname, { affinity: p.affinity });
    return { affinity: p.affinity, socialTitle: p.socialTitle, reason };
  }
  const dbP = getPlayer(nickname);
  if (dbP) {
    const nextAff = (dbP.affinity || 0) + pts;
    upsertPlayer(nickname, { affinity: nextAff });
    return { affinity: nextAff, socialTitle: getSocialTitle(nextAff), reason };
  }
  return null;
}

function unlockCollectionItem(nickname, itemId) {
  if (!itemId) return null;
  const p = players[nickname];
  if (p) {
    if (!Array.isArray(p.collection)) p.collection = [];
    if (!p.collection.includes(itemId)) {
      p.collection.push(itemId);
      p.money += 250; // Thưởng sưu tầm khám phá
      p.affinity = (p.affinity || 0) + 3;
      p.socialTitle = getSocialTitle(p.affinity);
      upsertPlayer(nickname, {
        collection: p.collection,
        money: p.money,
        affinity: p.affinity,
      });
      return { unlocked: true, itemId, collection: p.collection, money: p.money };
    }
    return { unlocked: false, itemId, collection: p.collection, money: p.money };
  }
  return null;
}

function joinWorld(nickname, socketId, options = {}) {
  let saved = getPlayer(nickname);
  const isFirstJoin = !saved;
  if (!saved) {
    saved = upsertPlayer(nickname, {
      money: INITIAL_MONEY,
      inventory: { apple: 6, bread: 4, coffee: 3 },
      stalls: [],
      customization: options.customization || { hat: "non_la", outfit: "ba_ba", color: 0xf59e0b },
    });
  } else if (options.customization && typeof options.customization === "object") {
    saved.customization = {
      hat: options.customization.hat || saved.customization.hat || "non_la",
      outfit: options.customization.outfit || saved.customization.outfit || "ba_ba",
      color: Number(options.customization.color) || saved.customization.color || 0xf59e0b,
    };
    upsertPlayer(nickname, { customization: saved.customization });
  }

  if (Array.isArray(saved.stalls)) {
    saved.stalls.forEach((sId) => {
      if (stalls[sId] && (!stalls[sId].owner || stalls[sId].owner === nickname)) {
        stalls[sId].owner = nickname;
      }
    });
  }

  const roomId = assignRoom(options.roomCode);
  const rMeta = ensureRoom(roomId);
  rMeta.emptySince = null;

  const spawnX = Number(((Math.random() - 0.5) * 2.0).toFixed(2));
  const spawnZ = Number((18.5 + Math.random() * 1.5).toFixed(2));

  players[nickname] = {
    nickname,
    socketId,
    roomId,
    pos: { x: spawnX, z: spawnZ },
    rot: 0,
    zoneId: getZoneAt(spawnX, spawnZ).id,
    hoverboard: false,
    passengerOf: null,
    seatId: null,
    money: saved.money,
    inventory: saved.inventory || {},
    stalls: saved.stalls || [],
    quests: saved.quests || [],
    customization: saved.customization || { hat: "non_la", outfit: "ba_ba", color: 0xf59e0b },
    friends: Array.isArray(saved.friends) ? saved.friends : [],
    blockedUsers: Array.isArray(saved.blockedUsers) ? saved.blockedUsers : [],
    affinity: saved.affinity || 0,
    socialTitle: saved.socialTitle || getSocialTitle(saved.affinity || 0),
    collection: Array.isArray(saved.collection) ? saved.collection : ["zone_central_market"],
    houseConfig: saved.houseConfig || {
      privacy: "public",
      wall: "#fef08a",
      furniture: "Sập Gụ Tủ Chè",
      tree: "Hoa Mai Vàng",
      guestbook: [],
    },
    recoveryCode: saved.recoveryCode || null,
    mutedUntil: saved.mutedUntil || 0,
    bannedUntil: saved.bannedUntil || 0,
    tutorialCompleted: saved.tutorialCompleted || false,
    tutorialStep: deriveTutorialStep(saved),
    exp: saved.exp || 0,
    activityRewards: saved.activityRewards || {},
    todayEarnings: 0,
    joinedAt: Date.now(),
    isNewbie: isFirstJoin || (saved.affinity || 0) < 15,
    greetedBy: [],
    lastMoveAt: Date.now(),
    lastActive: Date.now(),
  };

  progressPlayerQuest(nickname, "join_town", 1);
  return players[nickname];
}

// tutorialStep lưu DB: suy ra từ tiến độ thật khi rejoin để người chơi không bị kẹt lại bước cũ
function deriveTutorialStep(saved) {
  if (saved.tutorialCompleted) return 5;
  if (Array.isArray(saved.stalls) && saved.stalls.length > 0) return 3;
  return Math.max(1, Number(saved.tutorialStep) || 1);
}

function leaveWorld(nickname) {
  const p = players[nickname];
  if (p) {
    const rId = p.roomId || "public-1";
    TEA_TABLE.seatedPlayers = TEA_TABLE.seatedPlayers.filter((n) => n !== nickname);
    seatsManager.leaveAllSeats(rId, nickname);

    upsertPlayer(nickname, {
      money: p.money,
      inventory: p.inventory,
      stalls: p.stalls,
      quests: p.quests,
      customization: p.customization,
      friends: p.friends,
      blockedUsers: p.blockedUsers,
      affinity: p.affinity,
      collection: p.collection,
      houseConfig: p.houseConfig,
      tutorialCompleted: p.tutorialCompleted,
      tutorialStep: p.tutorialStep,
      exp: p.exp,
      activityRewards: p.activityRewards,
    });
    delete players[nickname];

    const remaining = getPlayersInRoom(rId);
    const rMeta = rooms.get(rId);
    if (rMeta && remaining.length === 0) {
      rMeta.emptySince = Date.now();
    }
  }
}

function updatePlayerMove(nickname, data) {
  const p = players[nickname];
  if (!p || !data || !data.pos) return null;

  const now = Date.now();
  const dtSec = Math.max(0.016, (now - (p.lastMoveAt || now)) / 1000);
  p.lastMoveAt = now;

  const clamped = clampToBounds(data.pos.x, data.pos.z);
  const dx = clamped.x - p.pos.x;
  const dz = clamped.z - p.pos.z;
  const dist = Math.hypot(dx, dz);

  // Giới hạn tốc độ tối đa chống dịch chuyển tức thời (cho phép sai số mạng hợp lý)
  const maxStep = Math.max(8.5, BOUNDS.maxSpeedPerSec * dtSec * 1.8);
  let targetX = clamped.x;
  let targetZ = clamped.z;
  if (dist > maxStep && !(data.teleportAllowed || data.teleport)) {
    const ratio = maxStep / dist;
    targetX = Number((p.pos.x + dx * ratio).toFixed(2));
    targetZ = Number((p.pos.z + dz * ratio).toFixed(2));
  }

  // Kiểm tra chống hack đi xuyên tường trên Server (Sliding Collision Validation)
  if (Colliders && typeof Colliders.isColliding === "function") {
    if (Colliders.isColliding(targetX, targetZ, 0.35)) {
      const resolved = Colliders.resolveMovement(p.pos.x, p.pos.z, targetX - p.pos.x, targetZ - p.pos.z, 0.35);
      p.pos.x = resolved.x;
      p.pos.z = resolved.z;
    } else {
      p.pos.x = targetX;
      p.pos.z = targetZ;
    }
  } else {
    p.pos.x = targetX;
    p.pos.z = targetZ;
  }

  p.rot = Number(data.rot) || 0;
  if (data.hoverboard !== undefined) {
    p.hoverboard = Boolean(data.hoverboard);
  }

  // Nếu di chuyển xa khỏi ghế đang ngồi -> tự động đứng dậy
  if (p.seatId) {
    seatsManager.leaveAllSeats(p.roomId, nickname);
    p.seatId = null;
  }

  const prevZone = p.zoneId;
  const curZone = getZoneAt(p.pos.x, p.pos.z);
  p.zoneId = curZone.id;
  if (prevZone !== curZone.id) {
    unlockCollectionItem(nickname, `zone_${curZone.id}`);
  }

  return p;
}

function updateWorld(dt) {
  serverTime += dt;

  // 0. Dọn phòng riêng trống quá 10 phút (Phase 3.1)
  const now = Date.now();
  for (const [rId, rMeta] of rooms.entries()) {
    if (rMeta.isPrivate && rMeta.emptySince && now - rMeta.emptySince > 600000) {
      rooms.delete(rId);
    }
  }

  // 0b. Cập nhật Nhịp Ngày & Chỗ Nóng Thị Trấn (Phase 10.1)
  const nextPhase = computeHotspotPhase(getTimeOfDay());
  if (nextPhase !== currentHotspotPhase) {
    currentHotspotPhase = nextPhase;
    const sched = HOTSPOT_SCHEDULE[currentHotspotPhase];
    if (sched) {
      eventsQueue.push({
        type: "hotspot_changed",
        phase: currentHotspotPhase,
        zoneId: sched.zoneId,
        label: sched.label,
        message: sched.announcement,
        time: now,
      });
    }
  }

  // 0c. Cập nhật Hoạt động chung & Ghế ngồi cho từng phòng (Phase 8.2 & 8.3)
  for (const rId of rooms.keys()) {
    seatsManager.tickSeatsAffinity(rId, (nick, zoneId, companions) => {
      addAffinity(nick, 6, "Ngồi trò chuyện thân thiết cùng bà con");
      eventsQueue.push({
        type: "affinity_earned",
        roomId: rId,
        nickname: nick,
        pts: 6,
        message: `💖 ${nick} nhận +6 Điểm Thân Thiết khi ngồi tâm tình cùng ${companions.filter((c) => c !== nick).join(", ")}!`,
        time: now,
      });
    });

    activitiesManager.tickActivities(rId, dt, (actEv) => {
      eventsQueue.push({
        ...actEv,
        roomId: rId,
        time: now,
      });
    });
  }

  // 1. Cập nhật Sự Kiện Loa Phường & Thời Tiết Động
  marketEventTimer -= dt;
  if (marketEventTimer <= 0) {
    marketEventTimer = 35000;
    currentEventIndex = (currentEventIndex + 1) % MARKET_EVENTS.length;
    currentMarketEvent = MARKET_EVENTS[currentEventIndex];
    eventsQueue.push({
      type: "market_event",
      event: currentMarketEvent,
      time: now,
    });
  }

  // 2. Cập nhật Bao Lì Xì Lộc Chợ (Lucky Drop)
  if (!activeSupplyDrop.active) {
    activeSupplyDrop.respawnTimer -= dt;
    if (activeSupplyDrop.respawnTimer <= 0) {
      spawnSupplyDrop();
    }
  } else {
    for (const nick of Object.keys(players)) {
      const p = players[nick];
      const dist = Math.hypot(p.pos.x - activeSupplyDrop.x, p.pos.z - activeSupplyDrop.z);
      if (dist < 2.2) {
        activeSupplyDrop.active = false;
        activeSupplyDrop.respawnTimer = 25000;

        const bonusMoney = 1500 + Math.floor(Math.random() * 2500);
        const randomGood = GOODS[Math.floor(Math.random() * GOODS.length)];
        p.money += bonusMoney;
        p.inventory[randomGood.id] = (p.inventory[randomGood.id] || 0) + 2;
        upsertPlayer(nick, { money: p.money, inventory: p.inventory });

        eventsQueue.push({
          type: "supply_claimed",
          nickname: nick,
          bonusMoney,
          goodName: randomGood.name,
          goodIcon: randomGood.icon,
          x: activeSupplyDrop.x,
          z: activeSupplyDrop.z,
          time: now,
        });
        break;
      }
    }
  }

  // 3. Cập nhật NPC có trật tự theo khu vực & lịch trình sống văn minh
  const speedBoost = currentMarketEvent.id === "tourists_visit" ? 1.25 : 1.0;

  customers.forEach((c) => {
    if (c.bubbleTimer > 0) {
      c.bubbleTimer -= dt;
      if (c.bubbleTimer <= 0) c.bubble = "";
    }

    if (c.state === "idle") {
      c.idleTimer -= dt;
      if (c.idleTimer <= 0) {
        c.waypointIndex = (c.waypointIndex + 1) % c.waypoints.length;
        const nextWp = c.waypoints[c.waypointIndex];

        // ECONOMY 2.0: khách mua sắm chủ động ghé SẠP CÓ HÀNG (65%) thay vì chỉ đi waypoint
        // cố định — trước đây không waypoint nào gần hàng sạp nên NPC không bao giờ mua hàng
        let wentShopping = false;
        if (c.role === "shopper" && Math.random() < 0.65) {
          const stocked = Object.values(stalls).filter((s) =>
            Object.values(s.goods).some((qty) => qty > 0)
          );
          if (stocked.length > 0) {
            const chosen = stocked[Math.floor(Math.random() * stocked.length)];
            c.targetX = chosen.position.x + (Math.random() - 0.5) * 2.4;
            c.targetZ = chosen.position.z + 2.0;
            c.targetStallId = chosen.id;
            c.state = "shopping";
            wentShopping = true;
          }
        }

        if (!wentShopping) {
          c.targetX = nextWp.x;
          c.targetZ = nextWp.z;
          c.state = "walking";

          // Khách mua sắm tại chợ trung tâm sẽ kiểm tra sạp hàng gần đó để mua hàng
          if (c.role === "shopper") {
            const nearStall = Object.values(stalls).find((s) =>
              Math.hypot(s.position.x - nextWp.x, s.position.z - nextWp.z) < 3.2 &&
              Object.values(s.goods).some((qty) => qty > 0)
            );
            if (nearStall && Math.random() < 0.8) {
              c.targetStallId = nearStall.id;
              c.state = "shopping";
            }
          }
        }
      }
    } else if (c.state === "walking" || c.state === "shopping") {
      const dx = c.targetX - c.x;
      const dz = c.targetZ - c.z;
      const dist = Math.hypot(dx, dz);
      if (dist > 0.15) {
        // Tốc độ đi bộ tự nhiên, thư thả (~1.3 m/s) không còn chạy tán loạn
        const speed = 1.35 * speedBoost * (dt / 1000);
        c.x = Number((c.x + (dx / dist) * Math.min(speed, dist)).toFixed(2));
        c.z = Number((c.z + (dz / dist) * Math.min(speed, dist)).toFixed(2));
      } else {
        c.x = c.targetX;
        c.z = c.targetZ;
        if (c.state === "shopping" && c.targetStallId) {
          handleCustomerPurchase(c, c.targetStallId);
          c.targetStallId = null;
        }
        c.state = "idle";
        const curWp = c.waypoints[c.waypointIndex];
        c.idleTimer = curWp.wait || (5000 + Math.random() * 4000);
        if (!c.bubble && Math.random() < 0.8) {
          c.bubble = curWp.dialog || CUSTOMER_DIALOGS[Math.floor(Math.random() * CUSTOMER_DIALOGS.length)];
          c.bubbleTimer = 4500;
        }
      }
    }
  });

  // 4. Cập nhật Bầu Cua Tôm Cá Hội Chợ Dân Gian
  bauCuaRound.timer -= dt;
  if (bauCuaRound.state === "betting") {
    if (bauCuaRound.timer <= 0) {
      bauCuaRound.state = "rolling";
      bauCuaRound.timer = 4000;
      const dicePool = ["nai", "bau", "ga", "ca", "cua", "tom"];
      bauCuaRound.lastDice = [
        dicePool[Math.floor(Math.random() * dicePool.length)],
        dicePool[Math.floor(Math.random() * dicePool.length)],
        dicePool[Math.floor(Math.random() * dicePool.length)],
      ];
      eventsQueue.push({
        type: "bau_cua_rolling",
        roundId: bauCuaRound.roundId,
        timer: 4000,
        time: now,
      });
    }
  } else if (bauCuaRound.state === "rolling") {
    if (bauCuaRound.timer <= 0) {
      bauCuaRound.state = "result";
      bauCuaRound.timer = 7000;

      const winners = [];
      const dice = bauCuaRound.lastDice;
      const counts = {};
      dice.forEach((d) => {
        counts[d] = (counts[d] || 0) + 1;
      });

      for (const [nick, playerBets] of Object.entries(bauCuaRound.bets)) {
        let totalWin = 0;
        let totalBet = 0;
        for (const [animal, amount] of Object.entries(playerBets)) {
          totalBet += amount;
          const matchCount = counts[animal] || 0;
          if (matchCount > 0) {
            totalWin += amount * (1 + matchCount);
          }
        }

        if (totalWin > 0) {
          const p = players[nick];
          if (p) {
            p.money += totalWin;
            upsertPlayer(nick, { money: p.money });
          } else {
            const dbP = getPlayer(nick);
            if (dbP) upsertPlayer(nick, { money: dbP.money + totalWin });
          }
          winners.push({ nickname: nick, win: totalWin, net: totalWin - totalBet });
        }
      }

      bauCuaRound.history.unshift([...dice]);
      if (bauCuaRound.history.length > 10) bauCuaRound.history.pop();

      eventsQueue.push({
        type: "bau_cua_result",
        roundId: bauCuaRound.roundId,
        dice,
        winners,
        history: bauCuaRound.history,
        time: now,
      });
    }
  } else if (bauCuaRound.state === "result") {
    if (bauCuaRound.timer <= 0) {
      bauCuaRound.roundId++;
      bauCuaRound.state = "betting";
      bauCuaRound.timer = 20000;
      bauCuaRound.bets = {};

      eventsQueue.push({
        type: "bau_cua_new_round",
        roundId: bauCuaRound.roundId,
        timer: 20000,
        time: now,
      });
    }
  }

  // ECONOMY 2.0: tick kèo trả giá hết hạn + chuyển ngày chợ (thu thuê sạp, kết sổ)
  tickPendingHaggles(now);
  const currentDay = getDay();
  if (currentDay !== lastWorldDay) {
    lastWorldDay = currentDay;
    chargeDailyCosts();
  }
}

function getEffectiveSellPrice(goodDef, stall) {
  let earn = goodDef.sell;
  if (currentMarketEvent) {
    if (
      Array.isArray(currentMarketEvent.boostCategory) &&
      currentMarketEvent.boostCategory.includes(goodDef.category)
    ) {
      earn = Math.round(earn * 1.45);
    } else {
      earn = Math.round(earn * (currentMarketEvent.sellMultiplier || 1.0));
    }
  }
  if (stall) {
    if (stall.priceFactor !== undefined) earn = Math.round(earn * stall.priceFactor);
    if (stall.level === 2) earn = Math.round(earn * 1.15);
    if (stall.level >= 3) earn = Math.round(earn * 1.35);
    if (stall.hasStaff) earn = Math.round(earn * 1.15);
  }
  return earn;
}

function getEffectiveBuyPrice(goodDef) {
  const mult = currentMarketEvent ? currentMarketEvent.buyMultiplier || 1.0 : 1.0;
  return Math.round(goodDef.buy * mult);
}

// === ECONOMY 2.0 (hợp nhất từ bản local): Tín Hiệu Chợ, Đặt Giá, Trả Giá, Kết Sổ, Cấp Độ ===
function getMarketSignals() {
  const tod = getTimeOfDay();
  const signal = MARKET_SIGNALS.find((s) => tod >= s.from && tod < s.to) || MARKET_SIGNALS[0];
  const boosts = { ...(signal.boosts || {}) };
  if (currentMarketEvent && Array.isArray(currentMarketEvent.boostCategory)) {
    (currentMarketEvent.boostCategory || []).forEach((cat) => {
      boosts[cat] = Math.max(boosts[cat] || 1, 1.45);
    });
  }
  return { phase: signal.phase, note: signal.note, boosts, dips: signal.dips || {} };
}

function getDemandMultiplier(category, signals) {
  if (!signals) return 1;
  const boost = (signals.boosts && signals.boosts[category]) || 1;
  const dip = (signals.dips && signals.dips[category]) || 1;
  return Math.max(0.35, boost * dip);
}

// === Hệ thống Cấp Độ & EXP: mở khóa năng lực thật theo cấp ===
function calculateLevel(exp) {
  exp = Math.max(0, Number(exp) || 0);
  let tier = 0;
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (exp >= LEVEL_THRESHOLDS[i]) {
      tier = i;
      break;
    }
  }
  const isMax = tier >= LEVEL_THRESHOLDS.length - 1;
  const currentExp = exp - LEVEL_THRESHOLDS[tier];
  const nextExp = isMax ? 0 : LEVEL_THRESHOLDS[tier + 1] - LEVEL_THRESHOLDS[tier];
  const progress = isMax ? 1 : nextExp > 0 ? currentExp / nextExp : 1;
  return {
    level: tier + 1,
    title: LEVEL_TITLES[tier] || LEVEL_TITLES[LEVEL_TITLES.length - 1],
    totalExp: exp,
    currentExp,
    nextExp,
    progress: Math.min(1, progress),
  };
}

function getPlayerLevel(nickname) {
  const p = players[nickname];
  if (!p) return 1;
  return calculateLevel(p.exp || 0).level;
}

function addExp(nickname, amount, reason = "") {
  const p = players[nickname];
  if (!p) return null;
  amount = Math.max(0, Math.floor(Number(amount) || 0));
  const prevLevel = calculateLevel(p.exp || 0).level;
  p.exp = Math.max(0, Math.floor(Number(p.exp) || 0)) + amount;
  upsertPlayer(nickname, { exp: p.exp });
  const newLevelInfo = calculateLevel(p.exp);
  if (newLevelInfo.level > prevLevel) {
    const unlock = LEVEL_UNLOCKS[newLevelInfo.level];
    eventsQueue.push({
      type: "level_up",
      roomId: p.roomId,
      nickname,
      level: newLevelInfo.level,
      title: newLevelInfo.title,
      unlock: unlock || null,
      message: `🎉 ${nickname} vừa lên Cấp ${newLevelInfo.level} — "${newLevelInfo.title}"!${unlock ? ` Mở khóa: ${unlock}` : ""}`,
      time: Date.now(),
    });
  }
  return { ...newLevelInfo, reason };
}

// Trần thưởng hoạt động/ngày (chống farm vô hạn): fishing, mini-games...
function grantActivityReward(nickname, key, requestedAmount, dailyCap = 5000) {
  const p = players[nickname];
  if (!p) return 0;
  const dayKey = new Date().toISOString().slice(0, 10);
  const ledger = p.activityRewards && p.activityRewards.day === dayKey
    ? p.activityRewards
    : { day: dayKey, rewards: {} };
  const earned = Math.max(0, Number(ledger.rewards && ledger.rewards[key]) || 0);
  const reward = Math.max(0, Math.min(Math.floor(Number(requestedAmount) || 0), dailyCap - earned));
  ledger.rewards = ledger.rewards || {};
  ledger.rewards[key] = earned + reward;
  p.activityRewards = ledger;
  p.money += reward;
  upsertPlayer(nickname, { money: p.money, activityRewards: ledger });
  return reward;
}

// === MINIGAME TRẢ GIÁ: khách NPC đòi bớt giá, chủ sạp có 6 giây quyết định ===
let haggleSeq = 0;
const pendingHaggles = new Map();

function pushHaggleRequest(haggle, stall, goodDef, qty, customer) {
  const baseEarn = Math.round(getEffectiveSellPrice(goodDef, stall) * qty);
  eventsQueue.push({
    type: "haggle_request",
    target: stall.owner,
    roomId: haggle.roomId,
    haggleId: haggle.id,
    stallId: stall.id,
    stallName: stall.name,
    goodId: goodDef.id,
    goodName: goodDef.name,
    goodIcon: goodDef.icon,
    qty,
    customerName: customer.name,
    askPrice: baseEarn,
    acceptPrice: Math.round(baseEarn * HAGGLE_CONFIG.acceptFactor),
    holdPrice: Math.round(baseEarn * HAGGLE_CONFIG.holdWinFactor),
    timeoutPrice: Math.round(baseEarn * HAGGLE_CONFIG.timeoutFactor),
    windowSec: Math.round(haggle.windowMs / 1000),
    time: Date.now(),
  });
}

function finalizeSale(stall, goodDef, qty, customer, earnMultiplier, meta = {}) {
  // Trần doanh thu/sạp/ngày — nâng cấp sạp để nâng trần
  const earnCap = STALL_EARN_CAP_PER_DAY[stall.level] || 20000;
  const todayEarn = stall.dailyEarnings && stall.dailyEarningsDay === getDay() ? stall.dailyEarnings : 0;
  if (todayEarn >= earnCap) {
    customer.bubble = "Sạp này hôm nay đông khách quá! Mai quay lại nhé!";
    customer.bubbleTimer = 4000;
    return 0;
  }

  const signals = getMarketSignals();
  const demandMult = getDemandMultiplier(goodDef.category, signals);
  const effectiveBase = getEffectiveSellPrice(goodDef, stall);
  const earn = Math.max(1, Math.round(effectiveBase * qty * earnMultiplier * (0.75 + demandMult * 0.25)));
  const cappedEarn = Math.min(earn, Math.max(0, earnCap - todayEarn));
  stall.goods[goodDef.id] = Math.max(0, (stall.goods[goodDef.id] || 0) - qty);
  stall.earnings += cappedEarn;
  stall.dailyEarnings = todayEarn + cappedEarn;
  stall.dailyEarningsDay = getDay();
  saveStall(stall);

  const owner = stall.owner ? players[stall.owner] : null;
  if (owner) {
    owner.money += cappedEarn;
    owner.todayEarnings = (owner.todayEarnings || 0) + cappedEarn;
    const q = progressPlayerQuest(stall.owner, "sell_customers", qty);
    if (q) owner.quests = getPlayer(stall.owner).quests;
    addExp(stall.owner, 35 * qty, meta.haggleWon ? "Chốt kèo đòi giá thành công" : "Bán hàng cho khách");
  } else if (stall.owner) {
    const dbOwner = getPlayer(stall.owner);
    if (dbOwner) {
      upsertPlayer(stall.owner, { money: dbOwner.money + cappedEarn });
      addExp(stall.owner, 35 * qty, "Bán hàng tự động");
    }
  }

  customer.bubble = meta.haggleWon
    ? "Trời đất, miệng dẻo quá! Thôi thì chịu ra tiền!"
    : pickCustomerBubble(customer);
  customer.bubbleTimer = 4000;

  eventsQueue.push({
    type: "customer_buy",
    customerId: customer.id || null,
    customerName: customer.name,
    stallId: stall.id,
    stallName: stall.name,
    owner: stall.owner || "Sạp Chung",
    goodId: goodDef.id,
    goodName: goodDef.name,
    goodIcon: goodDef.icon,
    price: cappedEarn,
    dialog: customer.bubble,
    viaHaggle: Boolean(meta.viaHaggle),
    haggleWon: Boolean(meta.haggleWon),
    time: Date.now(),
  });
  return cappedEarn;
}

function resolveHaggleOutcome(haggleId, choice) {
  const haggle = pendingHaggles.get(haggleId);
  if (!haggle) return { ok: false, error: "Kèo trả giá đã hết hạn." };
  pendingHaggles.delete(haggleId);

  const stall = stalls[haggle.stallId];
  const goodDef = GOODS.find((g) => g.id === haggle.goodId);
  if (!stall || !goodDef) return { ok: false, error: "Sạp hoặc món hàng không còn tồn tại." };

  const customer = customers.find((c) => c.name === haggle.customerName) ||
    { name: haggle.customerName, bubble: "", bubbleTimer: 0 };

  if (choice === "accept") {
    const earn = finalizeSale(stall, goodDef, haggle.qty, customer, HAGGLE_CONFIG.acceptFactor, { viaHaggle: true });
    eventsQueue.push({ type: "haggle_result", target: stall.owner, roomId: haggle.roomId, haggleId, outcome: "accepted", price: earn, message: `Chốt kèo bớt giá: bán được +${earn.toLocaleString()}đ!`, time: Date.now() });
    return { ok: true, outcome: "accepted", price: earn };
  }

  if (choice === "hold") {
    const bonusChance = HAGGLE_CONFIG.holdWinChance + (getPlayerLevel(stall.owner) >= 6 ? 0.1 : 0);
    if (Math.random() < bonusChance) {
      const earn = finalizeSale(stall, goodDef, haggle.qty, customer, HAGGLE_CONFIG.holdWinFactor, { viaHaggle: true, haggleWon: true });
      eventsQueue.push({ type: "haggle_result", target: stall.owner, roomId: haggle.roomId, haggleId, outcome: "won", price: earn, message: `Khách phục miệng, chịu trả đắt: +${earn.toLocaleString()}đ! 🔥`, time: Date.now() });
      return { ok: true, outcome: "won", price: earn };
    }
    customer.bubble = "Ối trời! Đắt thế thì thôi, qua sạp bên kia!";
    customer.bubbleTimer = 4000;
    eventsQueue.push({ type: "haggle_result", target: stall.owner, roomId: haggle.roomId, haggleId, outcome: "lost", price: 0, message: `Khách bực bỏ đi vì giá cao... Món ${goodDef.name} lỡ mất!`, time: Date.now() });
    return { ok: true, outcome: "lost" };
  }

  // Hết giờ không trả lời: khách tự bớt sâu hơn rồi vẫn mua (phạt nhẹ)
  const earn = finalizeSale(stall, goodDef, haggle.qty, customer, HAGGLE_CONFIG.timeoutFactor, { viaHaggle: true });
  eventsQueue.push({ type: "haggle_result", target: stall.owner, roomId: haggle.roomId, haggleId, outcome: "timeout", price: earn, message: `Không trả lời, khách tự bớt sâu: chỉ bán được +${earn.toLocaleString()}đ.`, time: Date.now() });
  return { ok: true, outcome: "timeout", price: earn };
}

function tickPendingHaggles(now) {
  for (const [haggleId, haggle] of pendingHaggles.entries()) {
    if (now - haggle.createdAt > haggle.windowMs) {
      resolveHaggleOutcome(haggleId, "timeout");
    }
  }
}

function resolveHaggle(nickname, haggleId, choice) {
  const p = players[nickname];
  if (!p) return { ok: false, error: "Người chơi không hợp lệ!" };
  const haggle = pendingHaggles.get(haggleId);
  if (!haggle) return { ok: false, error: "Kèo trả giá đã hết hạn hoặc không tồn tại." };
  if (haggle.owner !== nickname) return { ok: false, error: "Đây không phải kèo của sạp bạn!" };
  return resolveHaggleOutcome(haggleId, choice === "hold" ? "hold" : "accept");
}

function setStallPrice(nickname, stallId, priceFactor) {
  const p = players[nickname];
  if (!p) return { ok: false, error: "Người chơi không hợp lệ!" };
  const stall = stalls[stallId];
  if (!stall) return { ok: false, error: "Sạp không tồn tại!" };
  if (stall.owner !== nickname) return { ok: false, error: "Bạn không phải chủ sạp này!" };
  if (getPlayerLevel(nickname) < 2) {
    return { ok: false, error: "Đặt giá tự do mở khóa ở Cấp 2 — bán thêm vài đơn hàng nhé!", needLevel: 2 };
  }
  const factor = Math.min(1.8, Math.max(0.6, Number(priceFactor) || 1));
  stall.priceFactor = Math.round(factor * 100) / 100;
  saveStall(stall);
  eventsQueue.push({
    type: "stall_price_changed",
    roomId: p.roomId,
    stallId,
    priceFactor: stall.priceFactor,
    nickname,
    time: Date.now(),
  });
  return { ok: true, stallId, priceFactor: stall.priceFactor };
}

// Kết sổ cuối ngày chợ: thu tiền thuê sạp + lương phụ quán, tổng kết hôm qua
let lastWorldDay = getDay();
function chargeDailyCosts() {
  const day = getDay();
  for (const stall of Object.values(stalls)) {
    stall.dailyEarnings = 0;
    stall.dailyEarningsDay = day;
  }
  for (const stall of Object.values(stalls)) {
    if (!stall.owner) continue;
    const owner = players[stall.owner];
    if (!owner) continue;
    const rent = STALL_RENT_PER_DAY[stall.level] || 300;
    const wage = stall.hasStaff ? STAFF_WAGE_PER_DAY : 0;
    const yesterdayEarnings = owner.todayEarnings || 0;
    owner.money = Math.max(0, (owner.money || 0) - rent - wage);
    owner.todayEarnings = 0;
    upsertPlayer(owner.nickname, { money: owner.money });
    eventsQueue.push({
      type: "new_day_summary",
      target: owner.nickname,
      roomId: owner.roomId,
      day,
      rent,
      wage,
      yesterdayEarnings,
      money: owner.money,
      stallName: stall.name,
      message: `🌅 Ngày ${day}: "${stall.name}" đóng tiền thuê ${rent.toLocaleString()}đ${wage ? ` + lương phụ quán ${wage.toLocaleString()}đ` : ""}. Hôm qua bán được ${yesterdayEarnings.toLocaleString()}đ.`,
      time: Date.now(),
    });
  }
}

// Thoại NPC theo ngữ cảnh: giờ + thời tiết + vai trò (port từ bản local)
function pickCustomerBubble(customer) {
  const tod = getTimeOfDay();
  const phase = tod < 0.25 ? "morning" : tod < 0.5 ? "noon" : tod < 0.7 ? "afternoon" : tod < 0.88 ? "evening" : "night";
  const pools = [];
  const weatherPool = currentMarketEvent && CUSTOMER_WEATHER_DIALOGS[currentMarketEvent.weather];
  if (weatherPool && Math.random() < 0.45) pools.push(weatherPool);
  pools.push(CUSTOMER_DIALOGS);
  const pool = pools[Math.floor(Math.random() * pools.length)];
  return pool[Math.floor(Math.random() * pool.length)] || CUSTOMER_DIALOGS[0];
}

function handleCustomerPurchase(customer, stallId) {
  const stall = stalls[stallId];
  if (!stall) return;

  const inStockIds = Object.keys(stall.goods).filter((k) => stall.goods[k] > 0);
  if (inStockIds.length === 0) return;

  // Chọn món theo TÍN HIỆU CHỢ: khách chuộng hàng "hot" thay vì random đều
  const signals = getMarketSignals();
  const weights = inStockIds.map((id) => {
    const def = GOODS.find((g) => g.id === id);
    return def ? getDemandMultiplier(def.category, signals) : 0.5;
  });
  const totalWeight = weights.reduce((a, b) => a + b, 0) || 1;
  let roll = Math.random() * totalWeight;
  let chosenId = inStockIds[inStockIds.length - 1];
  for (let i = 0; i < inStockIds.length; i++) {
    roll -= weights[i];
    if (roll <= 0) { chosenId = inStockIds[i]; break; }
  }

  const goodDef = GOODS.find((g) => g.id === chosenId);
  if (!goodDef) return;

  const pf = stall.priceFactor !== undefined ? stall.priceFactor : 1;
  const walkAwayChance = pf > 1.0 ? Math.min(0.65, (pf - 1.0) * 0.75) : 0;
  if (Math.random() < walkAwayChance) {
    customer.bubble = pf >= 1.5 ? "Sao đắt thế?! Qua sạp kia mua!" : "H trời, giá này căng quá, thôi chừa tiền lại!";
    customer.bubbleTimer = 4000;
    return;
  }

  const earnCap = STALL_EARN_CAP_PER_DAY[stall.level] || 20000;
  const todayEarn0 = stall.dailyEarnings && stall.dailyEarningsDay === getDay() ? stall.dailyEarnings : 0;
  if (todayEarn0 >= earnCap) {
    customer.bubble = "Sạp này hôm nay đông khách quá! Mai quay lại nhé!";
    customer.bubbleTimer = 4000;
    return;
  }

  const comboChance = 0.45 + (pf < 1.0 ? (1.0 - pf) * 0.5 : 0);
  const buyQty = (stall.goods[chosenId] >= 2 && Math.random() < comboChance) ? 2 : 1;

  // ~38% khách đòi trả giá — chủ sạp online mới có kèo
  if (stall.owner && players[stall.owner] && Math.random() < HAGGLE_CONFIG.chance) {
    haggleSeq += 1;
    const haggleId = `hg_${Date.now().toString(36)}_${haggleSeq}`;
    pendingHaggles.set(haggleId, {
      id: haggleId,
      stallId: stall.id,
      owner: stall.owner,
      customerName: customer.name,
      goodId: goodDef.id,
      qty: buyQty,
      roomId: players[stall.owner].roomId || "public-1",
      createdAt: Date.now(),
      windowMs: HAGGLE_CONFIG.windowMs,
    });
    customer.bubble = "Bớt giá cho cháu đi bà con ơi! 🙏";
    customer.bubbleTimer = HAGGLE_CONFIG.windowMs;
    customer.state = "haggling";
    customer.actionTimer = HAGGLE_CONFIG.windowMs + 1200;
    pushHaggleRequest(pendingHaggles.get(haggleId), stall, goodDef, buyQty, customer);
    return;
  }

  finalizeSale(stall, goodDef, buyQty, customer, 1, {});
}

function popEvents() {
  const out = eventsQueue;
  eventsQueue = [];
  return out;
}

// ---- Các hành động người chơi ----

function buyWholesale(nickname, goodId, amount = 1) {
  const player = players[nickname];
  if (!player) return { ok: false, error: "Người chơi không tồn tại" };
  const goodDef = GOODS.find((g) => g.id === goodId);
  if (!goodDef) return { ok: false, error: "Sản phẩm không hợp lệ" };

  amount = Math.max(1, Math.min(100, Math.floor(Number(amount) || 1)));
  const unitCost = getEffectiveBuyPrice(goodDef);
  const totalCost = unitCost * amount;
  if (player.money < totalCost) {
    return { ok: false, error: "Không đủ tiền nhập hàng!", cost: totalCost };
  }

  player.money -= totalCost;
  player.inventory[goodId] = (player.inventory[goodId] || 0) + amount;

  unlockCollectionItem(nickname, `food_${goodId}`);
  progressPlayerQuest(nickname, "buy_wholesale", amount);
  addExp(nickname, 20 * amount, "Mua sỉ hàng hóa");
  const updated = upsertPlayer(nickname, { money: player.money, inventory: player.inventory });
  player.quests = updated.quests;

  return {
    ok: true,
    goodId,
    amount,
    cost: totalCost,
    money: player.money,
    inventory: player.inventory,
    quests: player.quests,
  };
}

function rentStall(nickname, stallId, customName) {
  const player = players[nickname];
  if (!player) return { ok: false, error: "Người chơi không hợp lệ" };
  const stall = stalls[stallId];
  if (!stall) return { ok: false, error: "Sạp hàng không tồn tại" };

  if (stall.owner && stall.owner !== nickname) {
    return { ok: false, error: `Sạp này đã được ${stall.owner} thuê!` };
  }
  if (stall.owner === nickname) {
    return { ok: false, error: "Bạn đã làm chủ sạp này rồi!" };
  }

  // Sạp đầu tiên miễn phí cho tân thủ đang học việc
  const isStarterFree = (!player.stalls || player.stalls.length === 0) && !player.tutorialCompleted;
  const actualCost = isStarterFree ? 0 : STALL_COST;

  if (player.money < actualCost) {
    return { ok: false, error: `Không đủ ${actualCost.toLocaleString()}đ để thuê sạp!` };
  }

  player.money -= actualCost;
  stall.owner = nickname;
  if (customName && customName.trim()) {
    stall.name = sanitizeText(customName, 28) || stall.name;
  }
  saveStall(stall);
  addExp(nickname, 60, "Mở sạp khai trương");

  if (!player.stalls.includes(stallId)) {
    player.stalls.push(stallId);
  }

  progressPlayerQuest(nickname, "own_stall", 1);
  const updated = upsertPlayer(nickname, { money: player.money, stalls: player.stalls });
  player.quests = updated.quests;

  return {
    ok: true,
    stall: getStallData(stallId),
    money: player.money,
    quests: player.quests,
  };
}

function stockGood(nickname, stallId, goodId, amount = 1) {
  const player = players[nickname];
  if (!player) return { ok: false, error: "Người chơi không hợp lệ" };
  const stall = stalls[stallId];
  if (!stall) return { ok: false, error: "Sạp hàng không tồn tại" };
  if (stall.owner !== nickname) return { ok: false, error: "Bạn không phải chủ sạp này" };

  amount = Math.max(1, Math.floor(Number(amount) || 1));
  const currentInv = player.inventory[goodId] || 0;
  if (currentInv < amount) {
    return { ok: false, error: "Không đủ số lượng hàng trong kho!" };
  }

  const maxCapacity = stall.level === 1 ? 60 : stall.level === 2 ? 180 : 400;
  const currentTotal = Object.values(stall.goods).reduce((a, b) => a + b, 0);
  if (currentTotal + amount > maxCapacity) {
    return { ok: false, error: `Mẹt hàng đã đầy (Tối đa ${maxCapacity} món). Hãy nâng cấp sạp!` };
  }

  player.inventory[goodId] -= amount;
  if (player.inventory[goodId] <= 0) delete player.inventory[goodId];

  stall.goods[goodId] = (stall.goods[goodId] || 0) + amount;
  saveStall(stall);
  addExp(nickname, 8 * amount, "Bày hàng lên mẹt");

  progressPlayerQuest(nickname, "stock_goods", amount);
  const updated = upsertPlayer(nickname, { inventory: player.inventory });
  player.quests = updated.quests;

  return {
    ok: true,
    stall: getStallData(stallId),
    inventory: player.inventory,
    quests: player.quests,
  };
}

// Bày toàn bộ kho lên sạp 1-chạm (ECONOMY 2.0 / tutorial bước 2)
function stockAllGoods(nickname, stallId) {
  const player = players[nickname];
  if (!player) return { ok: false, error: "Người chơi không hợp lệ" };
  const stall = stalls[stallId];
  if (!stall) return { ok: false, error: "Sạp hàng không tồn tại" };
  if (stall.owner !== nickname) return { ok: false, error: "Bạn không phải chủ sạp này" };

  const maxCapacity = stall.level === 1 ? 60 : stall.level === 2 ? 180 : 400;
  let currentTotal = Object.values(stall.goods).reduce((a, b) => a + b, 0);
  let totalStocked = 0;

  for (const goodId of Object.keys(player.inventory)) {
    const qty = Number(player.inventory[goodId]) || 0;
    if (qty <= 0) continue;
    const canAdd = Math.min(qty, maxCapacity - currentTotal);
    if (canAdd <= 0) break;

    stall.goods[goodId] = (stall.goods[goodId] || 0) + canAdd;
    player.inventory[goodId] -= canAdd;
    if (player.inventory[goodId] <= 0) delete player.inventory[goodId];

    currentTotal += canAdd;
    totalStocked += canAdd;
  }

  if (totalStocked > 0) {
    saveStall(stall);
    addExp(nickname, 8 * totalStocked, "Bày hàng lên mẹt");
    progressPlayerQuest(nickname, "stock_goods", totalStocked);
    const updated = upsertPlayer(nickname, { inventory: player.inventory });
    player.quests = updated.quests;
  }

  return {
    ok: true,
    totalStocked,
    stall: getStallData(stallId),
    inventory: player.inventory,
    quests: player.quests,
  };
}

function withdrawGood(nickname, stallId, goodId, amount = 1) {  const player = players[nickname];
  if (!player) return { ok: false, error: "Người chơi không hợp lệ" };
  const stall = stalls[stallId];
  if (!stall) return { ok: false, error: "Sạp hàng không tồn tại" };
  if (stall.owner !== nickname) return { ok: false, error: "Bạn không phải chủ sạp này" };

  amount = Math.max(1, Math.floor(Number(amount) || 1));
  const currentStock = stall.goods[goodId] || 0;
  if (currentStock < amount) return { ok: false, error: "Sạp không còn đủ hàng này!" };

  stall.goods[goodId] -= amount;
  if (stall.goods[goodId] <= 0) delete stall.goods[goodId];

  player.inventory[goodId] = (player.inventory[goodId] || 0) + amount;
  saveStall(stall);
  upsertPlayer(nickname, { inventory: player.inventory });

  return {
    ok: true,
    stall: getStallData(stallId),
    inventory: player.inventory,
  };
}

function upgradeStall(nickname, stallId) {
  const player = players[nickname];
  if (!player) return { ok: false, error: "Người chơi không hợp lệ" };
  const stall = stalls[stallId];
  if (!stall || stall.owner !== nickname) return { ok: false, error: "Bạn không phải chủ sạp này" };

  const nextLevel = stall.level + 1;
  const cost = STALL_UPGRADE_COSTS[nextLevel];
  if (!cost) return { ok: false, error: "Sạp đã đạt cấp tối đa (Cấp 3 Đại Cát)!" };

  const needLevel = nextLevel === 2 ? 3 : 5;
  if (getPlayerLevel(nickname) < needLevel) {
    return { ok: false, error: `Nâng sạp Cấp ${nextLevel} mở khóa ở Cấp ${needLevel}. Bán hàng thêm cho kinh nghiệm nhé!`, needLevel };
  }

  if (player.money < cost) {
    return { ok: false, error: `Cần ${cost.toLocaleString()}đ để nâng cấp!` };
  }

  player.money -= cost;
  stall.level = nextLevel;
  saveStall(stall);
  addExp(nickname, 120, `Nâng cấp sạp lên Cấp ${nextLevel}`);

  progressPlayerQuest(nickname, "upgrade_stall", 1);
  const updated = upsertPlayer(nickname, { money: player.money });
  player.quests = updated.quests;

  return {
    ok: true,
    stall: getStallData(stallId),
    money: player.money,
    level: nextLevel,
    quests: player.quests,
  };
}

function hireStaff(nickname, stallId) {
  const player = players[nickname];
  if (!player) return { ok: false, error: "Người chơi không hợp lệ" };
  const stall = stalls[stallId];
  if (!stall || stall.owner !== nickname) return { ok: false, error: "Bạn không phải chủ sạp này" };

  if (stall.hasStaff) return { ok: false, error: "Sạp này đã có người phụ bán rồi!" };
  if (getPlayerLevel(nickname) < 4) {
    return { ok: false, error: "Thuê phụ quán mở khóa ở Cấp 4 — hãy bán hàng chăm chỉ lên cấp đã!", needLevel: 4 };
  }
  if (player.money < HIRE_STAFF_COST) {
    return { ok: false, error: `Cần ${HIRE_STAFF_COST.toLocaleString()}đ để thuê phụ quán!` };
  }

  player.money -= HIRE_STAFF_COST;
  stall.hasStaff = true;
  saveStall(stall);

  progressPlayerQuest(nickname, "hire_worker", 1);
  const updated = upsertPlayer(nickname, { money: player.money });
  player.quests = updated.quests;

  return {
    ok: true,
    stall: getStallData(stallId),
    money: player.money,
    quests: player.quests,
  };
}

function spinGacha(nickname) {
  const player = players[nickname];
  if (!player) return { ok: false, error: "Người chơi không hợp lệ" };
  if (player.money < GACHA_COST) {
    return { ok: false, error: `Cần ${GACHA_COST.toLocaleString()}đ để mua vé Lô Tô Hội Chợ!` };
  }

  player.money -= GACHA_COST;

  const roll = Math.random();
  let prizeTitle = "";
  let prizeMessage = "";
  let prizeType = "item";

  if (roll < 0.16) {
    const jackpot = 8000;
    player.money += jackpot;
    prizeType = "jackpot";
    prizeTitle = "🎪 KINH RỒI! TRÚNG ĐỘC ĐẮC LÔ TÔ (+8.000đ)!";
    prizeMessage = "Cờ ra con số mấy! Bà con vỗ tay rần rần, tiền thưởng về đầy túi!";
  } else if (roll < 0.42) {
    player.inventory["gem"] = (player.inventory["gem"] || 0) + 1;
    prizeType = "rare_item";
    prizeTitle = "💎 1x Trầm Hương & Ngọc Phố Cổ!";
    prizeMessage = "Đặc sản quý hiếm trị giá bán lẻ 13.500đ đã vào kho của bạn!";
  } else if (roll < 0.72) {
    player.inventory["orange"] = (player.inventory["orange"] || 0) + 2;
    prizeType = "item";
    prizeTitle = "🍈 2x Sầu Riêng Ri6 Chín Cây!";
    prizeMessage = "Thơm nức mũi cả góc chợ! Đem bày lên sạp bán lời to!";
  } else {
    player.inventory["cake"] = (player.inventory["cake"] || 0) + 2;
    player.inventory["coffee"] = (player.inventory["coffee"] || 0) + 2;
    player.money += 1000;
    prizeType = "combo";
    prizeTitle = "🍜 Combo 2 Phở Bò + 2 Cà Phê Sữa Đá + 1.000đ Lì Xì!";
    prizeMessage = "Combo bữa sáng chuẩn bài thương gia phố chợ Việt Nam!";
  }

  unlockCollectionItem(nickname, "game_loto");
  progressPlayerQuest(nickname, "play_gacha", 1);
  const updated = upsertPlayer(nickname, { money: player.money, inventory: player.inventory });
  player.quests = updated.quests;

  return {
    ok: true,
    prizeType,
    prizeTitle,
    prizeMessage,
    money: player.money,
    inventory: player.inventory,
    quests: player.quests,
  };
}

function placeBauCuaBet(nickname, animalId, amount) {
  const p = players[nickname];
  if (!p) return { ok: false, error: "Người chơi không hợp lệ!" };
  if (bauCuaRound.state !== "betting") {
    return { ok: false, error: "Nhà cái đang lắc bát hoặc công bố kết quả, hãy chờ vòng sau!" };
  }
  const validAnimal = BAU_CUA_ANIMALS.find((a) => a.id === animalId);
  if (!validAnimal) return { ok: false, error: "Cửa đặt không hợp lệ!" };

  amount = Math.floor(Number(amount));
  if (isNaN(amount) || amount < 500) {
    return { ok: false, error: "Cược tối thiểu 500đ!" };
  }
  if (p.money < amount) {
    return { ok: false, error: "Không đủ tiền đặt cược!" };
  }

  p.money -= amount;
  if (!bauCuaRound.bets[nickname]) bauCuaRound.bets[nickname] = {};
  bauCuaRound.bets[nickname][animalId] = (bauCuaRound.bets[nickname][animalId] || 0) + amount;

  unlockCollectionItem(nickname, "game_baucua");
  upsertPlayer(nickname, { money: p.money });

  return {
    ok: true,
    money: p.money,
    bets: bauCuaRound.bets[nickname],
    roundId: bauCuaRound.roundId,
  };
}

function toggleSitTeaTable(nickname, seatId = null) {
  const p = players[nickname];
  if (!p) return { ok: false, error: "Người chơi không hợp lệ!" };

  const isSeated = TEA_TABLE.seatedPlayers.includes(nickname) || Boolean(p.seatId);
  if (isSeated) {
    TEA_TABLE.seatedPlayers = TEA_TABLE.seatedPlayers.filter((n) => n !== nickname);
    seatsManager.leaveAllSeats(p.roomId, nickname);
    p.seatId = null;
    return { ok: true, seated: false, table: TEA_TABLE, seats: seatsManager.getSeatsSnapshot(p.roomId) };
  } else {
    const seatRes = seatsManager.sitOnSeat(p.roomId, nickname, seatId, p.pos);
    if (seatRes.ok && seatRes.seat) {
      p.seatId = seatRes.seat.id;
      p.pos.x = seatRes.seat.x;
      p.pos.z = seatRes.seat.z;
      p.rot = seatRes.seat.facing || 0;
    }
    if (!TEA_TABLE.seatedPlayers.includes(nickname) && TEA_TABLE.seatedPlayers.length < 8) {
      TEA_TABLE.seatedPlayers.push(nickname);
    }

    p.money += 200;
    addAffinity(nickname, 3, "Ngồi ghế trà đá giao lưu");
    unlockCollectionItem(nickname, "food_tra_da");
    progressPlayerQuest(nickname, "sit_tea_together", 1);
    const updated = upsertPlayer(nickname, { money: p.money });
    p.quests = updated.quests;

    eventsQueue.push({
      type: "tea_table_cheer",
      nickname,
      roomId: p.roomId,
      message: `${nickname} vừa ngồi ghế nghỉ chân: "Chị chủ ơi, cho cốc trà đá hạt hướng dương với!" ☕🌻`,
      time: Date.now(),
    });

    return {
      ok: true,
      seated: true,
      seat: seatRes.seat || null,
      seats: seatsManager.getSeatsSnapshot(p.roomId),
      money: p.money,
      quests: p.quests,
      table: TEA_TABLE,
    };
  }
}

function interactPlayer(sourceNick, targetNick, actionType, meta = {}) {
  const source = players[sourceNick];
  const target = players[targetNick];
  if (!source || !target) return { ok: false, error: "Người chơi không còn online!" };
  if (sourceNick === targetNick) return { ok: false, error: "Không thể tự tương tác với chính mình!" };

  const dist = Math.hypot(source.pos.x - target.pos.x, source.pos.z - target.pos.z);
  if (dist > 12.0 && actionType !== "greet_newbie") {
    return { ok: false, error: "Bạn đang ở quá xa người này! Hãy tiến lại gần hơn." };
  }

  let message = "";
  let payload = { actionType, sourceNick, targetNick };

  // Chào đón người mới (Phase 3.2 Icebreaker)
  if (actionType === "wave" || actionType === "greet_newbie") {
    addAffinity(sourceNick, 5, "Chào hỏi thân thiện");
    addAffinity(targetNick, 3, "Nhận lời chào ấm áp");
    progressPlayerQuest(sourceNick, "social_greet", 1);

    let bonusMsg = "";
    if (target.isNewbie && !target.greetedBy.includes(sourceNick)) {
      target.greetedBy.push(sourceNick);
      source.money += 300;
      target.money += 300;
      upsertPlayer(sourceNick, { money: source.money });
      upsertPlayer(targetNick, { money: target.money });
      bonusMsg = " (+300đ Quà Làm Quen cho cả hai!)";
    }
    message = `👋 ${sourceNick} vẫy tay chào ${targetNick} thật nồng nhiệt!${bonusMsg}`;
    payload.anim = "wave";
  } else if (actionType === "cheers") {
    addAffinity(sourceNick, 4, "Cụng ly trà đá");
    addAffinity(targetNick, 4, "Cụng ly trà đá");
    progressPlayerQuest(sourceNick, "social_greet", 1);
    message = `🍻 ${sourceNick} và ${targetNick} vừa cụng ly trà đá / bia hơi: "1, 2, 3 DÔ! Chúc vạn sự vui vẻ!"`;
    payload.anim = "cheers";
  } else if (actionType === "coffee") {
    if (source.money < 500) return { ok: false, error: "Cần 500đ để mời ly Cà Phê Sữa Đá Sài Gòn!" };
    source.money -= 500;
    target.inventory["coffee"] = (target.inventory["coffee"] || 0) + 1;
    addAffinity(sourceNick, 6, "Mời cà phê bạn bè");
    upsertPlayer(sourceNick, { money: source.money });
    upsertPlayer(targetNick, { inventory: target.inventory });
    message = `☕ ${sourceNick} vừa hào sảng mời ${targetNick} một ly Cà Phê Sữa Đá Sài Gòn đậm đà!`;
    payload.anim = "coffee";
  } else if (actionType === "lixi") {
    const amount = Math.max(100, Math.min(50000, Math.floor(Number(meta.amount)) || 1000));
    if (source.money < amount) return { ok: false, error: `Không đủ ${amount.toLocaleString()}đ để mừng lì xì!` };
    source.money -= amount;
    target.money += amount;
    addAffinity(sourceNick, 8, "Trao lì xì may mắn");
    upsertPlayer(sourceNick, { money: source.money });
    upsertPlayer(targetNick, { money: target.money });
    const cleanWish = sanitizeText(meta.wish || "Phát tài phát lộc! May mắn cả năm!", 60);
    message = `🧧 ${sourceNick} vừa trao Bao Lì Xì May Mắn ${amount.toLocaleString()}đ cho ${targetNick}: "${cleanWish}"`;
    payload.anim = "lixi";
    payload.amount = amount;
  } else if (actionType === "ride_motorcycle") {
    target.passengerOf = target.passengerOf === sourceNick ? null : sourceNick;
    source.hoverboard = true;
    addAffinity(sourceNick, 5, "Đèo bạn dạo phố");
    message = target.passengerOf
      ? `🛵 ${sourceNick} bấm còi 'bim bim' đèo ${targetNick} ngồi yên sau lượn khắp thị trấn!`
      : `🛵 ${targetNick} đã xuống xe của ${sourceNick} sau chuyến dạo phố!`;
    payload.anim = "ride";
    payload.passengerOf = target.passengerOf;
  } else {
    return { ok: false, error: "Hành động không hợp lệ!" };
  }

  eventsQueue.push({
    type: "player_social",
    roomId: source.roomId,
    message,
    payload,
    time: Date.now(),
  });

  return {
    ok: true,
    message,
    sourceMoney: source.money,
    targetMoney: target.money,
    affinity: source.affinity,
    socialTitle: source.socialTitle,
  };
}

const FISH_TYPES = [
  { id: "ca_loc", name: "Cá Lóc Đồng Béo Múp", icon: "🐟", price: 1200, rarity: "Phổ biến" },
  { id: "ca_chep", name: "Cá Chép Vàng Vượt Vũ Môn", icon: "🐠", price: 3500, rarity: "Hiếm" },
  { id: "ca_ro", name: "Cá Rô Phi Kho Tộ", icon: "🐟", price: 800, rarity: "Phổ biến" },
  { id: "tom_cang", name: "Tôm Càng Xanh Sông Tiền", icon: "🦐", price: 2600, rarity: "Quý" },
  { id: "rua_vang", name: "Rùa Vàng May Mắn Độc Đắc", icon: "🐢", price: 8888, rarity: "Huyền thoại" },
];

function goFishing(nickname) {
  const p = players[nickname];
  if (!p) return { ok: false, error: "Người chơi không hợp lệ!" };

  // Cooldown 5 giây: cá cần thời gian cắn câu, chặn spam cần
  const now = Date.now();
  if (now - (p.lastFishingAt || 0) < 5000) {
    return { ok: false, error: "Cá đang cảnh giác, hãy đợi một chút rồi thả câu tiếp nhé." };
  }
  p.lastFishingAt = now;

  const roll = Math.random();
  let caughtFish;
  if (roll < 0.06) caughtFish = FISH_TYPES[4];
  else if (roll < 0.28) caughtFish = FISH_TYPES[1];
  else if (roll < 0.52) caughtFish = FISH_TYPES[3];
  else if (roll < 0.78) caughtFish = FISH_TYPES[0];
  else caughtFish = FISH_TYPES[2];

  // Trần kiếm tiền/ngày từ câu cá — chống farm vô hạn
  const granted = grantActivityReward(nickname, "fishing", caughtFish.price, 15000);
  if (granted <= 0) {
    return { ok: false, error: "Hôm nay bạn đã câu đủ nhiều rồi! Ngày mai cá lại cắn câu, quay lại nhé 🎣", dailyCapped: true };
  }

  unlockCollectionItem(nickname, `fish_${caughtFish.id}`);
  progressPlayerQuest(nickname, "go_fishing", 1);
  addExp(nickname, 40, "Câu cá bến sông");
  const updated = upsertPlayer(nickname, { money: p.money });
  p.quests = updated.quests;

  eventsQueue.push({
    type: "player_caught_fish",
    roomId: p.roomId,
    nickname,
    fish: caughtFish,
    message: `🎣 ${nickname} vừa giật cần trúng ${caughtFish.icon} ${caughtFish.name} (+${caughtFish.price.toLocaleString()}đ) tại Bến Sông!`,
    time: Date.now(),
  });

  return {
    ok: true,
    fish: caughtFish,
    money: p.money,
    quests: p.quests,
  };
}

let communityEvents = [
  {
    id: "event-1",
    creator: "Bác Ba Phi",
    title: "🏮 Hội Chợ Đêm & Bắn Pháo Hoa Mừng Lễ",
    desc: "Tụ họp tại Đài Sen Trung Tâm, cùng ngắm pháo hoa rực rỡ và giao lưu kết bạn!",
    location: "Khu Chợ Trung Tâm",
    timeStr: "Tối nay 20:00",
    participants: ["Bác Ba Phi", "Chị Tư Trà Đá"],
    createdAt: Date.now() - 3600000,
  },
  {
    id: "event-2",
    creator: "Chú Bảy Câu Cá",
    title: "🎣 Giải Thi Câu Cá Bến Sông & Đồi Ngắm Cảnh",
    desc: "Ai câu được Cá Chép Vàng to nhất tại Bến Sông sẽ được nhận lì xì 5.000đ!",
    location: "Bến Sông & Chợ Nổi",
    timeStr: "Chiều nay 17:00",
    participants: ["Chú Bảy Câu Cá"],
    createdAt: Date.now() - 1800000,
  },
  {
    id: "event-3",
    creator: "Cô Tấm",
    title: "🎤 Đêm Nhạc Karaoke & Ẩm Thực Phố Đêm",
    desc: "Lên sân khấu biểu diễn, vỗ tay cổ vũ và ăn bánh tráng nướng cùng hội bạn!",
    location: "Phố Ẩm Thực Đêm",
    timeStr: "Tối nay 19:30",
    participants: ["Cô Tấm"],
    createdAt: Date.now() - 900000,
  },
];

function createCommunityEvent(nickname, data) {
  const p = players[nickname];
  if (!p) return { ok: false, error: "Người chơi không hợp lệ!" };
  if (!data || !data.title) return { ok: false, error: "Vui lòng nhập tiêu đề hoạt động!" };

  const cleanTitle = sanitizeText(data.title, 48);
  if (!cleanTitle) return { ok: false, error: "Tiêu đề không hợp lệ!" };

  const newEvent = {
    id: `event-${Date.now()}`,
    creator: nickname,
    title: cleanTitle,
    desc: sanitizeText(data.desc || "Cùng tham gia giao lưu vui nhộn tại thị trấn nhé!", 150),
    location: sanitizeText(data.location || "Khu Chợ Trung Tâm", 32),
    timeStr: sanitizeText(data.timeStr || "Tối nay", 24),
    participants: [nickname],
    createdAt: Date.now(),
  };

  communityEvents.unshift(newEvent);
  if (communityEvents.length > 20) communityEvents.pop();
  addAffinity(nickname, 5, "Khởi xướng hoạt động cộng đồng");

  eventsQueue.push({
    type: "community_event_created",
    roomId: p.roomId,
    event: newEvent,
    message: `📢 [BẢNG TIN THỊ TRẤN] ${nickname} vừa tạo sự kiện mới: "${newEvent.title}" (${newEvent.timeStr} tại ${newEvent.location})!`,
    time: Date.now(),
  });

  return { ok: true, event: newEvent, events: communityEvents };
}

function joinCommunityEvent(nickname, eventId) {
  const ev = communityEvents.find((e) => e.id === eventId);
  if (!ev) return { ok: false, error: "Sự kiện không tồn tại hoặc đã kết thúc!" };

  if (!ev.participants.includes(nickname)) {
    ev.participants.push(nickname);
    addAffinity(nickname, 3, "Tham gia sự kiện cộng đồng");
    eventsQueue.push({
      type: "community_event_joined",
      nickname,
      eventId,
      message: `🎉 ${nickname} vừa đăng ký tham gia sự kiện "${ev.title}"!`,
      time: Date.now(),
    });
  }

  return { ok: true, event: ev, events: communityEvents };
}

function updateCharacterCustomization(nickname, custom) {
  const p = players[nickname];
  if (!p) return { ok: false, error: "Người chơi không tồn tại!" };
  const validHats = ["non_la", "helmet", "bandana"];
  const validOutfits = ["ba_ba", "ao_dai", "ao_thun"];
  p.customization = {
    hat: validHats.includes(custom?.hat) ? custom.hat : "non_la",
    outfit: validOutfits.includes(custom?.outfit) ? custom.outfit : "ba_ba",
    color: Number(custom?.color) || 0xf59e0b,
  };
  upsertPlayer(nickname, { customization: p.customization });
  return { ok: true, customization: p.customization };
}

function getZoneLabelForPos(pos, lang = "vi") {
  if (!pos) return lang === "en" ? "Central Market Plaza" : "Khu Chợ Trung Tâm";
  const z = getZoneAt(pos.x, pos.z);
  return (z.name && z.name[lang]) || z.name.vi;
}

function addFriend(sourceNick, targetNick) {
  const source = players[sourceNick];
  if (!source) return { ok: false, error: "Người chơi không hợp lệ!" };
  targetNick = sanitizeNickname(targetNick, 16);
  if (!targetNick || sourceNick === targetNick) {
    return { ok: false, error: "Không thể kết bạn với chính mình!" };
  }

  if (!Array.isArray(source.friends)) source.friends = [];
  if (source.friends.includes(targetNick)) {
    return { ok: false, error: `Bạn và ${targetNick} đã là bạn bè thân thiết rồi!` };
  }

  source.friends.push(targetNick);
  source.money += 300;
  addAffinity(sourceNick, 8, "Kết bạn mới");
  upsertPlayer(sourceNick, { friends: source.friends, money: source.money });

  const target = players[targetNick];
  if (target) {
    if (!Array.isArray(target.friends)) target.friends = [];
    if (!target.friends.includes(sourceNick)) {
      target.friends.push(sourceNick);
      target.money += 300;
      addAffinity(targetNick, 8, "Kết bạn mới");
      upsertPlayer(targetNick, { friends: target.friends, money: target.money });
    }
  } else {
    const savedTarget = getPlayer(targetNick);
    if (savedTarget) {
      const fList = Array.isArray(savedTarget.friends) ? savedTarget.friends : [];
      if (!fList.includes(sourceNick)) {
        fList.push(sourceNick);
        upsertPlayer(targetNick, { friends: fList, money: savedTarget.money + 300 });
      }
    }
  }

  eventsQueue.push({
    type: "friend_added",
    roomId: source.roomId,
    sourceNick,
    targetNick,
    message: `🤝 ${sourceNick} và ${targetNick} vừa kết nghĩa bạn bè thân thiết tại Chợ Thị Trấn (+300đ Lộc Kết Giao)!`,
    time: Date.now(),
  });

  return {
    ok: true,
    friends: getFriendsStatus(sourceNick),
    money: source.money,
  };
}

function getFriendsStatus(nickname) {
  const p = players[nickname];
  const fNames = p && Array.isArray(p.friends) ? p.friends : [];
  return fNames.map((fNick) => {
    const onlineP = players[fNick];
    if (onlineP) {
      return {
        nickname: fNick,
        online: true,
        roomId: onlineP.roomId || "public-1",
        pos: onlineP.pos,
        zone: getZoneLabelForPos(onlineP.pos),
        socialTitle: onlineP.socialTitle || "Bà Con Mới",
        money: onlineP.money,
      };
    }
    const dbP = getPlayer(fNick);
    return {
      nickname: fNick,
      online: false,
      roomId: null,
      pos: null,
      zone: "Đang nghỉ ngơi",
      socialTitle: dbP ? dbP.socialTitle : "Bà Con Mới",
      money: dbP ? dbP.money : 15000,
    };
  });
}

// Sân Đá Cầu Kiểng Thể Thao Phía Đông (Tọa độ x: 48, z: -16)
const SHUTTLECOCK_COURT = {
  x: 48,
  z: -16,
  combo: 0,
  maxCombo: 15,
  lastKicker: "Bác Ba Phi",
  lastKickTime: 0,
};

function kickShuttlecock(nickname) {
  const p = players[nickname];
  if (!p) return { ok: false, error: "Người chơi không hợp lệ!" };

  const now = Date.now();
  if (now - SHUTTLECOCK_COURT.lastKickTime > 20000) {
    SHUTTLECOCK_COURT.combo = 1;
  } else {
    SHUTTLECOCK_COURT.combo += 1;
  }

  SHUTTLECOCK_COURT.lastKicker = nickname;
  SHUTTLECOCK_COURT.lastKickTime = now;
  if (SHUTTLECOCK_COURT.combo > SHUTTLECOCK_COURT.maxCombo) {
    SHUTTLECOCK_COURT.maxCombo = SHUTTLECOCK_COURT.combo;
  }

  const reward = 150 + Math.min(850, SHUTTLECOCK_COURT.combo * 50);
  p.money += reward;
  addAffinity(nickname, 3, "Tâng cầu kiểng cùng bà con");
  unlockCollectionItem(nickname, "game_dacau");
  progressPlayerQuest(nickname, "kick_shuttlecock_5", 1);
  const updated = upsertPlayer(nickname, { money: p.money });
  p.quests = updated.quests;

  const moves = [
    "tung cú búng cầu vẩy má ngoài điệu nghệ",
    "đỡ ngực rồi quét chân tâng cầu cao vút",
    "nhảy xoay người vít cầu nghệ thuật",
    "đánh gót cầu chữ A chuẩn bài phố chợ",
  ];
  const moveDesc = moves[SHUTTLECOCK_COURT.combo % moves.length];

  eventsQueue.push({
    type: "shuttlecock_kicked",
    roomId: p.roomId,
    nickname,
    combo: SHUTTLECOCK_COURT.combo,
    maxCombo: SHUTTLECOCK_COURT.maxCombo,
    reward,
    message: `🪶 [Sân Đá Cầu] ${nickname} ${moveDesc}! Chuỗi tâng cầu: ${SHUTTLECOCK_COURT.combo} lượt liên tiếp (Kỷ lục: ${SHUTTLECOCK_COURT.maxCombo}) (+${reward}đ)!`,
    time: now,
  });

  return {
    ok: true,
    combo: SHUTTLECOCK_COURT.combo,
    maxCombo: SHUTTLECOCK_COURT.maxCombo,
    reward,
    money: p.money,
    quests: p.quests,
    shuttlecock: SHUTTLECOCK_COURT,
  };
}

/**
 * Nhà người chơi: cập nhật quyền riêng tư / trang trí / ghi Sổ Lưu Bút (Phase 9.6)
 */
function updatePlayerHouse(nickname, patch = {}) {
  const p = players[nickname];
  if (!p) return { ok: false, error: "Người chơi không tồn tại!" };

  const hc = p.houseConfig || {
    level: 0,
    privacy: "public",
    wall: "#fef08a",
    furniture: "Sập Gụ Tủ Chè",
    tree: "Hoa Mai Vàng",
    guestbook: [],
    items: [],
  };
  if (patch.privacy && ["public", "friends", "locked"].includes(patch.privacy)) {
    hc.privacy = patch.privacy;
  }
  if (patch.wall) hc.wall = sanitizeText(patch.wall, 24);
  if (patch.furniture) hc.furniture = sanitizeText(patch.furniture, 40);
  if (patch.tree) hc.tree = sanitizeText(patch.tree, 40);
  if (patch.yard) hc.yard = sanitizeText(patch.yard, 40);

  p.houseConfig = hc;
  upsertPlayer(nickname, { houseConfig: hc });
  return { ok: true, houseConfig: hc };
}

function buyOrUpgradeHouse(nickname) {
  const p = players[nickname];
  if (!p) return { ok: false, error: "Người chơi không tồn tại!" };

  const hc = p.houseConfig || {
    level: 0,
    privacy: "public",
    wall: "#fef08a",
    furniture: "Sập Gụ Tủ Chè",
    tree: "Hoa Mai Vàng",
    guestbook: [],
    items: [],
  };

  const currentLevel = hc.level || 0;
  if (currentLevel >= 5) {
    return { ok: false, error: "Nhà của bạn đã đạt cấp tối đa (Cấp 5 - Dinh Thự Hoàng Gia)!" };
  }

  const nextLevel = currentLevel + 1;
  const cost = nextLevel === 1 ? (HOUSING_CONFIG.plotCost || 10000) : (HOUSING_CONFIG.levels[nextLevel]?.cost || 25000);

  if ((p.money || 0) < cost) {
    return {
      ok: false,
      error: `Bạn cần ${cost.toLocaleString()}đ để ${nextLevel === 1 ? 'mua đất xây nhà' : 'nâng cấp nhà lên ' + HOUSING_CONFIG.levels[nextLevel].name}! Số dư hiện có: ${(p.money || 0).toLocaleString()}đ.`
    };
  }

  p.money -= cost;
  hc.level = nextLevel;
  hc.levelName = HOUSING_CONFIG.levels[nextLevel].name;
  hc.title = HOUSING_CONFIG.levels[nextLevel].title;
  p.houseConfig = hc;

  progressPlayerQuest(nickname, "own_house", 1);
  const updated = upsertPlayer(nickname, { money: p.money, houseConfig: hc });
  p.quests = updated.quests;

  return {
    ok: true,
    message: nextLevel === 1 ? "🎉 Chúc mừng bạn đã sở hữu lô đất nền và dựng xong Nhà Mái Lá Quê Hương!" : `🎉 Chúc mừng bạn đã nâng cấp nhà thành công lên ${HOUSING_CONFIG.levels[nextLevel].name}!`,
    money: p.money,
    houseConfig: hc,
    quests: p.quests,
  };
}

function buyHouseItem(nickname, itemId) {
  const p = players[nickname];
  if (!p) return { ok: false, error: "Người chơi không tồn tại!" };

  const item = HOUSING_CONFIG.items.find(i => i.id === itemId);
  if (!item) return { ok: false, error: "Vật phẩm nội ngoại thất không tồn tại!" };

  const hc = p.houseConfig || {
    level: 0,
    privacy: "public",
    wall: "#fef08a",
    furniture: "Sập Gụ Tủ Chè",
    tree: "Hoa Mai Vàng",
    guestbook: [],
    items: [],
  };

  if ((hc.level || 0) < 1) {
    return { ok: false, error: "Bạn cần mua đất dựng nhà (Cấp 1 trở lên) trước khi sắm sửa đồ đạc!" };
  }

  if (!Array.isArray(hc.items)) hc.items = [];
  if (hc.items.includes(itemId)) {
    return { ok: false, error: `Bạn đã sở hữu "${item.name}" rồi!` };
  }

  if ((p.money || 0) < item.price) {
    return {
      ok: false,
      error: `Bạn cần ${item.price.toLocaleString()}đ để mua "${item.name}"! Số dư hiện có: ${(p.money || 0).toLocaleString()}đ.`
    };
  }

  p.money -= item.price;
  hc.items.push(itemId);

  if (item.category === "Nội thất") hc.furniture = item.name;
  if (item.category === "Sân vườn") hc.tree = item.name;

  p.houseConfig = hc;
  upsertPlayer(nickname, { money: p.money, houseConfig: hc });

  return {
    ok: true,
    message: `✨ Đã sắm thành công "${item.name}" (+${item.comfort} điểm phong thủy)!`,
    money: p.money,
    houseConfig: hc,
  };
}

function signHouseGuestbook(ownerNick, authorNick, rawNote) {
  const cleanNote = sanitizeText(rawNote, 80);
  if (!cleanNote) return { ok: false, error: "Vui lòng nhập lời nhắn lưu bút lịch sự!" };

  const ownerOnline = players[ownerNick];
  const ownerData = ownerOnline || getPlayer(ownerNick);
  if (!ownerData) return { ok: false, error: "Không tìm thấy nhà của tiểu thương này!" };

  const hc = ownerData.houseConfig || {
    privacy: "public",
    wall: "#fef08a",
    furniture: "Sập Gụ Tủ Chè",
    tree: "Hoa Mai Vàng",
    guestbook: [],
  };
  if (hc.privacy === "locked" && ownerNick !== authorNick) {
    return { ok: false, error: "Chủ nhà đang khóa cửa nghỉ ngơi!" };
  }
  if (hc.privacy === "friends" && ownerNick !== authorNick) {
    const fList = Array.isArray(ownerData.friends) ? ownerData.friends : [];
    if (!fList.includes(authorNick)) {
      return { ok: false, error: "Nhà này chỉ mở cửa đón bạn bè thân thiết!" };
    }
  }

  if (!Array.isArray(hc.guestbook)) hc.guestbook = [];
  hc.guestbook.unshift({
    author: authorNick,
    note: cleanNote,
    time: Date.now(),
  });
  if (hc.guestbook.length > 20) hc.guestbook.pop();

  if (ownerOnline) ownerOnline.houseConfig = hc;
  upsertPlayer(ownerNick, { houseConfig: hc });
  addAffinity(authorNick, 4, "Ghi sổ lưu bút thăm nhà bạn");

  return { ok: true, houseConfig: hc };
}

/* ==========================================================================
   DỊCH VỤ NHÀ PHỐ THƯƠNG MẠI: NGÂN HÀNG, VÉ SỐ, SỬA XE & NƯỚC SÂM
   ========================================================================== */
function getBankInfo(nickname) {
  const p = players[nickname];
  if (!p) return { ok: false, error: "Người chơi không tồn tại!" };
  const hc = p.houseConfig || {};
  const currentDay = getDay();
  let savings = Number(hc.bankSavings) || 0;
  const lastDay = Number(hc.lastInterestDay) || currentDay;
  let interestGained = 0;

  if (currentDay > lastDay && savings > 0) {
    const daysPassed = currentDay - lastDay;
    interestGained = Math.floor(savings * (BANK_CONFIG.interestRate || 0.05) * daysPassed);
    savings += interestGained;
    hc.bankSavings = savings;
    hc.lastInterestDay = currentDay;
    p.houseConfig = hc;
    upsertPlayer(nickname, { houseConfig: hc });
  }

  return {
    ok: true,
    bankSavings: savings,
    interestGained,
    walletMoney: p.money,
    currentDay,
    interestRate: BANK_CONFIG.interestRate || 0.05,
  };
}

function depositBank(nickname, amount) {
  const p = players[nickname];
  if (!p) return { ok: false, error: "Người chơi không tồn tại!" };
  const amt = Math.floor(Number(amount));
  if (isNaN(amt) || amt < 1000) return { ok: false, error: "Số tiền gửi tối thiểu là 1.000đ!" };
  if ((p.money || 0) < amt) return { ok: false, error: `Số dư trong ví không đủ (${(p.money || 0).toLocaleString()}đ)!` };

  const hc = p.houseConfig || {};
  getBankInfo(nickname);

  p.money -= amt;
  hc.bankSavings = (Number(hc.bankSavings) || 0) + amt;
  hc.lastInterestDay = getDay();
  p.houseConfig = hc;

  upsertPlayer(nickname, { money: p.money, houseConfig: hc });
  return {
    ok: true,
    message: `Đã gửi thành công ${amt.toLocaleString()}đ vào Két Sắt Ngân Hàng!`,
    walletMoney: p.money,
    bankSavings: hc.bankSavings,
  };
}

function withdrawBank(nickname, amount) {
  const p = players[nickname];
  if (!p) return { ok: false, error: "Người chơi không tồn tại!" };
  const hc = p.houseConfig || {};
  getBankInfo(nickname);

  const savings = Number(hc.bankSavings) || 0;
  const amt = Math.floor(Number(amount));
  if (isNaN(amt) || amt <= 0) return { ok: false, error: "Số tiền rút không hợp lệ!" };
  if (amt > savings) return { ok: false, error: `Số dư trong két chỉ có ${savings.toLocaleString()}đ!` };

  hc.bankSavings = savings - amt;
  p.money += amt;
  p.houseConfig = hc;

  upsertPlayer(nickname, { money: p.money, houseConfig: hc });
  return {
    ok: true,
    message: `Đã rút thành công ${amt.toLocaleString()}đ về ví tiền mặt!`,
    walletMoney: p.money,
    bankSavings: hc.bankSavings,
  };
}

function buyLotteryTicket(nickname) {
  const p = players[nickname];
  if (!p) return { ok: false, error: "Người chơi không tồn tại!" };
  const price = LOTTERY_CONFIG.ticketPrice || 1000;
  if ((p.money || 0) < price) return { ok: false, error: `Bạn cần ${price.toLocaleString()}đ để mua vé số kiến thiết!` };

  p.money -= price;
  const ticketNumber = String(Math.floor(100000 + Math.random() * 900000));
  const hc = p.houseConfig || {};
  if (!Array.isArray(hc.lotteryTickets)) hc.lotteryTickets = [];
  hc.lotteryTickets.unshift({ ticket: ticketNumber, day: getDay(), time: Date.now() });
  if (hc.lotteryTickets.length > 10) hc.lotteryTickets.pop();
  p.houseConfig = hc;

  upsertPlayer(nickname, { money: p.money, houseConfig: hc });
  return {
    ok: true,
    ticketNumber,
    message: `Đã mua vé số kiến thiết số [${ticketNumber}]! Chúc bạn đại cát đại lợi rinh giải độc đắc 100.000đ!`,
    walletMoney: p.money,
    tickets: hc.lotteryTickets,
  };
}

function playScratchCard(nickname) {
  const p = players[nickname];
  if (!p) return { ok: false, error: "Người chơi không tồn tại!" };
  const price = LOTTERY_CONFIG.scratchPrice || 2000;
  if ((p.money || 0) < price) return { ok: false, error: `Bạn cần ${price.toLocaleString()}đ để cào vé số may mắn!` };

  p.money -= price;

  const symbolsPool = ["lotus", "gold", "crab", "fish", "gourd"];
  const sym1 = symbolsPool[Math.floor(Math.random() * symbolsPool.length)];
  const sym2 = symbolsPool[Math.floor(Math.random() * symbolsPool.length)];
  const sym3 = symbolsPool[Math.floor(Math.random() * symbolsPool.length)];
  const symbols = [sym1, sym2, sym3];

  let reward = 1000;
  let prizeName = "Lộc May Mắn";

  if (sym1 === sym2 && sym2 === sym3) {
    if (sym1 === "lotus") { reward = 50000; prizeName = "Giải Đặc Biệt (3 Hoa Sen Vàng)"; }
    else if (sym1 === "gold") { reward = 20000; prizeName = "Giải Nhất (3 Thỏi Vàng)"; }
    else if (sym1 === "crab") { reward = 8000; prizeName = "Giải Nhì (3 Con Cua)"; }
    else { reward = 5000; prizeName = "Giải Ba (3 Biểu Tượng Cùng Loại)"; }
  } else if (sym1 === sym2 || sym2 === sym3 || sym1 === sym3) {
    reward = 3000;
    prizeName = "Giải Khuyến Khích (2 Biểu Tượng Cặp Đôi)";
  }

  p.money += reward;
  upsertPlayer(nickname, { money: p.money });

  return {
    ok: true,
    symbols,
    reward,
    netGain: reward - price,
    prizeName,
    walletMoney: p.money,
    message: `🎉 Kết quả cào: [${symbols.join(" - ")}] — ${prizeName}! Bạn nhận được +${reward.toLocaleString()}đ!`,
  };
}

function upgradeMotorbike(nickname, options = {}) {
  const p = players[nickname];
  if (!p) return { ok: false, error: "Người chơi không tồn tại!" };
  const isSpeed = options.type === "speed";
  const cost = isSpeed ? (GARAGE_CONFIG.bikeUpgradeCost || 8000) : 2000;

  if ((p.money || 0) < cost) {
    return { ok: false, error: `Bạn cần ${cost.toLocaleString()}đ để thực hiện dịch vụ này!` };
  }

  p.money -= cost;
  const hc = p.houseConfig || {};
  if (isSpeed) hc.bikeSpeed = GARAGE_CONFIG.upgradedSpeed || 25.0;
  if (options.color) hc.bikeColor = options.color;
  p.houseConfig = hc;

  upsertPlayer(nickname, { money: p.money, houseConfig: hc });
  return {
    ok: true,
    bikeSpeed: hc.bikeSpeed || 25.0,
    bikeColor: hc.bikeColor || "#dc2626",
    walletMoney: p.money,
    message: isSpeed ? "Đã nâng cấp động cơ xe máy thành công! Tốc độ tối đa đạt 25m/s cực bốc!" : `Đã sơn mới màu xe máy thành công!`,
  };
}

function buyEnergyDrink(nickname) {
  const p = players[nickname];
  if (!p) return { ok: false, error: "Người chơi không tồn tại!" };
  const cost = GARAGE_CONFIG.drinkCost || 500;
  if ((p.money || 0) < cost) return { ok: false, error: `Bạn cần ${cost.toLocaleString()}đ để mua nước sâm giải nhiệt!` };

  p.money -= cost;
  upsertPlayer(nickname, { money: p.money });
  return {
    ok: true,
    walletMoney: p.money,
    duration: GARAGE_CONFIG.drinkDuration || 180,
    multiplier: GARAGE_CONFIG.drinkSpeedMultiplier || 1.4,
    message: "Đã uống 1 ly Nước Sâm Bí Đao Hạt Chia thơm mát! Chạy nhanh như gió (+40%) trong 3 phút!",
  };
}

function toggleBlockUser(nickname, targetNick) {
  const p = players[nickname];
  if (!p) return { ok: false, error: "Người chơi không tồn tại!" };
  targetNick = String(targetNick || "").trim();
  if (!targetNick || targetNick === nickname) {
    return { ok: false, error: "Không thể tự chặn chính mình!" };
  }
  if (!Array.isArray(p.blockedUsers)) p.blockedUsers = [];
  const idx = p.blockedUsers.indexOf(targetNick);
  let blocked = false;
  if (idx >= 0) {
    p.blockedUsers.splice(idx, 1);
  } else {
    p.blockedUsers.push(targetNick);
    blocked = true;
  }
  upsertPlayer(nickname, { blockedUsers: p.blockedUsers });
  return { ok: true, blocked, blockedUsers: p.blockedUsers };
}

function getStallData(stallId) {
  const s = stalls[stallId];
  if (!s) return null;
  return {
    id: s.id,
    name: s.name,
    owner: s.owner,
    position: s.position,
    goods: s.goods,
    level: s.level,
    hasStaff: s.hasStaff,
    priceFactor: s.priceFactor !== undefined ? s.priceFactor : 1,
    earnings: s.earnings,
    color: s.color,
    category: s.category,
  };
}

function getZonePopulation(roomId = "public-1") {
  const counts = {};
  ZONES.forEach((z) => {
    counts[z.id] = 0;
  });
  getPlayersInRoom(roomId).forEach((p) => {
    const zId = p.zoneId || getZoneAt(p.pos.x, p.pos.z).id;
    counts[zId] = (counts[zId] || 0) + 1;
  });
  return counts;
}

function getSnapshot(roomId = "public-1", festivalOverride = null) {
  const roomPlayers = getPlayersInRoom(roomId).map((p) => ({
    nickname: p.nickname,
    pos: p.pos,
    rot: p.rot || 0,
    zoneId: p.zoneId || "central_market",
    hoverboard: Boolean(p.hoverboard),
    passengerOf: p.passengerOf || null,
    seatId: p.seatId || null,
    customization: p.customization || { hat: "non_la", outfit: "ba_ba", color: 0xf59e0b },
    socialTitle: p.socialTitle || "🌱 Bà Con Mới",
    affinity: p.affinity || 0,
    isNewbie: Boolean(p.isNewbie && Date.now() - (p.joinedAt || 0) < 600000),
    money: p.money,
  }));

  const stallsList = Object.values(stalls).map((s) => getStallData(s.id));

  const customersList = customers.map((c) => ({
    id: c.id,
    name: c.name,
    npcType: c.npcType,
    role: c.role,
    x: c.x,
    z: c.z,
    bubble: c.bubble,
    state: c.state,
  }));

  return {
    roomId,
    players: roomPlayers,
    stalls: stallsList,
    customers: customersList,
    supplyDrop: activeSupplyDrop,
    marketEvent: currentMarketEvent,
    weather: getWeatherState(currentMarketEvent ? currentMarketEvent.weather : "clear"),
    hotspot: HOTSPOT_SCHEDULE[currentHotspotPhase],
    festival: getActiveFestival(festivalOverride),
    zones: Object.values(ZONES),
    zonePopulation: getZonePopulation(roomId),
    seats: seatsManager.getSeatsSnapshot(roomId),
    activities: activitiesManager.getActivitiesSnapshot(roomId),
    chatHistory: getRoomChatHistory(roomId),
    bauCua: {
      roundId: bauCuaRound.roundId,
      state: bauCuaRound.state,
      timer: Math.max(0, Math.round(bauCuaRound.timer / 1000)),
      lastDice: bauCuaRound.lastDice,
      history: bauCuaRound.history,
    },
    teaTable: TEA_TABLE,
    shuttlecock: SHUTTLECOCK_COURT,
    communityEvents,
    serverTime,
    day: getDay(),
    timeOfDay: getTimeOfDay(),
    marketSignals: getMarketSignals(),
    leaderboard: getLeaderboard(8),
  };
}

// === TUTORIAL 2.0 (port từ bản local): bán được món đầu tiên trong ~60 giây ===
function completeTutorialStep(nickname, step) {
  const p = players[nickname];
  if (!p) return { ok: false, error: "Người chơi không hợp lệ!" };
  if (p.tutorialCompleted) return { ok: true, alreadyCompleted: true, money: p.money, tutorialCompleted: true };

  step = Number(step) || 1;
  p.tutorialStep = Math.max(p.tutorialStep || 1, step + 1);

  let reward = 500;
  if (step === 2) reward = 1000;
  else if (step === 3) reward = 1200;
  else if (step >= 4) reward = 1500;

  p.money = (p.money || 0) + reward;

  if (step >= 4) {
    p.tutorialCompleted = true;
    unlockCollectionItem(nickname, "souvenir_conical_hat");
  }

  addExp(nickname, step * 50, "Hoàn thành bước hướng dẫn");
  upsertPlayer(nickname, {
    money: p.money,
    tutorialCompleted: p.tutorialCompleted,
    tutorialStep: p.tutorialStep,
  });

  return {
    ok: true,
    step,
    nextStep: p.tutorialStep,
    tutorialCompleted: p.tutorialCompleted,
    reward,
    money: p.money,
  };
}

function skipTutorial(nickname) {
  const p = players[nickname];
  if (!p) return { ok: false, error: "Người chơi không hợp lệ!" };
  p.tutorialCompleted = true;
  p.tutorialStep = 5;
  upsertPlayer(nickname, { tutorialCompleted: true, tutorialStep: 5 });
  return { ok: true, tutorialCompleted: true };
}

module.exports = {
  updateWorld,
  joinWorld,
  leaveWorld,
  updatePlayerMove,
  assignRoom,
  createPrivateRoom,
  getPlayersInRoom,
  addRoomChatHistory,
  getRoomChatHistory,
  buyWholesale,
  rentStall,
  stockGood,
  stockAllGoods,
  withdrawGood,
  upgradeStall,
  hireStaff,
  // === ECONOMY 2.0 + TUTORIAL (hợp nhất từ bản local) ===
  getMarketSignals,
  setStallPrice,
  resolveHaggle,
  getPlayerLevel,
  calculateLevel,
  addExp,
  completeTutorialStep,
  skipTutorial,
  pendingHaggles,
  HAGGLE_CONFIG,
  STALL_RENT_PER_DAY,
  STAFF_WAGE_PER_DAY,
  LEVEL_UNLOCKS,
  spinGacha,
  placeBauCuaBet,
  toggleSitTeaTable,
  interactPlayer,
  goFishing,
  createCommunityEvent,
  joinCommunityEvent,
  updateCharacterCustomization,
  addFriend,
  getFriendsStatus,
  kickShuttlecock,
  addAffinity,
  unlockCollectionItem,
  updatePlayerHouse,
  buyOrUpgradeHouse,
  buyHouseItem,
  signHouseGuestbook,
  getBankInfo,
  depositBank,
  withdrawBank,
  buyLotteryTicket,
  playScratchCard,
  upgradeMotorbike,
  buyEnergyDrink,
  toggleBlockUser,
  getSnapshot,
  popEvents,
  getStallData,
  getDay,
  getTimeOfDay,
  BAU_CUA_ANIMALS,
  FISH_TYPES,
  BUS_STOPS,
  seatsManager,
  activitiesManager,
  get activeSupplyDrop() {
    return activeSupplyDrop;
  },
  get currentMarketEvent() {
    return currentMarketEvent;
  },
  get bauCuaRound() {
    return bauCuaRound;
  },
  get teaTable() {
    return TEA_TABLE;
  },
  get shuttlecock() {
    return SHUTTLECOCK_COURT;
  },
  get communityEvents() {
    return communityEvents;
  },
  players,
  stalls,
  customers,
  rooms,
};
