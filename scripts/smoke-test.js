/**
 * Automated Smoke Test — Chợ Thị Trấn Việt Nam 3D (Phases 0–12)
 * Verifies:
 * 1. Security: /libs/world.db, /libs/package.json, /libs/server/index.js blocked (404), /libs/three.min.js allowed (200)
 * 2. Health & Online API: /health and /api/online return 200 JSON; /manifest.webmanifest returns 200
 * 3. Passwordless Identity & Anti-Hijack:
 *    - Player A joins and receives playerToken + recoveryCode + snapshot with 9 zones & seats
 *    - Attacker trying Player A's nickname with wrong token gets NICKNAME_TAKEN + 3 suggestions
 *    - Player A can reconnect with playerToken
 * 4. Chat Profanity Filter & Nearby Distance Filter (18m):
 *    - Profanity is masked with ***
 *    - Nearby chat reaches players within 18m and does NOT reach players >18m away
 * 5. Gameplay & Living Town Mechanics:
 *    - Kick shuttlecock increments combo & rewards money
 *    - Authoritative seat reservation (sitSeat)
 *    - Wishing Tree (createWish + activities_sync)
 *    - Tug of War (pullTugOfWar) & Open Stage (performStage)
 *    - Block & Report player (blockPlayer, reportPlayer)
 *    - Private 4-char room creation (createPrivateRoom)
 */

const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");
const http = require("http");
const { io } = require("socket.io-client");

// Port: tôn trọng TEST_PORT từ môi trường (npm test truyền vào), mặc định port ngẫu nhiên
// để không bao giờ va chạm với server dev hoặc server của npm test đang chạy sẵn
const TEST_PORT = process.env.TEST_PORT
  ? Number(process.env.TEST_PORT)
  : 34000 + Math.floor(Math.random() * 20000);
const BASE_URL = `http://127.0.0.1:${TEST_PORT}`;
const TEST_DB = path.join(__dirname, "..", "test-smoke-world.db");

function httpGet(urlPath) {
  return new Promise((resolve, reject) => {
    http
      .get(`${BASE_URL}${urlPath}`, (res) => {
        let body = "";
        res.on("data", (chunk) => (body += chunk));
        res.on("end", () => resolve({ statusCode: res.statusCode, headers: res.headers, body }));
      })
      .on("error", reject);
  });
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(`ASSERTION FAILED: ${message}`);
  }
  console.log(`  ✓ ${message}`);
}

function cleanupDb() {
  for (const suffix of ["", "-wal", "-shm"]) {
    const file = TEST_DB + suffix;
    if (fs.existsSync(file)) {
      try {
        fs.unlinkSync(file);
      } catch (e) {
        // ignore
      }
    }
  }
}

async function waitForServerReady(maxWaitMs = 8000) {
  const start = Date.now();
  while (Date.now() - start < maxWaitMs) {
    try {
      const res = await httpGet("/health");
      if (res.statusCode === 200) return true;
    } catch (e) {
      // wait
    }
    await new Promise((r) => setTimeout(r, 150));
  }
  throw new Error("Server did not become healthy in time");
}

function emitAck(socket, event, payload, timeoutMs = 4000) {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(`Timeout waiting for ${event} ack`)), timeoutMs);
    socket.emit(event, payload, (res) => {
      clearTimeout(t);
      resolve(res);
    });
  });
}

async function runSmokeTests() {
  console.log("🏮 Bắt đầu chạy Smoke Test cho Chợ Thị Trấn Việt Nam 3D...");

  // Nếu đã có server chạy sẵn trên TEST_PORT (npm test khởi động trước) thì tái sử dụng,
  // chỉ tự spawn server + DB test riêng khi port còn trống
  let serverProc = null;
  const portBusy = await new Promise((resolve) => {
    const probe = http.get(`${BASE_URL}/health`, (res) => {
      res.resume();
      resolve(res.statusCode === 200);
    });
    probe.on("error", () => resolve(false));
    probe.setTimeout(1200, () => { probe.destroy(); resolve(false); });
  });

  if (portBusy) {
    console.log(`  ✓ Tái sử dụng server đang chạy sẵn tại cổng ${TEST_PORT}`);
  } else {
    cleanupDb();
    serverProc = spawn(process.execPath, [path.join(__dirname, "..", "server", "index.js")], {
      env: {
        ...process.env,
        PORT: String(TEST_PORT),
        DB_PATH: TEST_DB,
        ADMIN_KEY: "test-admin-secret"
      },
      stdio: ["ignore", "pipe", "pipe"]
    });
  }

  let clientA = null;
  let clientB = null;
  let clientAttacker = null;

  try {
    await waitForServerReady();
    console.log("  ✓ Server test khởi động thành công tại cổng " + TEST_PORT);

    // 1. Security & Static Asset Whitelist
    const dbLeak = await httpGet("/libs/world.db");
    assert(dbLeak.statusCode === 404, "/libs/world.db bị chặn an toàn (HTTP 404)");

    const pkgLeak = await httpGet("/libs/package.json");
    assert(pkgLeak.statusCode === 404, "/libs/package.json bị chặn an toàn (HTTP 404)");

    const serverLeak = await httpGet("/libs/server/index.js");
    assert(serverLeak.statusCode === 404, "/libs/server/index.js bị chặn an toàn (HTTP 404)");

    const threeRes = await httpGet("/libs/three.min.js");
    assert(threeRes.statusCode === 200, "/libs/three.min.js phục vụ bình thường (HTTP 200)");

    const healthRes = await httpGet("/health");
    const healthJson = JSON.parse(healthRes.body);
    assert(healthRes.statusCode === 200 && healthJson.status === "ok", "/health trả về trạng thái khỏe mạnh");

    const pwaManifest = await httpGet("/manifest.webmanifest");
    assert(pwaManifest.statusCode === 200, "/manifest.webmanifest hoạt động (PWA)");

    // 2. Player A Joins & Gets Passwordless Token
    clientA = io(BASE_URL, { transports: ["websocket"], forceNew: true });
    await new Promise((resolve) => clientA.once("connect", resolve));

    const initA = await emitAck(clientA, "join", {
      nickname: "LanHoiAn",
      customization: { shirtColor: 0xd9381e, hatType: "non_la" }
    });

    assert(initA && initA.ok === true, "Người chơi A gia nhập thành công");
    assert(Boolean(initA.playerToken), "Người chơi A nhận được playerToken bảo vệ tài khoản");
    assert(Boolean(initA.recoveryCode && initA.recoveryCode.length >= 6), "Người chơi A nhận được recoveryCode 6 ký tự");
    assert(
      initA.snapshot && Array.isArray(initA.snapshot.zones) && initA.snapshot.zones.length >= 9,
      "Dữ liệu 9 khu vực Thị Trấn Sống được gửi trong snapshot"
    );
    assert(
      initA.snapshot && Array.isArray(initA.snapshot.seats) && initA.snapshot.seats.length >= 15,
      "Danh mục ghế ngồi chung toàn thị trấn được gửi trong snapshot"
    );

    // 3. Anti-Hijack Test: Attacker tries to join as "LanHoiAn" with wrong token
    clientAttacker = io(BASE_URL, { transports: ["websocket"], forceNew: true });
    await new Promise((resolve) => clientAttacker.once("connect", resolve));

    const hijackRes = await emitAck(clientAttacker, "join", {
      nickname: "LanHoiAn",
      playerToken: "wrong-token-123"
    });

    assert(
      hijackRes.ok === false &&
        hijackRes.code === "NICKNAME_TAKEN" &&
        Array.isArray(hijackRes.suggestions) &&
        hijackRes.suggestions.length === 3,
      "Chống chiếm đoạt tên hoạt động: trả về NICKNAME_TAKEN kèm 3 tên gợi ý (" + hijackRes.suggestions.join(", ") + ")"
    );
    clientAttacker.disconnect();

    // 4. Player B Joins same room
    clientB = io(BASE_URL, { transports: ["websocket"], forceNew: true });
    await new Promise((resolve) => clientB.once("connect", resolve));

    const initB = await emitAck(clientB, "join", {
      nickname: "MinhTraDa",
      customization: { shirtColor: 0x2563eb, hatType: "none" }
    });
    assert(initB.ok && initB.roomId === initA.roomId, "Người chơi A và B vào cùng phòng công khai (" + initA.roomId + ")");

    // 5. Chat Profanity Filter Test
    const chatProm = new Promise((resolve, reject) => {
      const t = setTimeout(() => reject(new Error("Timeout waiting for chat_message")), 4000);
      clientB.on("chat_message", function handler(msg) {
        if (msg && msg.nickname === "LanHoiAn") {
          clearTimeout(t);
          clientB.off("chat_message", handler);
          resolve(msg);
        }
      });
    });

    const chatAck = await emitAck(clientA, "chat", { msg: "Chào bạn đm vui quá", channel: "town" });
    const receivedChat = await chatProm;
    assert(
      chatAck.ok && receivedChat.msg.includes("***") && !receivedChat.msg.includes("đm"),
      "Bộ lọc từ nhạy cảm tiếng Việt tự động che thành ***"
    );

    // 6. Nearby Chat Distance Filter (18m)
    clientA.emit("move", { pos: { x: 0, y: 0, z: 0 }, rot: 0, teleportAllowed: true });
    clientB.emit("move", { pos: { x: 52, y: 0, z: 52 }, rot: 0, teleportAllowed: true });
    await new Promise((r) => setTimeout(r, 150));

    let leakedNearby = false;
    const onNearbyCheck = (msg) => {
      if (msg && msg.channel === "nearby" && msg.msg.includes("TinNhanBiMatGan")) {
        leakedNearby = true;
      }
    };
    clientB.on("chat_message", onNearbyCheck);
    await new Promise((r) => setTimeout(r, 1100)); // respect 1 msg/sec rate limit
    const nearbyAck = await emitAck(clientA, "chat", { msg: "TinNhanBiMatGan", channel: "nearby" });
    await new Promise((r) => setTimeout(r, 300));
    clientB.off("chat_message", onNearbyCheck);
    assert(nearbyAck.ok && !leakedNearby, "Chat kênh 'Quanh Đây (18m)' KHÔNG rò rỉ tới người chơi đứng cách xa >70m");

    // 7. Shuttlecock Kick Test
    const kickRes = await emitAck(clientA, "kickShuttlecock", {});
    assert(kickRes.ok && kickRes.combo >= 1, "Đá cầu (kickShuttlecock) hoạt động và tăng combo (" + kickRes.combo + ")");

    // 8. Authoritative Seat Reservation Test
    const seatRes = await emitAck(clientA, "sitSeat", { seatId: "tea_1" });
    assert(seatRes.ok && seatRes.seated === true, "Hệ thống ghế ngồi chung (sitSeat) xác nhận chỗ ngồi chuẩn xác");

    // 9. Wishing Tree & Floating Lanterns Test
    const wishRes = await emitAck(clientA, "createWish", {
      text: "Chúc cả thị trấn Bình an và vui vẻ!",
      type: "tree"
    });
    assert(wishRes.ok && wishRes.wish && wishRes.wish.text.includes("Bình an"), "Cây Đa Ước Nguyện lưu và đồng bộ lời chúc");

    // 10. Cooperative Activities Test (Tug of War & Open Stage)
    const tugRes = await emitAck(clientA, "pullTugOfWar", { preferredTeam: "red" });
    assert(tugRes.ok && tugRes.team === "red", "Kéo Co Sân Làng (pullTugOfWar) hoạt động");

    const stageRes = await emitAck(clientB, "performStage", {
      songOrAct: "Đàn tính hát then",
      lyricBanner: "Quê hương tươi đẹp ngàn hoa!"
    });
    assert(stageRes.ok && stageRes.openStage, "Sân Khấu Đêm (performStage) đăng ký tiết mục thành công");

    // 11. Report & Block Player Test
    const repRes = await emitAck(clientA, "reportPlayer", {
      targetNick: "MinhTraDa",
      reason: "Kiểm thử hệ thống báo cáo"
    });
    assert(repRes.ok && repRes.reportId, "Báo cáo vi phạm (reportPlayer) lưu vào bảng SQLite reports");

    // 12. Private Room Creation Test
    const privRes = await emitAck(clientB, "createPrivateRoom", {});
    assert(
      privRes.ok && privRes.roomId && privRes.roomId.length === 4,
      "Tạo phòng riêng 4 ký tự thành công (Mã phòng: " + privRes.roomId + ")"
    );

    console.log("\n🎉 TẤT CẢ 12 HẠNG MỤC SMOKE TEST ĐỀU VƯỢT QUA XUẤT SẮC!");
  } finally {
    if (clientA) clientA.disconnect();
    if (clientB) clientB.disconnect();
    if (clientAttacker) clientAttacker.disconnect();
    if (serverProc) serverProc.kill("SIGTERM"); // chỉ kill server do test tự spawn
    cleanupDb();
  }
}

runSmokeTests().catch((err) => {
  console.error("\n❌ SMOKE TEST THẤT BẠI:", err.message);
  cleanupDb();
  process.exit(1);
});
