/*
 * Town Expansion, Open Playground Social Systems, Accessibility, 4 Outer 3D Zones,
 * Green Bus, Activities Hub, Photo Mode, and Performance Profiler (Phases 2–12)
 */

(function (root) {
  const VIETNAMESE_CUTE_NAMES = [
    "Chú Tư Nón Lá",
    "Cô Ba Bánh Mì",
    "Bé Tư Trà Đá",
    "Anh Bảy Đá Cầu",
    "Chị Năm Hoa Sen",
    "Chú Sáu Xích Lô",
    "Cô Tám Chè Đậu",
    "Út Minh Sầu Riêng",
    "Bác Ba Cờ Tướng",
    "Cô Út Áo Dài",
  ];

  const CHARACTER_PRESETS = [
    { id: 0, label: "👒 Nón Lá · Bà Ba Vàng", icon: "👒", short: "Bà Ba Vàng", hat: "non_la", outfit: "ba_ba", color: 0xf59e0b },
    { id: 1, label: "👘 Nón Lá · Áo Dài Đỏ", icon: "👘", short: "Áo Dài Đỏ", hat: "non_la", outfit: "ao_dai", color: 0xdc2626 },
    { id: 2, label: "🛵 Mũ BH · Áo Thun Xanh", icon: "🛵", short: "Áo Thun Xanh", hat: "helmet", outfit: "ao_thun", color: 0x0284c7 },
    { id: 3, label: "🎀 Khăn Rằn · Bà Ba Ngọc", icon: "🎀", short: "Khăn Rằn Ngọc", hat: "bandana", outfit: "ba_ba", color: 0x059669 },
    { id: 4, label: "🌸 Nón Lá · Áo Dài Tím", icon: "🌸", short: "Áo Dài Tím", hat: "non_la", outfit: "ao_dai", color: 0x9333ea },
    { id: 5, label: "⚡ Mũ BH · Áo Thun Cam", icon: "⚡", short: "Áo Thun Cam", hat: "helmet", outfit: "ao_thun", color: 0xea580c },
  ];

  const COLLECTION_CATALOG = [
    { id: "zone_central_market", cat: "Địa danh", icon: "🏮", name: "Khu Chợ Trung Tâm" },
    { id: "zone_night_food_stage", cat: "Địa danh", icon: "🎤", name: "Phố Ẩm Thực Đêm & Sân Khấu" },
    { id: "zone_lotus_park_village", cat: "Địa danh", icon: "🪷", name: "Công Viên Hồ Sen & Sân Làng" },
    { id: "zone_craft_village_garden", cat: "Địa danh", icon: "🌱", name: "Làng Nghề & Vườn Cộng Đồng" },
    { id: "zone_floating_market_hill", cat: "Địa danh", icon: "🚤", name: "Chợ Nổi & Đồi Ngắm Cảnh" },
    { id: "zone_quiet_lotus_corner", cat: "Địa danh", icon: "🌿", name: "Góc Yên Tĩnh Hồ Sen" },
    { id: "zone_kite_meadow_nw", cat: "Địa danh", icon: "🪁", name: "Đồi Thả Diều & Sân Cỏ Tây Bắc" },
    { id: "zone_flower_valley_ne", cat: "Địa danh", icon: "🌸", name: "Thung Lũng Hoa Xuân Đông Bắc" },
    { id: "zone_coconut_canal_sw", cat: "Địa danh", icon: "🥥", name: "Rạch Dừa Nước & Cầu Khỉ Tây Nam" },
    { id: "zone_orchard_hill_se", cat: "Địa danh", icon: "🍈", name: "Đồi Miệt Vườn Trái Cây Đông Nam" },
    { id: "zone_mountain_pagoda_nw", cat: "Địa danh 20x", icon: "⛰️", name: "Đỉnh Núi Chùa Đồng & Cổng Trời Tây Bắc" },
    { id: "zone_sun_wheel_park_ne", cat: "Địa danh 20x", icon: "🎡", name: "Công Viên Vòng Quay Mặt Trời Đông Bắc" },
    { id: "zone_lighthouse_bay_sw", cat: "Địa danh 20x", icon: "🗼", name: "Vịnh Hải Đăng & Bãi Biển Tây Nam" },
    { id: "zone_golden_dragon_island_se", cat: "Địa danh 20x", icon: "🐉", name: "Đảo Rồng Vàng & Thủy Đình Đông Nam" },
    { id: "food_tra_da", cat: "Ẩm thực", icon: "☕", name: "Trà Đá Hạt Hướng Dương" },
    { id: "food_bread", cat: "Ẩm thực", icon: "🥖", name: "Bánh Mì Sài Gòn Giòn Rụm" },
    { id: "food_cake", cat: "Ẩm thực", icon: "🍜", name: "Phở Bò Gia Truyền" },
    { id: "game_dacau", cat: "Trò chơi", icon: "🪶", name: "Đá Cầu Kiểng Tập Thể" },
    { id: "game_keoco", cat: "Trò chơi", icon: "🪢", name: "Kéo Co Sân Làng" },
    { id: "game_stage", cat: "Trò chơi", icon: "🎶", name: "Biểu Diễn Sân Khấu Đêm" },
    { id: "craft_banhchung", cat: "Làng nghề", icon: "🫔", name: "Nấu Bánh Chưng Xanh" },
    { id: "craft_garden", cat: "Làng nghề", icon: "🌻", name: "Tưới Hoa Vườn Cộng Đồng" },
    { id: "wish_lantern", cat: "Lễ hội", icon: "🏮", name: "Thả Đèn Hoa Đăng Ước Nguyện" },
  ];

  // Trạng thái mở rộng
  let expandedZonesBuilt = false;
  let nightStageGroup = null;
  let lotusParkGroup = null;
  let craftVillageGroup = null;
  let floatingMarketGroup = null;
  let kiteMeadowGroup = null;
  let flowerValleyGroup = null;
  let coconutCanalGroup = null;
  let orchardHillGroup = null;
  let mountainPagodaGroup = null;
  let sunWheelParkGroup = null;
  let sunWheelRotor = null;
  let lighthouseBayGroup = null;
  let goldenDragonIslandGroup = null;
  let greenBusMesh = null;
  let rainbowMesh = null;
  let kiteMeshes = [];
  let floatingLanternMeshes = [];
  let busTargetPos = { x: 0, z: 18 };
  let isRidingGreenBus = false;

  let currentChatFilterTab = "all"; // "all" | "system"
  let unreadChatCount = 0;
  let graphicsTier = "high"; // "low" | "medium" | "high"
  let fpsSampleFrames = 0;
  let fpsSampleTime = 0;
  let currentFps = 60;
  let autoQualityChecked = false;
  let deferredInstallPrompt = null;

  /* ==================== 1. ONBOARDING < 10 GIÂY (PHASE 2) ==================== */
  function initOnboardingJoinScreen() {
    const nickInput = document.getElementById("nickname-input");
    if (nickInput && !nickInput.value.trim()) {
      const saved = localStorage.getItem("last_nickname");
      if (saved) {
        nickInput.value = saved;
      } else {
        rollRandomNickname(false);
      }
    }

    // Tự điền mã phòng từ URL (?room=ABCD)
    const params = new URLSearchParams(window.location.search);
    const roomParam = params.get("room");
    const roomInput = document.getElementById("room-code-input");
    if (roomParam && roomInput) {
      roomInput.value = roomParam.trim().toUpperCase().slice(0, 12);
    }

    // Dựng 6 thẻ chọn nhân vật nhanh
    const presetContainer = document.getElementById("onboarding-preset-grid");
    if (presetContainer) {
      presetContainer.innerHTML = "";
      presetContainer.setAttribute("role", "radiogroup");
      CHARACTER_PRESETS.forEach((p, idx) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = `preset-card ${idx === 0 ? "active" : ""}`;
        btn.setAttribute("role", "radio");
        btn.setAttribute("aria-checked", idx === 0 ? "true" : "false");
        btn.setAttribute("aria-label", p.label);
        const avatar = document.createElement("span");
        avatar.className = "preset-avatar";
        avatar.style.background = "#" + Number(p.color).toString(16).padStart(6, "0");
        avatar.textContent = p.icon;
        const textSpan = document.createElement("span");
        textSpan.textContent = p.short || p.label;
        btn.appendChild(avatar);
        btn.appendChild(textSpan);
        btn.onclick = () => selectCharacterPreset(idx, btn);
        presetContainer.appendChild(btn);
      });
    }

    // Có mã phòng trong link mời → mở sẵn mục "mã phòng" để người chơi thấy mình được mời vào đâu
    if (roomParam) {
      const more = document.getElementById("join-more");
      if (more) more.open = true;
    }

    // Trên điện thoại KHÔNG tự bật bàn phím (che mất nhân vật và nút Vào chợ)
    const nickInputEl = document.getElementById("nickname-input");
    if (nickInputEl && !(window.matchMedia && window.matchMedia("(pointer: coarse)").matches)) {
      nickInputEl.focus();
    }

    // Áp dụng ngôn ngữ đã lưu ngay khi tải trang
    if (typeof root.applyI18nToDOM === "function") root.applyI18nToDOM();

    // Lấy số người đang online từ /api/online
    fetch("/api/online")
      .then((r) => r.json())
      .then((data) => {
        const count = Math.max(1, (data.onlinePlayers || 0) + 12); // Bao gồm cả cư dân thị trấn
        const badge = document.getElementById("online-count-banner") || document.getElementById("join-online-badge");
        if (badge) {
          badge.textContent = typeof root.t === "function" ? root.t("join_online", { count }) : `🟢 ${count} bà con & cư dân đang dạo chợ`;
        }
      })
      .catch(() => {});

    // Phím Enter vào chơi ngay từ mọi nơi trên màn hình chào
    window.addEventListener("keydown", (e) => {
      const joinScreen = document.getElementById("join-screen");
      if (e.key === "Enter" && joinScreen && joinScreen.classList.contains("active")) {
        if (document.activeElement && document.activeElement.tagName === "BUTTON") return;
        if (typeof root.joinGame === "function") root.joinGame();
      } else if (e.key === "Escape") {
        document.querySelectorAll(".modal-overlay.active").forEach((m) => {
          m.classList.remove("active");
        });
        if (document.body.classList.contains("photo-mode")) {
          togglePhotoMode(false);
        }
      }
    });
  }

  function rollRandomNickname(toast = true) {
    const base = VIETNAMESE_CUTE_NAMES[Math.floor(Math.random() * VIETNAMESE_CUTE_NAMES.length)];
    const num = Math.floor(100 + Math.random() * 899);
    const chosen = `${base.slice(0, 14).trim()} ${num}`;
    const nickInput = document.getElementById("nickname-input");
    if (nickInput) {
      nickInput.value = chosen;
      try {
        localStorage.setItem("last_nickname", chosen);
      } catch (_) {}
    }
    if (toast && typeof root.showToast === "function") {
      root.showToast(`🎲 Gợi ý tên mới: ${chosen}`);
    }
  }

  function selectCharacterPreset(idx, btnEl) {
    const preset = CHARACTER_PRESETS[idx] || CHARACTER_PRESETS[0];
    if (root.myCustomization) {
      root.myCustomization.hat = preset.hat;
      root.myCustomization.outfit = preset.outfit;
      root.myCustomization.color = preset.color;
    }
    document.querySelectorAll("#onboarding-preset-grid .preset-card").forEach((b) => {
      b.classList.remove("active");
      b.setAttribute("aria-checked", "false");
    });
    if (btnEl) {
      btnEl.classList.add("active");
      btnEl.setAttribute("aria-checked", "true");
    }
  }

  /* ==================== 2. XÂY DỰNG 12 ĐẠI KHU VỰC MỞ RỘNG 5X–20X & XE BUÝT XANH (PHASE 8–12) ==================== */
  function buildExpandedTownZones() {
    if (expandedZonesBuilt || typeof THREE === "undefined" || !root.scene) return;
    expandedZonesBuilt = true;
    const scene = root.scene;

    buildNorthNightFoodStage(scene, 0, -44);
    buildWestLotusParkAndVillageYard(scene, -38, 0);
    buildEastCraftVillageAndGarden(scene, 38, 0);
    buildSouthFloatingMarketAndHill(scene, 0, 40);

    // 4 Đại Khu Ngoại Ô trên Vành Đai 5x (±140m, ±130m)
    buildNorthwestKiteMeadow(scene, -140, -130);
    buildNortheastFlowerValley(scene, 140, -130);
    buildSouthwestCoconutCanal(scene, -140, 120);
    buildSoutheastOrchardHill(scene, 140, 120);

    // 4 Đại Kỳ Quan Viễn Chinh trên Vành Đai Đại Lộ 20x (±580m, ±540m)
    buildNorthwestMountainPagoda(scene, -580, -540);
    buildNortheastSunWheelPark(scene, 580, -540);
    buildSouthwestLighthouseBay(scene, -580, 520);
    buildSoutheastGoldenDragonIsland(scene, 580, 520);

    buildCircularGreenBus3D(scene);
  }

  // 9.1 Khu Bắc: Phố Ẩm Thực Đêm & Sân Khấu Loa Phường Mở Rộng (0, -44)
  function buildNorthNightFoodStage(scene, x, z) {
    const group = new THREE.Group();
    group.position.set(x, 0, z);

    const floor = new THREE.Mesh(
      new THREE.CylinderGeometry(14.5, 15.2, 0.22, 36),
      new THREE.MeshStandardMaterial({ color: 0x7f1d1d, roughness: 0.65 })
    );
    floor.position.y = 0.11;
    floor.receiveShadow = true;
    group.add(floor);

    const goldRing = new THREE.Mesh(
      new THREE.RingGeometry(13.8, 14.4, 36),
      new THREE.MeshBasicMaterial({ color: 0xfbbf24, side: THREE.DoubleSide })
    );
    goldRing.rotation.x = -Math.PI / 2;
    goldRing.position.y = 0.23;
    group.add(goldRing);

    // Bục sân khấu tròn lớn
    const stageDeck = new THREE.Mesh(
      new THREE.CylinderGeometry(5.6, 6.0, 0.82, 28),
      new THREE.MeshStandardMaterial({ color: 0xb91c1c, roughness: 0.42 })
    );
    stageDeck.position.set(0, 0.45, -3.6);
    stageDeck.receiveShadow = true;
    group.add(stageDeck);

    // Vòm ánh sáng đôi sân khấu đêm hội
    const arch1 = new THREE.Mesh(
      new THREE.TorusGeometry(5.4, 0.22, 12, 32, Math.PI),
      new THREE.MeshBasicMaterial({ color: 0xfacc15 })
    );
    arch1.position.set(0, 0.85, -4.0);
    group.add(arch1);

    const arch2 = new THREE.Mesh(
      new THREE.TorusGeometry(4.2, 0.16, 10, 28, Math.PI),
      new THREE.MeshBasicMaterial({ color: 0xf472b6 })
    );
    arch2.position.set(0, 0.85, -3.7);
    group.add(arch2);

    // Cặp Tháp Loa Đại Nhạc Hội hai bên cánh gà
    const speakerMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.5, metalness: 0.4 });
    [-6.2, 6.2].forEach((sx) => {
      const tower = new THREE.Mesh(new THREE.BoxGeometry(1.4, 3.6, 1.2), speakerMat);
      tower.position.set(sx, 1.9, -3.6);
      group.add(tower);
    });

    // Chân micro giữa bục
    const micStand = new THREE.Mesh(
      new THREE.CylinderGeometry(0.05, 0.08, 1.55, 8),
      new THREE.MeshStandardMaterial({ color: 0xf8fafc, metalness: 0.85 })
    );
    micStand.position.set(0, 1.6, -2.5);
    group.add(micStand);

    // 6 Xe đẩy ẩm thực đêm vây quanh quảng trường
    const cartConfigs = [
      { cx: -8.5, cz: 1.5, color: 0xd97706, roof: 0xdc2626, label: "🍢 XIÊN NƯỚNG" },
      { cx:  8.5, cz: 1.5, color: 0x0284c7, roof: 0xfacc15, label: "🍑 TRÀ ĐÀO CAM SẢ" },
      { cx: -10.5, cz: -3.2, color: 0x15803d, roof: 0xf97316, label: "🌽 BẮP NƯỚNG MỠ HÀNH" },
      { cx:  10.5, cz: -3.2, color: 0x9333ea, roof: 0xec4899, label: "🍕 BÁNH TRÁNG NƯỚNG" },
    ];
    cartConfigs.forEach((cc) => {
      const cartG = new THREE.Group();
      cartG.position.set(cc.cx, 0, cc.cz);
      const body = new THREE.Mesh(
        new THREE.BoxGeometry(2.6, 1.35, 1.55),
        new THREE.MeshStandardMaterial({ color: cc.color, roughness: 0.6 })
      );
      body.position.y = 0.8;
      cartG.add(body);
      const canopy = new THREE.Mesh(
        new THREE.ConeGeometry(1.9, 0.75, 4),
        new THREE.MeshStandardMaterial({ color: cc.roof, roughness: 0.5 })
      );
      canopy.rotation.y = Math.PI / 4;
      canopy.position.y = 2.45;
      cartG.add(canopy);
      if (typeof root.createTextSprite === "function") {
        const cSign = root.createTextSprite(cc.label, "#fef08a", "rgba(15, 23, 42, 0.9)");
        cSign.position.set(0, 3.1, 0);
        cSign.scale.set(3.2, 0.68, 1);
        cartG.add(cSign);
      }
      group.add(cartG);
    });

    if (typeof root.createTextSprite === "function") {
      const sign = root.createTextSprite("🎤 QUẢNG TRƯỜNG SÂN KHẤU PHỐ ĐÊM & KARAOKE (Chạm Biểu Diễn)", "#fef08a", "rgba(153, 27, 27, 0.95)");
      sign.position.set(0, 6.8, -3.6);
      sign.scale.set(7.6, 1.35, 1);
      group.add(sign);
    }

    scene.add(group);
    nightStageGroup = group;
    root.openStageGroup = group;
  }

  // 9.2 Khu Tây: Công Viên Hồ Sen, Thủy Tạ, Sân Làng Kéo Co & Góc Yên Tĩnh (-38, 0)
  function buildWestLotusParkAndVillageYard(scene, x, z) {
    const group = new THREE.Group();
    group.position.set(x, 0, z);

    // Mặt hồ sen xanh ngọc mở rộng (Bán kính 13.5m)
    const pond = new THREE.Mesh(
      new THREE.CircleGeometry(13.5, 36),
      new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.18, metalness: 0.55 })
    );
    pond.rotation.x = -Math.PI / 2;
    pond.position.set(-10, 0.04, 11);
    group.add(pond);

    // Đình Thủy Tạ Giữa Hồ Sen & Cầu Gỗ Đỏ
    const woodMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.7 });
    const redMat = new THREE.MeshStandardMaterial({ color: 0xb91c1c, roughness: 0.45 });
    const gazeboDeck = new THREE.Mesh(new THREE.CylinderGeometry(3.2, 3.4, 0.4, 8), woodMat);
    gazeboDeck.position.set(-10, 0.25, 11);
    group.add(gazeboDeck);

    const gazeboRoof = new THREE.Mesh(new THREE.ConeGeometry(4.0, 1.8, 8), redMat);
    gazeboRoof.position.set(-10, 3.6, 11);
    group.add(gazeboRoof);

    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      const col = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 2.8, 8), redMat);
      col.position.set(-10 + Math.cos(a) * 2.6, 1.6, 11 + Math.sin(a) * 2.6);
      group.add(col);
    }

    const pondBridge = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.2, 8.5), redMat);
    pondBridge.position.set(-6.5, 0.22, 6.2);
    pondBridge.rotation.y = -0.5;
    group.add(pondBridge);

    // 16 Lá sen & Hoa sen hồng nở trên hồ
    const leafMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.7 });
    const lotusMat = new THREE.MeshStandardMaterial({ color: 0xf472b6, emissive: 0x831843, emissiveIntensity: 0.25 });
    for (let i = 0; i < 16; i++) {
      const ang = (i / 16) * Math.PI * 2;
      const r = 4.6 + (i % 4) * 2.1;
      const lx = -10 + Math.cos(ang) * r;
      const lz = 11 + Math.sin(ang) * r;

      const pad = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.75, 0.05, 12), leafMat);
      pad.position.set(lx, 0.07, lz);
      group.add(pad);

      const bloom = new THREE.Mesh(new THREE.ConeGeometry(0.36, 0.5, 8), lotusMat);
      bloom.position.set(lx, 0.3, lz);
      group.add(bloom);
    }

    // Sân Đấu Kéo Co Liên Xã (Nền cát vàng + Dây thừng khổng lồ + Cờ 2 Đội)
    const sandArena = new THREE.Mesh(
      new THREE.BoxGeometry(16, 0.1, 7.5),
      new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.9 })
    );
    sandArena.position.set(0, 0.05, -7);
    group.add(sandArena);

    const rope = new THREE.Mesh(
      new THREE.CylinderGeometry(0.12, 0.12, 13.5, 12),
      new THREE.MeshStandardMaterial({ color: 0xb45309, roughness: 0.85 })
    );
    rope.rotation.z = Math.PI / 2;
    rope.position.set(0, 0.52, -7);
    group.add(rope);

    const redRibbon = new THREE.Mesh(
      new THREE.SphereGeometry(0.32, 10, 10),
      new THREE.MeshBasicMaterial({ color: 0xef4444 })
    );
    redRibbon.position.set(0, 0.56, -7);
    group.add(redRibbon);

    // 6 Cánh diều sáo bay lượn trên bầu trời Sân Làng
    const kiteColors = [0xef4444, 0xfacc15, 0x38bdf8, 0x10b981, 0xec4899, 0xf97316];
    kiteColors.forEach((col, idx) => {
      const kite = new THREE.Mesh(
        new THREE.ConeGeometry(1.05, 1.85, 4),
        new THREE.MeshStandardMaterial({ color: col, side: THREE.DoubleSide })
      );
      kite.position.set(-8 + idx * 3.8, 13 + (idx % 3) * 2.4, -4 + (idx % 2) * 5);
      kite.rotation.z = 0.4;
      group.add(kite);
      kiteMeshes.push({ mesh: kite, baseY: 13 + (idx % 3) * 2.4, phase: idx * 1.4 });
    });

    if (typeof root.createTextSprite === "function") {
      const sign = root.createTextSprite("🪷 CÔNG VIÊN HỒ SEN & ĐẤU TRƯỜNG KÉO CO (Chạm Chơi Dân Gian)", "#fbcfe8", "rgba(15, 118, 110, 0.95)");
      sign.position.set(0, 5.6, -3);
      sign.scale.set(7.4, 1.3, 1);
      group.add(sign);

      const quietSign = root.createTextSprite("🌿 ĐÌNH THỦY TẠ & GÓC YÊN TĨNH HỒ SEN", "#a7f3d0", "rgba(6, 78, 59, 0.92)");
      quietSign.position.set(-10, 5.2, 11);
      quietSign.scale.set(5.8, 1.05, 1);
      group.add(quietSign);
    }

    scene.add(group);
    lotusParkGroup = group;
    root.wishingTreeGroup = group;
  }

  // 9.3 Khu Đông: Làng Nghề, Vườn Cộng Đồng & Cây Đa Ước Nguyện (38, 0)
  function buildEastCraftVillageAndGarden(scene, x, z) {
    const group = new THREE.Group();
    group.position.set(x, 0, z);

    // Luống đất Vườn Hoa Cộng Đồng mở rộng (13m x 9m)
    const soil = new THREE.Mesh(
      new THREE.BoxGeometry(12.5, 0.25, 8.5),
      new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.9 })
    );
    soil.position.set(6, 0.12, 6.5);
    group.add(soil);

    const flowerColors = [0xfacc15, 0xf43f5e, 0xa855f7, 0x38bdf8];
    for (let gx = -4.5; gx <= 4.5; gx += 1.8) {
      for (let gz = -2.8; gz <= 2.8; gz += 1.8) {
        const stem = new THREE.Mesh(
          new THREE.CylinderGeometry(0.08, 0.1, 0.85, 6),
          new THREE.MeshStandardMaterial({ color: 0x16a34a })
        );
        stem.position.set(6 + gx, 0.52, 6.5 + gz);
        group.add(stem);

        const cIdx = Math.abs(Math.round(gx + gz)) % flowerColors.length;
        const blossom = new THREE.Mesh(
          new THREE.SphereGeometry(0.34, 8, 8),
          new THREE.MeshStandardMaterial({ color: flowerColors[cIdx], roughness: 0.45 })
        );
        blossom.position.set(6 + gx, 1.02, 6.5 + gz);
        group.add(blossom);
      }
    }

    // Cây Đa Ước Nguyện Ngàn Năm treo dải lụa đỏ
    const trunk = new THREE.Mesh(
      new THREE.CylinderGeometry(0.85, 1.35, 5.2, 10),
      new THREE.MeshStandardMaterial({ color: 0x5c4033, roughness: 0.85 })
    );
    trunk.position.set(12, 2.6, -6);
    group.add(trunk);

    const canopy = new THREE.Mesh(
      new THREE.DodecahedronGeometry(3.8, 1),
      new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.7, flatShading: true })
    );
    canopy.position.set(12, 6.2, -6);
    group.add(canopy);

    // Bếp Nấu Bánh Chưng Hợp Tác Cỡ Lớn
    const fireGlow = new THREE.Mesh(
      new THREE.ConeGeometry(1.15, 1.25, 12),
      new THREE.MeshBasicMaterial({ color: 0xf97316 })
    );
    fireGlow.position.set(2, 0.55, -4.5);
    group.add(fireGlow);

    const pot = new THREE.Mesh(
      new THREE.CylinderGeometry(1.35, 1.2, 1.45, 18),
      new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.6, roughness: 0.4 })
    );
    pot.position.set(2, 1.05, -4.5);
    group.add(pot);

    if (typeof root.createTextSprite === "function") {
      const sign = root.createTextSprite("🌱 LÀNG NGHỀ, VƯỜN HOA & CÂY ĐA ƯỚC NGUYỆN (Chạm Hợp Tác)", "#fef08a", "rgba(21, 128, 61, 0.95)");
      sign.position.set(5, 5.8, 0);
      sign.scale.set(7.4, 1.3, 1);
      group.add(sign);
    }

    scene.add(group);
    craftVillageGroup = group;
    root.craftGardenGroup = group;
  }

  // 9.4 Khu Nam: Chợ Nổi Bến Sông, Đồi Ngắm Cảnh Bờ Nam & Cầu Vồng (0, 40)
  function buildSouthFloatingMarketAndHill(scene, x, z) {
    const group = new THREE.Group();
    group.position.set(x, 0, z);

    // 6 Ghe thuyền Chợ Nổi chở đầy trái cây trên dòng sông
    [-38, -22, -9, 9, 22, 38].forEach((bx, idx) => {
      const boat = new THREE.Mesh(
        new THREE.BoxGeometry(4.4, 0.62, 1.65),
        new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.75 })
      );
      boat.position.set(bx, 0.25, 6 + (idx % 2) * 5);
      group.add(boat);
    });

    // Đồi Ngắm Cảnh Bờ Nam Qua Cầu (x = 0, z = 42 -> thế giới z = 82)
    const hill = new THREE.Mesh(
      new THREE.ConeGeometry(16, 8.5, 24),
      new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.82 })
    );
    hill.position.set(0, 4.2, 42);
    group.add(hill);

    // Lầu Vọng Cảnh trên đỉnh Đồi Nam
    const pavRoof = new THREE.Mesh(
      new THREE.ConeGeometry(4.2, 2.2, 6),
      new THREE.MeshStandardMaterial({ color: 0xb91c1c, roughness: 0.5 })
    );
    pavRoof.position.set(0, 10.2, 42);
    group.add(pavRoof);

    // Cầu Vồng Rực Rỡ Sau Mưa bắc ngang bầu trời phía Nam
    const rainbow = new THREE.Mesh(
      new THREE.TorusGeometry(48, 1.1, 14, 56, Math.PI),
      new THREE.MeshBasicMaterial({ color: 0xf472b6, transparent: true, opacity: 0.55 })
    );
    rainbow.position.set(0, 2, 28);
    group.add(rainbow);
    rainbowMesh = rainbow;

    if (typeof root.createTextSprite === "function") {
      const hillSign = root.createTextSprite("🌅 ĐỒI NGẮM CẢNH BỜ NAM & CHỢ NỔI (Chạm Chụp Hình)", "#fef08a", "rgba(3, 105, 161, 0.95)");
      hillSign.position.set(0, 12.2, 42);
      hillSign.scale.set(7.6, 1.35, 1);
      group.add(hillSign);
    }

    scene.add(group);
    floatingMarketGroup = group;
    root.floatingMarketGroup = group;
  }

  // 9.5 Khu Tây Bắc Mới (-140, -130): Đồi Thả Diều & Thảo Nguyên Cỏ Xanh
  function buildNorthwestKiteMeadow(scene, x, z) {
    const group = new THREE.Group();
    group.position.set(x, 0, z);

    const meadowPad = new THREE.Mesh(
      new THREE.CircleGeometry(34, 36),
      new THREE.MeshStandardMaterial({ color: 0x166534, roughness: 0.85 })
    );
    meadowPad.rotation.x = -Math.PI / 2;
    meadowPad.position.y = 0.03;
    group.add(meadowPad);

    // Lầu Đón Gió Bát Giác ở trung tâm (-140, -130) khớp với collider kite_meadow_pavilion
    const woodMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.7 });
    const goldMat = new THREE.MeshStandardMaterial({ color: 0xfbbf24, roughness: 0.3, metalness: 0.6 });
    const base = new THREE.Mesh(new THREE.CylinderGeometry(4.0, 4.4, 0.55, 8), woodMat);
    base.position.y = 0.28;
    group.add(base);

    const roof = new THREE.Mesh(new THREE.ConeGeometry(5.2, 2.4, 8), goldMat);
    roof.position.y = 4.6;
    group.add(roof);

    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      const p = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.18, 3.6, 8), woodMat);
      p.position.set(Math.cos(a) * 3.4, 2.0, Math.sin(a) * 3.4);
      group.add(p);
    }

    // 8 Cánh Diều Khổng Lồ trên bầu trời Đồi Thả Diều
    const colors = [0xef4444, 0xfacc15, 0x38bdf8, 0xec4899, 0x10b981, 0xa855f7, 0xf97316, 0x06b6d4];
    colors.forEach((col, idx) => {
      const ang = (idx / colors.length) * Math.PI * 2;
      const kite = new THREE.Mesh(
        new THREE.ConeGeometry(1.6, 2.8, 4),
        new THREE.MeshStandardMaterial({ color: col, side: THREE.DoubleSide })
      );
      kite.position.set(Math.cos(ang) * 16, 16 + (idx % 3) * 3.5, Math.sin(ang) * 16);
      kite.rotation.z = 0.42;
      group.add(kite);
      kiteMeshes.push({ mesh: kite, baseY: 16 + (idx % 3) * 3.5, phase: idx * 1.1 });
    });

    if (typeof root.createTextSprite === "function") {
      const sign = root.createTextSprite("🪁 ĐỒI THẢ DIỀU & SÂN CỎ TÂY BẮC 🪁", "#fef08a", "rgba(21, 128, 61, 0.95)");
      sign.position.set(0, 7.2, 0);
      sign.scale.set(8.2, 1.45, 1);
      group.add(sign);
    }

    scene.add(group);
    kiteMeadowGroup = group;
    root.kiteMeadowGroup = group;
  }

  // 9.6 Khu Đông Bắc Mới (140, -130): Thung Lũng Hoa Đà Lạt & Cối Xay Gió
  function buildNortheastFlowerValley(scene, x, z) {
    const group = new THREE.Group();
    group.position.set(x, 0, z);

    const valleyPad = new THREE.Mesh(
      new THREE.CircleGeometry(34, 36),
      new THREE.MeshStandardMaterial({ color: 0x14532d, roughness: 0.85 })
    );
    valleyPad.rotation.x = -Math.PI / 2;
    valleyPad.position.y = 0.03;
    group.add(valleyPad);

    // Đài Hoa Mặt Trời & Cối Xay Gió trung tâm (140, -130) khớp với collider flower_valley_gazebo
    const tower = new THREE.Mesh(
      new THREE.CylinderGeometry(2.6, 3.8, 9.5, 12),
      new THREE.MeshStandardMaterial({ color: 0xfef3c7, roughness: 0.6 })
    );
    tower.position.y = 4.75;
    group.add(tower);

    const dome = new THREE.Mesh(
      new THREE.ConeGeometry(3.4, 2.6, 12),
      new THREE.MeshStandardMaterial({ color: 0xe11d48, roughness: 0.45 })
    );
    dome.position.y = 10.8;
    group.add(dome);

    // Các thảm hoa rực rỡ vây quanh
    const ringColors = [0xf43f5e, 0xfacc15, 0xc084fc, 0x38bdf8];
    ringColors.forEach((col, rIdx) => {
      const flowerRing = new THREE.Mesh(
        new THREE.RingGeometry(7 + rIdx * 5.2, 10.5 + rIdx * 5.2, 32),
        new THREE.MeshStandardMaterial({ color: col, roughness: 0.6, side: THREE.DoubleSide })
      );
      flowerRing.rotation.x = -Math.PI / 2;
      flowerRing.position.y = 0.06;
      group.add(flowerRing);
    });

    if (typeof root.createTextSprite === "function") {
      const sign = root.createTextSprite("🌸 THUNG LŨNG HOA XUÂN ĐÔNG BẮC 🌸", "#fef08a", "rgba(190, 24, 93, 0.95)");
      sign.position.set(0, 13.2, 0);
      sign.scale.set(8.2, 1.45, 1);
      group.add(sign);
    }

    scene.add(group);
    flowerValleyGroup = group;
    root.flowerValleyGroup = group;
  }

  // 9.7 Khu Tây Nam Mới (-140, 120): Rạch Dừa Nước & Cầu Khỉ Miền Tây
  function buildSouthwestCoconutCanal(scene, x, z) {
    const group = new THREE.Group();
    group.position.set(x, 0, z);

    const lagoon = new THREE.Mesh(
      new THREE.CircleGeometry(32, 36),
      new THREE.MeshStandardMaterial({ color: 0x0e7490, roughness: 0.2, metalness: 0.5 })
    );
    lagoon.rotation.x = -Math.PI / 2;
    lagoon.position.y = 0.04;
    group.add(lagoon);

    // Nhà Sàn Bến Dừa trung tâm (-140, 120) khớp với collider coconut_canal_dock
    const woodMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.75 });
    const thatchMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.9 });
    const dock = new THREE.Mesh(new THREE.BoxGeometry(8.5, 0.5, 6.5), woodMat);
    dock.position.y = 0.45;
    group.add(dock);

    const roof = new THREE.Mesh(new THREE.ConeGeometry(6.2, 2.8, 4), thatchMat);
    roof.rotation.y = Math.PI / 4;
    roof.position.y = 4.5;
    group.add(roof);

    // Cầu khỉ tre bắc qua rạch dừa
    const bambooBridge = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.18, 22), thatchMat);
    bambooBridge.position.set(0, 0.85, 12);
    group.add(bambooBridge);

    if (typeof root.createTextSprite === "function") {
      const sign = root.createTextSprite("🥥 RẠCH DỪA NƯỚC & CẦU KHỈ MIỀN TÂY 🥥", "#a7f3d0", "rgba(15, 118, 110, 0.95)");
      sign.position.set(0, 7.2, 0);
      sign.scale.set(8.2, 1.45, 1);
      group.add(sign);
    }

    scene.add(group);
    coconutCanalGroup = group;
    root.coconutCanalGroup = group;
  }

  // 9.8 Khu Đông Nam Mới (140, 120): Đồi Miệt Vườn Trái Cây Nam Bộ
  function buildSoutheastOrchardHill(scene, x, z) {
    const group = new THREE.Group();
    group.position.set(x, 0, z);

    const orchardPad = new THREE.Mesh(
      new THREE.CircleGeometry(34, 36),
      new THREE.MeshStandardMaterial({ color: 0x365314, roughness: 0.88 })
    );
    orchardPad.rotation.x = -Math.PI / 2;
    orchardPad.position.y = 0.03;
    group.add(orchardPad);

    // Nhà Vườn Trái Cây & Biểu Tượng Sầu Riêng Khổng Lồ (140, 120) khớp với collider orchard_hill_barn
    const woodMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.72 });
    const barn = new THREE.Mesh(new THREE.BoxGeometry(8.2, 3.6, 6.2), woodMat);
    barn.position.y = 1.8;
    group.add(barn);

    const giantDurian = new THREE.Mesh(
      new THREE.DodecahedronGeometry(2.4, 1),
      new THREE.MeshStandardMaterial({ color: 0x65a30d, roughness: 0.5, flatShading: true })
    );
    giantDurian.position.y = 5.8;
    group.add(giantDurian);

    // Vườn cây ăn trái trĩu quả xung quanh
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      const r = 14 + (i % 2) * 8;
      const tx = Math.cos(a) * r;
      const tz = Math.sin(a) * r;
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.45, 2.8, 8), woodMat);
      trunk.position.set(tx, 1.4, tz);
      group.add(trunk);
      const crown = new THREE.Mesh(
        new THREE.SphereGeometry(2.1, 10, 10),
        new THREE.MeshStandardMaterial({ color: i % 2 === 0 ? 0x15803d : 0x166534, roughness: 0.75 })
      );
      crown.position.set(tx, 3.6, tz);
      group.add(crown);
    }

    if (typeof root.createTextSprite === "function") {
      const sign = root.createTextSprite("🍈 ĐỒI MIỆT VƯỜN TRÁI CÂY ĐÔNG NAM 🍈", "#fef08a", "rgba(101, 163, 13, 0.95)");
      sign.position.set(0, 9.4, 0);
      sign.scale.set(8.2, 1.45, 1);
      group.add(sign);
    }

    scene.add(group);
    orchardHillGroup = group;
    root.orchardHillGroup = group;
  }

  // 9.9 Đại Kỳ Quan 20x Tây Bắc (-580, -540): Đỉnh Núi Chùa Đồng & Cổng Trời
  function buildNorthwestMountainPagoda(scene, x, z) {
    const group = new THREE.Group();
    group.position.set(x, 0, z);

    const basePlaza = new THREE.Mesh(
      new THREE.CircleGeometry(78, 48),
      new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.82 })
    );
    basePlaza.rotation.x = -Math.PI / 2;
    basePlaza.position.y = 0.04;
    group.add(basePlaza);

    // Núi đá bậc thang & Chùa Đồng trung tâm khớp với collider nw_bronze_pagoda (r = 12.0)
    const bronzeMat = new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.72, roughness: 0.28 });
    const stoneMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.85 });

    const mountainBase = new THREE.Mesh(new THREE.CylinderGeometry(8.5, 11.8, 4.5, 16), stoneMat);
    mountainBase.position.y = 2.25;
    group.add(mountainBase);

    const pagodaBody = new THREE.Mesh(new THREE.CylinderGeometry(5.6, 6.4, 5.2, 8), bronzeMat);
    pagodaBody.position.y = 7.1;
    group.add(pagodaBody);

    for (let t = 0; t < 3; t++) {
      const roof = new THREE.Mesh(new THREE.ConeGeometry(7.8 - t * 1.6, 2.4, 8), bronzeMat);
      roof.position.y = 10.4 + t * 2.5;
      group.add(roof);
    }

    // Cổng Trời Đôi phía Nam quảng trường
    [-16, 16].forEach((gx) => {
      const gatePillar = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.4, 16, 12), bronzeMat);
      gatePillar.position.set(gx, 8, 28);
      group.add(gatePillar);
    });

    if (typeof root.createTextSprite === "function") {
      const sign = root.createTextSprite("⛰️ ĐỈNH NÚI CHÙA ĐỒNG & CỔNG TRỜI TÂY BẮC ⛰️", "#fef08a", "rgba(180, 83, 9, 0.95)");
      sign.position.set(0, 18.5, 0);
      sign.scale.set(12.5, 2.1, 1);
      group.add(sign);
    }

    scene.add(group);
    mountainPagodaGroup = group;
    root.mountainPagodaGroup = group;
  }

  // 9.10 Đại Kỳ Quan 20x Đông Bắc (580, -540): Công Viên Vòng Quay Mặt Trời Khổng Lồ
  function buildNortheastSunWheelPark(scene, x, z) {
    const group = new THREE.Group();
    group.position.set(x, 0, z);

    const carnivalPad = new THREE.Mesh(
      new THREE.CircleGeometry(82, 48),
      new THREE.MeshStandardMaterial({ color: 0x311042, roughness: 0.72 })
    );
    carnivalPad.rotation.x = -Math.PI / 2;
    carnivalPad.position.y = 0.04;
    group.add(carnivalPad);

    const neonRing = new THREE.Mesh(
      new THREE.RingGeometry(76, 80, 48),
      new THREE.MeshBasicMaterial({ color: 0xf43f5e, side: THREE.DoubleSide })
    );
    neonRing.rotation.x = -Math.PI / 2;
    neonRing.position.y = 0.06;
    group.add(neonRing);

    // Chân đế Vòng Quay Mặt Trời khớp với collider ne_sun_wheel_base (18m x 10m)
    const steelMat = new THREE.MeshStandardMaterial({ color: 0xfef08a, metalness: 0.75, roughness: 0.25 });
    const basePlatform = new THREE.Mesh(
      new THREE.BoxGeometry(16.5, 2.2, 8.5),
      new THREE.MeshStandardMaterial({ color: 0xbe123c, roughness: 0.5 })
    );
    basePlatform.position.y = 1.1;
    group.add(basePlatform);

    // Trục đỡ chữ A cao 24m
    [-3.2, 3.2].forEach((pz) => {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.65, 24, 10), steelMat);
      leg.position.set(0, 12, pz);
      group.add(leg);
    });

    // Vòng quay Mặt Trời đường kính 36m xoay liên tục
    const rotor = new THREE.Group();
    rotor.position.set(0, 22, 0);
    const rim = new THREE.Mesh(
      new THREE.TorusGeometry(17.5, 0.55, 12, 40),
      new THREE.MeshBasicMaterial({ color: 0xfacc15 })
    );
    rotor.add(rim);

    const innerRim = new THREE.Mesh(
      new THREE.TorusGeometry(11.5, 0.32, 10, 32),
      new THREE.MeshBasicMaterial({ color: 0x38bdf8 })
    );
    rotor.add(innerRim);

    const cabinColors = [0xef4444, 0xf97316, 0xfacc15, 0x10b981, 0x38bdf8, 0xa855f7];
    for (let i = 0; i < 12; i++) {
      const ang = (i / 12) * Math.PI * 2;
      const spoke = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 35, 6), steelMat);
      spoke.rotation.z = ang;
      rotor.add(spoke);

      const cabin = new THREE.Mesh(
        new THREE.SphereGeometry(1.35, 12, 12),
        new THREE.MeshStandardMaterial({ color: cabinColors[i % cabinColors.length], roughness: 0.3 })
      );
      cabin.position.set(Math.cos(ang) * 17.5, Math.sin(ang) * 17.5, 0);
      rotor.add(cabin);
    }

    group.add(rotor);
    sunWheelRotor = rotor;

    if (typeof root.createTextSprite === "function") {
      const sign = root.createTextSprite("🎡 CÔNG VIÊN VÒNG QUAY MẶT TRỜI ĐÔNG BẮC 🎡", "#fef08a", "rgba(190, 18, 60, 0.95)");
      sign.position.set(0, 43, 0);
      sign.scale.set(13.5, 2.2, 1);
      group.add(sign);
    }

    scene.add(group);
    sunWheelParkGroup = group;
    root.sunWheelParkGroup = group;
  }

  // 9.11 Đại Kỳ Quan 20x Tây Nam (-580, 520): Vịnh Hải Đăng & Bãi Biển Cát Trắng
  function buildSouthwestLighthouseBay(scene, x, z) {
    const group = new THREE.Group();
    group.position.set(x, 0, z);

    // Bãi cát trắng & làn nước biển xanh ngọc
    const oceanLagoon = new THREE.Mesh(
      new THREE.CircleGeometry(84, 48),
      new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.22, metalness: 0.45 })
    );
    oceanLagoon.rotation.x = -Math.PI / 2;
    oceanLagoon.position.y = 0.03;
    group.add(oceanLagoon);

    const sandBeach = new THREE.Mesh(
      new THREE.CircleGeometry(54, 40),
      new THREE.MeshStandardMaterial({ color: 0xfde68a, roughness: 0.88 })
    );
    sandBeach.rotation.x = -Math.PI / 2;
    sandBeach.position.y = 0.05;
    group.add(sandBeach);

    // Ngọn Hải Đăng Đại Dương cao 28m khớp với collider sw_pearl_lighthouse (r = 9.5)
    const towerBase = new THREE.Mesh(
      new THREE.CylinderGeometry(5.2, 8.8, 4.0, 16),
      new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.8 })
    );
    towerBase.position.y = 2.0;
    group.add(towerBase);

    const towerBody = new THREE.Mesh(
      new THREE.CylinderGeometry(3.2, 4.8, 22, 16),
      new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.4 })
    );
    towerBody.position.y = 15.0;
    group.add(towerBody);

    const redStripe = new THREE.Mesh(
      new THREE.CylinderGeometry(3.75, 4.25, 6.5, 16),
      new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.4 })
    );
    redStripe.position.y = 15.0;
    group.add(redStripe);

    const beaconDome = new THREE.Mesh(
      new THREE.SphereGeometry(3.4, 16, 16),
      new THREE.MeshBasicMaterial({ color: 0xfef08a })
    );
    beaconDome.position.y = 27.5;
    group.add(beaconDome);

    if (typeof root.createTextSprite === "function") {
      const sign = root.createTextSprite("🗼 VỊNH HẢI ĐĂNG & BÃI BIỂN TÂY NAM 🗼", "#bae6fd", "rgba(3, 105, 161, 0.95)");
      sign.position.set(0, 33.5, 0);
      sign.scale.set(12.5, 2.1, 1);
      group.add(sign);
    }

    scene.add(group);
    lighthouseBayGroup = group;
    root.lighthouseBayGroup = group;
  }

  // 9.12 Đại Kỳ Quan 20x Đông Nam (580, 520): Đảo Rồng Vàng & Thủy Đình Lễ Hội
  function buildSoutheastGoldenDragonIsland(scene, x, z) {
    const group = new THREE.Group();
    group.position.set(x, 0, z);

    const jadeLake = new THREE.Mesh(
      new THREE.CircleGeometry(84, 48),
      new THREE.MeshStandardMaterial({ color: 0x065f46, roughness: 0.25, metalness: 0.45 })
    );
    jadeLake.rotation.x = -Math.PI / 2;
    jadeLake.position.y = 0.03;
    group.add(jadeLake);

    const islandDeck = new THREE.Mesh(
      new THREE.CircleGeometry(48, 40),
      new THREE.MeshStandardMaterial({ color: 0x7f1d1d, roughness: 0.65 })
    );
    islandDeck.rotation.x = -Math.PI / 2;
    islandDeck.position.y = 0.06;
    group.add(islandDeck);

    // Thủy Đình & Tượng Rồng Vàng khớp với collider se_golden_dragon_altar (r = 11.5)
    const goldMat = new THREE.MeshStandardMaterial({ color: 0xfbbf24, metalness: 0.82, roughness: 0.22 });
    const altarBase = new THREE.Mesh(new THREE.CylinderGeometry(8.2, 10.8, 3.6, 12), goldMat);
    altarBase.position.y = 1.8;
    group.add(altarBase);

    const dragonSpire = new THREE.Mesh(new THREE.TorusKnotGeometry(4.8, 1.15, 64, 12, 2, 3), goldMat);
    dragonSpire.position.y = 11.5;
    group.add(dragonSpire);

    if (typeof root.createTextSprite === "function") {
      const sign = root.createTextSprite("🐉 ĐẢO RỒNG VÀNG & THỦY ĐÌNH ĐÔNG NAM 🐉", "#fef08a", "rgba(153, 27, 27, 0.95)");
      sign.position.set(0, 21.5, 0);
      sign.scale.set(12.5, 2.1, 1);
      group.add(sign);
    }

    scene.add(group);
    goldenDragonIslandGroup = group;
    root.goldenDragonIslandGroup = group;
  }

  // 8.4 Xe Buýt Xanh Chạy Vòng Thị Trấn
  function buildCircularGreenBus3D(scene) {
    const busGroup = new THREE.Group();
    busGroup.position.set(0, 0, 18);

    const chassis = new THREE.Mesh(
      new THREE.BoxGeometry(2.6, 1.85, 4.4),
      new THREE.MeshStandardMaterial({ color: 0x10b981, roughness: 0.35, metalness: 0.2 })
    );
    chassis.position.y = 1.15;
    chassis.castShadow = true;
    busGroup.add(chassis);

    const roof = new THREE.Mesh(
      new THREE.BoxGeometry(2.4, 0.2, 4.2),
      new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.4 })
    );
    roof.position.y = 2.15;
    busGroup.add(roof);

    if (typeof root.createTextSprite === "function") {
      const sign = root.createTextSprite("🚌 XE BUÝT XANH THỊ TRẤN (Bấm Lên Xe)", "#a7f3d0", "rgba(6, 78, 59, 0.95)");
      sign.position.set(0, 3.1, 0);
      sign.scale.set(4.8, 0.95, 1);
      busGroup.add(sign);
    }

    scene.add(busGroup);
    greenBusMesh = busGroup;
  }

  function updateExpandedTown3D(dt, elapsedSec) {
    if (!expandedZonesBuilt) {
      buildExpandedTownZones();
    }

    if (sunWheelRotor) {
      sunWheelRotor.rotation.z = elapsedSec * 0.25;
    }

    // Chuyển động cánh diều bay trong gió
    kiteMeshes.forEach((k) => {
      k.mesh.position.y = k.baseY + Math.sin(elapsedSec * 2.2 + k.phase) * 0.65;
      k.mesh.rotation.z = 0.35 + Math.cos(elapsedSec * 1.8 + k.phase) * 0.15;
    });

    // Cập nhật vị trí Xe Buýt Xanh từ server
    const act = root.worldState && root.worldState.activities;
    if (act && act.greenBus && greenBusMesh) {
      const bx = act.greenBus.x || 0;
      const bz = act.greenBus.z || 18;
      const dx = bx - greenBusMesh.position.x;
      const dz = bz - greenBusMesh.position.z;
      greenBusMesh.position.x += dx * Math.min(1, dt * 5);
      greenBusMesh.position.z += dz * Math.min(1, dt * 5);
      if (Math.hypot(dx, dz) > 0.05) {
        greenBusMesh.rotation.y = Math.atan2(dx, dz);
      }

      if (isRidingGreenBus && root.myPlayer && root.myPlayer.mesh) {
        root.myPlayer.pos.x = greenBusMesh.position.x;
        root.myPlayer.pos.z = greenBusMesh.position.z;
        root.myPlayer.mesh.group.position.set(greenBusMesh.position.x, 0.35, greenBusMesh.position.z);
      }
    }

    // LOD đơn giản theo khoảng cách & Tự động kiểm tra FPS 5 giây đầu (Phase 4.4 & 8.6)
    fpsSampleFrames++;
    fpsSampleTime += dt;
    if (fpsSampleTime >= 1.0) {
      currentFps = Math.round(fpsSampleFrames / fpsSampleTime);
      fpsSampleFrames = 0;
      fpsSampleTime = 0;
      if (!autoQualityChecked && elapsedSec > 5.0) {
        autoQualityChecked = true;
        if (currentFps < 28) {
          setGraphicsQuality("low", false);
        } else if (currentFps < 45) {
          setGraphicsQuality("medium", false);
        }
      }
    }
  }

  /* ==================== 3. GIAO LƯU, PHÒNG RIÊNG, CHẶN/BÁO CÁO & CHAT (PHASE 1 & 3) ==================== */
  function sendQuickChat(text) {
    if (!root.socket) {
      if (typeof root.showToast === "function") root.showToast("Hãy vào chợ trước nhé!");
      return;
    }
    const ch = typeof root.activeChatChannel !== "undefined" ? root.activeChatChannel : "town";
    root.socket.emit("chat", { msg: text, channel: ch });
  }

  function switchChatTab(tab) {
    currentChatFilterTab = tab === "system" ? "system" : tab === "nearby" ? "nearby" : "all";
    root.__activeChatFilterTab = currentChatFilterTab;
    ["all", "nearby", "system"].forEach((k) => {
      const btn = document.getElementById(`chat-tab-${k}`);
      if (btn) btn.classList.toggle("active", k === currentChatFilterTab);
    });
    document.querySelectorAll(".chat-tab-btn").forEach((b) => {
      b.classList.toggle("active", b.getAttribute("data-tab") === currentChatFilterTab);
    });
    const box = document.getElementById("chat-messages");
    if (!box) return;
    box.querySelectorAll(".chat-msg").forEach((row) => {
      const ch = row.dataset.channel || (row.classList.contains("system") || row.classList.contains("buy") ? "system" : "town");
      if (currentChatFilterTab === "all") {
        row.style.display = "";
      } else if (currentChatFilterTab === "system") {
        row.style.display = ch === "system" || row.classList.contains("system") || row.classList.contains("buy") ? "" : "none";
      } else {
        row.style.display = ch === currentChatFilterTab ? "" : "none";
      }
    });
  }

  function createOrShareRoom() {
    if (!root.socket) {
      if (typeof root.showToast === "function") root.showToast("Hãy vào chợ trước khi tạo phòng riêng nhé!");
      return;
    }
    root.socket.emit("createPrivateRoom", {}, (res) => {
      if (!res || !res.ok) return;
      if (root.worldState) root.worldState.roomId = res.roomId;
      const roomUrl = `${window.location.origin}/?room=${encodeURIComponent(res.roomId)}`;
      const badge = document.getElementById("hud-room-badge") || document.getElementById("current-room-label");
      if (badge) badge.textContent = `Phòng riêng: ${res.roomId}`;

      if (navigator.share) {
        navigator
          .share({
            title: "Chợ Thị Trấn Việt Nam 3D",
            text: `Vào phòng ${res.roomId} chơi đá cầu, uống trà đá cùng mình nhé!`,
            url: roomUrl,
          })
          .catch(() => {});
      } else if (navigator.clipboard) {
        navigator.clipboard.writeText(roomUrl).catch(() => {});
      }
      if (typeof root.showToast === "function") {
        root.showToast(`💌 Đã tạo phòng riêng [${res.roomId}] & sao chép link mời bạn!`);
      }
    });
  }

  function copyInviteLink() {
    const rId = (root.worldState && root.worldState.roomId) || "";
    const roomQuery = rId && !rId.startsWith("public-") ? `?room=${encodeURIComponent(rId)}` : "";
    const inviteUrl = `${window.location.origin}/${roomQuery}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(inviteUrl).catch(() => {});
    }
    if (typeof root.showToast === "function") {
      root.showToast(`🔗 Đã sao chép link mời bạn bè: ${inviteUrl}`);
    }
  }

  function blockTargetPlayerNow() {
    const target = root.targetSocialNickname;
    if (!root.socket || !target) return;
    root.socket.emit("blockPlayer", { targetNick: target }, (res) => {
      if (!res || !res.ok) return;
      if (typeof root.showToast === "function") {
        root.showToast(res.blocked ? `🚫 Đã chặn & tắt tiếng ${target}` : `✅ Đã bỏ chặn ${target}`);
      }
      if (typeof root.closeModal === "function") root.closeModal("modal-player-interact");
    });
  }

  function reportTargetPlayerNow() {
    const target = root.targetSocialNickname;
    if (!root.socket || !target) return;
    root.socket.emit(
      "reportPlayer",
      { targetNick: target, reason: "Báo cáo từ bảng tương tác người chơi" },
      (res) => {
        if (res && res.ok && typeof root.showToast === "function") {
          root.showToast(`🚩 Đã gửi báo cáo (#${res.reportId}) về ${target} cho Ban Quản Lý Phố Chợ!`);
        }
        if (typeof root.closeModal === "function") root.closeModal("modal-player-interact");
      }
    );
  }

  /* ==================== 4. HOẠT ĐỘNG HỢP TÁC, ƯỚC NGUYỆN & SỔ SƯU TẦM (PHASE 8–11) ==================== */
  function openTownActivitiesModal() {
    renderTownActivitiesModal();
    if (typeof root.openModal === "function") root.openModal("modal-town-activities");
  }

  function renderTownActivitiesModal() {
    const container = document.getElementById("town-activities-body");
    if (!container) return;
    const act = (root.worldState && root.worldState.activities) || {};
    const gh = act.goldenHour || {};
    const stage = act.openStage || {};
    const tow = act.tugOfWar || {};
    const coop = act.craftCoop || {};
    const cm = act.communityMilestone || { score: 25, target: 100, level: 1, honorBoard: [] };
    const wishes = act.wishes || [];
    const myCol = (root.myPlayer && root.myPlayer.collection) || ["zone_central_market"];

    const esc = root.escapeHtml || ((s) => String(s || ""));

    container.innerHTML = `
      <!-- 1. Cột Mốc Cộng Đồng & Giờ Vàng -->
      <div style="background:rgba(245,158,11,0.12); border:1.5px solid rgba(251,191,36,0.5); border-radius:14px; padding:12px;">
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
          <div>
            <div style="font-weight:800; color:#fef08a; font-size:14px;">${esc((gh.title && gh.title.vi) || "🌟 Giờ Vàng Quảng Trường")}</div>
            <div style="font-size:12px; color:#cbd5e1;">Thưởng miễn phí +500đ & +8 Điểm Thân Thiết (không cần vốn/sạp)</div>
          </div>
          <button class="btn-action btn-gold" onclick="joinGoldenHourNow()">🌟 Tham Gia Ngay</button>
        </div>
        <div style="margin-top:10px; font-size:12.5px; color:#a7f3d0; font-weight:700;">
          🏮 Cột Mốc Chung Thị Trấn (Cấp ${Number(cm.level) || 1}): ${Number(cm.score) || 0} / ${Number(cm.target) || 100} điểm giao lưu
        </div>
      </div>

      <!-- 2. Bốn Khu Hoạt Động Hợp Tác Mới -->
      <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(230px, 1fr)); gap:10px;">
        <div class="community-event-card">
          <h4 style="color:#f472b6; font-size:14px;">🎤 Sân Khấu Đêm & Karaoke (Khu Bắc)</h4>
          <p style="font-size:12px; color:#cbd5e1; margin:4px 0;">
            Đang diễn: <b style="color:#fef08a">${esc(stage.performer || "Đang trống - Mời bạn lên bục!")}</b>
            (Độ cháy: 🔥 ${Number(stage.hypeLevel) || 0})
          </p>
          <div style="display:flex; gap:6px; margin-top:6px;">
            <button class="btn-small" onclick="performStageNow()">🎤 Lên Biểu Diễn</button>
            <button class="btn-small" onclick="cheerStageNow()">👏 Vỗ Tay (+150đ)</button>
          </div>
        </div>

        <div class="community-event-card">
          <h4 style="color:#38bdf8; font-size:14px;">🪢 Kéo Co Sân Làng (Khu Tây)</h4>
          <p style="font-size:12px; color:#cbd5e1; margin:4px 0;">
            Đội Đỏ (${(tow.teamRed && tow.teamRed.length) || 0}) vs Đội Xanh (${(tow.teamBlue && tow.teamBlue.length) || 0}) · Lệch dây: ${Number(tow.ropeOffset) || 0}
          </p>
          <div style="display:flex; gap:6px; margin-top:6px;">
            <button class="btn-small" onclick="pullTugOfWarNow('red')">🔴 Kéo Đội Đỏ</button>
            <button class="btn-small" onclick="pullTugOfWarNow('blue')">🔵 Kéo Đội Xanh</button>
          </div>
        </div>

        <div class="community-event-card">
          <h4 style="color:#34d399; font-size:14px;">🌱 Vườn & Bếp Bánh Chưng (Khu Đông)</h4>
          <p style="font-size:12px; color:#cbd5e1; margin:4px 0;">
            Hoa nở cấp ${Number(coop.gardenBloomLevel) || 1}/3 · Bánh chưng: ${Number(coop.banhChungProgress) || 0}/5 (Đã nấu ${Number(coop.banhChungBatchCount) || 1} mẻ)
          </p>
          <div style="display:flex; gap:6px; margin-top:6px;">
            <button class="btn-small" onclick="contributeCraftNow('water_garden')">🚿 Tưới Hoa</button>
            <button class="btn-small" onclick="contributeCraftNow('cook_banh_chung')">🫔 Gói Bánh Chưng</button>
          </div>
        </div>

        <div class="community-event-card">
          <h4 style="color:#fbbf24; font-size:14px;">🚌 Xe Buýt Xanh Chạy Vòng</h4>
          <p style="font-size:12px; color:#cbd5e1; margin:4px 0;">
            Chạy vòng quanh 5 trạm: Chợ Trung Tâm ↔ Làng Nghề ↔ Phố Đêm ↔ Hồ Sen ↔ Bến Sông.
          </p>
          <div style="display:flex; gap:6px; margin-top:6px;">
            <button class="btn-small" onclick="toggleGreenBusNow()">${isRidingGreenBus ? "🚶 Xuống Xe Buýt" : "🚌 Lên Xe Buýt Dạo Phố"}</button>
          </div>
        </div>
      </div>

      <!-- 3. Cây Ước Nguyện & Đèn Hoa Đăng -->
      <div style="background:rgba(255,255,255,0.04); border:1px solid var(--border); border-radius:14px; padding:12px;">
        <h4 style="color:#fef08a; font-size:14px; margin-bottom:6px;">🪷 Thả Đèn Hoa Đăng & Cây Ước Nguyện (+250đ Lộc)</h4>
        <div style="display:flex; gap:8px; margin-bottom:8px;">
          <input type="text" id="wish-input-text" class="join-input" style="margin:0; flex:1; text-align:left; font-size:13px; padding:8px 12px;" placeholder="Viết điều ước lành (tối đa 40 ký tự)..." maxlength="40">
          <button class="btn-action btn-primary" style="padding:8px 14px;" onclick="submitWishNow()">🏮 Thả Hoa Đăng</button>
        </div>
        <div style="display:flex; flex-wrap:wrap; gap:6px; max-height:95px; overflow-y:auto;">
          ${wishes
            .map(
              (w) =>
                `<span class="chip-btn" style="font-size:11.5px;">${w.type === "tree" ? "🌳" : "🪷"} <b>${esc(w.author)}:</b> "${esc(w.text)}"</span>`
            )
            .join("")}
        </div>
      </div>

      <!-- 4. Sổ Sưu Tầm Ba Miền -->
      <div style="background:rgba(255,255,255,0.04); border:1px solid var(--border); border-radius:14px; padding:12px;">
        <h4 style="color:#38bdf8; font-size:14px; margin-bottom:6px;">📖 Sổ Sưu Tầm Khám Phá Thị Trấn (${myCol.length}/${COLLECTION_CATALOG.length})</h4>
        <div style="display:flex; flex-wrap:wrap; gap:6px;">
          ${COLLECTION_CATALOG.map((item) => {
            const unlocked = myCol.includes(item.id);
            return `<span class="chip-btn ${unlocked ? "active" : ""}" style="opacity:${unlocked ? 1 : 0.45}; font-size:11.5px;">${item.icon} ${esc(item.name)} ${unlocked ? "✓" : ""}</span>`;
          }).join("")}
        </div>
      </div>
    `;
  }

  function joinGoldenHourNow() {
    if (!root.socket) return;
    root.socket.emit("joinGoldenHour", {}, (res) => {
      if (!res || !res.ok) return;
      const gh = res.goldenHour || { x: 0, z: 0 };
      if (typeof root.walkToFriend === "function") {
        root.walkToFriend(gh.x || 0, gh.z || 0, "Giờ Vàng Quảng Trường");
      }
      if (typeof root.showToast === "function") {
        root.showToast(`🌟 Tham gia Giờ Vàng: +${res.rewardMoney}đ & +${res.affinityEarned} Điểm Thân Thiết!`);
      }
      renderTownActivitiesModal();
    });
  }

  function performStageNow() {
    if (!root.socket) return;
    root.socket.emit(
      "performStage",
      {
        songOrAct: "Vũ Điệu Trống Cơm & Múa Quạt",
        lyricBanner: "Tối nay Phố Đêm vui quá bà con ơi! 🎤🏮",
      },
      (res) => {
        if (!res || !res.ok) {
          if (typeof root.showToast === "function") root.showToast((res && res.error) || "Lỗi sân khấu!");
          return;
        }
        if (root.myPlayer) root.myPlayer.danceTimer = 6.0;
        if (typeof root.walkToFriend === "function") root.walkToFriend(0, -44, "Sân Khấu Đêm");
        renderTownActivitiesModal();
      }
    );
  }

  function cheerStageNow() {
    if (!root.socket) return;
    root.socket.emit("cheerStage", {}, (res) => {
      if (!res || !res.ok) return;
      if (typeof root.showToast === "function") {
        root.showToast(`👏 Vỗ tay cổ vũ Sân Khấu Đêm! Độ cháy: 🔥 ${res.hypeLevel} (+150đ)`);
      }
      renderTownActivitiesModal();
    });
  }

  function pullTugOfWarNow(team) {
    if (!root.socket) return;
    root.socket.emit("pullTugOfWar", { preferredTeam: team }, (res) => {
      if (!res || !res.ok) return;
      if (typeof root.showToast === "function") {
        root.showToast(`🪢 Hò dô ta! Bạn vừa kéo dây cho đội ${res.team === "red" ? "Đỏ" : "Xanh"} (+150đ)!`);
      }
      renderTownActivitiesModal();
    });
  }

  function contributeCraftNow(action) {
    if (!root.socket) return;
    root.socket.emit("contributeCraftCoop", { action }, (res) => {
      if (!res || !res.ok) return;
      if (typeof root.showToast === "function") {
        root.showToast(res.message || "🌱 Đã đóng góp cho Làng Nghề!");
      }
      renderTownActivitiesModal();
    });
  }

  function submitWishNow() {
    const input = document.getElementById("wish-input-text");
    const text = (input && input.value.trim()) || "";
    if (!text || !root.socket) {
      if (typeof root.showToast === "function") root.showToast("Hãy viết điều ước trước khi thả đèn nhé!");
      return;
    }
    root.socket.emit("createWish", { text, type: "lantern" }, (res) => {
      if (!res || !res.ok) {
        if (typeof root.showToast === "function") root.showToast((res && res.error) || "Lỗi gửi điều ước!");
        return;
      }
      if (input) input.value = "";
      if (typeof root.showToast === "function") {
        root.showToast("🪷 Đèn Hoa Đăng mang điều ước của bạn đã được thả sáng lung linh (+250đ)!");
      }
      renderTownActivitiesModal();
    });
  }

  function toggleGreenBusNow() {
    if (!root.socket) return;
    root.socket.emit("toggleGreenBus", {}, (res) => {
      if (!res || !res.ok) return;
      isRidingGreenBus = Boolean(res.riding);
      if (typeof root.showToast === "function") {
        root.showToast(
          isRidingGreenBus
            ? "🚌 Bạn đã lên Xe Buýt Xanh chạy vòng quanh 5 khu thị trấn!"
            : "🚶 Bạn đã xuống Xe Buýt Xanh!"
        );
      }
      renderTownActivitiesModal();
    });
  }

  const FALLBACK_ZONES = [
    { id: "central_market", icon: "🏮", name: { vi: "Khu Chợ Trung Tâm", en: "Central Market" }, center: { x: 0, z: 0 } },
    { id: "bau_cua_booth", icon: "🎲", name: { vi: "Lầu Hội Bầu Cua Dân Gian", en: "Grand Bầu Cua Pavilion" }, center: { x: -8, z: -16 } },
    { id: "shuttlecock_court", icon: "🪶", name: { vi: "Tổ Hợp Sân Đá Cầu Kiểng", en: "Shuttlecock Arena Complex" }, center: { x: 8, z: -15 } },
    { id: "tea_table_corner", icon: "☕", name: { vi: "Quảng Trường Trà Đá & Acoustic", en: "Sidewalk Tea & Acoustic Plaza" }, center: { x: 0, z: 13.5 } },
    { id: "night_food_stage", icon: "🎤", name: { vi: "Phố Ẩm Thực Đêm & Sân Khấu Bắc", en: "Night Food Street & Open Stage" }, center: { x: 0, z: -46 } },
    { id: "lotus_park_village", icon: "🪷", name: { vi: "Công Viên Hồ Sen & Sân Làng Tây", en: "Lotus Park & Village Yard" }, center: { x: -46, z: 0 } },
    { id: "craft_village_garden", icon: "🌱", name: { vi: "Làng Nghề & Vườn Cộng Đồng Đông", en: "Craft Village & Community Garden" }, center: { x: 46, z: 0 } },
    { id: "floating_market_hill", icon: "🚤", name: { vi: "Đồi Ngắm Cảnh Bờ Nam & Chợ Nổi", en: "Scenic Hill & Floating Market" }, center: { x: 0, z: 82 } },
    { id: "kite_meadow_nw", icon: "🪁", name: { vi: "Đồi Thả Diều & Sân Cỏ Tây Bắc", en: "Northwest Kite Meadow" }, center: { x: -140, z: -130 } },
    { id: "flower_valley_ne", icon: "🌸", name: { vi: "Thung Lũng Hoa Xuân Đông Bắc", en: "Northeast Flower Valley" }, center: { x: 140, z: -130 } },
    { id: "coconut_canal_sw", icon: "🥥", name: { vi: "Rạch Dừa Nước & Cầu Khỉ Tây Nam", en: "Southwest Coconut Canal" }, center: { x: -140, z: 120 } },
    { id: "orchard_hill_se", icon: "🍈", name: { vi: "Đồi Miệt Vườn Trái Cây Đông Nam", en: "Southeast Fruit Orchard Hill" }, center: { x: 140, z: 120 } },
    { id: "mountain_pagoda_nw", icon: "⛰️", name: { vi: "Đỉnh Núi Chùa Đồng & Cổng Trời Tây Bắc (20x)", en: "NW Mountain Pagoda & Sky Gate" }, center: { x: -580, z: -540 } },
    { id: "sun_wheel_park_ne", icon: "🎡", name: { vi: "Công Viên Vòng Quay Mặt Trời Đông Bắc (20x)", en: "NE Giant Sun Wheel Park" }, center: { x: 580, z: -540 } },
    { id: "lighthouse_bay_sw", icon: "🗼", name: { vi: "Vịnh Hải Đăng & Bãi Biển Tây Nam (20x)", en: "SW Lighthouse & Sandy Bay" }, center: { x: -580, z: 520 } },
    { id: "golden_dragon_island_se", icon: "🐉", name: { vi: "Đảo Rồng Vàng & Thủy Đình Đông Nam (20x)", en: "SE Golden Dragon Island" }, center: { x: 580, z: 520 } },
    { id: "residential_east", icon: "🏡", name: { vi: "Phố Dân Cư & Nhà Riêng", en: "Residential Street" }, center: { x: 26, z: 4 } },
    { id: "cultural_house_west", icon: "🏛️", name: { vi: "Nhà Văn Hóa Thị Trấn", en: "Cultural House" }, center: { x: -26, z: 0 } },
    { id: "riverside_dock", icon: "🎣", name: { vi: "Bến Sông Câu Cá Làng Quê", en: "Riverside Fishing Dock" }, center: { x: 0, z: 27 } },
    { id: "quiet_lotus_corner", icon: "🌿", name: { vi: "Góc Yên Tĩnh Hồ Sen", en: "Quiet Lotus Corner" }, center: { x: -54, z: -38 } },
  ];

  /* ==================== 5. ĐI TỚI... (GO TO) & TRỢ NĂNG / CÀI ĐẶT (PHASE 4 & 5) ==================== */
  function openGoToModal() {
    const listEl = document.getElementById("goto-zones-list") || document.getElementById("goto-destinations-list");
    if (listEl) {
      listEl.innerHTML = "";
      const pop = (root.worldState && root.worldState.zonePopulation) || {};
      const zonesSource =
        (root.worldState && Array.isArray(root.worldState.zones) && root.worldState.zones.length > 0 && root.worldState.zones) ||
        (root.WorldLayout && Array.isArray(root.WorldLayout.ZONES) && root.WorldLayout.ZONES) ||
        FALLBACK_ZONES;

      // Nút Lên Xe Điện Xanh chạy vòng 5 trạm
      const busCard = document.createElement("div");
      busCard.className = "community-event-card";
      busCard.style.cssText = "display:flex; justify-content:space-between; align-items:center; border-color:rgba(16,185,129,0.6); background:rgba(16,185,129,0.12);";
      busCard.innerHTML = `
        <div>
          <div style="font-weight:800; color:#4ade80;">🚌 Tuyến Xe Điện Xanh Nội Thị (5 Trạm)</div>
          <div style="font-size:12px; color:#cbd5e1;">Ngồi xe điện dạo vòng quanh toàn bộ 9 khu phố</div>
        </div>
      `;
      const busBtn = document.createElement("button");
      busBtn.className = "btn-action btn-gold";
      busBtn.style.cssText = "padding:6px 12px; font-size:12px;";
      busBtn.textContent = isRidingGreenBus ? "🚶 Xuống Xe" : "🚌 Lên Xe Điện";
      busBtn.onclick = () => {
        toggleGreenBusNow();
        if (typeof root.closeModal === "function") root.closeModal("modal-goto");
      };
      busCard.appendChild(busBtn);
      listEl.appendChild(busCard);

      zonesSource.forEach((z) => {
        const count = pop[z.id] || 0;
        const nameVi = typeof z.name === "object" ? z.name.vi : z.name || z.id;
        const nameEn = typeof z.name === "object" ? z.name.en : z.nameEn || "";
        const icon = z.icon || "📍";
        const cx = (z.center && z.center.x) || 0;
        const cz = (z.center && z.center.z) || 0;

        const card = document.createElement("div");
        card.className = "community-event-card";
        card.style.display = "flex";
        card.style.justifyContent = "space-between";
        card.style.alignItems = "center";

        const info = document.createElement("div");
        const title = document.createElement("div");
        title.style.fontWeight = "800";
        title.style.color = "#fef08a";
        title.textContent = `${icon} ${nameVi}`;
        const sub = document.createElement("div");
        sub.style.fontSize = "12px";
        sub.style.color = "#94a3b8";
        sub.textContent = `${nameEn ? nameEn + " · " : ""}👥 ${count} người đang ở đây`;
        info.appendChild(title);
        info.appendChild(sub);

        const btnGroup = document.createElement("div");
        btnGroup.style.cssText = "display:flex; gap:6px;";

        const walkBtn = document.createElement("button");
        walkBtn.className = "btn-action";
        walkBtn.style.cssText = "padding:6px 10px; font-size:11.5px;";
        walkBtn.textContent = "🏃 Chạy Tới";
        walkBtn.onclick = () => {
          isRidingGreenBus = false;
          if (typeof root.walkToFriend === "function") {
            root.walkToFriend(cx, cz, nameVi);
          }
          if (typeof root.closeModal === "function") root.closeModal("modal-goto");
        };

        const teleBtn = document.createElement("button");
        teleBtn.className = "btn-action btn-gold";
        teleBtn.style.cssText = "padding:6px 10px; font-size:11.5px;";
        teleBtn.textContent = "⚡ Đến Ngay";
        teleBtn.onclick = () => {
          isRidingGreenBus = false;
          if (root.myPlayer) {
            root.myPlayer.pos.x = cx;
            root.myPlayer.pos.z = cz;
            if (root.myPlayer.mesh && root.myPlayer.mesh.group) {
              root.myPlayer.mesh.group.position.set(cx, 0, cz);
            }
            if (root.socket) {
              root.socket.emit("move", { pos: { x: cx, y: 0, z: cz }, rot: root.myPlayer.rot || 0, teleportAllowed: true });
            }
          }
          if (typeof root.updateZoneBadgeHUD === "function") root.updateZoneBadgeHUD();
          if (typeof root.showToast === "function") root.showToast(`🧭 Đã đến ${nameVi}!`);
          if (typeof root.closeModal === "function") root.closeModal("modal-goto");
        };

        btnGroup.appendChild(walkBtn);
        btnGroup.appendChild(teleBtn);
        card.appendChild(info);
        card.appendChild(btnGroup);
        listEl.appendChild(card);
      });
    }
    if (typeof root.openModal === "function") root.openModal("modal-goto");
  }

  function openSettingsModal() {
    const body = document.getElementById("settings-modal-body");
    if (body) {
      const recCode =
        (root.myPlayer && root.myPlayer.recoveryCode) ||
        localStorage.getItem("cho_recovery_code") ||
        "Chưa cấp (Vào chợ để nhận)";
      const esc = root.escapeHtml || ((s) => String(s || ""));
      body.innerHTML = `
        <div style="display:flex; flex-direction:column; gap:12px;">
          <div style="background:rgba(255,255,255,0.05); border:1px solid var(--border); border-radius:12px; padding:12px;">
            <div style="font-weight:800; color:var(--gold); font-size:13.5px; margin-bottom:6px;">🎨 Chất Lượng Đồ Họa 3D (FPS hiện tại: ${currentFps})</div>
            <div style="display:flex; gap:8px; flex-wrap:wrap;">
              <button class="chip-btn ${graphicsTier === "low" ? "active" : ""}" onclick="setGraphicsQuality('low'); openSettingsModal();">⚡ Thấp (Máy yếu)</button>
              <button class="chip-btn ${graphicsTier === "medium" ? "active" : ""}" onclick="setGraphicsQuality('medium'); openSettingsModal();">✨ Vừa (Cân bằng)</button>
              <button class="chip-btn ${graphicsTier === "high" ? "active" : ""}" onclick="setGraphicsQuality('high'); openSettingsModal();">🌟 Cao (Rực rỡ)</button>
            </div>
          </div>

          <div style="background:rgba(255,255,255,0.05); border:1px solid var(--border); border-radius:12px; padding:12px;">
            <div style="font-weight:800; color:#38bdf8; font-size:13.5px; margin-bottom:6px;">🔤 Cỡ Chữ Giao Diện & Ngôn Ngữ</div>
            <div style="display:flex; gap:8px; flex-wrap:wrap; margin-bottom:8px;">
              <button class="chip-btn" onclick="setFontScale(0.95)">Nhỏ (95%)</button>
              <button class="chip-btn" onclick="setFontScale(1.0)">Chuẩn (100%)</button>
              <button class="chip-btn" onclick="setFontScale(1.12)">Lớn (112%)</button>
              <button class="chip-btn" onclick="setFontScale(1.25)">Rất lớn (125%)</button>
            </div>
            <button class="btn-action" style="width:100%; justify-content:center;" onclick="toggleLanguage()">🌐 Chuyển Ngôn Ngữ: Tiếng Việt ↔ English</button>
          </div>

          <div style="background:rgba(255,255,255,0.05); border:1px solid var(--border); border-radius:12px; padding:12px; display:flex; flex-direction:column; gap:8px;">
            <div style="font-weight:800; color:#4ade80; font-size:13.5px;">♿ Trợ Năng & Thao Tác Điện Thoại</div>
            <button class="btn-action" onclick="toggleHighContrast()">🌗 Bật / Tắt Tương Phản Cao (WCAG AA)</button>
            <button class="btn-action" onclick="toggleReducedMotion()">🍃 Bật / Tắt Giảm Chuyển Động (Đỡ Chóng Mặt)</button>
            <button class="btn-action" onclick="toggleLeftHandedJoystick()">🤳 Đổi Bên Cần Gạt Cảm Ứng (Tay Trái / Phải)</button>
            <button class="btn-action btn-gold" id="pwa-install-btn" onclick="installPWAApp()">📲 Cài Đặt Ứng Dụng Ra Màn Hình Chính (PWA)</button>
          </div>

          <div style="background:rgba(245,158,11,0.12); border:1px solid rgba(251,191,36,0.45); border-radius:12px; padding:12px;">
            <div style="font-weight:800; color:#fef08a; font-size:13px;">🔑 Mã Khôi Phục Tài Khoản Khi Đổi Thiết Bị:</div>
            <div style="font-size:16px; font-weight:900; color:#4ade80; letter-spacing:2px; margin-top:4px;">${esc(recCode)}</div>
            <div style="font-size:11.5px; color:var(--text-muted); margin-top:2px;">Lưu lại mã 6 ký tự này để giữ nguyên tiền, sạp hàng và danh hiệu khi chơi trên máy khác.</div>
          </div>
        </div>
      `;
    }
    if (typeof root.openModal === "function") root.openModal("modal-settings");
  }

  function toggleLanguage() {
    const cur = (typeof root.getLang === "function" && root.getLang()) || root.currentLang || "vi";
    const next = cur === "vi" ? "en" : "vi";
    root.currentLang = next;
    if (typeof root.setLang === "function") {
      root.setLang(next);
    }
    if (typeof root.updateZoneBadgeHUD === "function") {
      root.updateZoneBadgeHUD();
    }
    if (typeof root.showToast === "function") {
      root.showToast(next === "en" ? "🌐 Language switched to English!" : "🌐 Đã chuyển sang Tiếng Việt!");
    }
  }

  function toggleMinimapSize() {
    const card = document.getElementById("minimap-card");
    if (card) card.classList.toggle("expanded");
  }

  function waveHelloToPlayer() {
    if (typeof root.doPlayerAction === "function") {
      root.doPlayerAction("wave");
    }
  }

  function updateGoldenHourHUD() {
    const pill = document.getElementById("golden-hour-pill");
    const titleEl = document.getElementById("golden-hour-title");
    if (!pill) return;
    const gh = root.worldState && root.worldState.activities && root.worldState.activities.goldenHour;
    if (gh && gh.active) {
      pill.classList.add("active");
      if (titleEl && gh.title) {
        titleEl.textContent = gh.title.vi || gh.title;
      }
    } else {
      pill.classList.remove("active");
    }
  }

  function setGraphicsQuality(tier, showMsg = true) {
    graphicsTier = ["low", "medium", "high"].includes(tier) ? tier : "medium";
    if (root.renderer) {
      const pr = graphicsTier === "low" ? 1 : graphicsTier === "medium" ? Math.min(1.5, window.devicePixelRatio || 1) : Math.min(2, window.devicePixelRatio || 1);
      root.renderer.setPixelRatio(pr);
      root.renderer.shadowMap.enabled = graphicsTier !== "low";
    }
    if (nightStageGroup) nightStageGroup.visible = true;
    if (lotusParkGroup) lotusParkGroup.visible = true;
    if (craftVillageGroup) craftVillageGroup.visible = true;
    if (floatingMarketGroup) floatingMarketGroup.visible = true;

    if (showMsg && typeof root.showToast === "function") {
      const names = { low: "Thấp (Siêu Mượt Cho Máy Yếu)", medium: "Vừa (Cân Bằng)", high: "Cao (Rực Rỡ)" };
      root.showToast(`⚙️ Đã chuyển mức đồ họa: ${names[graphicsTier]}`);
    }
  }

  function setFontScale(scaleVal) {
    const num = Math.max(0.9, Math.min(1.35, Number(scaleVal) || 1));
    document.documentElement.style.setProperty("--font-scale", String(num));
    if (typeof root.showToast === "function") {
      root.showToast(`🔤 Đã chỉnh cỡ chữ: ${Math.round(num * 100)}%`);
    }
  }

  function toggleHighContrast() {
    const active = document.body.classList.toggle("high-contrast");
    if (typeof root.showToast === "function") {
      root.showToast(active ? "🌗 Đã bật chế độ Tương Phản Cao (WCAG AA)" : "🌗 Đã tắt chế độ Tương Phản Cao");
    }
  }

  function toggleReducedMotion() {
    const active = document.body.classList.toggle("reduced-motion");
    if (typeof root.showToast === "function") {
      root.showToast(active ? "🍃 Đã bật chế độ Giảm Chuyển Động" : "🍃 Đã tắt chế độ Giảm Chuyển Động");
    }
  }

  function toggleLeftHandedJoystick() {
    const active = document.body.classList.toggle("left-handed");
    if (typeof root.showToast === "function") {
      root.showToast(active ? "🤳 Đã chuyển bố cục Cần Gạt Tay Trái" : "🤳 Đã chuyển bố cục Cần Gạt Mặc Định");
    }
  }

  /* ==================== 6. CHẾ ĐỘ CHỤP ẢNH & BÁO CÁO HIỆU NĂNG (PHASE 11.4 & 12.2) ==================== */
  function togglePhotoMode(forceState) {
    const next =
      typeof forceState === "boolean"
        ? forceState
        : !document.body.classList.contains("photo-mode");
    document.body.classList.toggle("photo-mode", next);
    const overlay = document.getElementById("photo-mode-overlay");
    if (overlay) overlay.classList.toggle("active", next);
  }

  function captureTownPhoto() {
    if (!root.renderer || !root.scene || !root.camera) return;
    root.renderer.render(root.scene, root.camera);
    const glCanvas = root.renderer.domElement;

    const outCanvas = document.createElement("canvas");
    outCanvas.width = glCanvas.width;
    outCanvas.height = glCanvas.height;
    const ctx = outCanvas.getContext("2d");
    ctx.drawImage(glCanvas, 0, 0);

    // Đóng dấu kỷ niệm Chợ Thị Trấn Việt Nam 3D
    ctx.fillStyle = "rgba(15, 23, 42, 0.78)";
    ctx.fillRect(20, outCanvas.height - 64, 420, 44);
    ctx.fillStyle = "#fef08a";
    ctx.font = "bold 20px sans-serif";
    ctx.fillText("🏮 CHỢ THỊ TRẤN VIỆT NAM 3D — Kỷ Niệm Phố Chợ", 34, outCanvas.height - 35);

    const dataUrl = outCanvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `cho-thi-tran-3d-${Date.now()}.png`;
    a.click();

    if (typeof root.showToast === "function") {
      root.showToast("📸 Đã lưu ảnh kỷ niệm Chợ Thị Trấn Việt Nam 3D về máy!");
    }
  }

  // Hàm đo hiệu năng chuẩn Phase 12.2: window.__perfReport()
  root.__perfReport = function () {
    const info = (root.renderer && root.renderer.info) || { render: {}, memory: {} };
    const report = {
      fps: currentFps,
      graphicsTier,
      drawCalls: info.render ? info.render.calls : 0,
      triangles: info.render ? info.render.triangles : 0,
      geometries: info.memory ? info.memory.geometries : 0,
      textures: info.memory ? info.memory.textures : 0,
      onlinePlayersInRoom: Object.keys((root.worldState && root.worldState.otherPlayers) || {}).length + 1,
    };
    console.table(report);
    return report;
  };

  // PWA Install Prompt handler (Phase 6)
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredInstallPrompt = e;
    const btn = document.getElementById("pwa-install-btn");
    if (btn) btn.style.display = "inline-flex";
  });

  function installPWAApp() {
    if (deferredInstallPrompt) {
      deferredInstallPrompt.prompt();
      deferredInstallPrompt.userChoice.finally(() => {
        deferredInstallPrompt = null;
      });
    } else if (typeof root.showToast === "function") {
      root.showToast("📲 Trên trình duyệt, chọn [Chia sẻ / Menu] -> [Thêm vào màn hình chính] nhé!");
    }
  }

  // Xuất các hàm ra global window để HTML gọi trực tiếp
  root.initOnboardingJoinScreen = initOnboardingJoinScreen;
  root.rollRandomNickname = rollRandomNickname;
  root.randomizeJoinNickname = () => rollRandomNickname(true);
  root.selectCharacterPreset = selectCharacterPreset;
  root.buildExpandedTownZones = buildExpandedTownZones;
  root.updateExpandedTown3D = updateExpandedTown3D;
  root.sendQuickChat = sendQuickChat;
  root.switchChatTab = switchChatTab;
  root.setChatFilterTab = switchChatTab;
  root.createOrShareRoom = createOrShareRoom;
  root.createPrivateRoomNow = createOrShareRoom;
  root.copyInviteLink = copyInviteLink;
  root.blockTargetPlayerNow = blockTargetPlayerNow;
  root.reportTargetPlayerNow = reportTargetPlayerNow;
  root.openTownActivitiesModal = openTownActivitiesModal;
  root.renderTownActivitiesModal = renderTownActivitiesModal;
  root.joinGoldenHourNow = joinGoldenHourNow;
  root.joinGoldenHourActivity = joinGoldenHourNow;
  root.updateGoldenHourHUD = updateGoldenHourHUD;
  root.performStageNow = performStageNow;
  root.cheerStageNow = cheerStageNow;
  root.pullTugOfWarNow = pullTugOfWarNow;
  root.contributeCraftNow = contributeCraftNow;
  root.submitWishNow = submitWishNow;
  root.toggleGreenBusNow = toggleGreenBusNow;
  root.openGoToModal = openGoToModal;
  root.openSettingsModal = openSettingsModal;
  root.toggleLanguage = toggleLanguage;
  root.toggleMinimapSize = toggleMinimapSize;
  root.waveHelloToPlayer = waveHelloToPlayer;
  root.setGraphicsQuality = setGraphicsQuality;
  root.setFontScale = setFontScale;
  root.toggleHighContrast = toggleHighContrast;
  root.toggleReducedMotion = toggleReducedMotion;
  root.toggleLeftHandedJoystick = toggleLeftHandedJoystick;
  root.togglePhotoMode = togglePhotoMode;
  root.enterPhotoMode = () => togglePhotoMode(true);
  root.exitPhotoMode = () => togglePhotoMode(false);
  root.captureTownPhoto = captureTownPhoto;
  root.capturePostcardPng = captureTownPhoto;
  root.installPWAApp = installPWAApp;

  // Khởi tạo màn hình chào ngay khi script tải xong
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initOnboardingJoinScreen);
  } else {
    initOnboardingJoinScreen();
  }
})(typeof window !== "undefined" ? window : this);
