/*
 * Vietnamese Real-Time & Seasonal Festival Calendar (Phase 10.3)
 * Supports URL override `?festival=trungthu | tet | quockhanh | muasen`
 */

(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.FestivalsConfig = factory();
  }
})(typeof self !== "undefined" ? self : this, function () {
  const FESTIVALS = {
    tet: {
      id: "tet",
      name: { vi: "🏮 Hội Xuân Tết Nguyên Đán", en: "🏮 Lunar New Year Festival" },
      banner: {
        vi: "Chợ Hoa Xuân rực rỡ, múa lân trống hội, hái lộc lì xì đầu năm!",
        en: "Spring blossom market, lion dance drums, and lucky red envelopes!",
      },
      weather: "blossom",
      lanternColor: 0xef4444,
      accentColor: 0xfacc15,
      bonusAffinity: 10,
      decorations: ["mai_dao_arch", "red_couplets", "lion_dance_stage"],
    },
    trungthu: {
      id: "trungthu",
      name: { vi: "🌕 Đêm Hội Trăng Rằm Trung Thu", en: "🌕 Mid-Autumn Full Moon Festival" },
      banner: {
        vi: "Rước đèn ông sao, thả hoa đăng hồ sen và phá cỗ trông trăng cùng bà con!",
        en: "Star lantern parade, lotus lake floating lanterns, and mooncake feast!",
      },
      weather: "clear",
      lanternColor: 0xf59e0b,
      accentColor: 0xfbbf24,
      bonusAffinity: 15,
      decorations: ["star_lanterns", "full_moon_glow", "lotus_lantern_river"],
    },
    quockhanh: {
      id: "quockhanh",
      name: { vi: "🇻🇳 Ngày Hội Non Sông (30/4 - 2/9)", en: "🇻🇳 National Celebration Day" },
      banner: {
        vi: "Phố phường rợp cờ đỏ sao vàng, diễu hành xe buýt xanh và bắn pháo hoa đêm hội!",
        en: "Streets adorned with red-and-gold flags, green bus parade, and night fireworks!",
      },
      weather: "clear",
      lanternColor: 0xdc2626,
      accentColor: 0xfef08a,
      bonusAffinity: 10,
      decorations: ["national_flags", "night_fireworks"],
    },
    muasen: {
      id: "muasen",
      name: { vi: "🪷 Lễ Hội Mùa Sen Nở & Chợ Quê", en: "🪷 Lotus Blooming Season" },
      banner: {
        vi: "Hồ Sen phía Tây nở rộ thơm ngát, mời bà con chèo thuyền, thả diều và thưởng trà!",
        en: "Western Lotus Lake in full bloom—come row boats, fly kites, and sip lotus tea!",
      },
      weather: "clear",
      lanternColor: 0xec4899,
      accentColor: 0x34d399,
      bonusAffinity: 8,
      decorations: ["giant_lotus_blooms", "kite_sky"],
    },
  };

  function getActiveFestival(overrideCode = null, dateObj = new Date()) {
    if (overrideCode && FESTIVALS[overrideCode.toLowerCase()]) {
      return FESTIVALS[overrideCode.toLowerCase()];
    }
    // Tính theo múi giờ Việt Nam (UTC+7)
    const vnTime = new Date(dateObj.getTime() + 7 * 3600 * 1000);
    const month = vnTime.getUTCMonth() + 1;
    const day = vnTime.getUTCDate();

    if (month === 1 || month === 2) return FESTIVALS.tet;
    if ((month === 4 && day >= 25) || (month === 5 && day <= 3) || (month === 9 && day <= 5)) {
      return FESTIVALS.quockhanh;
    }
    if (month === 9 || month === 10) return FESTIVALS.trungthu;
    return FESTIVALS.muasen;
  }

  return {
    FESTIVALS,
    getActiveFestival,
  };
});
