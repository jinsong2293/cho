/*
 * Data-driven World Layout shared between Server and Client (Phase 8.1 & Phase 9 — 5x Expanded Map)
 * Chợ Thị Trấn Việt Nam 3D — Sân Chơi Mở & Thị Trấn Sống
 */

(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.WorldLayout = factory();
  }
})(typeof self !== "undefined" ? self : this, function () {
  // Mở rộng phạm vi bản đồ lên gấp 20 lần: [-1280, 1280] (tổng diện tích 2560m x 2560m)
  const BOUNDS = {
    minX: -1280,
    maxX: 1280,
    minZ: -1280,
    maxZ: 1280,
    maxSpeedPerSec: 180, // Cho phép di chuyển tốc độ cao bằng xe máy / xe điện trên bản đồ 20x
  };

  const ZONES = [
    {
      id: "tea_table_corner",
      name: { vi: "Khu Phố Văn Hóa Trà Đá & Acoustic Vỉa Hè", en: "Sidewalk Tea & Acoustic Cultural Zone" },
      icon: "☕",
      center: { x: 0, z: 13.5 },
      radius: 11.5,
      priority: 12,
      type: "social",
      capacity: 30,
      ambient: { sound: "chatter", music: "acoustic_guitar" },
      peakHours: [0.15, 0.45, 0.8],
      activities: ["tea_table_chat"],
      spawnPoints: [{ x: 0, z: 10.2 }, { x: -4.5, z: 13.5 }, { x: 4.5, z: 13.5 }],
    },
    {
      id: "shuttlecock_court",
      name: { vi: "Khu Thể Thao & Đấu Trường Đá Cầu Kiểng", en: "Sports Complex & Shuttlecock Stadium" },
      icon: "🪶",
      center: { x: 8, z: -15 },
      radius: 11.0,
      priority: 12,
      type: "park",
      capacity: 30,
      ambient: { sound: "cheers", music: "upbeat_folk" },
      peakHours: [0.5, 0.75],
      activities: ["shuttlecock"],
      spawnPoints: [{ x: 8, z: -11.5 }, { x: 14, z: -15 }],
    },
    {
      id: "bau_cua_booth",
      name: { vi: "Khu Trò Chơi Dân Gian & Lầu Hội Bầu Cua", en: "Folk Gaming Pavilion & Imperial Bầu Cua" },
      icon: "🎲",
      center: { x: -8, z: -16 },
      radius: 11.0,
      priority: 12,
      type: "market",
      capacity: 30,
      ambient: { sound: "festival_drums", music: "tet_festive" },
      peakHours: [0.65, 0.95],
      activities: ["bau_cua"],
      spawnPoints: [{ x: -8, z: -12.0 }, { x: -13.5, z: -16 }],
    },
    {
      id: "quiet_lotus_corner",
      name: { vi: "Góc Yên Tĩnh Thủy Đình Hồ Sen", en: "Quiet Lotus Pavilion" },
      icon: "🌿",
      center: { x: -48, z: 12 },
      radius: 22.0,
      priority: 15,
      type: "quiet",
      capacity: 16,
      ambient: { sound: "water_breeze", music: "none" },
      peakHours: [0.0, 1.0],
      activities: ["lantern_wish"],
      spawnPoints: [{ x: -46, z: 10 }],
    },
    {
      id: "night_food_stage",
      name: { vi: "Đại Quảng Trường Ẩm Thực Đêm & Sân Khấu Lớn", en: "Mega Night Food Boulevard & Stage" },
      icon: "🎤",
      center: { x: 0, z: -44 },
      radius: 55,
      priority: 8,
      type: "culture",
      capacity: 30,
      ambient: { sound: "sizzle_crowd", music: "night_stage" },
      peakHours: [0.7, 0.98],
      activities: ["open_stage", "karaoke_rhythm", "street_feast"],
      spawnPoints: [{ x: 0, z: -40 }, { x: -10, z: -46 }, { x: 10, z: -46 }],
    },
    {
      id: "lotus_park_village",
      name: { vi: "Đại Công Viên Hồ Sen & Sân Hội Kéo Co", en: "Mega Lotus Park & Tug-of-War Arena" },
      icon: "🪷",
      center: { x: -38, z: 0 },
      radius: 65,
      priority: 7,
      type: "park",
      capacity: 30,
      ambient: { sound: "cicadas_pond", music: "bamboo_flute" },
      peakHours: [0.45, 0.72],
      activities: ["tug_of_war", "kite_flying", "lantern_wish", "community_board"],
      spawnPoints: [{ x: -26, z: 7.2 }, { x: -38, z: -8 }],
    },
    {
      id: "craft_village_garden",
      name: { vi: "Đại Làng Nghề Truyền Thống & Vườn Sinh Thái", en: "Mega Craft Village & Eco Garden" },
      icon: "🌱",
      center: { x: 38, z: 0 },
      radius: 65,
      priority: 7,
      type: "home",
      capacity: 30,
      ambient: { sound: "birds_garden", music: "countryside_lute" },
      peakHours: [0.15, 0.55],
      activities: ["community_garden", "banh_chung_coop", "player_house"],
      spawnPoints: [{ x: 21, z: 3 }, { x: 38, z: -8 }],
    },
    {
      id: "floating_market_hill",
      name: { vi: "Đại Bến Sông, Chợ Nổi Miền Tây & Đồi Vọng Cảnh", en: "Mega Floating Market & Scenic Hill" },
      icon: "🚤",
      center: { x: 0, z: 38 },
      radius: 65,
      priority: 7,
      type: "water",
      capacity: 30,
      ambient: { sound: "river_waves", music: "southern_folk" },
      peakHours: [0.2, 0.65, 0.85],
      activities: ["fishing", "boat_rowing", "lantern_wish", "scenic_photo"],
      spawnPoints: [{ x: 0, z: 29 }, { x: 10, z: 42 }],
    },
    {
      id: "kite_meadow_nw",
      name: { vi: "Đồi Thả Diều Sáo & Sân Hội Tây Bắc", en: "Northwest Kite Meadow & Folk Arena" },
      icon: "🪁",
      center: { x: -140, z: -130 },
      radius: 95,
      priority: 6,
      type: "park",
      capacity: 30,
      ambient: { sound: "water_breeze", music: "bamboo_flute" },
      peakHours: [0.4, 0.75],
      activities: ["kite_flying", "shuttlecock", "tug_of_war"],
      spawnPoints: [{ x: -140, z: -122 }, { x: -125, z: -130 }],
    },
    {
      id: "flower_valley_ne",
      name: { vi: "Thung Lũng Hoa Xuân & Đồi Chè Đông Bắc", en: "Northeast Flower Valley & Tea Hills" },
      icon: "🌸",
      center: { x: 140, z: -130 },
      radius: 95,
      priority: 6,
      type: "park",
      capacity: 30,
      ambient: { sound: "birds_garden", music: "countryside_lute" },
      peakHours: [0.15, 0.6],
      activities: ["community_garden", "scenic_photo"],
      spawnPoints: [{ x: 140, z: -122 }, { x: 125, z: -130 }],
    },
    {
      id: "coconut_canal_sw",
      name: { vi: "Rừng Dừa Nước & Bến Thuyền Tây Nam", en: "Southwest Coconut Canal & Marina" },
      icon: "🥥",
      center: { x: -140, z: 120 },
      radius: 95,
      priority: 6,
      type: "water",
      capacity: 30,
      ambient: { sound: "river_waves", music: "southern_folk" },
      peakHours: [0.25, 0.8],
      activities: ["fishing", "boat_rowing", "lantern_wish"],
      spawnPoints: [{ x: -140, z: 110 }, { x: -125, z: 118 }],
    },
    {
      id: "orchard_hill_se",
      name: { vi: "Miệt Vườn Trái Cây & Đồi Hoàng Hôn Đông Nam", en: "Southeast Tropical Orchard & Sunset Hill" },
      icon: "🍈",
      center: { x: 140, z: 120 },
      radius: 95,
      priority: 6,
      type: "home",
      capacity: 30,
      ambient: { sound: "birds_garden", music: "southern_folk" },
      peakHours: [0.3, 0.85],
      activities: ["scenic_photo", "tea_table_chat"],
      spawnPoints: [{ x: 140, z: 110 }, { x: 125, z: 118 }],
    },
    {
      id: "mountain_pagoda_nw",
      name: { vi: "Đỉnh Núi Chùa Đồng & Cổng Trời Tây Bắc", en: "Northwest Bronze Pagoda Peak & Sky Gate" },
      icon: "🏔️",
      center: { x: -580, z: -540 },
      radius: 190,
      priority: 5,
      type: "culture",
      capacity: 30,
      ambient: { sound: "water_breeze", music: "bamboo_flute" },
      peakHours: [0.2, 0.8],
      activities: ["scenic_photo", "lantern_wish"],
      spawnPoints: [{ x: -560, z: -510 }, { x: -540, z: -540 }],
    },
    {
      id: "sun_wheel_park_ne",
      name: { vi: "Công Viên Vòng Quay Mặt Trời & Đấu Trường Đông Bắc", en: "Northeast Sun Wheel Theme Park & Arena" },
      icon: "🎡",
      center: { x: 580, z: -540 },
      radius: 190,
      priority: 5,
      type: "park",
      capacity: 30,
      ambient: { sound: "cheers", music: "upbeat_folk" },
      peakHours: [0.4, 0.95],
      activities: ["shuttlecock", "bau_cua", "scenic_photo"],
      spawnPoints: [{ x: 560, z: -510 }, { x: 540, z: -540 }],
    },
    {
      id: "lighthouse_bay_sw",
      name: { vi: "Vịnh Hải Đăng Mũi Ngọc & Bãi Biển Tây Nam", en: "Southwest Pearl Lighthouse Bay & Beach" },
      icon: "🌊",
      center: { x: -580, z: 520 },
      radius: 190,
      priority: 5,
      type: "water",
      capacity: 30,
      ambient: { sound: "river_waves", music: "southern_folk" },
      peakHours: [0.3, 0.9],
      activities: ["fishing", "scenic_photo", "tea_table_chat"],
      spawnPoints: [{ x: -560, z: 490 }, { x: -540, z: 520 }],
    },
    {
      id: "golden_dragon_island_se",
      name: { vi: "Đảo Ngọc Rồng Vàng & Quảng Trường Pháo Hoa Đông Nam", en: "Southeast Golden Dragon Island & Fireworks Plaza" },
      icon: "🐉",
      center: { x: 580, z: 520 },
      radius: 190,
      priority: 5,
      type: "culture",
      capacity: 30,
      ambient: { sound: "festival_drums", music: "tet_festive" },
      peakHours: [0.5, 0.98],
      activities: ["lantern_wish", "scenic_photo", "tea_table_chat"],
      spawnPoints: [{ x: 560, z: 490 }, { x: 540, z: 520 }],
    },
    {
      id: "central_market",
      name: { vi: "Đại Quảng Trường Chợ Trung Tâm", en: "Grand Central Market Plaza" },
      icon: "🏮",
      center: { x: 0, z: 0 },
      radius: 90,
      priority: 1,
      type: "plaza",
      capacity: 30,
      ambient: { sound: "market_bustle", music: "market_day" },
      peakHours: [0.1, 0.4, 0.75],
      activities: ["shuttlecock", "bau_cua", "tea_table_chat", "golden_hour"],
      spawnPoints: [{ x: 0, z: 6 }, { x: -4, z: 6 }, { x: 4, z: 6 }],
    },
  ];

  // Các ghế ngồi chung trên toàn thị trấn (Phase 8.2 — Mở rộng 20x nhiều cụm bàn ghế)
  const SEATS = [
    // Đại Quảng Trường Trà Đá Vỉa Hè (16 ghế nhựa đỏ/xanh quanh 8 bàn)
    { id: "seat-tea-1", zoneId: "tea_table_corner", x: -1.6, z: 12.8, facing: 1.1, type: "plastic_stool" },
    { id: "seat-tea-2", zoneId: "tea_table_corner", x: -1.6, z: 14.2, facing: 2.1, type: "plastic_stool" },
    { id: "seat-tea-3", zoneId: "tea_table_corner", x: 1.6, z: 12.8, facing: -1.1, type: "plastic_stool" },
    { id: "seat-tea-4", zoneId: "tea_table_corner", x: 1.6, z: 14.2, facing: -2.1, type: "plastic_stool" },
    { id: "seat-tea-5", zoneId: "tea_table_corner", x: -0.6, z: 12.2, facing: 0, type: "plastic_stool" },
    { id: "seat-tea-6", zoneId: "tea_table_corner", x: 0.6, z: 12.2, facing: 0, type: "plastic_stool" },
    { id: "seat-tea-7", zoneId: "tea_table_corner", x: -0.6, z: 14.8, facing: Math.PI, type: "plastic_stool" },
    { id: "seat-tea-8", zoneId: "tea_table_corner", x: 0.6, z: 14.8, facing: Math.PI, type: "plastic_stool" },
    { id: "seat-tea-9", zoneId: "tea_table_corner", x: -4.8, z: 12.5, facing: 0, type: "plastic_stool" },
    { id: "seat-tea-10", zoneId: "tea_table_corner", x: -3.2, z: 12.5, facing: 0, type: "plastic_stool" },
    { id: "seat-tea-11", zoneId: "tea_table_corner", x: 3.2, z: 12.5, facing: 0, type: "plastic_stool" },
    { id: "seat-tea-12", zoneId: "tea_table_corner", x: 4.8, z: 12.5, facing: 0, type: "plastic_stool" },
    { id: "seat-tea-13", zoneId: "tea_table_corner", x: -7.8, z: 12.5, facing: 0, type: "plastic_stool" },
    { id: "seat-tea-14", zoneId: "tea_table_corner", x: 7.8, z: 12.5, facing: 0, type: "plastic_stool" },
    // Khán Đài Đại Đấu Trường Đá Cầu Kiểng & Đại Lầu Hội Bầu Cua
    { id: "seat-shuttle-1", zoneId: "shuttlecock_court", x: 2.2, z: -15.0, facing: Math.PI / 2, type: "bleacher" },
    { id: "seat-shuttle-2", zoneId: "shuttlecock_court", x: 13.8, z: -15.0, facing: -Math.PI / 2, type: "bleacher" },
    { id: "seat-baucua-1", zoneId: "bau_cua_booth", x: -13.5, z: -16.0, facing: Math.PI / 2, type: "wood_bench" },
    { id: "seat-baucua-2", zoneId: "bau_cua_booth", x: -2.5, z: -16.0, facing: -Math.PI / 2, type: "wood_bench" },
    // Phố Ẩm Thực Đêm (Bàn quán cóc trước sân khấu)
    { id: "seat-night-1", zoneId: "night_food_stage", x: -5, z: -41, facing: 0, type: "plastic_stool" },
    { id: "seat-night-2", zoneId: "night_food_stage", x: -3.5, z: -41, facing: 0, type: "plastic_stool" },
    { id: "seat-night-3", zoneId: "night_food_stage", x: 3.5, z: -41, facing: 0, type: "plastic_stool" },
    { id: "seat-night-4", zoneId: "night_food_stage", x: 5, z: -41, facing: 0, type: "plastic_stool" },
    // Công Viên Hồ Sen & Cây Đa Sân Làng (Ghế đá & Võng)
    { id: "seat-park-1", zoneId: "lotus_park_village", x: -39, z: -3, facing: 0, type: "stone_bench" },
    { id: "seat-park-2", zoneId: "lotus_park_village", x: -37, z: -3, facing: 0, type: "stone_bench" },
    { id: "seat-quiet-1", zoneId: "quiet_lotus_corner", x: -48, z: 11.5, facing: 0.5, type: "hammock" },
    { id: "seat-quiet-2", zoneId: "quiet_lotus_corner", x: -46.5, z: 11.5, facing: -0.5, type: "stone_bench" },
    // Làng Nghề & Bếp Bánh Chưng (Chiếu cói ngồi quây quần)
    { id: "seat-craft-1", zoneId: "craft_village_garden", x: 39, z: -2, facing: 0.8, type: "bamboo_mat" },
    { id: "seat-craft-2", zoneId: "craft_village_garden", x: 41, z: -2, facing: -0.8, type: "bamboo_mat" },
    { id: "seat-craft-3", zoneId: "craft_village_garden", x: 40, z: -3.5, facing: 0, type: "bamboo_mat" },
    // Đồi Ngắm Cảnh & Bến Sông (Ghế gỗ ngắm hoàng hôn)
    { id: "seat-hill-1", zoneId: "floating_market_hill", x: 11, z: 43, facing: Math.PI, type: "wood_bench" },
    { id: "seat-hill-2", zoneId: "floating_market_hill", x: 12.5, z: 43, facing: Math.PI, type: "wood_bench" },
  ];

  // Lộ trình Xe Buýt Xanh Chạy Vòng Thị Trấn Mở Rộng 20x (13 Trạm liên hoàn)
  const BUS_STOPS = [
    { id: "stop_market", name: { vi: "Trạm Quảng Trường Chợ Trung Tâm", en: "Central Market Stop" }, x: 0, z: 18 },
    { id: "stop_east", name: { vi: "Trạm Đại Làng Nghề & Vườn Sinh Thái", en: "Craft Village Stop" }, x: 36, z: 0 },
    { id: "stop_ne", name: { vi: "Trạm Thung Lũng Hoa Xuân Đông Bắc", en: "Flower Valley Stop" }, x: 130, z: -120 },
    { id: "stop_sun_wheel", name: { vi: "Trạm Công Viên Vòng Quay Mặt Trời", en: "Sun Wheel Theme Park Stop" }, x: 550, z: -510 },
    { id: "stop_north", name: { vi: "Trạm Đại Lộ Ẩm Thực Đêm & Sân Khấu", en: "Night Food Street Stop" }, x: 0, z: -42 },
    { id: "stop_nw", name: { vi: "Trạm Đồi Thả Diều Sáo Tây Bắc", en: "Kite Meadow Stop" }, x: -130, z: -120 },
    { id: "stop_mountain_pagoda", name: { vi: "Trạm Đỉnh Núi Chùa Đồng Tây Bắc", en: "Mountain Pagoda Stop" }, x: -550, z: -510 },
    { id: "stop_west", name: { vi: "Trạm Đại Công Viên Hồ Sen & Sân Kéo Co", en: "Lotus Park Stop" }, x: -36, z: 0 },
    { id: "stop_sw", name: { vi: "Trạm Rừng Dừa Nước Tây Nam", en: "Coconut Canal Stop" }, x: -130, z: 110 },
    { id: "stop_lighthouse", name: { vi: "Trạm Vịnh Hải Đăng Mũi Ngọc Tây Nam", en: "Lighthouse Bay Stop" }, x: -550, z: 490 },
    { id: "stop_south", name: { vi: "Trạm Bến Sông Chợ Nổi & Đồi Ngắm Cảnh", en: "Riverside & Hill Stop" }, x: 0, z: 32 },
    { id: "stop_se", name: { vi: "Trạm Miệt Vườn Trái Cây Đông Nam", en: "Tropical Orchard Stop" }, x: 130, z: 110 },
    { id: "stop_dragon_island", name: { vi: "Trạm Đảo Ngọc Rồng Vàng Đông Nam", en: "Golden Dragon Island Stop" }, x: 550, z: 490 },
  ];

  function clampToBounds(x, z) {
    const cx = Math.max(BOUNDS.minX, Math.min(BOUNDS.maxX, Number(x) || 0));
    const cz = Math.max(BOUNDS.minZ, Math.min(BOUNDS.maxZ, Number(z) || 0));
    return { x: Number(cx.toFixed(2)), z: Number(cz.toFixed(2)) };
  }

  function getZoneAt(x, z) {
    const px = Number(x) || 0;
    const pz = Number(z) || 0;
    let matched = null;
    for (const zDef of ZONES) {
      const d = Math.hypot(px - zDef.center.x, pz - zDef.center.z);
      if (d <= zDef.radius) {
        if (!matched || zDef.priority > matched.priority) {
          matched = zDef;
        }
      }
    }
    return matched || ZONES[ZONES.length - 1];
  }

  return {
    BOUNDS,
    ZONES,
    SEATS,
    BUS_STOPS,
    clampToBounds,
    getZoneAt,
  };
});
