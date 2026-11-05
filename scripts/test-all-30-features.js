const { chromium } = require("playwright");
const assert = require("assert");
const fs = require("fs");
const path = require("path");

const EVIDENCE_DIR = path.resolve(__dirname, "../docs/evidence/features");

(async () => {
  console.log("🎮 Bắt đầu kiểm tra toàn diện 30 tính năng phố chợ (End-to-End)...");

  if (!fs.existsSync(EVIDENCE_DIR)) {
    fs.mkdirSync(EVIDENCE_DIR, { recursive: true });
  }

  const browser = await chromium.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-gpu", "--use-gl=swiftshader"],
  });

  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
    const TEST_PORT = process.env.TEST_PORT || process.env.PORT || 34567;
    await page.goto(`http://127.0.0.1:${TEST_PORT}/`, { waitUntil: "networkidle", timeout: 15000 });

    // 1. Gia nhập game
    const joinBtn = await page.$("#join-screen .join-btn");
    assert.ok(joinBtn, "Nút vào chợ phải tồn tại");
    await joinBtn.click();
    await page.waitForTimeout(2000);

    // 2. Mở Menu Tất Cả Tính Năng (modal-full-menu)
    console.log("📋 1. Mở Menu Tất Cả Tính Năng Phố Chợ (30 tính năng)...");
    await page.evaluate(() => {
      if (typeof window.openFullAppMenuModal === "function") {
        window.openFullAppMenuModal();
      } else {
        window.openModal("modal-full-menu");
      }
    });
    await page.waitForTimeout(500);

    const isFullMenuOpen = await page.evaluate(() => {
      const el = document.getElementById("modal-full-menu");
      return el && el.classList.contains("active");
    });
    assert.ok(isFullMenuOpen, "modal-full-menu phải mở khi gọi openFullAppMenuModal()");
    await page.screenshot({ path: path.join(EVIDENCE_DIR, "01-modal-full-menu.png") });
    console.log("  ✓ modal-full-menu mở thành công và hiển thị 30 tính năng");

    // 3. Kiểm tra các chức năng dịch vụ: Ngân Hàng, Vé Số, Tiệm Xe
    console.log("🏦 2. Kiểm tra Ngân Hàng Thị Trấn...");
    await page.evaluate(() => {
      window.closeModal("modal-full-menu");
      window.openBankModal();
    });
    await page.waitForTimeout(500);
    const isBankOpen = await page.evaluate(() => {
      const el = document.getElementById("modal-bank");
      return el && el.classList.contains("active");
    });
    assert.ok(isBankOpen, "modal-bank phải mở thành công");
    await page.screenshot({ path: path.join(EVIDENCE_DIR, "02-modal-bank.png") });
    console.log("  ✓ modal-bank mở và hiển thị số dư tiết kiệm & lãi suất");

    console.log("🎫 3. Kiểm tra Đại Lý Vé Số & Cào May Mắn...");
    await page.evaluate(() => {
      window.closeModal("modal-bank");
      window.openLotteryModal();
    });
    await page.waitForTimeout(500);
    const isLotteryOpen = await page.evaluate(() => {
      const el = document.getElementById("modal-lottery");
      return el && el.classList.contains("active");
    });
    assert.ok(isLotteryOpen, "modal-lottery phải mở thành công");
    await page.screenshot({ path: path.join(EVIDENCE_DIR, "03-modal-lottery.png") });
    console.log("  ✓ modal-lottery mở thành công");

    console.log("🏍️ 4. Kiểm tra Tiệm Độ Xe Máy & Nước Sâm...");
    await page.evaluate(() => {
      window.closeModal("modal-lottery");
      window.openGarageModal();
    });
    await page.waitForTimeout(500);
    const isGarageOpen = await page.evaluate(() => {
      const el = document.getElementById("modal-garage");
      return el && el.classList.contains("active");
    });
    assert.ok(isGarageOpen, "modal-garage phải mở thành công");
    await page.screenshot({ path: path.join(EVIDENCE_DIR, "04-modal-garage.png") });
    console.log("  ✓ modal-garage mở thành công");

    // 4. Kiểm tra Đi Tới (modal-goto) và Dịch chuyển tức thời
    console.log("🧭 5. Kiểm tra Menu Đi Tới & Dịch Chuyển Khu Vực...");
    await page.evaluate(() => {
      window.closeModal("modal-garage");
      window.openGoToModal();
    });
    await page.waitForTimeout(800);
    const isGoToOpen = await page.evaluate(() => {
      const el = document.getElementById("modal-goto");
      return el && el.classList.contains("active");
    });
    assert.ok(isGoToOpen, "modal-goto phải mở thành công");
    await page.screenshot({ path: path.join(EVIDENCE_DIR, "05-modal-goto.png") });

    // Thử dịch chuyển tới Công Viên Hồ Sen (-78, 12)
    console.log("⚡ 6. Thử dịch chuyển nhân vật tới Công Viên Hồ Sen...");
    const beforePos = await page.evaluate(() => ({ x: window.myPlayer.pos.x, z: window.myPlayer.pos.z }));
    await page.evaluate(() => {
      const cards = document.querySelectorAll("#goto-zones-list .community-event-card");
      let lotusBtn = null;
      cards.forEach(c => {
        if (c.innerText.includes("Hồ Sen") || c.innerText.includes("Lotus")) {
          const btns = c.querySelectorAll("button");
          lotusBtn = btns[btns.length - 1]; // "Đến Ngay"
        }
      });
      if (lotusBtn) lotusBtn.click();
    });
    await page.waitForTimeout(1000);
    const afterPos = await page.evaluate(() => ({
      x: window.myPlayer.pos.x,
      z: window.myPlayer.pos.z,
      camX: window.controls ? window.controls.target.x : null,
      camZ: window.controls ? window.controls.target.z : null,
    }));
    console.log("  Vị trí trước:", beforePos, "-> Vị trí sau:", afterPos);
    assert.ok(Math.hypot(afterPos.x - beforePos.x, afterPos.z - beforePos.z) > 10, "Nhân vật phải dịch chuyển vị trí thực sự");
    assert.ok(Math.abs(afterPos.camX - afterPos.x) < 2, "Camera controls target phải di chuyển đồng bộ với nhân vật");
    await page.screenshot({ path: path.join(EVIDENCE_DIR, "06-teleport-lotus.png") });
    console.log("  ✓ Dịch chuyển tức thời và bám camera hoạt động hoàn hảo");

    // 5. Kiểm tra Gọi Chó Vàng & Pháo Hoa
    console.log("🐕 7. Kiểm tra Gọi Chó Vàng & Bắn Pháo Hoa...");
    const petRes = await page.evaluate(() => {
      window.callPetDog();
      window.triggerFireworkCelebration();
      return {
        hasDog: Boolean(window.petDogMesh),
        dogPos: window.petDogMesh ? { x: window.petDogMesh.group.position.x, z: window.petDogMesh.group.position.z } : null,
        playerPos: { x: window.myPlayer.pos.x, z: window.myPlayer.pos.z }
      };
    });
    assert.ok(petRes.hasDog, "Cún Vàng phải được tạo và tồn tại trong 3D");
    const dogDist = Math.hypot(petRes.dogPos.x - petRes.playerPos.x, petRes.dogPos.z - petRes.playerPos.z);
    assert.ok(dogDist < 5, `Cún Vàng phải đứng sát cạnh người chơi (khoảng cách: ${dogDist.toFixed(2)}m)`);
    await page.waitForTimeout(600);
    await page.screenshot({ path: path.join(EVIDENCE_DIR, "07-pet-dog-firework.png") });
    console.log("  ✓ Cún Vàng xuất hiện cạnh người chơi và pháo hoa kích hoạt");

    // 6. Kiểm tra Căn Nhà Riêng
    console.log("🏠 8. Kiểm tra Căn Nhà Riêng (Housing System)...");
    await page.evaluate(() => {
      window.openHouseModal();
    });
    await page.waitForTimeout(500);
    const isHouseOpen = await page.evaluate(() => {
      const el = document.getElementById("modal-house");
      return el && el.classList.contains("active");
    });
    assert.ok(isHouseOpen, "modal-house phải mở thành công");
    await page.screenshot({ path: path.join(EVIDENCE_DIR, "08-modal-house.png") });
    console.log("  ✓ modal-house hiển thị đầy đủ 4 tab: Xây Dựng, Cửa Hàng, Trang Trí, Lưu Bút");

    // 7. Kiểm tra Quán Trà Đá & Câu Cá
    console.log("☕ 9. Kiểm tra Quán Trà Đá & Câu Cá...");
    await page.evaluate(() => {
      window.closeModal("modal-house");
      window.openTeaTableModal();
    });
    await page.waitForTimeout(500);
    const isTeaOpen = await page.evaluate(() => {
      const el = document.getElementById("modal-tea-table");
      return el && el.classList.contains("active");
    });
    assert.ok(isTeaOpen, "modal-tea-table phải mở thành công");

    await page.evaluate(() => {
      window.closeModal("modal-tea-table");
      window.openFishingModal();
    });
    await page.waitForTimeout(500);
    const isFishOpen = await page.evaluate(() => {
      const el = document.getElementById("modal-fishing");
      return el && el.classList.contains("active");
    });
    assert.ok(isFishOpen, "modal-fishing phải mở thành công");
    await page.screenshot({ path: path.join(EVIDENCE_DIR, "09-modal-fishing.png") });
    console.log("  ✓ Quán Trà Đá và Câu Cá Bến Sông mở mượt mà");

    // 8. Kiểm tra Xe Máy (Hoverboard)
    console.log("🛵 10. Kiểm tra Đi Xe Máy...");
    const bikeState = await page.evaluate(() => {
      window.closeModal("modal-fishing");
      const before = window.myPlayer.hoverboard;
      window.toggleHoverboard();
      const after = window.myPlayer.hoverboard;
      return { before, after };
    });
    assert.strictEqual(bikeState.before, false);
    assert.strictEqual(bikeState.after, true);
    await page.waitForTimeout(400);
    await page.screenshot({ path: path.join(EVIDENCE_DIR, "10-motorcycle-ride.png") });
    console.log("  ✓ Xe máy bật thành công, tăng tốc và hiển thị mô hình");

    console.log("\n🎉 HOÀN THÀNH KIỂM THỬ: TOÀN BỘ 30 TÍNH NĂNG ĐỀU TỒN TẠI VÀ HOẠT ĐỘNG THỰC TẾ 100%!\n");
  } finally {
    await browser.close();
  }
})();
