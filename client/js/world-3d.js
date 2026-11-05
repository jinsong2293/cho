/* ==========================================================================
   CHỢ THỊ TRẤN VIỆT NAM 3D — THREE.JS SCENE, WEATHER & TOWN LANDMARKS (world-3d.js)
   ========================================================================== */

let scene, camera, renderer, controls;
let dirLight, hemiLight, plazaMesh;
let stallMeshes = {};
let customerMeshes = {};
let particleSystem = null;
let rainSystem = null;
let heatSystem = null;
let blossomSystem = null;
let lotusFountainGroup = null;
let supplyCrateGroup = null;
let tapTargetMarker = null;
let autoWalkTarget = null;
let streetVehicles = [];
let jumpPadMeshes = [];
let skyDome = null;
let skyCanvas = null;
let skyTexture = null;
const raycaster = new THREE.Raycaster();
const pointerNDC = new THREE.Vector2();

const _camForward = new THREE.Vector3();
const _camRight = new THREE.Vector3();
const _upVec = new THREE.Vector3(0, 1, 0);
const _moveDir = new THREE.Vector3();
const _targetVec = new THREE.Vector3();
const _projVec = new THREE.Vector3();

function initSkyDome() {
  skyCanvas = document.createElement('canvas');
  skyCanvas.width = 128;
  skyCanvas.height = 256;
  skyTexture = new THREE.CanvasTexture(skyCanvas);
  const skyGeo = new THREE.SphereGeometry(2600, 32, 16);
  const skyMat = new THREE.MeshBasicMaterial({
    map: skyTexture,
    side: THREE.BackSide,
    depthWrite: false,
  });
  skyDome = new THREE.Mesh(skyGeo, skyMat);
  scene.add(skyDome);
  updateSkyColors('heatwave');
}

function updateSkyColors(weatherKey) {
  if (!skyCanvas) return;
  const ctx = skyCanvas.getContext('2d');
  const grad = ctx.createLinearGradient(0, 0, 0, 256);

  let zenith = '#0284c7';
  let horizon = '#fed7aa';
  let fogColor = 0xfed7aa;

  if (window.WEATHER_PRESETS && window.WEATHER_PRESETS[weatherKey]) {
    const p = window.WEATHER_PRESETS[weatherKey];
    zenith = p.skyZenith;
    horizon = p.skyHorizon;
    fogColor = p.fogColor;
  }

  grad.addColorStop(0, zenith);
  grad.addColorStop(0.72, horizon);
  grad.addColorStop(1, horizon);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 128, 256);
  if (skyTexture) skyTexture.needsUpdate = true;

  if (scene) {
    scene.background = new THREE.Color(horizon);
    scene.fog = new THREE.FogExp2(fogColor, 0.00085);
  }
}

function init3D() {
  const container = document.getElementById('canvas-container');
  if (renderer) return;

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0xfed7aa);
  scene.fog = new THREE.FogExp2(0xfed7aa, 0.00085);

  const isPortrait = window.innerWidth < window.innerHeight;
  camera = new THREE.PerspectiveCamera(isPortrait ? 60 : 48, window.innerWidth / window.innerHeight, 0.1, 3500);
  camera.position.set(0, 3.8, 11.8);

  renderer = new THREE.WebGLRenderer({
    antialias: !isSoftwareGl,
    powerPreference: 'high-performance',
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = !isSoftwareGl;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  if (THREE.ACESFilmicToneMapping) {
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
  }
  container.appendChild(renderer.domElement);

  controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.enableDamping = !isSoftwareGl;
  controls.dampingFactor = 0.08;
  controls.maxPolarAngle = Math.PI / 2 - 0.03;
  controls.minDistance = 2.8;
  controls.maxDistance = 95;
  controls.target.set(0, 1.1, 6.0);
  controls.update();

  hemiLight = new THREE.HemisphereLight(0xfff7ed, 0x365314, 0.95);
  scene.add(hemiLight);

  dirLight = new THREE.DirectionalLight(0xffedd5, 1.45);
  dirLight.position.set(45, 68, 38);
  dirLight.castShadow = !isSoftwareGl;
  dirLight.shadow.mapSize.width = 1024;
  dirLight.shadow.mapSize.height = 1024;
  dirLight.shadow.camera.near = 1;
  dirLight.shadow.camera.far = 220;
  dirLight.shadow.camera.left = -75;
  dirLight.shadow.camera.right = 75;
  dirLight.shadow.camera.top = 75;
  dirLight.shadow.camera.bottom = -75;
  dirLight.shadow.bias = -0.0005;
  scene.add(dirLight);

  initSkyDome();
  buildVietnameseMarketTown();
  if (typeof buildExpandedTownZones === 'function') {
    buildExpandedTownZones();
  }
  initTapTargetMarker();
  initParticles();
  initFireworks3D();
  initWeatherSystems3D();
  applyWeatherVisuals();

  renderer.domElement.addEventListener('pointerdown', onCanvasPointerDown);
  window.addEventListener('resize', onWindowResize);
}

function initTapTargetMarker() {
  tapTargetMarker = new THREE.Mesh(
    new THREE.RingGeometry(0.35, 0.58, 24),
    new THREE.MeshBasicMaterial({
      color: 0xfbbf24,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.85,
    })
  );
  tapTargetMarker.rotation.x = -Math.PI / 2;
  tapTargetMarker.position.y = 0.06;
  tapTargetMarker.visible = false;
  scene.add(tapTargetMarker);
}

function onWindowResize() {
  if (!camera || !renderer) return;
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

let pointerDownPos = { x: 0, y: 0, time: 0 };
function onCanvasPointerDown(e) {
  if (joyInput.active || (e.clientX < window.innerWidth * 0.48 && e.clientY > 90 && document.body.classList.contains('mobile-mode'))) {
    return;
  }
  pointerDownPos = { x: e.clientX, y: e.clientY, time: performance.now() };
  const onUp = (upEvent) => {
    window.removeEventListener('pointerup', onUp);
    const moveDist = Math.hypot(upEvent.clientX - pointerDownPos.x, upEvent.clientY - pointerDownPos.y);
    const pressDuration = performance.now() - pointerDownPos.time;
    if (moveDist > 14 || pressDuration > 550) return;

    pointerNDC.x = (upEvent.clientX / window.innerWidth) * 2 - 1;
    pointerNDC.y = -(upEvent.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(pointerNDC, camera);

    const otherEntries = Object.entries(worldState.otherPlayers);
    for (const [nick, p] of otherEntries) {
      if (p.char && p.char.group) {
        const hits = raycaster.intersectObjects([p.char.group], true);
        if (hits.length > 0) {
          openPlayerSocialModal(nick);
          return;
        }
      }
    }

    if (petDogMesh && petDogMesh.group) {
      const dogHits = raycaster.intersectObjects([petDogMesh.group], true);
      if (dogHits.length > 0) {
        callPetDog();
        return;
      }
    }

    if (teaTableGroup && raycaster.intersectObjects([teaTableGroup], true).length > 0) {
      openTeaTableModal();
      return;
    }

    if (bauCuaBoothGroup && raycaster.intersectObjects([bauCuaBoothGroup], true).length > 0) {
      openBauCuaModal();
      return;
    }

    if (riversidePierGroup && raycaster.intersectObjects([riversidePierGroup], true).length > 0) {
      openFishingModal();
      return;
    }

    if (cultureHallGroup && raycaster.intersectObjects([cultureHallGroup], true).length > 0) {
      openCommunityEventsModal();
      return;
    }

    if (playerHouseGroup && raycaster.intersectObjects([playerHouseGroup], true).length > 0) {
      openHouseModal();
      return;
    }

    if (typeof shuttlecockCourtGroup !== 'undefined' && shuttlecockCourtGroup && raycaster.intersectObjects([shuttlecockCourtGroup], true).length > 0) {
      kickShuttlecockNow();
      return;
    }

    const activityGroups = [
      typeof openStageGroup !== 'undefined' ? openStageGroup : null,
      typeof wishingTreeGroup !== 'undefined' ? wishingTreeGroup : null,
      typeof craftGardenGroup !== 'undefined' ? craftGardenGroup : null,
      typeof floatingMarketGroup !== 'undefined' ? floatingMarketGroup : null,
      typeof kiteMeadowGroup !== 'undefined' ? kiteMeadowGroup : null,
      typeof flowerValleyGroup !== 'undefined' ? flowerValleyGroup : null,
      typeof coconutCanalGroup !== 'undefined' ? coconutCanalGroup : null,
      typeof orchardHillGroup !== 'undefined' ? orchardHillGroup : null,
      typeof mountainPagodaGroup !== 'undefined' ? mountainPagodaGroup : null,
      typeof sunWheelParkGroup !== 'undefined' ? sunWheelParkGroup : null,
      typeof lighthouseBayGroup !== 'undefined' ? lighthouseBayGroup : null,
      typeof goldenDragonIslandGroup !== 'undefined' ? goldenDragonIslandGroup : null,
    ].filter(Boolean);
    if (activityGroups.length > 0 && raycaster.intersectObjects(activityGroups, true).length > 0) {
      openTownActivitiesModal();
      return;
    }

    const stallGroups = Object.values(stallMeshes).map((s) => s.group);
    const hits = raycaster.intersectObjects(stallGroups, true);
    if (hits.length > 0) {
      let obj = hits[0].object;
      while (obj && obj.parent && obj.parent !== scene) {
        obj = obj.parent;
      }
      const found = Object.values(stallMeshes).find((s) => s.group === obj);
      if (found && found.data) {
        currentInteractingStall = found.data;
        renderStallModalContent(found.data);
        openModal('modal-stall');
        return;
      }
    }

    if (plazaMesh && myPlayer.mesh) {
      const groundTargets = [plazaMesh];
      if (typeof townGroundMesh !== 'undefined' && townGroundMesh) groundTargets.push(townGroundMesh);
      const groundHits = raycaster.intersectObjects(groundTargets, false);
      if (groundHits.length > 0) {
        const pt = groundHits[0].point;
        const tx = Math.max(-1155, Math.min(1155, pt.x));
        const tz = Math.max(-1155, Math.min(1155, pt.z));
        autoWalkTarget = { x: tx, z: tz };
        if (tapTargetMarker) {
          tapTargetMarker.position.set(tx, 0.06, tz);
          tapTargetMarker.visible = true;
        }
      }
    }
  };
  window.addEventListener('pointerup', onUp);
}

/* ==================== HỆ THỐNG THỜI TIẾT ĐỘNG 3D ==================== */
function initWeatherSystems3D() {
  const rainCount = 420;
  const rainGeo = new THREE.BufferGeometry();
  const rainPositions = new Float32Array(rainCount * 6);
  const rainCoords = [];

  for (let i = 0; i < rainCount; i++) {
    const rx = (Math.random() - 0.5) * 68;
    const ry = Math.random() * 26;
    const rz = (Math.random() - 0.5) * 68;
    rainCoords.push({ x: rx, y: ry, z: rz, speed: 18 + Math.random() * 6 });

    const idx = i * 6;
    rainPositions[idx] = rx;
    rainPositions[idx + 1] = ry;
    rainPositions[idx + 2] = rz;
    rainPositions[idx + 3] = rx + 0.15;
    rainPositions[idx + 4] = ry - 0.95;
    rainPositions[idx + 5] = rz;
  }

  rainGeo.setAttribute('position', new THREE.BufferAttribute(rainPositions, 3));
  const rainMat = new THREE.LineBasicMaterial({ color: 0xbae6fd, transparent: true, opacity: 0.62 });
  const rainLines = new THREE.LineSegments(rainGeo, rainMat);
  rainLines.visible = false;
  scene.add(rainLines);
  rainSystem = { lines: rainLines, coords: rainCoords, count: rainCount };

  const heatCount = 120;
  const heatGeo = new THREE.BufferGeometry();
  const heatPos = new Float32Array(heatCount * 3);
  const heatData = [];
  for (let i = 0; i < heatCount; i++) {
    heatPos[i * 3] = (Math.random() - 0.5) * 64;
    heatPos[i * 3 + 1] = Math.random() * 9;
    heatPos[i * 3 + 2] = (Math.random() - 0.5) * 64;
    heatData.push({ speed: 1.1 + Math.random() * 1.2, phase: Math.random() * Math.PI * 2 });
  }
  heatGeo.setAttribute('position', new THREE.BufferAttribute(heatPos, 3));
  const heatMat = new THREE.PointsMaterial({ color: 0xfbbf24, size: 0.34, transparent: true, opacity: 0.7 });
  const heatPoints = new THREE.Points(heatGeo, heatMat);
  heatPoints.visible = false;
  scene.add(heatPoints);
  heatSystem = { points: heatPoints, data: heatData, count: heatCount };

  const blossomCount = 140;
  const blossomGeo = new THREE.BufferGeometry();
  const blossomPos = new Float32Array(blossomCount * 3);
  const blossomData = [];
  for (let i = 0; i < blossomCount; i++) {
    blossomPos[i * 3] = (Math.random() - 0.5) * 66;
    blossomPos[i * 3 + 1] = Math.random() * 16;
    blossomPos[i * 3 + 2] = (Math.random() - 0.5) * 66;
    blossomData.push({ speedY: 1.4 + Math.random() * 1.2, phase: Math.random() * Math.PI * 2 });
  }
  blossomGeo.setAttribute('position', new THREE.BufferAttribute(blossomPos, 3));
  const blossomMat = new THREE.PointsMaterial({ color: 0xf472b6, size: 0.32, transparent: true, opacity: 0.85 });
  const blossomPoints = new THREE.Points(blossomGeo, blossomMat);
  blossomPoints.visible = false;
  scene.add(blossomPoints);
  blossomSystem = { points: blossomPoints, data: blossomData, count: blossomCount };
}

function getEffectiveWeather() {
  const mode = WEATHER_MODES[weatherOverrideIndex];
  if (mode && mode !== 'auto') return mode;
  return (worldState.marketEvent && worldState.marketEvent.weather) || 'clear';
}

function setWeatherMode(mode) {
  const idx = WEATHER_MODES.indexOf(mode);
  if (idx !== -1) weatherOverrideIndex = idx;
  applyWeatherVisuals();
}
window.setWeatherMode = setWeatherMode;

function cycleWeatherMode() {
  initAudio();
  playSound('click');
  weatherOverrideIndex = (weatherOverrideIndex + 1) % WEATHER_MODES.length;
  applyWeatherVisuals();
  const wState = getFormattedWeatherInfo(activeWeather);
  showToast(`🌦️ Đã chuyển sang: ${wState.name}!`);
}

function applyWeatherVisuals(overrideMode) {
  if (overrideMode && WEATHER_MODES.includes(overrideMode)) {
    weatherOverrideIndex = WEATHER_MODES.indexOf(overrideMode);
  }
  activeWeather = getEffectiveWeather();
  const wState = getFormattedWeatherInfo(activeWeather);

  const tempEl = document.getElementById('hud-weather-temp');
  const nameEl = document.getElementById('hud-weather-name');
  const iconEl = document.getElementById('hud-weather-icon');
  const chipEl = document.getElementById('hud-weather-chip');
  if (iconEl) iconEl.innerText = wState.icon;
  if (tempEl) tempEl.innerText = wState.tempStr;
  if (nameEl) nameEl.innerText = wState.name;
  if (chipEl) {
    chipEl.title = `Chạm hoặc nhấn phím T để đổi thời tiết (${wState.icon} ${wState.name} ${wState.tempStr})`;
  }

  showEventBanner(`${wState.icon} ${wState.name}!`, wState.description, 6500);
  updateSkyColors(activeWeather);

  const isRain = wState.particles === 'rain';
  const isHeat = wState.particles === 'heat';
  const isBlossom = wState.particles === 'blossom';

  if (rainSystem) rainSystem.lines.visible = isRain;
  if (heatSystem) heatSystem.points.visible = isHeat;
  if (blossomSystem) blossomSystem.points.visible = isBlossom;

  const overlay = document.getElementById('weather-overlay');
  if (overlay) {
    overlay.className = '';
    if (isRain) overlay.classList.add('rain');
    if (isHeat) overlay.classList.add('heatwave');
    if (isBlossom) overlay.classList.add('blossom');
  }

  if (plazaMesh && plazaMesh.material) {
    plazaMesh.material.roughness = wState.roughness;
    plazaMesh.material.metalness = wState.metalness;
  }
}
window.applyWeatherVisuals = applyWeatherVisuals;

function updateWeatherParticles3D(dt, elapsedSec) {
  if (activeWeather === 'rain' && rainSystem) {
    const posAttr = rainSystem.lines.geometry.attributes.position;
    const arr = posAttr.array;
    for (let i = 0; i < rainSystem.count; i++) {
      const c = rainSystem.coords[i];
      c.y -= c.speed * dt;
      c.x += 1.8 * dt;
      if (c.y < 0) {
        c.y = 24 + Math.random() * 4;
        c.x = (Math.random() - 0.5) * 68;
      }
      const idx = i * 6;
      arr[idx] = c.x;
      arr[idx + 1] = c.y;
      arr[idx + 2] = c.z;
      arr[idx + 3] = c.x + 0.12;
      arr[idx + 4] = c.y - 0.95;
      arr[idx + 5] = c.z;
    }
    posAttr.needsUpdate = true;
  } else if (activeWeather === 'heatwave' && heatSystem) {
    const posAttr = heatSystem.points.geometry.attributes.position;
    for (let i = 0; i < heatSystem.count; i++) {
      const d = heatSystem.data[i];
      let hy = posAttr.getY(i) + d.speed * dt;
      let hx = posAttr.getX(i) + Math.sin(elapsedSec * 3 + d.phase) * 0.025;
      if (hy > 9.5) hy = 0.15;
      posAttr.setXYZ(i, hx, hy, posAttr.getZ(i));
    }
    posAttr.needsUpdate = true;
  } else if (activeWeather === 'blossom' && blossomSystem) {
    const posAttr = blossomSystem.points.geometry.attributes.position;
    for (let i = 0; i < blossomSystem.count; i++) {
      const d = blossomSystem.data[i];
      let by = posAttr.getY(i) - d.speedY * dt;
      let bx = posAttr.getX(i) + Math.sin(elapsedSec * 1.8 + d.phase) * 0.04;
      let bz = posAttr.getZ(i) + Math.cos(elapsedSec * 1.5 + d.phase) * 0.03;
      if (by < 0.1) by = 15.5;
      posAttr.setXYZ(i, bx, by, bz);
    }
    posAttr.needsUpdate = true;
  }
}

function spawnFloatingPopup3D(worldX, worldY, worldZ, text) {
  if (!camera) return;
  _projVec.set(worldX, worldY, worldZ);
  _projVec.project(camera);
  if (_projVec.z > 1) return;

  const screenX = (_projVec.x * 0.5 + 0.5) * window.innerWidth;
  const screenY = (-(_projVec.y * 0.5) + 0.5) * window.innerHeight;

  const container = document.getElementById('floating-popups');
  const el = document.createElement('div');
  el.className = 'float-popup';
  el.style.left = `${screenX}px`;
  el.style.top = `${screenY}px`;
  el.innerText = text;
  container.appendChild(el);

  setTimeout(() => {
    if (el.parentNode) el.parentNode.removeChild(el);
  }, 1800);
}

/* ==================== XÂY DỰNG THỊ TRẤN CHỢ VIỆT NAM 3D (MỞ RỘNG 20X) ==================== */
let townGroundMesh = null;

function buildTraditionalVillageGate(x, z) {
  const gateGroup = new THREE.Group();
  gateGroup.position.set(x, 0, z);

  const brickMat = new THREE.MeshStandardMaterial({ color: 0x991b1b, roughness: 0.72 });
  const tileMat = new THREE.MeshStandardMaterial({ color: 0xb91c1c, roughness: 0.55 });
  const stoneMat = new THREE.MeshStandardMaterial({ color: 0x57534e, roughness: 0.85 });

  const pillarL = new THREE.Mesh(new THREE.BoxGeometry(1.6, 7.8, 1.6), brickMat);
  pillarL.position.set(-4.2, 3.9, 0);
  pillarL.castShadow = true;
  gateGroup.add(pillarL);

  const pillarR = new THREE.Mesh(new THREE.BoxGeometry(1.6, 7.8, 1.6), brickMat);
  pillarR.position.set(4.2, 3.9, 0);
  pillarR.castShadow = true;
  gateGroup.add(pillarR);

  const archBeam = new THREE.Mesh(new THREE.BoxGeometry(10.5, 0.9, 2.2), stoneMat);
  archBeam.position.set(0, 6.8, 0);
  gateGroup.add(archBeam);

  const roofLower = new THREE.Mesh(new THREE.ConeGeometry(7.2, 2.2, 4), tileMat);
  roofLower.rotation.y = Math.PI / 4;
  roofLower.position.set(0, 8.2, 0);
  roofLower.castShadow = true;
  gateGroup.add(roofLower);

  const roofUpper = new THREE.Mesh(new THREE.ConeGeometry(4.8, 1.8, 4), tileMat);
  roofUpper.rotation.y = Math.PI / 4;
  roofUpper.position.set(0, 9.8, 0);
  roofUpper.castShadow = true;
  gateGroup.add(roofUpper);

  const gateSign = createTextSprite("🏛️ CỔNG LÀNG ĐẤT VIỆT 🏛️", "#fef08a", "rgba(185, 28, 28, 0.95)");
  gateSign.position.set(0, 7.6, 1.2);
  gateSign.scale.set(6.2, 1.3, 1);
  gateGroup.add(gateSign);

  const couplL = createTextSprite("ĐỊA LINH NHÂN KIỆT", "#fef08a", "rgba(185, 28, 28, 0.95)");
  couplL.position.set(-4.2, 4.2, 0.9);
  couplL.scale.set(2.4, 0.65, 1);
  gateGroup.add(couplL);

  const couplR = createTextSprite("QUỐC THÁI DÂN AN", "#fef08a", "rgba(185, 28, 28, 0.95)");
  couplR.position.set(4.2, 4.2, 0.9);
  couplR.scale.set(2.4, 0.65, 1);
  gateGroup.add(couplR);

  const dirtPathGeo = new THREE.PlaneGeometry(7.2, 18);
  const dirtPathMat = new THREE.MeshStandardMaterial({ color: 0x785336, roughness: 0.92 });
  const dirtPath = new THREE.Mesh(dirtPathGeo, dirtPathMat);
  dirtPath.rotation.x = -Math.PI / 2;
  dirtPath.position.set(0, 0.02, -8.5);
  gateGroup.add(dirtPath);

  [-7.5, -9.5, 7.5, 9.5].forEach((bx) => {
    [-1, -4, -8].forEach((bz) => {
      createVietnameseTree(x + bx, z + bz, 'mai_vang');
    });
  });

  scene.add(gateGroup);
}

function buildRiverbankPromenade(x, z) {
  const promGroup = new THREE.Group();
  promGroup.position.set(x, 0, z);

  const stoneMat = new THREE.MeshStandardMaterial({ color: 0x57534e, roughness: 0.85 });
  const woodMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.75 });
  const waterMat = new THREE.MeshStandardMaterial({
    color: 0x0369a1,
    roughness: 0.15,
    metalness: 0.65,
    transparent: true,
    opacity: 0.88,
  });

  const embankment = new THREE.Mesh(new THREE.BoxGeometry(2320, 1.8, 2.4), stoneMat);
  embankment.position.set(0, 0.6, 0);
  embankment.receiveShadow = true;
  promGroup.add(embankment);

  for (let lx = -580; lx <= 580; lx += 16) {
    if (
      Math.abs(lx - -28) < 6.5 ||
      Math.abs(lx - 28) < 6.5 ||
      Math.abs(lx - -140) < 9.5 ||
      Math.abs(lx - 140) < 9.5
    ) {
      continue;
    }
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 1.1, 8), woodMat);
    post.position.set(lx, 1.95, 0.8);
    promGroup.add(post);
  }
  const railTop = new THREE.Mesh(new THREE.BoxGeometry(2240, 0.08, 0.12), woodMat);
  railTop.position.set(0, 2.45, 0.8);
  promGroup.add(railTop);

  const riverPlane = new THREE.Mesh(new THREE.PlaneGeometry(2400, 32), waterMat);
  riverPlane.rotation.x = -Math.PI / 2;
  riverPlane.position.set(0, 0.15, -3);
  promGroup.add(riverPlane);

  [-280, -195, -95, -52, -18, 18, 52, 95, 195, 280].forEach((bx) => {
    const boat = new THREE.Mesh(
      new THREE.BoxGeometry(2.8, 0.85, 5.8),
      new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.8 })
    );
    boat.position.set(bx, 0.45, -4.5);
    boat.rotation.y = (Math.random() - 0.5) * 0.4;
    promGroup.add(boat);
  });

  [-180, -110, -75, -42, -12, 12, 42, 75, 110, 180].forEach((lx) => {
    const lily = new THREE.Mesh(
      new THREE.CylinderGeometry(1.1, 1.1, 0.05, 12),
      new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.5 })
    );
    lily.position.set(lx, 0.24, -8);
    promGroup.add(lily);

    const lotusFlower = new THREE.Mesh(
      new THREE.SphereGeometry(0.4, 8, 8),
      new THREE.MeshStandardMaterial({ color: 0xf472b6, roughness: 0.3 })
    );
    lotusFlower.position.set(lx, 0.44, -8);
    promGroup.add(lotusFlower);
  });

  scene.add(promGroup);
}

function buildRiverBridge(x, zStart, zEnd, bridgeTitle) {
  const bridgeGroup = new THREE.Group();
  const length = zEnd - zStart;
  const zMid = (zStart + zEnd) / 2;
  bridgeGroup.position.set(x, 0, zMid);

  const deckMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.72 });
  const redRailMat = new THREE.MeshStandardMaterial({ color: 0xb91c1c, roughness: 0.45 });
  const goldMat = new THREE.MeshStandardMaterial({ color: 0xfbbf24, metalness: 0.65, roughness: 0.25 });
  const stoneMat = new THREE.MeshStandardMaterial({ color: 0x57534e, roughness: 0.85 });

  const deck = new THREE.Mesh(new THREE.BoxGeometry(11.5, 0.32, length), deckMat);
  deck.position.y = 0.22;
  deck.receiveShadow = true;
  bridgeGroup.add(deck);

  [-5.4, 5.4].forEach((rx) => {
    const curb = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.55, length), stoneMat);
    curb.position.set(rx, 0.52, 0);
    bridgeGroup.add(curb);

    const topBar = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.16, length), redRailMat);
    topBar.position.set(rx, 1.35, 0);
    bridgeGroup.add(topBar);

    for (let bz = -length / 2 + 2; bz <= length / 2 - 2; bz += 4.2) {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 1.4, 10), redRailMat);
      post.position.set(rx, 0.9, bz);
      bridgeGroup.add(post);

      const cap = new THREE.Mesh(new THREE.SphereGeometry(0.18, 10, 10), goldMat);
      cap.position.set(rx, 1.68, bz);
      bridgeGroup.add(cap);
    }
  });

  const archGate = new THREE.Mesh(new THREE.BoxGeometry(12.2, 0.85, 0.85), redRailMat);
  archGate.position.set(0, 5.6, 0);
  bridgeGroup.add(archGate);

  [-5.4, 5.4].forEach((px) => {
    const archPillar = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.34, 5.8, 12), redRailMat);
    archPillar.position.set(px, 2.9, 0);
    bridgeGroup.add(archPillar);
  });

  const sign = createTextSprite(bridgeTitle, "#fef08a", "rgba(185, 28, 28, 0.95)");
  sign.position.set(0, 6.4, 0);
  sign.scale.set(6.4, 1.25, 1);
  bridgeGroup.add(sign);

  scene.add(bridgeGroup);
}

function buildPerimeterHillsAndEnclosure() {
  const hillGroup = new THREE.Group();
  const hillGeo = new THREE.ConeGeometry(165, 95, 7);
  const hillMat1 = new THREE.MeshStandardMaterial({ color: 0x2e4e1a, roughness: 0.95 });
  const hillMat2 = new THREE.MeshStandardMaterial({ color: 0x365314, roughness: 0.95 });

  const numHills = 64;
  const radius = 1240;
  for (let i = 0; i < numHills; i++) {
    const angle = (i / numHills) * Math.PI * 2;
    const hx = Math.cos(angle) * (radius + (Math.random() - 0.5) * 65);
    const hz = Math.sin(angle) * (radius + (Math.random() - 0.5) * 65);
    const hill = new THREE.Mesh(hillGeo, i % 2 === 0 ? hillMat1 : hillMat2);
    hill.position.set(hx, 34 + Math.random() * 18, hz);
    hill.scale.set(0.9 + Math.random() * 0.7, 0.85 + Math.random() * 0.7, 0.9 + Math.random() * 0.7);
    hill.rotation.y = Math.random() * Math.PI;
    hillGroup.add(hill);
  }
  scene.add(hillGroup);
}

function buildVietnameseMarketTown() {
  // Nền thảo nguyên mở rộng gấp 20 lần (5200m x 5200m)
  const grassGeo = new THREE.PlaneGeometry(5200, 5200);
  const grassMat = new THREE.MeshStandardMaterial({ color: 0x274e13, roughness: 0.92, metalness: 0.04 });
  const grass = new THREE.Mesh(grassGeo, grassMat);
  grass.rotation.x = -Math.PI / 2;
  grass.position.y = -0.05;
  grass.receiveShadow = true;
  scene.add(grass);
  townGroundMesh = grass;

  // Đại quảng trường gạch đỏ trung tâm mở rộng (176m x 176m)
  const plazaGeo = new THREE.PlaneGeometry(176, 176);
  const plazaMat = new THREE.MeshStandardMaterial({ color: 0x9a3412, roughness: 0.72, metalness: 0.08 });
  plazaMesh = new THREE.Mesh(plazaGeo, plazaMat);
  plazaMesh.rotation.x = -Math.PI / 2;
  plazaMesh.receiveShadow = true;
  scene.add(plazaMesh);

  // Hệ thống Đại Lộ Bắc-Nam, Đông-Tây và 2 Đường Vành Đai 20x (dài 2320m)
  const roadMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.7 });
  const roadLineMat = new THREE.MeshBasicMaterial({ color: 0xfacc15 });

  // Đại lộ Bắc (từ trung tâm tới Cổng Làng, Đồi Thả Diều & Đỉnh Núi Chùa Đồng)
  const roadNorth = new THREE.Mesh(new THREE.PlaneGeometry(14, 1160), roadMat);
  roadNorth.rotation.x = -Math.PI / 2;
  roadNorth.position.set(0, 0.015, -580);
  scene.add(roadNorth);

  // Đại lộ Nam (từ bờ nam sông tới Đồi Chợ Nổi, Miệt Vườn & Đảo Ngọc Rồng Vàng)
  const roadSouth = new THREE.Mesh(new THREE.PlaneGeometry(14, 1094), roadMat);
  roadSouth.rotation.x = -Math.PI / 2;
  roadSouth.position.set(0, 0.015, 611);
  scene.add(roadSouth);

  // Đại lộ Đông-Tây xuyên suốt 2320m
  const roadH = new THREE.Mesh(new THREE.PlaneGeometry(2320, 14), roadMat);
  roadH.rotation.x = -Math.PI / 2;
  roadH.position.set(0, 0.02, 0);
  scene.add(roadH);

  // Vành đai Trong (5x: z = -130, z = 120, x = ±140)
  const ringNorth = new THREE.Mesh(new THREE.PlaneGeometry(1180, 11), roadMat);
  ringNorth.rotation.x = -Math.PI / 2;
  ringNorth.position.set(0, 0.018, -130);
  scene.add(ringNorth);

  const ringSouth = new THREE.Mesh(new THREE.PlaneGeometry(1180, 11), roadMat);
  ringSouth.rotation.x = -Math.PI / 2;
  ringSouth.position.set(0, 0.018, 120);
  scene.add(ringSouth);

  [-140, 140].forEach((rx) => {
    const ringSide = new THREE.Mesh(new THREE.PlaneGeometry(11, 1120), roadMat);
    ringSide.rotation.x = -Math.PI / 2;
    ringSide.position.set(rx, 0.018, -10);
    scene.add(ringSide);
  });

  // Vành đai Đại Lộ Ngoại Vi 20x (z = -540, z = 520, x = ±580) nối 4 Đại Kỳ Quan
  const outerRingN = new THREE.Mesh(new THREE.PlaneGeometry(1220, 14), roadMat);
  outerRingN.rotation.x = -Math.PI / 2;
  outerRingN.position.set(0, 0.018, -540);
  scene.add(outerRingN);

  const outerRingS = new THREE.Mesh(new THREE.PlaneGeometry(1220, 14), roadMat);
  outerRingS.rotation.x = -Math.PI / 2;
  outerRingS.position.set(0, 0.018, 520);
  scene.add(outerRingS);

  [-580, 580].forEach((ox) => {
    const outerSide = new THREE.Mesh(new THREE.PlaneGeometry(14, 1080), roadMat);
    outerSide.rotation.x = -Math.PI / 2;
    outerSide.position.set(ox, 0.018, -10);
    scene.add(outerSide);
  });

  // Vạch kẻ đường vàng đứt đoạn trên đại lộ chính 20x
  for (let d = -1100; d <= 1100; d += 24) {
    const dashH = new THREE.Mesh(new THREE.PlaneGeometry(8.5, 0.34), roadLineMat);
    dashH.rotation.x = -Math.PI / 2;
    dashH.position.set(d, 0.026, 0);
    scene.add(dashH);

    if (d < 28 || d > 68) {
      const dashV = new THREE.Mesh(new THREE.PlaneGeometry(0.34, 8.5), roadLineMat);
      dashV.rotation.x = -Math.PI / 2;
      dashV.position.set(0, 0.026, d);
      scene.add(dashV);
    }
  }

  const curbMat = new THREE.MeshStandardMaterial({ color: 0xd6d3d1, roughness: 0.75 });
  [-7.2, 7.2].forEach((cx) => {
    const curb = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.14, 1120), curbMat);
    curb.position.set(cx, 0.07, -560);
    scene.add(curb);
  });

  const grid = new THREE.GridHelper(176, 88, 0xf59e0b, 0x78350f);
  grid.position.y = 0.025;
  scene.add(grid);

  buildBenThanhClockTower(0, -34);
  buildWelcomeGate(0, 26);
  buildGoldenLotusFountain();
  buildCentralTownBoulevard();
  buildTownDirectionalSignpost(0, -6);
  buildBauCuaBooth(-8, -16);
  buildSidewalkTeaTable(0, 13.5);
  buildRiversidePier(0, 32);
  buildCommunityCultureHall(-26, 0);
  buildResidentialStreet(26, 0);
  buildShuttlecockCourt(8, -15);
  buildVietnameseUtilityPoles();

  buildTraditionalVillageGate(0, -52);
  buildRiverbankPromenade(0, 52);
  buildRiverBridge(-28, 32, 66, "🌉 CẦU BÌNH MINH — QUA SÔNG");
  buildRiverBridge(28, 32, 66, "🌉 CẦU HOÀNG HÔN — QUA SÔNG");
  buildRiverBridge(-140, 32, 66, "🐉 CẦU RỒNG VÀNG — ĐẠI LỘ TÂY");
  buildRiverBridge(140, 32, 66, "🌟 CẦU ÁNH SAO — ĐẠI LỘ ĐÔNG");
  buildPerimeterHillsAndEnclosure();

  JUMP_PADS.forEach((pad) => createTrampolinePad(pad.x, pad.z, pad.color));
  buildLuckyLixiCrate();

  const treeLocations = [
    { x: -24, z: -24, type: 'mai_vang' },
    { x:  24, z: -24, type: 'dao_tet' },
    { x: -24, z:  24, type: 'phuong_vi' },
    { x:  24, z:  24, type: 'phuong_vi' },
    { x: -29, z:   0, type: 'cay_da' },
    { x:  29, z:   0, type: 'cay_da' },
    { x: -18, z: -22, type: 'mai_vang' },
    { x:  18, z: -22, type: 'dao_tet' },
    { x: -18, z:  22, type: 'mai_vang' },
    { x:  18, z:  22, type: 'dao_tet' },
    // Hàng cây đại lộ mở rộng 20x
    { x: -48, z: -48, type: 'phuong_vi' },
    { x:  48, z: -48, type: 'phuong_vi' },
    { x: -48, z:  26, type: 'cay_da' },
    { x:  48, z:  26, type: 'cay_da' },
    { x: -85, z: -12, type: 'mai_vang' },
    { x:  85, z: -12, type: 'dao_tet' },
    { x: -85, z:  12, type: 'phuong_vi' },
    { x:  85, z:  12, type: 'phuong_vi' },
    { x: -12, z: -95, type: 'mai_vang' },
    { x:  12, z: -95, type: 'dao_tet' },
    { x: -260, z: -14, type: 'mai_vang' },
    { x:  260, z: -14, type: 'dao_tet' },
    { x: -260, z:  14, type: 'phuong_vi' },
    { x:  260, z:  14, type: 'phuong_vi' },
    { x: -420, z: -14, type: 'cay_da' },
    { x:  420, z: -14, type: 'cay_da' },
    { x: -14, z: -280, type: 'mai_vang' },
    { x:  14, z: -280, type: 'dao_tet' },
    { x: -14, z:  280, type: 'phuong_vi' },
    { x:  14, z:  280, type: 'phuong_vi' },
  ];
  treeLocations.forEach((loc) => createVietnameseTree(loc.x, loc.z, loc.type));

  buildVietnameseShophouses();
  buildHoiAnLanternStrings();
  initVietnameseStreetTraffic();
  if (typeof buildOuterZones3D === 'function') {
    buildOuterZones3D();
  }
}

function buildCentralTownBoulevard() {
  const blvdGroup = new THREE.Group();

  // Mặt đá hoa cương đại lộ trung tâm (rộng 5.6m, dài 58m từ z = -32 đến z = +26)
  const stoneMat = new THREE.MeshStandardMaterial({
    color: 0xe2e8f0,
    roughness: 0.65,
    metalness: 0.1,
  });
  const blvdFloor = new THREE.Mesh(new THREE.PlaneGeometry(5.6, 58), stoneMat);
  blvdFloor.rotation.x = -Math.PI / 2;
  blvdFloor.position.set(0, 0.028, -3.0);
  blvdFloor.receiveShadow = true;
  blvdGroup.add(blvdFloor);

  // Viền đá hoa cương hai bên trục đại lộ
  const edgeMat = new THREE.MeshStandardMaterial({ color: 0xb45309, roughness: 0.7 });
  [-2.8, 2.8].forEach((bx) => {
    const curb = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.1, 58), edgeMat);
    curb.position.set(bx, 0.05, -3.0);
    blvdGroup.add(curb);
  });

  // Hàng chậu cây cau kiểng phân cách hành lang đi bộ
  [-2.95, 2.95].forEach((px) => {
    [-24, -16, -8, 8, 16, 22].forEach((pz) => {
      const pot = new THREE.Mesh(
        new THREE.CylinderGeometry(0.28, 0.22, 0.5, 8),
        new THREE.MeshStandardMaterial({ color: 0x9a3412, roughness: 0.7 })
      );
      pot.position.set(px, 0.25, pz);
      blvdGroup.add(pot);

      const tree = new THREE.Mesh(
        new THREE.ConeGeometry(0.42, 1.35, 7),
        new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.6 })
      );
      tree.position.set(px, 1.15, pz);
      blvdGroup.add(tree);
    });
  });

  scene.add(blvdGroup);
}

function buildTownDirectionalSignpost(x, z) {
  const postGroup = new THREE.Group();
  postGroup.position.set(x, 0, z);

  const postMat = new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.8 });
  const post = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 4.2, 10), postMat);
  post.position.y = 2.1;
  postGroup.add(post);

  const finial = new THREE.Mesh(
    new THREE.ConeGeometry(0.28, 0.45, 8),
    new THREE.MeshStandardMaterial({ color: 0xfbbf24, metalness: 0.7 })
  );
  finial.position.y = 4.4;
  postGroup.add(finial);

  // Biển chỉ hướng 4 phương
  const signW = createTextSprite("⬅️ KHU BẦU CUA & HỒ SEN", "#fef08a", "rgba(185, 28, 28, 0.95)");
  signW.position.set(-1.4, 3.8, 0);
  signW.scale.set(3.2, 0.62, 1);
  postGroup.add(signW);

  const signE = createTextSprite("KHU ĐÁ CẦU & LÀNG NGHỀ ➡️", "#6ee7b7", "rgba(6, 78, 59, 0.95)");
  signE.position.set(1.4, 3.2, 0);
  signE.scale.set(3.2, 0.62, 1);
  postGroup.add(signE);

  const signN = createTextSprite("⬆️ CHỢ BẾN THÀNH & PHỐ ĐÊM", "#fde047", "rgba(15, 23, 42, 0.95)");
  signN.position.set(0, 2.6, -1.2);
  signN.scale.set(3.4, 0.62, 1);
  postGroup.add(signN);

  const signS = createTextSprite("⬇️ PHỐ TRÀ ĐÁ & BẾN SÔNG", "#bae6fd", "rgba(3, 105, 161, 0.95)");
  signS.position.set(0, 2.0, 1.2);
  signS.scale.set(3.2, 0.62, 1);
  postGroup.add(signS);

  scene.add(postGroup);
}

function buildBenThanhClockTower(x, z) {
  const group = new THREE.Group();
  group.position.set(x, 0, z);

  const wallMat = new THREE.MeshStandardMaterial({ color: 0xfef08a, roughness: 0.65 });
  const roofMat = new THREE.MeshStandardMaterial({ color: 0xb91c1c, roughness: 0.55 });

  const hall = new THREE.Mesh(new THREE.BoxGeometry(22, 7.5, 9), wallMat);
  hall.position.y = 3.75;
  hall.castShadow = true;
  hall.receiveShadow = true;
  group.add(hall);

  const hallRoof = new THREE.Mesh(new THREE.ConeGeometry(14, 3.5, 4), roofMat);
  hallRoof.position.y = 9.2;
  hallRoof.rotation.y = Math.PI / 4;
  group.add(hallRoof);

  const tower = new THREE.Mesh(new THREE.BoxGeometry(5.2, 13.5, 5.2), wallMat);
  tower.position.set(0, 6.75, 2.5);
  tower.castShadow = true;
  group.add(tower);

  const towerRoof = new THREE.Mesh(new THREE.ConeGeometry(4.2, 2.8, 4), roofMat);
  towerRoof.position.set(0, 14.8, 2.5);
  towerRoof.rotation.y = Math.PI / 4;
  group.add(towerRoof);

  const clockFace = new THREE.Mesh(
    new THREE.CylinderGeometry(1.3, 1.3, 0.2, 20),
    new THREE.MeshBasicMaterial({ color: 0xffffff })
  );
  clockFace.rotation.x = Math.PI / 2;
  clockFace.position.set(0, 10.8, 5.15);
  group.add(clockFace);

  const sign = createTextSprite("🇻🇳 NHÀ LỒNG CHỢ TRUNG TÂM 🇻🇳", "#fef08a", "rgba(185, 28, 28, 0.95)");
  sign.position.set(0, 6.5, 5.4);
  sign.scale.set(6.5, 1.3, 1);
  group.add(sign);

  scene.add(group);
}

function buildWelcomeGate(x, z) {
  const gate = new THREE.Group();
  gate.position.set(x, 0, z);

  const redMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.4 });
  const goldMat = new THREE.MeshStandardMaterial({ color: 0xfbbf24, metalness: 0.6, roughness: 0.3 });

  const pillarL = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.38, 6.5, 12), redMat);
  pillarL.position.set(-4.8, 3.25, 0);
  gate.add(pillarL);

  const pillarR = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.38, 6.5, 12), redMat);
  pillarR.position.set(4.8, 3.25, 0);
  gate.add(pillarR);

  const beam = new THREE.Mesh(new THREE.BoxGeometry(11.2, 1.1, 0.7), redMat);
  beam.position.set(0, 6.2, 0);
  gate.add(beam);

  const trim = new THREE.Mesh(new THREE.BoxGeometry(11.6, 0.2, 0.8), goldMat);
  trim.position.set(0, 6.8, 0);
  gate.add(trim);

  const banner = createTextSprite("🏮 CHỢ THỊ TRẤN VIỆT NAM 🏮", "#fef08a", "rgba(185, 28, 28, 0.95)");
  banner.position.set(0, 6.2, 0.5);
  banner.scale.set(6.0, 1.2, 1);
  gate.add(banner);

  scene.add(gate);
}

function buildGoldenLotusFountain() {
  lotusFountainGroup = new THREE.Group();
  lotusFountainGroup.position.set(0, 0, 0);

  const stoneMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.5 });
  const waterMat = new THREE.MeshStandardMaterial({ color: 0x0ea5e9, roughness: 0.15, metalness: 0.5 });
  const goldLotusMat = new THREE.MeshStandardMaterial({
    color: 0xfbbf24,
    emissive: 0xd97706,
    emissiveIntensity: 0.55,
    metalness: 0.8,
    roughness: 0.2,
  });

  const basin = new THREE.Mesh(new THREE.CylinderGeometry(4.2, 4.6, 0.65, 24), stoneMat);
  basin.position.y = 0.32;
  basin.receiveShadow = true;
  lotusFountainGroup.add(basin);

  const water = new THREE.Mesh(new THREE.CylinderGeometry(3.9, 3.9, 0.55, 24), waterMat);
  water.position.y = 0.42;
  lotusFountainGroup.add(water);

  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.8, 2.0, 12), stoneMat);
  stem.position.y = 1.2;
  lotusFountainGroup.add(stem);

  const lotusGroup = new THREE.Group();
  lotusGroup.position.y = 2.6;

  const bud = new THREE.Mesh(new THREE.OctahedronGeometry(0.75, 1), goldLotusMat);
  bud.scale.set(1, 1.4, 1);
  lotusGroup.add(bud);

  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2;
    const petal = new THREE.Mesh(new THREE.ConeGeometry(0.42, 1.1, 6), goldLotusMat);
    petal.position.set(Math.cos(angle) * 0.75, -0.1, Math.sin(angle) * 0.75);
    petal.rotation.z = -Math.cos(angle) * 0.55;
    petal.rotation.x = Math.sin(angle) * 0.55;
    lotusGroup.add(petal);
  }

  lotusFountainGroup.add(lotusGroup);
  lotusFountainGroup.userData = { lotusGroup };
  scene.add(lotusFountainGroup);
}

let bauCuaBoothGroup = null;
let bauCuaBowlMesh = null;
let bauCuaDiceMeshes = [];

function buildBauCuaBooth(x, z) {
  bauCuaBoothGroup = new THREE.Group();
  bauCuaBoothGroup.position.set(x, 0, z);

  const goldMat = new THREE.MeshStandardMaterial({ color: 0xfbbf24, metalness: 0.65, roughness: 0.25 });
  const redLacquerMat = new THREE.MeshStandardMaterial({ color: 0xb91c1c, roughness: 0.35, metalness: 0.15 });
  const darkWoodMat = new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.72 });
  const carpetMat = new THREE.MeshStandardMaterial({ color: 0x7f1d1d, roughness: 0.82 });

  // 1. Đại Thảm Hội Hoàng Gia Bát Giác Mở Rộng (bán kính 9.2m) & 2 vòng viền hoàng kim
  const outerCarpet = new THREE.Mesh(new THREE.CylinderGeometry(9.2, 9.5, 0.08, 12), carpetMat);
  outerCarpet.position.y = 0.04;
  outerCarpet.receiveShadow = true;
  bauCuaBoothGroup.add(outerCarpet);

  [8.8, 6.6].forEach((rVal) => {
    const goldBorderRing = new THREE.Mesh(
      new THREE.RingGeometry(rVal - 0.32, rVal, 12),
      new THREE.MeshBasicMaterial({ color: 0xfbbf24, side: THREE.DoubleSide })
    );
    goldBorderRing.rotation.x = -Math.PI / 2;
    goldBorderRing.position.y = 0.09;
    bauCuaBoothGroup.add(goldBorderRing);
  });

  // 2. Đài gỗ bát giác trung tâm nâng cao (bán kính 5.2m)
  const deck = new THREE.Mesh(new THREE.CylinderGeometry(5.1, 5.5, 0.45, 8), darkWoodMat);
  deck.position.y = 0.22;
  deck.receiveShadow = true;
  bauCuaBoothGroup.add(deck);

  const deckTrim = new THREE.Mesh(new THREE.CylinderGeometry(5.25, 5.25, 0.08, 8), goldMat);
  deckTrim.position.y = 0.43;
  bauCuaBoothGroup.add(deckTrim);

  // 3. 12 Cột trụ son thếp vàng & Đại Điện Bát Giác 3 Tầng Mái Cong
  const lanternGlowMat = new THREE.MeshStandardMaterial({
    color: 0xef4444,
    emissive: 0xdc2626,
    emissiveIntensity: 0.85,
    roughness: 0.3,
  });

  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2 + Math.PI / 8;
    const px = Math.cos(angle) * 5.3;
    const pz = Math.sin(angle) * 5.3;

    const pillarBase = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.4, 0.38, 8), goldMat);
    pillarBase.position.set(px, 0.19, pz);
    bauCuaBoothGroup.add(pillarBase);

    const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.24, 5.2, 12), redLacquerMat);
    pillar.position.set(px, 2.7, pz);
    pillar.castShadow = true;
    bauCuaBoothGroup.add(pillar);

    const lantern = new THREE.Mesh(new THREE.SphereGeometry(0.32, 12, 12), lanternGlowMat);
    lantern.scale.set(1, 1.35, 1);
    lantern.position.set(Math.cos(angle) * 5.9, 4.75, Math.sin(angle) * 5.9);
    bauCuaBoothGroup.add(lantern);
  }

  const roofLower = new THREE.Mesh(new THREE.ConeGeometry(7.2, 1.85, 8), redLacquerMat);
  roofLower.position.y = 6.05;
  roofLower.rotation.y = Math.PI / 8;
  roofLower.castShadow = true;
  bauCuaBoothGroup.add(roofLower);

  const roofMiddle = new THREE.Mesh(new THREE.ConeGeometry(5.2, 1.6, 8), goldMat);
  roofMiddle.position.y = 7.35;
  roofMiddle.rotation.y = Math.PI / 8;
  bauCuaBoothGroup.add(roofMiddle);

  const roofUpper = new THREE.Mesh(new THREE.ConeGeometry(3.4, 1.4, 8), redLacquerMat);
  roofUpper.position.y = 8.45;
  roofUpper.rotation.y = Math.PI / 8;
  bauCuaBoothGroup.add(roofUpper);

  const roofFinial = new THREE.Mesh(new THREE.OctahedronGeometry(0.55, 1), goldMat);
  roofFinial.position.y = 9.45;
  bauCuaBoothGroup.add(roofFinial);

  // 4. Đại Chiếu Cược Bầu Cua Tôm Cá Khổng Lồ (6.0m x 6.0m, Độ Phân Giải 1024x1024)
  const matCanvas = document.createElement('canvas');
  matCanvas.width = 1024;
  matCanvas.height = 1024;
  const mctx = matCanvas.getContext('2d');
  mctx.fillStyle = '#7f1d1d';
  mctx.fillRect(0, 0, 1024, 1024);

  mctx.strokeStyle = '#fbbf24';
  mctx.lineWidth = 22;
  mctx.strokeRect(18, 18, 988, 988);
  mctx.strokeStyle = '#fef08a';
  mctx.lineWidth = 6;
  mctx.strokeRect(36, 36, 952, 952);

  const cells = [
    { icon: '🦌', title: 'NAI LỘC', sub: 'x2 • x3 • x4', x: 180, y: 265, bg: '#991b1b' },
    { icon: '🎃', title: 'BẦU TIÊN', sub: 'x2 • x3 • x4', x: 512, y: 265, bg: '#b45309' },
    { icon: '🐓', title: 'GÀ VÀNG', sub: 'x2 • x3 • x4', x: 844, y: 265, bg: '#991b1b' },
    { icon: '🐟', title: 'CÁ CHÉP', sub: 'x2 • x3 • x4', x: 180, y: 755, bg: '#b45309' },
    { icon: '🦀', title: 'CUA ĐẾ',  sub: 'x2 • x3 • x4', x: 512, y: 755, bg: '#991b1b' },
    { icon: '🦐', title: 'TÔM RỒNG', sub: 'x2 • x3 • x4', x: 844, y: 755, bg: '#b45309' },
  ];

  cells.forEach((c, idx) => {
    const col = idx % 3;
    const row = Math.floor(idx / 3);
    const rx = 44 + col * 312;
    const ry = 44 + row * 468;
    mctx.fillStyle = c.bg;
    mctx.fillRect(rx + 8, ry + 8, 296, 452);
    mctx.strokeStyle = '#fbbf24';
    mctx.lineWidth = 8;
    mctx.strokeRect(rx + 8, ry + 8, 296, 452);

    mctx.font = '135px sans-serif';
    mctx.textAlign = 'center';
    mctx.textBaseline = 'middle';
    mctx.fillText(c.icon, c.x, c.y - 55);

    mctx.fillStyle = '#fef08a';
    mctx.font = 'bold 44px sans-serif';
    mctx.fillText(c.title, c.x, c.y + 72);

    mctx.fillStyle = '#fde68a';
    mctx.font = 'bold 26px sans-serif';
    mctx.fillText(c.sub, c.x, c.y + 125);
  });

  const matTex = new THREE.CanvasTexture(matCanvas);
  const matMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(6.0, 6.0),
    new THREE.MeshStandardMaterial({ map: matTex, roughness: 0.5 })
  );
  matMesh.rotation.x = -Math.PI / 2;
  matMesh.position.y = 0.46;
  matMesh.receiveShadow = true;
  bauCuaBoothGroup.add(matMesh);

  // 5. Đĩa ngọc, Bát lắc khổng lồ & 3 Xúc Xắc 3D
  const plateMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.2, metalness: 0.15 });
  const plate = new THREE.Mesh(new THREE.CylinderGeometry(1.15, 0.95, 0.12, 24), plateMat);
  plate.position.y = 0.51;
  bauCuaBoothGroup.add(plate);

  const bowlGroup = new THREE.Group();
  bowlGroup.position.set(0, 0.56, 0);
  const bowlMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.25, metalness: 0.45 });
  const bowl = new THREE.Mesh(new THREE.SphereGeometry(0.92, 20, 16, 0, Math.PI * 2, 0, Math.PI * 0.52), bowlMat);
  bowl.rotation.x = Math.PI;
  bowl.position.y = 0.65;
  bowlGroup.add(bowl);
  const bowlHandle = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.16, 12), goldMat);
  bowlHandle.position.y = 0.72;
  bowlGroup.add(bowlHandle);
  bauCuaBoothGroup.add(bowlGroup);
  bauCuaBowlMesh = bowlGroup;

  bauCuaDiceMeshes = [];
  const diceMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.25 });
  [{ x: -0.28, z: -0.16 }, { x: 0.28, z: -0.16 }, { x: 0, z: 0.3 }].forEach((dp) => {
    const dMesh = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.34, 0.34), diceMat);
    dMesh.position.set(dp.x, 0.68, dp.z);
    bauCuaBoothGroup.add(dMesh);
    bauCuaDiceMeshes.push(dMesh);
  });

  // 6. 6 Đại Tượng Linh Vật 3D (Nai, Bầu, Gà, Cá, Cua, Tôm) tại bán kính 5.6m gọn gàng trong khuôn viên
  const mascotConfigs = [
    { angle: -Math.PI * 0.78, color: 0xd97706, label: "🦌 NAI LỘC", geo: 'cone' },
    { angle: -Math.PI * 0.5,  color: 0x10b981, label: "🎃 BẦU TIÊN", geo: 'gourd' },
    { angle: -Math.PI * 0.22, color: 0xfacc15, label: "🐓 GÀ VÀNG", geo: 'sphere' },
    { angle:  Math.PI * 0.78, color: 0x38bdf8, label: "🐟 CÁ CHÉP", geo: 'octa' },
    { angle:  Math.PI * 0.22, color: 0xef4444, label: "🦀 CUA ĐẾ", geo: 'torus' },
    { angle:  Math.PI * 0.5,  color: 0xf97316, label: "🦐 TÔM RỒNG", geo: 'cylinder' },
  ];
  mascotConfigs.forEach((mc) => {
    const mx = Math.cos(mc.angle) * 5.6;
    const mz = Math.sin(mc.angle) * 5.6;
    const ped = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.58, 1.0, 12), darkWoodMat);
    ped.position.set(mx, 0.5, mz);
    bauCuaBoothGroup.add(ped);

    const totemMat = new THREE.MeshStandardMaterial({
      color: mc.color,
      metalness: 0.55,
      roughness: 0.22,
      emissive: mc.color,
      emissiveIntensity: 0.28,
    });
    let mascotMesh;
    if (mc.geo === 'gourd') {
      mascotMesh = new THREE.Group();
      const b1 = new THREE.Mesh(new THREE.SphereGeometry(0.42, 12, 12), totemMat);
      const b2 = new THREE.Mesh(new THREE.SphereGeometry(0.3, 12, 12), totemMat);
      b2.position.y = 0.45;
      mascotMesh.add(b1, b2);
    } else if (mc.geo === 'torus') {
      mascotMesh = new THREE.Mesh(new THREE.TorusGeometry(0.38, 0.15, 10, 16), totemMat);
    } else if (mc.geo === 'octa') {
      mascotMesh = new THREE.Mesh(new THREE.OctahedronGeometry(0.48, 1), totemMat);
    } else {
      mascotMesh = new THREE.Mesh(new THREE.SphereGeometry(0.44, 12, 12), totemMat);
    }
    mascotMesh.position.set(mx, 1.45, mz);
    bauCuaBoothGroup.add(mascotMesh);

    const tag = createTextSprite(mc.label, "#fef08a", "rgba(127, 29, 29, 0.94)");
    tag.position.set(mx, 2.25, mz);
    tag.scale.set(2.3, 0.58, 1);
    bauCuaBoothGroup.add(tag);
  });

  // 7. Cặp Trống Hội Khai Xuân ở lối vào phía Nam (-2.8, 3.4) và (2.8, 3.4)
  [-2.8, 2.8].forEach((dx) => {
    const drumGroup = new THREE.Group();
    drumGroup.position.set(dx, 0, 3.4);
    const stand = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.75, 0.85), darkWoodMat);
    stand.position.y = 0.38;
    drumGroup.add(stand);

    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.95, 16), redLacquerMat);
    barrel.rotation.x = Math.PI / 2;
    barrel.position.y = 1.05;
    drumGroup.add(barrel);

    const drumHead = new THREE.Mesh(
      new THREE.CylinderGeometry(0.52, 0.52, 1.0, 16),
      new THREE.MeshStandardMaterial({ color: 0xfef3c7, roughness: 0.6 })
    );
    drumHead.rotation.x = Math.PI / 2;
    drumHead.position.y = 1.05;
    drumGroup.add(drumHead);
    bauCuaBoothGroup.add(drumGroup);
  });

  // 8. Cổng Chào Lễ Hội Dân Gian & Hàng Rào Lan Can Gỗ Thếp Vàng Ngăn Cách Riêng Biệt
  const gateGroup = new THREE.Group();
  gateGroup.position.set(0, 0, 5.8);
  [-2.2, 2.2].forEach((gx) => {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 4.2, 12), redLacquerMat);
    post.position.set(gx, 2.1, 0);
    gateGroup.add(post);

    const postCap = new THREE.Mesh(new THREE.ConeGeometry(0.35, 0.45, 8), goldMat);
    postCap.position.set(gx, 4.4, 0);
    gateGroup.add(postCap);
  });

  const gateBeam = new THREE.Mesh(new THREE.BoxGeometry(4.8, 0.35, 0.35), darkWoodMat);
  gateBeam.position.set(0, 3.9, 0);
  gateGroup.add(gateBeam);

  const gateRoof = new THREE.Mesh(new THREE.ConeGeometry(3.6, 0.9, 4), redLacquerMat);
  gateRoof.rotation.y = Math.PI / 4;
  gateRoof.position.set(0, 4.65, 0);
  gateGroup.add(gateRoof);

  const gateSign = createTextSprite("🏮 CỔNG KHU TRÒ CHƠI DÂN GIAN — SỚI BẦU CUA 🏮", "#fef08a", "rgba(185, 28, 28, 0.98)");
  gateSign.position.set(0, 5.5, 0);
  gateSign.scale.set(6.4, 1.15, 1);
  gateGroup.add(gateSign);
  bauCuaBoothGroup.add(gateGroup);

  // Lan can hàng rào gỗ trang trí bao quanh khu vực sới hội
  for (let f = 1; f < 8; f++) {
    const fa = (f / 8) * Math.PI * 2 + Math.PI / 8;
    const fx = Math.cos(fa) * 5.8;
    const fz = Math.sin(fa) * 5.8;
    const fencePost = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 1.3, 8), darkWoodMat);
    fencePost.position.set(fx, 0.65, fz);
    bauCuaBoothGroup.add(fencePost);

    const rail = new THREE.Mesh(new THREE.BoxGeometry(3.0, 0.1, 0.1), goldMat);
    rail.position.set(fx * 0.94, 0.82, fz * 0.94);
    rail.rotation.y = fa + Math.PI / 2;
    bauCuaBoothGroup.add(rail);
  }

  // Lối đi lát gạch đỏ hoa văn kết nối ra đại lộ trung tâm
  const pathMat = new THREE.MeshStandardMaterial({ color: 0x991b1b, roughness: 0.7 });
  for (let pStep = 0; pStep < 4; pStep++) {
    const stepMesh = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.05, 0.85), pathMat);
    stepMesh.position.set(0, 0.05, 6.2 + pStep * 0.95);
    bauCuaBoothGroup.add(stepMesh);
  }

  const sign = createTextSprite("🎲 ĐẠI LẦU HỘI BẦU CUA TÔM CÁ DÂN GIAN 🎲", "#fef08a", "rgba(185, 28, 28, 0.96)");
  sign.position.set(0, 5.4, 0);
  sign.scale.set(8.6, 1.5, 1);
  bauCuaBoothGroup.add(sign);

  const subSign = createTextSprite("[Bấm E hoặc Chạm vào Đại Chiếu Cược để Đặt Cược & Lắc Bát]", "#38bdf8", "rgba(15, 23, 42, 0.92)");
  subSign.position.set(0, 4.1, 0);
  subSign.scale.set(6.2, 1.0, 1);
  bauCuaBoothGroup.add(subSign);

  scene.add(bauCuaBoothGroup);
}

let teaTableGroup = null;
let teaStoolMeshes = [];

function buildSidewalkTeaTable(x, z) {
  teaTableGroup = new THREE.Group();
  teaTableGroup.position.set(x, 0, z);

  // 1. Đại Quảng Trường Gạch Bông Vỉa Hè Phố Cổ Mở Rộng (21.5m x 13.2m)
  const tileCanvas = document.createElement('canvas');
  tileCanvas.width = 256;
  tileCanvas.height = 256;
  const tctx = tileCanvas.getContext('2d');
  tctx.fillStyle = '#fef3c7';
  tctx.fillRect(0, 0, 256, 256);
  tctx.fillStyle = '#b45309';
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      if ((r + c) % 2 === 0) tctx.fillRect(c * 64, r * 64, 64, 64);
    }
  }
  const tileTex = new THREE.CanvasTexture(tileCanvas);
  tileTex.wrapS = THREE.RepeatWrapping;
  tileTex.wrapT = THREE.RepeatWrapping;
  tileTex.repeat.set(9, 6);

  const patioFloor = new THREE.Mesh(
    new THREE.BoxGeometry(21.5, 0.08, 13.2),
    new THREE.MeshStandardMaterial({ map: tileTex, roughness: 0.75 })
  );
  patioFloor.position.set(0, 0.04, 0.6);
  patioFloor.receiveShadow = true;
  teaTableGroup.add(patioFloor);

  // 2. 8 Cụm Bàn Trà Đá + Ô Dù + Bình Thủy + Ấm Chén + 34 Ghế Nhựa Song Long
  teaStoolMeshes = [];
  const darkWoodMat = new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.72 });
  const poleMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.6 });
  const legMat = new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.5 });
  const thermosMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.3 });
  const potMat = new THREE.MeshStandardMaterial({ color: 0x059669, roughness: 0.2 });
  const glassMat = new THREE.MeshStandardMaterial({
    color: 0x86efac,
    transparent: true,
    opacity: 0.8,
    roughness: 0.1,
  });

  const tableClusters = [
    { cx: 0,    cz: 0,    umbColor: 0x0284c7, tblColor: 0x0369a1, stoolColor: 0xdc2626, scale: 1.2 },
    { cx: -3.4, cz: -2.0, umbColor: 0xe11d48, tblColor: 0x1d4ed8, stoolColor: 0x2563eb, scale: 0.98 },
    { cx: 3.4,  cz: -2.0, umbColor: 0xd97706, tblColor: 0x047857, stoolColor: 0xdc2626, scale: 0.98 },
    { cx: 0,    cz: 3.2,  umbColor: 0x7c3aed, tblColor: 0xb45309, stoolColor: 0x2563eb, scale: 0.98 },
    { cx: -3.6, cz: 3.4,  umbColor: 0x10b981, tblColor: 0x0f766e, stoolColor: 0xdc2626, scale: 0.95 },
    { cx: 3.6,  cz: 3.4,  umbColor: 0xf43f5e, tblColor: 0x9333ea, stoolColor: 0x2563eb, scale: 0.95 },
    { cx: -7.8, cz: 3.2,  umbColor: 0xf59e0b, tblColor: 0x1d4ed8, stoolColor: 0xdc2626, scale: 0.95 },
    { cx: 7.8,  cz: 3.2,  umbColor: 0x06b6d4, tblColor: 0xb91c1c, stoolColor: 0x2563eb, scale: 0.95 },
  ];

  tableClusters.forEach((tc, clusterIdx) => {
    const subGroup = new THREE.Group();
    subGroup.position.set(tc.cx, 0, tc.cz);

    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 4.2, 12), poleMat);
    pole.position.set(0, 2.1, 0);
    subGroup.add(pole);

    const umbrella = new THREE.Mesh(
      new THREE.ConeGeometry(2.45 * tc.scale, 0.88, 16),
      new THREE.MeshStandardMaterial({ color: tc.umbColor, roughness: 0.45 })
    );
    umbrella.position.set(0, 4.08, 0);
    subGroup.add(umbrella);

    const tabletop = new THREE.Mesh(
      new THREE.BoxGeometry(2.0 * tc.scale, 0.08, 1.25 * tc.scale),
      new THREE.MeshStandardMaterial({ color: tc.tblColor, roughness: 0.4 })
    );
    tabletop.position.y = 0.68;
    tabletop.castShadow = true;
    tabletop.receiveShadow = true;
    subGroup.add(tabletop);

    [[-0.85, -0.5], [0.85, -0.5], [-0.85, 0.5], [0.85, 0.5]].forEach(([lx, lz]) => {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.68, 8), legMat);
      leg.position.set(lx * tc.scale, 0.34, lz * tc.scale);
      subGroup.add(leg);
    });

    if (clusterIdx % 2 === 0) {
      const thermos = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.46, 14), thermosMat);
      thermos.position.set(-0.65, 0.92, -0.25);
      subGroup.add(thermos);
    }

    const teapot = new THREE.Mesh(new THREE.SphereGeometry(0.14, 14, 14), potMat);
    teapot.position.set(-0.22, 0.82, -0.18);
    subGroup.add(teapot);

    [[-0.22, 0.24], [0.22, 0.24], [0.35, -0.15], [0.6, 0.15]].forEach(([gx, gz]) => {
      const glass = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.05, 0.18, 12), glassMat);
      glass.position.set(gx, 0.8, gz);
      subGroup.add(glass);
    });

    const seedPlate = new THREE.Mesh(
      new THREE.CylinderGeometry(0.2, 0.16, 0.04, 14),
      new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.6 })
    );
    seedPlate.position.set(0.15, 0.74, -0.15);
    subGroup.add(seedPlate);

    const stoolMat = new THREE.MeshStandardMaterial({ color: tc.stoolColor, roughness: 0.4 });
    const stoolOffsets =
      clusterIdx === 0
        ? [
            { x: -1.35, z: 0, rot: Math.PI / 2 },
            { x: 1.35,  z: 0, rot: -Math.PI / 2 },
            { x: -0.65, z: 0.95, rot: 0 },
            { x: 0.65,  z: 0.95, rot: 0 },
            { x: -0.65, z: -0.95, rot: Math.PI },
            { x: 0.65,  z: -0.95, rot: Math.PI },
          ]
        : [
            { x: -1.15, z: 0, rot: Math.PI / 2 },
            { x: 1.15,  z: 0, rot: -Math.PI / 2 },
            { x: 0,     z: 0.88, rot: 0 },
            { x: 0,     z: -0.88, rot: Math.PI },
          ];

    stoolOffsets.forEach((pos) => {
      const stool = new THREE.Group();
      stool.position.set(tc.cx + pos.x, 0, tc.cz + pos.z);
      stool.rotation.y = pos.rot;

      const seat = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.05, 0.42), stoolMat);
      seat.position.y = 0.32;
      seat.castShadow = true;
      stool.add(seat);

      const hole = new THREE.Mesh(
        new THREE.BoxGeometry(0.1, 0.06, 0.1),
        new THREE.MeshStandardMaterial({ color: 0x1e293b })
      );
      hole.position.y = 0.32;
      stool.add(hole);

      [[-0.17, -0.17], [0.17, -0.17], [-0.17, 0.17], [0.17, 0.17]].forEach(([sx, sz]) => {
        const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.032, 0.32, 8), stoolMat);
        leg.position.set(sx, 0.16, sz);
        stool.add(leg);
      });

      teaTableGroup.add(stool);
      teaStoolMeshes.push(stool);
    });

    teaTableGroup.add(subGroup);
  });

  // 3. Xe Trà Chanh Giã Tay & Nước Mía Siêu Sạch bên trái (-6.2, 0)
  const cartGroup = new THREE.Group();
  cartGroup.position.set(-6.2, 0, 0);
  const woodCartMat = new THREE.MeshStandardMaterial({ color: 0x92400e, roughness: 0.65 });
  const cartBody = new THREE.Mesh(new THREE.BoxGeometry(1.9, 1.1, 2.8), woodCartMat);
  cartBody.position.y = 0.85;
  cartBody.castShadow = true;
  cartGroup.add(cartBody);

  const cartRoof = new THREE.Mesh(
    new THREE.ConeGeometry(1.95, 0.82, 4),
    new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.5 })
  );
  cartRoof.rotation.y = Math.PI / 4;
  cartRoof.position.y = 2.65;
  cartGroup.add(cartRoof);

  const wheelMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.8 });
  [[-0.98, -0.9], [0.98, -0.9], [-0.98, 0.9], [0.98, 0.9]].forEach(([wx, wz]) => {
    const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.38, 0.12, 16), wheelMat);
    wheel.rotation.z = Math.PI / 2;
    wheel.position.set(wx, 0.38, wz);
    cartGroup.add(wheel);
  });

  const cartSign = createTextSprite("🍋 XE TRÀ CHANH & NƯỚC MÍA SIÊU SẠCH", "#fef08a", "rgba(21, 128, 61, 0.95)");
  cartSign.position.set(0, 3.35, 0);
  cartSign.scale.set(4.6, 0.9, 1);
  cartGroup.add(cartSign);
  teaTableGroup.add(cartGroup);

  // 4. Đại Sân Khấu Nhạc Acoustic Vỉa Hè bên phải (6.2, 0)
  const stageGroup = new THREE.Group();
  stageGroup.position.set(6.2, 0, 0);
  const stageDeck = new THREE.Mesh(
    new THREE.CylinderGeometry(2.1, 2.25, 0.32, 20),
    new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.7 })
  );
  stageDeck.position.y = 0.16;
  stageGroup.add(stageDeck);

  const stageArch = new THREE.Mesh(
    new THREE.TorusGeometry(2.0, 0.08, 10, 24, Math.PI),
    new THREE.MeshBasicMaterial({ color: 0xfacc15 })
  );
  stageArch.position.set(0, 0.32, -0.8);
  stageGroup.add(stageArch);

  const cajon = new THREE.Mesh(
    new THREE.BoxGeometry(0.48, 0.56, 0.48),
    new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.5 })
  );
  cajon.position.set(-0.55, 0.58, -0.2);
  stageGroup.add(cajon);

  const micStand = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.5, 8), poleMat);
  micStand.position.set(0.2, 1.05, 0.35);
  stageGroup.add(micStand);

  const guitarBody = new THREE.Mesh(
    new THREE.SphereGeometry(0.35, 12, 12),
    new THREE.MeshStandardMaterial({ color: 0xb45309, roughness: 0.35 })
  );
  guitarBody.scale.set(1, 1.35, 0.35);
  guitarBody.position.set(0.68, 0.76, -0.2);
  stageGroup.add(guitarBody);

  const stageSign = createTextSprite("🎸 SÂN KHẤU ACOUSTIC ĐÊM PHỐ", "#fef08a", "rgba(124, 58, 237, 0.95)");
  stageSign.position.set(0, 3.1, 0);
  stageSign.scale.set(4.5, 0.9, 1);
  stageGroup.add(stageSign);
  teaTableGroup.add(stageGroup);

  // 9. Cổng Chào Phố Trà Đá & Bồn Hoa Gạch Viền Phân Cách Khu Vực Riêng Biệt
  const teaGateGroup = new THREE.Group();
  teaGateGroup.position.set(0, 0, -6.2);
  [-3.2, 3.2].forEach((gx) => {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 4.0, 10), darkWoodMat);
    post.position.set(gx, 2.0, 0);
    teaGateGroup.add(post);

    const postLantern = new THREE.Mesh(
      new THREE.SphereGeometry(0.28, 10, 10),
      new THREE.MeshStandardMaterial({ color: 0xfacc15, emissive: 0xb45309, emissiveIntensity: 0.85 })
    );
    postLantern.position.set(gx, 4.2, 0);
    teaGateGroup.add(postLantern);
  });

  const teaGateBeam = new THREE.Mesh(new THREE.BoxGeometry(6.8, 0.28, 0.28), darkWoodMat);
  teaGateBeam.position.set(0, 3.8, 0);
  teaGateGroup.add(teaGateBeam);

  const teaGateSign = createTextSprite("☕ CỔNG PHỐ VĂN HÓA TRÀ ĐÁ VỈA HÈ & ACOUSTIC ☕", "#fef08a", "rgba(180, 83, 9, 0.98)");
  teaGateSign.position.set(0, 4.7, 0);
  teaGateSign.scale.set(6.8, 1.15, 1);
  teaGateGroup.add(teaGateSign);
  teaTableGroup.add(teaGateGroup);

  // Bồn hoa gạch viền trang trí quanh sân gạch trà đá
  const planterMat = new THREE.MeshStandardMaterial({ color: 0x9a3412, roughness: 0.75 });
  const bushMat = new THREE.MeshStandardMaterial({ color: 0x16a34a, roughness: 0.6 });
  [
    { x: -10.5, z: 0, w: 0.8, d: 12.5 },
    { x: 10.5, z: 0, w: 0.8, d: 12.5 },
    { x: -5.5, z: -6.0, w: 9.0, d: 0.8 },
    { x: 5.5, z: -6.0, w: 9.0, d: 0.8 },
    { x: 0, z: 7.0, w: 20.0, d: 0.8 },
  ].forEach((pb) => {
    const box = new THREE.Mesh(new THREE.BoxGeometry(pb.w, 0.35, pb.d), planterMat);
    box.position.set(pb.x, 0.18, pb.z);
    teaTableGroup.add(box);

    const plant = new THREE.Mesh(new THREE.BoxGeometry(pb.w * 0.92, 0.45, pb.d * 0.92), bushMat);
    plant.position.set(pb.x, 0.45, pb.z);
    teaTableGroup.add(plant);
  });

  const sign = createTextSprite("☕ ĐẠI QUẢNG TRƯỜNG TRÀ ĐÁ & PHỐ ĐI BỘ ACOUSTIC ☕", "#fef08a", "rgba(185, 28, 28, 0.95)");
  sign.position.set(0, 5.2, 0);
  sign.scale.set(8.6, 1.4, 1);
  teaTableGroup.add(sign);

  const subSign = createTextSprite("[Bấm E hoặc Chạm để Ngồi 8 Cụm Bàn Trà Đá, Cắn Hướng Dương & Cụng Ly 🍻]", "#38bdf8", "rgba(15, 23, 42, 0.9)");
  subSign.position.set(0, 4.0, 0);
  subSign.scale.set(6.4, 0.95, 1);
  teaTableGroup.add(subSign);

  scene.add(teaTableGroup);
}

let riversidePierGroup = null;
let cultureHallGroup = null;
let playerHouseGroup = null;
let sampanBoatMesh = null;
let petDogMesh = null;
let petDogData = { animTime: 0, barkTimer: 0, isSitting: false };

function buildRiversidePier(x, z) {
  riversidePierGroup = new THREE.Group();
  riversidePierGroup.position.set(x, 0, z);

  const waterGeo = new THREE.PlaneGeometry(88, 28);
  const waterMat = new THREE.MeshStandardMaterial({
    color: 0x0284c7,
    roughness: 0.15,
    metalness: 0.45,
    transparent: true,
    opacity: 0.88,
  });
  const water = new THREE.Mesh(waterGeo, waterMat);
  water.rotation.x = -Math.PI / 2;
  water.position.set(0, -0.06, 9.5);
  water.receiveShadow = true;
  riversidePierGroup.add(water);

  const bankMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.8 });
  const bank = new THREE.Mesh(new THREE.BoxGeometry(88, 0.45, 2.2), bankMat);
  bank.position.set(0, 0.12, -3.5);
  bank.receiveShadow = true;
  riversidePierGroup.add(bank);

  const reedMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.7 });
  for (let i = -38; i <= 38; i += 4.5) {
    if (Math.abs(i) < 4.5) continue;
    const reed = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.08, 1.6, 6), reedMat);
    reed.position.set(i + (Math.random() - 0.5) * 1.5, 0.7, -2.4 + (Math.random() - 0.5) * 1.0);
    reed.rotation.z = (Math.random() - 0.5) * 0.25;
    riversidePierGroup.add(reed);
  }

  const woodMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.75 });
  const deck = new THREE.Mesh(new THREE.BoxGeometry(6.6, 0.22, 15.5), woodMat);
  deck.position.set(0, 0.18, 4.5);
  deck.castShadow = true;
  deck.receiveShadow = true;
  riversidePierGroup.add(deck);

  const postMat = new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.85 });
  const postGeo = new THREE.CylinderGeometry(0.12, 0.14, 2.4, 8);
  [[-3.1, -2], [3.1, -2], [-3.1, 4], [3.1, 4], [-3.1, 11], [3.1, 11]].forEach(([px, pz]) => {
    const p = new THREE.Mesh(postGeo, postMat);
    p.position.set(px, 0.5, pz);
    riversidePierGroup.add(p);
  });

  const ropeMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.9 });
  const ropeL = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 13.5, 8), ropeMat);
  ropeL.rotation.x = Math.PI / 2;
  ropeL.position.set(-3.1, 0.85, 4.5);
  riversidePierGroup.add(ropeL);
  const ropeR = ropeL.clone();
  ropeR.position.x = 3.1;
  riversidePierGroup.add(ropeR);

  const lanternMat = new THREE.MeshStandardMaterial({
    color: 0xdc2626,
    emissive: 0xb91c1c,
    emissiveIntensity: 0.8,
  });
  [[-3.1, 11], [3.1, 11]].forEach(([lx, lz]) => {
    const lantern = new THREE.Mesh(new THREE.SphereGeometry(0.24, 12, 12), lanternMat);
    lantern.scale.set(1, 1.35, 1);
    lantern.position.set(lx, 1.45, lz);
    riversidePierGroup.add(lantern);
  });

  const boatGroup = new THREE.Group();
  boatGroup.position.set(5.8, 0.08, 8.5);

  const hullMat = new THREE.MeshStandardMaterial({ color: 0x854d0e, roughness: 0.65 });
  const hull = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.65, 5.2, 10), hullMat);
  hull.rotation.x = Math.PI / 2;
  hull.scale.set(1, 1, 0.5);
  boatGroup.add(hull);

  const melonMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.3 });
  const melon = new THREE.Mesh(new THREE.SphereGeometry(0.26, 12, 12), melonMat);
  melon.position.set(0, 0.35, -0.6);
  boatGroup.add(melon);

  const bananaMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.4 });
  const banana = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 0.45, 8), bananaMat);
  banana.rotation.z = 0.5;
  banana.position.set(0.1, 0.32, 0.6);
  boatGroup.add(banana);

  const oar = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 4.2, 8), woodMat);
  oar.rotation.set(0.4, 0.2, 1.2);
  oar.position.set(0, 0.45, 0);
  boatGroup.add(oar);

  sampanBoatMesh = boatGroup;
  riversidePierGroup.add(boatGroup);

  const hutGroup = new THREE.Group();
  hutGroup.position.set(-1.8, 0, 10.5);

  const thatchMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.95 });
  const thatchRoof = new THREE.Mesh(new THREE.ConeGeometry(2.4, 1.2, 8), thatchMat);
  thatchRoof.position.y = 2.9;
  hutGroup.add(thatchRoof);

  const bambooMat = new THREE.MeshStandardMaterial({ color: 0xa16207, roughness: 0.6 });
  [[-1.1, -1.1], [1.1, -1.1], [-1.1, 1.1], [1.1, 1.1]].forEach(([bx, bz]) => {
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 2.8, 8), bambooMat);
    pole.position.set(bx, 1.4, bz);
    hutGroup.add(pole);
  });

  const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.04, 3.8, 8), bambooMat);
  rod.rotation.x = -0.75;
  rod.position.set(0.6, 1.2, 1.8);
  hutGroup.add(rod);

  riversidePierGroup.add(hutGroup);

  const sign = createTextSprite("🎣 BẾN SÔNG QUÊ — CÂU CÁ THƯ GIÃN 🎣", "#bae6fd", "rgba(12, 74, 110, 0.95)");
  sign.position.set(0, 3.8, -1.8);
  sign.scale.set(6.6, 1.2, 1);
  riversidePierGroup.add(sign);

  const subSign = createTextSprite("[Bấm E hoặc Chạm để Thả Cần Câu Cá]", "#fef08a", "rgba(15, 23, 42, 0.9)");
  subSign.position.set(0, 2.7, -1.8);
  subSign.scale.set(4.6, 0.8, 1);
  riversidePierGroup.add(subSign);

  scene.add(riversidePierGroup);
}

function buildCommunityCultureHall(x, z) {
  cultureHallGroup = new THREE.Group();
  cultureHallGroup.position.set(x, 0, z);

  const baseMat = new THREE.MeshStandardMaterial({ color: 0x991b1b, roughness: 0.75 });
  const base = new THREE.Mesh(new THREE.BoxGeometry(17, 0.5, 13), baseMat);
  base.position.y = 0.25;
  base.castShadow = true;
  base.receiveShadow = true;
  cultureHallGroup.add(base);

  const wallMat = new THREE.MeshStandardMaterial({ color: 0xfef08a, roughness: 0.65 });
  const hall = new THREE.Mesh(new THREE.BoxGeometry(14.5, 6.5, 9.5), wallMat);
  hall.position.y = 3.5;
  hall.castShadow = true;
  hall.receiveShadow = true;
  cultureHallGroup.add(hall);

  const columnMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.4 });
  const colGeo = new THREE.CylinderGeometry(0.24, 0.28, 6.2, 12);
  [[-6.2, 4.4], [-2.1, 4.4], [2.1, 4.4], [6.2, 4.4]].forEach(([cx, cz]) => {
    const col = new THREE.Mesh(colGeo, columnMat);
    col.position.set(cx, 3.3, cz);
    cultureHallGroup.add(col);
  });

  const roofMat = new THREE.MeshStandardMaterial({ color: 0xb91c1c, roughness: 0.55 });
  const roof = new THREE.Mesh(new THREE.ConeGeometry(12, 3.6, 4), roofMat);
  roof.rotation.y = Math.PI / 4;
  roof.position.y = 8.5;
  roof.castShadow = true;
  cultureHallGroup.add(roof);

  const poleMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.8, roughness: 0.2 });
  const flagPole = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 10.5, 12), poleMat);
  flagPole.position.set(7.5, 5.25, 5.5);
  cultureHallGroup.add(flagPole);

  const flagCanvas = document.createElement('canvas');
  flagCanvas.width = 256;
  flagCanvas.height = 170;
  const fctx = flagCanvas.getContext('2d');
  fctx.fillStyle = '#dc2626';
  fctx.fillRect(0, 0, 256, 170);
  fctx.fillStyle = '#facc15';
  fctx.font = 'bold 85px sans-serif';
  fctx.textAlign = 'center';
  fctx.textBaseline = 'middle';
  fctx.fillText('★', 128, 88);

  const flagTex = new THREE.CanvasTexture(flagCanvas);
  const flag = new THREE.Mesh(
    new THREE.PlaneGeometry(2.4, 1.6),
    new THREE.MeshStandardMaterial({ map: flagTex, side: THREE.DoubleSide })
  );
  flag.position.set(8.8, 9.2, 5.5);
  cultureHallGroup.add(flag);

  const speakerPole = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 6.8, 8), poleMat);
  speakerPole.position.set(-7.5, 3.4, 5.5);
  cultureHallGroup.add(speakerPole);

  const speakerMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.5 });
  const horn1 = new THREE.Mesh(new THREE.ConeGeometry(0.35, 0.7, 10), speakerMat);
  horn1.rotation.z = Math.PI / 2;
  horn1.position.set(-7.1, 6.2, 5.5);
  cultureHallGroup.add(horn1);
  const horn2 = new THREE.Mesh(new THREE.ConeGeometry(0.35, 0.7, 10), speakerMat);
  horn2.rotation.x = Math.PI / 2;
  horn2.position.set(-7.5, 6.2, 5.9);
  cultureHallGroup.add(horn2);

  const loaSign = createTextSprite("📢 LOA PHƯỜNG", "#fef08a", "rgba(185, 28, 28, 0.92)");
  loaSign.position.set(-7.5, 7.1, 5.5);
  loaSign.scale.set(2.4, 0.65, 1);
  cultureHallGroup.add(loaSign);

  const boardFrame = new THREE.Mesh(
    new THREE.BoxGeometry(4.8, 2.6, 0.25),
    new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.8 })
  );
  boardFrame.position.set(0, 2.6, 5.1);
  cultureHallGroup.add(boardFrame);

  const boardCanvas = document.createElement('canvas');
  boardCanvas.width = 512;
  boardCanvas.height = 256;
  const bctx = boardCanvas.getContext('2d');
  bctx.fillStyle = '#b45309';
  bctx.fillRect(0, 0, 512, 256);
  bctx.fillStyle = '#fef08a';
  bctx.font = 'bold 32px sans-serif';
  bctx.textAlign = 'center';
  bctx.fillText('📋 BẢNG TIN THỊ TRẤN', 256, 45);

  bctx.font = '22px sans-serif';
  bctx.fillStyle = '#ffffff';
  bctx.fillText('• 20h Tụ tập Cà phê / Bia hơi', 256, 95);
  bctx.fillText('• Thi câu cá Cá Chép Vàng Bến Sông', 256, 145);
  bctx.fillText('• Ai chơi Cờ Cá Ngựa / Bầu Cua ghé!', 256, 195);

  const boardTex = new THREE.CanvasTexture(boardCanvas);
  const boardContent = new THREE.Mesh(
    new THREE.PlaneGeometry(4.4, 2.2),
    new THREE.MeshStandardMaterial({ map: boardTex, roughness: 0.5 })
  );
  boardContent.position.set(0, 2.6, 5.25);
  cultureHallGroup.add(boardContent);

  const sign = createTextSprite("🏛️ NHÀ VĂN HÓA & BẢNG TIN SỰ KIỆN 🏛️", "#fef08a", "rgba(185, 28, 28, 0.95)");
  sign.position.set(0, 7.8, 4.6);
  sign.scale.set(7.2, 1.3, 1);
  cultureHallGroup.add(sign);

  const subSign = createTextSprite("[Bấm E hoặc Chạm để Mở Bảng Tin & Tổ Chức Sự Kiện]", "#38bdf8", "rgba(15, 23, 42, 0.9)");
  subSign.position.set(0, 0.9, 5.6);
  subSign.scale.set(5.2, 0.85, 1);
  cultureHallGroup.add(subSign);

  scene.add(cultureHallGroup);
}

function buildResidentialStreet(x, z) {
  playerHouseGroup = new THREE.Group();
  playerHouseGroup.position.set(x, 0, z);

  const sidewalkMat = new THREE.MeshStandardMaterial({ color: 0x7c2d12, roughness: 0.8 });
  const sidewalk = new THREE.Mesh(new THREE.BoxGeometry(17, 0.22, 34), sidewalkMat);
  sidewalk.position.set(0, 0.11, 0);
  sidewalk.receiveShadow = true;
  playerHouseGroup.add(sidewalk);

  const storeMat = new THREE.MeshStandardMaterial({ color: 0xfef08a, roughness: 0.65 });
  const roofMat = new THREE.MeshStandardMaterial({ color: 0xb91c1c, roughness: 0.55 });

  const shop1 = new THREE.Mesh(new THREE.BoxGeometry(6.5, 4.8, 6.2), storeMat);
  shop1.position.set(3.2, 2.4, -9);
  shop1.castShadow = true;
  playerHouseGroup.add(shop1);

  const roof1 = new THREE.Mesh(new THREE.ConeGeometry(5.2, 2.2, 4), roofMat);
  roof1.rotation.y = Math.PI / 4;
  roof1.position.set(3.2, 5.8, -9);
  playerHouseGroup.add(roof1);

  const sign1 = createTextSprite("🏪 TẠP HÓA BÀ NĂM", "#fef08a", "rgba(185, 28, 28, 0.9)");
  sign1.position.set(0, 4.4, -9);
  sign1.scale.set(3.8, 0.75, 1);
  playerHouseGroup.add(sign1);

  const shop2 = new THREE.Mesh(new THREE.BoxGeometry(6.5, 4.8, 6.2), new THREE.MeshStandardMaterial({ color: 0x93c5fd }));
  shop2.position.set(3.2, 2.4, 0);
  playerHouseGroup.add(shop2);

  const roof2 = new THREE.Mesh(new THREE.ConeGeometry(5.2, 2.2, 4), roofMat);
  roof2.rotation.y = Math.PI / 4;
  roof2.position.set(3.2, 5.8, 0);
  playerHouseGroup.add(roof2);

  const tireMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.9 });
  [0.2, 0.45, 0.7].forEach((ty) => {
    const tire = new THREE.Mesh(new THREE.TorusGeometry(0.35, 0.12, 8, 16), tireMat);
    tire.rotation.x = Math.PI / 2;
    tire.position.set(-0.6, ty, -1.8);
    playerHouseGroup.add(tire);
  });

  const tank = new THREE.Mesh(
    new THREE.CylinderGeometry(0.28, 0.28, 0.9, 12),
    new THREE.MeshStandardMaterial({ color: 0xdc2626 })
  );
  tank.position.set(-0.6, 0.65, 1.6);
  playerHouseGroup.add(tank);

  const sign2 = createTextSprite("🛵 SỬA XE MÁY ANH BA", "#fef08a", "rgba(30, 58, 138, 0.9)");
  sign2.position.set(0, 4.4, 0);
  sign2.scale.set(4.2, 0.75, 1);
  playerHouseGroup.add(sign2);

  const houseWallMat = new THREE.MeshStandardMaterial({ color: 0xfef9c3, roughness: 0.6 });
  const myHouse = new THREE.Mesh(new THREE.BoxGeometry(7.2, 5.2, 7.5), houseWallMat);
  myHouse.position.set(3.2, 2.6, 9.5);
  myHouse.castShadow = true;
  myHouse.receiveShadow = true;
  playerHouseGroup.add(myHouse);

  const myHouseRoof = new THREE.Mesh(new THREE.ConeGeometry(5.8, 2.6, 4), roofMat);
  myHouseRoof.rotation.y = Math.PI / 4;
  myHouseRoof.position.set(3.2, 6.4, 9.5);
  playerHouseGroup.add(myHouseRoof);

  const doorMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.7 });
  const door = new THREE.Mesh(new THREE.BoxGeometry(0.1, 2.4, 1.4), doorMat);
  door.position.set(-0.45, 1.3, 9.5);
  playerHouseGroup.add(door);

  const potMat = new THREE.MeshStandardMaterial({ color: 0xb45309, roughness: 0.8 });
  const maiPot1 = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.28, 0.5, 12), potMat);
  maiPot1.position.set(-0.6, 0.35, 8.2);
  playerHouseGroup.add(maiPot1);
  const maiFoliage1 = new THREE.Mesh(
    new THREE.SphereGeometry(0.48, 10, 10),
    new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.6 })
  );
  maiFoliage1.position.set(-0.6, 0.85, 8.2);
  playerHouseGroup.add(maiFoliage1);

  const maiPot2 = maiPot1.clone();
  maiPot2.position.set(-0.6, 0.35, 10.8);
  playerHouseGroup.add(maiPot2);
  const maiFoliage2 = maiFoliage1.clone();
  maiFoliage2.position.set(-0.6, 0.85, 10.8);
  playerHouseGroup.add(maiFoliage2);

  const houseSign = createTextSprite("🏠 CĂN NHÀ RIÊNG CỦA BẠN 🏠", "#fef08a", "rgba(185, 28, 28, 0.95)");
  houseSign.position.set(0, 5.2, 9.5);
  houseSign.scale.set(5.8, 1.1, 1);
  playerHouseGroup.add(houseSign);

  const subHouseSign = createTextSprite("[Bấm E hoặc Chạm để Vào Nhà & Trang Trí]", "#38bdf8", "rgba(15, 23, 42, 0.9)");
  subHouseSign.position.set(0, 4.1, 9.5);
  subHouseSign.scale.set(4.5, 0.75, 1);
  playerHouseGroup.add(subHouseSign);

  scene.add(playerHouseGroup);
}
