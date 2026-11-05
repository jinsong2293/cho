/**
 * Canonical Weather & Climate Engine for Chợ Thị Trấn Việt Nam 3D
 * Single Source of Truth for:
 * - HUD Weather Chip
 * - Market Event Loa Phường Banner
 * - 3D Scene Sky Gradient, Fog Color & Lighting
 * - Rain, Heat Shimmer, Blossom Particles & Pavement Wetness
 * - Market Supply & Demand Multipliers
 */

const WEATHER_STATES = {
  clear: {
    id: "clear",
    condition: "clear",
    icon: "☀️",
    nameVi: "Trời Quang Nắng Đẹp",
    nameEn: "Sunny & Clear",
    city: "TP. Hồ Chí Minh",
    temp: 32,
    humidity: 65,
    skyColors: {
      day: { top: 0x38bdf8, bottom: 0xbae6fd, fog: 0xbae6fd },
      night: { top: 0x090d16, bottom: 0x1e293b, fog: 0x111827 },
    },
    rainActive: false,
    heatActive: false,
    blossomActive: false,
    pavementRoughness: 0.72,
    pavementMetalness: 0.1,
    eventTitle: "🎒 Du Khách Ghé Thăm Chợ Phố!",
    eventDesc: "Trời nắng đẹp chan hòa, du khách khắp nơi đổ về dạo phố mua quà lưu niệm!",
    boostCategory: null,
    sellMultiplier: 1.25,
    buyMultiplier: 1.0,
  },
  heatwave: {
    id: "heatwave",
    condition: "heatwave",
    icon: "🔥",
    nameVi: "Nắng Gắt 38°C",
    nameEn: "Heatwave 38°C",
    city: "TP. Hồ Chí Minh",
    temp: 38,
    humidity: 48,
    skyColors: {
      day: { top: 0x0284c7, bottom: 0xfef08a, fog: 0xfde68a },
      night: { top: 0x1c1917, bottom: 0x451a03, fog: 0x292524 },
    },
    rainActive: false,
    heatActive: true,
    blossomActive: false,
    pavementRoughness: 0.88,
    pavementMetalness: 0.05,
    eventTitle: "🔥 Nắng Gắt Đỉnh Điểm 38°C!",
    eventDesc: "Trời nắng gắt gay gắt! Bà con đổ xô giải nhiệt, Nước Mía & Trái Cây tăng giá +45%!",
    boostCategory: ["Giải khát", "Trái cây"],
    sellMultiplier: 1.15,
    buyMultiplier: 1.0,
  },
  rain: {
    id: "rain",
    condition: "rain",
    icon: "🌧️",
    nameVi: "Mưa Rào Phố Chợ",
    nameEn: "Tropical Rain",
    city: "TP. Hồ Chí Minh",
    temp: 27,
    humidity: 92,
    skyColors: {
      day: { top: 0x475569, bottom: 0x94a3b8, fog: 0x64748b },
      night: { top: 0x0f172a, bottom: 0x1e293b, fog: 0x1e293b },
    },
    rainActive: true,
    heatActive: false,
    blossomActive: false,
    pavementRoughness: 0.22,
    pavementMetalness: 0.55,
    eventTitle: "🌧️ Cơn Mưa Rào Chiều Phố Chợ!",
    eventDesc: "Mưa rơi mát rượi khắp thị trấn! Phở Bò nóng hổi & Bánh Mì giòn rụm đắt khách (+45%)!",
    boostCategory: ["Ẩm thực"],
    sellMultiplier: 1.15,
    buyMultiplier: 1.0,
  },
  blossom: {
    id: "blossom",
    condition: "blossom",
    icon: "🌸",
    nameVi: "Hoa Xuân Gió Lộng",
    nameEn: "Spring Blossoms",
    city: "TP. Hồ Chí Minh",
    temp: 29,
    humidity: 70,
    skyColors: {
      day: { top: 0x38bdf8, bottom: 0xfbcfe8, fog: 0xfce7f3 },
      night: { top: 0x1e1b4b, bottom: 0x4c1d95, fog: 0x2e1065 },
    },
    rainActive: false,
    heatActive: false,
    blossomActive: true,
    pavementRoughness: 0.65,
    pavementMetalness: 0.12,
    eventTitle: "🌸 Lễ Hội Hoa Bay & Đèn Lồng Phố Cổ!",
    eventDesc: "Cánh hoa mai hoa đào bay rợp trời! Hoa tươi, Ẩm thực & Đồ thủ công tăng giá +45%!",
    boostCategory: ["Ẩm thực", "Hoa tươi", "Đặc sản"],
    sellMultiplier: 1.15,
    buyMultiplier: 1.0,
  },
  cloudy: {
    id: "cloudy",
    condition: "cloudy",
    icon: "⛅",
    nameVi: "Nhiều Mây Dịu Mát",
    nameEn: "Partly Cloudy",
    city: "TP. Hồ Chí Minh",
    temp: 30,
    humidity: 78,
    skyColors: {
      day: { top: 0x60a5fa, bottom: 0xe2e8f0, fog: 0xcfd8dc },
      night: { top: 0x0f172a, bottom: 0x334155, fog: 0x1e293b },
    },
    rainActive: false,
    heatActive: false,
    blossomActive: false,
    pavementRoughness: 0.68,
    pavementMetalness: 0.15,
    eventTitle: "⛅ Gió Mát Lành Dạo Chợ Phố!",
    eventDesc: "Gió mát dịu dàng thổi qua các sạp hàng, bà con thong thả uống trà đá và đá cầu giao lưu!",
    boostCategory: null,
    sellMultiplier: 1.1,
    buyMultiplier: 1.0,
  },
};

const WEATHER_LIST = ["clear", "heatwave", "rain", "blossom", "cloudy"];

function getWeatherState(id = "clear") {
  const base = WEATHER_STATES[id] || WEATHER_STATES.clear;
  const tempNumber = typeof base.temp === "number" ? base.temp : 32;
  const tempFormatted = `${tempNumber}°C`;
  const particles = base.rainActive ? "rain" : (base.heatActive ? "heat" : (base.blossomActive ? "blossom" : "none"));

  return {
    ...base,
    name: base.nameVi,
    temp: tempFormatted,
    tempNumber,
    description: base.eventDesc,
    title: base.eventTitle,
    particles,
    roughness: base.pavementRoughness !== undefined ? base.pavementRoughness : 0.75,
    metalness: base.pavementMetalness !== undefined ? base.pavementMetalness : 0.1,
  };
}

(function (root) {
  root.WEATHER_STATES = WEATHER_STATES;
  root.WEATHER_LIST = WEATHER_LIST;
  root.getWeatherState = getWeatherState;
})(typeof window !== "undefined" ? window : (typeof globalThis !== "undefined" ? globalThis : this));

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    WEATHER_STATES,
    WEATHER_LIST,
    getWeatherState,
  };
}
