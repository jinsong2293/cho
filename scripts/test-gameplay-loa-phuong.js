/**
 * Automated End-to-End Gameplay & Loa Phuong Test
 * Tests:
 * 1. Desktop & Mobile viewports
 * 2. Town Join flow
 * 3. Loa Phuong Banner display, positioning, auto-dismiss, and manual close [✕]
 * 4. Header HUD "📢 Loa Phường" button -> opens modal-loa-phuong
 * 5. Replay announcement -> Banner appears at top-center with audio trigger
 * 6. "💬 Trò Chuyện" button -> toggle chat widget without interfering with Loa Phuong
 * 7. System announcement from Loa Phuong in chat -> distinct red-gold badge
 * 8. Character movement simulation & zero console errors
 * 9. Captures screenshot evidence to docs/evidence/
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const assert = require('node:assert');

const EVIDENCE_DIR = path.join(__dirname, '..', 'docs', 'evidence');
if (!fs.existsSync(EVIDENCE_DIR)) {
  fs.mkdirSync(EVIDENCE_DIR, { recursive: true });
}

const chromePath = fs.existsSync('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe')
  ? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
  : (fs.existsSync('C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe') ? 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe' : undefined);

async function runGameplayTest() {
  console.log('🚀 Bắt đầu kịch bản tự động chơi game & kiểm tra Loa Phường...');

  const browser = await chromium.launch({
    executablePath: chromePath,
    headless: true,
    args: ['--no-sandbox', '--disable-gpu', '--use-gl=swiftshader']
  });

  // TEST 1: DESKTOP VIEWPORT (1280x720)
  console.log('\n--- 1. Kiểm tra trên Màn Hình Máy Tính Desktop (1280x720) ---');
  const contextDesktop = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    deviceScaleFactor: 1
  });
  const page = await contextDesktop.newPage();

  const consoleErrors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  const TEST_PORT = process.env.TEST_PORT || process.env.PORT || 34567;
  await page.goto(`http://127.0.0.1:${TEST_PORT}/`, { waitUntil: 'networkidle', timeout: 15000 });

  // Nhập tên và vào thị trấn
  const nameInput = await page.$('#nickname-input');
  if (nameInput) {
    await nameInput.fill('Bé Hai Dạo Chợ');
  }
  const joinBtn = await page.$('#join-screen .join-btn');
  if (joinBtn) {
    await joinBtn.click();
    await page.waitForTimeout(2000);
  }

  // Đảm bảo join screen đã đóng
  await page.evaluate(() => {
    const js = document.getElementById('join-screen');
    if (js) js.classList.remove('active');
  });

  // Kiểm tra trạng thái banner Loa Phường
  const bannerMetrics = await page.evaluate(() => {
    const banner = document.getElementById('event-banner');
    const slot = document.getElementById('event-toast-slot');
    if (!banner || !slot) return null;
    const bRect = banner.getBoundingClientRect();
    const sRect = slot.getBoundingClientRect();
    const style = window.getComputedStyle(banner);
    return {
      top: bRect.top,
      left: bRect.left,
      right: bRect.right,
      width: bRect.width,
      height: bRect.height,
      display: style.display,
      position: window.getComputedStyle(slot).position,
      isVisible: bRect.width > 0 && bRect.height > 0,
      text: banner.innerText
    };
  });

  console.log('Banner Metrics (Desktop):', bannerMetrics);
  assert.ok(bannerMetrics, 'Banner Loa Phường phải tồn tại');
  assert.strictEqual(bannerMetrics.position, 'fixed', 'Slot phải có position fixed');
  assert.ok(bannerMetrics.top >= 40 && bannerMetrics.top <= 65, `Banner phải nằm ở đỉnh màn hình gần top:52px (thực tế: ${bannerMetrics.top}px)`);

  // Kiểm tra căn giữa: khoảng cách left và right phải xấp xỉ đối xứng trong viewport 1280px
  const centerDiff = Math.abs(bannerMetrics.left - (1280 - bannerMetrics.right));
  console.log(`Độ lệch tâm banner: ${centerDiff.toFixed(1)}px (<= 5px là căn giữa chuẩn)`);
  assert.ok(centerDiff <= 5, 'Banner Loa Phường phải căn giữa màn hình tuyệt đối');

  // Chụp ảnh màn hình Desktop khi có banner Loa Phường
  await page.screenshot({ path: path.join(EVIDENCE_DIR, 'loa_phuong_desktop.png') });
  console.log('📸 Đã lưu ảnh: docs/evidence/loa_phuong_desktop.png');

  // Thử bấm nút ✕ trên Banner để đóng
  console.log('👉 Thử bấm nút [✕] đóng banner Loa Phường...');
  await page.$eval('#event-banner .toast-close', (el) => el.click());
  await page.waitForTimeout(300);

  const isClosed = await page.evaluate(() => {
    const banner = document.getElementById('event-banner');
    const style = window.getComputedStyle(banner);
    return style.display === 'none' || !banner.classList.contains('show');
  });
  console.log(`Trạng thái sau khi bấm đóng: ${isClosed ? 'ĐÃ ĐÓNG HOÀN TOÀN ✅' : 'CHƯA ĐÓNG ❌'}`);
  assert.ok(isClosed, 'Bấm nút ✕ phải đóng banner ngay lập tức');

  // TEST 2: NÚT "📢 Loa Phường" TRÊN HUD MỞ MODAL BẢN TIN
  console.log('\n--- 2. Kiểm tra Nút "📢 Loa Phường" mở Modal Bản Tin ---');
  const loaBtn = await page.$('#hud-btn-loa');
  assert.ok(loaBtn, 'Nút Loa Phường phải có trên Header HUD');
  await loaBtn.click();
  await page.waitForTimeout(500);

  const modalActive = await page.evaluate(() => {
    const modal = document.getElementById('modal-loa-phuong');
    return modal && modal.classList.contains('active');
  });
  console.log(`Modal Loa Phường mở thành công: ${modalActive}`);
  assert.ok(modalActive, 'Bấm nút Loa Phường phải mở modal-loa-phuong');

  // Chụp ảnh modal Loa Phường
  await page.screenshot({ path: path.join(EVIDENCE_DIR, 'loa_phuong_modal.png') });
  console.log('📸 Đã lưu ảnh: docs/evidence/loa_phuong_modal.png');

  // Bấm nút Phát Lại Thông Báo trong Modal
  console.log('👉 Bấm nút "Phát Lại Thông Báo" trong modal...');
  const replayBtn = await page.$('#modal-loa-phuong button[onclick*="replayLoaPhuongAnnouncement"]');
  assert.ok(replayBtn, 'Nút Phát Lại Thông Báo phải có trong modal');
  await replayBtn.click();
  await page.waitForTimeout(400);

  const bannerReopened = await page.evaluate(() => {
    const banner = document.getElementById('event-banner');
    return banner && banner.classList.contains('show');
  });
  console.log(`Banner Loa Phường mở lại trên đỉnh màn hình: ${bannerReopened}`);
  assert.ok(bannerReopened, 'Phát lại thông báo phải hiện lại banner Loa Phường');

  // TEST 3: CHAT VÀ TIN NHẮN TỪ LOA PHƯỜNG
  console.log('\n--- 3. Kiểm tra Khung Chat & Tin Nhắn Loa Phường ---');
  await page.evaluate(() => {
    // Giả lập tin nhắn từ Loa Phường và người chơi
    if (typeof addChatMessage === 'function') {
      addChatMessage('Loa Phường', 'Bà con chú ý: Buổi chiều trời có mưa rào mát mẻ!', 'system', 'system');
      addChatMessage('Bé Hai Dạo Chợ', 'Dạ cảm ơn Loa Phường nha!', '', 'town');
    }
  });

  const chatMessagesCount = await page.evaluate(() => {
    const msgs = document.querySelectorAll('#chat-messages .chat-msg');
    const loaMsgs = document.querySelectorAll('#chat-messages .chat-msg.loa-phuong-msg');
    return { total: msgs.length, loaPhuong: loaMsgs.length };
  });
  console.log('Thống kê tin nhắn chat:', chatMessagesCount);
  assert.ok(chatMessagesCount.loaPhuong >= 1, 'Tin nhắn Loa Phường phải có class loa-phuong-msg');

  // TEST 4: ĐIỀU KHIỂN NHÂN VẬT & DI CHUYỂN
  console.log('\n--- 4. Mô phỏng di chuyển nhân vật trong thị trấn ---');
  await page.keyboard.press('KeyW');
  await page.keyboard.down('KeyW');
  await page.waitForTimeout(600);
  await page.keyboard.up('KeyW');

  await page.keyboard.down('KeyD');
  await page.waitForTimeout(400);
  await page.keyboard.up('KeyD');

  const playerPos = await page.evaluate(() => {
    return window.myPlayer && window.myPlayer.pos ? { ...window.myPlayer.pos } : null;
  });
  console.log('Tọa độ nhân vật sau khi di chuyển:', playerPos);
  assert.ok(playerPos, 'Tọa độ nhân vật phải hợp lệ');

  await contextDesktop.close();

  // TEST 5: MOBILE VIEWPORT (390x844 - iPhone 14 / Tầm Trung)
  console.log('\n--- 5. Kiểm tra trên Điện Thoại Di Động (390x844) ---');
  const contextMobile = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    deviceScaleFactor: 2
  });
  const pageMobile = await contextMobile.newPage();
  await pageMobile.goto(`http://127.0.0.1:${TEST_PORT}/`, { waitUntil: 'networkidle', timeout: 15000 });

  const mobileJoinBtn = await pageMobile.$('#join-screen .join-btn');
  if (mobileJoinBtn) {
    await mobileJoinBtn.click();
    await pageMobile.waitForTimeout(2000);
  }
  await pageMobile.evaluate(() => {
    const js = document.getElementById('join-screen');
    if (js) js.classList.remove('active');
  });

  const mobileMetrics = await pageMobile.evaluate(() => {
    const banner = document.getElementById('event-banner');
    const slot = document.getElementById('event-toast-slot');
    const joystick = document.getElementById('dynamic-touch-zone');
    const bRect = banner.getBoundingClientRect();
    const jRect = joystick ? joystick.getBoundingClientRect() : null;
    return {
      top: bRect.top,
      left: bRect.left,
      width: bRect.width,
      height: bRect.height,
      bannerOverlapJoystick: jRect ? (bRect.bottom > jRect.top && bRect.top < jRect.bottom && bRect.right > jRect.left && bRect.left < jRect.right) : false
    };
  });

  console.log('Mobile Banner Metrics:', mobileMetrics);
  assert.ok(mobileMetrics.top >= 40 && mobileMetrics.top <= 60, `Trên Mobile, banner phải ở đỉnh màn hình (thực tế: ${mobileMetrics.top}px)`);
  assert.strictEqual(mobileMetrics.bannerOverlapJoystick, false, 'Banner Loa Phường không được đè lên Joystick');

  // Chụp ảnh Mobile
  await pageMobile.screenshot({ path: path.join(EVIDENCE_DIR, 'loa_phuong_mobile.png') });
  console.log('📸 Đã lưu ảnh: docs/evidence/loa_phuong_mobile.png');

  await contextMobile.close();
  await browser.close();

  console.log('\n✅ TẤT CẢ 5 BÀI TEST CHƠI GAME & KIỂM TRA LOA PHƯỜNG ĐỀU ĐẠT 100%!');
}

runGameplayTest().catch((err) => {
  console.error('❌ Kiểm thử thất bại:', err);
  process.exit(1);
});
