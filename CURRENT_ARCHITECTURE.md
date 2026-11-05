# CURRENT ARCHITECTURE — CHỢ: THỊ TRẤN VIỆT NAM 3D

## 1. Kiến Trúc Tổng Thể (Client-Server Multiplayer Architecture)

```text
┌─────────────────────────────────────────────────────────────────────────┐
│                        CLIENT (Browser / Mobile)                        │
│  ┌───────────────────┐   ┌────────────────────┐   ┌──────────────────┐  │
│  │ Three.js Renderer │   │ Unified Glass HUD  │   │ Web Audio Synth  │  │
│  │  - 4 Town Zones   │   │  - Top Compact Bar │   │  - Coin / Horn   │  │
│  │  - 3D Characters  │   │  - Bottom Dock     │   │  - Fireworks     │  │
│  │  - Weather / FX   │   │  - Mobile Joystick │   │  - Ambient Chime │  │
│  └─────────┬─────────┘   └─────────┬──────────┘   └──────────────────┘  │
│            └───────────────┬───────┘                                    │
│                            ▼                                            │
│                   Socket.IO Client (WebSockets)                         │
└────────────────────────────┬────────────────────────────────────────────┘
                             │ 20Hz Move / 300ms Sync / Real-Time Events
                             ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        SERVER (Node.js + Express)                       │
│  ┌─────────────────────────┐          ┌──────────────────────────────┐  │
│  │     server/index.js     │◄────────►│       server/world.js        │  │
│  │  - Socket Room ("world")│          │  - Authoritative Game Loop   │  │
│  │  - Event Dispatcher     │          │  - Stalls & NPC AI           │  │
│  │  - Rate / Input Guard   │          │  - Bau Cua / Fishing / Social│  │
│  └─────────────────────────┘          └──────────────┬───────────────┘  │
│                                                      ▼                  │
│                                       ┌──────────────────────────────┐  │
│                                       │    server/persistence.js     │  │
│                                       │  - SQLite (better-sqlite3)   │  │
│                                       │  - Players, Quests, Friends  │  │
│                                       └──────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
```

## 2. Luồng Đồng Bộ Dữ Liệu (Synchronization Model)

1. **Khi người chơi đăng nhập (`join`)**:
   - Client gửi `nickname` qua sự kiện `join`.
   - Server kiểm tra/khởi tạo hồ sơ trong SQLite (`persistence.getPlayer` / `upsertPlayer`), khôi phục tiền, kho hàng, sạp sở hữu, nhiệm vụ, trang phục (`customization`) và danh sách bạn bè (`friends`).
   - Server trả về `snapshot` toàn cảnh thế giới và phát sóng `player_join` tới mọi người chơi khác.

2. **Di chuyển và Hoạt ảnh (`move` / `player_move`)**:
   - Client gửi tọa độ `{ pos, rot, hoverboard }` tối đa 20 lần/giây (mỗi 50ms khi di chuyển).
   - Server cập nhật trạng thái trong `world.players[nickname]` và phát `player_move` tới phòng `"world"`.
   - Client nội suy vị trí (`lerp`) mượt mà và kích hoạt hoạt ảnh bước đi, chạy xe máy hoặc nhảy múa.

3. **Vòng lặp Thế giới (`tick` — 20Hz trên Server)**:
   - `world.updateWorld(dt)` xử lý:
     - Chu kỳ ngày/đêm (`DAY_LENGTH = 120000ms`).
     - Sự kiện Loa Phường & Thời tiết động.
     - Rương Lộc Lì Xì ngẫu nhiên.
     - 10 NPC khách hàng di chuyển và mua hàng tại các sạp có bày sản phẩm.
     - Vòng quay Bầu Cua Tôm Cá tự động.
   - Mỗi 300ms, Server gửi gói `world_sync` gọn nhẹ để đồng bộ NPC, thời gian, bảng xếp hạng và trạng thái bàn trà đá/sự kiện.

## 3. Cơ Sở Dữ Liệu (SQLite Schema)
Bảng `players` trong `market.db`:
- `nickname` (TEXT PRIMARY KEY)
- `money` (INTEGER)
- `inventory` (TEXT JSON)
- `stalls` (TEXT JSON)
- `quests` (TEXT JSON)
- `customization` (TEXT JSON — hat, outfit, color)
- `friends` (TEXT JSON — danh sách nickname bạn bè)
- `tutorial_completed` (INTEGER)
- `created_at`, `updated_at` (TEXT)
