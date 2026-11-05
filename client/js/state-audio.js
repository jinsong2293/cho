/* ==========================================================================
   CHỢ THỊ TRẤN VIỆT NAM 3D — STATE, AUDIO & HUD HELPERS (state-audio.js)
   ========================================================================== */

/* ==================== SOFTWARE WEBGL DETECTION ==================== */
const isSoftwareGl = (() => {
  try {
    const gl =
      document.createElement('canvas').getContext('webgl2') ||
      document.createElement('canvas').getContext('webgl');
    if (!gl) return true;
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
    const gpu = String(gl.getParameter(param));
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
  } catch (_) {
    return false;
  }
})();

/* ==================== GLOBAL GAME STATE ==================== */
let socket = null;
let myPlayer = {
  nickname: "",
  money: 15000,
  inventory: {},
  stalls: [],
  quests: [],
  pos: { x: 0, z: 6 },
  y: 0,
  vy: 0,
  rot: 0,
  hoverboard: false,
  danceTimer: 0,
  mesh: null,
};
window.myPlayer = myPlayer;

let gameConstants = {
  GOODS: [],
  MARKET_EVENTS: [],
  STALL_COST: 5000,
  STALL_UPGRADE_COSTS: { 2: 8000, 3: 20000 },
  HIRE_STAFF_COST: 10000,
  GACHA_COST: 2000,
};

let worldState = {
  stalls: [],
  customers: [],
  otherPlayers: {},
  supplyDrop: { active: true, x: 0, z: -6 },
  marketEvent: {
    id: "hot_summer",
    title: "🔥 Nắng Gắt Đỉnh Điểm 40°C!",
    description: "Trời nắng gắt tỏa nhiệt! Bà con đổ xô giải nhiệt, giá Giải khát & Trái cây tăng +45%!",
    weather: "heatwave",
    sellMultiplier: 1.15,
    buyMultiplier: 1.0,
    boostCategory: ["Giải khát", "Trái cây"],
  },
  day: 1,
  timeOfDay: 0.25,
  leaderboard: [],
};
window.worldState = worldState;

let currentInteractingStall = null;
let selectedWholesaleCategory = "Tất cả";

// Quản lý chế độ thời tiết động: 'auto' | 'rain' | 'heatwave' | 'blossom' | 'clear'
const WEATHER_MODES = ['auto', 'rain', 'heatwave', 'blossom', 'clear'];
let weatherOverrideIndex = 0; // 0 = auto
let activeWeather = 'heatwave';
window.getActiveWeather = () => activeWeather;
window.getActiveWeatherMode = () => WEATHER_MODES[weatherOverrideIndex];

const VIETNAMESE_MARKET_CRIES = [
  "Ai bánh mì Sài Gòn nóng giòn đặc biệt đây! 🥖",
  "Mại dô mại dô! Xả hàng nghỉ sớm về nấu cơm cho vợ! 😂",
  "Sầu riêng Ri6 chín cây, bao ăn bao sượng bà con ơi! 🍈",
  "Bún đậu mắm tôm thơm nức mũi cả khu phố đây! 🍱",
  "Nước mía siêu sạch 10 ngàn giải nhiệt ngày hè nào! 🥤",
  "Phở bò gia truyền nước trong vị đậm, ăn là ghiền! 🍜",
];

const JUMP_PADS = [
  // 4 Đệm Nhún Hội Chợ Trung Tâm
  { x: -6.5, z: -6.5, color: 0xef4444 },
  { x:  6.5, z: -6.5, color: 0xf59e0b },
  { x: -6.5, z:  6.5, color: 0x10b981 },
  { x:  6.5, z:  6.5, color: 0x3b82f6 },
  // 8 Đệm Nhún Liên Hoàn Đại Lộ & Khu Vui Chơi Mở Rộng
  { x: -20.5, z: -16.0, color: 0xec4899 },
  { x:  20.5, z: -15.0, color: 0x8b5cf6 },
  { x: -18.0, z:  14.0, color: 0x06b6d4 },
  { x:  18.0, z:  14.0, color: 0xf97316 },
  { x:   0.0, z: -38.0, color: 0x14b8a6 },
  { x: -38.0, z:   0.0, color: 0xeab308 },
  { x:  38.0, z:   0.0, color: 0xa855f7 },
  { x:   0.0, z:  72.0, color: 0xf43f5e },
  // 8 Đệm Nhún Vùng Ngoại Ô & Vành Đai 20x
  { x: -135.0, z: -115.0, color: 0x38bdf8 },
  { x:  135.0, z: -115.0, color: 0xf43f5e },
  { x: -135.0, z:  105.0, color: 0x10b981 },
  { x:  135.0, z:  105.0, color: 0xfacc15 },
  { x: -555.0, z: -505.0, color: 0xf97316 },
  { x:  555.0, z: -505.0, color: 0xec4899 },
  { x: -555.0, z:  485.0, color: 0x06b6d4 },
  { x:  555.0, z:  485.0, color: 0xa855f7 },
];

function getFormattedWeatherInfo(weatherKey) {
  const raw =
    (window.getWeatherState && typeof window.getWeatherState === 'function'
      ? window.getWeatherState(weatherKey)
      : null) ||
    (window.WEATHER_PRESETS && window.WEATHER_PRESETS[weatherKey]) || {
      name: 'Nắng Đẹp',
      icon: '☀️',
      temp: 32,
      description: 'Trời quang đãng, nắng ấm chan hòa khắp thị trấn.',
      skyZenith: '#38bdf8',
      skyHorizon: '#bae6fd',
      fogColor: 0xbae6fd,
      particles: 'none',
      roughness: 0.75,
      metalness: 0.1,
    };

  const tempStr =
    typeof raw.temp === 'number'
      ? `${raw.temp}°C`
      : String(raw.temp || '32°C').includes('°')
      ? String(raw.temp)
      : `${raw.temp || 32}°C`;

  return {
    ...raw,
    icon: raw.icon || '☀️',
    name: raw.name || raw.nameVi || 'Nắng Đẹp',
    tempStr,
    description: raw.description || raw.descVi || 'Trời nắng đẹp quang đãng khắp thị trấn!',
  };
}

/* ==================== WEB AUDIO SYNTHESIZER ==================== */
let audioCtx = null;
let soundEnabled = true;

function initAudio() {
  if (!audioCtx) {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (AudioContext) audioCtx = new AudioContext();
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
}

function playSound(type) {
  if (!soundEnabled || !audioCtx) return;
  try {
    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);

    if (type === 'coin') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(987.77, now);
      osc.frequency.setValueAtTime(1318.51, now + 0.08);
      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc.start(now);
      osc.stop(now + 0.35);
    } else if (type === 'horn') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.setValueAtTime(523.25, now + 0.12);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      osc.start(now);
      osc.stop(now + 0.25);
    } else if (type === 'buy') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, now);
      osc.frequency.setValueAtTime(880, now + 0.07);
      gain.gain.setValueAtTime(0.16, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
      osc.start(now);
      osc.stop(now + 0.22);
    } else if (type === 'jump') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(240, now);
      osc.frequency.exponentialRampToValueAtTime(780, now + 0.26);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
      osc.start(now);
      osc.stop(now + 0.28);
    } else if (type === 'fanfare') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(523.25, now);
      osc.frequency.setValueAtTime(659.25, now + 0.09);
      osc.frequency.setValueAtTime(783.99, now + 0.18);
      osc.frequency.setValueAtTime(1046.5, now + 0.27);
      gain.gain.setValueAtTime(0.22, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
      osc.start(now);
      osc.stop(now + 0.55);
    } else if (type === 'click') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(850, now);
      gain.gain.setValueAtTime(0.07, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
      osc.start(now);
      osc.stop(now + 0.05);
    } else if (type === 'firework_whistle') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(380, now);
      osc.frequency.exponentialRampToValueAtTime(1650, now + 0.65);
      gain.gain.setValueAtTime(0.09, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.68);
      osc.start(now);
      osc.stop(now + 0.68);
    } else if (type === 'firework_burst') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(125, now);
      osc.frequency.exponentialRampToValueAtTime(32, now + 0.42);
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.58);
      osc.start(now);
      osc.stop(now + 0.58);
    }
  } catch (_) {}
}

function toggleAudio() {
  initAudio();
  soundEnabled = !soundEnabled;
  const audioEl = document.getElementById('audio-icon');
  if (audioEl) {
    audioEl.innerText = soundEnabled ? '🔊 Âm Thanh' : '🔇 Tắt Tiếng';
  }
  showToast(soundEnabled ? 'Đã bật âm thanh chợ!' : 'Đã tắt âm thanh');
}

function toggleDock(forceCollapse) {
  const dock = document.getElementById('bottom-dock-wrapper');
  if (!dock) return;
  const isCollapsed =
    typeof forceCollapse === 'boolean'
      ? forceCollapse
      : !dock.classList.contains('collapsed');
  dock.classList.toggle('collapsed', isCollapsed);
}

function toggleCleanHudMode(forceState) {
  const isClean =
    typeof forceState === 'boolean'
      ? forceState
      : !document.body.classList.contains('clean-hud-mode');
  document.body.classList.toggle('clean-hud-mode', isClean);
  const btn = document.getElementById('hud-clean-view-btn');
  if (btn) {
    btn.innerText = isClean ? '👁️ Hiện UI' : '👁️ Thoáng';
    btn.style.background = isClean ? 'rgba(16, 185, 129, 0.35)' : '';
  }
  showToast(
    isClean
      ? '👁️ Đã bật chế độ Thoáng Màn Hình!'
      : '👁️ Đã hiện lại Khung Chat & Bản Đồ'
  );
}

function openProfileModal() {
  const nameEl = document.getElementById('profile-name-display');
  const moneyEl = document.getElementById('profile-money-val');
  if (nameEl) nameEl.innerText = myPlayer.nickname || 'Bà con';
  if (moneyEl) moneyEl.innerText = `${(myPlayer.money || 0).toLocaleString()}đ`;
  updateHUD();
  openModal('modal-profile');
}

function openFullAppMenuModal() {
  openModal('modal-full-menu');
}

let eventBannerTimer = null;
function dismissEventBanner() {
  const el = document.getElementById('event-banner');
  if (el) el.classList.remove('show');
  if (eventBannerTimer) {
    clearTimeout(eventBannerTimer);
    eventBannerTimer = null;
  }
}

function showEventBanner(title, desc, duration = 6500) {
  const bannerEl = document.getElementById('event-banner');
  const titleEl = document.getElementById('event-title');
  const descEl = document.getElementById('event-desc');
  if (!bannerEl) return;
  if (titleEl && title) titleEl.innerText = title;
  if (descEl && desc) descEl.innerText = desc;
  bannerEl.classList.remove('show');
  void bannerEl.offsetWidth;
  bannerEl.classList.add('show');
  if (eventBannerTimer) clearTimeout(eventBannerTimer);
  eventBannerTimer = setTimeout(() => {
    dismissEventBanner();
  }, duration);
}

function openLoaPhuongModal() {
  initAudio();
  playSound('horn');
  const w = getFormattedWeatherInfo(activeWeather);
  const tEl = document.getElementById('loa-modal-weather-title');
  const dEl = document.getElementById('loa-modal-weather-desc');
  const mEl = document.getElementById('loa-modal-market-info');

  if (tEl) tEl.innerText = `${w.icon} ${w.name} (${w.tempStr})`;
  if (dEl) dEl.innerText = w.description;

  const ev = worldState.marketEvent;
  if (mEl) {
    if (ev && ev.title) {
      mEl.innerHTML = `<strong>${escapeHtml(ev.title)}</strong>: ${escapeHtml(ev.description || '')}`;
    } else {
      mEl.innerText = 'Giá cả tại Chợ Đầu Mối đang bình ổn. Bà con nhanh tay mua sỉ để mở sạp kiếm lời!';
    }
  }

  showEventBanner(`${w.icon} ${w.name}!`, w.description);
  openModal('modal-loa-phuong');
}

function replayLoaPhuongAnnouncement() {
  initAudio();
  playSound('horn');
  const w = getFormattedWeatherInfo(activeWeather);
  showEventBanner(`${w.icon} ${w.name}!`, w.description, 7000);
  closeModal('modal-loa-phuong');
  showToast('📢 Loa Phường đang phát thanh khắp thị trấn!');
}

let achToastTimer = null;
function showAchievementToast(title, desc) {
  const el = document.getElementById('achievement-toast');
  const tEl = document.getElementById('ach-title');
  const dEl = document.getElementById('ach-desc');
  if (!el) return;
  if (tEl) tEl.innerText = title;
  if (dEl) dEl.innerText = desc;
  el.style.display = 'flex';
  el.classList.add('show');
  if (achToastTimer) clearTimeout(achToastTimer);
  achToastTimer = setTimeout(() => {
    dismissAchievementToast();
  }, 4000);
}

function dismissAchievementToast() {
  const el = document.getElementById('achievement-toast');
  if (el) {
    el.classList.remove('show');
    setTimeout(() => {
      if (!el.classList.contains('show')) el.style.display = 'none';
    }, 300);
  }
}

/* ==================== CONTEXTUAL ACTION LOGIC ==================== */
let currentContextActionType = 'chat';
let nearestContextStall = null;

function updateContextAction() {
  if (!myPlayer.mesh) return;
  const px = myPlayer.pos.x;
  const pz = myPlayer.pos.z;

  const iconEl = document.getElementById('context-action-icon');
  const labelEl = document.getElementById('context-action-label');
  if (!iconEl || !labelEl) return;

  function applyContextUI(type, icon, label) {
    currentContextActionType = type;
    iconEl.innerText = icon;
    labelEl.innerText = label;
    const mobIcon = document.getElementById('mob-action-icon');
    const mobLabel = document.getElementById('mob-action-label');
    if (mobIcon) mobIcon.innerText = icon;
    if (mobLabel) mobLabel.innerText = label.replace(/\s*\(.*?\)/, '');
  }

  let nearStall = null;
  let minStallDist = 2.8;
  if (typeof stallMeshes !== 'undefined') {
    Object.values(stallMeshes).forEach((sm) => {
      if (!sm.data) return;
      const sx = sm.data.x !== undefined ? sm.data.x : (sm.data.position && sm.data.position.x) || 0;
      const sz = sm.data.z !== undefined ? sm.data.z : (sm.data.position && sm.data.position.z) || 0;
      const d = Math.hypot(px - sx, pz - sz);
      if (d < minStallDist) {
        minStallDist = d;
        nearStall = sm.data;
      }
    });
  }

  if (nearStall) {
    nearestContextStall = nearStall;
    applyContextUI('stall', '🏪', nearStall.owner === myPlayer.nickname ? 'Quản Lý Sạp (E)' : 'Xem Sạp (E)');
    return;
  }

  if (Math.hypot(px - 26, pz - (-9)) <= 7.0) {
    applyContextUI('bank', '🏦', 'Ngân Hàng Phố Chợ (E)');
    return;
  }
  if (Math.hypot(px - 26, pz - 0) <= 7.0) {
    applyContextUI('lottery', '🎫', 'Đại Lý Vé Số & Cào (E)');
    return;
  }
  if (Math.hypot(px - 26, pz - 9.5) <= 7.0) {
    applyContextUI('garage', '🛵', 'Tiệm Độ Xe & Nước Sâm (E)');
    return;
  }
  if (Math.hypot(px - 48, pz - 22) <= 10.0) {
    applyContextUI('house', '🏠', 'Căn Nhà Riêng Của Bạn (E)');
    return;
  }
  if (Math.hypot(px - (-48), pz - (-16)) <= 11.0) {
    applyContextUI('baucua', '🎲', 'Đại Lầu Hội Bầu Cua (E)');
    return;
  }
  if (Math.hypot(px - 48, pz - (-16)) <= 11.0) {
    applyContextUI('shuttlecock', '🪶', 'Đấu Trường Đá Cầu (E)');
    return;
  }
  if (Math.hypot(px - (-8), pz - 27) <= 11.0) {
    applyContextUI('tea', '☕', 'Quán Trà Đá Vỉa Hè (E)');
    return;
  }
  if (Math.hypot(px - 0, pz - 32) <= 10.5) {
    applyContextUI('fish', '🎣', 'Câu Cá Bến Sông (E)');
    return;
  }
  if (Math.hypot(px - (-26), pz - 0) <= 8.5) {
    applyContextUI('hall', '🏛️', 'Bảng Tin & Sự Kiện (E)');
    return;
  }
  if (Math.hypot(px - (-38), pz - 0) <= 7.5) {
    applyContextUI('tailor', '👘', 'Nhà May Áo Dài Cô Ba (E)');
    return;
  }
  if (Math.hypot(px - (-38), pz - (-18)) <= 7.5) {
    applyContextUI('bank', '🪙', 'Tiệm Vàng Kim Phát (E)');
    return;
  }
  if (Math.hypot(px - (-38), pz - 18) <= 7.5) {
    applyContextUI('garage', '🌿', 'Tiệm Thuốc Bắc Vạn An (E)');
    return;
  }
  if (Math.hypot(px - 38, pz - (-18)) <= 7.5) {
    applyContextUI('tea', '☕', 'Cà Phê Vợt Phố Cổ (E)');
    return;
  }
  if (Math.hypot(px - 38, pz - 0) <= 7.5) {
    applyContextUI('house', '🏨', 'Khách Sạn Đông Dương (E)');
    return;
  }
  if (Math.hypot(px - 38, pz - 18) <= 7.5) {
    applyContextUI('wholesale', '🍧', 'Gánh Chè Ba Miền (E)');
    return;
  }

  applyContextUI('chat', '💬', 'Trò Chuyện (Enter)');
}

function handleContextAction() {
  if (currentContextActionType === 'stall') {
    if (nearestContextStall) {
      currentInteractingStall = nearestContextStall;
      renderStallModalContent(nearestContextStall);
      openModal('modal-stall');
    } else {
      interactNearest();
    }
  } else if (currentContextActionType === 'bank') {
    if (typeof openBankModal === 'function') openBankModal();
  } else if (currentContextActionType === 'lottery') {
    if (typeof openLotteryModal === 'function') openLotteryModal();
  } else if (currentContextActionType === 'garage') {
    if (typeof openGarageModal === 'function') openGarageModal();
  } else if (currentContextActionType === 'tailor') {
    if (typeof openCustomizationModal === 'function') openCustomizationModal();
  } else if (currentContextActionType === 'wholesale') {
    if (typeof openWholesaleModal === 'function') openWholesaleModal();
  } else if (currentContextActionType === 'tea') {
    openTeaTableModal();
  } else if (currentContextActionType === 'fish') {
    openFishingModal();
  } else if (currentContextActionType === 'shuttlecock') {
    kickShuttlecockNow();
  } else if (currentContextActionType === 'baucua') {
    openBauCuaModal();
  } else if (currentContextActionType === 'hall') {
    openCommunityEventsModal();
  } else if (currentContextActionType === 'house') {
    openHouseModal();
  } else {
    const chatInput = document.getElementById('chat-input');
    if (chatInput) chatInput.focus();
  }
}

function resetCameraToPlayer() {
  if (!myPlayer.mesh || !camera || !controls) return;
  const forward = new THREE.Vector3(0, 0, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), myPlayer.rot);
  camera.position.set(
    myPlayer.pos.x - forward.x * 5.5,
    myPlayer.pos.y + 3.0,
    myPlayer.pos.z - forward.z * 5.5
  );
  controls.target.set(myPlayer.pos.x, myPlayer.pos.y + 1.1, myPlayer.pos.z);
  controls.update();
  showToast('🎥 Đã đặt lại góc nhìn thứ ba sau lưng nhân vật!');
}

/* ==================== HUD & ZONE BADGE UPDATERS ==================== */
function getMerchantRankTitle(money, ownedStalls) {
  if (myPlayer.socialTitle && myPlayer.affinity >= 30) {
    return `💖 ${myPlayer.socialTitle}`;
  }
  if (money >= 80000 || ownedStalls >= 3) return "👑 Phú Hộ Đất Việt";
  if (money >= 40000 || ownedStalls >= 2) return "💎 Đại Gia Bến Thành";
  if (money >= 22000 || ownedStalls >= 1) return "🏮 Ông Chủ Mát Tay";
  return "👒 Tiểu Thương Mới";
}

function getCurrentZoneName(x, z) {
  if (window.WorldLayout && typeof window.WorldLayout.getZoneAt === 'function') {
    const zone = window.WorldLayout.getZoneAt(x, z);
    if (zone) {
      const icon = zone.icon || '📍';
      if (typeof zone.name === 'object' && zone.name !== null) {
        const label =
          window.currentLang === 'en'
            ? zone.name.en || zone.name.vi
            : zone.name.vi || zone.name.en;
        return `${icon} ${label}`;
      }
      return window.currentLang === 'en' && zone.nameEn
        ? `${icon} ${zone.nameEn}`
        : `${icon} ${zone.name}`;
    }
  }
  if (z > 22) return "🎣 Bến Sông Làng Quê";
  if (x < -18) return "🏛️ Nhà Văn Hóa Thị Trấn";
  if (x > 18) return "🏡 Phố Dân Cư";
  return "🏮 Khu Chợ Trung Tâm";
}

function updateZoneBadgeHUD() {
  const el = document.getElementById('hud-zone-badge');
  if (!el) return;
  const label = getCurrentZoneName(myPlayer.pos.x, myPlayer.pos.z);
  if (el.innerText !== label) {
    el.innerText = label;
  }
}

function updateHUD() {
  const nick = myPlayer.nickname || 'Bà con';
  const moneyFormatted = `${(myPlayer.money || 0).toLocaleString()}đ`;
  const totalItems = Object.values(myPlayer.inventory || {}).reduce((a, b) => a + b, 0);
  const ownedCount = (worldState.stalls || []).filter((s) => s.owner === myPlayer.nickname).length;

  const nickEl = document.getElementById('hud-nickname');
  if (nickEl) nickEl.innerText = nick;
  const moneyEl = document.getElementById('hud-money');
  if (moneyEl) moneyEl.innerText = moneyFormatted;

  const pNick = document.getElementById('profile-name-display');
  if (pNick) pNick.innerText = nick;
  const pMoney = document.getElementById('profile-money-val');
  if (pMoney) pMoney.innerText = moneyFormatted;

  const invEl = document.getElementById('hud-inv-count');
  if (invEl) invEl.innerText = totalItems;
  const stallsEl = document.getElementById('hud-stalls-count');
  if (stallsEl) stallsEl.innerText = ownedCount;
  const dayEl = document.getElementById('hud-day');
  if (dayEl) dayEl.innerText = `Ngày ${worldState.day || 1}`;

  const rankEl = document.getElementById('hud-rank-badge');
  if (rankEl) rankEl.innerText = getMerchantRankTitle(myPlayer.money, ownedCount);

  const friendsCountEl = document.getElementById('dock-friends-count');
  if (friendsCountEl) {
    friendsCountEl.innerText = Array.isArray(myPlayer.friends) ? myPlayer.friends.length : 0;
  }
  updateZoneBadgeHUD();
}

function showToast(msg) {
  const el = document.getElementById('toast');
  if (!el) return;
  el.innerText = msg;
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 2800);
}
