/**
 * Automated Mobile Optimization & Virtual Controls Test
 * Chợ Thị Trấn Việt Nam 3D
 */

const assert = require("assert");
const fs = require("fs");
const path = require("path");
const http = require("http");
const { spawn } = require("child_process");
const { chromium } = require("playwright");

const TEST_PORT = 3459;
const BASE_URL = `http://127.0.0.1:${TEST_PORT}`;
const TEST_DB = path.join(__dirname, "..", "test-mobile-world.db");
const EVIDENCE_DIR = path.join(__dirname, "..", "docs", "evidence", "mobile");

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
  throw new Error("Server test không sẵn sàng");
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

async function runMobileUITest() {
  console.log("📱 Bắt đầu kiểm thử Tối Ưu Hóa Di Động & Phím Ảo Cảm Ứng...");
  cleanupDb();

  if (!fs.existsSync(EVIDENCE_DIR)) {
    fs.mkdirSync(EVIDENCE_DIR, { recursive: true });
  }

  const serverProc = spawn(process.execPath, [path.join(__dirname, "..", "server", "index.js")], {
    env: {
      ...process.env,
      PORT: String(TEST_PORT),
      DB_PATH: TEST_DB,
      ADMIN_KEY: "test-admin-secret",
    },
    stdio: ["ignore", "pipe", "pipe"],
  });

  const chromePath = fs.existsSync("C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe")
    ? "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"
    : (fs.existsSync("C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe")
        ? "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe"
        : undefined);

  let browser = null;

  try {
    await waitForServerReady();
    console.log(`  ✓ Server test mobile khởi động thành công tại cổng ${TEST_PORT}`);

    browser = await chromium.launch({
      executablePath: chromePath,
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-gpu", "--use-gl=swiftshader"],
    });

    // 1. Khởi tạo ngữ cảnh thiết bị di động (Mobile Viewport 390x844, Touch Coarse)
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148",
      hasTouch: true,
      isMobile: true,
      deviceScaleFactor: 2,
    });
    const page = await context.newPage();

    console.log("  🔍 1. Tải trang trên Viewport Di Động (390 x 844):");
    await page.goto(`${BASE_URL}/`, { waitUntil: "networkidle", timeout: 12000 });

    // Kiểm tra màn hình vào game v2
    const joinBtn = await page.$("#join-screen .join-btn");
    assert.ok(joinBtn, "Nút Vào Chợ Ngay phải hiện diện");
    await joinBtn.click();
    await page.waitForTimeout(1600);

    // 2. Kiểm tra chế độ mobile-mode được kích hoạt tự động
    console.log("  🔍 2. Kiểm tra chế độ Mobile Mode & Lớp Điều Khiển Cảm Ứng:");
    const isMobileMode = await page.evaluate(() => document.body.classList.contains("mobile-mode"));
    assert.ok(isMobileMode, "document.body phải tự động kích hoạt class 'mobile-mode' trên điện thoại");

    const controlsVisible = await page.evaluate(() => {
      const el = document.getElementById("mobile-controls-layer");
      return el && window.getComputedStyle(el).display !== "none";
    });
    assert.ok(controlsVisible, "#mobile-controls-layer phải hiển thị (display: block)");
    console.log("     ✓ Giao diện tự động nhận diện thiết bị di động và bật #mobile-controls-layer.");

    // 3. Kiểm tra các phần tử Cần Gạt Nổi (Floating Joystick) & Kích thước chạm
    console.log("  🔍 3. Kiểm tra Cần Gạt Ảo Nổi (Dynamic Floating Joystick):");
    const joyElements = await page.evaluate(() => {
      const touchArea = document.getElementById("mobile-touch-left");
      const zone = document.getElementById("joystick-zone");
      const base = document.getElementById("joystick-base");
      const stick = document.getElementById("joystick-stick");
      return {
        hasTouchArea: Boolean(touchArea),
        hasZone: Boolean(zone),
        hasBase: Boolean(base),
        hasStick: Boolean(stick),
        zoneRect: zone ? zone.getBoundingClientRect() : null,
      };
    });

    assert.ok(joyElements.hasTouchArea, "#mobile-touch-left phải hiện diện để đón touch ngón cái trái");
    assert.ok(joyElements.hasZone, "#joystick-zone phải tồn tại");
    assert.ok(joyElements.hasBase, "#joystick-base phải tồn tại");
    assert.ok(joyElements.hasStick, "#joystick-stick phải tồn tại");
    assert.ok(joyElements.zoneRect.width >= 100, "Đường kính joystick base phải đạt chuẩn công thái học (>= 100px)");
    console.log(`     ✓ Joystick base kích thước ${joyElements.zoneRect.width}x${joyElements.zoneRect.height}px, đạt chuẩn công thái học.`);

    // 4. Kiểm tra Cụm Nút Hành Động Ngón Cái Phải (#mobile-action-pad)
    console.log("  🔍 4. Kiểm tra Cụm Nút Hành Động Ngón Cái Phải (#mobile-action-pad):");
    const actionPadInfo = await page.evaluate(() => {
      const pad = document.getElementById("mobile-action-pad");
      const btnJump = document.getElementById("mob-btn-jump");
      const btnBike = document.getElementById("mob-btn-bike");
      const btnInteract = document.getElementById("mob-btn-interact");
      return {
        hasPad: Boolean(pad),
        btnJumpSize: btnJump ? { w: btnJump.offsetWidth, h: btnJump.offsetHeight } : null,
        btnBikeSize: btnBike ? { w: btnBike.offsetWidth, h: btnBike.offsetHeight } : null,
        btnInteractSize: btnInteract ? { w: btnInteract.offsetWidth, h: btnInteract.offsetHeight } : null,
      };
    });

    assert.ok(actionPadInfo.hasPad, "#mobile-action-pad phải hiện diện");
    assert.ok(actionPadInfo.btnJumpSize && actionPadInfo.btnJumpSize.w >= 48, "Nút Nhảy phải đạt min touch target >= 48px");
    assert.ok(actionPadInfo.btnBikeSize && actionPadInfo.btnBikeSize.w >= 48, "Nút Xe Máy phải đạt min touch target >= 48px");
    assert.ok(actionPadInfo.btnInteractSize && actionPadInfo.btnInteractSize.w >= 56, "Nút Tương Tác Lớn phải đạt >= 56px");
    console.log(`     ✓ Cụm phím ngón cái: Nhảy (${actionPadInfo.btnJumpSize.w}px), Xe máy (${actionPadInfo.btnBikeSize.w}px), Tương tác (${actionPadInfo.btnInteractSize.w}px).`);

    // 5. Kiểm tra tương tác Xe máy trên di động
    console.log("  🔍 5. Kiểm tra tương tác Lên/Xuống Xe Máy bằng nút ngón cái phải:");
    const bikeStateBefore = await page.evaluate(() => window.myPlayer.hoverboard);
    await page.click("#mob-btn-bike");
    await page.waitForTimeout(300);
    const bikeStateAfter = await page.evaluate(() => ({
      riding: window.myPlayer.hoverboard,
      hasBikeOnClass: document.getElementById("mob-btn-bike").classList.contains("bike-on"),
    }));
    assert.notStrictEqual(bikeStateBefore, bikeStateAfter.riding, "Trạng thái xe máy phải thay đổi khi bấm nút");
    assert.strictEqual(bikeStateAfter.riding, true, "Xe máy phải được bật");
    assert.strictEqual(bikeStateAfter.hasBikeOnClass, true, "Nút xe máy phải có class .bike-on sáng đèn");
    console.log("     ✓ Nút xe máy phản hồi mượt mà và chuyển màu báo hiệu trạng thái cưỡi xe.");

    // Chụp ảnh HUD di động với Joystick và Cụm Nút
    const hudShotPath = path.join(EVIDENCE_DIR, "mobile-hud-controls.png");
    await page.screenshot({ path: hudShotPath });
    console.log(`     📸 Đã chụp ảnh bằng chứng: docs/evidence/mobile/mobile-hud-controls.png`);

    // 6. Kiểm tra Responsive Modal trên màn hình di động (Không tràn màn hình)
    console.log("  🔍 6. Kiểm tra độ vừa vặn của Modal trên màn hình hẹp:");
    await page.evaluate(() => {
      if (typeof window.openWholesaleModal === "function") window.openWholesaleModal();
    });
    await page.waitForTimeout(400);

    const modalBoxMetrics = await page.evaluate(() => {
      const box = document.querySelector("#modal-wholesale .modal-box");
      if (!box) return null;
      const rect = box.getBoundingClientRect();
      return {
        width: rect.width,
        height: rect.height,
        viewportWidth: window.innerWidth,
        viewportHeight: window.innerHeight,
        maxHeightStyle: window.getComputedStyle(box).maxHeight,
      };
    });

    assert.ok(modalBoxMetrics, "Modal bán buôn phải mở thành công");
    assert.ok(
      modalBoxMetrics.width <= modalBoxMetrics.viewportWidth,
      "Modal không được tràn theo chiều ngang viewport"
    );
    assert.ok(
      modalBoxMetrics.height <= modalBoxMetrics.viewportHeight * 0.92,
      "Modal phải co giãn vừa vặn, không vượt quá chiều cao màn hình"
    );
    console.log(`     ✓ Modal hiển thị chuẩn xác (${modalBoxMetrics.width}x${modalBoxMetrics.height}px trên màn hình ${modalBoxMetrics.viewportWidth}x${modalBoxMetrics.viewportHeight}px).`);

    const modalShotPath = path.join(EVIDENCE_DIR, "mobile-modal-responsive.png");
    await page.screenshot({ path: modalShotPath });
    console.log(`     📸 Đã chụp ảnh bằng chứng: docs/evidence/mobile/mobile-modal-responsive.png`);

    // Đóng modal
    await page.evaluate(() => {
      if (typeof window.closeModal === "function") window.closeModal("modal-wholesale");
    });
    await page.waitForTimeout(300);

    console.log("\n🎉 TOÀN BỘ KIỂM THỬ GIAO DIỆN DI ĐỘNG ĐỀU VƯỢT QUA XUẤT SẮC!\n");
  } finally {
    if (browser) await browser.close();
    serverProc.kill("SIGTERM");
    cleanupDb();
  }
}

runMobileUITest().catch((err) => {
  console.error("❌ Lỗi kiểm thử giao diện di động:", err);
  process.exit(1);
});
