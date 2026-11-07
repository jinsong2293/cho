/* ==========================================================================
   CHỢ THỊ TRẤN VIỆT NAM 3D — ECONOMY UI (economy-ui.js)
   Hợp nhất từ bản local: Tín Hiệu Chợ, Trả Giá 6s, Đặt Giá Sạp, Cấp Độ,
   Tiền Trong Ngày, Tutorial 2.0. Server-authoritative; module tự chứa.
   ========================================================================== */

(function () {
  "use strict";

  const fmt = (n) => (Number(n) || 0).toLocaleString("vi-VN");

  /* ==================== TÍN HIỆU CHỢ ==================== */
  let marketSignals = null;

  function updateMarketSignals(signals) {
    if (!signals) return;
    marketSignals = signals;
    const chip = document.getElementById("market-signal-text");
    if (!chip) return;
    const top = Object.entries(signals.boosts || {}).sort((a, b) => b[1] - a[1])[0];
    chip.textContent = top ? `📈 ${top[0]} ×${top[1]}` : `📈 ${signals.phase || "Chợ"}`;
  }

  function openMarketSignalModal() {
    const existing = document.getElementById("modal-market-signal");
    if (existing) { existing.remove(); return; }
    if (!marketSignals) { showToast("📈 Tín hiệu chợ chưa sẵn sàng, chờ chút nhé!"); return; }

    const cats = {};
    Object.entries(marketSignals.boosts || {}).forEach(([c, m]) => { cats[c] = m; });
    Object.entries(marketSignals.dips || {}).forEach(([c, m]) => { cats[c] = (cats[c] || 1) * m; });
    const rows = Object.entries(cats).sort((a, b) => b[1] - a[1]).map(([c, m]) => {
      const up = m >= 1.05, down = m <= 0.95;
      const color = up ? "#4ade80" : down ? "#f87171" : "#cbd5e1";
      const arrow = up ? "↑ HOT" : down ? "↓ ế" : "— đều";
      const pct = `${m >= 1 ? "+" : ""}${Math.round((m - 1) * 100)}%`;
      return `<div style="display:flex;justify-content:space-between;align-items:center;padding:9px 12px;border-radius:10px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.08);">
        <span style="font-weight:700;color:#f1f5f9;">${c}</span>
        <span style="font-weight:800;color:${color};">${arrow} ${pct}</span>
      </div>`;
    }).join("");

    const overlay = document.createElement("div");
    overlay.id = "modal-market-signal";
    overlay.className = "modal-overlay active";
    overlay.style.cssText = "position:fixed;inset:0;background:rgba(0,0,0,0.68);display:flex;align-items:center;justify-content:center;z-index:9200;backdrop-filter:blur(6px);";
    const box = document.createElement("div");
    box.className = "modal-box";
    box.style.cssText = "max-width:420px;width:94vw;background:var(--bg-card,#1e293b);border:1.5px solid var(--gold,#f59e0b);border-radius:18px;padding:22px;box-shadow:0 18px 45px rgba(0,0,0,0.65);";
    box.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;border-bottom:1px solid rgba(255,255,255,0.12);padding-bottom:10px;">
        <h3 style="margin:0;color:#fde68a;font-size:16px;font-weight:800;">📈 TÍN HIỆU CHỢ — ${marketSignals.phase}</h3>
        <button style="background:transparent;border:none;color:#94a3b8;font-size:20px;cursor:pointer;">✕</button>
      </div>
      <div style="font-size:12.5px;color:#94a3b8;margin-bottom:12px;">${marketSignals.note || ""} — nhập đúng hàng "hot" để bán chạy, tránh hàng đang "ế".</div>
      <div style="display:flex;flex-direction:column;gap:6px;">${rows}</div>
      <div style="margin-top:12px;font-size:11.5px;color:#64748b;">Mẹo: đặt giá nhẹ cao hơn khi hàng hot, hạ giá khi hàng ế. Giá cao quá khách sẽ bỏ đi đấy!</div>`;
    overlay.appendChild(box);
    overlay.addEventListener("click", (e) => { if (e.target === overlay) overlay.remove(); });
    box.querySelector("button").onclick = () => overlay.remove();
    document.body.appendChild(overlay);
  }

  /* ==================== PANEL TRẢ GIÁ (MINIGAME 6 GIÂY) ==================== */
  let activeHaggle = null;
  let haggleBarTimer = null;

  function ensureHagglePanel() {
    let panel = document.getElementById("haggle-panel");
    if (panel) return panel;
    panel = document.createElement("div");
    panel.id = "haggle-panel";
    panel.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;">
        <div style="font-weight:900;font-size:14.5px;color:#fde68a;">🤝 <span id="haggle-customer">Khách</span> đòi trả giá!</div>
        <div style="font-size:11.5px;color:#94a3b8;" id="haggle-countdown">6s</div>
      </div>
      <div style="margin-top:6px;font-size:12.5px;color:#cbd5e1;" id="haggle-detail"></div>
      <div id="haggle-timer-bar" style="margin-top:8px;height:5px;border-radius:3px;background:#f59e0b;width:100%;transform-origin:left center;"></div>
      <div class="haggle-btns" style="display:flex;gap:8px;margin-top:10px;">
        <button class="haggle-btn-accept" onclick="EconomyUI.respondHaggle('accept')" style="flex:1;padding:10px 6px;border-radius:10px;border:1.5px solid #10b981;background:#065f46;color:#d1fae5;font-weight:800;font-size:13px;cursor:pointer;">Bớt Giá<br><span style="font-size:11px;font-weight:600;" id="haggle-accept-price"></span></button>
        <button class="haggle-btn-hold" onclick="EconomyUI.respondHaggle('hold')" style="flex:1;padding:10px 6px;border-radius:10px;border:1.5px solid #f97316;background:#7c2d12;color:#fed7aa;font-weight:800;font-size:13px;cursor:pointer;">ĐÒI GIÁ!<br><span style="font-size:11px;font-weight:600;" id="haggle-hold-price"></span></button>
        <button class="haggle-btn-skip" onclick="EconomyUI.respondHaggle('skip')" style="flex:1;padding:10px 6px;border-radius:10px;border:1.5px solid #334155;background:#1e293b;color:#94a3b8;font-weight:800;font-size:13px;cursor:pointer;">Bỏ qua</button>
      </div>`;
    panel.style.cssText = "position:fixed;left:50%;bottom:118px;transform:translateX(-50%);width:min(420px,92vw);background:rgba(15,23,42,0.96);border:2px solid #f59e0b;border-radius:16px;padding:14px 16px;z-index:900;box-shadow:0 12px 40px rgba(0,0,0,0.6);display:none;";
    document.body.appendChild(panel);
    return panel;
  }

  function showHagglePanel(ev) {
    activeHaggle = ev;
    const panel = ensureHagglePanel();
    panel.querySelector("#haggle-customer").textContent = ev.customerName || "Khách";
    panel.querySelector("#haggle-detail").innerHTML =
      `Khách muốn mua <b>${ev.goodIcon || ""} ${ev.goodName || "hàng"}</b> ×${ev.qty} — giá đăng: <b style="color:#fde68a;">${fmt(ev.askPrice)}đ</b>`;
    panel.querySelector("#haggle-accept-price").textContent = `+${fmt(ev.acceptPrice)}đ chắc chắn`;
    panel.querySelector("#haggle-hold-price").textContent = `+${fmt(ev.holdPrice)}đ nếu khách chịu`;
    panel.style.display = "block";
    if (typeof playSound === "function") playSound("bell");
    const bar = panel.querySelector("#haggle-timer-bar");
    if (bar) {
      bar.style.transition = "none";
      bar.style.transform = "scaleX(1)";
      void bar.offsetWidth;
      const windowSec = Math.max(2, ev.windowSec || 6);
      bar.style.transition = `transform ${windowSec}s linear`;
      bar.style.transform = "scaleX(0)";
      const countdown = panel.querySelector("#haggle-countdown");
      if (countdown) {
        let left = windowSec;
        if (haggleBarTimer) clearInterval(haggleBarTimer);
        haggleBarTimer = setInterval(() => {
          left -= 1;
          countdown.textContent = `${Math.max(0, left)}s`;
          if (left <= 0) clearInterval(haggleBarTimer);
        }, 1000);
      }
    }
  }

  function respondHaggle(choice) {
    if (!activeHaggle || !socket) return;
    socket.emit("haggle_respond", { haggleId: activeHaggle.haggleId, choice }, () => {});
    hideHagglePanel();
  }

  function hideHagglePanel() {
    activeHaggle = null;
    if (haggleBarTimer) { clearInterval(haggleBarTimer); haggleBarTimer = null; }
    const panel = document.getElementById("haggle-panel");
    if (panel) panel.style.display = "none";
  }

  /* ==================== CẤP ĐỘ TIỂU THƯƠNG ==================== */
  let myLevelInfo = { level: 1, title: "Khách Thăm Chợ", currentExp: 0, nextExp: 1000, progress: 0 };

  function updateLevelBadge(info) {
    if (info && info.level !== undefined) myLevelInfo = info;
    const badge = document.getElementById("hud-level-chip");
    if (badge) badge.textContent = `⭐ Lv.${myLevelInfo.level}`;
    if (badge) badge.title = `${myLevelInfo.title} — EXP ${fmt(myLevelInfo.currentExp)}/${fmt(myLevelInfo.nextExp)}. Bấm xem bảng mở khóa`;
    renderTutorialTracker();
  }

  function openLevelInfoModal() {
    const existing = document.getElementById("modal-level-info");
    if (existing) { existing.remove(); return; }
    const unlocks = (gameConstants && gameConstants.LEVEL_UNLOCKS) || {};
    const pct = Math.round((myLevelInfo.progress || 0) * 100);
    const rows = Object.entries(unlocks).map(([lv, what]) => {
      const reached = myLevelInfo.level >= Number(lv);
      return `<div style="display:flex;gap:10px;align-items:center;padding:8px 12px;border-radius:10px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.08);">
        <span style="font-weight:900;color:${reached ? "#4ade80" : "#eab308"};min-width:44px;">Lv.${lv}</span>
        <span style="flex:1;font-size:12.5px;color:${reached ? "#86efac" : "#cbd5e1"};">${what}</span>
        <span>${reached ? "✅" : "🔒"}</span>
      </div>`;
    }).join("");

    const overlay = document.createElement("div");
    overlay.id = "modal-level-info";
    overlay.className = "modal-overlay active";
    overlay.style.cssText = "position:fixed;inset:0;background:rgba(0,0,0,0.68);display:flex;align-items:center;justify-content:center;z-index:9200;backdrop-filter:blur(6px);";
    const box = document.createElement("div");
    box.className = "modal-box";
    box.style.cssText = "max-width:440px;width:94vw;background:var(--bg-card,#1e293b);border:1.5px solid #eab308;border-radius:18px;padding:22px;box-shadow:0 18px 45px rgba(0,0,0,0.65);";
    box.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;border-bottom:1px solid rgba(255,255,255,0.12);padding-bottom:10px;">
        <h3 style="margin:0;color:#fde68a;font-size:16px;font-weight:800;">⭐ CẤP ĐỘ TIỂU THƯƠNG</h3>
        <button style="background:transparent;border:none;color:#94a3b8;font-size:20px;cursor:pointer;">✕</button>
      </div>
      <div style="background:rgba(234,179,8,0.12);border:1px solid rgba(234,179,8,0.4);border-radius:12px;padding:12px 14px;margin-bottom:12px;">
        <div style="font-weight:900;color:#fde68a;font-size:15px;">Cấp ${myLevelInfo.level} — ${myLevelInfo.title}</div>
        <div style="height:8px;background:rgba(0,0,0,0.35);border-radius:4px;margin-top:8px;overflow:hidden;">
          <div style="height:100%;width:${pct}%;background:linear-gradient(90deg,#eab308,#fde047);"></div>
        </div>
        <div style="font-size:11px;color:#a1a1aa;margin-top:5px;">Kinh nghiệm: ${fmt(myLevelInfo.currentExp)}/${fmt(myLevelInfo.nextExp)} — bán hàng & hoạt động để lên cấp</div>
      </div>
      <div style="display:flex;flex-direction:column;gap:6px;">${rows}</div>`;
    overlay.appendChild(box);
    overlay.addEventListener("click", (e) => { if (e.target === overlay) overlay.remove(); });
    box.querySelector("button").onclick = () => overlay.remove();
    document.body.appendChild(overlay);
  }

  /* ==================== TIỀN KIẾM TRONG NGÀY ==================== */
  let myTodayEarnings = 0;

  function addTodayEarnings(amount) {
    myTodayEarnings += Number(amount) || 0;
    updateTodayEarningsChip();
  }

  function resetTodayEarnings() {
    myTodayEarnings = 0;
    updateTodayEarningsChip();
  }

  function updateTodayEarningsChip() {
    const wrap = document.getElementById("hud-money");
    if (!wrap) return;
    const parent = wrap.parentElement;
    let chip = document.getElementById("hud-today-earn");
    if (myTodayEarnings > 0) {
      if (!chip) {
        chip = document.createElement("span");
        chip.id = "hud-today-earn";
        chip.style.cssText = "font-size:10.5px;color:#86efac;font-weight:700;margin-left:4px;";
        parent.appendChild(chip);
      }
      chip.textContent = `(+${fmt(myTodayEarnings)}đ)`;
    } else if (chip) {
      chip.remove();
    }
  }

  /* ==================== TUTORIAL 2.0 ==================== */
  let tutorialStep = 1;
  let tutorialCompleted = false;

  function initTutorial() {
    const p = myPlayer;
    tutorialCompleted = Boolean(p && p.tutorialCompleted);
    tutorialStep = Number(p && p.tutorialStep) || 1;
    renderTutorialTracker();
  }

  function currentTutorialConfig() {
    const steps = (gameConstants && gameConstants.TUTORIAL_STEPS) || [];
    return steps.find((s) => s.step === tutorialStep) || null;
  }

  function renderTutorialTracker() {
    let hud = document.getElementById("quest-tracker-hud");
    if (!hud) {
      hud = document.createElement("div");
      hud.id = "quest-tracker-hud";
      hud.style.cssText = "position:absolute;top:52px;left:14px;background:rgba(18,16,26,0.88);backdrop-filter:blur(12px);border:1.5px solid rgba(251,191,36,0.45);border-radius:14px;padding:9px 13px;display:flex;align-items:center;gap:10px;z-index:25;max-width:300px;box-shadow:0 8px 24px rgba(0,0,0,0.5);cursor:pointer;pointer-events:auto;";
      hud.onclick = () => {
        const cfg = currentTutorialConfig();
        if (cfg && typeof showToast === "function") showToast(`🎯 ${cfg.title}: ${cfg.hint}`);
      };
      document.body.appendChild(hud);
    }
    const cfg = currentTutorialConfig();
    if (tutorialCompleted || !cfg) {
      hud.style.display = "none";
      return;
    }
    const dist = myPlayer && myPlayer.pos && cfg.targetPos
      ? Math.round(Math.hypot(cfg.targetPos.x - myPlayer.pos.x, cfg.targetPos.z - myPlayer.pos.z))
      : null;
    hud.style.display = "flex";
    hud.innerHTML = `
      <div style="font-size:22px;line-height:1;">🎯</div>
      <div style="display:flex;flex-direction:column;gap:2px;">
        <div style="font-size:9.5px;font-weight:800;color:#fbbf24;letter-spacing:0.4px;">🔰 TÂN THỦ [BƯỚC ${cfg.step}/4]</div>
        <div style="font-size:13px;font-weight:800;color:#fef9c3;">${cfg.title}</div>
        <div style="font-size:10.5px;color:#94a3b8;">${dist !== null ? `Khoảng cách: ${dist}m · ` : ""}Chạm để xem gợi ý</div>
      </div>`;
  }

  function advanceTutorialStep(completedStep) {
    if (tutorialCompleted || !socket) return;
    socket.emit("completeTutorialStep", { step: completedStep }, (res) => {
      if (res && res.ok) {
        if (res.money !== undefined) myPlayer.money = res.money;
        if (typeof updateHUD === "function") updateHUD();
        if (typeof playSound === "function") playSound("fanfare");
        if (res.tutorialCompleted) {
          tutorialCompleted = true;
          myPlayer.tutorialCompleted = true;
          if (typeof showToast === "function") showToast("🎉 XUẤT SẮC! Bạn đã hoàn thành Khóa Tân Thủ và chính thức là Tiểu Thương Phố Chợ!");
        } else {
          tutorialStep = res.nextStep;
          myPlayer.tutorialStep = res.nextStep; // đồng bộ để các bẫy auto-advance đọc đúng bước
          if (typeof showToast === "function") showToast(`🏮 [Tân thủ ${res.nextStep}/4]: ${currentTutorialConfig() ? currentTutorialConfig().title : ""}`);
        }
        renderTutorialTracker();
      }
    });
  }

  // Bước 3 tự qua khi bán được món đầu (gọi từ handleWorldEvent customer_buy)
  // Bước 4 tự qua khi tới quảng trường trung tâm (theo dõi nhẹ mỗi 2s)
  setInterval(() => {
    if (tutorialCompleted || tutorialStep !== 4) return;
    const cfg = currentTutorialConfig();
    if (!cfg || !myPlayer || !myPlayer.pos) return;
    const d = Math.hypot(cfg.targetPos.x - myPlayer.pos.x, cfg.targetPos.z - myPlayer.pos.z);
    if (d <= (cfg.radius || 16)) advanceTutorialStep(4);
  }, 2000);

  /* ==================== PANEL ĐẶT GIÁ TRONG MODAL SẠP ==================== */
  function renderStallPricePanel(s) {
    const pf = s.priceFactor !== undefined ? s.priceFactor : 1;
    const lvl = myLevelInfo.level;
    if (lvl < 2) {
      return `
        <div style="background:rgba(100,116,139,0.15); border:1px dashed #64748b; border-radius:12px; padding:10px 14px; margin-top:10px; display:flex; justify-content:space-between; align-items:center; gap:8px;">
          <span style="font-size:12.5px; color:#94a3b8;">🔒 Đặt Giá Sạp mở khóa ở <b>Cấp 2</b> — bán thêm vài đơn để lên cấp!</span>
          <button class="btn-small" onclick="EconomyUI.openLevelInfoModal()">Xem Cấp Độ</button>
        </div>`;
    }
    const hint = pf >= 1.3
      ? "⚠️ Giá cao: khách dễ bỏ đi, nhưng đơn nào cũng lời to — hợp khi hàng đang HOT"
      : pf <= 0.85
      ? "🏷️ Giá rẻ: khách kéo nhau mua, mua combo nhiều — hợp khi hàng đang ế"
      : "⚖️ Giá vừa: khách mua thoải mái, có lúc đòi bớt giá";
    const pct = Math.round((pf - 1) * 100);
    return `
      <div style="background:rgba(251,191,36,0.1); border:1px solid rgba(251,191,36,0.45); border-radius:12px; padding:12px 14px; margin-top:10px;">
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <span style="font-weight:800; font-size:13px; color:#fde68a;">💰 Giá bán sạp của bạn:</span>
          <span id="stall-price-label" style="font-weight:900; font-size:14px; color:${pf >= 1.15 ? "#f87171" : pf <= 0.9 ? "#4ade80" : "#fde68a"};">${pct >= 0 ? "+" : ""}${pct}% so với giá chợ</span>
        </div>
        <input type="range" id="stall-price-slider" min="0.6" max="1.8" step="0.05" value="${pf}" style="width:100%; margin-top:8px; cursor:pointer;" oninput="EconomyUI.onStallPriceSliderInput(this.value)" />
        <div style="display:flex; justify-content:space-between; font-size:10.5px; color:#64748b; margin-top:2px;">
          <span>Rẻ 0.6×</span><span>Vừa 1.0×</span><span>Đắt 1.8×</span>
        </div>
        <div style="font-size:11.5px; color:#94a3b8; margin-top:6px;" id="stall-price-hint">${hint}</div>
        <button class="btn-small" style="margin-top:8px; background:#f59e0b; color:#0f172a; font-weight:800;" onclick="EconomyUI.applyStallPrice('${s.id}')">Áp Dụng Giá Này</button>
      </div>`;
  }

  function onStallPriceSliderInput(val) {
    const pf = Number(val) || 1;
    const pct = Math.round((pf - 1) * 100);
    const label = document.getElementById("stall-price-label");
    const hint = document.getElementById("stall-price-hint");
    if (label) {
      label.textContent = `${pct >= 0 ? "+" : ""}${pct}% so với giá chợ`;
      label.style.color = pf >= 1.15 ? "#f87171" : pf <= 0.9 ? "#4ade80" : "#fde68a";
    }
    if (hint) {
      hint.textContent = pf >= 1.3
        ? "⚠️ Giá cao: khách dễ bỏ đi, nhưng đơn nào cũng lời to — hợp khi hàng đang HOT"
        : pf <= 0.85
        ? "🏷️ Giá rẻ: khách kéo nhau mua, mua combo nhiều — hợp khi hàng đang ế"
        : "⚖️ Giá vừa: khách mua thoải mái, có lúc đòi bớt giá";
    }
  }

  function applyStallPrice(stallId) {
    if (!socket) return;
    const slider = document.getElementById("stall-price-slider");
    if (!slider) return;
    socket.emit("setStallPrice", { stallId, priceFactor: Number(slider.value) }, (res) => {
      if (res && res.ok) {
        if (typeof playSound === "function") playSound("coin");
        const pct = Math.round((res.priceFactor - 1) * 100);
        showToast(`💰 Đã đặt giá sạp ${pct >= 0 ? "+" : ""}${pct}% — khách NPC sẽ mặc cả theo giá này!`);
      } else {
        showToast((res && res.error) || "Không đặt được giá!");
        if (res && res.needLevel) openLevelInfoModal();
      }
    });
  }

  /* ==================== WORLD EVENT HOOK ==================== */
  // Trả về true nếu sự kiện đã được EconomyUI xử lý (network-ui không xử lý lại)
  function handleWorldEvent(ev) {
    if (!ev || !ev.type) return false;

    if (ev.type === "haggle_request") {
      showHagglePanel(ev);
      return true;
    }
    if (ev.type === "haggle_result") {
      hideHagglePanel();
      if (ev.outcome === "won") {
        if (typeof playSound === "function") playSound("fanfare");
        showToast(`🤝 ${ev.message}`);
      } else if (ev.outcome === "lost") {
        if (typeof playSound === "function") playSound("error");
        showToast(`😩 ${ev.message}`);
      }
      return true;
    }
    if (ev.type === "stall_price_changed") {
      showToast(`💰 ${ev.nickname} đặt giá sạp ${Math.round((ev.priceFactor - 1) * 100) >= 0 ? "+" : ""}${Math.round((ev.priceFactor - 1) * 100)}%`);
      return true;
    }
    if (ev.type === "new_day_summary") {
      showToast(`🌅 ${ev.message}`);
      resetTodayEarnings();
      return true;
    }
    if (ev.type === "level_up" && ev.nickname === myPlayer.nickname) {
      if (typeof playSound === "function") playSound("fanfare");
      showToast(`🎉 CHÚC MỪNG! Bạn lên Cấp ${ev.level} — "${ev.title}"!${ev.unlock ? ` Mở khóa: ${ev.unlock}` : ""}`);
      if (socket) socket.emit("request_level_info");
      renderTutorialTracker();
      return true;
    }
    if (ev.type === "customer_buy") {
      const isMyStall = ev.owner === myPlayer.nickname;
      if (isMyStall) {
        addTodayEarnings(ev.price);
        // Tutorial: mọi đơn khi còn tutorial (bước 1-3) đều tính "bán món đầu tiên"
        if (!tutorialCompleted && tutorialStep <= 3) {
          advanceTutorialStep(3);
        }
        // Khách phục miệng khi chốt kèo đắt: nhảy múa ăn mừng tại sạp
        if (ev.haggleWon && ev.customerId && typeof customerMeshes !== "undefined" && customerMeshes[ev.customerId]) {
          customerMeshes[ev.customerId].danceTimer = 2.2;
          if (typeof playSound === "function") playSound("fanfare");
          showToast(`🔥 CHỐT KÈO ĐẮT! Khách ${ev.customerName} chịu trả ${fmt(ev.price)}đ!`);
        }
      }
      return false; // để network-ui xử lý phần còn lại (chat, hạt coin...)
    }
    return false;
  }

  /* ==================== KHỞI TẠO SAU KHI JOIN ==================== */
  function onJoined() {
    initTutorial();
    myTodayEarnings = 0;
    updateTodayEarningsChip();
    if (socket) {
      socket.emit("request_level_info");
    }
  }

  // Đồng bộ exp từ sync_player_stats: cấp đổi thì refresh badge
  let lastKnownExp = -1;
  function onPlayerStatsSynced(patch) {
    if (patch.exp !== undefined && patch.exp !== lastKnownExp) {
      lastKnownExp = patch.exp;
      if (socket) socket.emit("request_level_info");
    }
    if (patch.tutorialCompleted !== undefined && patch.tutorialCompleted && !tutorialCompleted) {
      tutorialCompleted = true;
      renderTutorialTracker();
    }
  }

  function injectHudMarkup() {
    // Chip Tín Hiệu Chợ + chip cấp độ vào HUD có sẵn
    const statsBar = document.querySelector(".hud-center-stats");
    if (statsBar && !document.getElementById("market-signal-chip")) {
      const sep = document.createElement("span");
      sep.className = "stat-sep";
      sep.textContent = "·";
      const chip = document.createElement("button");
      chip.id = "market-signal-chip";
      chip.className = "stat-pill";
      chip.style.cssText = "max-width:34vw;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;";
      chip.title = "Tín Hiệu Chợ: hàng gì đang được lòng khách giờ này";
      chip.onclick = openMarketSignalModal;
      chip.innerHTML = '<span id="market-signal-text">📈 Tín Hiệu Chợ</span>';
      statsBar.appendChild(sep);
      statsBar.appendChild(chip);

      const lvlSep = document.createElement("span");
      lvlSep.className = "stat-sep";
      lvlSep.textContent = "·";
      const lvlChip = document.createElement("button");
      lvlChip.id = "hud-level-chip";
      lvlChip.className = "stat-pill";
      lvlChip.title = "Cấp độ tiểu thương";
      lvlChip.onclick = openLevelInfoModal;
      lvlChip.textContent = "⭐ Lv.1";
      statsBar.appendChild(lvlSep);
      statsBar.appendChild(lvlChip);
    }
  }

  // Khởi tạo markup khi DOM sẵn sàng
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", injectHudMarkup);
  } else {
    injectHudMarkup();
  }

  /* ==================== EXPORT RA WINDOW ==================== */
  window.EconomyUI = {
    updateMarketSignals,
    openMarketSignalModal,
    showHagglePanel,
    hideHagglePanel,
    respondHaggle,
    updateLevelBadge,
    openLevelInfoModal,
    renderStallPricePanel,
    onStallPriceSliderInput,
    applyStallPrice,
    handleWorldEvent,
    onJoined,
    onPlayerStatsSynced,
    initTutorial,
    renderTutorialTracker,
    resetTodayEarnings,
    advanceTutorialStep,
  };
})();
