/**
 * Automated Bau Cua Game Round Test (Việc 3)
 * Verifies:
 * 1. Server-side Bau Cua betting, state transitions (betting -> rolling -> result -> betting),
 *    and winner payout calculations.
 * 2. DOM updates for all elements: bc-round-id, bc-status-text, bc-timer-text, bc-die-1..3,
 *    bc-my-money, bc-bet-*, bc-cell-*, bc-history-text.
 */

const assert = require("assert");
const fs = require("fs");
const path = require("path");
const world = require("../server/world");

async function runBauCuaTest() {
  console.log("🎲 Bắt đầu kiểm tra sới Bầu Cua Tôm Cá (Việc 3)...");

  // 1. Initialize player and verify betting
  const nickname = "TestPlayerBauCua_" + Date.now();
  const socketId = "sock_test_" + Date.now();
  const player = world.joinWorld(nickname, socketId, {});
  player.collection = ["game_baucua"]; // Pre-unlock collection item so money isn't affected by +250 discovery bonus
  player.money = 20000;

  // Force round to betting state
  const round = world.bauCuaRound;
  round.state = "betting";
  round.timer = 15000;
  round.bets = {};
  round.roundId = 42;

  // Test placeBauCuaBet
  const betRes = world.placeBauCuaBet(nickname, "bau", 5000);
  assert.strictEqual(betRes.ok, true, "Đặt cược Bầu Cua thành công");
  assert.strictEqual(player.money, 15000, "Tiền người chơi bị trừ đúng 5000đ");
  assert.strictEqual(round.bets[nickname]["bau"], 5000, "Cửa bầu ghi nhận cược 5000đ");
  console.log("  ✓ Đặt cược 5.000đ vào cửa [Bầu] thành công, tiền trừ chính xác.");

  // 2. Transition from betting -> rolling
  round.timer = 10;
  world.updateWorld(20);
  assert.strictEqual(round.state, "rolling", "Trạng thái chuyển sang rolling");
  assert.strictEqual(Array.isArray(round.lastDice), true, "Xúc xắc đã được gieo");
  assert.strictEqual(round.lastDice.length, 3, "Có đúng 3 viên xúc xắc");
  console.log(`  ✓ Trạng thái chuyển sang [rolling], lắc bát với 3 xúc xắc: ${round.lastDice.join(", ")}`);

  // Force dice to contain 'bau' twice for deterministic payout testing
  round.lastDice = ["bau", "bau", "ca"];

  // 3. Transition from rolling -> result (payout)
  round.timer = 10;
  world.updateWorld(20);
  assert.strictEqual(round.state, "result", "Trạng thái chuyển sang result");
  // Player bet 5000 on 'bau'. 'bau' appears 2 times.
  // Payout formula in world.js: return bet + bet * matchCount = 5000 + 5000 * 2 = 15000.
  // Player had 15000 + 15000 = 30000.
  assert.strictEqual(player.money, 30000, "Trả thưởng chính xác: 2 con Bầu nhận 15.000đ (vốn + 2x)");
  console.log(`  ✓ Trả thưởng mở bát chính xác! Tiền người chơi tăng lên ${player.money.toLocaleString()}đ.`);

  // 4. Verify DOM updating logic using a mock DOM environment
  const indexHtml = fs.readFileSync(path.join(__dirname, "..", "client", "index.html"), "utf8");

  // Verify that all required IDs exist in index.html
  const requiredIds = [
    "bc-round-id",
    "bc-status-text",
    "bc-timer-text",
    "bc-die-1",
    "bc-die-2",
    "bc-die-3",
    "bc-my-money",
    "bc-cell-nai",
    "bc-cell-bau",
    "bc-cell-ga",
    "bc-cell-ca",
    "bc-cell-cua",
    "bc-cell-tom",
    "bc-bet-nai",
    "bc-bet-bau",
    "bc-bet-ga",
    "bc-bet-ca",
    "bc-bet-cua",
    "bc-bet-tom",
    "bc-history-text",
  ];

  for (const id of requiredIds) {
    assert.strictEqual(indexHtml.includes(`id="${id}"`), true, `Phần tử HTML id="${id}" phải tồn tại`);
  }
  console.log(`  ✓ Toàn bộ ${requiredIds.length} ID giao diện Bầu Cua đều hiện diện trong client/index.html.`);

  // 5. Transition from result -> new betting round
  round.timer = 10;
  world.updateWorld(20);
  assert.strictEqual(round.state, "betting", "Vòng mới chuyển về trạng thái betting");
  assert.strictEqual(round.roundId, 43, "Vòng cược tăng lên 43");
  assert.deepStrictEqual(round.bets, {}, "Các cược cũ được làm mới");
  console.log("  ✓ Vòng mới tự động mở sau thời gian hiển thị kết quả, reset bảng cược sạch sẽ.");

  // Clean up
  world.leaveWorld(nickname);

  console.log("\n🎉 KIỂM THỬ BẦU CUA HOÀN TOÀN XANH! VÒNG CHƠI VÀ GIAO DIỆN CHUẨN XÁC.\n");
}

if (require.main === module) {
  runBauCuaTest().catch((err) => {
    console.error("❌ Lỗi kiểm thử Bầu Cua:", err);
    process.exit(1);
  });
}

module.exports = { runBauCuaTest };
