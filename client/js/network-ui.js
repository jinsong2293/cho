/* ==================== SOCKET.IO NETWORK & GAMEPLAY ==================== */
let myCustomization = { hat: 'non_la', outfit: 'ba_ba', color: 0xf59e0b };

function joinGame() {
  initAudio();
  const input = document.getElementById('nickname-input');
  const roomInput = document.getElementById('room-code-input');
  const recInput = document.getElementById('recovery-code-input');
  const nick = (input.value || "").trim() || `TiểuThương_${Math.floor(100 + Math.random() * 899)}`;
  const roomCode = (roomInput && roomInput.value.trim()) || "";
  const recoveryCode = (recInput && recInput.value.trim()) || "";
  const savedToken = localStorage.getItem('player_token') || "";
  const urlParams = new URLSearchParams(window.location.search);
  const debugFestival = urlParams.get('festival') || "";

  if (socket) {
    socket.disconnect();
  }
  socket = io();

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
          camera.position.set(myPlayer.pos.x, 3.8, myPlayer.pos.z + 5.8);
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
      spawnFloatingPopup3D(8, 2.8, -15, `🪶 Combo x${shuttlecockAnim.combo}!`);
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
    if (patch.houseConfig !== undefined) myPlayer.houseConfig = patch.houseConfig;
    updateHUD();
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
  document.getElementById(id).classList.add('active');
}

function closeModal(id) {
  document.getElementById(id).classList.remove('active');
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

  if (Math.hypot(myPlayer.pos.x - 0, myPlayer.pos.z - 32) < 11.0) {
    openFishingModal();
    return;
  }

  if (Math.hypot(myPlayer.pos.x - 0, myPlayer.pos.z - 13.5) < 11.5) {
    openTeaTableModal();
    return;
  }

  if (Math.hypot(myPlayer.pos.x - (-8), myPlayer.pos.z - (-16)) < 11.5) {
    openBauCuaModal();
    return;
  }

  if (Math.hypot(myPlayer.pos.x - 8, myPlayer.pos.z - (-15)) < 11.5) {
    kickShuttlecockNow();
    return;
  }

  if (Math.hypot(myPlayer.pos.x - (-26), myPlayer.pos.z - 0) < 9.5) {
    openCommunityEventsModal();
    return;
  }

  if (Math.hypot(myPlayer.pos.x - 26, myPlayer.pos.z - 0) < 9.5) {
    openHouseModal();
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
    html = `
      <div style="text-align:center; padding:14px;">
        <p style="font-size:14.5px; margin-bottom:10px;">Sạp hàng vị trí đắc địa này đang chờ bà con thuê mở tiệm!</p>
        <div style="font-size:21px; font-weight:800; color:var(--gold); margin-bottom:14px;">
          Giá thuê sạp: ${gameConstants.STALL_COST.toLocaleString()}đ
        </div>
        <input type="text" id="stall-custom-name" class="join-input" placeholder="Đặt bảng tên cho sạp của bạn..." value="${safeStallName}" style="max-width:340px; margin:0 auto 14px;">
        <div>
          <button class="join-btn" style="max-width:260px; margin:0 auto;" onclick="rentStall('${safeStallId}')" ${myPlayer.money < gameConstants.STALL_COST ? 'disabled' : ''}>
            🏮 Mở Sạp Khai Trương
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
  socket.emit('chat', '🍻 [Quán Trà Đá] 1, 2, 3 DÔ! Chúc toàn thể bà con thị trấn buôn may bán đắt, vạn sự hanh thông!');
  playSound('fanfare');
  showToast('🍻 Đã hô vang cụng ly trà đá cùng cả bàn!');
  closeModal('modal-tea-table');
}

/* ==================== 9. GIAO LƯU TIỂU THƯƠNG (PLAYER SOCIAL) ==================== */
let targetSocialNickname = '';
let selectedLixiAmount = 2000;

function openPlayerSocialModal(targetNick) {
  targetSocialNickname = targetNick;
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

/* ==================== 13. CĂN NHÀ RIÊNG TIỂU THƯƠNG & SỔ LƯU BÚT (PLAYER HOUSE) ==================== */
let myHouseData = { wall: '#fef08a', furniture: 'Sập Gụ Tủ Chè', tree: 'Hoa Mai Vàng', privacy: 'public' };
try {
  const savedHouse = localStorage.getItem('my_house_data');
  if (savedHouse) myHouseData = JSON.parse(savedHouse);
} catch (e) {}

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
    row.innerHTML = `<b style="color:#fde68a;">${escapeHtml(entry.author || 'Bạn hiền')}:</b> ${escapeHtml(entry.message || '')}`;
    listEl.appendChild(row);
  });
}

function openHouseModal() {
  renderHouseGuestbook();
  openModal('modal-house');
}

function setHousePrivacy(privacy) {
  myHouseData.privacy = privacy;
  if (socket) {
    socket.emit('updateHouse', { privacy }, (res) => {
      if (res && res.ok) {
        myPlayer.houseConfig = res.houseConfig;
        showToast(`🏠 Đã cập nhật quyền mở cửa nhà: ${privacy}!`);
      }
    });
  }
}

function signHouseGuestbookNow() {
  const input = document.getElementById('house-guestbook-input');
  const message = (input && input.value.trim()) || '';
  if (!message || !socket) return;
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
}

function decorateHouse(part, val) {
  myHouseData[part] = val;
  try {
    localStorage.setItem('my_house_data', JSON.stringify(myHouseData));
  } catch (e) {}
  if (socket) {
    socket.emit('updateHouse', { [part]: val }, () => {});
  }
  playSound('buy');
  const partNames = { wall: 'Màu tường nhà', furniture: 'Bộ bàn ghế phòng khách', tree: 'Chậu cây trước hiên' };
  showToast(`🏠 Đã trang trí [${partNames[part] || part}]: ${val}!`);
}

function inviteFriendsToHouse() {
  if (!socket) return;
  socket.emit(
    'chat',
    `🏡 [Lời Mời Ghé Nhà] Mời bà con cô bác thị trấn ghé thăm Căn Nhà Riêng của tôi tại Phố Dân Cư uống trà và ghi sổ lưu bút nhé!`
  );
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
  showToast(`🏃 Đang chạy tới hội ngộ cùng ${nick}!`);
}

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
