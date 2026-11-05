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

  const uniqueName = `KTS_${Math.floor(Math.random() * 89999 + 10000)}`;
  await page.fill("#nickname-input", uniqueName);
  await page.click("#join-screen .join-btn");
  await page.waitForTimeout(3000);

  // 1. Kiểm tra các công trình kiến trúc trong Three.js scene
  const sceneAudit = await page.evaluate(() => {
    const scene = window.scene;
    if (!scene) return { error: "scene is missing" };

    const childNames = scene.children.map(c => c.name || c.type);
    const hasEstate = Boolean(window.playerEstateGroup);
    const hasResidentialQuarter = Boolean(window.residentialQuarterGroup);
    const hasNightStage = Boolean(window.openStageGroup || scene.getObjectByName("nightStageGroup"));
    const hasWishingTree = Boolean(window.wishingTreeGroup);
    const hasCraftGarden = Boolean(window.craftGardenGroup);

    return {
      totalObjects: scene.children.length,
      hasEstate,
      hasResidentialQuarter,
      hasNightStage,
      hasWishingTree,
      hasCraftGarden,
    };
  });

  console.log("🔍 Scene Architectural Audit:", JSON.stringify(sceneAudit, null, 2));

  // 2. Di chuyển đến Khu Dân Cư Phố Mới (48, 22)
  console.log("📸 Di chuyển tới Khu Dân Cư & Sàn Bất Động Sản (48, 22)...");
  await page.evaluate(() => {
    if (window.myPlayer) {
      window.myPlayer.pos.x = 42;
      window.myPlayer.pos.z = 22;
      if (window.camera && window.controls) {
        window.camera.position.set(38, 5, 22);
        window.controls.target.set(48, 2, 22);
        window.controls.update();
      }
    }
  });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: "docs/evidence/housing_01_model_house_and_quarter.png" });

  // 3. Mở Modal Mua Nhà & Nâng Cấp Nhà
  console.log("🏠 Thử tương tác Mở Modal Bất Động Sản & Mua Nhà...");
  await page.evaluate(() => {
    if (typeof window.openHouseModal === "function") {
      window.openHouseModal();
    }
  });
  await page.waitForTimeout(1000);
  const isModalOpen = await page.isVisible("#modal-house");
  console.log("   ✓ Modal Mua Nhà mở thành công:", isModalOpen);
  await page.screenshot({ path: "docs/evidence/housing_02_house_modal.png" });

  // Mua nhà level 1 (Nhà Mái Lá)
  await page.evaluate(() => {
    if (typeof window.buyOrUpgradeHouseNow === "function") {
      // Đảm bảo có đủ tiền để mua
      if (window.myPlayer) window.myPlayer.money = 50000;
      window.buyOrUpgradeHouseNow();
    }
  });
  await page.waitForTimeout(1000);

  // Đóng modal để ngắm căn nhà vừa mua
  await page.evaluate(() => {
    if (typeof window.closeModal === "function") window.closeModal("modal-house");
    if (window.camera && window.controls) {
      window.camera.position.set(48, 4.5, 12);
      window.controls.target.set(48, 2, 22);
      window.controls.update();
    }
  });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: "docs/evidence/housing_03_purchased_house.png" });

  // 4. Chụp ảnh Quảng Trường Ẩm Thực Đêm & Sân Khấu (0, -85)
  console.log("📸 Chụp ảnh Quảng Trường Sân Khấu Ẩm Thực Đêm (0, -85)...");
  await page.evaluate(() => {
    if (window.myPlayer) {
      window.myPlayer.pos.x = 0;
      window.myPlayer.pos.z = -70;
      if (window.camera && window.controls) {
        window.camera.position.set(0, 6, -65);
        window.controls.target.set(0, 2, -85);
        window.controls.update();
      }
    }
  });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: "docs/evidence/arch_01_night_food_stage.png" });

  // 5. Chụp ảnh Công Viên Hồ Sen & Đình Thủy Tạ (-78, 12)
  console.log("📸 Chụp ảnh Công Viên Hồ Sen & Đình Thủy Tạ (-78, 12)...");
  await page.evaluate(() => {
    if (window.myPlayer) {
      window.myPlayer.pos.x = -65;
      window.myPlayer.pos.z = 12;
      if (window.camera && window.controls) {
        window.camera.position.set(-60, 6, 12);
        window.controls.target.set(-78, 2, 12);
        window.controls.update();
      }
    }
  });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: "docs/evidence/arch_02_lotus_water_pavilion.png" });

  // 6. Chụp ảnh Đỉnh Núi Chùa Đồng Tây Bắc (-580, -540)
  console.log("📸 Chụp ảnh Đỉnh Núi Chùa Đồng & Cổng Trời Tây Bắc (-580, -540)...");
  await page.evaluate(() => {
    if (window.myPlayer) {
      window.myPlayer.pos.x = -580;
      window.myPlayer.pos.z = -510;
      if (window.camera && window.controls) {
        window.camera.position.set(-580, 16, -500);
        window.controls.target.set(-580, 8, -540);
        window.controls.update();
      }
    }
  });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: "docs/evidence/arch_03_mountain_pagoda.png" });

  // 7. Chụp ảnh Công Viên Vòng Quay Mặt Trời Đông Bắc (580, -540)
  console.log("📸 Chụp ảnh Công Viên Vòng Quay Mặt Trời Đông Bắc (580, -540)...");
  await page.evaluate(() => {
    if (window.myPlayer) {
      window.myPlayer.pos.x = 580;
      window.myPlayer.pos.z = -510;
      if (window.camera && window.controls) {
        window.camera.position.set(580, 20, -490);
        window.controls.target.set(580, 18, -540);
        window.controls.update();
      }
    }
  });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: "docs/evidence/arch_04_sun_wheel.png" });

  console.log("🎉 Hoàn tất kiểm thử & chụp ảnh toàn bộ kiến trúc và nhà ở!");
  await browser.close();
})();
