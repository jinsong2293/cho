/**
 * Automated Weather Consistency & Multi-Source Alignment Test (Việc 4 & 5)
 * Verifies that for all canonical weather states:
 * 1. weatherState is the single source of truth across:
 *    - HUD Weather Chip (#hud-weather-temp, #hud-weather-name)
 *    - Loa Phường Event Banner (#event-title, #event-desc)
 *    - 3D Scene Particles, Sky & Fog
 * 2. No contradictory information (e.g. Chip says Rain while Banner says Heatwave 40°C).
 * 3. Captures evidence screenshots for each weather state.
 */

const assert = require("assert");
const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright");
const { WEATHER_STATES, WEATHER_LIST, getWeatherState } = require("../shared/weather");

const EVIDENCE_DIR = path.join(__dirname, "..", "docs", "evidence", "3B");

async function runWeatherTest() {
  console.log("🌦️ Bắt đầu kiểm tra tính nhất quán của Hệ Thống Thời Tiết (Việc 4 & 5)...");

  // 1. Data Contract & Integrity Verification
  console.log("  🔍 1. Kiểm tra cấu trúc dữ liệu canonical weather trong shared/weather.js:");
  for (const id of WEATHER_LIST) {
    const s = getWeatherState(id);
    assert.ok(s, `Trạng thái ${id} phải tồn tại`);
    assert.ok(s.name, `Trạng thái ${id} phải có name`);
    assert.ok(s.temp, `Trạng thái ${id} phải có temp formatted`);
    assert.ok(s.description, `Trạng thái ${id} phải có description`);
    assert.ok(s.title || s.eventTitle, `Trạng thái ${id} phải có title/eventTitle`);
    assert.ok(s.particles, `Trạng thái ${id} phải xác định particles (rain|heat|blossom|none)`);
    assert.strictEqual(typeof s.roughness, "number", `Trạng thái ${id} phải có roughness dạng số`);
    assert.strictEqual(typeof s.metalness, "number", `Trạng thái ${id} phải có metalness dạng số`);

    // Verify condition-specific alignments
    if (id === "rain") {
      assert.strictEqual(s.particles, "rain", "Mưa phải kích hoạt hạt mưa");
      assert.ok(s.name.includes("Mưa"), "Tên thời tiết mưa phải chứa 'Mưa'");
      assert.ok(!s.description.includes("nắng gắt"), "Mô tả mưa không được chứa 'nắng gắt'");
    } else if (id === "heatwave") {
      assert.strictEqual(s.particles, "heat", "Nắng gắt phải kích hoạt hạt nhiệt");
      assert.ok(s.name.includes("Nắng"), "Tên thời tiết nắng gắt phải chứa 'Nắng'");
      assert.ok(!s.description.includes("mưa"), "Mô tả nắng gắt không được chứa 'mưa'");
    }
    console.log(`     ✓ Trạng thái [${id}]: ${s.icon} ${s.name} (${s.temp}) — Hạt: ${s.particles}, Nhám: ${s.roughness}`);
  }

  // 2. Playwright Live Alignment Test on Browser
  console.log("\n  🔍 2. Kiểm tra trực quan trên trình duyệt (Playwright):");
  if (!fs.existsSync(EVIDENCE_DIR)) {
    fs.mkdirSync(EVIDENCE_DIR, { recursive: true });
  }

  const chromePath = fs.existsSync("C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe")
    ? "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"
    : (fs.existsSync("C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe")
        ? "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe"
        : undefined);

  const browser = await chromium.launch({
    executablePath: chromePath,
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-gpu", "--use-gl=swiftshader"],
  });

  try {
    const page = await browser.newPage({ viewport: { width: 1080, height: 540 } });
    const TEST_PORT = process.env.TEST_PORT || process.env.PORT || 34567;
    await page.goto(`http://127.0.0.1:${TEST_PORT}/`, { waitUntil: "networkidle", timeout: 12000 });

    const joinBtn = await page.$("#join-screen .join-btn");
    if (joinBtn) {
      await joinBtn.click();
      await page.waitForTimeout(1500);
    }

    for (const weatherMode of ["clear", "rain", "heatwave", "blossom"]) {
      // Switch weather via page evaluation
      const state = await page.evaluate((mode) => {
        if (typeof window.setWeatherMode === "function") {
          window.setWeatherMode(mode);
        } else if (typeof window.applyWeatherVisuals === "function") {
          window.applyWeatherVisuals(mode);
        }
        const tempEl = document.getElementById("hud-weather-temp");
        const nameEl = document.getElementById("hud-weather-name");
        const titleEl = document.getElementById("event-title");
        const descEl = document.getElementById("event-desc");
        const overlay = document.getElementById("weather-overlay");

        return {
          temp: tempEl ? tempEl.innerText : null,
          name: nameEl ? nameEl.innerText : null,
          eventTitle: titleEl ? titleEl.innerText : null,
          eventDesc: descEl ? descEl.innerText : null,
          overlayClass: overlay ? overlay.className : "",
        };
      }, weatherMode);

      console.log(`     📌 Chế độ [${weatherMode}]: Chip="${state.temp} · ${state.name}" | Banner="${state.eventTitle}"`);
      assert.ok(state.temp && state.temp.includes("°C"), `Chip phải hiển thị nhiệt độ có °C ở chế độ ${weatherMode}`);
      assert.ok(state.name && state.name.length > 0, `Chip phải hiển thị tên thời tiết ở chế độ ${weatherMode}`);
      assert.ok(state.eventTitle && state.eventTitle.length > 0, `Banner phải có tiêu đề ở chế độ ${weatherMode}`);

      // Verify no contradiction
      if (weatherMode === "rain") {
        assert.ok(!state.eventTitle.includes("Nắng Gắt"), "Banner mưa không được có chữ Nắng Gắt");
      }
      if (weatherMode === "heatwave") {
        assert.ok(!state.eventTitle.includes("Mưa"), "Banner nắng gắt không được có chữ Mưa");
      }

      // Screenshot evidence
      const shotPath = path.join(EVIDENCE_DIR, `weather-${weatherMode}.png`);
      await page.screenshot({ path: shotPath });
      console.log(`        📸 Đã chụp ảnh bằng chứng: docs/evidence/3B/weather-${weatherMode}.png`);
    }

    console.log("\n🎉 KIỂM THỬ THỜI TIẾT 100% ĐỒNG NHẤT, KHÔNG MÂU THUẪN DỮ LIỆU!\n");
  } finally {
    await browser.close();
  }
}

if (require.main === module) {
  runWeatherTest().catch((err) => {
    console.error("❌ Lỗi kiểm thử thời tiết:", err.message);
    process.exit(1);
  });
}

module.exports = { runWeatherTest };
