/*
 * World Colliders & Sliding Collision System (Phase 1 & Phase 8 — 5x Expanded Map)
 * Chợ Thị Trấn Việt Nam 3D — Sân Chơi Mở & Thị Trấn Sống
 *
 * Chống đi xuyên tường, xuyên nhà phố, đài sen, lầu hội bầu cua, khán đài đá cầu,
 * sạp hàng, quán trà đá, đình làng và nước sông. Hỗ trợ trượt mượt mà (smooth sliding).
 */

(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.Colliders = factory();
  }
})(typeof self !== "undefined" ? self : this, function () {
  // Mở rộng phạm vi bản đồ lên gấp 20 lần: [-1160, 1160] (2320m x 2320m, gấp 20 lần 58m cũ)
  const BOUNDS = {
    minX: -1160.0,
    maxX: 1160.0,
    minZ: -1160.0,
    maxZ: 1160.0,
  };

  // Danh mục vật cản cố định trong thế giới 3D
  // 1. Box AABB: { type: 'box', id, minX, maxX, minZ, maxZ, name }
  // 2. Circle:   { type: 'circle', id, x, z, radius, name }
  const OBSTACLES = [
    // ----------------------------------------------------
    // 1. NHÀ LỒNG CHỢ BẾN THÀNH & THÁP ĐỒNG HỒ (z ≈ -34)
    // ----------------------------------------------------
    {
      type: "box",
      id: "ben_thanh_hall",
      name: "Nhà Lồng Chợ Bến Thành",
      minX: -11.5,
      maxX: 11.5,
      minZ: -38.8,
      maxZ: -29.2,
    },

    // ----------------------------------------------------
    // 2. ĐÀI SEN VÀNG TRUNG TÂM (0, 0)
    // ----------------------------------------------------
    {
      type: "circle",
      id: "golden_lotus_fountain",
      name: "Đài Sen Vàng Trung Tâm",
      x: 0,
      z: 0,
      radius: 4.4,
    },

    // ----------------------------------------------------
    // 3. ĐẠI LẦU HỘI BẦU CUA TÔM CÁ PHÍA TÂY (-48, -16)
    // Bàn lắc xúc xắc trung tâm & các trống hội ven hồ sen
    // ----------------------------------------------------
    {
      type: "circle",
      id: "bau_cua_deck",
      name: "Sới Bầu Cua Tôm Cá",
      x: -48,
      z: -16,
      radius: 2.3,
    },
    {
      type: "circle",
      id: "bau_cua_drum_l",
      name: "Trống Hội Bầu Cua Trái",
      x: -51.8,
      z: -12.6,
      radius: 0.65,
    },
    {
      type: "circle",
      id: "bau_cua_drum_r",
      name: "Trống Hội Bầu Cua Phải",
      x: -44.2,
      z: -12.6,
      radius: 0.65,
    },

    // ----------------------------------------------------
    // 4. PHỐ VĂN HÓA TRÀ ĐÁ & ACOUSTIC BỜ SÔNG (-8, 27)
    // ----------------------------------------------------
    {
      type: "box",
      id: "tea_table",
      name: "Bàn Trà Đá Vỉa Hè Bờ Sông",
      minX: -9.2,
      maxX: -6.8,
      minZ: 26.3,
      maxZ: 27.7,
    },
    {
      type: "box",
      id: "tea_cart_vintage",
      name: "Xe Trà Chanh & Cà Phê Vợt Phố Cổ",
      minX: -13.0,
      maxX: -11.0,
      minZ: 26.0,
      maxZ: 28.0,
    },
    {
      type: "box",
      id: "tea_acoustic_stage",
      name: "Bục Nhạc Acoustic Vỉa Hè",
      minX: -4.8,
      maxX: -2.6,
      minZ: 26.0,
      maxZ: 28.0,
    },

    // ----------------------------------------------------
    // 4B. ĐẠI ĐẤU TRƯỜNG ĐÁ CẦU KIỂNG LIÊN PHƯỜNG (8, -15)
    // Khán đài cổ vũ & Tháp trọng tài (chừa trống toàn bộ mặt sân đá cầu rộng lớn)
    // ----------------------------------------------------
    {
      type: "box",
      id: "shuttlecock_bleacher_n",
      name: "Khán Đài Cổ Vũ Đá Cầu",
      minX: 4.0,
      maxX: 12.0,
      minZ: -22.2,
      maxZ: -20.2,
    },
    {
      type: "circle",
      id: "shuttlecock_referee_tower",
      name: "Tháp Trọng Tài & Bảng Điểm Đá Cầu",
      x: 14.2,
      z: -19.2,
      radius: 0.85,
    },

    // ----------------------------------------------------
    // 5. NHÀ VĂN HÓA THỊ TRẤN (-26, 0)
    // ----------------------------------------------------
    {
      type: "box",
      id: "culture_hall_main",
      name: "Nhà Văn Hóa Thị Trấn",
      minX: -33.5,
      maxX: -18.5,
      minZ: -5.0,
      maxZ: 5.0,
    },

    // ----------------------------------------------------
    // 6. PHỐ DÂN CƯ & THƯƠNG MẠI ĐÔNG (x = 26, z = 0)
    // ----------------------------------------------------
    {
      type: "box",
      id: "residence_shop_1",
      name: "Ngân Hàng Phố Chợ & Két Tiết Kiệm",
      minX: 25.8,
      maxX: 32.8,
      minZ: -12.3,
      maxZ: -5.7,
    },
    {
      type: "box",
      id: "residence_shop_2",
      name: "Đại Lý Vé Số & Thẻ Cào May Mắn",
      minX: 25.8,
      maxX: 32.8,
      minZ: -3.3,
      maxZ: 3.3,
    },
    {
      type: "box",
      id: "residence_garage",
      name: "Tiệm Độ Xe Máy & Nước Sâm Bí Đao",
      minX: 25.5,
      maxX: 33.0,
      minZ: 5.6,
      maxZ: 13.5,
    },

    // ----------------------------------------------------
    // 7. DÃY NHÀ PHỐ 2 BÊN (Shophouses x = -38 và x = +38)
    // ----------------------------------------------------
    // Dãy phố Tây (x ≈ -38)
    {
      type: "box",
      id: "shophouse_w1",
      name: "Tiệm Vàng Kim Phát",
      minX: -41.8,
      maxX: -34.2,
      minZ: -22.3,
      maxZ: -13.7,
    },
    {
      type: "box",
      id: "shophouse_w2",
      name: "Nhà May Áo Dài Cô Ba",
      minX: -41.8,
      maxX: -34.2,
      minZ: -4.8,
      maxZ: 4.8,
    },
    {
      type: "box",
      id: "shophouse_w3",
      name: "Tiệm Thuốc Bắc Vạn An",
      minX: -41.8,
      maxX: -34.2,
      minZ: 13.7,
      maxZ: 22.3,
    },
    // Dãy phố Đông (x ≈ +38)
    {
      type: "box",
      id: "shophouse_e1",
      name: "Cà Phê Vợt Phố Cổ",
      minX: 34.2,
      maxX: 41.8,
      minZ: -22.3,
      maxZ: -13.7,
    },
    {
      type: "box",
      id: "shophouse_e2",
      name: "Khách Sạn Đông Dương",
      minX: 34.2,
      maxX: 41.8,
      minZ: -4.8,
      maxZ: 4.8,
    },
    {
      type: "box",
      id: "shophouse_e3",
      name: "Gánh Chè Ba Miền",
      minX: 34.2,
      maxX: 41.8,
      minZ: 13.7,
      maxZ: 22.3,
    },

    // ----------------------------------------------------
    // 8. 6 SẠP HÀNG TRUNG TÂM (INITIAL_STALL_DEFS)
    // ----------------------------------------------------
    {
      type: "box",
      id: "stall_1",
      name: "Sạp Trái Cây Miền Tây",
      minX: -14.6,
      maxX: -11.4,
      minZ: -12.6,
      maxZ: -9.4,
    },
    {
      type: "box",
      id: "stall_2",
      name: "Quán Cà Phê Vợt & Nước Mía",
      minX: 11.4,
      maxX: 14.6,
      minZ: -12.6,
      maxZ: -9.4,
    },
    {
      type: "box",
      id: "stall_3",
      name: "Tiệm Phở Bò & Bánh Mì Sài Gòn",
      minX: -14.6,
      maxX: -11.4,
      minZ: 9.4,
      maxZ: 12.6,
    },
    {
      type: "box",
      id: "stall_4",
      name: "Hàng Nón Lá & Hoa Xuân",
      minX: 11.4,
      maxX: 14.6,
      minZ: 9.4,
      maxZ: 12.6,
    },
    {
      type: "box",
      id: "stall_5",
      name: "Bách Hóa Tổng Hợp Phố Chợ",
      minX: -10.6,
      maxX: -7.4,
      minZ: -1.6,
      maxZ: 1.6,
    },
    {
      type: "box",
      id: "stall_6",
      name: "Tiệm Trầm Hương & Ngọc Phố Cổ",
      minX: 7.4,
      maxX: 10.6,
      minZ: -1.6,
      maxZ: 1.6,
    },

    // ----------------------------------------------------
    // 9. TRỤ CỔNG CHÀO & TRỤ CỔNG LÀNG
    // ----------------------------------------------------
    { type: "circle", id: "welcome_gate_pillar_l", name: "Trụ Cổng Chào Trái", x: -4.8, z: 26, radius: 0.5 },
    { type: "circle", id: "welcome_gate_pillar_r", name: "Trụ Cổng Chào Phải", x: 4.8, z: 26, radius: 0.5 },
    {
      type: "box",
      id: "village_gate_pillar_l",
      name: "Trụ Cổng Làng Trái",
      minX: -5.1,
      maxX: -3.3,
      minZ: -52.9,
      maxZ: -51.1,
    },
    {
      type: "box",
      id: "village_gate_pillar_r",
      name: "Trụ Cổng Làng Phải",
      minX: 3.3,
      maxX: 5.1,
      minZ: -52.9,
      maxZ: -51.1,
    },

    // ----------------------------------------------------
    // 10. THÂN CÂY LỚN & CỘT ĐIỆN PHỐ THỊ
    // ----------------------------------------------------
    { type: "circle", id: "tree_mai_1", name: "Cây Mai Vàng", x: -24, z: -24, radius: 0.6 },
    { type: "circle", id: "tree_dao_1", name: "Cây Đào Tết", x: 24, z: -24, radius: 0.6 },
    { type: "circle", id: "tree_phuong_1", name: "Cây Phượng Vĩ", x: -24, z: 24, radius: 0.6 },
    { type: "circle", id: "tree_phuong_2", name: "Cây Phượng Vĩ", x: 24, z: 24, radius: 0.6 },
    { type: "circle", id: "tree_da_w", name: "Cây Đa Tây", x: -29, z: 0, radius: 0.7 },
    { type: "circle", id: "tree_da_e", name: "Cây Đa Đông", x: 29, z: 0, radius: 0.7 },
    { type: "circle", id: "tree_mai_2", name: "Cây Mai Vàng", x: -18, z: -22, radius: 0.55 },
    { type: "circle", id: "tree_dao_2", name: "Cây Đào Tết", x: 18, z: -22, radius: 0.55 },
    { type: "circle", id: "tree_mai_3", name: "Cây Mai Vàng", x: -18, z: 22, radius: 0.55 },
    { type: "circle", id: "tree_dao_3", name: "Cây Đào Tết", x: 18, z: 22, radius: 0.55 },
    { type: "circle", id: "pole_w1", name: "Cột Điện Tây 1", x: -16, z: -24, radius: 0.35 },
    { type: "circle", id: "pole_w2", name: "Cột Điện Tây 2", x: -16, z: 0, radius: 0.35 },
    { type: "circle", id: "pole_w3", name: "Cột Điện Tây 3", x: -16, z: 24, radius: 0.35 },
    { type: "circle", id: "pole_e1", name: "Cột Điện Đông 1", x: 16, z: -24, radius: 0.35 },
    { type: "circle", id: "pole_e2", name: "Cột Điện Đông 2", x: 16, z: 0, radius: 0.35 },
    { type: "circle", id: "pole_e3", name: "Cột Điện Đông 3", x: 16, z: 24, radius: 0.35 },

    // ----------------------------------------------------
    // 11. CÁC KHU VỰC MỞ RỘNG (Expanded Zones 5x & 20x)
    // ----------------------------------------------------
    { type: "box", id: "night_cart_l", name: "Xe Đẩy Ẩm Thực Trái", minX: -7.1, maxX: -4.5, minZ: -43.6, maxZ: -42.0 },
    { type: "box", id: "night_cart_r", name: "Xe Đẩy Ẩm Thực Phải", minX: 4.5, maxX: 7.1, minZ: -43.6, maxZ: -42.0 },
    { type: "circle", id: "craft_pot", name: "Nồi Bánh Chưng Làng Nghề", x: 40, z: -2.5, radius: 1.2 },
    { type: "circle", id: "fishing_hut", name: "Chòi Lá Câu Cá", x: -1.8, z: 42.5, radius: 1.4 },
    // Đài Vọng Cảnh & Tháp Trống Đồi Diều Tây Bắc (-140, -138)
    { type: "circle", id: "nw_kite_pavilion", name: "Lầu Ngắm Diều Tây Bắc", x: -140, z: -138, radius: 3.2 },
    // Lầu Thưởng Trà Thung Lũng Hoa Đông Bắc (140, -138)
    { type: "circle", id: "ne_flower_pavilion", name: "Lầu Hoa Xuân Đông Bắc", x: 140, z: -138, radius: 3.2 },
    // Nhà Mát Rừng Dừa Tây Nam (-140, 128)
    { type: "circle", id: "sw_coconut_pavilion", name: "Nhà Mát Rừng Dừa Tây Nam", x: -140, z: 128, radius: 3.2 },
    // Chòi Vọng Nguyệt Miệt Vườn Đông Nam (140, 128)
    { type: "circle", id: "se_orchard_pavilion", name: "Chòi Vọng Nguyệt Miệt Vườn", x: 140, z: 128, radius: 3.2 },
    // 4 Đại Kỳ Quan Vùng Biên 20x (±580, ±540)
    { type: "circle", id: "nw_bronze_pagoda", name: "Đại Bảo Tháp Chùa Đồng Tây Bắc", x: -580, z: -545, radius: 7.5 },
    { type: "circle", id: "ne_sun_wheel_base", name: "Chân Đế Vòng Quay Mặt Trời Đông Bắc", x: 580, z: -545, radius: 7.5 },
    { type: "circle", id: "sw_pearl_lighthouse", name: "Tháp Hải Đăng Mũi Ngọc Tây Nam", x: -580, z: 525, radius: 6.5 },
    { type: "circle", id: "se_golden_dragon_altar", name: "Long Đài Đảo Ngọc Rồng Vàng Đông Nam", x: 580, z: 525, radius: 7.5 },
  ];

  /**
   * Kiểm tra xem điểm (x, z) có thuộc Bến Cầu Tàu Gỗ hoặc 4 Cầu Vượt Sông phía Nam không.
   * - Cầu tàu gỗ chính: x ∈ [-3.2, 3.2], z ∈ [28.5, 44.5]
   * - Cầu Bình Minh (Tây Nam): x ∈ [-34, -22], z ∈ [32.0, 66.0]
   * - Cầu Hoàng Hôn (Đông Nam): x ∈ [22, 34], z ∈ [32.0, 66.0]
   * - Cầu Rồng Vàng (Đại lộ Tây 20x): x ∈ [-148, -132], z ∈ [32.0, 66.0]
   * - Cầu Ánh Sao (Đại lộ Đông 20x): x ∈ [132, 148], z ∈ [32.0, 66.0]
   */
  function isOnWoodenPier(x, z, playerRadius = 0.45) {
    const halfWidth = 3.2 - playerRadius;
    if (x >= -halfWidth && x <= halfWidth && z >= 28.5 && z <= 44.5) {
      return true;
    }
    // 4 cây cầu lớn bắc qua sông nối sang bờ Nam mở rộng (z > 64)
    if (x >= -34 + playerRadius && x <= -22 - playerRadius && z >= 32.0 && z <= 66.0) {
      return true;
    }
    if (x >= 22 + playerRadius && x <= 34 - playerRadius && z >= 32.0 && z <= 66.0) {
      return true;
    }
    if (x >= -148 + playerRadius && x <= -132 - playerRadius && z >= 32.0 && z <= 66.0) {
      return true;
    }
    if (x >= 132 + playerRadius && x <= 148 - playerRadius && z >= 32.0 && z <= 66.0) {
      return true;
    }
    return false;
  }

  /**
   * Kiểm tra xem điểm (x, z) có thuộc Đồi Ngắm Cảnh ven sông phía Đông Nam (x ≈ 12, z ≈ 43).
   */
  function isOnScenicHill(x, z) {
    return x >= 7.5 && x <= 16.5 && z >= 38.0 && z <= 48.0;
  }

  /**
   * Kiểm tra va chạm với dòng sông Nam Bộ (z ∈ [33.8, 64.0]) và vùng đầm sen sâu.
   */
  function isWaterCollision(x, z, playerRadius = 0.45) {
    // 1. Dòng sông Nam Bộ chảy ngang phía Nam Chợ Trung Tâm (z từ 33.8 đến 64.0)
    // Phía Nam z > 64.0 là đại lộ bờ Nam dẫn tới Rừng Dừa Tây Nam & Miệt Vườn Đông Nam
    if (z >= 33.8 && z <= 64.0) {
      if (isOnWoodenPier(x, z, playerRadius) || isOnScenicHill(x, z, playerRadius)) {
        return null;
      }
      return {
        id: "river_water_barrier",
        name: "Mặt Nước Sông Quê",
        type: "water",
      };
    }

    // 2. Hồ Sen Tây sâu nước (tâm x = -42, z = 6, bán kính lòng hồ sâu 4.8m)
    const distLotus = Math.hypot(x - (-42), z - 6);
    if (distLotus < 4.8 + playerRadius && !(z >= 9.8 && x <= -45.0)) {
      return {
        id: "lotus_pond_water",
        name: "Lòng Hồ Sen Tây",
        type: "water",
      };
    }

    return null;
  }

  /**
   * Kiểm tra va chạm giữa người chơi (hình tròn bán kính playerRadius tại x, z)
   * với toàn bộ vật thể và giới hạn bản đồ 5x.
   */
  function isColliding(x, z, playerRadius = 0.45) {
    const px = Number(x);
    const pz = Number(z);
    if (Number.isNaN(px) || Number.isNaN(pz)) return { id: "nan_coord" };

    // 1. Kiểm tra giới hạn biên bản đồ thị trấn 5x
    if (
      px < BOUNDS.minX + playerRadius ||
      px > BOUNDS.maxX - playerRadius ||
      pz < BOUNDS.minZ + playerRadius ||
      pz > BOUNDS.maxZ - playerRadius
    ) {
      return {
        id: "world_bounds_limit",
        name: "Giới Hạn Biên Thị Trấn",
        type: "boundary",
      };
    }

    // 2. Kiểm tra vùng nước sâu
    const waterHit = isWaterCollision(px, pz, playerRadius);
    if (waterHit) return waterHit;

    // 3. Kiểm tra danh mục vật cản hình học (AABB Box & Circle)
    for (let i = 0; i < OBSTACLES.length; i++) {
      const obs = OBSTACLES[i];

      if (obs.type === "box") {
        const closestX = Math.max(obs.minX, Math.min(obs.maxX, px));
        const closestZ = Math.max(obs.minZ, Math.min(obs.maxZ, pz));
        const dx = px - closestX;
        const dz = pz - closestZ;
        const distSq = dx * dx + dz * dz;

        if (distSq < playerRadius * playerRadius) {
          return obs;
        }
      } else if (obs.type === "circle") {
        const dx = px - obs.x;
        const dz = pz - obs.z;
        const minDist = obs.radius + playerRadius;
        if (dx * dx + dz * dz < minDist * minDist) {
          return obs;
        }
      }
    }

    return null;
  }

  /**
   * Giải quyết di chuyển trượt mượt mà (Smooth Sliding Collision Resolution).
   */
  function resolveMovement(currentX, currentZ, deltaX, deltaZ, playerRadius = 0.45) {
    let nextX = currentX + deltaX;
    let nextZ = currentZ + deltaZ;
    let hitX = false;
    let hitZ = false;

    if (isColliding(nextX, currentZ, playerRadius)) {
      nextX = currentX;
      hitX = true;
    }

    if (isColliding(nextX, nextZ, playerRadius)) {
      nextZ = currentZ;
      hitZ = true;
    }

    if (hitX && hitZ && isColliding(nextX, nextZ, playerRadius)) {
      nextX = currentX;
      nextZ = currentZ;
    }

    return {
      x: Number(nextX.toFixed(3)),
      z: Number(nextZ.toFixed(3)),
      hit: hitX || hitZ,
      hitX,
      hitZ,
    };
  }

  function clampToBounds(x, z, playerRadius = 0.45) {
    const cx = Math.max(BOUNDS.minX + playerRadius, Math.min(BOUNDS.maxX - playerRadius, Number(x) || 0));
    const cz = Math.max(BOUNDS.minZ + playerRadius, Math.min(BOUNDS.maxZ - playerRadius, Number(z) || 0));
    return { x: Number(cx.toFixed(2)), z: Number(cz.toFixed(2)) };
  }

  return {
    BOUNDS,
    OBSTACLES,
    isColliding,
    resolveMovement,
    clampToBounds,
    isOnWoodenPier,
  };
});
