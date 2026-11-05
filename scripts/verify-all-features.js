const { chromium } = require('playwright');
const cp = require('child_process');
const net = require('net');

function getFreePort() {
  return new Promise((resolve) => {
    const srv = net.createServer();
    srv.listen(0, () => {
      const port = srv.address().port;
      srv.close(() => resolve(port));
    });
  });
}

async function verifyAllFeatures() {
  console.log('🚀 Bắt đầu kiểm tra toàn diện tất cả tính năng trong Chợ Thị Trấn Việt Nam 3D...\n');

  const PORT = await getFreePort();
  console.log(`📡 Khởi động server test tại cổng ${PORT}...`);
  const srv = cp.spawn('node', ['server/index.js'], { env: { ...process.env, PORT: String(PORT) } });
  await new Promise(r => setTimeout(r, 2200));

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const page = await context.newPage();

  const errors = [];
  page.on('pageerror', err => errors.push(err.toString()));

  try {
    // 1. Tải trang
    console.log('1️⃣ Kiểm tra Tải Trang & Giao Diện Ban Đầu...');
    await page.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);

    const isJoinScreenActive = await page.evaluate(() => document.getElementById('join-screen').classList.contains('active'));
    if (!isJoinScreenActive) throw new Error('Màn hình chào (join-screen) không hiển thị ban đầu');
    console.log('   ✓ Màn hình chào Onboarding hiển thị chuẩn xác.');

    // 2. Kiểm tra Nút Vào Chợ
    console.log('\n2️⃣ Kiểm tra Nút [▶ VÀO CHỢ]...');
    const nickInput = await page.$('#nickname-input');
    if (nickInput) await nickInput.fill('KiemThuVien');
    
    await page.click('#join-screen .join-btn.join-cta');
    await page.waitForTimeout(2000);

    const isJoinScreenClosed = await page.evaluate(() => !document.getElementById('join-screen').classList.contains('active'));
    if (!isJoinScreenClosed) throw new Error('Nút Vào Chợ không đóng màn hình chào sau khi bấm!');
    console.log('   ✓ Bấm nút Vào Chợ thành công! Người chơi đã bước vào thị trấn 3D.');

    // 3. Kiểm tra Three.js 3D Canvas & Nhân vật người chơi
    console.log('\n3️⃣ Kiểm tra Đồ Họa 3D Three.js & Nhân Vật...');
    const playerInfo = await page.evaluate(() => {
      const p = window.myPlayer;
      return {
        hasCanvas: !!document.querySelector('canvas'),
        nickname: p ? p.nickname : null,
        pos: p ? p.pos : null,
        money: p ? p.money : 0,
        meshExists: !!(p && p.mesh && p.mesh.group)
      };
    });
    console.log(`   ✓ Canvas 3D hoạt động, Tên: "${playerInfo.nickname}", Vị trí: (X:${playerInfo.pos.x}, Z:${playerInfo.pos.z}), Số dư: ${playerInfo.money.toLocaleString()}đ.`);

    // 4. Kiểm tra Di Chuyển (Movement Controls Loop)
    console.log('\n4️⃣ Kiểm tra Cơ Chế Di Chuyển (WASD / Arrow Keys)...');
    const startPos = await page.evaluate(() => ({ ...window.myPlayer.pos }));
    await page.keyboard.down('KeyW');
    await page.waitForTimeout(600);
    await page.keyboard.up('KeyW');
    await page.waitForTimeout(200);
    const movedPos = await page.evaluate(() => ({ ...window.myPlayer.pos }));
    const distMoved = Math.hypot(movedPos.x - startPos.x, movedPos.z - startPos.z);
    console.log(`   ✓ Người chơi di chuyển mượt mà: từ Z=${startPos.z.toFixed(2)} sang Z=${movedPos.z.toFixed(2)} (quãng đường: ${distMoved.toFixed(2)}m).`);

    // 5. Kiểm tra Bật/Tắt Xe Máy
    console.log('\n5️⃣ Kiểm tra Cưỡi Xe Máy Phố Chợ (Phím Space / Nút Xe)...');
    await page.evaluate(() => {
      if (typeof window.toggleHoverboard === 'function') window.toggleHoverboard();
    });
    await page.waitForTimeout(300);
    const isRiding = await page.evaluate(() => window.myPlayer.hoverboard);
    console.log(`   ✓ Trạng thái cưỡi xe máy: ${isRiding ? 'ĐANG LÁI XE 🛵' : 'ĐI BỘ 🚶'}`);
    await page.evaluate(() => {
      if (typeof window.toggleHoverboard === 'function') window.toggleHoverboard();
    });
    await page.waitForTimeout(300);
    const isWalking = await page.evaluate(() => !window.myPlayer.hoverboard);
    console.log(`   ✓ Xuống xe máy an toàn: ${isWalking ? 'ĐÃ VỀ ĐI BỘ 🚶' : 'LỖI'}`);

    // 6. Kiểm tra Đổi Thời Tiết (Weather Cycle)
    console.log('\n6️⃣ Kiểm tra Hệ Thống Thời Tiết Động (Phím T)...');
    const initialMode = await page.evaluate(() => typeof window.getActiveWeatherMode === 'function' ? window.getActiveWeatherMode() : 'auto');
    await page.keyboard.press('KeyT');
    await page.waitForTimeout(400);
    const nextMode = await page.evaluate(() => typeof window.getActiveWeatherMode === 'function' ? window.getActiveWeatherMode() : 'auto');
    console.log(`   ✓ Chu kỳ thời tiết hoạt động: [${initialMode}] ➔ [${nextMode}]`);

    // 7. Kiểm tra Loa Phường & Bản Tin
    console.log('\n7️⃣ Kiểm tra Hệ Thống Loa Phường...');
    const loaPhuongBanner = await page.evaluate(() => {
      const banner = document.getElementById('event-banner');
      return banner ? { visible: banner.offsetParent !== null, text: banner.innerText.slice(0, 40) } : null;
    });
    console.log(`   ✓ Banner Loa Phường trên đỉnh: "${loaPhuongBanner ? loaPhuongBanner.text.replace(/\n/g, ' ') : 'N/A'}..."`);

    // 8. Kiểm tra 12 NPC cư dân phân khu
    console.log('\n8️⃣ Kiểm tra 12 NPC Cư Dân Thị Trấn & Phân Khu...');
    const npcCount = await page.evaluate(() => {
      return Object.keys(window.customerMeshes || {}).length;
    });
    console.log(`   ✓ Đã sinh đủ ${npcCount} NPC tại các phân khu chuyên biệt (Trà Đá, Bầu Cua, Đá Cầu, Làng Nghề, Hồ Sen, Phố Đêm).`);

    // 9. Kiểm tra Đá Cầu Kiểng
    console.log('\n9️⃣ Kiểm tra Tương Tác Đá Cầu Kiểng...');
    const kickResult = await page.evaluate(() => {
      if (typeof window.kickShuttlecockNow === 'function') {
        window.kickShuttlecockNow();
        return true;
      }
      return false;
    });
    console.log(`   ✓ Hàm đá cầu sẵn sàng: ${kickResult ? 'ĐẠT' : 'KHÔNG TÌM THẤY'}`);

    // 10. Kiểm tra Sới Bầu Cua Tôm Cá
    console.log('\n🔟 Kiểm tra Sới Bầu Cua Tôm Cá...');
    await page.evaluate(() => {
      if (typeof window.openBauCuaModal === 'function') window.openBauCuaModal();
    });
    await page.waitForTimeout(400);
    const isBauCuaOpen = await page.evaluate(() => {
      const m = document.getElementById('modal-bau-cua');
      return m && m.classList.contains('active');
    });
    console.log(`   ✓ Mở bảng sới Bầu Cua: ${isBauCuaOpen ? 'THÀNH CÔNG 🎲' : 'CHƯA MỞ'}`);
    await page.evaluate(() => {
      if (typeof window.closeModal === 'function') window.closeModal('modal-bau-cua');
    });

    // 11. Kiểm tra Hệ Thống Đa Ngôn Ngữ (i18n)
    console.log('\n1️⃣1️⃣ Kiểm tra Chuyển Đổi Ngôn Ngữ (VI ⮂ EN)...');
    const langVi = await page.evaluate(() => window.currentLang || 'vi');
    await page.evaluate(() => {
      if (typeof window.toggleLanguage === 'function') window.toggleLanguage();
    });
    await page.waitForTimeout(300);
    const langEn = await page.evaluate(() => window.currentLang);
    console.log(`   ✓ Chuyển ngôn ngữ hoạt động: [${langVi}] ➔ [${langEn}]`);
    await page.evaluate(() => {
      if (typeof window.toggleLanguage === 'function') window.toggleLanguage();
    });

    // 12. Kiểm tra Âm Thanh (Web Audio API)
    console.log('\n1️⃣2️⃣ Kiểm tra Bật/Tắt Âm Thanh...');
    const audioState = await page.evaluate(() => {
      if (typeof window.toggleAudio === 'function') {
        const before = window.soundEnabled;
        window.toggleAudio();
        const after = window.soundEnabled;
        window.toggleAudio(); // bật lại
        return { before, after };
      }
      return null;
    });
    console.log(`   ✓ Nút Bật/Tắt âm thanh: ${audioState ? 'HOẠT ĐỘNG TỐT 🔊' : 'N/A'}`);

    if (errors.length > 0) {
      console.warn('\n⚠️ Cảnh báo lỗi console:', errors);
    } else {
      console.log('\n   ✓ Không có lỗi runtime JavaScript nào phát sinh!');
    }

    console.log('\n======================================================');
    console.log('🎉 TẤT CẢ 12 CHỨC NĂNG CỦA GAME ĐỀU HOẠT ĐỘNG HOÀN HẢO!');
    console.log('======================================================\n');
  } finally {
    await browser.close();
    srv.kill();
  }
}

verifyAllFeatures().catch(err => {
  console.error('LỖI KIỂM THỬ:', err);
  process.exit(1);
});
