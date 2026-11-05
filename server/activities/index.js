/*
 * Unified Cooperative & Social Activity Framework (Phase 3.3, Phase 8.3, Phase 9, Phase 11)
 * Supports:
 * - Giờ Vàng Toàn Phòng (Golden Hour every 30m or on-demand)
 * - Sân Khấu Mở & Karaoke Loa Kẹo Kéo (Open Stage with queue & audience cheering)
 * - Kéo Co Sân Làng (Tug of War with NPC auto-fill & spectator cheering)
 * - Vườn Cộng Đồng & Bếp Bánh Chưng Hợp Tác (Community Garden & Bánh Chưng Co-op)
 * - Cây Ước Nguyện & Đèn Hoa Đăng (Wishing Tree & Floating Lanterns with 24-48h expiry)
 * - Cột Mốc Cộng Đồng & Bảng Vàng Thị Trấn (Community Milestones & Honor Board)
 * - Xe Buýt Xanh Chạy Vòng Thị Trấn (Circular Green Bus)
 */

const { BUS_STOPS } = require("../../shared/world-layout");
const { sanitizeText } = require("../moderation");

const roomActivities = new Map();

function ensureRoomActivities(roomId = "public-1") {
  if (!roomActivities.has(roomId)) {
    roomActivities.set(roomId, {
      // 1. Giờ Vàng Toàn Phòng (Phase 3.3)
      goldenHour: {
        active: true,
        eventType: "lotto_dance_party",
        title: {
          vi: "🌟 GIỜ VÀNG QUẢNG TRƯỜNG: Hội Đá Cầu & Múa Quạt",
          en: "🌟 GOLDEN HOUR PLAZA: Shuttlecock & Fan Dance Party",
        },
        zoneId: "central_market",
        x: 0,
        z: 0,
        nextChangeInMs: 180000, // Đổi chủ đề Giờ Vàng mỗi 3 phút trong game (tương đương 30p chu kỳ)
        participants: [],
      },
      // 2. Sân Khấu Mở Phố Ẩm Thực Đêm (Phase 9.1)
      openStage: {
        performer: null,
        songOrAct: "",
        lyricBanner: "",
        hypeLevel: 0,
        timerMs: 0,
        queue: [],
        spectators: [],
      },
      // 3. Kéo Co Sân Làng (Phase 9.2)
      tugOfWar: {
        state: "idle", // "idle" | "active"
        teamRed: [],
        teamBlue: [],
        ropeOffset: 0, // -10 (Đỏ thắng) .. +10 (Xanh thắng)
        timerMs: 0,
      },
      // 4. Vườn Cộng Đồng & Bếp Bánh Chưng Hợp Tác (Phase 9.3)
      craftCoop: {
        gardenWaterCount: 4,
        gardenBloomLevel: 1, // 1..3
        banhChungProgress: 2, // Đủ 5 công đoạn sẽ nấu chín mẻ bánh chưng
        banhChungBatchCount: 1,
        contributors: {},
      },
      // 5. Cây Ước Nguyện & Đèn Hoa Đăng (Phase 11.2)
      wishes: [
        {
          id: "wish-1",
          author: "Cô Ba Sài Gòn",
          text: "Chúc bà con phố chợ luôn bình an, vui vẻ!",
          type: "lantern",
          createdAt: Date.now() - 600000,
          expiresAt: Date.now() + 86400000,
        },
        {
          id: "wish-2",
          author: "Chú Tư Nón Lá",
          text: "Mong kết thêm thật nhiều bạn mới ở thị trấn!",
          type: "tree",
          createdAt: Date.now() - 300000,
          expiresAt: Date.now() + 86400000,
        },
      ],
      // 6. Cột Mốc Cộng Đồng & Bảng Vàng Thị Trấn (Phase 11.1)
      communityMilestone: {
        score: 25,
        target: 100,
        level: 1,
        unlockedDecorations: ["extra_lanterns"],
        contributorScores: {
          "Bác Ba Phi": 15,
          "Cô Ba Sài Gòn": 10,
        },
      },
      // 7. Xe Buýt Xanh Chạy Vòng Thị Trấn (Phase 8.4)
      greenBus: {
        stopIndex: 0,
        nextStopIndex: 1,
        progress: 0,
        x: BUS_STOPS[0].x,
        z: BUS_STOPS[0].z,
        dwellTimerMs: 3000,
        passengers: [],
      },
    });
  }
  return roomActivities.get(roomId);
}

const GOLDEN_HOUR_TOPICS = [
  {
    eventType: "lotto_dance_party",
    zoneId: "central_market",
    x: 0,
    z: 0,
    title: {
      vi: "🌟 GIỜ VÀNG QUẢNG TRƯỜNG: Hội Đá Cầu & Múa Quạt",
      en: "🌟 GOLDEN HOUR PLAZA: Shuttlecock & Fan Dance Party",
    },
  },
  {
    eventType: "lotus_lantern_release",
    zoneId: "lotus_park_village",
    x: -38,
    z: 0,
    title: {
      vi: "🪷 GIỜ VÀNG HỒ SEN: Đêm Thả Đèn Hoa Đăng & Kéo Co",
      en: "🪷 GOLDEN HOUR LOTUS PARK: Floating Lanterns & Tug of War",
    },
  },
  {
    eventType: "night_stage_karaoke",
    zoneId: "night_food_stage",
    x: 0,
    z: -44,
    title: {
      vi: "🎤 GIỜ VÀNG PHỐ ĐÊM: Đại Nhạc Hội Loa Kẹo Kéo",
      en: "🎤 GOLDEN HOUR NIGHT STREET: Open Stage & Karaoke",
    },
  },
  {
    eventType: "banh_chung_festival",
    zoneId: "craft_village_garden",
    x: 38,
    z: 0,
    title: {
      vi: "🌱 GIỜ VÀNG LÀNG NGHỀ: Nấu Bánh Chưng & Tưới Hoa",
      en: "🌱 GOLDEN HOUR CRAFT VILLAGE: Bánh Chưng & Garden Care",
    },
  },
];

function addMilestoneContribution(state, nickname, pts = 5) {
  const cm = state.communityMilestone;
  cm.score += pts;
  cm.contributorScores[nickname] = (cm.contributorScores[nickname] || 0) + pts;
  if (cm.score >= cm.target) {
    cm.level += 1;
    cm.score = cm.score - cm.target;
    cm.target = Math.min(300, cm.target + 50);
    if (!cm.unlockedDecorations.includes("stage_fireworks")) {
      cm.unlockedDecorations.push("stage_fireworks");
    } else if (!cm.unlockedDecorations.includes("lotus_bloom_max")) {
      cm.unlockedDecorations.push("lotus_bloom_max");
    }
    return true;
  }
  return false;
}

function tickActivities(roomId = "public-1", dtMs = 50, onRoomEvent) {
  const state = ensureRoomActivities(roomId);

  // 1. Cập nhật Giờ Vàng
  state.goldenHour.nextChangeInMs -= dtMs;
  if (state.goldenHour.nextChangeInMs <= 0) {
    state.goldenHour.nextChangeInMs = 180000;
    const idx = Math.floor(Math.random() * GOLDEN_HOUR_TOPICS.length);
    const topic = GOLDEN_HOUR_TOPICS[idx];
    state.goldenHour.eventType = topic.eventType;
    state.goldenHour.zoneId = topic.zoneId;
    state.goldenHour.x = topic.x;
    state.goldenHour.z = topic.z;
    state.goldenHour.title = topic.title;
    state.goldenHour.participants = [];
    if (onRoomEvent) {
      onRoomEvent({
        type: "golden_hour_started",
        goldenHour: state.goldenHour,
        message: `${topic.title.vi} đã bắt đầu! Bấm [Tham Gia Giờ Vàng] để nhận quà miễn phí!`,
      });
    }
  }

  // 2. Cập nhật Sân Khấu Mở
  if (state.openStage.performer) {
    state.openStage.timerMs -= dtMs;
    if (state.openStage.timerMs <= 0) {
      const finishedPerformer = state.openStage.performer;
      if (state.openStage.queue.length > 0) {
        const next = state.openStage.queue.shift();
        state.openStage.performer = next.nickname;
        state.openStage.songOrAct = next.songOrAct;
        state.openStage.lyricBanner = next.lyricBanner;
        state.openStage.hypeLevel = 1;
        state.openStage.timerMs = 45000;
      } else {
        state.openStage.performer = null;
        state.openStage.songOrAct = "";
        state.openStage.lyricBanner = "";
        state.openStage.hypeLevel = 0;
      }
      if (onRoomEvent) {
        onRoomEvent({
          type: "stage_updated",
          openStage: state.openStage,
          finishedPerformer,
        });
      }
    }
  }

  // 3. Cập nhật Kéo Co
  if (state.tugOfWar.state === "active") {
    state.tugOfWar.timerMs -= dtMs;
    if (Math.abs(state.tugOfWar.ropeOffset) >= 10 || state.tugOfWar.timerMs <= 0) {
      const winnerTeam =
        state.tugOfWar.ropeOffset <= 0 ? "Đội Đỏ Làng Sen" : "Đội Xanh Bến Nước";
      const participants = [...state.tugOfWar.teamRed, ...state.tugOfWar.teamBlue];
      state.tugOfWar.state = "idle";
      state.tugOfWar.ropeOffset = 0;
      state.tugOfWar.teamRed = [];
      state.tugOfWar.teamBlue = [];
      if (onRoomEvent) {
        onRoomEvent({
          type: "tug_of_war_ended",
          winnerTeam,
          participants,
          message: `🪢 [Sân Làng] Trận Kéo Co kết thúc rộn ràng! Chiến thắng thuộc về ${winnerTeam}!`,
        });
      }
    }
  }

  // 4. Cập nhật Xe Buýt Xanh Chạy Vòng
  const bus = state.greenBus;
  if (bus.dwellTimerMs > 0) {
    bus.dwellTimerMs -= dtMs;
  } else {
    bus.progress += dtMs / 9000; // 9 giây di chuyển giữa 2 trạm
    const fromStop = BUS_STOPS[bus.stopIndex];
    const toStop = BUS_STOPS[bus.nextStopIndex];
    const t = Math.min(1, bus.progress);
    bus.x = Number((fromStop.x + (toStop.x - fromStop.x) * t).toFixed(2));
    bus.z = Number((fromStop.z + (toStop.z - fromStop.z) * t).toFixed(2));
    if (bus.progress >= 1) {
      bus.progress = 0;
      bus.stopIndex = bus.nextStopIndex;
      bus.nextStopIndex = (bus.stopIndex + 1) % BUS_STOPS.length;
      bus.dwellTimerMs = 3500; // Dừng đón khách 3.5 giây tại trạm
    }
  }

  // 5. Dọn điều ước hết hạn (24–48h)
  const now = Date.now();
  if (state.wishes.length > 0 && now % 10000 < dtMs) {
    state.wishes = state.wishes.filter((w) => w.expiresAt > now);
  }
}

function getActivitiesSnapshot(roomId = "public-1") {
  const state = ensureRoomActivities(roomId);
  const honorBoard = Object.entries(state.communityMilestone.contributorScores)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([nickname, score], idx) => ({ rank: idx + 1, nickname, score }));

  return {
    goldenHour: {
      ...state.goldenHour,
      secondsLeft: Math.max(0, Math.ceil(state.goldenHour.nextChangeInMs / 1000)),
    },
    openStage: state.openStage,
    tugOfWar: state.tugOfWar,
    craftCoop: state.craftCoop,
    wishes: state.wishes.slice(0, 20),
    communityMilestone: {
      score: state.communityMilestone.score,
      target: state.communityMilestone.target,
      level: state.communityMilestone.level,
      unlockedDecorations: state.communityMilestone.unlockedDecorations,
      honorBoard,
    },
    greenBus: {
      x: state.greenBus.x,
      z: state.greenBus.z,
      stopIndex: state.greenBus.stopIndex,
      nextStopIndex: state.greenBus.nextStopIndex,
      dwell: busDwellStatus(state.greenBus),
      passengers: state.greenBus.passengers,
    },
  };
}

function busDwellStatus(bus) {
  return bus.dwellTimerMs > 0;
}

function joinGoldenHour(roomId = "public-1", nickname) {
  const state = ensureRoomActivities(roomId);
  const already = state.goldenHour.participants.includes(nickname);
  if (!already) {
    state.goldenHour.participants.push(nickname);
    addMilestoneContribution(state, nickname, 8);
  }
  return {
    ok: true,
    already,
    goldenHour: state.goldenHour,
    rewardMoney: already ? 100 : 500,
    affinityEarned: already ? 2 : 8,
  };
}

function performOnStage(roomId = "public-1", nickname, songOrAct = "Múa Quạt Đêm Hội", lyricBanner = "Quẩy lên bà con ơi! 🎶") {
  const state = ensureRoomActivities(roomId);
  const cleanAct = sanitizeText(songOrAct, 40) || "Múa Quạt Đêm Hội";
  const cleanLyric = sanitizeText(lyricBanner, 60) || "Chúc bà con một đêm vui vẻ! 🎤";

  if (!state.openStage.performer || state.openStage.performer === nickname) {
    state.openStage.performer = nickname;
    state.openStage.songOrAct = cleanAct;
    state.openStage.lyricBanner = cleanLyric;
    state.openStage.hypeLevel = Math.max(1, state.openStage.hypeLevel + 1);
    state.openStage.timerMs = 45000;
    addMilestoneContribution(state, nickname, 6);
    return { ok: true, onStageNow: true, openStage: state.openStage };
  }

  if (state.openStage.queue.length >= 8) {
    return { ok: false, error: "Hàng đợi sân khấu đã kín, hãy cổ vũ trước nhé!" };
  }
  if (!state.openStage.queue.some((q) => q.nickname === nickname)) {
    state.openStage.queue.push({ nickname, songOrAct: cleanAct, lyricBanner: cleanLyric });
  }
  return {
    ok: true,
    onStageNow: false,
    queuePos: state.openStage.queue.findIndex((q) => q.nickname === nickname) + 1,
    openStage: state.openStage,
  };
}

function cheerStage(roomId = "public-1", nickname) {
  const state = ensureRoomActivities(roomId);
  state.openStage.hypeLevel += 1;
  if (!state.openStage.spectators.includes(nickname)) {
    state.openStage.spectators.push(nickname);
  }
  const leveledUp = addMilestoneContribution(state, nickname, 4);
  return {
    ok: true,
    hypeLevel: state.openStage.hypeLevel,
    performer: state.openStage.performer,
    leveledUp,
    openStage: state.openStage,
  };
}

function pullTugOfWar(roomId = "public-1", nickname, preferredTeam = null) {
  const state = ensureRoomActivities(roomId);
  const tow = state.tugOfWar;
  if (tow.state !== "active") {
    tow.state = "active";
    tow.timerMs = 25000;
    tow.ropeOffset = 0;
  }

  let team = preferredTeam;
  if (tow.teamRed.includes(nickname)) team = "red";
  else if (tow.teamBlue.includes(nickname)) team = "blue";
  else {
    team = tow.teamRed.length <= tow.teamBlue.length ? "red" : "blue";
    if (team === "red") tow.teamRed.push(nickname);
    else tow.teamBlue.push(nickname);
  }

  const delta = team === "red" ? -2.5 : 2.5;
  tow.ropeOffset = Math.max(-10, Math.min(10, tow.ropeOffset + delta));
  addMilestoneContribution(state, nickname, 5);

  return {
    ok: true,
    team,
    tugOfWar: tow,
  };
}

function contributeCraftCoop(roomId = "public-1", nickname, action = "water_garden") {
  const state = ensureRoomActivities(roomId);
  const coop = state.craftCoop;
  coop.contributors[nickname] = (coop.contributors[nickname] || 0) + 1;

  let message = "";
  let bonusMoney = 250;
  if (action === "cook_banh_chung") {
    coop.banhChungProgress += 1;
    if (coop.banhChungProgress >= 5) {
      coop.banhChungProgress = 0;
      coop.banhChungBatchCount += 1;
      bonusMoney = 600;
      message = `🫔 [Làng Nghề] ${nickname} vừa canh lửa hoàn tất mẻ Bánh Chưng Xanh thứ #${coop.banhChungBatchCount}! Cả làng cùng hưởng lộc!`;
    } else {
      message = `🔥 [Làng Nghề] ${nickname} vừa góp củi & lá dong gói Bánh Chưng (${coop.banhChungProgress}/5 công đoạn)!`;
    }
  } else {
    coop.gardenWaterCount += 1;
    coop.gardenBloomLevel = Math.min(3, 1 + Math.floor(coop.gardenWaterCount / 5));
    message = `🌱 [Vườn Cộng Đồng] ${nickname} vừa tưới nước chăm hoa cho vườn làng (Cấp hoa nở: ${coop.gardenBloomLevel}/3)!`;
  }

  const leveledUp = addMilestoneContribution(state, nickname, 6);
  return {
    ok: true,
    action,
    bonusMoney,
    leveledUp,
    craftCoop: coop,
    message,
  };
}

function createWish(roomId = "public-1", nickname, rawText, wishType = "lantern") {
  const state = ensureRoomActivities(roomId);
  const clean = sanitizeText(rawText, 40);
  if (!clean) {
    return { ok: false, error: "Vui lòng viết điều ước ngắn gọn, lịch sự (tối đa 40 ký tự)!" };
  }

  const wish = {
    id: `wish-${Date.now()}-${Math.floor(Math.random() * 999)}`,
    author: nickname,
    text: clean,
    type: wishType === "tree" ? "tree" : "lantern",
    createdAt: Date.now(),
    expiresAt: Date.now() + 36 * 3600 * 1000, // Tự hết hạn sau 36 giờ
  };

  state.wishes.unshift(wish);
  if (state.wishes.length > 30) state.wishes.pop();
  addMilestoneContribution(state, nickname, 5);

  return {
    ok: true,
    wish,
    wishes: state.wishes.slice(0, 20),
  };
}

function toggleRideGreenBus(roomId = "public-1", nickname) {
  const state = ensureRoomActivities(roomId);
  const bus = state.greenBus;
  const idx = bus.passengers.indexOf(nickname);
  if (idx >= 0) {
    bus.passengers.splice(idx, 1);
    return { ok: true, riding: false, bus };
  }
  bus.passengers.push(nickname);
  addMilestoneContribution(state, nickname, 3);
  return { ok: true, riding: true, bus };
}

module.exports = {
  ensureRoomActivities,
  tickActivities,
  getActivitiesSnapshot,
  joinGoldenHour,
  performOnStage,
  cheerStage,
  pullTugOfWar,
  contributeCraftCoop,
  createWish,
  toggleRideGreenBus,
};
