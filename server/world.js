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

// 6 Sạp Hàng Truyền Thống & Phố Thị Việt Nam quanh Đài Sen Trung Tâm
const INITIAL_STALL_DEFS = [
  {
    id: "stall-1",
    name: "Sạp Trái Cây Miền Tây",
    x: -13,
    z: -11,
    color: 0x16a34a,
    category: "Trái cây",
    goods: { apple: 15, orange: 12 },
  },
  {
    id: "stall-2",
    name: "Quán Cà Phê Vợt & Nước Mía",
    x: 13,
    z: -11,
    color: 0x0284c7,
    category: "Giải khát",
    goods: { coffee: 14, carrot: 16 },
  },
  {
    id: "stall-3",
    name: "Tiệm Phở Bò & Bánh Mì Sài Gòn",
    x: -13,
    z: 11,
    color: 0xd97706,
    category: "Ẩm thực",
    goods: { bread: 16, cake: 10, tea: 8 },
  },
  {
    id: "stall-4",
    name: "Hàng Nón Lá & Hoa Xuân",
    x: 13,
    z: 11,
    color: 0xe11d48,
    category: "Thủ công",
    goods: { toy: 12, flower: 14 },
  },
  {
    id: "stall-5",
    name: "Bách Hóa Tổng Hợp Phố Chợ",
    x: -9,
    z: 0,
    color: 0x0d9488,
    category: "Tổng hợp",
    goods: { apple: 10, bread: 10, coffee: 8, tea: 6 },
  },
  {
    id: "stall-6",
    name: "Tiệm Trầm Hương & Ngọc Phố Cổ",
    x: 9,
    z: 0,
    color: 0x9333ea,
    category: "Đặc sản",
    goods: { gem: 8, flower: 12, toy: 8 },
  },
];

function initStalls() {
  INITIAL_STALL_DEFS.forEach((def) => {
    stalls[def.id] = {
      id: def.id,
      name: def.name,
      owner: null,
      goods: { ...def.goods },
      earnings: 0,
      level: 1,
      hasStaff: false,
      position: { x: def.x, z: def.z },
      color: def.color,
      category: def.category,
    };
  });
}
initStalls();

// Danh sách NPC có lịch sống theo giờ & hướng dẫn mềm (Phase 10.2)
const CUSTOMER_DEFS = [
  { name: "Cô Ba Sài Gòn", type: "nonla", role: "shopper", homeZone: "central_market" },
  { name: "Chị Tư Trà Đá", type: "nonla", role: "tea_host", homeZone: "tea_table_corner" },
  { name: "Chú Bảy Miền Tây", type: "nonla", role: "fisher", homeZone: "floating_market_hill" },
  { name: "Chị Ninja Lead", type: "helmet", role: "shopper", homeZone: "central_market" },
  { name: "Anh Tây Ba Lô", type: "tourist", role: "explorer", homeZone: "night_food_stage" },
  { name: "Bác Tổ Trưởng", type: "nonla", role: "guide", homeZone: "lotus_park_village" },
  { name: "Bé Na Đá Cầu", type: "helmet", role: "kid", homeZone: "shuttlecock_court" },
  { name: "Cô Năm Bánh Chưng", type: "nonla", role: "artisan", homeZone: "craft_village_garden" },
  { name: "Anh Shipper Vui Tính", type: "helmet", role: "shopper", homeZone: "central_market" },
  { name: "Ông Đồ Thầy Minh", type: "nonla", role: "elder", homeZone: "lotus_park_village" },
  { name: "Chú Sáu Xích Lô", type: "nonla", role: "cyclo", homeZone: "central_market" },
  { name: "Ca Sĩ Phố Đêm", type: "tourist", role: "singer", homeZone: "night_food_stage" },
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

function initCustomers() {
  for (let i = 0; i < CUSTOMER_DEFS.length; i++) {
    const angle = (i / CUSTOMER_DEFS.length) * Math.PI * 2;
    const dist = 6 + Math.random() * 9;
    const def = CUSTOMER_DEFS[i];
    customers.push({
      id: `npc-${i + 1}`,
      name: def.name,
      npcType: def.type,
      role: def.role,
      homeZone: def.homeZone,
      x: Number((Math.cos(angle) * dist).toFixed(2)),
      z: Number((Math.sin(angle) * dist).toFixed(2)),
      targetX: (Math.random() - 0.5) * 18,
      targetZ: (Math.random() - 0.5) * 18,
      targetStallId: null,
      state: "wandering",
      bubble: "",
      bubbleTimer: 0,
      actionTimer: 1500 + Math.random() * 3000,
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

// Bàn Trà Đá Vỉa Hè (Giữ tương thích ngược + liên kết với server/seats.js)
const TEA_TABLE = {
  x: 0,
  z: 13.5,
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

  const spawnX = Number(((Math.random() - 0.5) * 5).toFixed(2));
  const spawnZ = Number((5.5 + Math.random() * 2).toFixed(2));

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
    joinedAt: Date.now(),
    isNewbie: isFirstJoin || (saved.affinity || 0) < 15,
    greetedBy: [],
    lastMoveAt: Date.now(),
    lastActive: Date.now(),
  };

  progressPlayerQuest(nickname, "join_town", 1);
  return players[nickname];
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

  // 3. Cập nhật NPC có lịch sống theo giờ & tự tăng hoạt động khi phòng vắng (Phase 10.2)
  const onlineCount = Object.keys(players).length;
  const speedBoost = currentMarketEvent.id === "tourists_visit" ? 1.4 : 1.0;

  customers.forEach((c) => {
    if (c.bubbleTimer > 0) {
      c.bubbleTimer -= dt;
      if (c.bubbleTimer <= 0) c.bubble = "";
    }

    c.actionTimer -= dt;
    if (c.actionTimer <= 0) {
      c.actionTimer = 2500 + Math.random() * 4000;

      // Khi phòng vắng (< 5 người), NPC tích cực mời gọi giao lưu & di chuyển tới khu nóng
      if (onlineCount < 5 && Math.random() < 0.35) {
        const hotZoneId = HOTSPOT_SCHEDULE[currentHotspotPhase]?.zoneId || c.homeZone;
        const zDef = ZONES.find((z) => z.id === hotZoneId) || ZONES[ZONES.length - 1];
        c.targetStallId = null;
        c.targetX = zDef.center.x + (Math.random() - 0.5) * 10;
        c.targetZ = zDef.center.z + (Math.random() - 0.5) * 10;
        c.state = "wandering";
        if (!c.bubble && Math.random() < 0.5) {
          c.bubble = CUSTOMER_DIALOGS[Math.floor(Math.random() * CUSTOMER_DIALOGS.length)];
          c.bubbleTimer = 4500;
        }
      } else {
        const activeStalls = Object.values(stalls).filter((s) =>
          Object.values(s.goods).some((qty) => qty > 0)
        );

        if (activeStalls.length > 0 && Math.random() < 0.75) {
          const chosen = activeStalls[Math.floor(Math.random() * activeStalls.length)];
          c.targetStallId = chosen.id;
          c.targetX = chosen.position.x + (Math.random() - 0.5) * 2.2;
          c.targetZ = chosen.position.z + 2.2;
          c.state = "shopping";
        } else {
          c.targetStallId = null;
          c.targetX = (Math.random() - 0.5) * 26;
          c.targetZ = (Math.random() - 0.5) * 26;
          c.state = "wandering";
        }
      }
    }

    const dx = c.targetX - c.x;
    const dz = c.targetZ - c.z;
    const dist = Math.hypot(dx, dz);
    if (dist > 0.2) {
      const speed = 2.4 * speedBoost * (dt / 1000);
      c.x = Number((c.x + (dx / dist) * Math.min(speed, dist)).toFixed(2));
      c.z = Number((c.z + (dz / dist) * Math.min(speed, dist)).toFixed(2));
    } else if (c.state === "shopping" && c.targetStallId) {
      handleCustomerPurchase(c, c.targetStallId);
      c.state = "wandering";
      c.targetStallId = null;
      c.actionTimer = 3000 + Math.random() * 3500;
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

function handleCustomerPurchase(customer, stallId) {
  const stall = stalls[stallId];
  if (!stall) return;

  const inStockIds = Object.keys(stall.goods).filter((k) => stall.goods[k] > 0);
  if (inStockIds.length === 0) return;

  const chosenId = inStockIds[Math.floor(Math.random() * inStockIds.length)];
  const goodDef = GOODS.find((g) => g.id === chosenId);
  if (!goodDef) return;

  stall.goods[chosenId]--;

  const earn = getEffectiveSellPrice(goodDef, stall);
  stall.earnings += earn;

  if (stall.owner && players[stall.owner]) {
    const owner = players[stall.owner];
    owner.money += earn;
    const q = progressPlayerQuest(stall.owner, "sell_customers", 1);
    if (q) owner.quests = getPlayer(stall.owner).quests;
  } else if (stall.owner) {
    const dbOwner = getPlayer(stall.owner);
    if (dbOwner) {
      upsertPlayer(stall.owner, { money: dbOwner.money + earn });
    }
  }

  customer.bubble = CUSTOMER_DIALOGS[Math.floor(Math.random() * CUSTOMER_DIALOGS.length)];
  customer.bubbleTimer = 4000;

  eventsQueue.push({
    type: "customer_buy",
    customerName: customer.name,
    stallId: stall.id,
    stallName: stall.name,
    owner: stall.owner || "Sạp Chung",
    goodId: goodDef.id,
    goodName: goodDef.name,
    goodIcon: goodDef.icon,
    price: earn,
    dialog: customer.bubble,
    time: Date.now(),
  });
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

  if (player.money < STALL_COST) {
    return { ok: false, error: `Không đủ ${STALL_COST.toLocaleString()}đ để thuê sạp!` };
  }

  player.money -= STALL_COST;
  stall.owner = nickname;
  if (customName && customName.trim()) {
    stall.name = sanitizeText(customName, 28) || stall.name;
  }

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

function withdrawGood(nickname, stallId, goodId, amount = 1) {
  const player = players[nickname];
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

  if (player.money < cost) {
    return { ok: false, error: `Cần ${cost.toLocaleString()}đ để nâng cấp!` };
  }

  player.money -= cost;
  stall.level = nextLevel;

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
  if (player.money < HIRE_STAFF_COST) {
    return { ok: false, error: `Cần ${HIRE_STAFF_COST.toLocaleString()}đ để thuê phụ quán!` };
  }

  player.money -= HIRE_STAFF_COST;
  stall.hasStaff = true;

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

  const roll = Math.random();
  let caughtFish;
  if (roll < 0.06) caughtFish = FISH_TYPES[4];
  else if (roll < 0.28) caughtFish = FISH_TYPES[1];
  else if (roll < 0.52) caughtFish = FISH_TYPES[3];
  else if (roll < 0.78) caughtFish = FISH_TYPES[0];
  else caughtFish = FISH_TYPES[2];

  p.money += caughtFish.price;
  unlockCollectionItem(nickname, `fish_${caughtFish.id}`);
  upsertPlayer(nickname, { money: p.money });

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

// Vòng Đá Cầu Kiểng Tập Thể Giữa Sân Chợ (Tọa độ x: 8, z: -15)
const SHUTTLECOCK_COURT = {
  x: 8,
  z: -15,
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
    privacy: "public",
    wall: "#fef08a",
    furniture: "Sập Gụ Tủ Chè",
    tree: "Hoa Mai Vàng",
    guestbook: [],
  };
  if (patch.privacy && ["public", "friends", "locked"].includes(patch.privacy)) {
    hc.privacy = patch.privacy;
  }
  if (patch.wall) hc.wall = sanitizeText(patch.wall, 24);
  if (patch.furniture) hc.furniture = sanitizeText(patch.furniture, 40);
  if (patch.tree) hc.tree = sanitizeText(patch.tree, 40);

  p.houseConfig = hc;
  upsertPlayer(nickname, { houseConfig: hc });
  return { ok: true, houseConfig: hc };
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
    leaderboard: getLeaderboard(8),
  };
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
  withdrawGood,
  upgradeStall,
  hireStaff,
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
  signHouseGuestbook,
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
