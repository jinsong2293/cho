/*
 * Authoritative Seat & Co-Sitting Affinity System (Phase 8.2)
 * Chợ Thị Trấn Việt Nam 3D
 */

const { SEATS } = require("../shared/world-layout");

// Quản lý trạng thái ghế ngồi theo từng phòng (roomId)
const roomSeats = new Map();

function ensureRoomSeats(roomId = "public-1") {
  if (!roomSeats.has(roomId)) {
    const map = {};
    SEATS.forEach((s) => {
      map[s.id] = {
        ...s,
        occupant: null,
        satAt: 0,
        affinityAwarded: false,
      };
    });
    roomSeats.set(roomId, map);
  }
  return roomSeats.get(roomId);
}

function getSeatsSnapshot(roomId = "public-1") {
  const seats = ensureRoomSeats(roomId);
  return Object.values(seats);
}

function leaveAllSeats(roomId = "public-1", nickname) {
  const seats = ensureRoomSeats(roomId);
  let changed = false;
  for (const s of Object.values(seats)) {
    if (s.occupant === nickname) {
      s.occupant = null;
      s.satAt = 0;
      s.affinityAwarded = false;
      changed = true;
    }
  }
  return changed;
}

function sitOnSeat(roomId = "public-1", nickname, seatId = null, playerPos = null) {
  const seats = ensureRoomSeats(roomId);

  // Nếu người chơi đang ngồi ở ghế đó -> đứng dậy
  if (seatId && seats[seatId] && seats[seatId].occupant === nickname) {
    seats[seatId].occupant = null;
    seats[seatId].satAt = 0;
    seats[seatId].affinityAwarded = false;
    return { ok: true, seated: false, seat: seats[seatId], seats: getSeatsSnapshot(roomId) };
  }

  // Rời ghế cũ (nếu có) trước khi ngồi ghế mới
  leaveAllSeats(roomId, nickname);

  let targetSeat = seatId ? seats[seatId] : null;
  if (!targetSeat && playerPos) {
    // Tìm ghế trống gần nhất trong bán kính 6m
    let minD = 6.5;
    for (const s of Object.values(seats)) {
      if (!s.occupant) {
        const d = Math.hypot((playerPos.x || 0) - s.x, (playerPos.z || 0) - s.z);
        if (d < minD) {
          minD = d;
          targetSeat = s;
        }
      }
    }
  }

  if (!targetSeat) {
    return { ok: false, error: "Không tìm thấy ghế trống gần bạn!" };
  }
  if (targetSeat.occupant && targetSeat.occupant !== nickname) {
    return { ok: false, error: `Ghế này đang có ${targetSeat.occupant} ngồi rồi!` };
  }

  targetSeat.occupant = nickname;
  targetSeat.satAt = Date.now();
  targetSeat.affinityAwarded = false;

  return {
    ok: true,
    seated: true,
    seat: targetSeat,
    seats: getSeatsSnapshot(roomId),
  };
}

/**
 * Kiểm tra người chơi ngồi cùng bàn/khu vực >= 60 giây để thưởng Điểm Thân Thiết (Phase 8.2)
 */
function tickSeatsAffinity(roomId = "public-1", onAwardAffinity) {
  const seats = ensureRoomSeats(roomId);
  const byZone = {};
  for (const s of Object.values(seats)) {
    if (s.occupant) {
      if (!byZone[s.zoneId]) byZone[s.zoneId] = [];
      byZone[s.zoneId].push(s);
    }
  }

  const now = Date.now();
  for (const [zoneId, occupiedList] of Object.entries(byZone)) {
    if (occupiedList.length >= 2) {
      occupiedList.forEach((s) => {
        if (!s.affinityAwarded && now - s.satAt >= 60000) {
          s.affinityAwarded = true;
          if (typeof onAwardAffinity === "function") {
            onAwardAffinity(s.occupant, zoneId, occupiedList.map((o) => o.occupant));
          }
        }
      });
    }
  }
}

module.exports = {
  ensureRoomSeats,
  getSeatsSnapshot,
  sitOnSeat,
  leaveAllSeats,
  tickSeatsAffinity,
};
