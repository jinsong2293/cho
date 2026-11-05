/* ==================== 4. THÚ CƯNG CHÓ CỎ VÀNG TRUNG THÀNH ==================== */
function initPetDog() {
  if (petDogMesh && petDogMesh.group) {
    scene.remove(petDogMesh.group);
  }

  const dogGroup = new THREE.Group();
  const furMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.65 });
  const darkMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.7 });
  const noseMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.2 });

  const body = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.42, 0.44), furMat);
  body.position.y = 0.46;
  body.castShadow = true;
  dogGroup.add(body);

  const headGroup = new THREE.Group();
  headGroup.position.set(0.44, 0.68, 0);

  const head = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.34, 0.32), furMat);
  headGroup.add(head);

  const snout = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.18, 0.22), darkMat);
  snout.position.set(0.24, -0.06, 0);
  headGroup.add(snout);

  const nose = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 8), noseMat);
  nose.position.set(0.36, -0.02, 0);
  headGroup.add(nose);

  const earL = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.22, 0.08), darkMat);
  earL.position.set(-0.06, 0.16, 0.18);
  earL.rotation.x = 0.35;
  headGroup.add(earL);

  const earR = earL.clone();
  earR.position.z = -0.18;
  earR.rotation.x = -0.35;
  headGroup.add(earR);

  const collar = new THREE.Mesh(
    new THREE.TorusGeometry(0.2, 0.04, 8, 16),
    new THREE.MeshStandardMaterial({ color: 0xdc2626 })
  );
  collar.rotation.y = Math.PI / 2;
  collar.position.set(-0.16, -0.1, 0);
  headGroup.add(collar);

  const bell = new THREE.Mesh(
    new THREE.SphereGeometry(0.06, 8, 8),
    new THREE.MeshStandardMaterial({ color: 0xfbbf24, metalness: 0.8 })
  );
  bell.position.set(0.06, -0.22, 0);
  headGroup.add(bell);

  dogGroup.add(headGroup);

  const legGeo = new THREE.BoxGeometry(0.12, 0.28, 0.12);
  const legFL = new THREE.Mesh(legGeo, furMat);
  legFL.position.set(0.26, 0.14, 0.16);
  dogGroup.add(legFL);

  const legFR = legFL.clone();
  legFR.position.z = -0.16;
  dogGroup.add(legFR);

  const legBL = legFL.clone();
  legBL.position.set(-0.26, 0.14, 0.16);
  dogGroup.add(legBL);

  const legBR = legFL.clone();
  legBR.position.set(-0.26, 0.14, -0.16);
  dogGroup.add(legBR);

  const tailGroup = new THREE.Group();
  tailGroup.position.set(-0.36, 0.56, 0);
  const tail = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.05, 0.38, 8), furMat);
  tail.rotation.z = -0.7;
  tail.position.set(-0.12, 0.12, 0);
  tailGroup.add(tail);
  dogGroup.add(tailGroup);

  const nameSprite = createTextSprite("🐕 Cún Vàng", "#fef08a", "rgba(15, 23, 42, 0.65)");
  nameSprite.position.set(0, 0.75, 0);
  nameSprite.scale.set(1.1, 0.28, 1);
  dogGroup.add(nameSprite);

  dogGroup.position.set(myPlayer.pos.x + 1.8, 0, myPlayer.pos.z + 1.2);
  scene.add(dogGroup);

  petDogMesh = {
    group: dogGroup,
    headGroup,
    tailGroup,
    legFL,
    legFR,
    legBL,
    legBR,
  };
}

function updatePetDog(dt, elapsedSec) {
  if (!petDogMesh || !myPlayer.mesh) return;

  const cur = petDogMesh.group.position;
  const targetX = myPlayer.pos.x;
  const targetZ = myPlayer.pos.z;
  const dx = targetX - cur.x;
  const dz = targetZ - cur.z;
  const dist = Math.hypot(dx, dz);

  const isFollowing = dist > 2.5;

  if (isFollowing) {
    const angle = Math.atan2(dx, dz);
    petDogMesh.group.rotation.y = angle - Math.PI / 2;

    const speed = myPlayer.hoverboard ? 12.8 : 5.8;
    cur.x += Math.cos(angle - Math.PI / 2) * speed * dt;
    cur.z += Math.sin(angle - Math.PI / 2) * speed * dt;

    const stride = Math.sin(elapsedSec * 16);
    petDogMesh.legFL.rotation.z = stride * 0.55;
    petDogMesh.legFR.rotation.z = -stride * 0.55;
    petDogMesh.legBL.rotation.z = -stride * 0.55;
    petDogMesh.legBR.rotation.z = stride * 0.55;

    petDogMesh.tailGroup.rotation.y = Math.sin(elapsedSec * 22) * 0.8;
  } else {
    petDogMesh.legFL.rotation.z = 0;
    petDogMesh.legFR.rotation.z = 0;
    petDogMesh.legBL.rotation.z = 0;
    petDogMesh.legBR.rotation.z = 0;
    petDogMesh.tailGroup.rotation.y = Math.sin(elapsedSec * 7) * 0.35;
    petDogMesh.headGroup.rotation.y = Math.sin(elapsedSec * 3) * 0.15;
  }
}

function callPetDog() {
  initAudio();
  playSound('fanfare');
  if (petDogMesh) {
    spawnFloatingPopup3D(
      petDogMesh.group.position.x,
      1.8,
      petDogMesh.group.position.z,
      "Gâu gâu! 🐕 (Cún Vàng mừng rỡ!)"
    );
    petDogMesh.group.position.y = 0.35;
    setTimeout(() => {
      if (petDogMesh) petDogMesh.group.position.y = 0;
    }, 280);
  }
  showToast("🐕 Cún Vàng chạy lại quấn quýt bên chân bạn, vẫy đuôi mừng rỡ!");
}

/* ==================== 5. HOẠT HỌA 3D BẦU CUA VÀ SÔNG NƯỚC ==================== */
function updateBauCua3DAnimation(dt, elapsedSec) {
  if (sampanBoatMesh) {
    sampanBoatMesh.position.y = 0.08 + Math.sin(elapsedSec * 1.8) * 0.04;
    sampanBoatMesh.rotation.z = Math.sin(elapsedSec * 1.4) * 0.03;
  }

  if (!bauCuaBoothGroup || !bauCuaBowlMesh || !worldState.bauCua) return;

  const state = worldState.bauCua.state;
  if (state === 'rolling') {
    bauCuaBowlMesh.position.set(0, 0.55 + Math.abs(Math.sin(elapsedSec * 32)) * 0.12, 0);
    bauCuaBowlMesh.rotation.z = Math.sin(elapsedSec * 36) * 0.18;
    bauCuaBowlMesh.rotation.x = Math.cos(elapsedSec * 30) * 0.14;

    bauCuaDiceMeshes.forEach((d, idx) => {
      d.rotation.x += dt * (10 + idx * 4);
      d.rotation.y += dt * (12 + idx * 3);
    });
  } else if (state === 'result') {
    bauCuaBowlMesh.position.y = THREE.MathUtils.lerp(bauCuaBowlMesh.position.y, 2.3, 0.12);
    bauCuaBowlMesh.position.x = THREE.MathUtils.lerp(bauCuaBowlMesh.position.x, 0.85, 0.1);
    bauCuaBowlMesh.rotation.z = THREE.MathUtils.lerp(bauCuaBowlMesh.rotation.z, 0.35, 0.1);
  } else {
    bauCuaBowlMesh.position.set(0.75, 0.55, 0.75);
    bauCuaBowlMesh.rotation.set(0, 0, 0.45);
  }
}

function createTrampolinePad(x, z, colorHex) {
  const group = new THREE.Group();
  group.position.set(x, 0.04, z);

  const frameMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.7, roughness: 0.25 });
  const goldMat = new THREE.MeshStandardMaterial({ color: 0xfbbf24, metalness: 0.8, roughness: 0.2 });

  const outerBase = new THREE.Mesh(new THREE.CylinderGeometry(1.95, 2.15, 0.22, 24), frameMat);
  outerBase.receiveShadow = true;
  group.add(outerBase);

  // 8 Lò xo nhún mạ vàng quanh viền đệm
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const spring = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.34, 8), goldMat);
    spring.position.set(Math.cos(a) * 1.75, 0.16, Math.sin(a) * 1.75);
    group.add(spring);
  }

  const mat = new THREE.MeshStandardMaterial({
    color: colorHex,
    emissive: colorHex,
    emissiveIntensity: 0.65,
    roughness: 0.25,
  });
  const pad = new THREE.Mesh(new THREE.CylinderGeometry(1.58, 1.58, 0.26, 24), mat);
  pad.position.y = 0.08;
  group.add(pad);

  const starRing = new THREE.Mesh(
    new THREE.RingGeometry(0.65, 0.85, 16),
    new THREE.MeshBasicMaterial({ color: 0xfef08a, side: THREE.DoubleSide })
  );
  starRing.rotation.x = -Math.PI / 2;
  starRing.position.y = 0.22;
  group.add(starRing);

  const floatRing = new THREE.Mesh(new THREE.TorusGeometry(1.68, 0.07, 10, 28), mat);
  floatRing.rotation.x = Math.PI / 2;
  floatRing.position.y = 0.38;
  group.add(floatRing);

  const label = createTextSprite("🎪 ĐỆM NHÚN SIÊU BẬT", "#fef08a", "rgba(185, 28, 28, 0.9)");
  label.position.set(0, 1.45, 0);
  label.scale.set(2.4, 0.55, 1);
  group.add(label);

  scene.add(group);
  jumpPadMeshes.push({ group, floatRing, x, z });
}

function buildLuckyLixiCrate() {
  supplyCrateGroup = new THREE.Group();

  const redMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.3, metalness: 0.2 });
  const goldMat = new THREE.MeshStandardMaterial({
    color: 0xfbbf24,
    emissive: 0xd97706,
    emissiveIntensity: 0.8,
    metalness: 0.7,
  });

  const crate = new THREE.Mesh(new THREE.BoxGeometry(1.05, 1.15, 1.05), redMat);
  crate.position.y = 0.8;
  crate.castShadow = true;
  supplyCrateGroup.add(crate);

  const ribbon = new THREE.Mesh(new THREE.BoxGeometry(1.12, 0.26, 1.12), goldMat);
  ribbon.position.y = 0.8;
  supplyCrateGroup.add(ribbon);

  const beamGeo = new THREE.CylinderGeometry(0.15, 0.55, 7, 12, 1, true);
  const beamMat = new THREE.MeshBasicMaterial({
    color: 0xfbbf24,
    transparent: true,
    opacity: 0.22,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const beam = new THREE.Mesh(beamGeo, beamMat);
  beam.position.y = 3.6;
  supplyCrateGroup.add(beam);

  const label = createTextSprite("🧧 LỘC CHỢ LÌ XÌ (CHẠY RA NHẶT)", "#fef08a", "rgba(185, 28, 28, 0.95)");
  label.position.set(0, 2.2, 0);
  supplyCrateGroup.add(label);

  supplyCrateGroup.userData = { crate, frame: ribbon };
  scene.add(supplyCrateGroup);
}

function createVietnameseTree(x, z, type) {
  const group = new THREE.Group();
  group.position.set(x, 0, z);

  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x5c4033, roughness: 0.8 });
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.48, 2.9, 8), trunkMat);
  trunk.position.y = 1.45;
  trunk.castShadow = true;
  group.add(trunk);

  let leafColor = 0x15803d;
  if (type === 'mai_vang') leafColor = 0xfacc15;
  else if (type === 'dao_tet') leafColor = 0xf472b6;
  else if (type === 'phuong_vi') leafColor = 0xef4444;

  const foliageMat = new THREE.MeshStandardMaterial({
    color: leafColor,
    roughness: 0.65,
    flatShading: true,
  });

  const c1 = new THREE.Mesh(new THREE.DodecahedronGeometry(1.65, 1), foliageMat);
  c1.position.y = 3.2;
  c1.castShadow = true;
  group.add(c1);

  const c2 = new THREE.Mesh(new THREE.DodecahedronGeometry(1.25, 1), foliageMat);
  c2.position.set(0.65, 3.85, 0.4);
  group.add(c2);

  const c3 = new THREE.Mesh(new THREE.DodecahedronGeometry(1.1, 1), foliageMat);
  c3.position.set(-0.55, 4.05, -0.35);
  group.add(c3);

  scene.add(group);
}

function buildVietnameseShophouses() {
  // Đã hợp nhất và quy hoạch hoàn chỉnh thành Đại Lộ Phố Cổ & Đại Lộ Thương Mại trong world-3d.js
}

/* ==================== CỘT ĐIỆN & DÂY ĐIỆN PHỐ THỊ VIỆT NAM ==================== */
function buildVietnameseUtilityPoles() {
  const poleCoords = [
    { x: -16, z: -24 },
    { x: -16, z:   0 },
    { x: -16, z:  24 },
    { x:  16, z: -24 },
    { x:  16, z:   0 },
    { x:  16, z:  24 },
  ];
  const poleMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.8 });
  const lampMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });
  const wireMat = new THREE.LineBasicMaterial({ color: 0x1e293b, transparent: true, opacity: 0.65 });

  poleCoords.forEach((p) => {
    const group = new THREE.Group();
    group.position.set(p.x, 0, p.z);

    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.22, 6.8, 10), poleMat);
    pole.position.y = 3.4;
    pole.castShadow = true;
    group.add(pole);

    const crossbar = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.12, 0.14), poleMat);
    crossbar.position.y = 6.3;
    group.add(crossbar);

    const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.2, 6), poleMat);
    arm.position.set(p.x < 0 ? 0.5 : -0.5, 5.6, 0);
    arm.rotation.z = Math.PI / 3;
    group.add(arm);

    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.22, 10, 10), lampMat);
    bulb.position.set(p.x < 0 ? 0.95 : -0.95, 5.3, 0);
    group.add(bulb);

    scene.add(group);
  });

  [[-16, -24, -16, 0], [-16, 0, -16, 24], [16, -24, 16, 0], [16, 0, 16, 24]].forEach(([x1, z1, x2, z2]) => {
    [-0.55, 0.55].forEach((offset) => {
      const pts = [];
      for (let i = 0; i <= 12; i++) {
        const t = i / 12;
        const px = THREE.MathUtils.lerp(x1, x2, t) + offset;
        const pz = THREE.MathUtils.lerp(z1, z2, t);
        const py = 6.3 - Math.sin(t * Math.PI) * 0.55;
        pts.push(new THREE.Vector3(px, py, pz));
      }
      const geo = new THREE.BufferGeometry().setFromPoints(pts);
      scene.add(new THREE.Line(geo, wireMat));
    });
  });
}

/* ==================== TỔ HỢP SÂN ĐÁ CẦU KIỂNG LIÊN PHƯỜNG (MULTIPLAYER SHUTTLECOCK ARENA) ==================== */
let shuttlecockCourtGroup = null;
let shuttlecockMesh = null;
let shuttlecockLabelSprite = null;
let shuttlecockShockwaveRing = null;
let shuttlecockAnim = {
  active: false,
  timer: 0,
  duration: 0.95,
  startPos: new THREE.Vector3(8, 0.35, -15),
  endPos: new THREE.Vector3(8, 0.35, -15),
  combo: 0,
  maxCombo: 0,
};

function buildShuttlecockCourt(x, z) {
  shuttlecockAnim.startPos.set(x, 0.35, z);
  shuttlecockAnim.endPos.set(x, 0.35, z);
  const group = new THREE.Group();
  group.position.set(x, 0, z);

  // 1. Đại Sân Đấu Đá Cầu Liên Phường Mở Rộng (Bán kính 7.4m + Đường chạy viền đỏ 8.2m)
  const outerTrack = new THREE.Mesh(
    new THREE.CircleGeometry(8.2, 48),
    new THREE.MeshStandardMaterial({ color: 0x991b1b, roughness: 0.78 })
  );
  outerTrack.rotation.x = -Math.PI / 2;
  outerTrack.position.y = 0.02;
  outerTrack.receiveShadow = true;
  group.add(outerTrack);

  const courtBase = new THREE.Mesh(
    new THREE.CircleGeometry(7.2, 44),
    new THREE.MeshStandardMaterial({ color: 0x064e3b, roughness: 0.72 })
  );
  courtBase.rotation.x = -Math.PI / 2;
  courtBase.position.y = 0.032;
  courtBase.receiveShadow = true;
  group.add(courtBase);

  const ringSpecs = [
    { rIn: 6.85, rOut: 7.2, color: 0xfef08a },
    { rIn: 4.9, rOut: 5.15, color: 0x34d399 },
    { rIn: 3.1, rOut: 3.3, color: 0x38bdf8 },
    { rIn: 1.5, rOut: 1.7, color: 0xfbbf24 },
  ];
  ringSpecs.forEach((rs) => {
    const rMesh = new THREE.Mesh(
      new THREE.RingGeometry(rs.rIn, rs.rOut, 40),
      new THREE.MeshBasicMaterial({ color: rs.color, side: THREE.DoubleSide })
    );
    rMesh.rotation.x = -Math.PI / 2;
    rMesh.position.y = 0.048;
    group.add(rMesh);
  });

  // 2 Sân Tập Tâng Cầu Phụ Hai Bên Cánh (Tây -5.2m & Đông +5.2m)
  [-5.2, 5.2].forEach((subX) => {
    const subCircle = new THREE.Mesh(
      new THREE.RingGeometry(1.35, 1.55, 28),
      new THREE.MeshBasicMaterial({ color: 0xfde047, side: THREE.DoubleSide })
    );
    subCircle.rotation.x = -Math.PI / 2;
    subCircle.position.set(subX, 0.05, 0.6);
    group.add(subCircle);
  });

  // Vòng sóng xung kích phát sáng khi tâng cầu (Shockwave Ring)
  shuttlecockShockwaveRing = new THREE.Mesh(
    new THREE.RingGeometry(0.6, 1.05, 36),
    new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.0,
    })
  );
  shuttlecockShockwaveRing.rotation.x = -Math.PI / 2;
  shuttlecockShockwaveRing.position.y = 0.065;
  group.add(shuttlecockShockwaveRing);

  // 2. Sân Đấu Lưới Đôi Liên Phường Mở Rộng (rộng 5.2m)
  const poleMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.7, roughness: 0.25 });
  [[-2.6, 2.8], [2.6, 2.8]].forEach(([px, pz]) => {
    const netPole = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.08, 1.85, 10), poleMat);
    netPole.position.set(px, 0.92, pz);
    group.add(netPole);
  });

  const netMesh = new THREE.Mesh(
    new THREE.BoxGeometry(5.2, 0.85, 0.04),
    new THREE.MeshStandardMaterial({
      color: 0x10b981,
      transparent: true,
      opacity: 0.58,
      roughness: 0.4,
    })
  );
  netMesh.position.set(0, 1.28, 2.8);
  group.add(netMesh);

  const netTopTape = new THREE.Mesh(
    new THREE.BoxGeometry(5.25, 0.09, 0.06),
    new THREE.MeshBasicMaterial({ color: 0xffffff })
  );
  netTopTape.position.set(0, 1.72, 2.8);
  group.add(netTopTape);

  // 3. Khán Đài Cổ Vũ 3 Bậc Mở Rộng (x = 0, z = -6.2) khớp với collider shuttlecock_bleacher_n
  const bleacherGroup = new THREE.Group();
  bleacherGroup.position.set(0, 0, -6.2);
  const stepColors = [0xdc2626, 0xd97706, 0x059669];
  for (let s = 0; s < 3; s++) {
    const bench = new THREE.Mesh(
      new THREE.BoxGeometry(8.2, 0.4 + s * 0.36, 0.65),
      new THREE.MeshStandardMaterial({ color: stepColors[s], roughness: 0.55 })
    );
    bench.position.set(0, (0.4 + s * 0.36) / 2, (1 - s) * 0.65);
    bench.castShadow = true;
    bench.receiveShadow = true;
    bleacherGroup.add(bench);
  }

  // Mái che khán đài & Cờ hội
  [[-3.8, -0.5], [3.8, -0.5]].forEach(([bx, bz]) => {
    const col = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 3.9, 10), poleMat);
    col.position.set(bx, 1.95, bz);
    bleacherGroup.add(col);
  });
  const canopy = new THREE.Mesh(
    new THREE.BoxGeometry(8.8, 0.2, 2.6),
    new THREE.MeshStandardMaterial({ color: 0xb91c1c, roughness: 0.5 })
  );
  canopy.position.set(0, 3.95, 0);
  canopy.rotation.x = 0.15;
  bleacherGroup.add(canopy);

  const cheerSign = createTextSprite("🎺 KHÁN ĐÀI CỔ VŨ ĐẠI HỘI ĐÁ CẦU LIÊN PHƯỜNG 🎺", "#fef08a", "rgba(185, 28, 28, 0.95)");
  cheerSign.position.set(0, 4.75, 0.2);
  cheerSign.scale.set(6.4, 1.08, 1);
  bleacherGroup.add(cheerSign);
  group.add(bleacherGroup);

  // 4. Tháp Trọng Tài, Cúp Vàng & Bảng Điện Tử Combo tại (6.2, -4.2) khớp với collider shuttlecock_referee_tower
  const towerGroup = new THREE.Group();
  towerGroup.position.set(6.2, 0, -4.2);
  const woodMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.7 });
  const goldMat = new THREE.MeshStandardMaterial({ color: 0xfbbf24, metalness: 0.8, roughness: 0.2 });

  const refPodium = new THREE.Mesh(new THREE.BoxGeometry(1.75, 1.55, 1.75), woodMat);
  refPodium.position.y = 0.78;
  refPodium.castShadow = true;
  towerGroup.add(refPodium);

  // Cúp Vàng Vô Địch Đá Cầu Cỡ Lớn
  const cupBase = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.45, 0.36, 12), goldMat);
  cupBase.position.set(0, 1.72, 0);
  towerGroup.add(cupBase);
  const cupBowl = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.22, 0.72, 16), goldMat);
  cupBowl.position.set(0, 2.22, 0);
  towerGroup.add(cupBowl);

  // Bảng điện tử LED
  const scoreBoard = new THREE.Mesh(
    new THREE.BoxGeometry(3.1, 1.55, 0.2),
    new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.3 })
  );
  scoreBoard.position.set(0, 3.55, 0);
  towerGroup.add(scoreBoard);

  const cupSign = createTextSprite("🏆 CÚP VÀNG ĐÁ CẦU", "#fef08a", "rgba(6, 78, 59, 0.95)");
  cupSign.position.set(0, 4.65, 0);
  cupSign.scale.set(3.8, 0.8, 1);
  towerGroup.add(cupSign);
  group.add(towerGroup);

  // 5. 4 Cột Đèn Cao Áp Sân Vận Động ở 4 góc sân
  [[-6.4, -4.8], [6.4, -4.8], [-6.4, 5.2], [6.4, 5.2]].forEach(([lx, lz]) => {
    const lightPole = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.12, 5.6, 8), poleMat);
    lightPole.position.set(lx, 2.8, lz);
    group.add(lightPole);
    const lampPanel = new THREE.Mesh(
      new THREE.BoxGeometry(0.95, 0.42, 0.25),
      new THREE.MeshBasicMaterial({ color: 0xfef9c3 })
    );
    lampPanel.position.set(lx, 5.65, lz);
    lampPanel.lookAt(x, 0.5, z);
    group.add(lampPanel);
  });

  // 6. Quả Cầu Kiểng 3D Cỡ Lớn Nhiều Tầng Lông Gà
  const scGroup = new THREE.Group();
  scGroup.position.set(0, 0.52, 0);

  const baseDisc1 = new THREE.Mesh(
    new THREE.CylinderGeometry(0.28, 0.28, 0.09, 16),
    new THREE.MeshStandardMaterial({ color: 0xdc2626, metalness: 0.5, roughness: 0.25 })
  );
  scGroup.add(baseDisc1);

  const baseDisc2 = new THREE.Mesh(
    new THREE.CylinderGeometry(0.24, 0.24, 0.08, 16),
    goldMat
  );
  baseDisc2.position.y = 0.09;
  scGroup.add(baseDisc2);

  const featherCrown = new THREE.Mesh(
    new THREE.ConeGeometry(0.48, 0.72, 12, 1, true),
    new THREE.MeshStandardMaterial({ color: 0xffffff, side: THREE.DoubleSide, roughness: 0.35 })
  );
  featherCrown.position.y = 0.42;
  featherCrown.rotation.x = Math.PI;
  scGroup.add(featherCrown);

  const featherTipRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.47, 0.035, 8, 16),
    new THREE.MeshBasicMaterial({ color: 0xfef08a })
  );
  featherTipRing.rotation.x = Math.PI / 2;
  featherTipRing.position.y = 0.76;
  scGroup.add(featherTipRing);

  group.add(scGroup);
  shuttlecockMesh = scGroup;

  // 7. Cổng Chào Khu Thể Thao & Hàng Rào Lưới Ngăn Cách Sân Đấu Riêng Biệt
  const sportsGateGroup = new THREE.Group();
  sportsGateGroup.position.set(-6.2, 0, 0);
  [-2.2, 2.2].forEach((gz) => {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.2, 4.2, 10), poleMat);
    post.position.set(0, 2.1, gz);
    sportsGateGroup.add(post);

    const postCap = new THREE.Mesh(new THREE.ConeGeometry(0.3, 0.45, 8), goldMat);
    postCap.position.set(0, 4.4, gz);
    sportsGateGroup.add(postCap);
  });

  const sportsBeam = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.35, 4.8), poleMat);
  sportsBeam.position.set(0, 4.0, 0);
  sportsGateGroup.add(sportsBeam);

  const sportsSign = createTextSprite("🪶 CỔNG KHU THỂ THAO — SÂN ĐÁ CẦU KIỂNG 🪶", "#fef08a", "rgba(6, 78, 59, 0.98)");
  sportsSign.position.set(0, 5.0, 0);
  sportsSign.rotation.y = Math.PI / 2;
  sportsSign.scale.set(6.4, 1.15, 1);
  sportsGateGroup.add(sportsSign);
  group.add(sportsGateGroup);

  // Hàng rào lưới bảo vệ quanh sân đấu đá cầu (chừa cổng vào phía Tây)
  const fenceMat = new THREE.MeshStandardMaterial({ color: 0x065f46, roughness: 0.65 });
  const railBarMat = new THREE.MeshStandardMaterial({ color: 0x10b981, roughness: 0.4 });
  for (let f = 0; f < 12; f++) {
    const fa = (f / 12) * Math.PI * 2;
    // Chừa khoảng trống ở góc Tây (-6.2m) làm cổng vào
    if (Math.cos(fa) < -0.65) continue;
    const fx = Math.cos(fa) * 7.5;
    const fz = Math.sin(fa) * 7.5;

    const fPost = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 1.5, 8), fenceMat);
    fPost.position.set(fx, 0.75, fz);
    group.add(fPost);

    const fRail = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.08, 0.08), railBarMat);
    fRail.position.set(fx * 0.93, 1.1, fz * 0.93);
    fRail.rotation.y = fa + Math.PI / 2;
    group.add(fRail);
  }

  // Lối đi lát đá thể thao kết nối ra đại lộ trung tâm
  const sportsPathMat = new THREE.MeshStandardMaterial({ color: 0x047857, roughness: 0.7 });
  for (let pStep = 0; pStep < 4; pStep++) {
    const stepMesh = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.05, 2.4), sportsPathMat);
    stepMesh.position.set(-6.6 - pStep * 0.95, 0.05, 0);
    group.add(stepMesh);
  }

  const sign = createTextSprite("🪶 TỔ HỢP SÂN VẬN ĐỘNG ĐÁ CẦU KIỂNG (Chạm / Phím K)", "#6ee7b7", "rgba(6, 78, 59, 0.95)");
  sign.position.set(0, 5.4, 0);
  sign.scale.set(7.4, 1.32, 1);
  group.add(sign);
  shuttlecockLabelSprite = sign;

  scene.add(group);
  shuttlecockCourtGroup = group;
}

function updateShuttlecock3D(dt, elapsedSec) {
  if (!shuttlecockMesh) return;
  if (shuttlecockAnim.active) {
    shuttlecockAnim.timer += dt;
    const t = Math.min(1, shuttlecockAnim.timer / shuttlecockAnim.duration);
    const localX = THREE.MathUtils.lerp(shuttlecockAnim.startPos.x, shuttlecockAnim.endPos.x, t);
    const localZ = THREE.MathUtils.lerp(shuttlecockAnim.startPos.z, shuttlecockAnim.endPos.z, t);
    const arcY = 0.52 + Math.sin(t * Math.PI) * 4.8;
    shuttlecockMesh.position.set(localX, arcY, localZ);
    shuttlecockMesh.rotation.z = Math.sin(t * Math.PI * 4) * 0.48;
    shuttlecockMesh.rotation.y += dt * 12;

    if (shuttlecockShockwaveRing) {
      const waveScale = 1 + t * 6.0;
      shuttlecockShockwaveRing.scale.set(waveScale, waveScale, 1);
      shuttlecockShockwaveRing.material.opacity = Math.max(0, (1 - t) * 0.78);
    }

    if (t >= 1) {
      shuttlecockAnim.active = false;
      shuttlecockMesh.position.y = 0.52;
      shuttlecockMesh.rotation.set(0, 0, 0);
      if (shuttlecockShockwaveRing) shuttlecockShockwaveRing.material.opacity = 0;
    }
  } else {
    shuttlecockMesh.position.y = 0.52 + Math.sin(elapsedSec * 4) * 0.07;
    shuttlecockMesh.rotation.y += dt * 2.0;
  }
}

function buildHoiAnLanternStrings() {
  const lanternColors = [0xef4444, 0xfbbf24, 0x10b981, 0xf43f5e, 0xf97316];
  const geo = new THREE.SphereGeometry(0.28, 10, 10);

  [-26, -14, 0, 14, 26].forEach((zRow) => {
    for (let i = 0; i < 18; i++) {
      const t = i / 17;
      const color = lanternColors[(i + Math.abs(zRow)) % lanternColors.length];
      const mat = new THREE.MeshStandardMaterial({
        color,
        emissive: color,
        emissiveIntensity: 0.75,
        roughness: 0.3,
      });
      const lantern = new THREE.Mesh(geo, mat);
      lantern.scale.set(1, 1.25, 1);
      lantern.position.set(-28 + t * 56, 4.8 - Math.sin(t * Math.PI) * 0.55, zRow);
      scene.add(lantern);
    }
  });
}

function initVietnameseStreetTraffic() {
  const bikeColors = [0xdc2626, 0x2563eb, 0x16a34a, 0xd97706, 0x9333ea, 0x0891b2];
  const patrolRings = [21, 24.5, 44, 48, 86, 92, 138, 144, 280, 578];
  for (let i = 0; i < 20; i++) {
    const vehicle = buildMotorbikeMesh(bikeColors[i % bikeColors.length]);
    const crate = new THREE.Mesh(
      new THREE.BoxGeometry(0.55, 0.45, 0.55),
      new THREE.MeshStandardMaterial({ color: 0xa16207, roughness: 0.8 })
    );
    crate.position.set(0, 0.65, -0.45);
    vehicle.add(crate);

    scene.add(vehicle);
    streetVehicles.push({
      mesh: vehicle,
      radius: patrolRings[i % patrolRings.length],
      speed: (i % 2 === 0 ? 1 : -1) * (0.14 + (i % 5) * 0.022),
      phase: (i * Math.PI) / 10,
    });
  }
}

function buildMotorbikeMesh(colorHex = 0xdc2626) {
  const bike = new THREE.Group();

  const paintMat = new THREE.MeshStandardMaterial({ color: colorHex, roughness: 0.3, metalness: 0.4 });
  const tireMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.8 });
  const seatMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.6 });

  const body = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.38, 1.25), paintMat);
  body.position.set(0, 0.36, 0);
  bike.add(body);

  const frontShield = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.65, 0.25), paintMat);
  frontShield.position.set(0, 0.58, 0.48);
  frontShield.rotation.x = -0.2;
  bike.add(frontShield);

  const headlight = new THREE.Mesh(
    new THREE.SphereGeometry(0.12, 8, 8),
    new THREE.MeshBasicMaterial({ color: 0xfef08a })
  );
  headlight.position.set(0, 0.82, 0.58);
  bike.add(headlight);

  const handlebar = new THREE.Mesh(
    new THREE.CylinderGeometry(0.03, 0.03, 0.75, 8),
    new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.8 })
  );
  handlebar.rotation.z = Math.PI / 2;
  handlebar.position.set(0, 0.84, 0.42);
  bike.add(handlebar);

  const seat = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.12, 0.68), seatMat);
  seat.position.set(0, 0.58, -0.15);
  bike.add(seat);

  const wheelGeo = new THREE.CylinderGeometry(0.24, 0.24, 0.14, 12);
  wheelGeo.rotateZ(Math.PI / 2);
  const wheelF = new THREE.Mesh(wheelGeo, tireMat);
  wheelF.position.set(0, 0.24, 0.52);
  bike.add(wheelF);

  const wheelB = new THREE.Mesh(wheelGeo, tireMat);
  wheelB.position.set(0, 0.24, -0.52);
  bike.add(wheelB);

  return bike;
}

/* ==================== HỆ THỐNG HẠT LÌ XÌ & TIỀN VÀNG ==================== */
function initParticles() {
  const count = 160;
  const geom = new THREE.BufferGeometry();
  const positions = new Float32Array(count * 3);
  const velocities = [];

  for (let i = 0; i < count; i++) {
    positions[i * 3] = 0;
    positions[i * 3 + 1] = -100;
    positions[i * 3 + 2] = 0;
    velocities.push({ x: 0, y: 0, z: 0, life: 0 });
  }

  geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const mat = new THREE.PointsMaterial({
    color: 0xfbbf24,
    size: 0.42,
    transparent: true,
    opacity: 0.95,
  });

  particleSystem = {
    points: new THREE.Points(geom, mat),
    velocities,
    count,
  };
  scene.add(particleSystem.points);
}

function triggerCoinParticles(x, y, z) {
  if (!particleSystem) return;
  const posAttr = particleSystem.points.geometry.attributes.position;
  for (let i = 0; i < 36; i++) {
    const idx = Math.floor(Math.random() * particleSystem.count);
    posAttr.setXYZ(idx, x + (Math.random() - 0.5) * 0.7, y + 1.2, z + (Math.random() - 0.5) * 0.7);
    particleSystem.velocities[idx] = {
      x: (Math.random() - 0.5) * 4.5,
      y: 4.0 + Math.random() * 4.5,
      z: (Math.random() - 0.5) * 4.5,
      life: 1.1,
    };
  }
  posAttr.needsUpdate = true;
}

function updateParticles(dt) {
  if (!particleSystem) return;
  const posAttr = particleSystem.points.geometry.attributes.position;
  let changed = false;

  for (let i = 0; i < particleSystem.count; i++) {
    const v = particleSystem.velocities[i];
    if (v.life > 0) {
      v.life -= dt * 1.1;
      v.y -= 9.8 * dt;
      const px = posAttr.getX(i) + v.x * dt;
      const py = Math.max(0.1, posAttr.getY(i) + v.y * dt);
      const pz = posAttr.getZ(i) + v.z * dt;
      posAttr.setXYZ(i, px, py, pz);
      changed = true;
    }
  }
  if (changed) posAttr.needsUpdate = true;
}

/* ==================== HỆ THỐNG PHÁO HOA LỄ HỘI BAN ĐÊM 3D (FIREWORKS PARTICLE SYSTEM) ==================== */
let fireworksParticleSystem = null;
let activeFireworkRockets = [];
let fireworkFlashLight = null;
let autoNightFireworkTimer = 1.8;
let timeOfDayOverride = null;

const FIREWORK_PALETTES = {
  mai_vang: [
    { r: 1.0, g: 0.95, b: 0.35 },
    { r: 1.0, g: 0.8,  b: 0.15 },
    { r: 0.95, g: 0.6, b: 0.05 },
    { r: 1.0, g: 1.0,  b: 0.8 }
  ],
  do_tet: [
    { r: 1.0, g: 0.15, b: 0.2 },
    { r: 0.9, g: 0.05, b: 0.1 },
    { r: 1.0, g: 0.45, b: 0.3 },
    { r: 1.0, g: 0.85, b: 0.85 }
  ],
  ngoc_bich: [
    { r: 0.1, g: 0.95, b: 0.65 },
    { r: 0.15, g: 0.8, b: 0.95 },
    { r: 0.05, g: 0.7, b: 0.45 },
    { r: 0.75, g: 1.0, b: 0.9 }
  ],
  pho_co: [
    { r: 0.95, g: 0.25, b: 0.85 },
    { r: 0.75, g: 0.35, b: 1.0 },
    { r: 0.55, g: 0.2,  b: 0.9 },
    { r: 1.0, g: 0.75,  b: 0.95 }
  ],
  ngu_sac: [
    { r: 1.0, g: 0.2,  b: 0.2 },
    { r: 1.0, g: 0.85, b: 0.15 },
    { r: 0.15, g: 0.9, b: 0.5 },
    { r: 0.2,  g: 0.75, b: 1.0 },
    { r: 0.9,  g: 0.3,  b: 0.9 }
  ]
};

function createSparkTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
  gradient.addColorStop(0.25, 'rgba(255, 250, 220, 0.95)');
  gradient.addColorStop(0.55, 'rgba(255, 180, 50, 0.45)');
  gradient.addColorStop(0.85, 'rgba(255, 70, 20, 0.12)');
  gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 64, 64);
  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  return texture;
}

function initFireworks3D() {
  const maxSparks = 1800;
  const geom = new THREE.BufferGeometry();
  const positions = new Float32Array(maxSparks * 3);
  const colors = new Float32Array(maxSparks * 3);

  for (let i = 0; i < maxSparks; i++) {
    positions[i * 3] = 0;
    positions[i * 3 + 1] = -200;
    positions[i * 3 + 2] = 0;
    colors[i * 3] = 1;
    colors[i * 3 + 1] = 0.85;
    colors[i * 3 + 2] = 0.3;
  }

  geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geom.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  const mat = new THREE.PointsMaterial({
    size: 0.92,
    map: createSparkTexture(),
    vertexColors: true,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });

  const points = new THREE.Points(geom, mat);
  scene.add(points);

  fireworkFlashLight = new THREE.PointLight(0xffedd5, 0, 75);
  fireworkFlashLight.position.set(0, 30, 0);
  scene.add(fireworkFlashLight);

  const sparkPool = [];
  for (let i = 0; i < maxSparks; i++) {
    sparkPool.push({
      active: false,
      x: 0, y: -200, z: 0,
      vx: 0, vy: 0, vz: 0,
      r: 1, g: 1, b: 1,
      life: 0, maxLife: 1,
      drag: 0.965,
      gravity: 6.8,
      isRocketTrail: false
    });
  }

  fireworksParticleSystem = {
    points,
    geom,
    positions,
    colors,
    maxSparks,
    sparkPool,
  };
}

function spawnSparkParticle(x, y, z, vx, vy, vz, r, g, b, lifetime, drag = 0.965, gravity = 6.8, isTrail = false) {
  if (!fireworksParticleSystem) return;
  const pool = fireworksParticleSystem.sparkPool;
  let spark = null;
  for (let i = 0; i < pool.length; i++) {
    if (!pool[i].active) {
      spark = pool[i];
      spark.idx = i;
      break;
    }
  }
  if (!spark) return;

  spark.active = true;
  spark.x = x;
  spark.y = y;
  spark.z = z;
  spark.vx = vx;
  spark.vy = vy;
  spark.vz = vz;
  spark.r = r;
  spark.g = g;
  spark.b = b;
  spark.life = lifetime;
  spark.maxLife = lifetime;
  spark.drag = drag;
  spark.gravity = gravity;
  spark.isRocketTrail = isTrail;

  const idx = spark.idx;
  fireworksParticleSystem.positions[idx * 3] = x;
  fireworksParticleSystem.positions[idx * 3 + 1] = y;
  fireworksParticleSystem.positions[idx * 3 + 2] = z;
  fireworksParticleSystem.colors[idx * 3] = r;
  fireworksParticleSystem.colors[idx * 3 + 1] = g;
  fireworksParticleSystem.colors[idx * 3 + 2] = b;
}

function launchFireworkRocket(startX, startZ, targetX, targetY, targetZ, paletteName = 'random') {
  initAudio();
  playSound('firework_whistle');

  const names = Object.keys(FIREWORK_PALETTES);
  const selectedPalette = (paletteName === 'random' || !FIREWORK_PALETTES[paletteName])
    ? names[Math.floor(Math.random() * names.length)]
    : paletteName;

  const dy = targetY - 0.5;
  const flightTime = 1.05 + Math.random() * 0.25;
  const vy = dy / flightTime;
  const vx = (targetX - startX) / flightTime;
  const vz = (targetZ - startZ) / flightTime;

  activeFireworkRockets.push({
    x: startX,
    y: 0.5,
    z: startZ,
    targetX,
    targetY,
    targetZ,
    vx,
    vy,
    vz,
    paletteName: selectedPalette,
    trailTimer: 0,
    alive: true,
  });
}

function explodeFirework(x, y, z, paletteName) {
  initAudio();
  playSound('firework_burst');

  const palette = FIREWORK_PALETTES[paletteName] || FIREWORK_PALETTES.mai_vang;
  const sparkCount = 130 + Math.floor(Math.random() * 45);

  const mainColor = palette[0];
  if (fireworkFlashLight) {
    fireworkFlashLight.position.set(x, y, z);
    fireworkFlashLight.color.setRGB(mainColor.r, mainColor.g, mainColor.b);
    fireworkFlashLight.intensity = 3.8;
  }

  for (let i = 0; i < sparkCount; i++) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos((Math.random() * 2) - 1);
    const speed = 5.5 + Math.random() * 11.5;

    const vx = Math.sin(phi) * Math.cos(theta) * speed;
    const vy = Math.cos(phi) * speed + 1.2;
    const vz = Math.sin(phi) * Math.sin(theta) * speed;

    const col = palette[Math.floor(Math.random() * palette.length)];
    const lifetime = 1.25 + Math.random() * 0.85;

    spawnSparkParticle(x, y, z, vx, vy, vz, col.r, col.g, col.b, lifetime, 0.962, 5.8, false);
  }

  for (let j = 0; j < 25; j++) {
    const angle = Math.random() * Math.PI * 2;
    const s = 1.5 + Math.random() * 4;
    spawnSparkParticle(
      x + (Math.random() - 0.5),
      y + (Math.random() - 0.5),
      z + (Math.random() - 0.5),
      Math.cos(angle) * s,
      Math.random() * 2.5,
      Math.sin(angle) * s,
      1.0, 0.9, 0.45,
      2.1 + Math.random() * 0.6,
      0.94,
      3.5,
      false
    );
  }
}

function updateFireworksSystem(dt, elapsedSec, isNight) {
  if (!fireworksParticleSystem) return;

  if (isNight) {
    autoNightFireworkTimer -= dt;
    if (autoNightFireworkTimer <= 0) {
      autoNightFireworkTimer = 2.4 + Math.random() * 1.5;

      const launchSpots = [
        { sx: (Math.random() - 0.5) * 12, sz: -34, tx: (Math.random() - 0.5) * 16, ty: 28 + Math.random() * 7, tz: -28 },
        { sx: -28, sz: (Math.random() - 0.5) * 22, tx: -20 + (Math.random() - 0.5) * 8, ty: 27 + Math.random() * 6, tz: (Math.random() - 0.5) * 16 },
        { sx: 28, sz: (Math.random() - 0.5) * 22, tx: 20 + (Math.random() - 0.5) * 8, ty: 27 + Math.random() * 6, tz: (Math.random() - 0.5) * 16 },
        { sx: (Math.random() - 0.5) * 6, sz: (Math.random() - 0.5) * 6, tx: (Math.random() - 0.5) * 10, ty: 30 + Math.random() * 8, tz: (Math.random() - 0.5) * 10 }
      ];

      const spot = launchSpots[Math.floor(Math.random() * launchSpots.length)];
      launchFireworkRocket(spot.sx, spot.sz, spot.tx, spot.ty, spot.tz, 'random');
    }
  }

  for (let i = activeFireworkRockets.length - 1; i >= 0; i--) {
    const r = activeFireworkRockets[i];
    r.x += r.vx * dt;
    r.y += r.vy * dt;
    r.z += r.vz * dt;

    r.trailTimer += dt;
    if (r.trailTimer > 0.022) {
      r.trailTimer = 0;
      spawnSparkParticle(
        r.x + (Math.random() - 0.5) * 0.25,
        r.y - 0.35,
        r.z + (Math.random() - 0.5) * 0.25,
        (Math.random() - 0.5) * 0.7,
        -2.5,
        (Math.random() - 0.5) * 0.7,
        1.0, 0.85, 0.35,
        0.45,
        0.92,
        4.0,
        true
      );
    }

    if (r.y >= r.targetY) {
      explodeFirework(r.x, r.y, r.z, r.paletteName);
      activeFireworkRockets.splice(i, 1);
    }
  }

  const pool = fireworksParticleSystem.sparkPool;
  const posArr = fireworksParticleSystem.positions;
  const colArr = fireworksParticleSystem.colors;

  for (let i = 0; i < pool.length; i++) {
    const s = pool[i];
    if (!s.active) continue;

    s.life -= dt;
    if (s.life <= 0) {
      s.active = false;
      posArr[i * 3 + 1] = -200;
      continue;
    }

    s.vx *= s.drag;
    s.vy *= s.drag;
    s.vz *= s.drag;
    s.vy -= s.gravity * dt;

    s.x += s.vx * dt;
    s.y += s.vy * dt;
    s.z += s.vz * dt;

    if (s.y < 0.08) {
      s.y = 0.08;
      s.vx *= 0.6;
      s.vz *= 0.6;
    }

    posArr[i * 3] = s.x;
    posArr[i * 3 + 1] = s.y;
    posArr[i * 3 + 2] = s.z;

    const progress = 1 - (s.life / s.maxLife);
    const fade = Math.max(0, s.life / s.maxLife);
    const twinkle = 0.8 + Math.sin(elapsedSec * 22 + i) * 0.2;

    colArr[i * 3]     = Math.min(1, (s.r * (1 - progress * 0.4) + 0.3 * progress) * fade * twinkle);
    colArr[i * 3 + 1] = Math.max(0, s.g * fade * (1 - progress * 0.6) * twinkle);
    colArr[i * 3 + 2] = Math.max(0, s.b * fade * (1 - progress * 0.85) * twinkle);
  }

  fireworksParticleSystem.geom.attributes.position.needsUpdate = true;
  fireworksParticleSystem.geom.attributes.color.needsUpdate = true;

  if (fireworkFlashLight && fireworkFlashLight.intensity > 0) {
    fireworkFlashLight.intensity = Math.max(0, fireworkFlashLight.intensity - dt * 9.5);
  }
}

function triggerFireworkCelebration() {
  initAudio();
  if (myPlayer.mesh) {
    const sx = myPlayer.pos.x;
    const sz = myPlayer.pos.z;
    const tx = sx + (Math.random() - 0.5) * 8;
    const ty = 28 + Math.random() * 8;
    const tz = sz + (Math.random() - 0.5) * 8;
    launchFireworkRocket(sx, sz, tx, ty, tz, 'random');
    showToast('🎆 Bắn pháo hoa rực rỡ lên bầu trời đêm!');
  }
  if (socket) {
    socket.emit('emote', 'firework');
  }
}

function toggleTimeOfDayTest() {
  initAudio();
  playSound('click');
  const angle = (timeOfDayOverride !== null ? timeOfDayOverride : worldState.timeOfDay) * Math.PI * 2;
  const isNight = Math.sin(angle) < 0.22;
  timeOfDayOverride = isNight ? 0.25 : 0.75;
  showToast(
    timeOfDayOverride === 0.75
      ? '🏮 Đã chuyển sang Đêm Hội Phố Chợ (Pháo hoa tự động)! Bấm [F] hoặc nút Pháo Hoa để bắn!'
      : '☀️ Đã chuyển sang Ban Ngày Phố Chợ'
  );
}

/* ==================== MÔ HÌNH NHÂN VẬT 3D ĐA TRANG PHỤC VIỆT NAM & XE MÁY ==================== */
function createCharacterMesh(customOrColor = 0xf59e0b, nickname = "Bà con") {
  const custom =
    typeof customOrColor === "object" && customOrColor !== null
      ? {
          hat: customOrColor.hat || "non_la",
          outfit: customOrColor.outfit || "ba_ba",
          color: typeof customOrColor.color === "number" ? customOrColor.color : 0xf59e0b,
        }
      : {
          hat: "non_la",
          outfit: "ba_ba",
          color: typeof customOrColor === "number" ? customOrColor : 0xf59e0b,
        };

  const accentColor = custom.color;
  const group = new THREE.Group();
  const bodyRoot = new THREE.Group();
  group.add(bodyRoot);

  const motorbikeGroup = buildMotorbikeMesh(0xdc2626);
  motorbikeGroup.visible = false;
  group.add(motorbikeGroup);

  const bodyGeo = new THREE.CylinderGeometry(0.32, 0.38, 0.62, 16);
  const bodyMat = new THREE.MeshStandardMaterial({ color: accentColor, roughness: 0.55 });
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  body.position.y = 0.52;
  body.castShadow = true;
  bodyRoot.add(body);

  let aoDaiFront = null;
  let aoDaiBack = null;
  if (custom.outfit === "ao_dai") {
    const flapGeo = new THREE.BoxGeometry(0.46, 0.52, 0.05);
    aoDaiFront = new THREE.Mesh(flapGeo, bodyMat);
    aoDaiFront.position.set(0, 0.25, 0.33);
    bodyRoot.add(aoDaiFront);

    aoDaiBack = new THREE.Mesh(flapGeo, bodyMat);
    aoDaiBack.position.set(0, 0.25, -0.33);
    bodyRoot.add(aoDaiBack);
  } else if (custom.outfit === "ba_ba") {
    const btnMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });
    [0.65, 0.52, 0.39].forEach((by) => {
      const btn = new THREE.Mesh(new THREE.SphereGeometry(0.035, 6, 6), btnMat);
      btn.position.set(0, by, 0.36);
      bodyRoot.add(btn);
    });
  }

  const collar = new THREE.Mesh(
    new THREE.CylinderGeometry(0.34, 0.34, 0.1, 16),
    new THREE.MeshStandardMaterial({
      color: custom.outfit === "ao_thun" ? 0x38bdf8 : 0xffffff,
      roughness: 0.5,
    })
  );
  collar.position.y = 0.8;
  bodyRoot.add(collar);

  const headGeo = new THREE.SphereGeometry(0.45, 18, 18);
  const skinMat = new THREE.MeshStandardMaterial({ color: 0xffe0c8, roughness: 0.6 });
  const head = new THREE.Mesh(headGeo, skinMat);
  head.position.y = 1.25;
  head.castShadow = true;
  bodyRoot.add(head);

  const eyeMat = new THREE.MeshBasicMaterial({ color: 0x1e1b18 });
  const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.065, 8, 8), eyeMat);
  eyeL.position.set(-0.15, 0.03, 0.41);
  const eyeR = new THREE.Mesh(new THREE.SphereGeometry(0.065, 8, 8), eyeMat);
  eyeR.position.set(0.15, 0.03, 0.41);
  head.add(eyeL);
  head.add(eyeR);

  const blushMat = new THREE.MeshBasicMaterial({ color: 0xf43f5e });
  const blushL = new THREE.Mesh(new THREE.SphereGeometry(0.055, 8, 8), blushMat);
  blushL.position.set(-0.24, -0.06, 0.37);
  const blushR = new THREE.Mesh(new THREE.SphereGeometry(0.055, 8, 8), blushMat);
  blushR.position.set(0.24, -0.06, 0.37);
  head.add(blushL);
  head.add(blushR);

  if (custom.hat === "helmet") {
    const helmetShell = new THREE.Mesh(
      new THREE.SphereGeometry(0.49, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.62),
      new THREE.MeshStandardMaterial({ color: 0x2563eb, metalness: 0.35, roughness: 0.3 })
    );
    helmetShell.position.y = 0.05;
    head.add(helmetShell);

    const visor = new THREE.Mesh(
      new THREE.BoxGeometry(0.56, 0.16, 0.24),
      new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.2 })
    );
    visor.position.set(0, 0.18, 0.38);
    head.add(visor);
  } else if (custom.hat === "bandana") {
    const hairTop = new THREE.Mesh(
      new THREE.SphereGeometry(0.46, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.52),
      new THREE.MeshStandardMaterial({ color: 0x1e1b18, roughness: 0.8 })
    );
    hairTop.position.y = 0.03;
    head.add(hairTop);

    const headband = new THREE.Mesh(
      new THREE.TorusGeometry(0.43, 0.075, 8, 20),
      new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.6 })
    );
    headband.rotation.x = Math.PI / 2;
    headband.position.y = 0.18;
    head.add(headband);

    const knot = new THREE.Mesh(
      new THREE.BoxGeometry(0.24, 0.22, 0.18),
      new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.6 })
    );
    knot.position.set(0.32, 0.16, -0.28);
    head.add(knot);
  } else {
    const nonLaMat = new THREE.MeshStandardMaterial({
      color: 0xfde68a,
      roughness: 0.65,
      side: THREE.DoubleSide,
    });
    const nonLa = new THREE.Mesh(new THREE.ConeGeometry(0.72, 0.42, 20), nonLaMat);
    nonLa.position.set(0, 0.44, 0);
    head.add(nonLa);

    const strap = new THREE.Mesh(
      new THREE.TorusGeometry(0.32, 0.02, 6, 16, Math.PI),
      new THREE.MeshBasicMaterial({ color: 0xe11d48 })
    );
    strap.rotation.x = Math.PI;
    strap.position.set(0, 0.05, 0.15);
    head.add(strap);
  }

  const armMat = new THREE.MeshStandardMaterial({ color: 0xffe0c8 });
  const armGeo = new THREE.CylinderGeometry(0.07, 0.08, 0.38, 8);

  const armLGroup = new THREE.Group();
  armLGroup.position.set(-0.4, 0.66, 0);
  const armL = new THREE.Mesh(armGeo, armMat);
  armL.position.y = -0.15;
  armLGroup.add(armL);
  bodyRoot.add(armLGroup);

  const armRGroup = new THREE.Group();
  armRGroup.position.set(0.4, 0.66, 0);
  const armR = new THREE.Mesh(armGeo, armMat);
  armR.position.y = -0.15;
  armRGroup.add(armR);
  bodyRoot.add(armRGroup);

  const legMat = new THREE.MeshStandardMaterial({
    color: custom.outfit === "ao_dai" ? 0xf8fafc : 0x1e293b,
  });
  const legGeo = new THREE.CylinderGeometry(0.09, 0.1, 0.35, 8);

  const legLGroup = new THREE.Group();
  legLGroup.position.set(-0.15, 0.25, 0);
  const legL = new THREE.Mesh(legGeo, legMat);
  legL.position.y = -0.12;
  legLGroup.add(legL);
  bodyRoot.add(legLGroup);

  const legRGroup = new THREE.Group();
  legRGroup.position.set(0.15, 0.25, 0);
  const legR = new THREE.Mesh(legGeo, legMat);
  legR.position.y = -0.12;
  legRGroup.add(legR);
  bodyRoot.add(legRGroup);

  const nameSprite = createTextSprite(nickname, "#fef08a");
  nameSprite.position.set(0, 2.1, 0);
  nameSprite.scale.set(1.5, 0.32, 1);
  group.add(nameSprite);

  let auraRing = null;
  if (!nickname || nickname === myPlayer.nickname || nickname === "Bà con") {
    auraRing = new THREE.Mesh(
      new THREE.RingGeometry(0.38, 0.72, 32),
      new THREE.MeshBasicMaterial({
        color: 0xf59e0b,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.75,
        depthWrite: false,
      })
    );
    auraRing.rotation.x = -Math.PI / 2;
    auraRing.position.y = 0.035;
    group.add(auraRing);
  }

  return {
    group,
    bodyRoot,
    head,
    armLGroup,
    armRGroup,
    legLGroup,
    legRGroup,
    motorbikeGroup,
    nameSprite,
    auraRing,
    speechSprite: null,
    customization: custom,
    animateWalk: (time, isMoving, onMotorbike = false, isDancing = false) => {
      motorbikeGroup.visible = Boolean(onMotorbike);

      if (isDancing) {
        bodyRoot.rotation.y = time * 8;
        armLGroup.rotation.z = Math.sin(time * 14) * 0.9 + 0.8;
        armRGroup.rotation.z = -Math.sin(time * 14) * 0.9 - 0.8;
        bodyRoot.position.y = Math.abs(Math.sin(time * 10)) * 0.22;
        return;
      } else {
        bodyRoot.rotation.y = 0;
        armLGroup.rotation.z = 0;
        armRGroup.rotation.z = 0;
      }

      if (onMotorbike) {
        bodyRoot.position.y = 0.28 + Math.sin(time * 18) * 0.015;
        bodyRoot.position.z = -0.12;
        armLGroup.rotation.x = -0.65;
        armRGroup.rotation.x = -0.65;
        legLGroup.rotation.x = -0.5;
        legRGroup.rotation.x = -0.5;
      } else {
        bodyRoot.position.z = 0;
        if (isMoving) {
          const stride = Math.sin(time * 9.5);
          legLGroup.rotation.x = stride * 0.7;
          legRGroup.rotation.x = -stride * 0.7;
          armLGroup.rotation.x = -stride * 0.7;
          armRGroup.rotation.x = stride * 0.7;
          bodyRoot.position.y = Math.abs(stride) * 0.12;
          head.rotation.z = Math.sin(time * 4.5) * 0.07;
          if (aoDaiFront && aoDaiBack) {
            aoDaiFront.rotation.x = -Math.abs(stride) * 0.28;
            aoDaiBack.rotation.x = Math.abs(stride) * 0.32;
          }
        } else {
          legLGroup.rotation.x = THREE.MathUtils.lerp(legLGroup.rotation.x, 0, 0.15);
          legRGroup.rotation.x = THREE.MathUtils.lerp(legRGroup.rotation.x, 0, 0.15);
          armLGroup.rotation.x = THREE.MathUtils.lerp(armLGroup.rotation.x, 0, 0.15);
          armRGroup.rotation.x = THREE.MathUtils.lerp(armRGroup.rotation.x, 0, 0.15);
          bodyRoot.position.y = Math.sin(time * 3) * 0.03;
          head.rotation.z = 0;
          if (aoDaiFront && aoDaiBack) {
            aoDaiFront.rotation.x = Math.sin(time * 2.2) * 0.05;
            aoDaiBack.rotation.x = -Math.sin(time * 2.2) * 0.05;
          }
        }
      }
    },
  };
}

function createTextSprite(text, color = "#ffffff", bgColor = "rgba(20, 28, 46, 0.9)") {
  const canvas = document.createElement('canvas');
  canvas.width = 340;
  canvas.height = 68;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = bgColor;
  if (ctx.roundRect) {
    ctx.beginPath();
    ctx.roundRect(4, 4, 332, 60, 14);
    ctx.fill();
  } else {
    ctx.fillRect(4, 4, 332, 60);
  }

  ctx.strokeStyle = "rgba(251, 191, 36, 0.55)";
  ctx.lineWidth = 2;
  if (ctx.roundRect) {
    ctx.beginPath();
    ctx.roundRect(4, 4, 332, 60, 14);
    ctx.stroke();
  } else {
    ctx.strokeRect(4, 4, 332, 60);
  }

  ctx.fillStyle = color;
  ctx.font = 'bold 21px "Plus Jakarta Sans", system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text.slice(0, 34), 170, 34);

  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  const mat = new THREE.SpriteMaterial({ map: texture, transparent: true, depthWrite: false });
  const sprite = new THREE.Sprite(mat);
  sprite.scale.set(2.15, 0.44, 1);
  return sprite;
}

/* ==================== MÔ HÌNH SẠP HÀNG CHỢ VIỆT NAM ==================== */
function createStallMesh(stallData) {
  const group = new THREE.Group();
  group.position.set(stallData.position.x, 0, stallData.position.z);

  const mainColor = stallData.color || 0xd97706;

  const woodMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.75 });
  const counter = new THREE.Mesh(new THREE.BoxGeometry(4.3, 1.05, 2.0), woodMat);
  counter.position.y = 0.52;
  counter.castShadow = true;
  counter.receiveShadow = true;
  group.add(counter);

  const bambooMat = new THREE.MeshStandardMaterial({ color: 0xfde68a, roughness: 0.65 });
  const top = new THREE.Mesh(new THREE.BoxGeometry(4.45, 0.1, 2.15), bambooMat);
  top.position.y = 1.1;
  group.add(top);

  const bambooPoleMat = new THREE.MeshStandardMaterial({ color: 0xa16207, roughness: 0.6 });
  const poleGeo = new THREE.CylinderGeometry(0.08, 0.09, 2.3, 10);
  [[-1.95, -0.95], [1.95, -0.95], [-1.95, 0.95], [1.95, 0.95]].forEach(([px, pz]) => {
    const pole = new THREE.Mesh(poleGeo, bambooPoleMat);
    pole.position.set(px, 2.15, pz);
    group.add(pole);
  });

  const roof = new THREE.Mesh(
    new THREE.BoxGeometry(4.7, 0.24, 2.65),
    new THREE.MeshStandardMaterial({ color: mainColor, roughness: 0.5 })
  );
  roof.position.y = 3.3;
  roof.castShadow = true;
  group.add(roof);

  const lanternMat = new THREE.MeshStandardMaterial({
    color: 0xdc2626,
    emissive: 0xb91c1c,
    emissiveIntensity: 0.7,
  });
  [-1.8, 1.8].forEach((lx) => {
    const lantern = new THREE.Mesh(new THREE.SphereGeometry(0.24, 10, 10), lanternMat);
    lantern.scale.set(1, 1.2, 1);
    lantern.position.set(lx, 2.85, 1.2);
    group.add(lantern);
  });

  const stoolMatRed = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.4 });
  const stoolMatBlue = new THREE.MeshStandardMaterial({ color: 0x2563eb, roughness: 0.4 });
  const stool1 = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.38, 0.38), stoolMatRed);
  stool1.position.set(-1.1, 0.19, 1.55);
  group.add(stool1);

  const stool2 = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.38, 0.38), stoolMatBlue);
  stool2.position.set(1.1, 0.19, 1.55);
  group.add(stool2);

  const signSprite = createTextSprite(
    stallData.owner ? `${stallData.name} (${stallData.owner})` : `${stallData.name} [Bấm Mở Sạp]`,
    stallData.owner ? "#fbbf24" : "#fef08a",
    stallData.owner ? "rgba(185, 28, 28, 0.95)" : "rgba(20, 28, 46, 0.9)"
  );
  signSprite.position.set(0, 4.15, 0);
  group.add(signSprite);

  const displayItemsGroup = new THREE.Group();
  displayItemsGroup.position.set(0, 1.16, 0);
  group.add(displayItemsGroup);

  const staffGroup = new THREE.Group();
  staffGroup.position.set(0, 0, -0.68);
  staffGroup.visible = Boolean(stallData.hasStaff);
  const staffChar = createCharacterMesh(0x10b981, "Phụ Quán 👒");
  staffGroup.add(staffChar.group);
  group.add(staffGroup);

  scene.add(group);

  return {
    group,
    signSprite,
    displayItemsGroup,
    staffGroup,
    staffChar,
    data: stallData,
  };
}

function updateStallDisplayItems(stallEntry) {
  const group = stallEntry.displayItemsGroup;
  while (group.children.length > 0) {
    group.remove(group.children[0]);
  }

  const goods = stallEntry.data.goods || {};
  const activeGoods = Object.keys(goods).filter((k) => goods[k] > 0);

  const slotPositions = [
    [-1.45, 0.45], [-0.5, 0.45], [0.5, 0.45], [1.45, 0.45],
    [-1.2, -0.25], [-0.4, -0.25], [0.4, -0.25], [1.2, -0.25],
  ];

  activeGoods.forEach((goodId, idx) => {
    if (idx >= slotPositions.length) return;
    const goodDef = gameConstants.GOODS.find((g) => g.id === goodId);
    if (!goodDef) return;

    const pos = slotPositions[idx];
    const itemGroup = new THREE.Group();
    itemGroup.position.set(pos[0], 0.12, pos[1]);

    const trayMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.8 });
    const tray = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.28, 0.06, 14), trayMat);
    itemGroup.add(tray);

    let itemGeo;
    if (goodDef.category === "Trái cây") {
      itemGeo = new THREE.SphereGeometry(0.21, 12, 12);
    } else if (goodDef.category === "Giải khát") {
      itemGeo = new THREE.CylinderGeometry(0.13, 0.1, 0.38, 12);
    } else if (goodDef.category === "Ẩm thực") {
      itemGeo = new THREE.CylinderGeometry(0.24, 0.16, 0.2, 14);
    } else {
      itemGeo = new THREE.ConeGeometry(0.25, 0.28, 12);
    }

    const itemMat = new THREE.MeshStandardMaterial({
      color: goodDef.color,
      roughness: 0.35,
      metalness: 0.15,
    });
    const itemMesh = new THREE.Mesh(itemGeo, itemMat);
    itemMesh.position.y = 0.22;
    itemGroup.add(itemMesh);

    group.add(itemGroup);
  });
}

function syncStalls(stallsList) {
  worldState.stalls = stallsList;
  stallsList.forEach((s) => {
    let entry = stallMeshes[s.id];
    if (!entry) {
      entry = createStallMesh(s);
      stallMeshes[s.id] = entry;
    } else {
      entry.data = s;
      entry.group.remove(entry.signSprite);
      entry.signSprite = createTextSprite(
        s.owner ? `${s.name} (${s.owner})` : `${s.name} [Bấm Mở Sạp]`,
        s.owner ? "#fbbf24" : "#fef08a",
        s.owner ? "rgba(185, 28, 28, 0.95)" : "rgba(20, 28, 46, 0.9)"
      );
      entry.signSprite.position.set(0, 4.15, 0);
      entry.group.add(entry.signSprite);
      entry.staffGroup.visible = Boolean(s.hasStaff);
    }
    updateStallDisplayItems(entry);
  });
}

function syncCustomers(customersList) {
  worldState.customers = customersList;
  customersList.forEach((c) => {
    let entry = customerMeshes[c.id];
    if (!entry) {
      const char = createCharacterMesh(0xf43f5e, c.name);
      char.group.position.set(c.x, 0, c.z);
      scene.add(char.group);

      const bubbleSprite = createTextSprite("", "#ffffff", "rgba(185, 28, 28, 0.95)");
      bubbleSprite.position.set(0, 2.75, 0);
      bubbleSprite.visible = false;
      char.group.add(bubbleSprite);

      entry = { char, bubbleSprite, lastBubble: "" };
      customerMeshes[c.id] = entry;
    }

    entry.targetX = c.x;
    entry.targetZ = c.z;

    const newBubble = (c.bubble || "").trim();
    if (newBubble && newBubble !== entry.lastBubble) {
      entry.lastBubble = newBubble;
      entry.char.group.remove(entry.bubbleSprite);
      entry.bubbleSprite = createTextSprite(newBubble, "#fef08a", "rgba(185, 28, 28, 0.95)");
      entry.bubbleSprite.position.set(0, 2.7, 0);
      entry.bubbleSprite.scale.set(2.0, 0.42, 1);
      entry.bubbleSprite.visible = true;
      entry.char.group.add(entry.bubbleSprite);
    } else if (!newBubble) {
      entry.lastBubble = "";
      entry.bubbleSprite.visible = false;
    }
  });
}

function syncOtherPlayerMove(nickname, pos, rot, hoverboard = false, customization = null) {
  if (nickname === myPlayer.nickname) return;
  let p = worldState.otherPlayers[nickname];
  if (!p) {
    const char = createCharacterMesh(customization || 0x38bdf8, nickname);
    char.group.position.set(pos.x, 0, pos.z);
    scene.add(char.group);
    p = {
      char,
      targetPos: { ...pos },
      targetRot: rot || 0,
      hoverboard: Boolean(hoverboard),
      customization: customization || { hat: "non_la", outfit: "ba_ba", color: 0x38bdf8 },
      danceTimer: 0,
      isMoving: false,
    };
    worldState.otherPlayers[nickname] = p;
  } else {
    p.targetPos = { ...pos };
    p.targetRot = rot || 0;
    if (hoverboard !== undefined) p.hoverboard = Boolean(hoverboard);
  }
}

function showFloatingSpeechOnChar(charObj, text) {
  if (!charObj) return;
  if (charObj.speechSprite) {
    charObj.group.remove(charObj.speechSprite);
  }
  const sp = createTextSprite(text, "#fef08a", "rgba(185, 28, 28, 0.95)");
  sp.position.set(0, 2.8, 0);
  sp.scale.set(3.5, 0.7, 1);
  charObj.speechSprite = sp;
  charObj.group.add(sp);
  setTimeout(() => {
    if (charObj.speechSprite === sp) {
      charObj.group.remove(sp);
    }
  }, 4000);
}

function removeOtherPlayer(nickname) {
  const p = worldState.otherPlayers[nickname];
  if (p) {
    scene.remove(p.char.group);
    delete worldState.otherPlayers[nickname];
  }
}
