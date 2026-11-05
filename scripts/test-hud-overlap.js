/**
 * Automated HUD Overlap & Viewport Integrity Test
 * Tests viewports: 360x640, 768x1024, 1080x540, 1366x768
 * 1. Checks getBoundingClientRect() overlap between top-level visible HUD elements
 * 2. Checks text truncation (scrollWidth > clientWidth on non-scrolling text containers)
 * 3. Checks HUD height limits (top bar + bottom dock <= 14% at 1080x540, <= 18% at 360x640)
 * 4. Captures screenshot to docs/evidence/3B/
 */

const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");

const VIEWPORTS = [
  { name: "mobile", width: 360, height: 640, maxHudPercent: 18 },
  { name: "tablet", width: 768, height: 1024, maxHudPercent: 16 },
  { name: "desktop-wide", width: 1080, height: 540, maxHudPercent: 14 },
  { name: "desktop-std", width: 1366, height: 768, maxHudPercent: 14 },
];

const EVIDENCE_DIR = path.join(__dirname, "..", "docs", "evidence", "3B");

async function runTest(options = {}) {
  const isBefore = process.argv.includes("--capture-before") || options.isBefore;
  const prefix = isBefore ? "before" : "after";

  if (!fs.existsSync(EVIDENCE_DIR)) {
    fs.mkdirSync(EVIDENCE_DIR, { recursive: true });
  }

  console.log(`\n🔍 Đang chạy kiểm thử HUD Overlap & Chụp ảnh evidence [${prefix.toUpperCase()}]...`);

  const chromePath = fs.existsSync("C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe")
    ? "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"
    : (fs.existsSync("C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe") ? "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe" : undefined);

  const browser = await chromium.launch({
    executablePath: chromePath,
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-gpu", "--use-gl=swiftshader"],
  });

  const results = [];
  let allPassed = true;

  for (const vp of VIEWPORTS) {
    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      deviceScaleFactor: 1,
    });
    const page = await context.newPage();

    // Catch console errors
    const consoleErrors = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") consoleErrors.push(msg.text());
    });
    page.on("pageerror", (err) => consoleErrors.push(err.message));

    try {
      const TEST_PORT = process.env.TEST_PORT || process.env.PORT || 34567;
      await page.goto(`http://127.0.0.1:${TEST_PORT}/`, { waitUntil: "networkidle", timeout: 12000 });

      // If join screen is open, click join button to enter town
      const joinBtn = await page.$("#join-screen .join-btn");
      if (joinBtn) {
        await joinBtn.click();
        await page.waitForTimeout(2000);
      }

      // Check HUD layout metrics in page context
      const metrics = await page.evaluate(() => {
        const issues = [];

        const topHud = document.getElementById("top-hud");
        const bottomDock = document.getElementById("bottom-dock-wrapper");
        const chatWidget = document.getElementById("chat-widget");
        const minimapCard = document.getElementById("minimap-card");
        const eventBanner = document.getElementById("event-banner");
        const mobileActionPad = document.getElementById("mobile-action-pad");

        const viewH = window.innerHeight;
        const viewW = window.innerWidth;

        let topH = 0;
        let bottomH = 0;

        if (topHud && window.getComputedStyle(topHud).display !== "none") {
          const r = topHud.getBoundingClientRect();
          topH = r.height;
        }

        if (bottomDock && window.getComputedStyle(bottomDock).display !== "none") {
          const r = bottomDock.getBoundingClientRect();
          bottomH = r.height;
        }

        const totalHudPercent = ((topH + bottomH) / viewH) * 100;

        // Check overlaps between major independent floating HUD modules
        const checkOverlap = (idA, elA, idB, elB) => {
          if (!elA || !elB) return;
          const sA = window.getComputedStyle(elA);
          const sB = window.getComputedStyle(elB);
          if (sA.display === "none" || sA.visibility === "hidden" || sA.opacity === "0") return;
          if (sB.display === "none" || sB.visibility === "hidden" || sB.opacity === "0") return;

          const rA = elA.getBoundingClientRect();
          const rB = elB.getBoundingClientRect();
          if (rA.width === 0 || rA.height === 0 || rB.width === 0 || rB.height === 0) return;

          // Horizontal & Vertical overlap
          const overlapX = Math.max(0, Math.min(rA.right, rB.right) - Math.max(rA.left, rB.left));
          const overlapY = Math.max(0, Math.min(rA.bottom, rB.bottom) - Math.max(rA.top, rB.top));

          // Tolerate 2px margin rounding
          if (overlapX > 2 && overlapY > 2) {
            issues.push(`CHỒNG CHÉO: #${idA} và #${idB} giao nhau (${Math.round(overlapX)}px x ${Math.round(overlapY)}px)`);
          }
        };

        checkOverlap("top-hud", topHud, "minimap-card", minimapCard);
        checkOverlap("top-hud", topHud, "chat-widget", chatWidget);
        checkOverlap("minimap-card", minimapCard, "chat-widget", chatWidget);
        checkOverlap("chat-widget", chatWidget, "bottom-dock-wrapper", bottomDock);
        checkOverlap("mobile-action-pad", mobileActionPad, "bottom-dock-wrapper", bottomDock);
        checkOverlap("event-banner", eventBanner, "top-hud", topHud);
        checkOverlap("event-banner", eventBanner, "minimap-card", minimapCard);

        // Check text truncation on buttons & titles
        const textElements = document.querySelectorAll(
          ".brand-title, .merchant-rank, .weather-switch-btn, .btn-action, #dock-toggle-btn"
        );
        textElements.forEach((el) => {
          const s = window.getComputedStyle(el);
          if (s.display === "none" || s.overflowX === "auto" || s.overflowX === "scroll") return;
          // check if text is overflowing its parent / container
          if (el.scrollWidth > el.clientWidth + 2 && s.textOverflow !== "ellipsis") {
            const txt = (el.innerText || "").slice(0, 20).trim();
            issues.push(`CHỮ BỊ CẮT: "${txt}..." (scrollWidth: ${el.scrollWidth} > clientWidth: ${el.clientWidth})`);
          }
        });

        return {
          viewW,
          viewH,
          topH,
          bottomH,
          totalHudPercent,
          issues,
        };
      });

      // Take screenshot
      const shotPath = path.join(EVIDENCE_DIR, `${prefix}-${vp.width}x${vp.height}.png`);
      await page.screenshot({ path: shotPath, fullPage: false });
      console.log(`  📸 Đã chụp ảnh: docs/evidence/3B/${prefix}-${vp.width}x${vp.height}.png`);

      const exceedsBudget = metrics.totalHudPercent > vp.maxHudPercent;
      if (exceedsBudget) {
        metrics.issues.push(
          `HUD QUÁ DÀY: Chiếm ${metrics.totalHudPercent.toFixed(1)}% chiều cao (ngưỡng tối đa cho phép là ${vp.maxHudPercent}%)`
        );
      }

      const passed = metrics.issues.length === 0 && consoleErrors.length === 0;
      if (!passed) allPassed = false;

      results.push({
        viewport: `${vp.width}x${vp.height} (${vp.name})`,
        metrics,
        consoleErrors,
        passed,
      });

      console.log(`  📌 ${vp.width}x${vp.height} (${vp.name}): HUD chiếm ${metrics.totalHudPercent.toFixed(1)}% / Max ${vp.maxHudPercent}% | Vấn đề: ${metrics.issues.length}`);
      if (metrics.issues.length > 0) {
        metrics.issues.forEach((iss) => console.log(`     - ⚠️ ${iss}`));
      }
    } catch (err) {
      console.error(`  ❌ Lỗi khi test viewport ${vp.width}x${vp.height}:`, err.message);
      allPassed = false;
    } finally {
      await context.close();
    }
  }

  await browser.close();

  console.log(`\n======================================================`);
  if (allPassed) {
    console.log(`🎉 TẤT CẢ VIEWPORT ĐỀU ĐẠT TIÊU CHUẨN KHÔNG CHỒNG CHÉO & ĐÚNG TỶ LỆ!`);
  } else {
    console.log(`⚠️ PHÁT HIỆN ${results.reduce((acc, r) => acc + (r.metrics ? r.metrics.issues.length : 1), 0)} VẤN ĐỀ TRÊN CÁC VIEWPORT (ghi nhận trong evidence).`);
  }
  console.log(`======================================================\n`);

  return { allPassed, results };
}

if (require.main === module) {
  runTest().then(({ allPassed }) => {
    if (!process.argv.includes("--capture-before") && !allPassed) {
      process.exit(1);
    }
  });
}

module.exports = { runTest };
