/*
 * Server-side Moderation, Input Sanitization & Rate Limiting
 * Chợ Thị Trấn Việt Nam 3D — Sân Chơi Mở An Toàn
 */

// Danh sách từ ngữ không phù hợp (tiếng Việt không dấu & tiếng Anh cơ bản)
// Được chuẩn hóa về chữ thường không dấu để bắt cả biến thể lách luật
const BAD_WORDS_NORMALIZED = [
  "dm",
  "dmm",
  "dkm",
  "vcl",
  "vl",
  "vkl",
  "cc",
  "cl",
  "ditme",
  "ditconme",
  "du ma",
  "duma",
  "lon",
  "cac",
  "buoi",
  "ngu lol",
  "ngulol",
  "oc cho",
  "occho",
  "chode",
  "fuck",
  "shit",
  "bitch",
  "asshole",
];

// Bảng thay thế ký tự lách luật phổ biến
const LEET_MAP = {
  "0": "o",
  "1": "i",
  "3": "e",
  "4": "a",
  "5": "s",
  "7": "t",
  "@": "a",
  $: "s",
  đ: "d",
  Đ: "d",
};

function stripVietnameseAccents(str) {
  if (!str) return "";
  let out = String(str)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  out = out
    .split("")
    .map((ch) => LEET_MAP[ch] || ch)
    .join("")
    .toLowerCase();
  return out;
}

function filterProfanity(text) {
  if (!text || typeof text !== "string") return "";
  let result = text;

  // Kiểm tra theo từng từ hoặc cụm từ đã chuẩn hóa
  const tokens = result.split(/(\s+)/);
  const cleanedTokens = tokens.map((tok) => {
    if (/^\s+$/.test(tok)) return tok;
    const norm = stripVietnameseAccents(tok).replace(/[^a-z0-9]/g, "");
    if (!norm) return tok;
    for (const bad of BAD_WORDS_NORMALIZED) {
      const badCompact = bad.replace(/\s+/g, "");
      if (norm === badCompact || (badCompact.length >= 4 && norm.includes(badCompact))) {
        return "***";
      }
    }
    return tok;
  });

  result = cleanedTokens.join("");

  // Kiểm tra trường hợp cố tình chèn khoảng trắng giữa các chữ cái (vd: "d m m", "v c l", "o c c h o")
  const collapsed = stripVietnameseAccents(result).replace(/[^a-z0-9]/g, "");
  for (const bad of ["ditme", "ditconme", "occho", "ngulol", "fuck", "bitch"]) {
    if (collapsed.includes(bad)) {
      return "***";
    }
  }

  return result;
}

function cleanControlAndUnicode(raw, maxLen = 150) {
  if (raw === null || raw === undefined) return "";
  return String(raw)
    .normalize("NFC")
    .replace(/[\x00-\x1F\x7F]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLen);
}

function sanitizeText(raw, maxLen = 150) {
  const clean = cleanControlAndUnicode(raw, maxLen);
  if (!clean) return "";
  return filterProfanity(clean);
}

function sanitizeNickname(raw, maxLen = 16) {
  const clean = cleanControlAndUnicode(raw, maxLen).replace(/[<>"'`&]/g, "");
  if (!clean) return "";
  const filtered = filterProfanity(clean);
  if (filtered.includes("***")) {
    return "";
  }
  return filtered;
}

/**
 * Bộ giới hạn tần suất (Rate Limiter) cho từng kết nối Socket
 */
function createSocketRateLimiter(maxMovePerSec = 30) {
  const state = {
    chatTimestamps: [],
    lastTownChat: 0,
    emoteTimestamps: [],
    moveTimestamps: [],
    actionTimestamps: [],
  };

  return {
    checkChat(channel = "town") {
      const now = Date.now();
      state.chatTimestamps = state.chatTimestamps.filter((t) => now - t < 10000);
      // Tối đa 1 tin / giây và 8 tin / 10 giây
      const lastMsg = state.chatTimestamps[state.chatTimestamps.length - 1] || 0;
      if (now - lastMsg < 950 || state.chatTimestamps.length >= 8) {
        return { allowed: false, reason: "Chậm lại chút nhé bà con! (Tối đa 1 tin/giây)" };
      }
      // Kênh Toàn Thị Trấn giới hạn chặt hơn kênh Quanh Đây
      if (channel === "town" && now - state.lastTownChat < 1500) {
        return { allowed: false, reason: "Loa Toàn Thị Trấn đang bận, chờ 1.5 giây nhé bà con!" };
      }
      state.chatTimestamps.push(now);
      if (channel === "town") state.lastTownChat = now;
      return { allowed: true };
    },

    checkEmote() {
      const now = Date.now();
      state.emoteTimestamps = state.emoteTimestamps.filter((t) => now - t < 1000);
      if (state.emoteTimestamps.length >= 2) {
        return { allowed: false, reason: "Thả biểu cảm chậm lại chút nhé bà con!" };
      }
      state.emoteTimestamps.push(now);
      return { allowed: true };
    },

    checkMove() {
      const now = Date.now();
      state.moveTimestamps = state.moveTimestamps.filter((t) => now - t < 1000);
      if (state.moveTimestamps.length >= maxMovePerSec) {
        return { allowed: false };
      }
      state.moveTimestamps.push(now);
      return { allowed: true };
    },

    checkAction() {
      const now = Date.now();
      state.actionTimestamps = state.actionTimestamps.filter((t) => now - t < 1000);
      if (state.actionTimestamps.length >= 6) {
        return { allowed: false, reason: "Thao tác chậm lại chút nhé bà con!" };
      }
      state.actionTimestamps.push(now);
      return { allowed: true };
    },
  };
}

module.exports = {
  stripVietnameseAccents,
  filterProfanity,
  cleanControlAndUnicode,
  sanitizeText,
  sanitizeNickname,
  createSocketRateLimiter,
};
