/*
 * Bilingual i18n (Vietnamese / English) & Global XSS HTML Escaping (Phase 1.1 & Phase 5.8)
 * Chợ Thị Trấn Việt Nam 3D — Sân Chơi Mở
 */

(function (root) {
  function escapeHtml(unsafe) {
    if (unsafe === null || unsafe === undefined) return "";
    return String(unsafe)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  const DICT = {
    vi: {
      app_title: "🏮 CHỢ THỊ TRẤN VIỆT NAM 3D",
      app_subtitle: "Sân chơi mở thân thiện! Chọn nhân vật, đặt tên và vào dạo chợ, uống trà đá, đá cầu, thả đèn hoa đăng cùng bạn bè ngay!",
      play_now: "🏮 VÀO CHƠI NGAY",
      random_name: "🎲 Đổi Tên Gợi Ý",
      room_placeholder: "Mã phòng bạn bè (vd: ABCD)",
      recovery_placeholder: "Mã khôi phục 6 ký tự (nếu chuyển máy)",
      online_banner: "Đang có {count} bà con vui chơi trong thị trấn",
      card_move: "🛵 Dạo Phố & Xe Buýt",
      card_chat: "💬 Trò Chuyện & Trà Đá",
      card_play: "🪶 Đá Cầu, Kéo Co & Lễ Hội",
      rules_link: "📜 Luật chơi vui vẻ & An toàn",
      join_title: "🏮 Chợ Thị Trấn Việt Nam",
      join_sub: "Dạo chợ, uống trà đá, trò chuyện và chơi cùng bạn bè.",
      join_step_name: "Tên của bạn",
      join_name_placeholder: "Nhập tên của bạn",
      join_placeholder: "Nhập tên của bạn...",
      join_random_name: "🎲 Đổi Tên",
      join_step_char: "Chọn nhân vật",
      join_cta: "▶ VÀO CHỢ",
      join_more: "Có mã phòng của bạn bè?",
      join_room_label: "Mã phòng (bạn bè gửi cho bạn)",
      join_room_placeholder: "Ví dụ: ABCD",
      room_code_placeholder: "Mã phòng bạn bè (nếu có)",
      join_recovery_label: "Mã khôi phục (chỉ dùng khi đổi máy)",
      join_recovery_placeholder: "6 ký tự",
      join_hint_desktop: "Đi bằng WASD hoặc phím mũi tên · Bấm vào người khác để chào",
      join_hint_touch: "Kéo cần gạt để đi · Chạm vào người khác để chào",
      join_online: "🟢 {count} bà con & cư dân đang dạo chợ",
      tip_move: "Kéo / Chạm để đi",
      tip_chat: "Chạm người kết bạn",
      tip_play: "9 Khu phố & Lễ hội",
      hud_chat_title: "💬 TRÒ CHUYỆN & BÀ TÁM CHỢ",
      hud_loa_title: "📢 BẢN TIN LOA PHƯỜNG",
      chat_tab_all: "Tất cả",
      chat_tab_nearby: "Quanh đây (18m)",
      chat_tab_system: "Hệ thống",
      chat_placeholder: "Nhắn tin rao hàng với bà con...",
      chat_send: "Gửi",
      social_title: "🤝 GIAO LƯU TIỂU THƯƠNG",
      social_block: "🚫 Chặn / Bỏ Chặn",
      social_report: "🚩 Báo Cáo Vi Phạm",
      settings_title: "⚙️ CÀI ĐẶT, ĐỒ HỌA & TRỢ NĂNG",
      photo_save: "📸 Lưu Ảnh Bưu Thiếp PNG",
      photo_exit: "✕ Thoát Chế Độ Chụp",
      hud_chat: "💬 Trò chuyện",
      hud_emote: "😊 Biểu cảm",
      hud_goto: "🧭 Đi tới...",
      hud_activities: "🎪 Hoạt động",
      hud_photo: "📸 Chụp ảnh",
      hud_settings: "⚙️ Cài đặt",
      hud_invite: "💌 Mời bạn",
      golden_hour_join: "🌟 Tham gia Giờ Vàng",
      quick_hi: "Chào bà con 👋",
      quick_shuttle: "Ai đá cầu không? 🪶",
      quick_tea: "Ngồi trà đá nè ☕",
      quick_newbie: "Mới chơi, chỉ giùm với! 🌱",
      quick_thanks: "Cảm ơn nha 🙏",
      tab_all_chat: "💬 Trò chuyện",
      tab_sys_chat: "📢 Hệ thống",
      block_player: "🚫 Chặn / Bỏ chặn",
      report_player: "🚩 Báo cáo vi phạm",
      wave_player: "👋 Vẫy tay chào (+Điểm Thân Thiết)",
      pwa_install: "📲 Cài về màn hình chính",
    },
    en: {
      app_title: "🏮 VIETNAMESE 3D SOCIAL TOWN",
      app_subtitle: "Friendly open playground! Pick a character, enter your name and stroll the market, sip iced tea, kick shuttlecock with friends!",
      play_now: "🏮 PLAY NOW",
      random_name: "🎲 Random Name",
      room_placeholder: "Friend room code (e.g. ABCD)",
      recovery_placeholder: "6-char recovery code (optional)",
      online_banner: "{count} neighbors currently hanging out in town",
      card_move: "🛵 Roam & Green Bus",
      card_chat: "💬 Chat & Iced Tea",
      card_play: "🪶 Shuttlecock, Co-op & Festivals",
      rules_link: "📜 Friendly & Safe Playground Rules",
      join_title: "🏮 Vietnamese Town Market",
      join_sub: "Stroll the market, sip iced tea, chat and play with friends.",
      join_step_name: "Your name",
      join_name_placeholder: "Enter your name",
      join_placeholder: "Enter your name...",
      join_random_name: "🎲 Random Name",
      join_step_char: "Pick a character",
      join_cta: "▶ ENTER THE MARKET",
      join_more: "Got a friend's room code?",
      join_room_label: "Room code (sent by your friend)",
      join_room_placeholder: "e.g. ABCD",
      room_code_placeholder: "Friend's room code (if any)",
      join_recovery_label: "Recovery code (only when switching devices)",
      join_recovery_placeholder: "6 characters",
      join_hint_desktop: "Move with WASD or arrow keys · Click a player to say hi",
      join_hint_touch: "Drag the stick to move · Tap a player to say hi",
      join_online: "🟢 {count} people & residents are strolling the market",
      tip_move: "Drag / Tap to move",
      tip_chat: "Tap players to friend",
      tip_play: "9 Town Zones & Festivals",
      hud_chat_title: "💬 TOWN CHAT & GOSSIP",
      hud_loa_title: "📢 TOWN LOUDSPEAKER BULLETINS",
      chat_tab_all: "All",
      chat_tab_nearby: "Nearby (18m)",
      chat_tab_system: "System",
      chat_placeholder: "Chat with everyone...",
      chat_send: "Send",
      social_title: "🤝 MEET & GREET",
      social_block: "🚫 Block / Unblock",
      social_report: "🚩 Report Player",
      settings_title: "⚙️ SETTINGS, GRAPHICS & ACCESSIBILITY",
      photo_save: "📸 Save Postcard PNG",
      photo_exit: "✕ Exit Photo Mode",
      hud_chat: "💬 Chat",
      hud_emote: "😊 Emotes",
      hud_goto: "🧭 Go To...",
      hud_activities: "🎪 Activities",
      hud_photo: "📸 Photo Mode",
      hud_settings: "⚙️ Settings",
      hud_invite: "💌 Invite Friends",
      golden_hour_join: "🌟 Join Golden Hour",
      quick_hi: "Hello everyone 👋",
      quick_shuttle: "Shuttlecock anyone? 🪶",
      quick_tea: "Iced tea hangout ☕",
      quick_newbie: "New here, say hi! 🌱",
      quick_thanks: "Thank you 🙏",
      tab_all_chat: "💬 Player Chat",
      tab_sys_chat: "📢 Town Notices",
      block_player: "🚫 Block / Unblock",
      report_player: "🚩 Report Player",
      wave_player: "👋 Wave Hello (+Affinity)",
      pwa_install: "📲 Add to Home Screen",
    },
  };

  let currentLang = "vi";
  try {
    const saved = localStorage.getItem("cho_lang");
    if (saved === "en" || saved === "vi") {
      currentLang = saved;
    } else if (navigator.language && !navigator.language.toLowerCase().startsWith("vi")) {
      currentLang = "vi"; // Mặc định ưu tiên tiếng Việt bản sắc, có nút chuyển EN 1 chạm
    }
  } catch (_) {}

  function t(key, vars = {}) {
    const table = DICT[currentLang] || DICT.vi;
    let str = table[key] || DICT.vi[key] || key;
    for (const [k, v] of Object.entries(vars)) {
      str = str.replace(`{${k}}`, String(v));
    }
    return str;
  }

  function setLanguage(lang) {
    currentLang = lang === "en" ? "en" : "vi";
    try {
      localStorage.setItem("cho_lang", currentLang);
    } catch (_) {}
    applyI18nToDOM();
    if (typeof root.updateHUD === "function") root.updateHUD();
  }

  function toggleLanguage() {
    setLanguage(currentLang === "vi" ? "en" : "vi");
    return currentLang;
  }

  function getLanguage() {
    return currentLang;
  }

  function applyI18nToDOM() {
    if (typeof document === "undefined") return;
    document.querySelectorAll("[data-i18n]").forEach((el) => {
      const k = el.getAttribute("data-i18n");
      if (k) el.textContent = t(k);
    });
    document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
      const k = el.getAttribute("data-i18n-placeholder");
      if (k) el.setAttribute("placeholder", t(k));
    });
    const langBtn = document.getElementById("lang-switch-btn");
    if (langBtn) {
      langBtn.textContent = currentLang === "vi" ? "🌐 VI / EN" : "🌐 EN / VI";
    }
  }

  root.escapeHtml = escapeHtml;
  root.t = t;
  root.setLanguage = setLanguage;
  root.toggleLanguage = toggleLanguage;
  root.getLanguage = getLanguage;
  root.applyI18nToDOM = applyI18nToDOM;

  if (typeof document !== "undefined") {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", applyI18nToDOM);
    } else {
      applyI18nToDOM();
    }
  }
})(typeof window !== "undefined" ? window : this);
