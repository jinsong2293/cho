/*
 * Main server entry: Express + Socket.IO + static client.
 * Chợ Thị Trấn Việt Nam 3D — Sân Chơi Mở & Thị Trấn Sống
 */

require("dotenv").config();

const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const path = require("path");

const config = require(path.join(__dirname, "config"));
const world = require(path.join(__dirname, "world"));
const persistence = require(path.join(__dirname, "persistence"));
const moderation = require(path.join(__dirname, "moderation"));
const constants = require(path.join(__dirname, "..", "shared", "constants"));
const { getActiveFestival } = require(path.join(__dirname, "..", "shared", "festivals"));

const app = express();

// Bảo mật HTTP Headers (tương đương Helmet nhẹ, không phụ thuộc gói ngoài)
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob: https: ws: wss:; img-src 'self' data: blob: https:; media-src 'self' data: blob:;"
  );
  next();
});

app.use(cors(config.cors));
app.use(express.json({ limit: "32kb" }));

// Whitelist tuyệt đối cho /libs — ngăn chặn tải world.db, package.json, server/*.js (Phase 1.1)
const ALLOWED_LIBS = {
  "/three.min.js": path.join(__dirname, "..", "client", "libs", "three.min.js"),
  "/OrbitControls.js": path.join(__dirname, "..", "client", "libs", "OrbitControls.js"),
};
app.use("/libs", (req, res) => {
  const target = ALLOWED_LIBS[req.path];
  if (!target) {
    return res.status(404).json({ error: "Not Found" });
  }
  return res.sendFile(target);
});

app.use("/shared", express.static(path.join(__dirname, "..", "shared")));
app.use(express.static(path.join(__dirname, "..", "client"), { index: "index.html" }));

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: config.cors.origin,
    methods: ["GET", "POST"],
  },
  pingTimeout: 30000,
  pingInterval: 10000,
});

app.get("/health", (req, res) => {
  res.json({
    ok: true,
    status: "ok",
    onlinePlayers: Object.keys(world.players).length,
    rooms: world.rooms.size,
    stalls: Object.keys(world.stalls).length,
    marketEvent: world.currentMarketEvent,
    festival: getActiveFestival(req.query.festival),
  });
});

app.get("/api/online", (req, res) => {
  res.json({
    onlinePlayers: Object.keys(world.players).length,
    rooms: world.rooms.size,
    festival: getActiveFestival(req.query.festival),
  });
});

/**
 * Gửi sự kiện tới các người chơi trong cùng phòng, tôn trọng danh sách Chặn (blockedUsers)
 */
function emitToRoomFiltered(roomId, eventName, payload, senderNickname = null, maxDistance = null, senderPos = null) {
  const roomPlayers = world.getPlayersInRoom(roomId);
  roomPlayers.forEach((recipient) => {
    if (senderNickname && Array.isArray(recipient.blockedUsers) && recipient.blockedUsers.includes(senderNickname)) {
      return;
    }
    if (maxDistance !== null && senderPos && recipient.pos) {
      const d = Math.hypot((recipient.pos.x || 0) - (senderPos.x || 0), (recipient.pos.z || 0) - (senderPos.z || 0));
      if (d > maxDistance) return;
    }
    const sock = io.sockets.sockets.get(recipient.socketId);
    if (sock) {
      sock.emit(eventName, payload);
    }
  });
}

io.on("connection", (socket) => {
  let userNickname = null;
  const limiter = moderation.createSocketRateLimiter(config.maxMoveEventsPerSecond);

  socket.on("join", (payload, ack) => {
    try {
      let rawNick = "";
      let clientToken = null;
      let recoveryCode = null;
      let roomCode = null;
      let customization = null;
      let festivalOverride = null;

      if (typeof payload === "string") {
        rawNick = payload;
      } else if (payload && typeof payload === "object") {
        rawNick = payload.nickname || "";
        clientToken = payload.playerToken || null;
        recoveryCode = payload.recoveryCode || null;
        roomCode = payload.roomCode || null;
        customization = payload.customization || null;
        festivalOverride = payload.festival || null;
      }

      const nickname = moderation.sanitizeNickname(rawNick, constants.MAX_NICKNAME_LENGTH);
      if (!nickname || nickname.length < constants.MIN_NICKNAME_LENGTH) {
        return (
          ack &&
          ack({
            ok: false,
            code: "INVALID_NICKNAME",
            error: `Tên từ ${constants.MIN_NICKNAME_LENGTH}-${constants.MAX_NICKNAME_LENGTH} ký tự và không chứa từ ngữ vi phạm!`,
          })
        );
      }

      // Kiểm tra danh tính không cần mật khẩu (playerToken / recoveryCode) (Phase 1.2)
      const idRes = persistence.verifyOrBindPlayerIdentity(nickname, clientToken, recoveryCode);
      if (!idRes.ok) {
        return (
          ack &&
          ack({
            ok: false,
            code: idRes.code,
            error: idRes.error,
            suggestions: idRes.suggestions || [],
          })
        );
      }

      // Nếu đang có tab/thiết bị cũ cùng tài khoản online -> thông báo và ngắt tab cũ
      const existingOnline = world.players[nickname];
      if (existingOnline && existingOnline.socketId && existingOnline.socketId !== socket.id) {
        const oldSock = io.sockets.sockets.get(existingOnline.socketId);
        if (oldSock) {
          oldSock.emit("session_replaced", {
            message: "Bạn đã vào chợ từ một tab hoặc thiết bị khác!",
          });
          oldSock.leave(existingOnline.roomId || "public-1");
          oldSock.nickname = null;
          oldSock.disconnect(true);
        }
        world.leaveWorld(nickname);
      }

      userNickname = nickname;
      socket.nickname = nickname;

      const player = world.joinWorld(nickname, socket.id, {
        roomCode,
        customization,
      });
      const roomId = player.roomId || "public-1";

      socket.join("world");
      socket.join(roomId);

      const snapshot = world.getSnapshot(roomId, festivalOverride);

      if (ack) {
        ack({
          ok: true,
          playerToken: idRes.playerToken,
          recoveryCode: idRes.recoveryCode,
          roomId,
          player: {
            nickname: player.nickname,
            money: player.money,
            inventory: player.inventory,
            stalls: player.stalls,
            quests: player.quests,
            hoverboard: player.hoverboard,
            customization: player.customization,
            friends: world.getFriendsStatus(player.nickname),
            blockedUsers: player.blockedUsers || [],
            affinity: player.affinity || 0,
            socialTitle: player.socialTitle || "🌱 Bà Con Mới",
            collection: player.collection || [],
            houseConfig: player.houseConfig,
            recoveryCode: idRes.recoveryCode,
            isNewbie: player.isNewbie,
          },
          constants: {
            GOODS: constants.GOODS,
            MARKET_EVENTS: constants.MARKET_EVENTS,
            STALL_COST: constants.STALL_COST,
            STALL_UPGRADE_COSTS: constants.STALL_UPGRADE_COSTS,
            HIRE_STAFF_COST: constants.HIRE_STAFF_COST,
            GACHA_COST: constants.GACHA_COST,
            HOUSING_CONFIG: constants.HOUSING_CONFIG,
            LOTTERY_CONFIG: constants.LOTTERY_CONFIG,
            BANK_CONFIG: constants.BANK_CONFIG,
            GARAGE_CONFIG: constants.GARAGE_CONFIG,
          },
          snapshot,
        });
      }

      socket.broadcast.to(roomId).emit("player_join", {
        nickname: player.nickname,
        roomId,
        pos: player.pos,
        rot: player.rot,
        hoverboard: player.hoverboard,
        customization: player.customization,
        socialTitle: player.socialTitle,
        isNewbie: player.isNewbie,
        money: player.money,
      });

      // Thông báo cho bạn bè đang online biết bạn vừa vào chợ (Phase 3.1)
      if (Array.isArray(player.friends)) {
        player.friends.forEach((fNick) => {
          const fOnline = world.players[fNick];
          if (fOnline) {
            const fSock = io.sockets.sockets.get(fOnline.socketId);
            if (fSock) {
              fSock.emit("friend_online", {
                nickname: player.nickname,
                roomId,
                pos: player.pos,
              });
            }
          }
        });
      }

      // Cô Loa Chào Đón người mới (Icebreaker Phase 3.2)
      if (player.isNewbie) {
        emitToRoomFiltered(roomId, "chat_message", {
          nickname: "Cô Loa Phường",
          msg: `🌸 Có bà con mới ghé chợ: ${player.nickname}! Ai ra vẫy tay chào bạn mới để cả hai cùng nhận +300đ Quà Làm Quen nào!`,
          channel: "town",
          isSystem: true,
          newbieNick: player.nickname,
          time: Date.now(),
        });
      }
    } catch (err) {
      console.error("[join error]", err.message);
      if (ack) ack({ ok: false, error: "Lỗi máy chủ khi gia nhập!" });
    }
  });

  socket.on("move", (data) => {
    if (!userNickname || !world.players[userNickname]) return;
    if (!limiter.checkMove().allowed) return;

    const p = world.updatePlayerMove(userNickname, data);
    if (!p) return;

    const roomId = p.roomId || "public-1";
    // Area of Interest (AOI <= 1600 đơn vị trên bản đồ mở rộng 20x) trong cùng phòng (Phase 12.3)
    emitToRoomFiltered(
      roomId,
      "player_move",
      {
        nickname: userNickname,
        pos: p.pos,
        rot: p.rot,
        zoneId: p.zoneId,
        hoverboard: p.hoverboard,
        passengerOf: p.passengerOf,
      },
      userNickname,
      1600,
      p.pos
    );

    // Đồng bộ vị trí người ngồi yên sau xe máy (Phase 8.4)
    const roomPlayers = world.getPlayersInRoom(roomId);
    roomPlayers.forEach((rp) => {
      if (rp.passengerOf === userNickname) {
        rp.pos.x = Number((p.pos.x - Math.sin(p.rot) * 0.65).toFixed(2));
        rp.pos.z = Number((p.pos.z - Math.cos(p.rot) * 0.65).toFixed(2));
        rp.rot = p.rot;
        emitToRoomFiltered(
          roomId,
          "player_move",
          {
            nickname: rp.nickname,
            pos: rp.pos,
            rot: rp.rot,
            zoneId: p.zoneId,
            hoverboard: false,
            passengerOf: userNickname,
          },
          rp.nickname,
          1600,
          rp.pos
        );
      }
    });
  });

  socket.on("toggleHoverboard", (enabled) => {
    if (!userNickname || !world.players[userNickname]) return;
    const p = world.players[userNickname];
    p.hoverboard = Boolean(enabled);
    if (!p.hoverboard) {
      // Nếu tắt xe máy thì người ngồi sau cũng xuống xe
      world.getPlayersInRoom(p.roomId).forEach((rp) => {
        if (rp.passengerOf === userNickname) rp.passengerOf = null;
      });
    }
    io.to(p.roomId || "public-1").emit("player_hoverboard", {
      nickname: userNickname,
      hoverboard: p.hoverboard,
    });
  });

  socket.on("chat", (payload, ack) => {
    if (!userNickname || !world.players[userNickname]) return;
    const p = world.players[userNickname];

    if (p.mutedUntil && p.mutedUntil > Date.now()) {
      const mins = Math.ceil((p.mutedUntil - Date.now()) / 60000);
      if (ack) ack({ ok: false, error: `Bạn đang bị tạm tắt tiếng (${mins} phút)!` });
      return;
    }

    let rawMsg = "";
    let channel = "town";
    if (typeof payload === "string") {
      rawMsg = payload;
    } else if (payload && typeof payload.msg === "string") {
      rawMsg = payload.msg;
      channel = payload.channel === "nearby" ? "nearby" : "town";
    }

    const rateCheck = limiter.checkChat(channel);
    if (!rateCheck.allowed) {
      socket.emit("rate_limited", { message: rateCheck.reason });
      if (ack) ack({ ok: false, error: rateCheck.reason });
      return;
    }

    const cleanMsg = moderation.sanitizeText(rawMsg, 150);
    if (!cleanMsg) return;

    const roomId = p.roomId || "public-1";
    const msgPacket = {
      nickname: userNickname,
      socialTitle: p.socialTitle,
      msg: cleanMsg,
      channel,
      pos: p.pos,
      time: Date.now(),
    };

    // Tiến độ nhiệm vụ chào hỏi nếu câu chat mang tính chào đón
    if (/chào|hello|hi|xin chào|chao/i.test(cleanMsg)) {
      persistence.progressPlayerQuest(userNickname, "social_greet", 1);
    }

    if (channel === "nearby") {
      // Kênh Quanh Đây: Server chỉ gửi cho người trong bán kính 18m (Phase 1.3)
      emitToRoomFiltered(roomId, "chat_message", msgPacket, userNickname, 18, p.pos);
    } else {
      world.addRoomChatHistory(roomId, msgPacket);
      emitToRoomFiltered(roomId, "chat_message", msgPacket, userNickname, null, null);
    }

    if (ack) ack({ ok: true, msg: cleanMsg });
  });

  socket.on("emote", (emoteType) => {
    if (!userNickname || !world.players[userNickname]) return;
    const rateCheck = limiter.checkEmote();
    if (!rateCheck.allowed) {
      socket.emit("rate_limited", { message: rateCheck.reason });
      return;
    }
    const p = world.players[userNickname];
    const cleanEmote = moderation.cleanControlAndUnicode(emoteType, 24);
    persistence.progressPlayerQuest(userNickname, "social_greet", 1);
    emitToRoomFiltered(
      p.roomId || "public-1",
      "player_emote",
      {
        nickname: userNickname,
        emote: cleanEmote,
      },
      userNickname
    );
  });

  // Chặn / Bỏ chặn người chơi (Phase 1.3)
  socket.on("blockPlayer", ({ targetNick }, ack) => {
    if (!userNickname) return ack && ack({ ok: false, error: "Chưa đăng nhập!" });
    const res = world.toggleBlockUser(userNickname, targetNick);
    if (ack) ack(res);
  });

  // Báo cáo vi phạm ghi vào bảng SQLite reports (Phase 1.3)
  socket.on("reportPlayer", ({ targetNick, reason }, ack) => {
    if (!userNickname || !world.players[userNickname]) {
      return ack && ack({ ok: false, error: "Chưa đăng nhập!" });
    }
    const p = world.players[userNickname];
    const cleanTarget = moderation.sanitizeNickname(targetNick, 16);
    const cleanReason = moderation.cleanControlAndUnicode(reason || "Hành vi không phù hợp", 200);
    if (!cleanTarget) return ack && ack({ ok: false, error: "Tên người bị báo cáo không hợp lệ!" });

    const recentChat = world.getRoomChatHistory(p.roomId || "public-1").slice(-10);
    const rep = persistence.createReport(userNickname, cleanTarget, cleanReason, recentChat);
    if (ack) ack({ ok: true, reportId: rep.reportId });
  });

  // Lệnh quản trị qua ADMIN_KEY: kick, mute, ban (Phase 1.3)
  socket.on("adminCommand", ({ adminKey, action, targetNick, minutes }, ack) => {
    const expectedKey = process.env.ADMIN_KEY;
    if (!expectedKey || adminKey !== expectedKey) {
      return ack && ack({ ok: false, error: "Không có quyền quản trị!" });
    }
    const target = world.players[targetNick];
    const durMs = Math.max(1, Number(minutes) || 15) * 60000;

    if (action === "kick") {
      if (target) {
        const tSock = io.sockets.sockets.get(target.socketId);
        if (tSock) tSock.disconnect(true);
        world.leaveWorld(targetNick);
      }
      console.log(`[admin] Kicked ${targetNick}`);
      return ack && ack({ ok: true, action: "kick", targetNick });
    } else if (action === "mute") {
      const mutedUntil = Date.now() + durMs;
      if (target) target.mutedUntil = mutedUntil;
      persistence.upsertPlayer(targetNick, { mutedUntil });
      console.log(`[admin] Muted ${targetNick} for ${minutes || 15}m`);
      return ack && ack({ ok: true, action: "mute", targetNick, mutedUntil });
    } else if (action === "ban") {
      const bannedUntil = Date.now() + durMs;
      persistence.upsertPlayer(targetNick, { bannedUntil });
      if (target) {
        const tSock = io.sockets.sockets.get(target.socketId);
        if (tSock) tSock.disconnect(true);
        world.leaveWorld(targetNick);
      }
      console.log(`[admin] Banned ${targetNick}`);
      return ack && ack({ ok: true, action: "ban", targetNick, bannedUntil });
    }
    return ack && ack({ ok: false, error: "Lệnh không hợp lệ!" });
  });

  // Tạo hoặc chuyển phòng riêng 4 ký tự (Phase 3.1)
  socket.on("createPrivateRoom", (_, ack) => {
    if (!userNickname || !world.players[userNickname]) {
      return ack && ack({ ok: false, error: "Chưa đăng nhập!" });
    }
    const p = world.players[userNickname];
    const oldRoom = p.roomId || "public-1";
    const newCode = world.createPrivateRoom();

    socket.leave(oldRoom);
    socket.broadcast.to(oldRoom).emit("player_leave", { nickname: userNickname });

    p.roomId = newCode;
    socket.join(newCode);

    if (ack) {
      ack({
        ok: true,
        roomId: newCode,
        snapshot: world.getSnapshot(newCode),
      });
    }
  });

  socket.on("switchRoom", ({ roomCode }, ack) => {
    if (!userNickname || !world.players[userNickname]) {
      return ack && ack({ ok: false, error: "Chưa đăng nhập!" });
    }
    const p = world.players[userNickname];
    const oldRoom = p.roomId || "public-1";
    const targetRoom = world.assignRoom(roomCode);

    socket.leave(oldRoom);
    socket.broadcast.to(oldRoom).emit("player_leave", { nickname: userNickname });

    p.roomId = targetRoom;
    socket.join(targetRoom);
    socket.broadcast.to(targetRoom).emit("player_join", {
      nickname: p.nickname,
      roomId: targetRoom,
      pos: p.pos,
      rot: p.rot,
      hoverboard: p.hoverboard,
      customization: p.customization,
      socialTitle: p.socialTitle,
      money: p.money,
    });

    if (ack) {
      ack({
        ok: true,
        roomId: targetRoom,
        snapshot: world.getSnapshot(targetRoom),
      });
    }
  });

  // Hệ thống Ghế ngồi chung toàn thị trấn (Phase 8.2)
  socket.on("sitSeat", ({ seatId } = {}, ack) => {
    if (!userNickname || !world.players[userNickname]) return ack && ack({ ok: false, error: "Chưa đăng nhập!" });
    const result = world.toggleSitTeaTable(userNickname, seatId);
    if (ack) ack(result);
    if (result.ok) {
      const p = world.players[userNickname];
      if (p) {
        socket.emit("sync_player_stats", {
          money: p.money,
          quests: p.quests,
          affinity: p.affinity,
          socialTitle: p.socialTitle,
        });
        io.to(p.roomId || "public-1").emit("seats_sync", result.seats);
        io.to(p.roomId || "public-1").emit("tea_table_sync", result.table);
      }
    }
  });

  // Các Hoạt Động Hợp Tác & Giao Lưu Không Cần Tiền (Phase 3.3, Phase 8.3, Phase 9, Phase 11)
  socket.on("joinGoldenHour", (_, ack) => {
    if (!userNickname || !world.players[userNickname]) return ack && ack({ ok: false, error: "Chưa đăng nhập!" });
    const p = world.players[userNickname];
    const res = world.activitiesManager.joinGoldenHour(p.roomId, userNickname);
    p.money += res.rewardMoney;
    const aff = world.addAffinity(userNickname, res.affinityEarned, "Tham gia Giờ Vàng");
    persistence.upsertPlayer(userNickname, { money: p.money });
    socket.emit("sync_player_stats", {
      money: p.money,
      affinity: aff ? aff.affinity : p.affinity,
      socialTitle: aff ? aff.socialTitle : p.socialTitle,
    });
    io.to(p.roomId).emit("activities_sync", world.activitiesManager.getActivitiesSnapshot(p.roomId));
    if (ack) ack({ ...res, money: p.money, affinity: p.affinity, socialTitle: p.socialTitle });
  });

  socket.on("performStage", ({ songOrAct, lyricBanner } = {}, ack) => {
    if (!userNickname || !world.players[userNickname]) return ack && ack({ ok: false, error: "Chưa đăng nhập!" });
    const p = world.players[userNickname];
    const res = world.activitiesManager.performOnStage(p.roomId, userNickname, songOrAct, lyricBanner);
    if (res.ok) {
      world.addAffinity(userNickname, 5, "Biểu diễn Sân Khấu Đêm");
      world.unlockCollectionItem(userNickname, "game_stage");
      io.to(p.roomId).emit("activities_sync", world.activitiesManager.getActivitiesSnapshot(p.roomId));
      emitToRoomFiltered(p.roomId, "chat_message", {
        nickname: "Sân Khấu Đêm",
        msg: `🎤 ${userNickname} vừa bước lên Sân Khấu Phố Đêm biểu diễn "${res.openStage.songOrAct}": "${res.openStage.lyricBanner}"! Bà con vỗ tay cổ vũ nào!`,
        isSystem: true,
        time: Date.now(),
      });
    }
    if (ack) ack(res);
  });

  socket.on("cheerStage", (_, ack) => {
    if (!userNickname || !world.players[userNickname]) return ack && ack({ ok: false, error: "Chưa đăng nhập!" });
    const p = world.players[userNickname];
    const res = world.activitiesManager.cheerStage(p.roomId, userNickname);
    p.money += 150;
    const aff = world.addAffinity(userNickname, 3, "Cổ vũ khán giả Sân Khấu");
    persistence.upsertPlayer(userNickname, { money: p.money });
    socket.emit("sync_player_stats", {
      money: p.money,
      affinity: aff ? aff.affinity : p.affinity,
      socialTitle: aff ? aff.socialTitle : p.socialTitle,
    });
    io.to(p.roomId).emit("activities_sync", world.activitiesManager.getActivitiesSnapshot(p.roomId));
    if (ack) ack({ ...res, money: p.money });
  });

  socket.on("pullTugOfWar", ({ preferredTeam } = {}, ack) => {
    if (!userNickname || !world.players[userNickname]) return ack && ack({ ok: false, error: "Chưa đăng nhập!" });
    const p = world.players[userNickname];
    const res = world.activitiesManager.pullTugOfWar(p.roomId, userNickname, preferredTeam);
    p.money += 150;
    world.addAffinity(userNickname, 4, "Hợp sức Kéo Co Sân Làng");
    world.unlockCollectionItem(userNickname, "game_keoco");
    persistence.upsertPlayer(userNickname, { money: p.money });
    socket.emit("sync_player_stats", { money: p.money, affinity: p.affinity, socialTitle: p.socialTitle });
    io.to(p.roomId).emit("activities_sync", world.activitiesManager.getActivitiesSnapshot(p.roomId));
    if (ack) ack({ ...res, money: p.money });
  });

  socket.on("contributeCraftCoop", ({ action } = {}, ack) => {
    if (!userNickname || !world.players[userNickname]) return ack && ack({ ok: false, error: "Chưa đăng nhập!" });
    const p = world.players[userNickname];
    const res = world.activitiesManager.contributeCraftCoop(p.roomId, userNickname, action);
    p.money += res.bonusMoney;
    world.addAffinity(userNickname, 5, "Chăm sóc Vườn & Làng Nghề");
    world.unlockCollectionItem(userNickname, action === "cook_banh_chung" ? "craft_banhchung" : "craft_garden");
    persistence.upsertPlayer(userNickname, { money: p.money });
    socket.emit("sync_player_stats", {
      money: p.money,
      affinity: p.affinity,
      socialTitle: p.socialTitle,
      collection: p.collection,
    });
    io.to(p.roomId).emit("activities_sync", world.activitiesManager.getActivitiesSnapshot(p.roomId));
    emitToRoomFiltered(p.roomId, "chat_message", {
      nickname: "Làng Nghề Đông",
      msg: res.message,
      isSystem: true,
      time: Date.now(),
    });
    if (ack) ack({ ...res, money: p.money });
  });

  socket.on("createWish", ({ text, type } = {}, ack) => {
    if (!userNickname || !world.players[userNickname]) return ack && ack({ ok: false, error: "Chưa đăng nhập!" });
    const p = world.players[userNickname];
    const res = world.activitiesManager.createWish(p.roomId, userNickname, text, type);
    if (!res.ok) return ack && ack(res);

    p.money += 250;
    world.addAffinity(userNickname, 5, "Gửi điều ước hoa đăng");
    world.unlockCollectionItem(userNickname, "wish_lantern");
    persistence.progressPlayerQuest(userNickname, "make_a_wish", 1);
    const updated = persistence.upsertPlayer(userNickname, { money: p.money });
    p.quests = updated.quests;

    socket.emit("sync_player_stats", {
      money: p.money,
      quests: p.quests,
      affinity: p.affinity,
      socialTitle: p.socialTitle,
      collection: p.collection,
    });
    io.to(p.roomId).emit("activities_sync", world.activitiesManager.getActivitiesSnapshot(p.roomId));
    emitToRoomFiltered(p.roomId, "chat_message", {
      nickname: "Hồ Sen & Bến Sông",
      msg: `🪷 ${userNickname} vừa gửi một điều ước lành: "${res.wish.text}"`,
      isSystem: true,
      time: Date.now(),
    });
    if (ack) ack({ ...res, money: p.money });
  });

  socket.on("toggleGreenBus", (_, ack) => {
    if (!userNickname || !world.players[userNickname]) return ack && ack({ ok: false, error: "Chưa đăng nhập!" });
    const p = world.players[userNickname];
    const res = world.activitiesManager.toggleRideGreenBus(p.roomId, userNickname);
    io.to(p.roomId).emit("activities_sync", world.activitiesManager.getActivitiesSnapshot(p.roomId));
    if (ack) ack(res);
  });

  socket.on("updateHouse", (patch, ack) => {
    if (!userNickname) return ack && ack({ ok: false, error: "Chưa đăng nhập!" });
    const res = world.updatePlayerHouse(userNickname, patch || {});
    if (ack) ack(res);
    const p = world.players[userNickname];
    const playerRoomId = (p && p.roomId) || "public-1";
    if (res.ok && playerRoomId) {
      io.to(playerRoomId).emit("house_updated", {
        nickname: userNickname,
        houseConfig: res.houseConfig,
      });
    }
  });

  socket.on("buyOrUpgradeHouse", (_, ack) => {
    if (!userNickname) return ack && ack({ ok: false, error: "Chưa đăng nhập!" });
    const res = world.buyOrUpgradeHouse(userNickname);
    if (ack) ack(res);
    if (res.ok) {
      socket.emit("player_money_sync", { money: res.money });
      const p = world.players[userNickname];
      const playerRoomId = (p && p.roomId) || "public-1";
      if (playerRoomId) {
        io.to(playerRoomId).emit("house_updated", {
          nickname: userNickname,
          houseConfig: res.houseConfig,
        });
      }
    }
  });

  socket.on("buyHouseItem", ({ itemId } = {}, ack) => {
    if (!userNickname) return ack && ack({ ok: false, error: "Chưa đăng nhập!" });
    const res = world.buyHouseItem(userNickname, itemId);
    if (ack) ack(res);
    if (res.ok) {
      socket.emit("player_money_sync", { money: res.money });
      const p = world.players[userNickname];
      const playerRoomId = (p && p.roomId) || "public-1";
      if (playerRoomId) {
        io.to(playerRoomId).emit("house_updated", {
          nickname: userNickname,
          houseConfig: res.houseConfig,
        });
      }
    }
  });

  const handleSignGuestbook = ({ ownerNick, note, message } = {}, ack) => {
    if (!userNickname) return ack && ack({ ok: false, error: "Chưa đăng nhập!" });
    const res = world.signHouseGuestbook(ownerNick || userNickname, userNickname, note || message || "");
    if (ack) ack(res);
  };
  socket.on("signGuestbook", handleSignGuestbook);
  socket.on("signHouseGuestbook", handleSignGuestbook);

  // Dịch vụ Nhà Phố: Ngân Hàng, Vé Số & Tiệm Xe Máy
  socket.on("getBankInfo", (_, ack) => {
    if (!userNickname) return ack && ack({ ok: false, error: "Chưa đăng nhập!" });
    const res = world.getBankInfo(userNickname);
    if (ack) ack(res);
  });

  socket.on("depositBank", ({ amount }, ack) => {
    if (!userNickname) return ack && ack({ ok: false, error: "Chưa đăng nhập!" });
    const res = world.depositBank(userNickname, amount);
    if (ack) ack(res);
    if (res.ok) {
      socket.emit("player_money_sync", { money: res.walletMoney });
    }
  });

  socket.on("withdrawBank", ({ amount }, ack) => {
    if (!userNickname) return ack && ack({ ok: false, error: "Chưa đăng nhập!" });
    const res = world.withdrawBank(userNickname, amount);
    if (ack) ack(res);
    if (res.ok) {
      socket.emit("player_money_sync", { money: res.walletMoney });
    }
  });

  socket.on("buyLotteryTicket", (_, ack) => {
    if (!userNickname) return ack && ack({ ok: false, error: "Chưa đăng nhập!" });
    const res = world.buyLotteryTicket(userNickname);
    if (ack) ack(res);
    if (res.ok) {
      socket.emit("player_money_sync", { money: res.walletMoney });
    }
  });

  socket.on("playScratchCard", (_, ack) => {
    if (!userNickname) return ack && ack({ ok: false, error: "Chưa đăng nhập!" });
    const res = world.playScratchCard(userNickname);
    if (ack) ack(res);
    if (res.ok) {
      socket.emit("player_money_sync", { money: res.walletMoney });
    }
  });

  socket.on("upgradeMotorbike", (options, ack) => {
    if (!userNickname) return ack && ack({ ok: false, error: "Chưa đăng nhập!" });
    const res = world.upgradeMotorbike(userNickname, options || {});
    if (ack) ack(res);
    if (res.ok) {
      socket.emit("player_money_sync", { money: res.walletMoney });
    }
  });

  socket.on("buyEnergyDrink", (_, ack) => {
    if (!userNickname) return ack && ack({ ok: false, error: "Chưa đăng nhập!" });
    const res = world.buyEnergyDrink(userNickname);
    if (ack) ack(res);
    if (res.ok) {
      socket.emit("player_money_sync", { money: res.walletMoney });
    }
  });

  // ---- Giữ nguyên toàn bộ sự kiện Kinh doanh & Mini-game hiện có ----
  socket.on("buyWholesale", ({ goodId, amount }, ack) => {
    if (!userNickname) return ack && ack({ ok: false, error: "Chưa đăng nhập!" });
    const result = world.buyWholesale(userNickname, goodId, amount || 1);
    if (ack) ack(result);
    if (result.ok) {
      const p = world.players[userNickname];
      if (p) {
        socket.emit("sync_player_stats", {
          money: p.money,
          inventory: p.inventory,
          quests: p.quests,
          collection: p.collection,
        });
      }
    }
  });

  socket.on("rentStall", ({ stallId, customName }, ack) => {
    if (!userNickname) return ack && ack({ ok: false, error: "Chưa đăng nhập!" });
    const result = world.rentStall(userNickname, stallId, customName);
    if (ack) ack(result);
    if (result.ok) {
      io.to("world").emit("stall_updated", result.stall);
      io.to("world").emit("chat_message", {
        nickname: "Loa Phường",
        msg: `🏮 ${userNickname} vừa mở sạp khai trương "${result.stall.name}"! Bà con ghé ủng hộ nhé!`,
        isSystem: true,
      });
      const p = world.players[userNickname];
      if (p) socket.emit("sync_player_stats", { money: p.money, stalls: p.stalls, quests: p.quests });
    }
  });

  socket.on("stockGood", ({ stallId, goodId, amount }, ack) => {
    if (!userNickname) return ack && ack({ ok: false, error: "Chưa đăng nhập!" });
    const result = world.stockGood(userNickname, stallId, goodId, amount || 1);
    if (ack) ack(result);
    if (result.ok) {
      io.to("world").emit("stall_updated", result.stall);
      const p = world.players[userNickname];
      if (p) socket.emit("sync_player_stats", { inventory: p.inventory, quests: p.quests });
    }
  });

  socket.on("withdrawGood", ({ stallId, goodId, amount }, ack) => {
    if (!userNickname) return ack && ack({ ok: false, error: "Chưa đăng nhập!" });
    const result = world.withdrawGood(userNickname, stallId, goodId, amount || 1);
    if (ack) ack(result);
    if (result.ok) {
      io.to("world").emit("stall_updated", result.stall);
      const p = world.players[userNickname];
      if (p) socket.emit("sync_player_stats", { inventory: p.inventory });
    }
  });

  socket.on("upgradeStall", ({ stallId }, ack) => {
    if (!userNickname) return ack && ack({ ok: false, error: "Chưa đăng nhập!" });
    const result = world.upgradeStall(userNickname, stallId);
    if (ack) ack(result);
    if (result.ok) {
      io.to("world").emit("stall_updated", result.stall);
      io.to("world").emit("chat_message", {
        nickname: "Loa Phường",
        msg: `⭐ ${userNickname} đã nâng cấp sạp "${result.stall.name}" lên Cấp ${result.level} khang trang!`,
        isSystem: true,
      });
      const p = world.players[userNickname];
      if (p) socket.emit("sync_player_stats", { money: p.money, quests: p.quests });
    }
  });

  socket.on("hireStaff", ({ stallId }, ack) => {
    if (!userNickname) return ack && ack({ ok: false, error: "Chưa đăng nhập!" });
    const result = world.hireStaff(userNickname, stallId);
    if (ack) ack(result);
    if (result.ok) {
      io.to("world").emit("stall_updated", result.stall);
      io.to("world").emit("chat_message", {
        nickname: "Loa Phường",
        msg: `👒 ${userNickname} vừa thuê thêm phụ quán đứng bán cho sạp "${result.stall.name}"!`,
        isSystem: true,
      });
      const p = world.players[userNickname];
      if (p) socket.emit("sync_player_stats", { money: p.money, quests: p.quests });
    }
  });

  socket.on("spinGacha", (_, ack) => {
    if (!userNickname) return ack && ack({ ok: false, error: "Chưa đăng nhập!" });
    const result = world.spinGacha(userNickname);
    if (ack) ack(result);
    if (result.ok) {
      const p = world.players[userNickname];
      if (p) {
        socket.emit("sync_player_stats", {
          money: p.money,
          inventory: p.inventory,
          quests: p.quests,
          collection: p.collection,
        });
      }
      if (result.prizeType === "jackpot" || result.prizeType === "rare_item") {
        io.to("world").emit("chat_message", {
          nickname: "Gánh Lô Tô",
          msg: `🎪 Kinh rồi bà con ơi! ${userNickname} vừa trúng ${result.prizeTitle}`,
          isSystem: true,
        });
      }
    }
  });

  socket.on("claimQuest", ({ questId }, ack) => {
    if (!userNickname) return ack && ack({ ok: false, error: "Chưa đăng nhập!" });
    const result = persistence.claimPlayerQuest(userNickname, questId);
    if (result.ok) {
      const p = world.players[userNickname];
      if (p) {
        p.money = result.money;
        p.quests = result.quests;
        socket.emit("sync_player_stats", { money: p.money, quests: p.quests });
      }
    }
    if (ack) ack(result);
  });

  socket.on("placeBauCuaBet", ({ animalId, amount }, ack) => {
    if (!userNickname) return ack && ack({ ok: false, error: "Chưa đăng nhập!" });
    const result = world.placeBauCuaBet(userNickname, animalId, amount);
    if (ack) ack(result);
    if (result.ok) {
      socket.emit("sync_player_stats", { money: result.money });
    }
  });

  socket.on("toggleSitTeaTable", (_, ack) => {
    if (!userNickname) return ack && ack({ ok: false, error: "Chưa đăng nhập!" });
    const result = world.toggleSitTeaTable(userNickname);
    if (ack) ack(result);
    if (result.ok) {
      const p = world.players[userNickname];
      if (p) {
        socket.emit("sync_player_stats", {
          money: p.money,
          quests: p.quests,
          affinity: p.affinity,
          socialTitle: p.socialTitle,
        });
      }
      io.to("world").emit("tea_table_sync", result.table);
    }
  });

  socket.on("interactPlayer", ({ targetNick, actionType, meta }, ack) => {
    if (!userNickname) return ack && ack({ ok: false, error: "Chưa đăng nhập!" });
    if (!limiter.checkAction().allowed) {
      return ack && ack({ ok: false, error: "Thao tác chậm lại chút nhé bà con!" });
    }
    const result = world.interactPlayer(userNickname, targetNick, actionType, meta);
    if (ack) ack(result);
    if (result.ok) {
      const src = world.players[userNickname];
      if (src) {
        socket.emit("sync_player_stats", {
          money: src.money,
          inventory: src.inventory,
          quests: src.quests,
          affinity: src.affinity,
          socialTitle: src.socialTitle,
        });
      }
      const tgt = world.players[targetNick];
      if (tgt) {
        const tgtSocket = io.sockets.sockets.get(tgt.socketId);
        if (tgtSocket) {
          tgtSocket.emit("sync_player_stats", {
            money: tgt.money,
            inventory: tgt.inventory,
            affinity: tgt.affinity,
            socialTitle: tgt.socialTitle,
          });
        }
      }
    }
  });

  socket.on("goFishing", (_, ack) => {
    if (!userNickname) return ack && ack({ ok: false, error: "Chưa đăng nhập!" });
    const result = world.goFishing(userNickname);
    if (ack) ack(result);
    if (result.ok) {
      const p = world.players[userNickname];
      socket.emit("sync_player_stats", {
        money: result.money,
        collection: p ? p.collection : undefined,
      });
    }
  });

  socket.on("createCommunityEvent", (data, ack) => {
    if (!userNickname) return ack && ack({ ok: false, error: "Chưa đăng nhập!" });
    const result = world.createCommunityEvent(userNickname, data);
    if (ack) ack(result);
    if (result.ok) {
      io.to("world").emit("community_events_updated", result.events);
    }
  });

  socket.on("joinCommunityEvent", ({ eventId }, ack) => {
    if (!userNickname) return ack && ack({ ok: false, error: "Chưa đăng nhập!" });
    const result = world.joinCommunityEvent(userNickname, eventId);
    if (ack) ack(result);
    if (result.ok) {
      io.to("world").emit("community_events_updated", result.events);
    }
  });

  socket.on("updateCustomization", (custom, ack) => {
    if (!userNickname) return ack && ack({ ok: false, error: "Chưa đăng nhập!" });
    const result = world.updateCharacterCustomization(userNickname, custom);
    if (ack) ack(result);
    if (result.ok) {
      const p = world.players[userNickname];
      const roomId = (p && p.roomId) || "public-1";
      io.to(roomId).emit("player_skin_updated", {
        nickname: userNickname,
        customization: result.customization,
      });
    }
  });

  socket.on("addFriend", ({ targetNick }, ack) => {
    if (!userNickname) return ack && ack({ ok: false, error: "Chưa đăng nhập!" });
    const result = world.addFriend(userNickname, targetNick);
    if (ack) ack(result);
    if (result.ok) {
      const src = world.players[userNickname];
      socket.emit("sync_player_stats", {
        money: result.money,
        friends: result.friends,
        affinity: src ? src.affinity : undefined,
        socialTitle: src ? src.socialTitle : undefined,
      });
      const tgt = world.players[targetNick];
      if (tgt) {
        const tgtSocket = io.sockets.sockets.get(tgt.socketId);
        if (tgtSocket) {
          tgtSocket.emit("sync_player_stats", {
            money: tgt.money,
            friends: world.getFriendsStatus(targetNick),
            affinity: tgt.affinity,
            socialTitle: tgt.socialTitle,
          });
        }
      }
    }
  });

  socket.on("getFriends", (_, ack) => {
    if (!userNickname) return ack && ack({ ok: false, error: "Chưa đăng nhập!" });
    if (ack) {
      ack({
        ok: true,
        friends: world.getFriendsStatus(userNickname),
      });
    }
  });

  socket.on("kickShuttlecock", (_, ack) => {
    if (!userNickname) return ack && ack({ ok: false, error: "Chưa đăng nhập!" });
    const result = world.kickShuttlecock(userNickname);
    if (ack) ack(result);
    if (result.ok) {
      const p = world.players[userNickname];
      socket.emit("sync_player_stats", {
        money: result.money,
        quests: result.quests,
        affinity: p ? p.affinity : undefined,
        socialTitle: p ? p.socialTitle : undefined,
        collection: p ? p.collection : undefined,
      });
    }
  });

  socket.on("disconnect", () => {
    if (userNickname && world.players[userNickname] && world.players[userNickname].socketId === socket.id) {
      const rId = world.players[userNickname].roomId || "public-1";
      world.leaveWorld(userNickname);
      socket.broadcast.to(rId).emit("player_leave", { nickname: userNickname });
    }
  });
});

let lastTickTime = Date.now();
let syncTimer = 0;

function tick() {
  const now = Date.now();
  const dt = now - lastTickTime;
  lastTickTime = now;

  world.updateWorld(dt);

  const events = world.popEvents();
  events.forEach((ev) => {
    const targetRoom = ev.roomId || "world";
    io.to(targetRoom).emit("world_event", ev);

    if (ev.type === "customer_buy") {
      const stall = world.stalls[ev.stallId];
      if (stall) {
        io.to("world").emit("stall_updated", world.getStallData(ev.stallId));
      }
      if (ev.owner && world.players[ev.owner]) {
        const ownerPlayer = world.players[ev.owner];
        const ownerSocket = io.sockets.sockets.get(ownerPlayer.socketId);
        if (ownerSocket) {
          ownerSocket.emit("sync_player_stats", {
            money: ownerPlayer.money,
            quests: ownerPlayer.quests,
          });
        }
      }
    } else if (ev.type === "supply_claimed") {
      const claimPlayer = world.players[ev.nickname];
      if (claimPlayer) {
        const claimSocket = io.sockets.sockets.get(claimPlayer.socketId);
        if (claimSocket) {
          claimSocket.emit("sync_player_stats", {
            money: claimPlayer.money,
            inventory: claimPlayer.inventory,
          });
        }
      }
    } else if (ev.type === "bau_cua_result") {
      const animalIcons = { nai: "🦌 Nai", bau: "🎃 Bầu", ga: "🐓 Gà", ca: "🐟 Cá", cua: "🦀 Cua", tom: "🦐 Tôm" };
      const diceStr = ev.dice.map((d) => animalIcons[d] || d).join(" | ");
      const winStr =
        ev.winners && ev.winners.length > 0
          ? "Chúc mừng: " + ev.winners.map((w) => `${w.nickname} (+${w.win.toLocaleString()}đ)`).join(", ")
          : "Vòng này nhà cái ôm trọn làng!";
      io.to("world").emit("chat_message", {
        nickname: "Sới Bầu Cua",
        msg: `🎲 Kết quả: [${diceStr}] — ${winStr}`,
        isSystem: true,
      });

      if (ev.winners) {
        ev.winners.forEach((w) => {
          const wp = world.players[w.nickname];
          if (wp) {
            const wSocket = io.sockets.sockets.get(wp.socketId);
            if (wSocket) wSocket.emit("sync_player_stats", { money: wp.money });
          }
        });
      }
    } else if (
      ev.type === "player_social" ||
      ev.type === "tea_table_cheer" ||
      ev.type === "player_caught_fish" ||
      ev.type === "community_event_created" ||
      ev.type === "community_event_joined" ||
      ev.type === "friend_added" ||
      ev.type === "shuttlecock_kicked" ||
      ev.type === "hotspot_changed" ||
      ev.type === "golden_hour_started" ||
      ev.type === "tug_of_war_ended"
    ) {
      if (ev.message) {
        io.to(targetRoom).emit("chat_message", {
          nickname: "Loa Phường",
          msg: ev.message,
          isSystem: true,
          time: now,
        });
      }
    }
  });

  syncTimer += dt;
  if (syncTimer >= 350) {
    syncTimer = 0;
    for (const rId of world.rooms.keys()) {
      const snap = world.getSnapshot(rId);
      io.to(rId).emit("world_sync", {
        roomId: rId,
        customers: snap.customers,
        supplyDrop: snap.supplyDrop,
        marketEvent: snap.marketEvent,
        weather: snap.weather,
        hotspot: snap.hotspot,
        zonePopulation: snap.zonePopulation,
        seats: snap.seats,
        activities: snap.activities,
        bauCua: snap.bauCua,
        teaTable: snap.teaTable,
        shuttlecock: snap.shuttlecock,
        communityEvents: snap.communityEvents,
        day: snap.day,
        timeOfDay: snap.timeOfDay,
        leaderboard: snap.leaderboard,
      });
    }
  }
}

function startListening(port) {
  server.once("error", (err) => {
    if (err.code === "EADDRINUSE") {
      console.warn(`[server] Cổng ${port} đang bận, thử cổng tiếp theo ${port + 1}...`);
      setTimeout(() => startListening(port + 1), 50);
    } else {
      console.error("[server fatal error]", err);
    }
  });

  server.listen(port, "0.0.0.0");
}

server.once("listening", () => {
  const addr = server.address();
  console.log(`[server] Chợ Thị Trấn Việt Nam 3D đang chạy tại: http://localhost:${addr.port}`);
  setInterval(tick, 1000 / config.tickRate);
});

startListening(Number(config.port) || 3000);

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

function shutdown() {
  console.log("\n[server] Đang lưu dữ liệu bà con và tắt máy chủ an toàn...");
  Object.keys(world.players).forEach((nick) => {
    world.leaveWorld(nick);
  });
  server.close(() => {
    persistence.db.close();
    console.log("[server] Đã tắt hoàn tất!");
    process.exit(0);
  });
}
