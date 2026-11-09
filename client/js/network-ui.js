/* ==================== SOCKET.IO NETWORK & GAMEPLAY ==================== */
let myCustomization = { hat: 'non_la', outfit: 'ba_ba', color: 0xf59e0b };

function startOfflineDemo(nick) {
  const joinScreen = document.getElementById('join-screen');
  if (!joinScreen) return;

  const joinBtn = document.querySelector('#join-screen .join-btn.join-cta');
  if (joinBtn) {
    joinBtn.disabled = false;
    joinBtn.textContent = '▶ VÀO CHỢ';
  }

  myPlayer.nickname = nick || 'TiểuThương_VN';
  myPlayer.money = 25000;
  myPlayer.inventory = { 'TraDa': 5, 'BanhMi': 2, 'NuocMia': 2 };
  myPlayer.stalls = [];
  myPlayer.quests = [
    { id: 'q_explore', title: 'Dạo Phố Chợ 3D', desc: 'Đi bộ khám phá các khu vui chơi', current: 1, target: 1, reward: 5000, claimed: false }
  ];
  myPlayer.hoverboard = false;
  myPlayer.friends = [];
  myPlayer.blockedUsers = [];
  myPlayer.affinity = 15;
  myPlayer.socialTitle = 'Khách Tham Quan';
  myPlayer.collection = {};
  myPlayer.houseConfig = {
    level: 1,
    privacy: 'public',
    wall: '#fef08a',
    furniture: 'Sập Gụ Tủ Chè',
    tree: 'Hoa Mai Vàng',
    items: ['sap_gu', 'mai_vang_co'],
    guestbook: [
      { author: 'Bác Năm Thợ Xây', note: 'Chào mừng bạn đến với khu dân cư thị trấn! Nhà cửa khang trang quá!' }
    ]
  };
  myPlayer.roomId = 'demo-tour';
  myPlayer.pos = { x: 0, z: 19 };

  const roomLabel = document.getElementById('current-room-label');
  if (roomLabel) {
    roomLabel.textContent = '🏮 Tham Quan Thị Trấn 3D (Tự Do)';
  }

  joinScreen.classList.remove('active');

  if (typeof init3D === 'function') {
    init3D();
  }
  if (typeof updatePlayerHouse3D === 'function') {
    updatePlayerHouse3D(myPlayer.houseConfig.level || 1, myPlayer.houseConfig);
  }

  if (myPlayer.mesh && scene) {
    scene.remove(myPlayer.mesh.group);
  }
  if (typeof createCharacterMesh === 'function' && scene) {
    myPlayer.mesh = createCharacterMesh(myCustomization, myPlayer.nickname);
    myPlayer.mesh.group.position.set(myPlayer.pos.x, 0, myPlayer.pos.z);
    scene.add(myPlayer.mesh.group);
  }

  if (controls && camera) {
    const isPortrait = window.innerWidth < window.innerHeight;
    camera.fov = isPortrait ? 60 : 48;
    camera.updateProjectionMatrix();
    controls.target.set(myPlayer.pos.x, 1.1, myPlayer.pos.z);
    camera.position.set(myPlayer.pos.x, 4.6, myPlayer.pos.z + 6.8);
    controls.update();
  }

  const demoStalls = [
    { id: 'stall-1', position: { x: -15, z: -25 }, rotation: 0, owner: null, name: 'Sạp Trái Cây Miền Tây', level: 1, goods: { 'ThanhLong': { count: 20, price: 100 } } },
    { id: 'stall-2', position: { x:  15, z: -25 }, rotation: 0, owner: null, name: 'Quán Cà Phê Vợt & Nước Mía', level: 1, goods: { 'CaPheSua': { count: 15, price: 150 } } },
    { id: 'stall-3', position: { x: -15, z: -30 }, rotation: 0, owner: null, name: 'Tiệm Phở Bò & Bánh Mì', level: 1, goods: {} },
    { id: 'stall-4', position: { x:  15, z: -30 }, rotation: 0, owner: null, name: 'Hàng Nón Lá & Hoa Xuân', level: 1, goods: {} },
    { id: 'stall-5', position: { x: -15, z: -35 }, rotation: 0, owner: null, name: 'Bách Hóa Tổng Hợp Phố Chợ', level: 1, goods: {} },
    { id: 'stall-6', position: { x:  15, z: -35 }, rotation: 0, owner: null, name: 'Tiệm Trầm Hương & Ngọc', level: 1, goods: {} }
  ];
  if (typeof syncStalls === 'function') syncStalls(demoStalls);

  const demoCustomers = [
    { id: 'cust_tu_tra_da', name: 'Chị Tư Trà Đá', x: -2, z: 14, targetX: 2, targetZ: 14, speed: 1.2, hat: 'non_la', outfit: 'ba_ba', roleTitle: 'Chủ Quán Trà' },
    { id: 'cust_chu_ba', name: 'Chú Ba Phố Cổ', x: 2, z: 13, targetX: -2, targetZ: 13, speed: 1.2, hat: 'mu_phot', outfit: 'ao_dai', roleTitle: 'Khách Đánh Cờ' },
    { id: 'cust_be_na', name: 'Bé Na Tâng Cầu', x: 8, z: -15, targetX: 10, targetZ: -15, speed: 1.3, hat: 'non_la', outfit: 'ba_ba', roleTitle: 'Thiếu Nhi Đá Cầu' },
    { id: 'cust_be_bo', name: 'Bé Bo Đón Cầu', x: 10, z: -16, targetX: 8, targetZ: -16, speed: 1.3, hat: 'mu_phot', outfit: 'ba_ba', roleTitle: 'Thiếu Nhi Đá Cầu' },
    { id: 'cust_bac_to_truong', name: 'Bác Tổ Trưởng', x: -6, z: 0, targetX: 6, targetZ: 0, speed: 1.1, hat: 'mu_phot', outfit: 'ao_dai', roleTitle: 'Tổ Dân Phố' },
    { id: 'cust_thay_minh', name: 'Thầy Minh Thư Pháp', x: 4, z: -4, targetX: -4, targetZ: -4, speed: 1.1, hat: 'non_la', outfit: 'ao_dai', roleTitle: 'Thư Pháp Sư' },
    { id: 'cust_co_nam', name: 'Cô Năm Bát Tràng', x: 16, z: 8, targetX: 20, targetZ: 8, speed: 1.2, hat: 'non_la', outfit: 'ba_ba', roleTitle: 'Nghệ Nhân Gốm' },
    { id: 'cust_chi_lan', name: 'Chị Lan Mây Tre', x: 20, z: 12, targetX: 16, targetZ: 12, speed: 1.2, hat: 'non_la', outfit: 'ao_dai', roleTitle: 'Nghệ Nhân Đan Lát' },
    { id: 'cust_ca_si', name: 'Ca Sĩ Minh Quân', x: 0, z: -28, targetX: 0, targetZ: -32, speed: 1.2, hat: 'mu_phot', outfit: 'ao_dai', roleTitle: 'Nghệ Sĩ Acoustic' },
    { id: 'cust_jack', name: 'Anh Tây Du Lịch Jack', x: -3, z: -30, targetX: 3, targetZ: -30, speed: 1.3, hat: 'mu_phot', outfit: 'ba_ba', roleTitle: 'Khách Du Lịch' },
    { id: 'cust_ba_bay', name: 'Bà Bảy Bến Sông', x: 0, z: 30, targetX: 4, targetZ: 30, speed: 1.1, hat: 'non_la', outfit: 'ba_ba', roleTitle: 'Lái Đò Sông Quê' },
    { id: 'cust_chu_chin', name: 'Chú Chín Thuyền Chài', x: -4, z: 32, targetX: 0, targetZ: 32, speed: 1.2, hat: 'non_la', outfit: 'ba_ba', roleTitle: 'Ngư Dân Đêm Hội' },
  ];
  if (typeof syncCustomers === 'function') syncCustomers(demoCustomers);

  if (typeof initPetDog === 'function') initPetDog();
  if (typeof initExpandedTownNetAndUI === 'function') initExpandedTownNetAndUI();
  if (typeof updateGoldenHourHUD === 'function') updateGoldenHourHUD();
  if (typeof syncWishingLanterns3D === 'function') syncWishingLanterns3D();

  if (typeof showToast === 'function') {
    showToast('🏮 Đã vào Chợ Thị Trấn 3D (Chế độ Tham quan)! Dạo phố vui vẻ nhé bà con.', 5000);
  }
  if (typeof addChatMessage === 'function') {
    addChatMessage('Loa Phường', '📢 Chào mừng bà con đến với Chợ Thị Trấn Việt Nam 3D! Chúc bà con dạo chơi vui vẻ!', 'system', 'town');
  }

  if (typeof updateHUD === 'function') updateHUD();
}

function joinGame() {
  try {
    initAudio();
  } catch (_) {}

  const input = document.getElementById('nickname-input');
  const roomInput = document.getElementById('room-code-input');
  const recInput = document.getElementById('recovery-code-input');
  const nick = (input && input.value || "").trim() || `TiểuThương_${Math.floor(100 + Math.random() * 899)}`;
  const roomCode = (roomInput && roomInput.value.trim()) || "";
  const recoveryCode = (recInput && recInput.value.trim()) || "";
  const savedToken = localStorage.getItem('player_token') || "";
  const urlParams = new URLSearchParams(window.location.search);
  const debugFestival = urlParams.get('festival') || "";
  const serverUrl = urlParams.get('server') || localStorage.getItem('server_url') || '';

  const joinBtn = document.querySelector('#join-screen .join-btn.join-cta');
  if (joinBtn) {
    joinBtn.disabled = true;
    joinBtn.textContent = '⏳ Đang vào chợ...';
  }

  const badge = document.getElementById('join-online-badge');
  if (badge) {
    badge.textContent = '🟡 Đang kết nối thị trấn...';
  }

  // Nếu không có Socket.IO, tự động mở chế độ tham quan offline ngay lập tức
  if (typeof io === 'undefined') {
    console.warn('[Network] Không tìm thấy Socket.IO, chuyển sang chế độ tham quan offline.');
    startOfflineDemo(nick);
    return;
  }

  if (socket) {
    try { socket.disconnect(); } catch (_) {}
  }

  let joined = false;

  // Hẹn giờ dự phòng 3 giây: nếu server không phản hồi, tự động mở Chế độ Tham quan 3D
  const connectionTimeout = setTimeout(() => {
    if (!joined) {
      const joinScreen = document.getElementById('join-screen');
      if (joinScreen && joinScreen.classList.contains('active')) {
        console.warn('[Network] Máy chủ phản hồi chậm hoặc đang ở máy chủ tĩnh. Tự động mở Chế độ Tham quan 3D.');
        startOfflineDemo(nick);
      }
    }
  }, 3000);

  try {
    socket = serverUrl
      ? io(serverUrl, { timeout: 3500, transports: ['websocket', 'polling'] })
      : io({ timeout: 3500, transports: ['websocket', 'polling'] });
    window.socket = socket;
  } catch (err) {
    console.warn('[Network error]', err);
    clearTimeout(connectionTimeout);
    startOfflineDemo(nick);
    return;
  }

  socket.on('connect_error', (err) => {
    console.warn('[Socket connect_error]', err);
    if (!joined) {
      const joinScreen = document.getElementById('join-screen');
      if (joinScreen && joinScreen.classList.contains('active')) {
        clearTimeout(connectionTimeout);
        startOfflineDemo(nick);
      }
    }
  });

  socket.on('connect', () => {
    socket.emit(
      'join',
      {
        nickname: nick,
        playerToken: savedToken,
        recoveryCode,
        roomCode,
        customization: myCustomization,
        festival: debugFestival,
      },
      (res) => {
        joined = true;
        clearTimeout(connectionTimeout);

        if (joinBtn) {
          joinBtn.disabled = false;
          joinBtn.textContent = '▶ VÀO CHỢ';
        }

        if (!res || !res.ok) {
          showToast((res && res.error) || 'Lỗi khi vào chợ!');
          if (res && res.code === 'NICKNAME_TAKEN' && Array.isArray(res.suggestions)) {
            const box = document.getElementById('nickname-suggestions-box');
            const list = document.getElementById('nickname-suggestions-list');
            if (box && list) {
              list.innerHTML = '';
              res.suggestions.forEach((sug) => {
                const btn = document.createElement('button');
                btn.className = 'chip-btn active';
                btn.textContent = sug;
                btn.onclick = () => {
                  input.value = sug;
                  localStorage.setItem('last_nickname', sug);
                  box.style.display = 'none';
                  joinGame();
                };
                list.appendChild(btn);
              });
              box.style.display = 'block';
            }
          }
          return;
        }

        const sugBox = document.getElementById('nickname-suggestions-box');
        if (sugBox) sugBox.style.display = 'none';

        if (res.playerToken) {
          localStorage.setItem('player_token', res.playerToken);
        }
        if (res.recoveryCode) {
          localStorage.setItem('recovery_code', res.recoveryCode);
        }

        myPlayer.nickname = res.player.nickname;
        if (res.player.pos) {
          myPlayer.pos = { x: res.player.pos.x, z: res.player.pos.z };
        }
        if (typeof res.player.rot === 'number') {
          myPlayer.rot = res.player.rot;
        }
        myPlayer.money = res.player.money;
        myPlayer.inventory = res.player.inventory;
        myPlayer.stalls = res.player.stalls;
        myPlayer.quests = res.player.quests;
        myPlayer.hoverboard = Boolean(res.player.hoverboard);
        myPlayer.friends = Array.isArray(res.player.friends) ? res.player.friends : [];
        myPlayer.blockedUsers = Array.isArray(res.player.blockedUsers) ? res.player.blockedUsers : [];
        myPlayer.affinity = res.player.affinity || 0;
        myPlayer.socialTitle = res.player.socialTitle || 'Khách Quen Phố Chợ';
        myPlayer.collection = res.player.collection || {};
        myPlayer.houseConfig = res.player.houseConfig || { privacy: 'public', guestbook: [] };
        myPlayer.roomId = res.roomId || 'public-1';
        myPlayer.tutorialCompleted = Boolean(res.player.tutorialCompleted);
        myPlayer.tutorialStep = Number(res.player.tutorialStep) || 1;
        myPlayer.exp = Number(res.player.exp) || 0;

        const roomLabel = document.getElementById('current-room-label');
        if (roomLabel) {
          roomLabel.textContent = res.roomCode ? `Phòng Bạn Bè: ${res.roomCode}` : `Phố Chợ (${res.roomId || 'public-1'})`;
        }

        if (res.player.customization) {
          myCustomization = {
            hat: res.player.customization.hat || 'non_la',
            outfit: res.player.customization.outfit || 'ba_ba',
            color: typeof res.player.customization.color === 'number' ? res.player.customization.color : 0xf59e0b,
          };
        }

        gameConstants = res.constants;

        // ECONOMY 2.0: khởi tạo tín hiệu chợ, cấp độ & tutorial sau khi join
        if (window.EconomyUI) {
          window.EconomyUI.onJoined();
          if (res.snapshot.marketSignals) window.EconomyUI.updateMarketSignals(res.snapshot.marketSignals);
        }

        document.getElementById('join-screen').classList.remove('active');

        init3D();

        if (myPlayer.mesh) {
          scene.remove(myPlayer.mesh.group);
        }
        myPlayer.mesh = createCharacterMesh(myCustomization, myPlayer.nickname);
        myPlayer.mesh.group.position.set(myPlayer.pos.x, 0, myPlayer.pos.z);
        scene.add(myPlayer.mesh.group);

        if (controls && camera) {
          const isPortrait = window.innerWidth < window.innerHeight;
          camera.fov = isPortrait ? 60 : 48;
          camera.updateProjectionMatrix();
          controls.target.set(myPlayer.pos.x, 1.1, myPlayer.pos.z);
          camera.position.set(myPlayer.pos.x, 4.6, myPlayer.pos.z + 6.8);
          controls.update();
        }

        syncStalls(res.snapshot.stalls);
        syncCustomers(res.snapshot.customers);
        if (res.snapshot.supplyDrop) worldState.supplyDrop = res.snapshot.supplyDrop;
        if (res.snapshot.marketEvent) updateMarketEventBanner(res.snapshot.marketEvent);
        if (res.snapshot.bauCua) worldState.bauCua = res.snapshot.bauCua;
        if (res.snapshot.teaTable) worldState.teaTable = res.snapshot.teaTable;
        if (res.snapshot.communityEvents) worldState.communityEvents = res.snapshot.communityEvents;
        if (res.snapshot.activities) worldState.activities = res.snapshot.activities;
        if (res.snapshot.seats) worldState.seats = res.snapshot.seats;
        if (res.snapshot.festival) worldState.festival = res.snapshot.festival;
        if (res.snapshot.hotspot) worldState.hotspot = res.snapshot.hotspot;
        if (res.snapshot.shuttlecock) {
          shuttlecockAnim.combo = res.snapshot.shuttlecock.combo || 0;
          shuttlecockAnim.maxCombo = res.snapshot.shuttlecock.maxCombo || 0;
        }

        if (Array.isArray(res.snapshot.chatHistory)) {
          const box = document.getElementById('chat-messages');
          if (box) box.innerHTML = '';
          res.snapshot.chatHistory.forEach((item) => {
            if (Array.isArray(myPlayer.blockedUsers) && myPlayer.blockedUsers.includes(item.nickname)) return;
            const prefix = item.channel === 'nearby' ? '[Quanh Đây] ' : '';
            addChatMessage(
              item.nickname,
              `${prefix}${item.msg}`,
              item.isSystem ? 'system' : '',
              item.isSystem ? 'system' : item.channel || 'town'
            );
          });
        }

        initPetDog();
        if (typeof initExpandedTownNetAndUI === 'function') {
          initExpandedTownNetAndUI();
        }
        if (typeof updateGoldenHourHUD === 'function') {
          updateGoldenHourHUD();
        }
        if (typeof syncWishingLanterns3D === 'function') {
          syncWishingLanterns3D();
        }

        res.snapshot.players.forEach((p) => {
          if (p.nickname !== myPlayer.nickname) {
            syncOtherPlayerMove(p.nickname, p.pos, p.rot, p.hoverboard, p.customization);
          }
        });
        worldState.day = res.snapshot.day;
        worldState.timeOfDay = res.snapshot.timeOfDay;
        worldState.leaderboard = res.snapshot.leaderboard;

        updateHUD();
        renderBauCuaBoard();
        updateTeaTableUI();
        renderCommunityEvents();
        playSound('fanfare');
        showToast(`Chào mừng ${myPlayer.nickname} đến Chợ Thị Trấn Việt Nam!`);

        cancelAnimationFrame(frameId);
        clearTimeout(frameId);
        gameLoop();
      }
    );
  });

  socket.on('player_join', (data) => {
    addChatMessage('Loa Phường', `👋 Bà con ${data.nickname} vừa ghé chợ thị trấn!`, 'system', 'system');
    syncOtherPlayerMove(data.nickname, data.pos, data.rot, data.hoverboard, data.customization);
  });

  socket.on('player_move', (data) => {
    syncOtherPlayerMove(data.nickname, data.pos, data.rot, data.hoverboard);
  });

  socket.on('player_hoverboard', (data) => {
    if (data.nickname !== myPlayer.nickname && worldState.otherPlayers[data.nickname]) {
      worldState.otherPlayers[data.nickname].hoverboard = Boolean(data.hoverboard);
    }
  });

  socket.on('player_leave', (data) => {
    addChatMessage('Loa Phường', `${data.nickname} đã dọn hàng về nghỉ.`, 'system', 'system');
    removeOtherPlayer(data.nickname);
  });

  socket.on('chat_message', (data) => {
    if (Array.isArray(myPlayer.blockedUsers) && myPlayer.blockedUsers.includes(data.nickname)) {
      return;
    }
    const isMe = data.nickname === myPlayer.nickname;
    const speakerChar = isMe
      ? myPlayer.mesh
      : worldState.otherPlayers[data.nickname] && worldState.otherPlayers[data.nickname].char;

    if (speakerChar) {
      showFloatingSpeechOnChar(speakerChar, data.msg);
    }

    if (data.channel === 'nearby' && !isMe && data.pos) {
      const dist = Math.hypot((data.pos.x || 0) - myPlayer.pos.x, (data.pos.z || 0) - myPlayer.pos.z);
      if (dist > 18) return;
    }

    const prefix = data.channel === 'nearby' ? '[Quanh Đây] ' : '';
    addChatMessage(
      data.nickname,
      `${prefix}${data.msg}`,
      data.isSystem ? 'system' : '',
      data.isSystem ? 'system' : data.channel || 'town'
    );
  });

  socket.on('player_emote', (data) => {
    const isMe = data.nickname === myPlayer.nickname;
    const targetChar = isMe ? myPlayer.mesh : (worldState.otherPlayers[data.nickname] && worldState.otherPlayers[data.nickname].char);
    const targetPos = isMe ? myPlayer.pos : (targetChar && targetChar.group.position);

    if (data.emote === 'money_rain') {
      if (targetPos) triggerCoinParticles(targetPos.x, 0.6, targetPos.z);
      playSound('coin');
      addChatMessage('Phố Chợ', `🧧 ${data.nickname} vừa tung cơn mưa Lì Xì đỏ thắm!`, 'buy', 'system');
    } else if (data.emote === 'cyber_dance') {
      if (isMe) myPlayer.danceTimer = 3.2;
      else if (worldState.otherPlayers[data.nickname]) worldState.otherPlayers[data.nickname].danceTimer = 3.2;
      playSound('fanfare');
      showFloatingSpeechOnChar(targetChar, "🕺 Nhảy hội chợ cực sung!");
      addChatMessage('Phố Chợ', `🕺 ${data.nickname} đang múa quạt hội chợ cực sung!`, 'system', 'system');
    } else if (data.emote === 'funny_meme') {
      const cry = VIETNAMESE_MARKET_CRIES[Math.floor(Math.random() * VIETNAMESE_MARKET_CRIES.length)];
      playSound('horn');
      showFloatingSpeechOnChar(targetChar, cry);
      addChatMessage(data.nickname, cry, 'buy', 'town');
    } else if (data.emote === 'firework') {
      if (targetPos) {
        launchFireworkRocket(
          targetPos.x,
          targetPos.z,
          targetPos.x + (Math.random() - 0.5) * 8,
          28 + Math.random() * 8,
          targetPos.z + (Math.random() - 0.5) * 8,
          'random'
        );
      }
    }
  });

  socket.on('stall_updated', (stallData) => {
    syncStalls(worldState.stalls.map((s) => (s.id === stallData.id ? stallData : s)));
    if (currentInteractingStall && currentInteractingStall.id === stallData.id) {
      currentInteractingStall = stallData;
      renderStallModalContent(stallData);
    }
    updateHUD();
  });

  socket.on('tea_table_sync', (table) => {
    worldState.teaTable = table;
    updateTeaTableUI();
  });

  socket.on('world_event', (ev) => {
    // ECONOMY 2.0: sự kiện trả giá/kết sổ/cấp độ do economy-ui xử lý riêng (cả sự kiện riêng tư)
    if (window.EconomyUI && window.EconomyUI.handleWorldEvent(ev) && ev.type !== 'customer_buy') {
      return;
    }
    if (ev.type === 'bus_arrived') {
      addChatMessage('Xe Buýt Xanh', ev.message, 'system', 'system');
      showToast(ev.message);
      return;
    }
    if (ev.type === 'customer_buy') {
      const isMyStall = ev.owner === myPlayer.nickname;
      addChatMessage(
        'Bán hàng',
        `🛍️ ${ev.customerName} mua ${ev.goodIcon} ${ev.goodName} tại "${ev.stallName}" (+${ev.price.toLocaleString()}đ)`,
        'buy',
        'system'
      );

      const stall = stallMeshes[ev.stallId];
      if (stall) {
        triggerCoinParticles(stall.group.position.x, 1.3, stall.group.position.z);
        spawnFloatingPopup3D(
          stall.group.position.x,
          3.2,
          stall.group.position.z,
          `${ev.goodIcon} +${ev.price.toLocaleString()}đ`
        );
      }

      if (isMyStall) {
        playSound('coin');
        showToast(`+${ev.price.toLocaleString()}đ từ khách ${ev.customerName}!`);
      }
    } else if (ev.type === 'market_event') {
      updateMarketEventBanner(ev.event);
      playSound('fanfare');
      showToast(ev.event.title);
      addChatMessage('Loa Phường', `${ev.event.title} — ${ev.event.description}`, 'system', 'system');
    } else if (ev.type === 'supply_claimed') {
      triggerCoinParticles(ev.x, 1.0, ev.z);
      spawnFloatingPopup3D(ev.x, 2.5, ev.z, `🧧 +${ev.bonusMoney.toLocaleString()}đ`);
      playSound('fanfare');
      addChatMessage(
        'Lộc Chợ',
        `🧧 ${ev.nickname} vừa nhặt Rương Lộc Lì Xì (+${ev.bonusMoney.toLocaleString()}đ & 2x ${ev.goodIcon} ${ev.goodName})!`,
        'buy',
        'system'
      );
      if (ev.nickname === myPlayer.nickname) {
        showToast(`🧧 Hái Lộc Lì Xì: +${ev.bonusMoney.toLocaleString()}đ & 2x ${ev.goodName}!`);
      }
    } else if (ev.type === 'supply_spawn') {
      worldState.supplyDrop = ev.drop;
      addChatMessage('Loa Phường', `🧧 Một Rương Lộc Lì Xì vừa xuất hiện giữa sân chợ! Bà con mau chạy ra nhặt!`, 'system', 'system');
    } else if (ev.type === 'bau_cua_rolling') {
      if (worldState.bauCua) {
        worldState.bauCua.state = 'rolling';
        worldState.bauCua.timer = 4;
      }
      playSound('horn');
      addChatMessage('Sới Bầu Cua', `🎲 Nhà cái đang lắc bát xúc xắc rộn ràng! Chờ mở bát!`, 'system', 'system');
      renderBauCuaBoard();
    } else if (ev.type === 'bau_cua_result') {
      if (worldState.bauCua) {
        worldState.bauCua.state = 'result';
        worldState.bauCua.timer = 7;
        worldState.bauCua.lastDice = ev.dice;
        worldState.bauCua.history = ev.history;
      }
      playSound('fanfare');
      if (bauCuaBoothGroup) {
        triggerCoinParticles(bauCuaBoothGroup.position.x, 1.2, bauCuaBoothGroup.position.z);
      }
      renderBauCuaBoard();

      const myWin = ev.winners && ev.winners.find((w) => w.nickname === myPlayer.nickname);
      if (myWin) {
        playSound('coin');
        showToast(`🎉 CHÚC MỪNG! Bạn trúng Bầu Cua: +${myWin.win.toLocaleString()}đ!`);
        triggerCoinParticles(myPlayer.pos.x, 1.0, myPlayer.pos.z);
      }
    } else if (ev.type === 'bau_cua_new_round') {
      if (worldState.bauCua) {
        worldState.bauCua.roundId = ev.roundId;
        worldState.bauCua.state = 'betting';
        worldState.bauCua.timer = 20;
      }
      myCurrentRoundBets = {};
      renderBauCuaBoard();
      addChatMessage('Sới Bầu Cua', `🎲 Vòng cược mới #${ev.roundId} đã mở! Bà con nhanh tay đặt cửa may mắn!`, 'system', 'system');
    } else if (ev.type === 'player_social') {
      addChatMessage('Phố Chợ', ev.message, 'buy', 'system');
      if (ev.payload) {
        const isTarget = ev.payload.targetNick === myPlayer.nickname;
        if (isTarget) {
          if (ev.payload.actionType === 'coffee') {
            playSound('buy');
            showToast(`☕ ${ev.payload.sourceNick} vừa mời bạn 1 ly Cà Phê Sữa Đá Sài Gòn!`);
            triggerCoinParticles(myPlayer.pos.x, 1.0, myPlayer.pos.z);
          } else if (ev.payload.actionType === 'lixi') {
            playSound('fanfare');
            showToast(`🧧 Bạn nhận được Bao Lì Xì ${ev.payload.amount.toLocaleString()}đ từ ${ev.payload.sourceNick}!`);
            triggerCoinParticles(myPlayer.pos.x, 1.0, myPlayer.pos.z);
          } else if (ev.payload.actionType === 'cheers') {
            playSound('fanfare');
            showToast(`🍻 ${ev.payload.sourceNick} cụng ly trà đá với bạn: "1, 2, 3 DÔ!"`);
          } else if (ev.payload.actionType === 'ride') {
            playSound('horn');
            showToast(`🛵 ${ev.payload.sourceNick} bấm còi bim bim rủ bạn kẹp 2 lượn chợ!`);
          }
        }
      }
    } else if (ev.type === 'tea_table_cheer') {
      addChatMessage('Quán Trà Đá', ev.message, 'system', 'system');
    } else if (ev.type === 'player_caught_fish') {
      addChatMessage('Bến Sông', ev.message, 'buy', 'system');
    } else if (ev.type === 'community_event_created') {
      addChatMessage('Bảng Tin Thị Trấn', ev.message, 'system', 'system');
      if (worldState.communityEvents) {
        worldState.communityEvents.unshift(ev.event);
        renderCommunityEvents();
      }
    } else if (ev.type === 'community_event_joined') {
      addChatMessage('Bảng Tin Thị Trấn', ev.message, 'buy', 'system');
      if (worldState.communityEvents) {
        const found = worldState.communityEvents.find((x) => x.id === ev.eventId);
        if (found && !found.participants.includes(ev.nickname)) {
          found.participants.push(ev.nickname);
          renderCommunityEvents();
        }
      }
    } else if (ev.type === 'shuttlecock_kicked') {
      shuttlecockAnim.active = true;
      shuttlecockAnim.timer = 0;
      shuttlecockAnim.combo = ev.combo || 1;
      shuttlecockAnim.maxCombo = ev.maxCombo || shuttlecockAnim.combo;
      const angle = Math.random() * Math.PI * 2;
      shuttlecockAnim.startPos.copy(shuttlecockMesh ? shuttlecockMesh.position : new THREE.Vector3(0, 0.45, 0));
      shuttlecockAnim.endPos.set(Math.cos(angle) * 1.35, 0.45, Math.sin(angle) * 1.35);

      if (shuttlecockCourtGroup && shuttlecockLabelSprite) {
        shuttlecockCourtGroup.remove(shuttlecockLabelSprite);
        shuttlecockLabelSprite = createTextSprite(
          `🪶 ĐÁ CẦU COMBO x${shuttlecockAnim.combo} (Kỷ lục: ${shuttlecockAnim.maxCombo})`,
          "#fef08a",
          "rgba(6, 78, 59, 0.95)"
        );
        shuttlecockLabelSprite.position.set(0, 3.2, 0);
        shuttlecockLabelSprite.scale.set(5.4, 1.08, 1);
        shuttlecockCourtGroup.add(shuttlecockLabelSprite);
      }
      spawnFloatingPopup3D(48, 2.8, -16, `🪶 Combo x${shuttlecockAnim.combo}!`);
      playSound('jump');
      if (ev.combo % 5 === 0 || ev.nickname === myPlayer.nickname) {
        addChatMessage('Sân Đá Cầu', ev.message, 'buy', 'system');
      }
    } else if (ev.type === 'friend_added') {
      addChatMessage('Kết Bạn', ev.message, 'buy', 'system');
      if (ev.targetNick === myPlayer.nickname) {
        if (!Array.isArray(myPlayer.friends)) myPlayer.friends = [];
        if (!myPlayer.friends.includes(ev.sourceNick)) myPlayer.friends.push(ev.sourceNick);
        updateHUD();
        playSound('fanfare');
        showToast(`👫 ${ev.sourceNick} vừa kết bạn tri kỷ với bạn (+300đ Lộc)!`);
      }
    } else if (
      ev.type === 'golden_hour_start' ||
      ev.type === 'stage_perform_start' ||
      ev.type === 'tug_of_war_end' ||
      ev.type === 'wish_created' ||
      ev.type === 'craft_coop_completed'
    ) {
      addChatMessage('Thị Trấn Sống', ev.message, 'system', 'system');
      if (ev.type === 'wish_created' && typeof syncWishingLanterns3D === 'function') {
        syncWishingLanterns3D();
      }
    }
  });

  socket.on('community_events_updated', (events) => {
    worldState.communityEvents = events;
    renderCommunityEvents();
  });

  socket.on('player_skin_updated', (data) => {
    if (data.nickname === myPlayer.nickname) return;
    const p = worldState.otherPlayers[data.nickname];
    if (p && p.char) {
      scene.remove(p.char.group);
      p.customization = data.customization;
      p.char = createCharacterMesh(data.customization || 0x38bdf8, data.nickname);
      p.char.group.position.set(p.targetPos.x, 0, p.targetPos.z);
      scene.add(p.char.group);
    }
  });

  socket.on('world_sync', (data) => {
    syncCustomers(data.customers);
    if (data.supplyDrop) worldState.supplyDrop = data.supplyDrop;
    if (data.marketEvent) updateMarketEventBanner(data.marketEvent);
    if (data.marketSignals && window.EconomyUI) window.EconomyUI.updateMarketSignals(data.marketSignals);
    if (data.bauCua) {
      worldState.bauCua = data.bauCua;
      renderBauCuaBoard();
    }
    if (data.teaTable) {
      worldState.teaTable = data.teaTable;
      updateTeaTableUI();
    }
    if (data.communityEvents) {
      worldState.communityEvents = data.communityEvents;
      renderCommunityEvents();
    }
    if (data.activities) {
      worldState.activities = data.activities;
      if (typeof updateGoldenHourHUD === 'function') updateGoldenHourHUD();
    }
    if (data.seats) worldState.seats = data.seats;
    if (data.festival) worldState.festival = data.festival;
    if (data.hotspot) worldState.hotspot = data.hotspot;
    if (data.shuttlecock) {
      shuttlecockAnim.combo = data.shuttlecock.combo || 0;
      shuttlecockAnim.maxCombo = data.shuttlecock.maxCombo || 0;
    }
    worldState.day = data.day;
    worldState.timeOfDay = data.timeOfDay;
    worldState.leaderboard = data.leaderboard;
    updateHUD();
  });

  socket.on('sync_player_stats', (patch) => {
    if (patch.money !== undefined) myPlayer.money = patch.money;
    if (patch.inventory !== undefined) myPlayer.inventory = patch.inventory;
    if (patch.stalls !== undefined) myPlayer.stalls = patch.stalls;
    if (patch.quests !== undefined) myPlayer.quests = patch.quests;
    if (patch.friends !== undefined) myPlayer.friends = patch.friends;
    if (patch.blockedUsers !== undefined) myPlayer.blockedUsers = patch.blockedUsers;
    if (patch.affinity !== undefined) myPlayer.affinity = patch.affinity;
    if (patch.socialTitle !== undefined) myPlayer.socialTitle = patch.socialTitle;
    if (patch.collection !== undefined) myPlayer.collection = patch.collection;
    if (patch.exp !== undefined) myPlayer.exp = patch.exp;
    if (window.EconomyUI) window.EconomyUI.onPlayerStatsSynced(patch);
    if (patch.houseConfig !== undefined) {
      myPlayer.houseConfig = patch.houseConfig;
      if (typeof window.updatePlayerHouse3D === 'function') {
        window.updatePlayerHouse3D(myPlayer.houseConfig.level || 0, myPlayer.houseConfig);
      }
    }
    updateHUD();
  });

  socket.on('house_updated', (data) => {
    if (data && data.nickname === myPlayer.nickname) {
      myPlayer.houseConfig = data.houseConfig;
      if (typeof window.updatePlayerHouse3D === 'function') {
        window.updatePlayerHouse3D(data.houseConfig.level || 0, data.houseConfig);
      }
      renderHouseBuildTab();
      renderHouseShopTab();
      renderHouseGuestbook();
    }
  });
}

function updateMarketEventBanner(ev) {
  if (!ev) return;
  const prevId = worldState.marketEvent && worldState.marketEvent.id;
  worldState.marketEvent = ev;
  const titleEl = document.getElementById('event-title');
  const descEl = document.getElementById('event-desc');
  if (titleEl) titleEl.innerText = ev.title;
  if (descEl) descEl.innerText = ev.description;
  if (prevId !== ev.id) {
    applyWeatherVisuals();
    showEventBanner(ev.title, ev.description, 7000);
  }
}

/* ==================== CHAT & MODALS ==================== */
function addChatMessage(name, msg, type = "", channel = "town") {
  const box = document.getElementById('chat-messages');
  if (!box) return;
  const row = document.createElement('div');
  const effChannel = type === 'system' ? 'system' : channel || 'town';
  const isLoaPhuong = name === 'Loa Phường' || name === 'Loa Phuong';
  row.className = `chat-msg ${escapeHtml(type)} ${name === myPlayer.nickname ? 'me' : ''} ${isLoaPhuong ? 'loa-phuong-msg' : ''}`;
  row.dataset.channel = effChannel;

  const activeTab = window.__activeChatFilterTab || 'all';
  if (activeTab !== 'all' && effChannel !== activeTab) {
    row.style.display = 'none';
  }

  const nameSpan = document.createElement('span');
  nameSpan.className = isLoaPhuong ? 'name loa-badge' : 'name';
  nameSpan.textContent = isLoaPhuong ? `📢 LOA PHƯỜNG:` : `${name}:`;
  row.appendChild(nameSpan);
  row.appendChild(document.createTextNode(` ${msg}`));

  box.appendChild(row);
  box.scrollTop = box.scrollHeight;
}

let activeChatChannel = 'town';
function toggleChatChannel() {
  activeChatChannel = activeChatChannel === 'town' ? 'nearby' : 'town';
  const btn = document.getElementById('chat-channel-btn');
  const input = document.getElementById('chat-input');
  if (btn) {
    btn.innerText = activeChatChannel === 'nearby' ? '📍 Quanh Đây (18m)' : '🌐 Toàn Thị Trấn';
    btn.classList.toggle('active', activeChatChannel === 'nearby');
  }
  if (input) {
    input.placeholder =
      activeChatChannel === 'nearby'
        ? 'Trò chuyện thân mật với bà con trong bán kính 18m...'
        : 'Nhắn tin rao hàng với toàn thị trấn...';
  }
}

function sendChat() {
  const input = document.getElementById('chat-input');
  const msg = input.value.trim();
  if (!msg || !socket) return;
  socket.emit('chat', { msg, channel: activeChatChannel });
  input.value = '';
}

function sendEmote(emote) {
  initAudio();
  if (!socket) {
    if (emote === 'cyber_dance') myPlayer.danceTimer = 3.0;
    return;
  }
  socket.emit('emote', emote);
}

function toggleChat(forceMinimize) {
  const widget = document.getElementById('chat-widget');
  const label = document.getElementById('chat-toggle-label');
  const titleEl = document.getElementById('chat-header-title');
  if (!widget) return;
  const isMin = typeof forceMinimize === 'boolean'
    ? forceMinimize
    : !widget.classList.contains('chat-minimized');
  widget.classList.toggle('chat-minimized', isMin);
  const isMob = window.innerWidth <= 900 || document.body.classList.contains('mobile-mode');
  if (titleEl && isMob) {
    titleEl.innerText = isMin ? '💬 Trò Chuyện' : '💬 TRÒ CHUYỆN & BÀ TÁM CHỢ';
  }
  if (label) {
    label.innerText = isMin ? (isMob ? 'Mở ▾' : 'Mở rộng ▴') : 'Thu gọn ✕';
  }
}

function openModal(id) {
  initAudio();
  playSound('click');
  if (window.innerWidth <= 900 || document.body.classList.contains('mobile-mode')) {
    toggleDock(true);
  }
  const el = document.getElementById(id);
  if (el) el.classList.add('active');
}

function closeModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.remove('active');
}

// 1. Chợ Đầu Mối (Wholesale) với Bộ Lọc Danh Mục & Tính Lãi Gộp
function openWholesaleModal() {
  const container = document.getElementById('wholesale-goods-list');
  const notice = document.getElementById('wholesale-event-notice');
  const filterBar = document.getElementById('wholesale-filter-bar');
  container.innerHTML = '';
  filterBar.innerHTML = '';

  const ev = worldState.marketEvent || {};
  const buyMult = ev.buyMultiplier || 1.0;
  notice.innerText = `${ev.title || 'Loa Phường'}: ${ev.description || ''}`;

  const categories = ["Tất cả", ...new Set(gameConstants.GOODS.map((g) => g.category))];
  categories.forEach((cat) => {
    const btn = document.createElement('button');
    btn.className = `filter-tab ${selectedWholesaleCategory === cat ? 'active' : ''}`;
    btn.innerText = cat;
    btn.onclick = () => {
      selectedWholesaleCategory = cat;
      openWholesaleModal();
    };
    filterBar.appendChild(btn);
  });

  const filteredGoods = gameConstants.GOODS.filter(
    (g) => selectedWholesaleCategory === "Tất cả" || g.category === selectedWholesaleCategory
  );

  filteredGoods.forEach((g) => {
    const myQty = myPlayer.inventory[g.id] || 0;
    const effectiveBuy = Math.round(g.buy * buyMult);
    const isBoosted = Array.isArray(ev.boostCategory) && ev.boostCategory.includes(g.category);
    const effectiveSell = Math.round(g.sell * (isBoosted ? 1.45 : (ev.sellMultiplier || 1.0)));
    const profit = effectiveSell - effectiveBuy;

    const card = document.createElement('div');
    card.className = 'good-card tabular-nums';
    card.innerHTML = `
      <div class="good-card-header">
        <div class="good-icon">${g.icon}</div>
        <div class="good-info">
          <div class="good-name">${g.name} ${isBoosted ? '🔥' : ''}</div>
          <div class="good-cat">${g.category} · Lãi: <b style="color:#4ade80">+${profit.toLocaleString()}đ/món</b></div>
        </div>
      </div>
      <div class="good-prices">
        <span class="buy">Giá sỉ: <b>${effectiveBuy.toLocaleString()}đ</b></span>
        <span class="sell">Bán lẻ: <b>${effectiveSell.toLocaleString()}đ</b></span>
      </div>
      <div style="font-size:12px; color:var(--text-muted)">Trong kho: <b style="color:var(--gold)">${myQty}</b> món</div>
      <div class="good-actions">
        <button class="btn-small" onclick="buyWholesale('${g.id}', 1)" ${myPlayer.money < effectiveBuy ? 'disabled' : ''}>Nhập 1</button>
        <button class="btn-small" onclick="buyWholesale('${g.id}', 5)" ${myPlayer.money < effectiveBuy * 5 ? 'disabled' : ''}>Nhập 5</button>
        <button class="btn-small" onclick="buyWholesale('${g.id}', 10)" ${myPlayer.money < effectiveBuy * 10 ? 'disabled' : ''}>Nhập 10</button>
      </div>
    `;
    container.appendChild(card);
  });

  openModal('modal-wholesale');
}

function buyWholesale(goodId, amount) {
  if (!socket) return;
  socket.emit('buyWholesale', { goodId, amount }, (res) => {
    if (!res.ok) {
      showToast(res.error || 'Lỗi nhập hàng!');
      return;
    }
    playSound('buy');
    showToast(`Đã nhập ${amount} món hàng về kho!`);
    openWholesaleModal();
  });
}

// 2. Tương tác với Địa Điểm hoặc Sạp Hàng Gần Nhất
function interactNearest() {
  if (!myPlayer.mesh) return;

  if (
    Math.hypot(myPlayer.pos.x - 0, myPlayer.pos.z - (-48)) < 26 ||
    Math.hypot(myPlayer.pos.x - (-48), myPlayer.pos.z - 0) < 28 ||
    Math.hypot(myPlayer.pos.x - 48, myPlayer.pos.z - 0) < 28 ||
    Math.hypot(myPlayer.pos.x - 0, myPlayer.pos.z - 48) < 28 ||
    Math.hypot(myPlayer.pos.x - 0, myPlayer.pos.z - 82) < 34 ||
    Math.hypot(myPlayer.pos.x - (-140), myPlayer.pos.z - (-130)) < 48 ||
    Math.hypot(myPlayer.pos.x - 140, myPlayer.pos.z - (-130)) < 48 ||
    Math.hypot(myPlayer.pos.x - (-140), myPlayer.pos.z - 120) < 48 ||
    Math.hypot(myPlayer.pos.x - 140, myPlayer.pos.z - 120) < 48 ||
    Math.hypot(myPlayer.pos.x - (-580), myPlayer.pos.z - (-540)) < 85 ||
    Math.hypot(myPlayer.pos.x - 580, myPlayer.pos.z - (-540)) < 85 ||
    Math.hypot(myPlayer.pos.x - (-580), myPlayer.pos.z - 520) < 85 ||
    Math.hypot(myPlayer.pos.x - 580, myPlayer.pos.z - 520) < 85
  ) {
    openTownActivitiesModal();
    return;
  }

  // 1. Phố Dịch Vụ, Tài Chính & Độ Xe Phía Đông (x = 38)
  if (Math.hypot(myPlayer.pos.x - 38, myPlayer.pos.z - (-18)) < 7.0) {
    openBankModal();
    return;
  }
  if (Math.hypot(myPlayer.pos.x - 38, myPlayer.pos.z - (-6)) < 7.0) {
    openBankModal();
    return;
  }
  if (Math.hypot(myPlayer.pos.x - 38, myPlayer.pos.z - 6) < 7.0) {
    openLotteryModal();
    return;
  }
  if (Math.hypot(myPlayer.pos.x - 38, myPlayer.pos.z - 18) < 7.0) {
    openGarageModal();
    return;
  }

  // 2. Khu Bất Động Sản Nhà Ở Của Bạn (48, 22)
  if (Math.hypot(myPlayer.pos.x - 48, myPlayer.pos.z - 22) < 9.5) {
    openHouseModal();
    return;
  }

  // 3. Phố Cổ Văn Hóa & Làng Nghề Phía Tây (x = -38)
  if (Math.hypot(myPlayer.pos.x - (-38), myPlayer.pos.z - (-18)) < 7.0) {
    openCustomizationModal();
    return;
  }
  if (Math.hypot(myPlayer.pos.x - (-38), myPlayer.pos.z - (-6)) < 7.0) {
    openGarageModal();
    return;
  }
  if (Math.hypot(myPlayer.pos.x - (-38), myPlayer.pos.z - 6) < 7.0) {
    openCommunityEventsModal();
    return;
  }
  if (Math.hypot(myPlayer.pos.x - (-38), myPlayer.pos.z - 18) < 7.0) {
    openTeaTableModal();
    return;
  }

  // 4. Giải Trí, Thể Thao & Bờ Sông
  if (Math.hypot(myPlayer.pos.x - (-48), myPlayer.pos.z - (-16)) < 11.5) {
    openBauCuaModal();
    return;
  }
  if (Math.hypot(myPlayer.pos.x - 48, myPlayer.pos.z - (-16)) < 11.5) {
    kickShuttlecockNow();
    return;
  }
  if (Math.hypot(myPlayer.pos.x - (-16), myPlayer.pos.z - 28) < 11.5) {
    openTeaTableModal();
    return;
  }
  if (Math.hypot(myPlayer.pos.x - 0, myPlayer.pos.z - 34) < 11.0) {
    openFishingModal();
    return;
  }

  let nearest = null;
  let minD = 999;

  worldState.stalls.forEach((s) => {
    const d = Math.hypot(myPlayer.pos.x - s.position.x, myPlayer.pos.z - s.position.z);
    if (d < minD) {
      minD = d;
      nearest = s;
    }
  });

  if (nearest && minD < 6.8) {
    currentInteractingStall = nearest;
    renderStallModalContent(nearest);
    openModal('modal-stall');
  } else if (worldState.stalls.length > 0) {
    const myStall = worldState.stalls.find((s) => s.owner === myPlayer.nickname) || nearest;
    if (myStall) {
      currentInteractingStall = myStall;
      renderStallModalContent(myStall);
      openModal('modal-stall');
    }
  }
}

function openMyStallOrNearest() {
  const myStall = worldState.stalls && worldState.stalls.find((s) => s.owner === myPlayer.nickname);
  if (myStall) {
    currentInteractingStall = myStall;
    renderStallModalContent(myStall);
    openModal('modal-stall');
    return;
  }
  let nearest = null;
  let minD = 999;
  if (worldState.stalls) {
    worldState.stalls.forEach((s) => {
      const px = (myPlayer && myPlayer.pos && myPlayer.pos.x) || 0;
      const pz = (myPlayer && myPlayer.pos && myPlayer.pos.z) || 0;
      const d = Math.hypot(px - s.position.x, pz - s.position.z);
      if (d < minD) {
        minD = d;
        nearest = s;
      }
    });
  }
  if (nearest) {
    currentInteractingStall = nearest;
    renderStallModalContent(nearest);
    openModal('modal-stall');
  } else {
    showToast('🏪 Chưa tìm thấy sạp hàng nào quanh đây!');
  }
}

function renderStallModalContent(s) {
  const title = document.getElementById('stall-modal-title');
  const body = document.getElementById('stall-modal-body');
  title.innerText = `🏪 ${s.name} (Cấp ${s.level})`;

  const isOwner = s.owner === myPlayer.nickname;
  const safeStallId = escapeHtml(s.id);
  const safeStallName = escapeHtml(s.name);
  const safeOwner = escapeHtml(s.owner || '');
  let html = '';

  if (!s.owner) {
    // Sạp đầu tiên MIỄN PHÍ cho tân thủ (khớp với server rentStall)
    const isStarterFree = (!myPlayer.stalls || myPlayer.stalls.length === 0) && !myPlayer.tutorialCompleted;
    const stallCost = isStarterFree ? 0 : gameConstants.STALL_COST;
    html = `
      <div style="text-align:center; padding:14px;">
        <p style="font-size:14.5px; margin-bottom:10px;">Sạp hàng vị trí đắc địa này đang chờ bà con thuê mở tiệm!</p>
        ${
          isStarterFree
            ? `<div style="background:rgba(16,185,129,0.18); border:1px solid #10b981; border-radius:12px; padding:10px; margin-bottom:14px;">
                <span style="font-size:15px; font-weight:800; color:#a7f3d0;">🎁 Bác Ba tặng sạp khởi nghiệp MIỄN PHÍ (0đ)!</span>
              </div>`
            : `<div style="font-size:21px; font-weight:800; color:var(--gold); margin-bottom:14px;">
                Giá thuê sạp: ${stallCost.toLocaleString()}đ
              </div>`
        }
        <input type="text" id="stall-custom-name" class="join-input" placeholder="Đặt bảng tên cho sạp của bạn..." value="${safeStallName}" style="max-width:340px; margin:0 auto 14px;">
        <div>
          <button class="join-btn" style="max-width:260px; margin:0 auto;" onclick="rentStall('${safeStallId}')" ${myPlayer.money < stallCost ? 'disabled' : ''}>
            🏮 ${isStarterFree ? 'Nhận Sạp & Mở Khai Trương (0đ)' : 'Mở Sạp Khai Trương'}
          </button>
        </div>
      </div>
    `;
  } else if (isOwner) {
    const nextLevel = s.level + 1;
    const upgradeCost = gameConstants.STALL_UPGRADE_COSTS[nextLevel];

    html = `
      <div style="display:flex; justify-content:space-between; align-items:center; background:rgba(255,255,255,0.05); padding:12px 16px; border-radius:12px; flex-wrap:wrap; gap:10px;">
        <div>
          <div style="color:var(--gold); font-weight:800; font-size:14.5px;">Chủ sạp: Bạn (${escapeHtml(myPlayer.nickname)})</div>
          <div style="font-size:12px; color:var(--text-muted)">Tổng doanh thu: <b style="color:var(--mint)">${s.earnings.toLocaleString()}đ</b></div>
        </div>
        <div style="display:flex; gap:8px;">
          ${
            upgradeCost
              ? `<button class="btn-small" onclick="upgradeStall('${safeStallId}')" ${myPlayer.money < upgradeCost ? 'disabled' : ''}>Nâng Cấp ${nextLevel} (${upgradeCost.toLocaleString()}đ)</button>`
              : `<span style="color:var(--gold); font-size:12.5px; font-weight:800;">Cấp Tối Đa ★</span>`
          }
          ${
            !s.hasStaff
              ? `<button class="btn-small" onclick="hireStaff('${safeStallId}')" ${myPlayer.money < gameConstants.HIRE_STAFF_COST ? 'disabled' : ''}>Thuê Phụ Quán (${gameConstants.HIRE_STAFF_COST.toLocaleString()}đ)</button>`
              : `<span style="color:var(--mint); font-size:12.5px; font-weight:800;">Đã Có Phụ Quán 👒 (+15% giá)</span>`
          }
        </div>
      </div>

      <!-- ECONOMY 2.0: Panel Đặt Giá Sạp (slider 0.6x..1.8x, mở khóa Cấp 2) + nút Bày Toàn Bộ Hàng -->
      ${window.EconomyUI ? window.EconomyUI.renderStallPricePanel(s) : ''}
      <div style="display:flex; gap:8px; margin-top:10px; flex-wrap:wrap;">
        <button class="btn-small" style="background:linear-gradient(135deg, #059669, #10b981); color:#fff; font-weight:800; padding:9px 14px;" onclick="stockAllGoods('${safeStallId}')">⚡ Bày Toàn Bộ Hàng (1-Chạm)</button>
      </div>

      <h4 style="color:#fde68a; margin-top:6px; font-size:14px;">📦 Hàng Đang Bày Trên Mẹt Tre:</h4>
      <div style="background:rgba(0,0,0,0.3); border-radius:12px; padding:12px; display:flex; flex-direction:column; gap:8px;">
    `;

    const stallGoods = Object.keys(s.goods).filter((k) => s.goods[k] > 0);
    if (stallGoods.length === 0) {
      html += `<div style="font-size:12.5px; color:var(--text-muted); text-align:center; padding:10px;">Mẹt hàng đang trống! Hãy đưa hàng từ kho cá nhân bên dưới lên sạp.</div>`;
    } else {
      stallGoods.forEach((gId) => {
        const gDef = gameConstants.GOODS.find((g) => g.id === gId);
        if (!gDef) return;
        const safeGId = escapeHtml(gId);
        html += `
          <div style="display:flex; justify-content:space-between; align-items:center; font-size:13px; border-bottom:1px solid rgba(255,255,255,0.06); padding:6px 0;">
            <span>${escapeHtml(gDef.icon)} <b>${escapeHtml(gDef.name)}</b>: ${Number(s.goods[gId]) || 0} món (Bán lẻ ${gDef.sell.toLocaleString()}đ)</span>
            <button class="btn-small" style="max-width:95px;" onclick="withdrawGood('${safeStallId}', '${safeGId}', 1)">Cất vào kho</button>
          </div>
        `;
      });
    }

    html += `
      </div>
      <div style="display:flex; justify-content:space-between; align-items:center; margin-top:6px;">
        <h4 style="color:var(--gold); font-size:14px;">🎒 Kho Hàng Cá Nhân (Đưa Lên Sạp):</h4>
      </div>
      <div style="background:rgba(0,0,0,0.3); border-radius:12px; padding:12px; display:flex; flex-direction:column; gap:8px; max-height:190px; overflow-y:auto;">
    `;

    const invGoods = Object.keys(myPlayer.inventory).filter((k) => myPlayer.inventory[k] > 0);
    if (invGoods.length === 0) {
      html += `<div style="font-size:12.5px; color:var(--text-muted); text-align:center; padding:10px;">Kho của bạn đang trống! Hãy mở [Chợ Đầu Mối] để nhập hàng.</div>`;
    } else {
      invGoods.forEach((gId) => {
        const gDef = gameConstants.GOODS.find((g) => g.id === gId);
        if (!gDef) return;
        const maxQty = Number(myPlayer.inventory[gId]) || 0;
        const safeGId = escapeHtml(gId);
        html += `
          <div style="display:flex; justify-content:space-between; align-items:center; font-size:13px; border-bottom:1px solid rgba(255,255,255,0.06); padding:6px 0;">
            <span>${escapeHtml(gDef.icon)} <b>${escapeHtml(gDef.name)}</b> (Kho: ${maxQty})</span>
            <div style="display:flex; gap:6px;">
              <button class="btn-small" style="max-width:62px;" onclick="stockGood('${safeStallId}', '${safeGId}', 1)">Bày 1</button>
              <button class="btn-small" style="max-width:62px;" onclick="stockGood('${safeStallId}', '${safeGId}', 5)">Bày 5</button>
              <button class="btn-small" style="max-width:75px;" onclick="stockGood('${safeStallId}', '${safeGId}', ${maxQty})">Bày Hết</button>
            </div>
          </div>
        `;
      });
    }

    html += `</div>`;
  } else {
    html = `
      <div style="padding:14px; text-align:center;">
        <h4 style="color:var(--gold); font-size:16px; margin-bottom:4px;">Chủ sạp: ${safeOwner}</h4>
        <p style="font-size:13px; color:var(--text-muted); margin-bottom:14px;">Sạp Cấp ${Number(s.level) || 1} · Doanh thu: ${s.earnings.toLocaleString()}đ</p>
        <div style="text-align:left; background:rgba(0,0,0,0.35); border-radius:12px; padding:14px;">
          <div style="font-size:13.5px; font-weight:700; margin-bottom:8px;">Mặt hàng đang bán:</div>
    `;

    const goods = Object.keys(s.goods).filter((k) => s.goods[k] > 0);
    if (goods.length === 0) {
      html += `<p style="font-size:12.5px; color:var(--text-muted);">Sạp tạm thời hết hàng trưng bày.</p>`;
    } else {
      goods.forEach((gId) => {
        const gDef = gameConstants.GOODS.find((g) => g.id === gId);
        if (!gDef) return;
        html += `<div style="font-size:13px; margin:6px 0;">${escapeHtml(gDef.icon)} ${escapeHtml(gDef.name)} — Còn: <b>${Number(s.goods[gId]) || 0}</b> món (Giá: ${gDef.sell.toLocaleString()}đ)</div>`;
      });
    }

    html += `</div></div>`;
  }

  body.innerHTML = html;
}

function rentStall(stallId) {
  if (!socket) return;
  const input = document.getElementById('stall-custom-name');
  const customName = input ? input.value : "";
  socket.emit('rentStall', { stallId, customName }, (res) => {
    if (!res.ok) {
      showToast(res.error || 'Lỗi thuê sạp!');
      return;
    }
    playSound('fanfare');
    showToast('🏮 Chúc mừng bạn đã khai trương sạp hàng mới!');
    closeModal('modal-stall');
    // Tutorial 2.0 bước 1: nhận sạp xong
    if (window.EconomyUI && myPlayer.tutorialStep === 1 && !myPlayer.tutorialCompleted) {
      window.EconomyUI.advanceTutorialStep(1);
    }
  });
}

function stockGood(stallId, goodId, amount) {
  if (!socket) return;
  socket.emit('stockGood', { stallId, goodId, amount }, (res) => {
    if (!res.ok) {
      showToast(res.error || 'Lỗi bày hàng!');
      return;
    }
    playSound('click');
    showToast('Đã bày hàng lên mẹt tre!');
  });
}

// Bày toàn bộ hàng 1-chạm (ECONOMY 2.0: tutorial bước 2 + EXP)
function stockAllGoods(stallId) {
  if (!socket) return;
  socket.emit('stockAllGoods', { stallId }, (res) => {
    if (!res || !res.ok) {
      showToast((res && res.error) || 'Không có hàng để bày!');
      return;
    }
    if (res.inventory) myPlayer.inventory = res.inventory;
    if (res.quests) myPlayer.quests = res.quests;
    if (res.stall) {
      currentInteractingStall = res.stall;
      renderStallModalContent(res.stall);
    }
    if (typeof updateHUD === 'function') updateHUD();
    playSound('coin');
    showToast(`📦 Đã bày ${res.totalStocked} món hàng lên mẹt tre!`);
    // Tutorial 2.0 bước 2: bày hàng xong
    if (window.EconomyUI && myPlayer.tutorialStep === 2 && !myPlayer.tutorialCompleted) {
      window.EconomyUI.advanceTutorialStep(2);
    }
  });
}
window.stockAllGoods = stockAllGoods;

function withdrawGood(stallId, goodId, amount) {
  if (!socket) return;
  socket.emit('withdrawGood', { stallId, goodId, amount }, (res) => {
    if (!res.ok) {
      showToast(res.error || 'Lỗi rút hàng!');
      return;
    }
    playSound('click');
    showToast('Đã cất hàng về kho cá nhân!');
  });
}

function upgradeStall(stallId) {
  if (!socket) return;
  socket.emit('upgradeStall', { stallId }, (res) => {
    if (!res.ok) {
      showToast(res.error || 'Lỗi nâng cấp!');
      return;
    }
    playSound('fanfare');
    showToast(`⭐ Nâng cấp sạp thành công lên Cấp ${res.level}!`);
  });
}

function hireStaff(stallId) {
  if (!socket) return;
  socket.emit('hireStaff', { stallId }, (res) => {
    if (!res.ok) {
      showToast(res.error || 'Lỗi thuê phụ quán!');
      return;
    }
    playSound('fanfare');
    showToast('👒 Phụ quán đã đứng bán giúp bạn (+15% tiền tip)!');
  });
}

// 3. Gánh Lô Tô Hội Chợ
function openGachaModal() {
  openModal('modal-gacha');
}

function spinGachaNow() {
  if (!socket) return;
  socket.emit('spinGacha', {}, (res) => {
    const box = document.getElementById('gacha-result-box');
    if (!res || !res.ok) {
      showToast((res && res.error) || 'Không đủ tiền mua vé Lô Tô!');
      return;
    }
    if (res.money !== undefined) myPlayer.money = res.money;
    if (res.inventory) myPlayer.inventory = res.inventory;
    if (res.quests) myPlayer.quests = res.quests;
    updateHUD();
    playSound('fanfare');
    if (myPlayer.mesh) {
      triggerCoinParticles(myPlayer.pos.x, 1.0, myPlayer.pos.z);
      spawnFloatingPopup3D(myPlayer.pos.x, 2.5, myPlayer.pos.z, res.prizeTitle);
    }
    box.innerHTML = `
      <div style="font-size:15.5px; font-weight:800; color:var(--gold); margin-bottom:4px;">${escapeHtml(res.prizeTitle)}</div>
      <div style="font-size:12.5px; color:#e2e8f0;">${escapeHtml(res.prizeMessage)}</div>
    `;
    showToast(res.prizeTitle);
  });
}

// 4. Kho Hàng Cá Nhân
function openInventoryModal() {
  const container = document.getElementById('inventory-list');
  container.innerHTML = '';

  const invKeys = Object.keys(myPlayer.inventory).filter((k) => myPlayer.inventory[k] > 0);
  if (invKeys.length === 0) {
    container.innerHTML = `<div style="grid-column: 1 / -1; text-align:center; padding:24px; color:var(--text-muted)">Kho cá nhân đang trống.<br>Hãy mở [Chợ Đầu Mối] hoặc chơi [Lô Tô Hội Chợ] để nhận hàng nhé!</div>`;
  } else {
    invKeys.forEach((gId) => {
      const g = gameConstants.GOODS.find((x) => x.id === gId);
      if (!g) return;
      const qty = Number(myPlayer.inventory[gId]) || 0;
      const card = document.createElement('div');
      card.className = 'good-card tabular-nums';
      card.innerHTML = `
        <div class="good-card-header">
          <div class="good-icon">${escapeHtml(g.icon)}</div>
          <div class="good-info">
            <div class="good-name">${escapeHtml(g.name)}</div>
            <div class="good-cat">Số lượng: <b style="color:var(--gold); font-size:14px;">${qty}</b> món</div>
          </div>
        </div>
        <div class="good-prices">
          <span>Giá bán lẻ tiêu chuẩn:</span>
          <span class="sell">${g.sell.toLocaleString()}đ</span>
        </div>
      `;
      container.appendChild(card);
    });
  }

  openModal('modal-inventory');
}

// 5. Nhiệm Vụ (Quests)
function openQuestsModal() {
  const container = document.getElementById('quests-list');
  container.innerHTML = '';

  myPlayer.quests.forEach((q) => {
    const card = document.createElement('div');
    card.className = `quest-card tabular-nums ${q.completed ? 'completed' : ''}`;
    const percent = Math.min(100, Math.round((q.progress / q.target) * 100));
    const safeId = escapeHtml(q.id);

    card.innerHTML = `
      <div class="quest-info" style="flex:1;">
        <h4>${escapeHtml(q.title)} ${q.completed ? '✅' : ''}</h4>
        <p>${escapeHtml(q.description)}</p>
        <div class="quest-progress-bar">
          <div class="quest-progress-fill" style="width:${percent}%"></div>
        </div>
        <div style="font-size:11.5px; color:var(--text-muted); margin-top:5px;">
          Tiến độ: ${Number(q.progress) || 0}/${Number(q.target) || 1} · Thưởng: <b style="color:var(--gold)">+${Number(q.reward || 0).toLocaleString()}đ</b>
        </div>
      </div>
      <div>
        ${
          q.claimed
            ? `<span style="color:var(--mint); font-size:12.5px; font-weight:800;">Đã Nhận</span>`
            : q.completed
            ? `<button class="btn-action btn-gold" style="padding:7px 14px;" onclick="claimQuest('${safeId}')">Nhận Thưởng</button>`
            : `<button class="btn-action" style="padding:7px 14px; opacity:0.4;" disabled>Đang Làm</button>`
        }
      </div>
    `;
    container.appendChild(card);
  });

  openModal('modal-quests');
}

function claimQuest(questId) {
  if (!socket) return;
  socket.emit('claimQuest', { questId }, (res) => {
    if (!res.ok) {
      showToast(res.error || 'Lỗi nhận thưởng!');
      return;
    }
    playSound('fanfare');
    showToast(`🎉 Nhận thưởng nhiệm vụ +${res.reward.toLocaleString()}đ!`);
    openQuestsModal();
  });
}

// 6. Bảng Phú Hộ (Leaderboard)
function openLeaderboardModal() {
  const tbody = document.getElementById('leaderboard-tbody');
  tbody.innerHTML = '';

  worldState.leaderboard.forEach((r, idx) => {
    const tr = document.createElement('tr');
    const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`;
    tr.innerHTML = `
      <td>${medal}</td>
      <td>${escapeHtml(r.nickname)} ${r.nickname === myPlayer.nickname ? '(Bạn)' : ''}</td>
      <td style="text-align:right; color:var(--gold); font-weight:800;">${Number(r.money || 0).toLocaleString()}đ</td>
    `;
    tbody.appendChild(tr);
  });

  openModal('modal-leaderboard');
}

/* ==================== 7. SỚI BẦU CUA TÔM CÁ DÂN GIAN ==================== */
let selectedBcChip = 1000;
let myCurrentRoundBets = {};

function selectBcChip(amt) {
  selectedBcChip = amt;
  document.querySelectorAll('#modal-bau-cua .chip-btn').forEach((btn) => {
    const val = parseInt(btn.innerText.replace(/\D/g, ''));
    btn.classList.toggle('active', val === amt);
  });
}

function openBauCuaModal() {
  renderBauCuaBoard();
  openModal('modal-bau-cua');
}

function placeBauCuaBet(animalId) {
  if (!socket) return;
  if (myPlayer.money < selectedBcChip) {
    showToast(`Không đủ ${selectedBcChip.toLocaleString()}đ để đặt cược!`);
    return;
  }
  socket.emit('placeBauCuaBet', { animalId, amount: selectedBcChip }, (res) => {
    if (!res || !res.ok) {
      showToast((res && res.error) || 'Lỗi đặt cược Bầu Cua!');
      return;
    }
    playSound('buy');
    myCurrentRoundBets[animalId] = (myCurrentRoundBets[animalId] || 0) + selectedBcChip;
    myPlayer.money = res.money;
    updateHUD();
    renderBauCuaBoard();
    const names = { nai: 'Nai', bau: 'Bầu', ga: 'Gà', ca: 'Cá', cua: 'Cua', tom: 'Tôm' };
    showToast(`🎲 Đã đặt ${selectedBcChip.toLocaleString()}đ vào cửa [${names[animalId] || animalId}]!`);
  });
}

let bcRollingInterval = null;

function renderBauCuaBoard() {
  const bc = worldState.bauCua;
  if (!bc) return;

  const roundIdEl = document.getElementById('bc-round-id');
  const titleEl = document.getElementById('bc-round-title');
  const timerEl = document.getElementById('bc-timer-text') || document.getElementById('bc-timer');
  const statusEl = document.getElementById('bc-status-text') || document.getElementById('bc-status-badge');
  const diceBox = document.getElementById('bc-dice-result-box');
  const historyText = document.getElementById('bc-history-text');
  const myMoneyEl = document.getElementById('bc-my-money');
  const die1 = document.getElementById('bc-die-1');
  const die2 = document.getElementById('bc-die-2');
  const die3 = document.getElementById('bc-die-3');

  if (roundIdEl) roundIdEl.innerText = bc.roundId || 1;
  if (titleEl) titleEl.innerText = `🎲 BÀN CƯỢC BẦU CUA #${bc.roundId || 1}`;

  if (myMoneyEl && myPlayer) {
    myMoneyEl.innerText = `${(myPlayer.money || 0).toLocaleString()}đ`;
  }

  const animalMap = {
    nai: { icon: '🦌', name: 'Nai' },
    bau: { icon: '🎃', name: 'Bầu' },
    ga: { icon: '🐓', name: 'Gà' },
    ca: { icon: '🐟', name: 'Cá' },
    cua: { icon: '🦀', name: 'Cua' },
    tom: { icon: '🦐', name: 'Tôm' },
  };

  const rawTimer = bc.timer !== undefined ? bc.timer : 20;
  const secLeft = rawTimer > 60 ? Math.max(0, Math.ceil(rawTimer / 1000)) : Math.max(0, Math.ceil(rawTimer));

  if (bc.state === 'rolling') {
    if (statusEl) {
      statusEl.style.color = '#fb7185';
      statusEl.innerText = 'Đang lắc bát 🎲';
    }
    if (timerEl) timerEl.innerText = `${secLeft}s`;
    if (diceBox) {
      diceBox.innerHTML = '<span style="font-size:32px;">🎲 🎲 🎲</span><span style="font-size:13px; color:#fde68a;">Nhà cái đang lắc bát! Chờ mở bát...</span>';
    }
    [die1, die2, die3].forEach((d) => d && d.classList.add('rolling'));

    if (!bcRollingInterval) {
      const keys = Object.keys(animalMap);
      bcRollingInterval = setInterval(() => {
        [die1, die2, die3].forEach((d) => {
          if (d) {
            const randKey = keys[Math.floor(Math.random() * keys.length)];
            const item = animalMap[randKey];
            d.innerHTML = `${item.icon}<span style="font-size:10px">${item.name}</span>`;
          }
        });
      }, 120);
    }
    ['nai', 'bau', 'ga', 'ca', 'cua', 'tom'].forEach((a) => {
      const cell = document.getElementById(`bc-cell-${a}`);
      if (cell) cell.classList.remove('winner');
    });
  } else if (bc.state === 'result') {
    if (bcRollingInterval) {
      clearInterval(bcRollingInterval);
      bcRollingInterval = null;
    }
    [die1, die2, die3].forEach((d) => d && d.classList.remove('rolling'));

    if (statusEl) {
      statusEl.style.color = '#34d399';
      statusEl.innerText = 'Mở bát kết quả 🎉';
    }
    if (timerEl) timerEl.innerText = `${secLeft}s`;

    if (Array.isArray(bc.lastDice) && bc.lastDice.length === 3) {
      const diceElements = [die1, die2, die3];
      bc.lastDice.forEach((dKey, idx) => {
        const item = animalMap[dKey] || { icon: '🎲', name: dKey };
        if (diceElements[idx]) {
          diceElements[idx].innerHTML = `${item.icon}<span style="font-size:10px">${item.name}</span>`;
        }
      });
      if (diceBox) {
        const icons = bc.lastDice.map((d) => (animalMap[d] ? animalMap[d].icon : '🎲')).join(' ');
        const names = bc.lastDice.map((d) => (animalMap[d] ? animalMap[d].name : d)).join(' - ');
        diceBox.innerHTML = `<span style="font-size:36px; letter-spacing:8px;">${escapeHtml(icons)}</span><span style="font-size:13px; color:#fde68a;">Kết quả: ${escapeHtml(names)}</span>`;
      }

      ['nai', 'bau', 'ga', 'ca', 'cua', 'tom'].forEach((a) => {
        const cell = document.getElementById(`bc-cell-${a}`);
        if (cell) {
          if (bc.lastDice.includes(a)) {
            cell.classList.add('winner');
          } else {
            cell.classList.remove('winner');
          }
        }
      });
    }
  } else {
    if (bcRollingInterval) {
      clearInterval(bcRollingInterval);
      bcRollingInterval = null;
    }
    [die1, die2, die3].forEach((d) => d && d.classList.remove('rolling'));

    if (statusEl) {
      statusEl.style.color = '#fde68a';
      statusEl.innerText = 'Đang nhận cược ⏳';
    }
    if (timerEl) timerEl.innerText = `${secLeft}s`;
    if (diceBox) {
      diceBox.innerHTML = '<span style="font-size:16px;">🏮 Hãy chọn mệnh giá chip và chạm vào cửa cược may mắn!</span>';
    }

    ['nai', 'bau', 'ga', 'ca', 'cua', 'tom'].forEach((a) => {
      const cell = document.getElementById(`bc-cell-${a}`);
      if (cell) cell.classList.remove('winner');
    });

    if (Array.isArray(bc.lastDice) && bc.lastDice.length === 3) {
      const diceElements = [die1, die2, die3];
      bc.lastDice.forEach((dKey, idx) => {
        const item = animalMap[dKey] || { icon: '🎲', name: dKey };
        if (diceElements[idx]) {
          diceElements[idx].innerHTML = `${item.icon}<span style="font-size:10px">${item.name}</span>`;
        }
      });
    }
  }

  ['nai', 'bau', 'ga', 'ca', 'cua', 'tom'].forEach((a) => {
    const badge = document.getElementById(`bc-bet-${a}`);
    const cell = document.getElementById(`bc-cell-${a}`);
    const myBet = myCurrentRoundBets[a] || 0;
    if (badge) {
      badge.innerText = `${myBet.toLocaleString()}đ`;
      badge.style.color = myBet > 0 ? '#34d399' : 'var(--gold)';
    }
    if (cell) {
      cell.classList.toggle('active-bet', myBet > 0);
    }
  });

  if (historyText && Array.isArray(bc.history) && bc.history.length > 0) {
    historyText.innerText = bc.history
      .slice(0, 5)
      .map((round) => round.map((d) => (animalMap[d] ? animalMap[d].icon : '🎲')).join(' '))
      .join(' | ');
  }
}

/* ==================== 8. QUÁN TRÀ ĐÁ VỈA HÈ & HƯỚNG DƯƠNG ==================== */
function openTeaTableModal() {
  updateTeaTableUI();
  openModal('modal-tea-table');
}

function updateTeaTableUI() {
  const container = document.getElementById('tea-table-players-list');
  const sitBtn = document.getElementById('tea-sit-btn');
  const table = worldState.teaTable;

  if (container) {
    container.innerHTML = '';
    if (!table || !table.seatedPlayers || table.seatedPlayers.length === 0) {
      container.innerHTML = '<span class="chip-btn" style="opacity:0.75;">Chưa có ai ngồi, hãy là người mở hàng nhé!</span>';
    } else {
      table.seatedPlayers.forEach((nick) => {
        const isMe = nick === myPlayer.nickname;
        const chip = document.createElement('span');
        chip.className = `chip-btn ${isMe ? 'active' : ''}`;
        chip.innerText = `🪑 ${nick} ${isMe ? '(Bạn)' : ''}`;
        container.appendChild(chip);
      });
    }
  }

  if (sitBtn) {
    const isSeated = table && table.seatedPlayers && table.seatedPlayers.includes(myPlayer.nickname);
    if (isSeated) {
      sitBtn.style.background = 'linear-gradient(135deg, #ef4444, #f87171)';
      sitBtn.innerText = '🚶 ĐỨNG LÊN RỜI BÀN TRÀ ĐÁ';
    } else {
      sitBtn.style.background = 'linear-gradient(135deg, #0284c7, #38bdf8)';
      sitBtn.innerText = '🪑 NGỒI XUỐNG GHẾ NHỰA ĐỎ (+200đ Lộc Nước Chè)';
    }
  }
}

function toggleSitTeaTableNow() {
  if (!socket) return;
  socket.emit('toggleSitTeaTable', {}, (res) => {
    if (!res || !res.ok) {
      showToast((res && res.error) || 'Lỗi khi ngồi ghế trà đá!');
      return;
    }
    worldState.teaTable = res.table;
    if (res.money !== undefined) myPlayer.money = res.money;
    updateHUD();
    updateTeaTableUI();
    playSound('fanfare');
    if (res.seated) {
      showToast('🪑 Bạn đã ngồi vào ghế nhựa đỏ Song Long (+200đ lộc nước chè)!');
      if (myPlayer.mesh) {
        triggerCoinParticles(myPlayer.pos.x, 0.6, myPlayer.pos.z);
        spawnFloatingPopup3D(myPlayer.pos.x, 2.2, myPlayer.pos.z, '+200đ Nước Chè');
      }
    } else {
      showToast('🚶 Bạn đã đứng dậy tiếp tục dạo quanh chợ phố!');
    }
  });
}

function doAllTableCheer() {
  if (!socket) return;
  socket.emit('chat', { msg: '🍻 [Quán Trà Đá] 1, 2, 3 DÔ! Chúc toàn thể bà con thị trấn buôn may bán đắt, vạn sự hanh thông!', channel: 'town' });
  playSound('fanfare');
  showToast('🍻 Đã hô vang cụng ly trà đá cùng cả bàn!');
  closeModal('modal-tea-table');
}

/* ==================== 9. GIAO LƯU TIỂU THƯƠNG (PLAYER SOCIAL) ==================== */
let targetSocialNickname = '';
let selectedLixiAmount = 2000;

function openPlayerSocialModal(targetNick) {
  targetSocialNickname = targetNick;
  window.targetSocialNickname = targetNick;
  const nameEl = document.getElementById('social-target-name');
  const statusEl = document.getElementById('social-target-status');
  if (nameEl) nameEl.innerText = targetNick;
  if (statusEl) statusEl.innerText = `Tiểu thương phố chợ · Đang dạo quanh cùng bạn`;
  openModal('modal-player-interact');
}

function doPlayerAction(actionType) {
  if (!socket || !targetSocialNickname) return;
  socket.emit('interactPlayer', { targetNick: targetSocialNickname, actionType }, (res) => {
    if (!res || !res.ok) {
      showToast((res && res.error) || 'Lỗi tương tác!');
      return;
    }
    playSound('buy');
    showToast(`Đã gửi tương tác tới ${targetSocialNickname}!`);
    closeModal('modal-player-interact');
  });
}

function toggleLixiInput() {
  const panel = document.getElementById('social-lixi-panel');
  if (panel) {
    panel.style.display = panel.style.display === 'none' ? 'flex' : 'none';
  }
}

function selectLixiAmount(amt) {
  selectedLixiAmount = amt;
  const panel = document.getElementById('social-lixi-panel');
  if (panel) {
    panel.querySelectorAll('.chip-btn').forEach((btn) => {
      const val = parseInt(btn.innerText.replace(/\D/g, ''));
      btn.classList.toggle('active', val === amt);
    });
  }
}

function sendLixiNow() {
  if (!socket || !targetSocialNickname) return;
  const wishInput = document.getElementById('social-lixi-wish');
  const wish = (wishInput && wishInput.value.trim()) || 'Chúc bạn buôn may bán đắt, phát tài phát lộc!';

  socket.emit(
    'interactPlayer',
    {
      targetNick: targetSocialNickname,
      actionType: 'lixi',
      meta: { amount: selectedLixiAmount, wish },
    },
    (res) => {
      if (!res || !res.ok) {
        showToast((res && res.error) || 'Lỗi gửi lì xì!');
        return;
      }
      playSound('fanfare');
      if (myPlayer.mesh) {
        triggerCoinParticles(myPlayer.pos.x, 1.0, myPlayer.pos.z);
      }
      showToast(`🧧 Đã trao Bao Lì Xì ${selectedLixiAmount.toLocaleString()}đ cho ${targetSocialNickname}!`);
      closeModal('modal-player-interact');
    }
  );
}

/* ==================== 10. BẾN SÔNG CÂU CÁ THƯ GIÃN (FISHING) ==================== */
let isFishingActive = false;

function openFishingModal() {
  openModal('modal-fishing');
}

function startFishingCast() {
  if (isFishingActive || !socket) return;
  isFishingActive = true;
  const btn = document.getElementById('btn-cast-fishing');
  const icon = document.getElementById('fishing-anim-icon');
  const desc = document.getElementById('fishing-status-desc');
  const card = document.getElementById('fishing-result-card');

  if (btn) {
    btn.disabled = true;
    btn.innerText = '🌊 ĐANG THẢ CẦN RÌNH CÁ CẮN CÂU...';
  }
  if (icon) icon.innerText = '🎣 🌊';
  if (desc) desc.innerText = 'Dây cước giật giật... Một đàn cá sông đang bơi lại gần mồi câu!';
  if (card) {
    card.innerHTML = '<span style="color:#fde68a; font-size:14px; font-weight:700;">🌊 Mặt nước róc rách... Chuẩn bị giật cần! ⚡</span>';
  }

  playSound('click');

  setTimeout(() => {
    socket.emit('goFishing', {}, (res) => {
      isFishingActive = false;
      if (btn) {
        btn.disabled = false;
        btn.innerText = '🎣 QUĂNG CẦN CÂU CÁ TIẾP';
      }
      if (!res || !res.ok) {
        showToast((res && res.error) || 'Lỗi câu cá!');
        return;
      }

      if (res.money !== undefined) myPlayer.money = res.money;
      if (res.quests) myPlayer.quests = res.quests;
      updateHUD();

      playSound('fanfare');
      if (myPlayer.mesh) {
        triggerCoinParticles(myPlayer.pos.x, 1.0, myPlayer.pos.z);
        spawnFloatingPopup3D(myPlayer.pos.x, 2.5, myPlayer.pos.z, `+${res.fish.price.toLocaleString()}đ`);
      }

      if (icon) icon.innerText = res.fish.icon;
      if (desc) desc.innerText = `🎉 Giật cần xuất sắc! Bạn câu được ${res.fish.name}!`;
      if (card) {
        card.innerHTML = `
          <div style="font-size:38px; margin-bottom:4px;">${escapeHtml(res.fish.icon)}</div>
          <div style="font-size:16px; font-weight:800; color:var(--gold);">${escapeHtml(res.fish.name)}</div>
          <div style="font-size:12.5px; color:#38bdf8; margin:2px 0;">Phẩm cấp: <b>${escapeHtml(res.fish.rarity)}</b></div>
          <div style="font-size:14px; font-weight:800; color:var(--mint); margin-top:4px;">Bán tươi thu về: +${Number(res.fish.price || 0).toLocaleString()}đ</div>
        `;
      }
      showToast(`🎣 Câu được ${res.fish.name}: +${res.fish.price.toLocaleString()}đ!`);
    });
  }, 2200);
}

/* ==================== 11. BẢNG TIN SỰ KIỆN CỘNG ĐỒNG (USER-GENERATED ACTIVITIES) ==================== */
function openCommunityEventsModal() {
  renderCommunityEvents();
  openModal('modal-community-events');
}

function toggleCreateEventForm() {
  const panel = document.getElementById('create-event-panel');
  if (panel) {
    panel.style.display = panel.style.display === 'none' ? 'flex' : 'none';
  }
}

function renderCommunityEvents() {
  const container = document.getElementById('community-events-list');
  if (!container) return;
  container.innerHTML = '';

  const events = worldState.communityEvents || [
    {
      id: 'event-1',
      creator: 'Bác Ba Phi',
      title: '🏮 Hội Chợ Đêm & Bắn Pháo Hoa Mừng Lễ',
      desc: 'Tụ họp tại Đài Sen Trung Tâm, cùng ngắm pháo hoa rực rỡ và chia sẻ kinh nghiệm mở sạp!',
      location: 'Khu Chợ Trung Tâm',
      timeStr: 'Tối nay 20:00',
      participants: ['Bác Ba Phi', 'Chị Tư Trà Đá'],
    },
    {
      id: 'event-2',
      creator: 'Chú Bảy Câu Cá',
      title: '🎣 Giải Thi Câu Cá Bến Sông Miền Quê',
      desc: 'Ai câu được Cá Chép Vàng to nhất tại Bến Sông sẽ được nhận lì xì 5.000đ và thùng bia hơi!',
      location: 'Bến Sông Làng Quê',
      timeStr: 'Chiều nay 17:00',
      participants: ['Chú Bảy Câu Cá'],
    },
    {
      id: 'event-3',
      creator: 'Cô Tấm',
      title: '☕ Họp Mặt Trà Đá & Tiệc Nhậu Vỉa Hè',
      desc: 'Ngồi ghế nhựa đỏ, cắn hạt hướng dương, cùng cụng ly 1 2 3 DÔ rôm rả thị trấn!',
      location: 'Quán Trà Đá Vỉa Hè',
      timeStr: 'Tối nay 19:30',
      participants: ['Cô Tấm'],
    },
  ];

  events.forEach((ev) => {
    const isJoined = ev.participants && ev.participants.includes(myPlayer.nickname);
    const safeId = escapeHtml(ev.id);
    const card = document.createElement('div');
    card.className = 'community-event-card';
    card.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:8px;">
        <h4 style="color:var(--gold); font-size:14.5px; font-weight:800;">${escapeHtml(ev.title)}</h4>
        <span class="chip-btn" style="padding:3px 8px; font-size:11px; color:#38bdf8;">📍 ${escapeHtml(ev.location)}</span>
      </div>
      <p style="font-size:12.5px; color:#cbd5e1; margin:6px 0; line-height:1.45;">${escapeHtml(ev.desc)}</p>
      <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px; margin-top:6px; font-size:12px;">
        <span style="color:var(--text-muted);">🕒 ${escapeHtml(ev.timeStr)} · Khởi xướng: <b style="color:#fde68a;">${escapeHtml(ev.creator)}</b></span>
        <div style="display:flex; align-items:center; gap:8px;">
          <span style="color:#34d399; font-weight:700;">👥 ${ev.participants ? ev.participants.length : 1} người tham gia</span>
          ${
            isJoined
              ? '<span style="color:#38bdf8; font-weight:800; font-size:12px;">✅ Đã Đăng Ký</span>'
              : `<button class="btn-action btn-gold" style="padding:5px 12px; font-size:11.5px;" onclick="joinEventNow('${safeId}')">Tham Gia</button>`
          }
        </div>
      </div>
    `;
    container.appendChild(card);
  });
}

function submitNewCommunityEvent() {
  if (!socket) return;
  const title = (document.getElementById('event-input-title').value || '').trim();
  const timeStr = (document.getElementById('event-input-time').value || '').trim() || 'Tối nay';
  const location = (document.getElementById('event-input-loc').value || '').trim() || 'Khu Chợ Trung Tâm';
  const desc =
    (document.getElementById('event-input-desc').value || '').trim() ||
    'Cùng tham gia giao lưu vui nhộn tại thị trấn nhé!';

  if (!title) {
    showToast('Vui lòng nhập tên hoạt động!');
    return;
  }

  socket.emit('createCommunityEvent', { title, timeStr, location, desc }, (res) => {
    if (!res || !res.ok) {
      showToast((res && res.error) || 'Lỗi tạo hoạt động!');
      return;
    }
    playSound('fanfare');
    document.getElementById('event-input-title').value = '';
    document.getElementById('create-event-panel').style.display = 'none';
    worldState.communityEvents = res.events;
    renderCommunityEvents();
    showToast('📢 Hoạt động mới đã được đăng lên Bảng Tin Thị Trấn!');
  });
}

function joinEventNow(eventId) {
  if (!socket) return;
  socket.emit('joinCommunityEvent', { eventId }, (res) => {
    if (!res || !res.ok) {
      showToast((res && res.error) || 'Lỗi tham gia sự kiện!');
      return;
    }
    playSound('fanfare');
    worldState.communityEvents = res.events;
    renderCommunityEvents();
    showToast('🎉 Bạn đã đăng ký tham gia hoạt động thành công!');
  });
}

/* ==================== 12. TỦ ĐỒ TIỂU THƯƠNG 3D (CUSTOMIZATION) ==================== */
function openCustomizationModal() {
  openModal('modal-customization');
}

function selectCustomHat(hat) {
  myCustomization.hat = hat;
  document.querySelectorAll('#custom-hat-tabs .filter-tab').forEach((b) => b.classList.remove('active'));
  if (event && event.target) event.target.classList.add('active');
}

function selectCustomOutfit(outfit) {
  myCustomization.outfit = outfit;
  document.querySelectorAll('#custom-outfit-tabs .filter-tab').forEach((b) => b.classList.remove('active'));
  if (event && event.target) event.target.classList.add('active');
}

function selectCustomColor(col) {
  myCustomization.color = col;
  showToast('Đã chọn bảng màu trang phục!');
}

function applyCustomizationNow() {
  if (myPlayer.mesh && myPlayer.mesh.group) {
    scene.remove(myPlayer.mesh.group);
  }
  myPlayer.mesh = createCharacterMesh(myCustomization, myPlayer.nickname);
  myPlayer.mesh.group.position.set(myPlayer.pos.x, 0, myPlayer.pos.z);
  scene.add(myPlayer.mesh.group);

  if (socket) {
    socket.emit('updateCustomization', myCustomization);
  }
  playSound('fanfare');
  showToast('👤 Đã lưu diện mạo 3D mới vào hồ sơ tiểu thương!');
  closeModal('modal-customization');
}

/* ==================== 13. BẤT ĐỘNG SẢN, XÂY NHÀ & NỘI THẤT (HOUSING SYSTEM) ==================== */
let myHouseData = { level: 0, wall: '#fef08a', furniture: 'Sập Gụ Tủ Chè', tree: 'Hoa Mai Vàng', privacy: 'public', items: [] };
try {
  const savedHouse = localStorage.getItem('my_house_data');
  if (savedHouse) myHouseData = { ...myHouseData, ...JSON.parse(savedHouse) };
} catch (e) {}

function getHousingConfig() {
  return (window.GameConstants && window.GameConstants.HOUSING_CONFIG) || window.HOUSING_CONFIG || {
    plotCost: 10000,
    levels: [
      { level: 0, name: "Chưa Mua Đất", title: "Cư Dân Tự Do", cost: 0, desc: "Chưa sở hữu bất động sản tại thị trấn." },
      { level: 1, name: "Nhà Mái Lá Quê Hương", title: "Chủ Đất Sơ Cấp", cost: 15000, desc: "Khuôn viên đất riêng, nhà tre mái lá tranh mộc mạc, giàn mướp và chum nước." },
      { level: 2, name: "Nhà Gỗ Ba Gian", title: "Hộ Dân An Cư", cost: 35000, desc: "Cột gỗ lim chắc chắn, mái ngói âm dương đỏ au, hàng rào dâm bụt." },
      { level: 3, name: "Nhà Phố Cổ Hội An", title: "Gia Đình Khá Giả", cost: 80000, desc: "Tường vàng nghệ tây rực rỡ, lồng đèn ngũ sắc, giàn hoa giấy tím trước ban công." },
      { level: 4, name: "Biệt Thự Nhà Vườn", title: "Thương Gia Thành Đạt", cost: 180000, desc: "Sân gạch bát tràng thênh thang, hòn non bộ phong thủy, hồ cá koi và cổng tam quan." },
      { level: 5, name: "Dinh Thự Hoàng Gia", title: "Đại Phú Hộ Thị Trấn", cost: 380000, desc: "Mái đao thếp vàng lưỡng long chầu nguyệt, đèn lụa cung đình lộng lẫy tột đỉnh." }
    ],
    items: []
  };
}

function switchHouseTab(tabName) {
  const tabs = ['build', 'shop', 'decor', 'guestbook'];
  tabs.forEach(t => {
    const el = document.getElementById(`house-tab-${t}`);
    const btn = document.getElementById(`house-tab-btn-${t}`);
    if (el) el.style.display = t === tabName ? 'block' : 'none';
    if (btn) btn.classList.toggle('active', t === tabName);
  });

  if (tabName === 'build') renderHouseBuildTab();
  else if (tabName === 'shop') renderHouseShopTab();
  else if (tabName === 'decor') renderHouseDecorTab();
  else if (tabName === 'guestbook') renderHouseGuestbook();
}

function renderHouseBuildTab() {
  const card = document.getElementById('house-build-card');
  if (!card) return;

  const cfg = getHousingConfig();
  const hc = myPlayer.houseConfig || {};
  const currentLvl = hc.level || 0;
  const currentTier = (cfg.levels && cfg.levels[currentLvl]) || { name: 'Nhà Ở', title: 'Cư Dân', desc: '' };
  const items = Array.isArray(hc.items) ? hc.items : [];

  let comfortScore = 0;
  items.forEach(id => {
    const it = cfg.items && cfg.items.find(x => x.id === id);
    if (it) comfortScore += it.comfort || 10;
  });

  const nextLvl = currentLvl + 1;
  const nextTier = nextLvl <= 5 && cfg.levels ? cfg.levels[nextLvl] : null;
  const upgradeCost = nextLvl === 1 ? (cfg.plotCost || 10000) : (nextTier ? nextTier.cost : 0);

  const tierBadges = ['🏕️', '🛖', '🏠', '🏮', '🏡', '🏯'];

  let html = `
    <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:12px;">
      <div>
        <div style="display:flex; align-items:center; gap:8px;">
          <span style="font-size:32px;">${tierBadges[currentLvl] || '🏠'}</span>
          <div>
            <div style="font-size:16px; font-weight:800; color:var(--gold);">${currentTier.name}</div>
            <div style="font-size:12px; color:#38bdf8; font-weight:700;">Danh Hiệu: ${currentTier.title}</div>
          </div>
        </div>
      </div>
      <div style="text-align:right; background:rgba(255,255,255,0.06); padding:6px 12px; border-radius:10px;">
        <div style="font-size:11px; color:var(--text-muted);">Phong Thủy & Tiện Nghi</div>
        <div style="font-size:16px; font-weight:800; color:#4ade80;">✨ ${comfortScore} Điểm</div>
      </div>
    </div>

    <p style="font-size:12.5px; color:#e2e8f0; line-height:1.55; margin-bottom:12px; background:rgba(0,0,0,0.25); padding:10px; border-radius:8px;">
      ${currentTier.desc}
    </p>
  `;

  if (nextTier) {
    const canAfford = (myPlayer.money || 0) >= upgradeCost;
    html += `
      <div style="background:rgba(251,191,36,0.08); border:1px dashed var(--gold); border-radius:10px; padding:12px; margin-bottom:14px;">
        <div style="font-size:12px; color:var(--gold); font-weight:700; margin-bottom:4px;">
          ${nextLvl === 1 ? '📍 Đất Nền Khu Dân Cư Đang Mở Bán:' : '🔨 Nâng Cấp Tiếp Theo: ' + nextTier.name}
        </div>
        <div style="font-size:12px; color:#cbd5e1; margin-bottom:8px;">${nextTier.desc}</div>
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <span style="font-size:13px; font-weight:700; color:#fde68a;">Chi phí: ${upgradeCost.toLocaleString()}đ</span>
          <button class="btn-action btn-gold" style="padding:8px 16px; font-size:13px;" onclick="buyOrUpgradeHouseNow()" ${!canAfford ? 'style="opacity:0.6;"' : ''}>
            ${nextLvl === 1 ? '💰 MUA ĐẤT SỔ ĐỎ & DỰNG NHÀ' : '🔨 NÂNG CẤP NHÀ NGAY'}
          </button>
        </div>
      </div>
    `;
  } else {
    html += `
      <div style="background:rgba(34,197,94,0.15); border:1px solid #22c55e; border-radius:10px; padding:12px; text-align:center; color:#86efac; font-weight:700; font-size:13px; margin-bottom:12px;">
        👑 Bạn đã đạt cấp tột đỉnh: Dinh Thự Hoàng Gia! Uy thế lừng lẫy khắp chợ quê và sông nước!
      </div>
    `;
  }

  html += `
    <div style="font-size:11.5px; color:var(--text-muted); text-align:center;">
      💡 Tip: Kiếm tiền bằng cách bán hàng tại sạp, tâng cầu, câu cá, kéo co, thắng Bầu Cua để nâng cấp nhà và sắm nội ngoại thất!
    </div>
  `;

  card.innerHTML = html;
}

function buyOrUpgradeHouseNow() {
  initAudio();
  const cfg = getHousingConfig();
  const hc = myPlayer.houseConfig || {};
  const currentLvl = hc.level || 0;
  const nextLvl = currentLvl + 1;
  const upgradeCost = nextLvl === 1 ? (cfg.plotCost || 10000) : (cfg.levels && cfg.levels[nextLvl] ? cfg.levels[nextLvl].cost : 0);

  if ((myPlayer.money || 0) < upgradeCost) {
    showToast(`Bạn cần ${upgradeCost.toLocaleString()}đ để nâng cấp! Hãy buôn bán hoặc tham gia mini-game kiếm thêm tiền nhé!`);
    return;
  }

  if (socket && socket.connected) {
    socket.emit('buyOrUpgradeHouse', {}, (res) => {
      if (!res || !res.ok) {
        showToast((res && res.error) || 'Không thể nâng cấp nhà lúc này!');
        return;
      }
      if (res.money !== undefined) myPlayer.money = res.money;
      myPlayer.houseConfig = res.houseConfig;
      updateHUD();
      if (typeof window.updatePlayerHouse3D === 'function') {
        window.updatePlayerHouse3D(myPlayer.houseConfig.level || 0, myPlayer.houseConfig);
      }
      playSound('fanfare');
      showToast(res.message || '🎉 Nâng cấp nhà thành công!');
      renderHouseBuildTab();
    });
  } else {
    // Chế độ ngoại tuyến / Demo fallback
    myPlayer.money -= upgradeCost;
    if (!myPlayer.houseConfig) myPlayer.houseConfig = {};
    myPlayer.houseConfig.level = nextLvl;
    updateHUD();
    if (typeof window.updatePlayerHouse3D === 'function') {
      window.updatePlayerHouse3D(nextLvl, myPlayer.houseConfig);
    }
    playSound('fanfare');
    showToast(`🎉 Chúc mừng bạn đã nâng cấp nhà lên Cấp ${nextLvl}!`);
    renderHouseBuildTab();
  }
}

function renderHouseShopTab() {
  const grid = document.getElementById('house-items-grid');
  if (!grid) return;

  const cfg = getHousingConfig();
  const items = cfg.items || [];
  const hc = myPlayer.houseConfig || {};
  const ownedItems = Array.isArray(hc.items) ? hc.items : [];

  if (items.length === 0) {
    grid.innerHTML = '<div style="color:var(--text-muted); font-size:13px; padding:12px;">Đang tải danh mục hàng hóa...</div>';
    return;
  }

  grid.innerHTML = '';
  items.forEach(it => {
    const isOwned = ownedItems.includes(it.id);
    const card = document.createElement('div');
    card.className = 'good-card';
    card.style.cssText = 'padding:10px; background:rgba(255,255,255,0.04); border:1px solid rgba(251,191,36,0.25); border-radius:12px; display:flex; flex-direction:column; justify-content:space-between;';
    
    card.innerHTML = `
      <div>
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
          <span style="font-size:24px;">${it.icon || '📦'}</span>
          <span style="font-size:11px; background:rgba(34,197,94,0.15); color:#4ade80; padding:2px 6px; border-radius:6px; font-weight:700;">+${it.comfort} Phong Thủy</span>
        </div>
        <div style="font-size:13px; font-weight:700; color:var(--gold); margin-bottom:2px;">${escapeHtml(it.name)}</div>
        <div style="font-size:10.5px; color:#94a3b8; line-height:1.4; margin-bottom:6px;">${escapeHtml(it.desc)}</div>
      </div>
      <div>
        <div style="font-size:12px; font-weight:800; color:#fde68a; margin-bottom:6px;">💰 ${it.price.toLocaleString()}đ</div>
        ${isOwned 
          ? '<button class="chip-btn" style="width:100%; justify-content:center; opacity:0.6; cursor:default;" disabled>✔ Đã Sở Hữu</button>'
          : `<button class="btn-action btn-gold" style="width:100%; justify-content:center; padding:6px 0; font-size:12px;" onclick="buyHouseItemNow('${it.id}')">Mua Ngay</button>`
        }
      </div>
    `;
    grid.appendChild(card);
  });
}

function buyHouseItemNow(itemId) {
  initAudio();
  const cfg = getHousingConfig();
  const it = cfg.items && cfg.items.find(x => x.id === itemId);
  if (!it) return;

  if ((myPlayer.money || 0) < it.price) {
    showToast(`Bạn cần ${it.price.toLocaleString()}đ để sắm "${it.name}"!`);
    return;
  }

  if (socket && socket.connected) {
    socket.emit('buyHouseItem', { itemId }, (res) => {
      if (!res || !res.ok) {
        showToast((res && res.error) || 'Không thể mua vật phẩm lúc này!');
        return;
      }
      if (res.money !== undefined) myPlayer.money = res.money;
      myPlayer.houseConfig = res.houseConfig;
      updateHUD();
      if (typeof window.updatePlayerHouse3D === 'function') {
        window.updatePlayerHouse3D(myPlayer.houseConfig.level || 0, myPlayer.houseConfig);
      }
      playSound('buy');
      showToast(res.message || `Đã sắm thành công ${it.name}!`);
      renderHouseShopTab();
    });
  } else {
    // Offline demo fallback
    myPlayer.money -= it.price;
    if (!myPlayer.houseConfig) myPlayer.houseConfig = {};
    if (!Array.isArray(myPlayer.houseConfig.items)) myPlayer.houseConfig.items = [];
    myPlayer.houseConfig.items.push(itemId);
    updateHUD();
    if (typeof window.updatePlayerHouse3D === 'function') {
      window.updatePlayerHouse3D(myPlayer.houseConfig.level || 0, myPlayer.houseConfig);
    }
    playSound('buy');
    showToast(`Đã sắm thành công ${it.name}!`);
    renderHouseShopTab();
  }
}

function renderHouseDecorTab() {
  const hc = myPlayer.houseConfig || {};
  const priv = hc.privacy || 'public';
  ['public', 'friends', 'private'].forEach(p => {
    const btn = document.getElementById(`privacy-btn-${p}`);
    if (btn) btn.classList.toggle('active', p === priv);
  });
}

function renderHouseGuestbook() {
  const listEl = document.getElementById('house-guestbook-list');
  if (!listEl) return;
  const guestbook = (myPlayer.houseConfig && Array.isArray(myPlayer.houseConfig.guestbook))
    ? myPlayer.houseConfig.guestbook
    : [];
  if (guestbook.length === 0) {
    listEl.innerHTML = '<div style="font-size:12px; color:var(--text-muted);">Chưa có lời nhắn nào. Hãy mời bạn bè ghé nhà ghi lưu bút nhé!</div>';
    return;
  }
  listEl.innerHTML = '';
  guestbook.forEach((entry) => {
    const row = document.createElement('div');
    row.style.cssText = 'font-size:12px; background:rgba(255,255,255,0.05); border-radius:8px; padding:6px 8px;';
    row.innerHTML = `<b style="color:#fde68a;">${escapeHtml(entry.author || 'Bạn hiền')}:</b> ${escapeHtml(entry.note || entry.message || '')}`;
    listEl.appendChild(row);
  });
}

function openHouseModal() {
  switchHouseTab('build');
  openModal('modal-house');
  renderHouseTravelButtons();
}

// ECONOMY 2.0: "Về Nhà" & "Mời Bạn" — nhà mua xong phải thấy được và có khách tới chơi
function renderHouseTravelButtons() {
  const anchor = document.getElementById('house-travel-buttons');
  if (!anchor) return;
  const hasHouse = myPlayer.houseConfig && (myPlayer.houseConfig.level || 0) > 0;
  anchor.style.display = hasHouse ? 'flex' : 'none';
}

function teleportHome() {
  const hasHouse = myPlayer.houseConfig && (myPlayer.houseConfig.level || 0) > 0;
  if (!hasHouse) {
    showToast('🏠 Bạn chưa có nhà — mở tab Xây Nhà để mua đất xây nhà nhé!');
    return;
  }
  closeModal('modal-house');
  myPlayer.pos = { x: 48, z: 24 };
  myPlayer.ridingBus = false;
  if (socket) socket.emit('move', { pos: myPlayer.pos, rot: myPlayer.rot, teleportAllowed: true });
  if (typeof resetCameraToPlayer === 'function') resetCameraToPlayer();
  showToast('🏡 Đã về Khu Dân Cư Phố Mới — căn nhà của bạn ở ngay đây!');
}

function inviteFriendsHome() {
  const hasHouse = myPlayer.houseConfig && (myPlayer.houseConfig.level || 0) > 0;
  if (!hasHouse) {
    showToast('🏠 Bạn chưa có nhà — mua đất xây nhà trước đã nhé!');
    return;
  }
  if (!socket) return;
  socket.emit('chat_message', {
    msg: `🏡 ${myPlayer.nickname} mời cả phố ghé nhà mới ở Khu Dân Cư Phố Mới (phía Đông, gần Đấu Trường Đá Cầu)! Dùng Đi Tới → Khu Dân Cư để tới chơi!`,
    channel: 'town',
  }, () => {});
  showToast('📣 Đã mời cả thị trấn ghé nhà bạn chơi!');
}
window.teleportHome = teleportHome;
window.inviteFriendsHome = inviteFriendsHome;

function setHousePrivacy(privacy) {
  myHouseData.privacy = privacy;
  if (!myPlayer.houseConfig) myPlayer.houseConfig = {};
  myPlayer.houseConfig.privacy = privacy;
  renderHouseDecorTab();

  if (socket && socket.connected) {
    socket.emit('updateHouse', { privacy }, (res) => {
      if (res && res.ok) {
        myPlayer.houseConfig = res.houseConfig;
        showToast(`🏠 Đã cập nhật quyền mở cửa nhà: ${privacy}!`);
      }
    });
  } else {
    showToast(`🏠 Đã chuyển chế độ mở cửa: ${privacy}!`);
  }
}

function signHouseGuestbookNow() {
  const input = document.getElementById('house-guestbook-input');
  const message = (input && input.value.trim()) || '';
  if (!message) return;

  if (socket && socket.connected) {
    socket.emit('signHouseGuestbook', { ownerNick: myPlayer.nickname, message }, (res) => {
      if (!res || !res.ok) {
        showToast((res && res.error) || 'Không thể ghi sổ lưu bút!');
        return;
      }
      if (input) input.value = '';
      if (!myPlayer.houseConfig) myPlayer.houseConfig = { privacy: 'public', guestbook: [] };
      myPlayer.houseConfig.guestbook = res.guestbook || [];
      renderHouseGuestbook();
      playSound('fanfare');
      showToast('✍️ Đã ghi lời chúc vào Sổ Lưu Bút Nhà Riêng!');
    });
  } else {
    if (input) input.value = '';
    if (!myPlayer.houseConfig) myPlayer.houseConfig = { privacy: 'public', guestbook: [] };
    if (!Array.isArray(myPlayer.houseConfig.guestbook)) myPlayer.houseConfig.guestbook = [];
    myPlayer.houseConfig.guestbook.unshift({ author: myPlayer.nickname, message, time: Date.now() });
    renderHouseGuestbook();
    playSound('fanfare');
    showToast('✍️ Đã ghi lời chúc vào Sổ Lưu Bút Nhà Riêng!');
  }
}

function decorateHouse(part, val) {
  myHouseData[part] = val;
  if (!myPlayer.houseConfig) myPlayer.houseConfig = {};
  myPlayer.houseConfig[part] = val;
  try {
    localStorage.setItem('my_house_data', JSON.stringify(myHouseData));
  } catch (e) {}

  if (socket && socket.connected) {
    socket.emit('updateHouse', { [part]: val }, () => {});
  }
  if (typeof window.updatePlayerHouse3D === 'function') {
    window.updatePlayerHouse3D(myPlayer.houseConfig.level || 0, myPlayer.houseConfig);
  }
  playSound('buy');
  const partNames = { wall: 'Màu tường nhà', furniture: 'Bộ bàn ghế phòng khách', tree: 'Cảnh quan trước hiên', yard: 'Cảnh quan sân vườn' };
  showToast(`🏠 Đã trang trí [${partNames[part] || part}]: ${val}!`);
}

function inviteFriendsToHouse() {
  if (socket && socket.connected) {
    socket.emit(
      'chat',
      `🏡 [Lời Mời Ghé Nhà] Mời bà con cô bác thị trấn ghé thăm Nhà của tôi tại Phố Dân Cư uống trà và ngắm cảnh nhé!`
    );
  }
  playSound('fanfare');
  showToast('Đã gửi lời mời ghé nhà đến toàn thị trấn!');
  closeModal('modal-house');
}

/* ==================== 14. ĐÁ CẦU KIỂNG TẬP THỂ & KẾT BẠN TRI KỶ ==================== */
function kickShuttlecockNow() {
  initAudio();
  if (!socket) return;
  socket.emit('kickShuttlecock', {}, (res) => {
    if (!res || !res.ok) {
      showToast((res && res.error) || 'Hãy lại gần Sân Đá Cầu để tâng cầu!');
      return;
    }
    if (res.money !== undefined) myPlayer.money = res.money;
    updateHUD();
    if (myPlayer.mesh) {
      myPlayer.danceTimer = 0.65;
      triggerCoinParticles(myPlayer.pos.x, 0.9, myPlayer.pos.z);
      spawnFloatingPopup3D(myPlayer.pos.x, 2.3, myPlayer.pos.z, `+${res.reward}đ Đá Cầu`);
    }
    showToast(`🪶 Tâng cầu kiểng Combo x${res.combo} (+${res.reward}đ)!`);
  });
}

function addFriendNow() {
  if (!socket || !targetSocialNickname) return;
  socket.emit('addFriend', { targetNick: targetSocialNickname }, (res) => {
    if (!res || !res.ok) {
      showToast((res && res.error) || 'Lỗi kết bạn!');
      return;
    }
    myPlayer.friends = res.friends || [];
    if (res.money !== undefined) myPlayer.money = res.money;
    updateHUD();
    playSound('fanfare');
    showToast(`👫 Đã kết bạn tri kỷ với ${targetSocialNickname} (+300đ Lộc)!`);
    closeModal('modal-player-interact');
  });
}

function addFriendByInput() {
  const input = document.getElementById('friend-add-input');
  const targetNick = (input && input.value.trim()) || '';
  if (!targetNick || !socket) {
    showToast('Vui lòng nhập tên tiểu thương muốn kết bạn!');
    return;
  }
  socket.emit('addFriend', { targetNick }, (res) => {
    if (!res || !res.ok) {
      showToast((res && res.error) || 'Không thể kết bạn!');
      return;
    }
    if (input) input.value = '';
    myPlayer.friends = res.friends || [];
    if (res.money !== undefined) myPlayer.money = res.money;
    updateHUD();
    playSound('fanfare');
    showToast(`👫 Đã kết bạn với ${targetNick} (+300đ Lộc)!`);
    renderFriendsList();
  });
}

function openFriendsModal() {
  openModal('modal-friends');
  renderFriendsList();
}

function renderFriendsList() {
  const container = document.getElementById('friends-list-container');
  if (!container) return;
  if (!socket) {
    container.innerHTML = '<div style="text-align:center; padding:16px; color:var(--text-muted);">Hãy vào chợ để xem danh sách bạn bè!</div>';
    return;
  }
  socket.emit('getFriends', {}, (res) => {
    container.innerHTML = '';
    const list = (res && res.friends) || [];
    if (list.length === 0) {
      container.innerHTML = `
        <div style="text-align:center; padding:18px; background:rgba(255,255,255,0.04); border-radius:12px; color:var(--text-muted); font-size:13px;">
          Bạn chưa có người bạn nào trong danh sách. Hãy chạm vào người chơi trên phố hoặc nhập tên ở trên để kết bạn nhận <b>+300đ Lộc</b> nhé!
        </div>
      `;
      return;
    }
    list.forEach((f) => {
      const card = document.createElement('div');
      card.className = 'community-event-card';
      card.style.display = 'flex';
      card.style.justifyContent = 'space-between';
      card.style.alignItems = 'center';

      const infoDiv = document.createElement('div');
      infoDiv.innerHTML = `
        <div style="font-size:14.5px; font-weight:800; color:${f.online ? '#38bdf8' : '#94a3b8'};">
          ${f.online ? '🟢' : '⚪'} ${escapeHtml(f.nickname)}
        </div>
        <div style="font-size:12px; color:var(--text-muted); margin-top:2px;">
          📍 ${escapeHtml(f.zone || 'Phố Chợ')}
        </div>
      `;
      card.appendChild(infoDiv);

      const actionDiv = document.createElement('div');
      if (f.online && f.pos) {
        const btn = document.createElement('button');
        btn.className = 'btn-action btn-gold';
        btn.style.cssText = 'padding:6px 12px; font-size:12px;';
        btn.textContent = '🏃 Chạy Tới Gặp';
        btn.onclick = () => walkToFriend(Number(f.pos.x) || 0, Number(f.pos.z) || 0, f.nickname);
        actionDiv.appendChild(btn);
      } else {
        actionDiv.innerHTML = `<span style="font-size:11.5px; color:var(--text-muted);">Đang vắng mặt</span>`;
      }
      card.appendChild(actionDiv);

      container.appendChild(card);
    });
  });
}

function walkToFriend(x, z, nick) {
  autoWalkTarget = { x, z };
  if (tapTargetMarker) {
    tapTargetMarker.position.set(x, 0.06, z);
    tapTargetMarker.visible = true;
  }
  closeModal('modal-friends');
  closeModal('modal-goto');
  closeModal('modal-full-menu');
  showToast(`🏃 Đang chạy tới ${nick || 'điểm hẹn'}!`);
}
window.walkToFriend = walkToFriend;

/* ==================== 15. NGÂN HÀNG, ĐẠI LÝ VÉ SỐ & TIỆM ĐỘ XE ==================== */
let currentBankSavings = 0;

function openBankModal() {
  initAudio();
  const walletEl = document.getElementById('bank-wallet-val');
  const savingsEl = document.getElementById('bank-savings-val');
  const noticeEl = document.getElementById('bank-interest-notice');
  const inputEl = document.getElementById('bank-amount-input');
  if (inputEl) inputEl.value = '';

  if (walletEl) walletEl.innerText = `${(myPlayer.money || 0).toLocaleString()}đ`;

  if (socket && socket.connected) {
    socket.emit('getBankInfo', {}, (res) => {
      if (!res || !res.ok) return;
      const money = res.walletMoney !== undefined ? res.walletMoney : res.money;
      if (money !== undefined) {
        myPlayer.money = money;
        updateHUD();
      }
      if (res.bankSavings !== undefined) {
        currentBankSavings = res.bankSavings;
      } else if (res.bank) {
        myPlayer.bank = res.bank;
        currentBankSavings = res.bank.savings || 0;
      }
      if (walletEl) walletEl.innerText = `${(myPlayer.money || 0).toLocaleString()}đ`;
      if (savingsEl) savingsEl.innerText = `${currentBankSavings.toLocaleString()}đ`;
      if (noticeEl) {
        const intEarned = res.interestGained || res.interestEarned;
        if (intEarned && intEarned > 0) {
          noticeEl.style.display = 'block';
          noticeEl.innerText = `🎉 Két tiền của bạn vừa sinh lời: +${intEarned.toLocaleString()}đ tiền lãi ngày mới!`;
        } else {
          noticeEl.style.display = 'none';
        }
      }
    });
  } else {
    currentBankSavings = (myPlayer.bank && myPlayer.bank.savings) || 0;
    if (savingsEl) savingsEl.innerText = `${currentBankSavings.toLocaleString()}đ`;
    if (noticeEl) noticeEl.style.display = 'none';
  }

  openModal('modal-bank');
}

function setBankAmount(type) {
  const inputEl = document.getElementById('bank-amount-input');
  if (!inputEl) return;
  if (type === 'all_wallet') {
    inputEl.value = myPlayer.money || 0;
  } else if (type === 'all_savings') {
    inputEl.value = currentBankSavings || (myPlayer.bank && myPlayer.bank.savings) || 0;
  }
}

function depositBankNow() {
  initAudio();
  const inputEl = document.getElementById('bank-amount-input');
  const amt = parseInt(inputEl ? inputEl.value : 0, 10);
  if (isNaN(amt) || amt <= 0) {
    showToast('Vui lòng nhập số tiền hợp lệ cần gửi tiết kiệm!');
    return;
  }
  if ((myPlayer.money || 0) < amt) {
    showToast('Số dư ví không đủ để gửi số tiền này!');
    return;
  }

  if (socket && socket.connected) {
    socket.emit('depositBank', { amount: amt }, (res) => {
      if (!res || !res.ok) {
        showToast((res && res.error) || 'Lỗi gửi tiền vào két!');
        return;
      }
      const money = res.walletMoney !== undefined ? res.walletMoney : res.money;
      if (money !== undefined) myPlayer.money = money;
      if (res.bankSavings !== undefined) {
        currentBankSavings = res.bankSavings;
      } else if (res.bank) {
        myPlayer.bank = res.bank;
        currentBankSavings = res.bank.savings || 0;
      }
      updateHUD();
      playSound('buy');
      showToast(`💰 Đã gửi ${amt.toLocaleString()}đ vào két an toàn (Lãi 5%/ngày)!`);
      openBankModal();
    });
  } else {
    myPlayer.money -= amt;
    if (!myPlayer.bank) myPlayer.bank = { savings: 0, lastInterestDay: 1 };
    myPlayer.bank.savings += amt;
    currentBankSavings = myPlayer.bank.savings;
    updateHUD();
    playSound('buy');
    showToast(`💰 Đã gửi ${amt.toLocaleString()}đ vào két an toàn!`);
    openBankModal();
  }
}

function withdrawBankNow() {
  initAudio();
  const inputEl = document.getElementById('bank-amount-input');
  const amt = parseInt(inputEl ? inputEl.value : 0, 10);
  if (isNaN(amt) || amt <= 0) {
    showToast('Vui lòng nhập số tiền cần rút!');
    return;
  }
  if (currentBankSavings < amt) {
    showToast('Số dư trong két không đủ để rút!');
    return;
  }

  if (socket && socket.connected) {
    socket.emit('withdrawBank', { amount: amt }, (res) => {
      if (!res || !res.ok) {
        showToast((res && res.error) || 'Lỗi rút tiền!');
        return;
      }
      const money = res.walletMoney !== undefined ? res.walletMoney : res.money;
      if (money !== undefined) myPlayer.money = money;
      if (res.bankSavings !== undefined) {
        currentBankSavings = res.bankSavings;
      } else if (res.bank) {
        myPlayer.bank = res.bank;
        currentBankSavings = res.bank.savings || 0;
      }
      updateHUD();
      playSound('buy');
      showToast(`📤 Đã rút ${amt.toLocaleString()}đ về ví tiền mặt!`);
      openBankModal();
    });
  } else {
    myPlayer.money += amt;
    myPlayer.bank.savings -= amt;
    currentBankSavings = myPlayer.bank.savings;
    updateHUD();
    playSound('buy');
    showToast(`📤 Đã rút ${amt.toLocaleString()}đ về ví tiền mặt!`);
    openBankModal();
  }
}

function openLotteryModal() {
  initAudio();
  renderLotteryTicketsList();
  openModal('modal-lottery');
}

function switchLotteryTab(tab) {
  const btnScratch = document.getElementById('lottery-tab-btn-scratch');
  const btnTicket = document.getElementById('lottery-tab-btn-ticket');
  const secScratch = document.getElementById('lottery-tab-scratch');
  const secTicket = document.getElementById('lottery-tab-ticket');

  if (tab === 'scratch') {
    if (btnScratch) btnScratch.classList.add('active');
    if (btnTicket) btnTicket.classList.remove('active');
    if (secScratch) secScratch.style.display = 'block';
    if (secTicket) secTicket.style.display = 'none';
  } else {
    if (btnScratch) btnScratch.classList.remove('active');
    if (btnTicket) btnTicket.classList.add('active');
    if (secScratch) secScratch.style.display = 'none';
    if (secTicket) secTicket.style.display = 'block';
    renderLotteryTicketsList();
  }
}

function renderLotteryTicketsList() {
  const container = document.getElementById('lottery-tickets-list');
  if (!container) return;
  const tickets = (myPlayer && myPlayer.lotteryTickets) || [];
  if (tickets.length === 0) {
    container.innerHTML = '<span style="font-size:11.5px; color:var(--text-muted);">Chưa có vé nào. Hãy mua ngay 1 tờ cầu may!</span>';
    return;
  }
  container.innerHTML = tickets.map((t) => {
    const num = typeof t === 'object' ? (t.ticket || t.number || JSON.stringify(t)) : t;
    return `
      <div style="background:rgba(251,191,36,0.15); border:1px solid #fbbf24; border-radius:8px; padding:4px 10px; font-weight:800; font-family:monospace; color:#fef08a; font-size:13px;">
        🎟️ ${escapeHtml(num)}
      </div>
    `;
  }).join('');
}

function playScratchCardNow() {
  initAudio();
  if ((myPlayer.money || 0) < 2000) {
    showToast('Bạn cần tối thiểu 2.000đ để cào thẻ may mắn!');
    return;
  }

  const s1 = document.getElementById('scratch-slot-1');
  const s2 = document.getElementById('scratch-slot-2');
  const s3 = document.getElementById('scratch-slot-3');
  const banner = document.getElementById('scratch-result-banner');

  if (s1) { s1.innerText = '❓'; s1.classList.remove('revealed'); }
  if (s2) { s2.innerText = '❓'; s2.classList.remove('revealed'); }
  if (s3) { s3.innerText = '❓'; s3.classList.remove('revealed'); }
  if (banner) { banner.style.display = 'none'; }

  if (socket && socket.connected) {
    socket.emit('playScratchCard', {}, (res) => {
      if (!res || !res.ok) {
        showToast((res && res.error) || 'Lỗi khi cào vé!');
        return;
      }
      const money = res.walletMoney !== undefined ? res.walletMoney : res.money;
      if (money !== undefined) myPlayer.money = money;
      updateHUD();
      const iconMap = { lotus: '🪷', gold: '💰', crab: '🦀', fish: '🐟', gourd: '🏮' };
      const rawSlots = res.symbols || res.slots || [];
      const slots = rawSlots.map((s) => iconMap[s] || s);
      const prize = res.reward !== undefined ? res.reward : (res.prize || 0);
      const prizeName = res.prizeName || res.name || 'Thẻ Cào May Mắn';
      revealScratchOutcome(slots, prize, prizeName, res.message);
    });
  } else {
    myPlayer.money -= 2000;
    const pool = ['🪷', '💰', '🦀', '⭐', '🧧'];
    const rSlots = [pool[Math.floor(Math.random() * pool.length)], pool[Math.floor(Math.random() * pool.length)], pool[Math.floor(Math.random() * pool.length)]];
    let prize = 0;
    let name = 'Chúc bạn may mắn lần sau!';
    if (rSlots[0] === rSlots[1] && rSlots[1] === rSlots[2]) {
      if (rSlots[0] === '🪷') { prize = 50000; name = 'Giải Đặc Biệt Hoa Sen Vàng'; }
      else if (rSlots[0] === '💰') { prize = 20000; name = 'Giải Nhất Thỏi Vàng'; }
      else if (rSlots[0] === '🦀') { prize = 8000; name = 'Giải Nhì Con Cua'; }
      else { prize = 5000; name = 'Giải Ba'; }
    } else if (rSlots[0] === rSlots[1] || rSlots[1] === rSlots[2] || rSlots[0] === rSlots[2]) {
      prize = 3000;
      name = 'Giải Khuyến Khích';
    } else {
      prize = 1000;
      name = 'Lộc An Ủi';
    }
    myPlayer.money += prize;
    updateHUD();
    revealScratchOutcome(rSlots, prize, name, prize > 0 ? `Chúc mừng bạn trúng ${name}!` : 'Chúc bạn may mắn lần sau!');
  }
}

function revealScratchOutcome(slots, prize, name, message) {
  const s1 = document.getElementById('scratch-slot-1');
  const s2 = document.getElementById('scratch-slot-2');
  const s3 = document.getElementById('scratch-slot-3');
  const banner = document.getElementById('scratch-result-banner');

  setTimeout(() => { if (s1 && slots[0]) { s1.innerText = slots[0]; s1.classList.add('revealed'); playSound('hit'); } }, 150);
  setTimeout(() => { if (s2 && slots[1]) { s2.innerText = slots[1]; s2.classList.add('revealed'); playSound('hit'); } }, 450);
  setTimeout(() => {
    if (s3 && slots[2]) { s3.innerText = slots[2]; s3.classList.add('revealed'); }
    if (prize > 0) {
      playSound('fanfare');
      if (myPlayer.mesh) {
        triggerCoinParticles(myPlayer.pos.x, 1.2, myPlayer.pos.z);
        spawnFloatingPopup3D(myPlayer.pos.x, 2.3, myPlayer.pos.z, `+${prize}đ Thẻ Cào`);
      }
    } else {
      playSound('hit');
    }
    if (banner) {
      banner.style.display = 'block';
      banner.style.background = prize >= 8000 ? 'rgba(34,197,94,0.2)' : 'rgba(234,179,8,0.2)';
      banner.style.color = prize >= 8000 ? '#4ade80' : '#fef08a';
      banner.innerText = `🎉 ${name} (+${prize.toLocaleString()}đ)!`;
    }
    showToast(`✨ ${message || name} (+${prize.toLocaleString()}đ)!`);
  }, 750);
}

function buyLotteryTicketNow() {
  initAudio();
  if ((myPlayer.money || 0) < 1000) {
    showToast('Bạn cần 1.000đ để mua 1 tờ vé số kiến thiết!');
    return;
  }

  if (socket && socket.connected) {
    socket.emit('buyLotteryTicket', {}, (res) => {
      if (!res || !res.ok) {
        showToast((res && res.error) || 'Lỗi khi mua vé số!');
        return;
      }
      const money = res.walletMoney !== undefined ? res.walletMoney : res.money;
      if (money !== undefined) myPlayer.money = money;
      if (res.tickets) myPlayer.lotteryTickets = res.tickets;
      else if (res.ticketNumber) {
        if (!myPlayer.lotteryTickets) myPlayer.lotteryTickets = [];
        myPlayer.lotteryTickets.push({ number: res.ticketNumber });
      } else if (res.ticket) {
        if (!myPlayer.lotteryTickets) myPlayer.lotteryTickets = [];
        myPlayer.lotteryTickets.push(res.ticket);
      }
      updateHUD();
      playSound('buy');
      renderLotteryTicketsList();
      const numStr = res.ticketNumber || (res.ticket && res.ticket.number) || 'May Mắn';
      showToast(`🎟️ Đã mua vé số [${numStr}]! Chúc bạn rinh Jackpot 100.000đ!`);
    });
  } else {
    myPlayer.money -= 1000;
    const num = String(Math.floor(100000 + Math.random() * 900000));
    if (!myPlayer.lotteryTickets) myPlayer.lotteryTickets = [];
    myPlayer.lotteryTickets.push({ number: num, boughtDay: 1 });
    updateHUD();
    playSound('buy');
    renderLotteryTicketsList();
    showToast(`🎟️ Đã mua vé số [${num}]!`);
  }
}

function openGarageModal() {
  initAudio();
  const speedBtn = document.getElementById('garage-upgrade-speed-btn');
  if (speedBtn) {
    if (myPlayer.motorbikeUpgrade && myPlayer.motorbikeUpgrade.speed) {
      speedBtn.innerText = '✓ Đã Nâng Cấp Tối Đa (25m/s)';
      speedBtn.disabled = true;
      speedBtn.classList.remove('btn-gold');
    } else {
      speedBtn.innerText = '⚡ Nâng Cấp (8.000đ)';
      speedBtn.disabled = false;
      speedBtn.classList.add('btn-gold');
    }
  }
  openModal('modal-garage');
}

function upgradeBikeNow(type, color) {
  initAudio();
  const cost = type === 'speed' ? 8000 : 2000;
  if ((myPlayer.money || 0) < cost) {
    showToast(`Bạn cần tối thiểu ${cost.toLocaleString()}đ để nâng cấp xe máy!`);
    return;
  }

  if (socket && socket.connected) {
    socket.emit('upgradeMotorbike', { upgradeType: type, color }, (res) => {
      if (!res || !res.ok) {
        showToast((res && res.error) || 'Lỗi nâng cấp xe!');
        return;
      }
      if (res.money !== undefined) myPlayer.money = res.money;
      if (res.motorbikeUpgrade) myPlayer.motorbikeUpgrade = res.motorbikeUpgrade;
      updateHUD();
      playSound('fanfare');
      showToast(res.message || '🛵 Đã nâng cấp xe thành công!');
      openGarageModal();
    });
  } else {
    myPlayer.money -= cost;
    if (!myPlayer.motorbikeUpgrade) myPlayer.motorbikeUpgrade = {};
    if (type === 'speed') myPlayer.motorbikeUpgrade.speed = 25.0;
    if (color) myPlayer.motorbikeUpgrade.color = color;
    updateHUD();
    playSound('fanfare');
    showToast('🛵 Đã nâng cấp xe thành công!');
    openGarageModal();
  }
}

function buyEnergyDrinkNow() {
  initAudio();
  if ((myPlayer.money || 0) < 500) {
    showToast('Bạn cần 500đ để mua 1 ly Nước Sâm Bí Đao!');
    return;
  }

  if (socket && socket.connected) {
    socket.emit('buyEnergyDrink', {}, (res) => {
      if (!res || !res.ok) {
        showToast((res && res.error) || 'Lỗi mua nước sâm!');
        return;
      }
      if (res.money !== undefined) myPlayer.money = res.money;
      myPlayer.energyDrinkUntil = res.energyDrinkUntil || (Date.now() + 180000);
      updateHUD();
      playSound('buy');
      showToast(res.message || '🥤 Đã uống Nước Sâm Bí Đao! Tốc độ chạy +40% trong 180s!');
      closeModal('modal-garage');
    });
  } else {
    myPlayer.money -= 500;
    myPlayer.energyDrinkUntil = Date.now() + 180000;
    updateHUD();
    playSound('buy');
    showToast('🥤 Đã uống Nước Sâm Bí Đao! Tốc độ chạy +40% trong 180s!');
    closeModal('modal-garage');
  }
}

window.openBankModal = openBankModal;
window.setBankAmount = setBankAmount;
window.depositBankNow = depositBankNow;
window.withdrawBankNow = withdrawBankNow;
window.openLotteryModal = openLotteryModal;
window.switchLotteryTab = switchLotteryTab;
window.playScratchCardNow = playScratchCardNow;
window.buyLotteryTicketNow = buyLotteryTicketNow;
window.openGarageModal = openGarageModal;
window.upgradeBikeNow = upgradeBikeNow;
window.buyEnergyDrinkNow = buyEnergyDrinkNow;

window.openModal = openModal;
window.closeModal = closeModal;
window.openWholesaleModal = openWholesaleModal;
window.buyWholesale = buyWholesale;
window.interactNearest = interactNearest;
window.openMyStallOrNearest = openMyStallOrNearest;
window.renderStallModalContent = renderStallModalContent;
window.rentStall = rentStall;
window.stockGood = stockGood;
window.withdrawGood = withdrawGood;
window.upgradeStall = upgradeStall;
window.hireStaff = hireStaff;
window.openGachaModal = openGachaModal;
window.spinGachaNow = spinGachaNow;
window.openInventoryModal = openInventoryModal;
window.openQuestsModal = openQuestsModal;
window.claimQuest = claimQuest;
window.openLeaderboardModal = openLeaderboardModal;
window.selectBcChip = selectBcChip;
window.openBauCuaModal = openBauCuaModal;
window.placeBauCuaBet = placeBauCuaBet;
window.renderBauCuaBoard = renderBauCuaBoard;
window.openTeaTableModal = openTeaTableModal;
window.updateTeaTableUI = updateTeaTableUI;
window.toggleSitTeaTableNow = toggleSitTeaTableNow;
window.doAllTableCheer = doAllTableCheer;
window.openPlayerSocialModal = openPlayerSocialModal;
window.doPlayerAction = doPlayerAction;
window.toggleLixiInput = toggleLixiInput;
window.selectLixiAmount = selectLixiAmount;
window.sendLixiNow = sendLixiNow;
window.openFishingModal = openFishingModal;
window.startFishingCast = startFishingCast;
window.openCommunityEventsModal = openCommunityEventsModal;
window.toggleCreateEventForm = toggleCreateEventForm;
window.renderCommunityEvents = renderCommunityEvents;
window.submitNewCommunityEvent = submitNewCommunityEvent;
window.joinEventNow = joinEventNow;
window.openCustomizationModal = openCustomizationModal;
window.selectCustomHat = selectCustomHat;
window.selectCustomOutfit = selectCustomOutfit;
window.selectCustomColor = selectCustomColor;
window.applyCustomizationNow = applyCustomizationNow;
window.getHousingConfig = getHousingConfig;
window.switchHouseTab = switchHouseTab;
window.renderHouseBuildTab = renderHouseBuildTab;
window.buyOrUpgradeHouseNow = buyOrUpgradeHouseNow;
window.renderHouseShopTab = renderHouseShopTab;
window.buyHouseItemNow = buyHouseItemNow;
window.renderHouseDecorTab = renderHouseDecorTab;
window.renderHouseGuestbook = renderHouseGuestbook;
window.openHouseModal = openHouseModal;
window.setHousePrivacy = setHousePrivacy;
window.signHouseGuestbookNow = signHouseGuestbookNow;
window.decorateHouse = decorateHouse;
window.inviteFriendsToHouse = inviteFriendsToHouse;
window.kickShuttlecockNow = kickShuttlecockNow;
window.addFriendNow = addFriendNow;
window.addFriendByInput = addFriendByInput;
window.openFriendsModal = openFriendsModal;
window.renderFriendsList = renderFriendsList;
window.walkToFriend = walkToFriend;
window.openFullAppMenuModal = () => openModal('modal-full-menu');
window.openProfileModal = () => openModal('modal-profile');
window.showToast = showToast;
window.updateHUD = updateHUD;
window.escapeHtml = escapeHtml;
window.joinGame = joinGame;
window.sendChat = sendChat;
window.sendEmote = sendEmote;
window.toggleChat = toggleChat;
window.toggleChatChannel = toggleChatChannel;

/* ==================== KHỞI ĐỘNG ỨNG DỤNG ==================== */
const savedNick = localStorage.getItem('last_nickname');
const nickInputEl = document.getElementById('nickname-input');
if (savedNick && nickInputEl) {
  nickInputEl.value = savedNick;
}
if (nickInputEl) {
  nickInputEl.addEventListener('input', (e) => {
    localStorage.setItem('last_nickname', e.target.value.trim());
  });
}

function startAppInit() {
  initMobileJoystick();
  const isTouchOrMobile =
    window.matchMedia('(pointer: coarse)').matches ||
    'ontouchstart' in window ||
    navigator.maxTouchPoints > 0 ||
    window.innerWidth <= 900;

  if (isTouchOrMobile) {
    toggleMobileMode(true);
    toggleChat(true);
    toggleDock(true);
  }

  init3D();
  if (renderer && scene && camera) {
    renderer.render(scene, camera);
  }

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  }
}

if (document.readyState === 'loading') {
  window.addEventListener('DOMContentLoaded', startAppInit);
} else {
  startAppInit();
}
