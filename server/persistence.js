/*
 * Persistence layer using better-sqlite3.
 * Supports passwordless token_hash identity, 6-char recovery codes, reports table,
 * social affinity titles, collection book, and house guestbook.
 */

const Database = require("better-sqlite3");
const crypto = require("crypto");
const path = require("path");
const { INITIAL_MONEY, QUESTS_CONFIG } = require("../shared/constants");
const config = require("./config");

const dbPath = path.resolve(__dirname, "..", config.dbPath);
const db = new Database(dbPath);

// Enable WAL mode for high concurrency
try {
  db.pragma("journal_mode = WAL");
} catch (_) {}

// Create tables if not exists
db.exec(`
  CREATE TABLE IF NOT EXISTS players (
    nickname TEXT PRIMARY KEY,
    money INTEGER NOT NULL DEFAULT ${INITIAL_MONEY},
    inventory TEXT NOT NULL DEFAULT '{}',
    stalls TEXT NOT NULL DEFAULT '[]',
    quests TEXT NOT NULL DEFAULT '[]',
    customization TEXT NOT NULL DEFAULT '{"hat":"non_la","outfit":"ba_ba","color":16096779}',
    friends TEXT NOT NULL DEFAULT '[]',
    tutorial_completed INTEGER NOT NULL DEFAULT 0,
    token_hash TEXT DEFAULT NULL,
    recovery_code TEXT DEFAULT NULL,
    blocked_users TEXT NOT NULL DEFAULT '[]',
    affinity INTEGER NOT NULL DEFAULT 0,
    social_title TEXT NOT NULL DEFAULT 'Bà Con Mới',
    collection TEXT NOT NULL DEFAULT '[]',
    house_config TEXT NOT NULL DEFAULT '{"privacy":"public","wall":"#fef08a","furniture":"Sập Gụ Tủ Chè","tree":"Hoa Mai Vàng","guestbook":[]}',
    muted_until INTEGER NOT NULL DEFAULT 0,
    banned_until INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%f','now')),
    updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%f','now'))
  );

  CREATE TABLE IF NOT EXISTS reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    reporter TEXT NOT NULL,
    target TEXT NOT NULL,
    reason TEXT NOT NULL,
    recent_chat TEXT NOT NULL DEFAULT '[]',
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%f','now'))
  );
`);

// Safe migrations for existing databases
const MIGRATION_COLUMNS = [
  `ALTER TABLE players ADD COLUMN customization TEXT NOT NULL DEFAULT '{"hat":"non_la","outfit":"ba_ba","color":16096779}'`,
  `ALTER TABLE players ADD COLUMN friends TEXT NOT NULL DEFAULT '[]'`,
  `ALTER TABLE players ADD COLUMN token_hash TEXT DEFAULT NULL`,
  `ALTER TABLE players ADD COLUMN recovery_code TEXT DEFAULT NULL`,
  `ALTER TABLE players ADD COLUMN blocked_users TEXT NOT NULL DEFAULT '[]'`,
  `ALTER TABLE players ADD COLUMN affinity INTEGER NOT NULL DEFAULT 0`,
  `ALTER TABLE players ADD COLUMN social_title TEXT NOT NULL DEFAULT 'Bà Con Mới'`,
  `ALTER TABLE players ADD COLUMN collection TEXT NOT NULL DEFAULT '[]'`,
  `ALTER TABLE players ADD COLUMN house_config TEXT NOT NULL DEFAULT '{"privacy":"public","wall":"#fef08a","furniture":"Sập Gụ Tủ Chè","tree":"Hoa Mai Vàng","guestbook":[]}'`,
  `ALTER TABLE players ADD COLUMN muted_until INTEGER NOT NULL DEFAULT 0`,
  `ALTER TABLE players ADD COLUMN banned_until INTEGER NOT NULL DEFAULT 0`,
];

MIGRATION_COLUMNS.forEach((sql) => {
  try {
    db.exec(sql);
  } catch (_) {}
});

function hashToken(token) {
  if (!token || typeof token !== "string") return null;
  return crypto.createHash("sha256").update(token).digest("hex");
}

function generatePlayerToken() {
  return crypto.randomBytes(32).toString("hex");
}

function generateRecoveryCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[crypto.randomInt(0, chars.length)];
  }
  return code;
}

function getSocialTitle(affinity = 0) {
  if (affinity >= 100) return "🌟 Hồn Làng Phố Chợ";
  if (affinity >= 50) return "☕ Chủ Trà Đá Mến Khách";
  if (affinity >= 25) return "🪶 Tay Đá Cầu Thân Thiện";
  if (affinity >= 10) return "👋 Người Hay Chào";
  return "🌱 Bà Con Mới";
}

function createDefaultQuests() {
  return QUESTS_CONFIG.map((q) => ({
    id: q.id,
    title: q.title,
    description: q.description,
    progress: q.id === "join_town" ? 1 : 0,
    target: q.target,
    reward: q.reward,
    completed: q.id === "join_town",
    claimed: false,
  }));
}

function suggestNicknames(baseNick) {
  const cleanBase = String(baseNick || "BàCon").slice(0, 11);
  const suffixes = ["68", "88", "VN", "Vui", "Chợ", "99", "Tết", "Sen"];
  const suggestions = [];
  for (const sfx of suffixes) {
    const candidate = `${cleanBase}_${sfx}`;
    const exists = db.prepare("SELECT 1 FROM players WHERE nickname = ?").get(candidate);
    if (!exists) {
      suggestions.push(candidate);
      if (suggestions.length >= 3) break;
    }
  }
  while (suggestions.length < 3) {
    suggestions.push(`${cleanBase}_${Math.floor(100 + Math.random() * 899)}`);
  }
  return suggestions;
}

/**
 * Xác thực hoặc cấp mới playerToken & recoveryCode cho người chơi (Phase 1.2)
 */
function verifyOrBindPlayerIdentity(nickname, clientToken = null, inputRecoveryCode = null) {
  const row = db
    .prepare("SELECT nickname, token_hash, recovery_code, banned_until FROM players WHERE nickname = ?")
    .get(nickname);

  const now = Date.now();
  if (row && row.banned_until && Number(row.banned_until) > now) {
    return {
      ok: false,
      code: "BANNED",
      error: "Tài khoản này đang tạm khóa do vi phạm nội quy sân chơi!",
    };
  }

  // 1. Người chơi hoàn toàn mới
  if (!row) {
    const newToken = clientToken && clientToken.length >= 32 ? clientToken : generatePlayerToken();
    const newRecovery = generateRecoveryCode();
    upsertPlayer(nickname, {
      tokenHash: hashToken(newToken),
      recoveryCode: newRecovery,
    });
    return {
      ok: true,
      isNew: true,
      playerToken: newToken,
      recoveryCode: newRecovery,
    };
  }

  // 2. Người chơi cũ trong DB chưa có token_hash (Migration lần đầu quay lại)
  if (!row.token_hash) {
    const boundToken = clientToken && clientToken.length >= 32 ? clientToken : generatePlayerToken();
    const boundRecovery = row.recovery_code || generateRecoveryCode();
    db.prepare("UPDATE players SET token_hash = ?, recovery_code = ? WHERE nickname = ?").run(
      hashToken(boundToken),
      boundRecovery,
      nickname
    );
    return {
      ok: true,
      isNew: false,
      migrated: true,
      playerToken: boundToken,
      recoveryCode: boundRecovery,
    };
  }

  // 3. Khôi phục sang thiết bị mới bằng Mã Khôi Phục 6 ký tự
  if (
    inputRecoveryCode &&
    row.recovery_code &&
    String(inputRecoveryCode).trim().toUpperCase() === String(row.recovery_code).trim().toUpperCase()
  ) {
    const rotatedToken = clientToken && clientToken.length >= 32 ? clientToken : generatePlayerToken();
    db.prepare("UPDATE players SET token_hash = ? WHERE nickname = ?").run(hashToken(rotatedToken), nickname);
    return {
      ok: true,
      isNew: false,
      recovered: true,
      playerToken: rotatedToken,
      recoveryCode: row.recovery_code,
    };
  }

  // 4. Khớp playerToken đã lưu trong localStorage
  if (clientToken && hashToken(clientToken) === row.token_hash) {
    const recovery = row.recovery_code || generateRecoveryCode();
    if (!row.recovery_code) {
      db.prepare("UPDATE players SET recovery_code = ? WHERE nickname = ?").run(recovery, nickname);
    }
    return {
      ok: true,
      isNew: false,
      playerToken: clientToken,
      recoveryCode: recovery,
    };
  }

  // 5. Không khớp token -> Từ chối mạo danh và gợi ý 3 tên còn trống
  return {
    ok: false,
    code: "NICKNAME_TAKEN",
    error: "Tên này đang có người dùng, hãy chọn tên khác hoặc nhập Mã Khôi Phục!",
    suggestions: suggestNicknames(nickname),
  };
}

function getPlayer(nickname) {
  const row = db
    .prepare(
      `SELECT nickname, money, inventory, stalls, quests, customization, friends,
              tutorial_completed, token_hash, recovery_code, blocked_users,
              affinity, social_title, collection, house_config, muted_until, banned_until
       FROM players WHERE nickname = ?`
    )
    .get(nickname);
  if (!row) return null;

  let quests = [];
  try {
    quests = JSON.parse(row.quests);
  } catch (_) {
    quests = [];
  }
  if (!Array.isArray(quests) || quests.length === 0) {
    quests = createDefaultQuests();
  } else {
    QUESTS_CONFIG.forEach((cfg) => {
      if (!quests.some((q) => q.id === cfg.id)) {
        quests.push({
          id: cfg.id,
          title: cfg.title,
          description: cfg.description,
          progress: 0,
          target: cfg.target,
          reward: cfg.reward,
          completed: false,
          claimed: false,
        });
      }
    });
  }

  let inventory = {};
  let stalls = [];
  let customization = { hat: "non_la", outfit: "ba_ba", color: 0xf59e0b };
  let friends = [];
  let blockedUsers = [];
  let collection = [];
  let houseConfig = {
    privacy: "public",
    wall: "#fef08a",
    furniture: "Sập Gụ Tủ Chè",
    tree: "Hoa Mai Vàng",
    guestbook: [],
  };

  try {
    inventory = JSON.parse(row.inventory);
  } catch (_) {}
  try {
    stalls = JSON.parse(row.stalls);
  } catch (_) {}
  try {
    if (row.customization) {
      const parsed = JSON.parse(row.customization);
      if (parsed && typeof parsed === "object") {
        customization = {
          hat: parsed.hat || "non_la",
          outfit: parsed.outfit || "ba_ba",
          color: Number(parsed.color) || 0xf59e0b,
        };
      }
    }
  } catch (_) {}
  try {
    if (row.friends) {
      const parsedF = JSON.parse(row.friends);
      if (Array.isArray(parsedF)) friends = parsedF;
    }
  } catch (_) {}
  try {
    if (row.blocked_users) {
      const parsedB = JSON.parse(row.blocked_users);
      if (Array.isArray(parsedB)) blockedUsers = parsedB;
    }
  } catch (_) {}
  try {
    if (row.collection) {
      const parsedC = JSON.parse(row.collection);
      if (Array.isArray(parsedC)) collection = parsedC;
    }
  } catch (_) {}
  try {
    if (row.house_config) {
      const parsedH = JSON.parse(row.house_config);
      if (parsedH && typeof parsedH === "object") {
        houseConfig = { ...houseConfig, ...parsedH };
      }
    }
  } catch (_) {}

  const affinity = Number(row.affinity) || 0;

  return {
    nickname: row.nickname,
    money: Number(row.money),
    inventory: inventory || {},
    stalls: Array.isArray(stalls) ? stalls : [],
    quests,
    customization,
    friends,
    blockedUsers,
    affinity,
    socialTitle: getSocialTitle(affinity),
    collection,
    houseConfig,
    recoveryCode: row.recovery_code || null,
    mutedUntil: Number(row.muted_until) || 0,
    bannedUntil: Number(row.banned_until) || 0,
    tutorialCompleted: row.tutorial_completed === 1,
  };
}

function upsertPlayer(nickname, patch = {}) {
  const sel = getPlayer(nickname);
  const existingRow = db
    .prepare("SELECT token_hash, recovery_code, muted_until, banned_until FROM players WHERE nickname = ?")
    .get(nickname);

  const base = {
    money: sel ? sel.money : INITIAL_MONEY,
    inventory: sel ? sel.inventory : { apple: 5, bread: 3 },
    stalls: sel ? sel.stalls : [],
    quests: sel ? sel.quests : createDefaultQuests(),
    customization: sel ? sel.customization : { hat: "non_la", outfit: "ba_ba", color: 0xf59e0b },
    friends: sel ? sel.friends : [],
    blockedUsers: sel ? sel.blockedUsers : [],
    affinity: sel ? sel.affinity : 0,
    collection: sel ? sel.collection : [],
    houseConfig: sel
      ? sel.houseConfig
      : {
          privacy: "public",
          wall: "#fef08a",
          furniture: "Sập Gụ Tủ Chè",
          tree: "Hoa Mai Vàng",
          guestbook: [],
        },
    tutorialCompleted: sel ? sel.tutorialCompleted : false,
    tokenHash: existingRow ? existingRow.token_hash : null,
    recoveryCode: existingRow ? existingRow.recovery_code : null,
    mutedUntil: existingRow ? Number(existingRow.muted_until) || 0 : 0,
    bannedUntil: existingRow ? Number(existingRow.banned_until) || 0 : 0,
  };

  if (patch.money !== undefined) base.money = Math.max(0, Math.floor(patch.money));
  if (patch.inventory !== undefined) base.inventory = patch.inventory;
  if (patch.stalls !== undefined) base.stalls = patch.stalls;
  if (patch.quests !== undefined) base.quests = patch.quests;
  if (patch.customization !== undefined) base.customization = patch.customization;
  if (patch.friends !== undefined) base.friends = patch.friends;
  if (patch.blockedUsers !== undefined) base.blockedUsers = patch.blockedUsers;
  if (patch.affinity !== undefined) base.affinity = Math.max(0, Math.floor(patch.affinity));
  if (patch.collection !== undefined) base.collection = patch.collection;
  if (patch.houseConfig !== undefined) base.houseConfig = patch.houseConfig;
  if (patch.tutorialCompleted !== undefined) base.tutorialCompleted = patch.tutorialCompleted;
  if (patch.tokenHash !== undefined) base.tokenHash = patch.tokenHash;
  if (patch.recoveryCode !== undefined) base.recoveryCode = patch.recoveryCode;
  if (patch.mutedUntil !== undefined) base.mutedUntil = patch.mutedUntil;
  if (patch.bannedUntil !== undefined) base.bannedUntil = patch.bannedUntil;

  const socialTitle = getSocialTitle(base.affinity);
  const now = new Date().toISOString();

  if (sel) {
    db.prepare(
      `UPDATE players
       SET money = ?, inventory = ?, stalls = ?, quests = ?, customization = ?, friends = ?,
           blocked_users = ?, affinity = ?, social_title = ?, collection = ?, house_config = ?,
           tutorial_completed = ?, token_hash = COALESCE(?, token_hash),
           recovery_code = COALESCE(?, recovery_code), muted_until = ?, banned_until = ?, updated_at = ?
       WHERE nickname = ?`
    ).run(
      base.money,
      JSON.stringify(base.inventory),
      JSON.stringify(base.stalls),
      JSON.stringify(base.quests),
      JSON.stringify(base.customization),
      JSON.stringify(base.friends),
      JSON.stringify(base.blockedUsers),
      base.affinity,
      socialTitle,
      JSON.stringify(base.collection),
      JSON.stringify(base.houseConfig),
      base.tutorialCompleted ? 1 : 0,
      base.tokenHash,
      base.recoveryCode,
      base.mutedUntil,
      base.bannedUntil,
      now,
      nickname
    );
  } else {
    db.prepare(
      `INSERT INTO players (
         nickname, money, inventory, stalls, quests, customization, friends,
         blocked_users, affinity, social_title, collection, house_config,
         tutorial_completed, token_hash, recovery_code, muted_until, banned_until, created_at, updated_at
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      nickname,
      base.money,
      JSON.stringify(base.inventory),
      JSON.stringify(base.stalls),
      JSON.stringify(base.quests),
      JSON.stringify(base.customization),
      JSON.stringify(base.friends),
      JSON.stringify(base.blockedUsers),
      base.affinity,
      socialTitle,
      JSON.stringify(base.collection),
      JSON.stringify(base.houseConfig),
      base.tutorialCompleted ? 1 : 0,
      base.tokenHash,
      base.recoveryCode || generateRecoveryCode(),
      base.mutedUntil,
      base.bannedUntil,
      now,
      now
    );
  }

  return {
    ...base,
    socialTitle,
  };
}

function createReport(reporter, target, reason, recentChat = []) {
  const cleanReason = String(reason || "Vi phạm quy tắc ứng xử").slice(0, 200);
  const now = new Date().toISOString();
  const info = db
    .prepare(
      "INSERT INTO reports (reporter, target, reason, recent_chat, created_at) VALUES (?, ?, ?, ?, ?)"
    )
    .run(reporter, target, cleanReason, JSON.stringify(recentChat.slice(-10)), now);
  return { ok: true, reportId: info.lastInsertRowid };
}

function getLeaderboard(limit = 10) {
  try {
    const rows = db
      .prepare("SELECT nickname, money, affinity, social_title FROM players ORDER BY affinity DESC, money DESC LIMIT ?")
      .all(limit);
    return rows.map((r, i) => ({
      rank: i + 1,
      nickname: r.nickname,
      money: r.money,
      affinity: r.affinity || 0,
      socialTitle: r.social_title || getSocialTitle(r.affinity || 0),
    }));
  } catch (_) {
    return [];
  }
}

function progressPlayerQuest(nickname, questId, amount = 1) {
  const player = getPlayer(nickname);
  if (!player) return null;
  const q = player.quests.find((item) => item.id === questId);
  if (!q) return null;

  if (q.progress < q.target) {
    q.progress = Math.min(q.target, q.progress + amount);
    if (q.progress >= q.target) {
      q.completed = true;
    }
    upsertPlayer(nickname, { quests: player.quests });
  }
  return q;
}

function claimPlayerQuest(nickname, questId) {
  const player = getPlayer(nickname);
  if (!player) return { ok: false, error: "player_not_found" };
  const q = player.quests.find((item) => item.id === questId);
  if (!q) return { ok: false, error: "quest_not_found" };
  if (!q.completed) return { ok: false, error: "quest_not_completed" };
  if (q.claimed) return { ok: false, error: "quest_already_claimed" };

  q.claimed = true;
  player.money += q.reward;
  upsertPlayer(nickname, { money: player.money, quests: player.quests });
  return { ok: true, reward: q.reward, money: player.money, quests: player.quests };
}

module.exports = {
  getPlayer,
  upsertPlayer,
  verifyOrBindPlayerIdentity,
  suggestNicknames,
  createReport,
  getLeaderboard,
  progressPlayerQuest,
  claimPlayerQuest,
  getSocialTitle,
  hashToken,
  generatePlayerToken,
  generateRecoveryCode,
  db,
};
