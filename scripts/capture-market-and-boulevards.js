const { chromium } = require("playwright");

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

  await page.click("#join-screen .join-btn");
  await page.waitForTimeout(2000);

  // 1. Walk around the fountain to the North (to Chợ Bến Thành market stalls)
  // Steer slightly left, walk forward, steer right, walk forward
  await page.keyboard.down("KeyA");
  await page.waitForTimeout(1000);
  await page.keyboard.up("KeyA");

  await page.keyboard.down("KeyW");
  await page.waitForTimeout(5000);
  await page.keyboard.up("KeyW");

  await page.keyboard.down("KeyD");
  await page.waitForTimeout(1000);
  await page.keyboard.up("KeyD");

  await page.keyboard.down("KeyW");
  await page.waitForTimeout(4000);
  await page.keyboard.up("KeyW");
  await page.waitForTimeout(500);

  // Take screenshot in front of Chợ Bến Thành and market stalls
  await page.screenshot({ path: "docs/evidence/walk_06_benthanh_market_stalls.png" });

  // 2. Walk to West Heritage Avenue
  await page.keyboard.down("KeyA");
  await page.waitForTimeout(6000);
  await page.keyboard.up("KeyA");
  await page.waitForTimeout(500);
  await page.screenshot({ path: "docs/evidence/walk_07_west_heritage_avenue.png" });

  // 3. Walk to East Commercial Avenue
  await page.keyboard.down("KeyD");
  await page.waitForTimeout(12000);
  await page.keyboard.up("KeyD");
  await page.waitForTimeout(500);
  await page.screenshot({ path: "docs/evidence/walk_08_east_commercial_avenue.png" });

  console.log("Market & Boulevards captures complete!");
  await browser.close();
})();
