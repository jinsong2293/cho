const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");

(async () => {
  const browser = await chromium.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-gpu", "--use-gl=swiftshader"],
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    deviceScaleFactor: 1,
  });

  const page = await context.newPage();
  const TEST_PORT = process.env.TEST_PORT || 34567;
  await page.goto(`http://127.0.0.1:${TEST_PORT}/`, { waitUntil: "networkidle" });

  // Join game
  await page.click("#join-screen .join-btn");
  await page.waitForTimeout(2000);

  // Screenshot 1: Spawn position
  await page.screenshot({ path: "docs/evidence/walk_01_spawn.png" });

  // Look around / walk north towards Ben Thanh
  await page.keyboard.down("KeyW");
  await page.waitForTimeout(2500);
  await page.keyboard.up("KeyW");
  await page.waitForTimeout(500);
  await page.screenshot({ path: "docs/evidence/walk_02_north_benthanh.png" });

  // Walk south towards river & tea table
  await page.keyboard.down("KeyS");
  await page.waitForTimeout(5000);
  await page.keyboard.up("KeyS");
  await page.waitForTimeout(500);
  await page.screenshot({ path: "docs/evidence/walk_03_south_river.png" });

  // Walk west towards Heritage Avenue
  await page.keyboard.down("KeyA");
  await page.waitForTimeout(4000);
  await page.keyboard.up("KeyA");
  await page.waitForTimeout(500);
  await page.screenshot({ path: "docs/evidence/walk_04_west_heritage.png" });

  // Walk east towards Commercial Avenue & Player House
  await page.keyboard.down("KeyD");
  await page.waitForTimeout(7000);
  await page.keyboard.up("KeyD");
  await page.waitForTimeout(500);
  await page.screenshot({ path: "docs/evidence/walk_05_east_commercial.png" });

  console.log("Walkaround captures completed!");
  await browser.close();
})();
