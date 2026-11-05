/*
 * Server configuration read from environment (dotenv).
 * All values have sensible defaults for ~20 concurrent players.
 */

require("dotenv").config();

module.exports = {
  port: process.env.PORT || 3000,
  cors: {
    origin: process.env.CORS_ORIGIN || "*",
  },
  // SQLite database path (relative to repo root)
  dbPath: process.env.DB_PATH || "./world.db",
  // How often we broadcast full state snapshot to newly joined clients (ms)
  snapshotInterval: Number(process.env.SNAPSHOT_INTERVAL) || 5000,
  // Tick rate in Hz (must match TICK_RATE from shared/constants)
  tickRate: Number(process.env.TICK_RATE) || 20,
  // Maximum move events per second per client to prevent spam
  maxMoveEventsPerSecond: Number(process.env.MAX_MOVE_PER_SEC) || 30,
};