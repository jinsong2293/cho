/* ==========================================================================
   CHỢ THỊ TRẤN VIỆT NAM 3D — CONTROLS, JOYSTICK, MINIMAP & GAME LOOP (controls-loop.js)
   ========================================================================== */

const keys = {};
const joyInput = { x: 0, y: 0, active: false, magnitude: 0 };

window.addEventListener('keydown', (e) => {
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
  keys[e.code] = true;
  if (['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
    autoWalkTarget = null;
    if (tapTargetMarker) tapTargetMarker.visible = false;
  }
  if (e.code === 'KeyE') interactNearest();
  if (e.code === 'KeyB') openWholesaleModal();
  if (e.code === 'KeyG') openGachaModal();
  if (e.code === 'KeyI') openInventoryModal();
  if (e.code === 'KeyQ') openQuestsModal();
  if (e.code === 'KeyL') openLeaderboardModal();
  if (e.code === 'KeyN') openLoaPhuongModal();
  if (e.code === 'KeyC') toggleChat();
  if (e.code === 'KeyH') toggleDock();
  if (e.code === 'KeyT') cycleWeatherMode();
  if (e.code === 'KeyF') triggerFireworkCelebration();
  if (e.code === 'KeyK') kickShuttlecockNow();
  if (e.code === 'Escape') dismissEventBanner();
  if (e.code === 'F1') {
    e.preventDefault();
    resetCameraToPlayer();
  }
  if (e.code === 'Space') {
    e.preventDefault();
    toggleHoverboard();
  }
});

window.addEventListener('keyup', (e) => {
  keys[e.code] = false;
});

function handleMobileJump() {
  if (!myPlayer) return;
  initAudio();
  if (navigator.vibrate) {
    try { navigator.vibrate(20); } catch (_) {}
  }
  if (myPlayer.y <= 0.05) {
    let jumped = false;
    if (typeof JUMP_PADS !== 'undefined') {
      for (const pad of JUMP_PADS) {
        if (Math.hypot(myPlayer.pos.x - pad.x, myPlayer.pos.z - pad.z) < 1.6) {
          myPlayer.vy = 11.2;
          playSound('jump');
          triggerCoinParticles(pad.x, 0.5, pad.z);
          showToast('🎪 Bật nhảy trên Đệm Nhún Hội Chợ!');
          jumped = true;
          break;
        }
      }
    }
    if (!jumped) {
      myPlayer.vy = 6.8;
      playSound('click');
    }
  }
}

function initMobileJoystick() {
  const zone = document.getElementById('joystick-zone');
  const base = document.getElementById('joystick-base');
  const stick = document.getElementById('joystick-stick');
  const touchArea = document.getElementById('mobile-touch-left');
  if (!zone || !base || !stick) return;

  const maxRadius = 40;
  let activeTouchId = null;
  let pointerDragging = false;
  let originX = 0;
  let originY = 0;

  function updateStickFromClientXY(clientX, clientY) {
    let dx = clientX - originX;
    let dy = clientY - originY;
    const dist = Math.hypot(dx, dy);

    if (dist > maxRadius) {
      dx = (dx / dist) * maxRadius;
      dy = (dy / dist) * maxRadius;
    }

    stick.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;

    const normDist = Math.min(1, dist / maxRadius);
    if (normDist < 0.1) {
      joyInput.x = 0;
      joyInput.y = 0;
      joyInput.magnitude = 0;
    } else {
      joyInput.x = dx / maxRadius;
      joyInput.y = dy / maxRadius;
      joyInput.magnitude = normDist;
      autoWalkTarget = null;
      if (tapTargetMarker) tapTargetMarker.visible = false;
    }
  }

  function startFloatingStick(clientX, clientY, touchId) {
    activeTouchId = touchId;
    joyInput.active = true;
    initAudio();

    if (window.innerWidth <= 900 || document.body.classList.contains('mobile-mode')) {
      toggleChat(true);
      toggleDock(true);
    }

    const zoneSize = 116;
    const half = zoneSize / 2;
    const clampedX = Math.max(half + 6, Math.min(window.innerWidth * 0.46 - half, clientX));
    const clampedY = Math.max(half + 44, Math.min(window.innerHeight - half - 44, clientY));

    originX = clampedX;
    originY = clampedY;

    zone.style.position = 'fixed';
    zone.style.left = `${clampedX - half}px`;
    zone.style.top = `${clampedY - half}px`;
    zone.style.bottom = 'auto';
    zone.style.opacity = '1';

    updateStickFromClientXY(clientX, clientY);
  }

  function resetStick() {
    activeTouchId = null;
    pointerDragging = false;
    joyInput.active = false;
    joyInput.x = 0;
    joyInput.y = 0;
    joyInput.magnitude = 0;
    stick.style.transform = 'translate(-50%, -50%)';

    zone.style.position = 'absolute';
    zone.style.left = '16px';
    zone.style.bottom = '54px';
    zone.style.top = 'auto';
    zone.style.opacity = '0.92';
  }

  if (touchArea) {
    touchArea.addEventListener('touchstart', (e) => {
      if (activeTouchId !== null || e.changedTouches.length === 0) return;
      e.preventDefault();
      e.stopPropagation();
      const t = e.changedTouches[0];
      startFloatingStick(t.clientX, t.clientY, t.identifier);
    }, { passive: false });

    touchArea.addEventListener('touchmove', (e) => {
      if (activeTouchId === null) return;
      e.preventDefault();
      e.stopPropagation();
      for (let i = 0; i < e.changedTouches.length; i++) {
        if (e.changedTouches[i].identifier === activeTouchId) {
          updateStickFromClientXY(e.changedTouches[i].clientX, e.changedTouches[i].clientY);
          break;
        }
      }
    }, { passive: false });

    const onTouchEnd = (e) => {
      if (activeTouchId === null) return;
      for (let i = 0; i < e.changedTouches.length; i++) {
        if (e.changedTouches[i].identifier === activeTouchId) {
          resetStick();
          break;
        }
      }
    };
    touchArea.addEventListener('touchend', onTouchEnd, { passive: false });
    touchArea.addEventListener('touchcancel', onTouchEnd, { passive: false });
  }

  zone.addEventListener('touchstart', (e) => {
    if (activeTouchId !== null || e.changedTouches.length === 0) return;
    e.preventDefault();
    e.stopPropagation();
    const t = e.changedTouches[0];
    startFloatingStick(t.clientX, t.clientY, t.identifier);
  }, { passive: false });

  zone.addEventListener('touchmove', (e) => {
    if (activeTouchId === null) return;
    e.preventDefault();
    e.stopPropagation();
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === activeTouchId) {
        updateStickFromClientXY(e.changedTouches[i].clientX, e.changedTouches[i].clientY);
        break;
      }
    }
  }, { passive: false });

  const endTouch = (e) => {
    if (activeTouchId === null) return;
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === activeTouchId) {
        resetStick();
        break;
      }
    }
  };
  zone.addEventListener('touchend', endTouch);
  zone.addEventListener('touchcancel', endTouch);
  window.addEventListener('touchend', endTouch);
  window.addEventListener('touchcancel', endTouch);

  zone.addEventListener('pointerdown', (e) => {
    if (e.pointerType === 'touch') return;
    e.preventDefault();
    e.stopPropagation();
    initAudio();
    pointerDragging = true;
    joyInput.active = true;
    const rect = base.getBoundingClientRect();
    originX = rect.left + rect.width / 2;
    originY = rect.top + rect.height / 2;
    updateStickFromClientXY(e.clientX, e.clientY);
  });

  window.addEventListener('pointermove', (e) => {
    if (!pointerDragging || e.pointerType === 'touch') return;
    updateStickFromClientXY(e.clientX, e.clientY);
  });

  window.addEventListener('pointerup', (e) => {
    if (!pointerDragging || e.pointerType === 'touch') return;
    resetStick();
  });
}

function toggleMobileMode(forceState) {
  const isNowMobile =
    typeof forceState === 'boolean'
      ? forceState
      : !document.body.classList.contains('mobile-mode');

  document.body.classList.toggle('mobile-mode', isNowMobile);
  const btn = document.getElementById('hud-mobile-btn');
  if (btn) {
    btn.innerText = isNowMobile ? '📱 ĐT: BẬT' : '📱 Phím Ảo ĐT';
  }
  if (isNowMobile) {
    toggleChat(true);
    toggleDock(true);
  }
  if (typeof forceState !== 'boolean') {
    showToast(
      isNowMobile
        ? '📱 Đã bật giao diện Điện Thoại gọn thoáng!'
        : '💻 Đã chuyển về giao diện Máy Tính'
    );
  }
}

function toggleMinimapSize() {
  const card = document.getElementById('minimap-card');
  if (!card) return;
  card.classList.toggle('expanded');
}

function toggleHoverboard() {
  initAudio();
  myPlayer.hoverboard = !myPlayer.hoverboard;
  const btn = document.getElementById('btn-hoverboard') || document.getElementById('dock-btn-bike');
  const mobBtn = document.getElementById('mob-btn-bike');
  const mobLabel = document.getElementById('mob-bike-label');

  if (myPlayer.hoverboard) {
    if (btn) {
      btn.classList.add('btn-active-bike');
      btn.innerHTML = `<span class="icon">🛵</span><span class="label">Xe: BẬT</span>`;
    }
    if (mobBtn) mobBtn.classList.add('bike-on');
    if (mobLabel) mobLabel.innerText = 'Đang chạy';
    playSound('horn');
    showToast('🛵 Bíp bíp! Đã lên Xe Máy dạo quanh phố chợ (+70% tốc độ)!');
  } else {
    if (btn) {
      btn.classList.remove('btn-active-bike');
      btn.innerHTML = `<span class="icon">🛵</span><span class="label">Xe máy</span>`;
    }
    if (mobBtn) mobBtn.classList.remove('bike-on');
    if (mobLabel) mobLabel.innerText = 'Xe máy';
    playSound('click');
  }
  if (socket) {
    socket.emit('toggleHoverboard', myPlayer.hoverboard);
  }
}

/* ==================== GAME LOOP & LIGHTING / MINIMAP ==================== */
let lastFrameTime = performance.now();
let lastNetworkSend = 0;
let frameId = 0;

function afterDraw(cb) {
  const gl = renderer.getContext();
  if (gl && gl.fenceSync) {
    const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
    gl.flush();
    const poll = () => {
      const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
      if (state === gl.UNSIGNALED) {
        frameId = window.setTimeout(poll, 5);
      } else {
        gl.deleteSync(sync);
        frameId = window.setTimeout(cb, 80);
      }
    };
    frameId = window.setTimeout(poll, 5);
  } else {
    frameId = window.setTimeout(cb, 80);
  }
}

function gameLoop() {
  const time = performance.now();
  const dt = Math.min((time - lastFrameTime) / 1000, 0.08);
  lastFrameTime = time;
  const elapsedSec = time * 0.001;

  if (myPlayer.mesh && camera) {
    camera.getWorldDirection(_camForward);
    _camForward.y = 0;
    _camForward.normalize();

    _camRight.crossVectors(_camForward, _upVec).normalize();
    _moveDir.set(0, 0, 0);

    // 1. Điều khiển Bàn phím (WASD / Mũi tên)
    if (keys['KeyW'] || keys['ArrowUp']) _moveDir.add(_camForward);
    if (keys['KeyS'] || keys['ArrowDown']) _moveDir.sub(_camForward);
    if (keys['KeyD'] || keys['ArrowRight']) _moveDir.add(_camRight);
    if (keys['KeyA'] || keys['ArrowLeft']) _moveDir.sub(_camRight);

    // 2. Điều khiển Cần Gạt Cảm Ứng Điện Thoại (Virtual Joystick)
    let speedFactor = 1.0;
    if (joyInput.magnitude > 0.05) {
      _moveDir.addScaledVector(_camRight, joyInput.x);
      _moveDir.addScaledVector(_camForward, -joyInput.y);
      speedFactor = Math.max(0.35, joyInput.magnitude);
    } else if (autoWalkTarget && _moveDir.lengthSq() < 0.001) {
      // 3. Tự động chạy tới điểm chạm trên mặt đất (Tap-to-Move)
      const dx = autoWalkTarget.x - myPlayer.pos.x;
      const dz = autoWalkTarget.z - myPlayer.pos.z;
      const distToTarget = Math.hypot(dx, dz);
      if (distToTarget > 0.35) {
        _moveDir.set(dx, 0, dz);
      } else {
        autoWalkTarget = null;
        if (tapTargetMarker) tapTargetMarker.visible = false;
      }
    }

    if (tapTargetMarker && tapTargetMarker.visible) {
      const pulse = 1 + Math.sin(elapsedSec * 7) * 0.18;
      tapTargetMarker.scale.set(pulse, pulse, 1);
    }

    const isMoving = _moveDir.lengthSq() > 0.001;
    if (isMoving) {
      _moveDir.normalize();
      const moveSpeed = (myPlayer.hoverboard ? 18.5 : 7.5) * speedFactor;
      const deltaX = _moveDir.x * moveSpeed * dt;
      const deltaZ = _moveDir.z * moveSpeed * dt;

      if (window.Colliders && typeof window.Colliders.resolveMovement === 'function') {
        const resolved = window.Colliders.resolveMovement(myPlayer.pos.x, myPlayer.pos.z, deltaX, deltaZ, 0.45);
        myPlayer.pos.x = resolved.x;
        myPlayer.pos.z = resolved.z;
        if (resolved.hit && autoWalkTarget) {
          if (resolved.hitX && resolved.hitZ) {
            autoWalkTarget = null;
            if (tapTargetMarker) tapTargetMarker.visible = false;
          }
        }
      } else {
        myPlayer.pos.x = Math.max(-1160, Math.min(1160, myPlayer.pos.x + deltaX));
        myPlayer.pos.z = Math.max(-1160, Math.min(1160, myPlayer.pos.z + deltaZ));
      }

      const targetAngle = Math.atan2(_moveDir.x, _moveDir.z);
      let diff = targetAngle - myPlayer.mesh.group.rotation.y;
      while (diff < -Math.PI) diff += Math.PI * 2;
      while (diff > Math.PI) diff -= Math.PI * 2;
      myPlayer.mesh.group.rotation.y += diff * 0.25;
      myPlayer.rot = myPlayer.mesh.group.rotation.y;

      if (time - lastNetworkSend > 50 && socket) {
        lastNetworkSend = time;
        socket.emit('move', {
          pos: myPlayer.pos,
          rot: myPlayer.rot,
          hoverboard: myPlayer.hoverboard,
        });
      }
    }

    if (myPlayer.y <= 0.05) {
      for (const pad of JUMP_PADS) {
        if (Math.hypot(myPlayer.pos.x - pad.x, myPlayer.pos.z - pad.z) < 2.1) {
          myPlayer.vy = 13.2;
          playSound('jump');
          triggerCoinParticles(pad.x, 0.5, pad.z);
          showToast('🎪 Bật nhảy siêu cao trên Đệm Nhún Hội Chợ!');
          break;
        }
      }
    }

    if (myPlayer.y > 0 || myPlayer.vy > 0) {
      myPlayer.y += myPlayer.vy * dt;
      myPlayer.vy -= 18.0 * dt;
      if (myPlayer.y <= 0) {
        myPlayer.y = 0;
        myPlayer.vy = 0;
      }
    }

    if (myPlayer.danceTimer > 0) {
      myPlayer.danceTimer -= dt;
    }

    myPlayer.mesh.group.position.set(myPlayer.pos.x, myPlayer.y, myPlayer.pos.z);
    myPlayer.mesh.animateWalk(elapsedSec, isMoving, myPlayer.hoverboard, myPlayer.danceTimer > 0);

    if (myPlayer.mesh.auraRing) {
      const aPulse = 1 + Math.sin(elapsedSec * 4.5) * 0.08;
      myPlayer.mesh.auraRing.scale.set(aPulse, aPulse, 1);
    }

    // Camera third-person tracking
    _targetVec.set(myPlayer.pos.x, 1.1 + myPlayer.y * 0.4, myPlayer.pos.z);
    const prevTargetX = controls.target.x;
    const prevTargetY = controls.target.y;
    const prevTargetZ = controls.target.z;
    controls.target.lerp(_targetVec, 0.12);
    const dX = controls.target.x - prevTargetX;
    const dY = controls.target.y - prevTargetY;
    const dZ = controls.target.z - prevTargetZ;
    camera.position.x += dX;
    camera.position.y += dY;
    camera.position.z += dZ;

    updateContextAction();
  }

  Object.values(worldState.otherPlayers).forEach((p) => {
    const cur = p.char.group.position;
    const dx = p.targetPos.x - cur.x;
    const dz = p.targetPos.z - cur.z;
    const dist = Math.hypot(dx, dz);
    p.isMoving = dist > 0.04;

    cur.x += dx * 0.22;
    cur.z += dz * 0.22;
    p.char.group.rotation.y = THREE.MathUtils.lerp(p.char.group.rotation.y, p.targetRot, 0.22);
    if (p.danceTimer > 0) p.danceTimer -= dt;
    p.char.animateWalk(elapsedSec, p.isMoving, p.hoverboard, p.danceTimer > 0);
  });

  Object.values(customerMeshes).forEach((entry) => {
    if (entry.targetX !== undefined) {
      const cur = entry.char.group.position;
      const dx = entry.targetX - cur.x;
      const dz = entry.targetZ - cur.z;
      const isMoving = Math.hypot(dx, dz) > 0.05;
      cur.x += dx * 0.09;
      cur.z += dz * 0.09;
      if (isMoving) {
        entry.char.group.rotation.y = Math.atan2(dx, dz);
      }
      entry.char.animateWalk(elapsedSec, isMoving, false, false);
    }
  });

  if (lotusFountainGroup && lotusFountainGroup.userData) {
    const { lotusGroup } = lotusFountainGroup.userData;
    lotusGroup.rotation.y = elapsedSec * 0.6;
    lotusGroup.position.y = 2.6 + Math.sin(elapsedSec * 2.2) * 0.1;
  }

  if (supplyCrateGroup) {
    supplyCrateGroup.visible = Boolean(worldState.supplyDrop && worldState.supplyDrop.active);
    if (supplyCrateGroup.visible) {
      supplyCrateGroup.position.set(worldState.supplyDrop.x, 0, worldState.supplyDrop.z);
      const { crate, frame } = supplyCrateGroup.userData;
      crate.rotation.y = elapsedSec * 1.6;
      frame.rotation.y = -elapsedSec * 1.6;
      crate.position.y = 0.85 + Math.sin(elapsedSec * 3.5) * 0.16;
      frame.position.y = crate.position.y;
    }
  }

  jumpPadMeshes.forEach((jp, idx) => {
    jp.floatRing.position.y = 0.32 + Math.sin(elapsedSec * 4 + idx) * 0.1;
  });

  streetVehicles.forEach((v) => {
    const angle = elapsedSec * v.speed + v.phase;
    const nx = Math.cos(angle) * v.radius;
    const nz = Math.sin(angle) * v.radius;
    const dx = nx - v.mesh.position.x;
    const dz = nz - v.mesh.position.z;
    v.mesh.position.set(nx, 0, nz);
    if (Math.hypot(dx, dz) > 0.001) {
      v.mesh.rotation.y = Math.atan2(dx, dz);
    }
  });

  Object.values(stallMeshes).forEach((s) => {
    if (s.displayItemsGroup) {
      s.displayItemsGroup.children.forEach((item) => {
        item.rotation.y += dt * 1.2;
      });
    }
  });

  const isNight = updateDayNightAndWeatherLighting();
  updateFireworksSystem(dt, elapsedSec, isNight);
  updateWeatherParticles3D(dt, elapsedSec);
  updateParticles(dt);
  updateBauCua3DAnimation(dt, elapsedSec);
  updatePetDog(dt, elapsedSec);
  updateShuttlecock3D(dt, elapsedSec);
  if (typeof updateExpandedTown3D === 'function') {
    updateExpandedTown3D(dt, elapsedSec);
  }
  updateZoneBadgeHUD();
  drawMinimap();

  controls.update();
  renderer.render(scene, camera);

  if (isSoftwareGl) {
    afterDraw(gameLoop);
  } else {
    frameId = requestAnimationFrame(gameLoop);
  }
}

function updateDayNightAndWeatherLighting() {
  const currentT = timeOfDayOverride !== null ? timeOfDayOverride : worldState.timeOfDay;
  const angle = currentT * Math.PI * 2;
  dirLight.position.x = Math.cos(angle) * 45;
  dirLight.position.y = Math.max(6, Math.sin(angle) * 45);
  dirLight.position.z = Math.sin(angle) * 30;

  let sunPower = Math.max(0.32, Math.sin(angle));
  if (activeWeather === 'heatwave') {
    dirLight.intensity = sunPower * 1.65;
    hemiLight.intensity = 0.6 + sunPower * 0.5;
  } else if (activeWeather === 'rain') {
    dirLight.intensity = sunPower * 0.78;
    hemiLight.intensity = 0.42 + sunPower * 0.25;
  } else {
    dirLight.intensity = sunPower * 1.3;
    hemiLight.intensity = 0.45 + sunPower * 0.45;
  }

  const isNight = Math.sin(angle) < 0.22;
  const hudTime = document.getElementById('hud-time-icon');
  if (hudTime) hudTime.innerText = isNight ? '🏮 Đêm Hội' : '☀️ Ban Ngày';
  return isNight;
}

function drawMinimap() {
  const canvas = document.getElementById('minimap-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  const card = document.getElementById('minimap-card');
  const isExpanded = Boolean(card && card.classList.contains('expanded'));
  const playerDist = Math.max(Math.abs(myPlayer.pos.x || 0), Math.abs(myPlayer.pos.z || 0));
  // Tự động co giãn tỷ lệ Bản Đồ Nhỏ từ Trung Tâm (156m) -> Vành Đai 5x (360m) -> Đại Bản Đồ 20x (1320m)
  const worldSpan = playerDist > 185 ? 1320 : isExpanded ? 1320 : playerDist > 68 ? 360 : 156;
  const scale = w / worldSpan;

  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = "#0f172a";
  ctx.fillRect(0, 0, w, h);

  // Vẽ dòng sông phía Nam & 4 cây cầu Bình Minh / Hoàng Hôn / Rồng Vàng / Ánh Sao
  const riverTop = h / 2 + 34 * scale;
  const riverH = Math.max(3, 28 * scale);
  ctx.fillStyle = "rgba(2, 132, 199, 0.38)";
  ctx.fillRect(0, riverTop, w, riverH);
  ctx.fillStyle = "rgba(251, 191, 36, 0.78)";
  [-140, -28, 28, 140].forEach((bx) => {
    const brX = w / 2 + bx * scale;
    if (brX >= 0 && brX <= w) {
      ctx.fillRect(brX - 2.5, riverTop - 1, 5, riverH + 2);
    }
  });

  ctx.strokeStyle = "rgba(251, 191, 36, 0.22)";
  ctx.beginPath();
  ctx.arc(w / 2, h / 2, 24 * scale, 0, Math.PI * 2);
  ctx.arc(w / 2, h / 2, 140 * scale, 0, Math.PI * 2);
  ctx.arc(w / 2, h / 2, 580 * scale, 0, Math.PI * 2);
  ctx.stroke();

  if (window.WorldLayout && Array.isArray(window.WorldLayout.ZONES)) {
    window.WorldLayout.ZONES.forEach((z) => {
      if (z.id === 'central_market') return;
      const zx = w / 2 + z.center.x * scale;
      const zz = h / 2 + z.center.z * scale;
      const isPlayground = ['bau_cua_booth', 'shuttlecock_court', 'tea_table_corner'].includes(z.id);
      ctx.fillStyle = isPlayground ? "rgba(245, 158, 11, 0.32)" : "rgba(56, 189, 248, 0.18)";
      ctx.beginPath();
      ctx.arc(zx, zz, Math.max(3.5, z.radius * scale * 0.45), 0, Math.PI * 2);
      ctx.fill();
    });
  }

  if (worldState.supplyDrop && worldState.supplyDrop.active) {
    const dx = w / 2 + worldState.supplyDrop.x * scale;
    const dz = h / 2 + worldState.supplyDrop.z * scale;
    ctx.fillStyle = "#ef4444";
    ctx.beginPath();
    ctx.arc(dx, dz, 4.0, 0, Math.PI * 2);
    ctx.fill();
  }

  worldState.stalls.forEach((s) => {
    const sx = w / 2 + s.position.x * scale;
    const sz = h / 2 + s.position.z * scale;
    ctx.fillStyle = s.owner === myPlayer.nickname ? "#10b981" : s.owner ? "#f59e0b" : "#64748b";
    ctx.fillRect(sx - 3.5, sz - 2.5, 7, 5);
  });

  worldState.customers.forEach((c) => {
    const cx = w / 2 + c.x * scale;
    const cz = h / 2 + c.z * scale;
    ctx.fillStyle = "#fb7185";
    ctx.beginPath();
    ctx.arc(cx, cz, 2.0, 0, Math.PI * 2);
    ctx.fill();
  });

  if (worldState.activities && worldState.activities.greenBus && worldState.activities.greenBus.pos) {
    const bx = w / 2 + worldState.activities.greenBus.pos.x * scale;
    const bz = h / 2 + worldState.activities.greenBus.pos.z * scale;
    ctx.fillStyle = "#4ade80";
    ctx.fillRect(bx - 3.5, bz - 3.5, 7, 7);
  }

  Object.values(worldState.otherPlayers).forEach((p) => {
    const px = w / 2 + p.char.group.position.x * scale;
    const pz = h / 2 + p.char.group.position.z * scale;
    ctx.fillStyle = "#38bdf8";
    ctx.beginPath();
    ctx.arc(px, pz, 3.2, 0, Math.PI * 2);
    ctx.fill();
  });

  const mx = Math.max(4, Math.min(w - 4, w / 2 + myPlayer.pos.x * scale));
  const mz = Math.max(4, Math.min(h - 4, h / 2 + myPlayer.pos.z * scale));
  ctx.fillStyle = "#fbbf24";
  ctx.beginPath();
  ctx.arc(mx, mz, 4.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 1.5;
  ctx.stroke();
}
