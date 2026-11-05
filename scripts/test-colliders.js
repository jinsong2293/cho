/*
 * Test Suite: Automated Collision & Sliding Verification
 * Chợ Thị Trấn Việt Nam 3D
 */

const assert = require("node:assert");
const Colliders = require("../shared/colliders");
const { ZONES } = require("../shared/world-layout");

console.log("🛡️ Bắt đầu kiểm tra Hệ Thống Va Chạm & Chống Xuyên Tường (Colliders)...");

// 1. Kiểm tra toàn bộ điểm hồi sinh (Spawn Points) của các khu vực đều thông thoáng
console.log("  🔍 1. Kiểm tra điểm hồi sinh (Spawn Points):");
ZONES.forEach((zone) => {
  if (Array.isArray(zone.spawnPoints)) {
    zone.spawnPoints.forEach((sp, idx) => {
      const hit = Colliders.isColliding(sp.x, sp.z, 0.45);
      assert.strictEqual(
        hit,
        null,
        `Điểm spawn ${zone.id} #${idx} tại (${sp.x}, ${sp.z}) không được va chạm với vật cản! Gặp: ${hit && hit.name}`
      );
    });
  }
});
console.log(`     ✓ Toàn bộ ${ZONES.length} phân khu có điểm xuất phát an toàn, không kẹt tường.`);

// 2. Kiểm tra không thể đi xuyên qua Nhà Lồng Bến Thành
console.log("  🔍 2. Kiểm tra va chạm Nhà Lồng Chợ Bến Thành (x=0, z=-34):");
const hitBenThanhInside = Colliders.isColliding(0, -34, 0.45);
assert.ok(hitBenThanhInside, "Tâm Nhà Lồng Bến Thành phải bị cản!");
assert.strictEqual(hitBenThanhInside.id, "ben_thanh_hall");

// Thử đi thẳng từ ngoài (0, -28) tiến vào tường phía trước (0, -32)
let testPos = { x: 0, z: -28.0 };
for (let step = 0; step < 20; step++) {
  const res = Colliders.resolveMovement(testPos.x, testPos.z, 0, -0.3, 0.45);
  testPos.x = res.x;
  testPos.z = res.z;
}
assert.ok(
  testPos.z >= -29.65,
  `Nhân vật không được đi xuyên vào tường Bến Thành! Tọa độ dừng: z = ${testPos.z}`
);
console.log(`     ✓ Nhân vật dừng an toàn trước mặt tiền Bến Thành tại z = ${testPos.z}`);

// 3. Kiểm tra va chạm Đài Sen Vàng Trung Tâm (0, 0)
console.log("  🔍 3. Kiểm tra va chạm Đài Sen Vàng Trung Tâm (0, 0):");
const hitLotus = Colliders.isColliding(0, 0, 0.45);
assert.ok(hitLotus, "Đài Sen Vàng phải bị cản không cho trèo lên bồn nước!");
assert.strictEqual(hitLotus.id, "golden_lotus_fountain");

// Thử chạy từ (0, 8) về phía (0, 0)
let lotusPos = { x: 0, z: 8.0 };
for (let step = 0; step < 30; step++) {
  const res = Colliders.resolveMovement(lotusPos.x, lotusPos.z, 0, -0.3, 0.45);
  lotusPos.x = res.x;
  lotusPos.z = res.z;
}
assert.ok(
  lotusPos.z >= 4.8,
  `Nhân vật không được xuyên qua đài sen! Tọa độ dừng: z = ${lotusPos.z}`
);
console.log(`     ✓ Nhân vật dừng bên ngoài thành đài sen tại z = ${lotusPos.z}`);

// 4. Kiểm tra va chạm Sới Bầu Cua Phía Tây (-48, -16)
console.log("  🔍 4. Kiểm tra va chạm Sới Bầu Cua (-48, -16):");
const hitBauCua = Colliders.isColliding(-48, -16, 0.45);
assert.ok(hitBauCua, "Bàn sới Bầu Cua phải là vật cản cứng!");
assert.strictEqual(hitBauCua.id, "bau_cua_deck");
console.log("     ✓ Sới Bầu Cua cản chính xác người chơi giẫm lên bàn xúc xắc.");

// 5. Kiểm tra va chạm Nhà Phố & Hiệu ứng Trượt Mượt Mà (Sliding Collision)
console.log("  🔍 5. Kiểm tra hiệu ứng Trượt Mượt Mà dọc tường nhà phố:");
// Bắt đầu tại (-33, -18) chạy chéo hướng Tây-Bắc (-0.2, -0.2) vào tường Tiệm Vàng (-38, -18)
let slidePos = { x: -33.5, z: -18.0 };
let slidDistZ = 0;
for (let step = 0; step < 15; step++) {
  const prevZ = slidePos.z;
  const res = Colliders.resolveMovement(slidePos.x, slidePos.z, -0.25, -0.2, 0.45);
  slidePos.x = res.x;
  slidePos.z = res.z;
  slidDistZ += Math.abs(slidePos.z - prevZ);
}
// Trục X bị chặn ở khoảng x ≈ -33.75, nhưng trục Z vẫn tiếp tục di chuyển (trượt dọc vỉa hè)
assert.ok(
  slidePos.x >= -34.7,
  `Trục X không được xuyên qua tường nhà phố! x = ${slidePos.x}`
);
assert.ok(
  slidDistZ > 1.5,
  `Nhân vật phải trượt mượt mà dọc theo trục Z! Quãng đường trượt Z = ${slidDistZ}`
);
console.log(`     ✓ Cơ chế sliding trượt trơn tru dọc theo mặt tiền nhà phố (quãng đường Z: ${slidDistZ.toFixed(2)}m).`);

// 6. Kiểm tra Bến Cầu Tàu Gỗ & Nước Sông
console.log("  🔍 6. Kiểm tra Nước Sông & Cầu Tàu Gỗ:");
// Trên cầu tàu gỗ (x = 0, z = 38): Được phép đi
const onPier = Colliders.isColliding(0, 38, 0.45);
assert.strictEqual(onPier, null, "Trên cầu tàu gỗ phải cho phép đi lại tự do!");

// Nhảy xuống nước sông bên hông cầu tàu (x = -12, z = 38): BỊ CẢN
const inRiverWater = Colliders.isColliding(-12, 38, 0.45);
assert.ok(inRiverWater, "Mặt nước sông bên ngoài cầu tàu phải cản người chơi không rơi xuống nước!");
assert.strictEqual(inRiverWater.id, "river_water_barrier");

// Đi quá mút đầu cầu tàu ra giữa sông (x = 0, z = 46): BỊ CẢN
const pastPier = Colliders.isColliding(0, 46, 0.45);
assert.ok(pastPier, "Đầu cầu tàu gỗ phải có rào cản ngăn rơi xuống sông!");
assert.strictEqual(pastPier.id, "river_water_barrier");
console.log("     ✓ Cầu tàu gỗ an toàn: đi lại được trên sàn gỗ, cản rơi xuống lòng sông.");

// 7. Kiểm tra Giới Hạn Bản Đồ 20x (BOUNDS ±1160m)
console.log("  🔍 7. Kiểm tra Biên Bản Đồ Thị Trấn Mở Rộng 20x (±1160m):");
const insideExpandedMap = Colliders.isColliding(850, -750, 0.45);
assert.strictEqual(insideExpandedMap, null, "Vùng mở rộng 20x (850, -750) phải cho phép di chuyển tự do!");
const outOfBounds = Colliders.isColliding(1175, 0, 0.45);
assert.ok(outOfBounds, "Ngoài biên bản đồ 20x (>1160m) phải bị chặn!");
assert.strictEqual(outOfBounds.id, "world_bounds_limit");
console.log("     ✓ Rào chắn biên thị trấn 20x (±1160m) ngăn cách hoàn hảo thế giới.");

console.log("\n🎉 TOÀN BỘ KIỂM THỬ HỆ THỐNG VA CHẠM ĐỀU ĐẠT CHUẨN XUẤT SẮC!\n");
