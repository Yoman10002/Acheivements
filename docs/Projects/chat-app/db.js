const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const fs = require("fs");

let DATA_DIR = process.env.STORAGE_PATH || path.join(__dirname, "data");
let DB_PATH = path.join(DATA_DIR, "chat.db");
let db = null;
let initPromise = null;

function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve({ changes: this.changes, lastID: this.lastID, lastInsertRowid: this.lastID });
    });
  });
}

function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

function all(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows || []);
    });
  });
}

function exec(sql) {
  return new Promise((resolve, reject) => {
    db.exec(sql, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

function closeDb() {
  return new Promise((resolve, reject) => {
    if (!db) return resolve();
    db.close((err) => {
      if (err) reject(err);
      else {
        db = null;
        resolve();
      }
    });
  });
}

async function migrateSchema() {
  await run(`
    CREATE TABLE IF NOT EXISTS messages (
      id        INTEGER PRIMARY KEY AUTOINCREMENT,
      room      TEXT    NOT NULL DEFAULT 'general',
      user_id   TEXT,
      username  TEXT    NOT NULL,
      text      TEXT    NOT NULL,
      timestamp INTEGER NOT NULL
    )
  `);
  await run(`CREATE INDEX IF NOT EXISTS idx_msg_room_ts ON messages(room, timestamp)`);

  await run(`
    CREATE TABLE IF NOT EXISTS rooms (
      name        TEXT PRIMARY KEY,
      created_at  INTEGER NOT NULL,
      owner_id    TEXT,
      is_private  INTEGER NOT NULL DEFAULT 0
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS room_members (
      room      TEXT NOT NULL,
      user_id   TEXT NOT NULL,
      added_at  INTEGER NOT NULL,
      PRIMARY KEY (room, user_id)
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS settings (
      key   TEXT PRIMARY KEY,
      value TEXT NOT NULL
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS users (
      id            TEXT PRIMARY KEY,
      username      TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      created_at    INTEGER NOT NULL
    )
  `);
  await run(`CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)`);

  await run(`
    CREATE TABLE IF NOT EXISTS sessions (
      token      TEXT PRIMARY KEY,
      user_id    TEXT NOT NULL,
      expires_at INTEGER NOT NULL
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS friendships (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      from_user  TEXT NOT NULL,
      to_user    TEXT NOT NULL,
      status     TEXT NOT NULL DEFAULT 'pending',
      created_at INTEGER NOT NULL,
      UNIQUE(from_user, to_user)
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS direct_messages (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      from_user  TEXT NOT NULL,
      to_user    TEXT NOT NULL,
      text       TEXT NOT NULL,
      timestamp  INTEGER NOT NULL
    )
  `);
  await run(
    `CREATE INDEX IF NOT EXISTS idx_dm_users_ts ON direct_messages(from_user, to_user, timestamp)`
  );

  const msgCols = await all("PRAGMA table_info(messages)");
  if (!msgCols.some((col) => col.name === "user_id")) {
    await run("ALTER TABLE messages ADD COLUMN user_id TEXT");
  }

  const roomCols = await all("PRAGMA table_info(rooms)");
  if (!roomCols.some((col) => col.name === "owner_id")) {
    await run("ALTER TABLE rooms ADD COLUMN owner_id TEXT");
  }
  if (!roomCols.some((col) => col.name === "is_private")) {
    await run("ALTER TABLE rooms ADD COLUMN is_private INTEGER NOT NULL DEFAULT 0");
  }

  const general = await get("SELECT 1 AS ok FROM rooms WHERE name = 'general'");
  if (!general) {
    await run(
      "INSERT INTO rooms (name, created_at, owner_id, is_private) VALUES (?, ?, NULL, 0)",
      ["general", Date.now()]
    );
  }
}

function openDatabase() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  return new Promise((resolve, reject) => {
    const instance = new sqlite3.Database(DB_PATH, async (err) => {
      if (err) return reject(err);
      db = instance;
      try {
        await run("PRAGMA journal_mode = WAL");
        await run("PRAGMA synchronous = NORMAL");
        await migrateSchema();
        resolve(instance);
      } catch (e) {
        reject(e);
      }
    });
  });
}

function initDatabase() {
  if (!initPromise) {
    initPromise = openDatabase();
  }
  return initPromise;
}

function getDataDir() {
  return DATA_DIR;
}

function getDbPath() {
  return DB_PATH;
}

async function relocateStorage(newDir) {
  const resolved = path.resolve(newDir);
  if (!fs.existsSync(resolved)) fs.mkdirSync(resolved, { recursive: true });

  const newDbPath = path.join(resolved, "chat.db");
  if (fs.existsSync(DB_PATH) && DB_PATH !== newDbPath) {
    if (!fs.existsSync(newDbPath)) {
      fs.copyFileSync(DB_PATH, newDbPath);
      const wal = DB_PATH + "-wal";
      const shm = DB_PATH + "-shm";
      if (fs.existsSync(wal)) fs.copyFileSync(wal, newDbPath + "-wal");
      if (fs.existsSync(shm)) fs.copyFileSync(shm, newDbPath + "-shm");
    }
  }

  await closeDb();
  initPromise = null;
  DATA_DIR = resolved;
  DB_PATH = newDbPath;
  await openDatabase();
  return { dataDir: DATA_DIR, dbPath: DB_PATH };
}

function getStorageSizeMB() {
  try {
    let total = 0;
    for (const f of fs.readdirSync(DATA_DIR)) {
      const fp = path.join(DATA_DIR, f);
      if (fs.statSync(fp).isFile()) total += fs.statSync(fp).size;
    }
    return +(total / (1024 * 1024)).toFixed(2);
  } catch {
    return 0;
  }
}

// Users
async function createUser(id, username, passwordHash) {
  return run(
    "INSERT INTO users (id, username, password_hash, created_at) VALUES (?, ?, ?, ?)",
    [id, username, passwordHash, Date.now()]
  );
}

async function getUserById(id) {
  return get("SELECT id, username, created_at FROM users WHERE id = ?", [id]);
}

async function getUserByUsername(username) {
  return get("SELECT * FROM users WHERE username = ? COLLATE NOCASE LIMIT 1", [username]);
}

async function getUserAuth(id) {
  return get("SELECT * FROM users WHERE id = ?", [id]);
}

async function userIdExists(id) {
  const row = await get("SELECT 1 AS ok FROM users WHERE id = ?", [id]);
  return !!row;
}

async function countUsers() {
  const row = await get("SELECT COUNT(*) AS count FROM users");
  return row ? row.count : 0;
}

async function listAllUsers() {
  return all("SELECT id, username, created_at FROM users ORDER BY created_at DESC");
}

async function deleteUser(userId) {
  const rooms = await all("SELECT name FROM rooms WHERE owner_id = ?", [userId]);
  for (const r of rooms) {
    await deleteRoomMessages(r.name);
    await run("DELETE FROM room_members WHERE room = ?", [r.name]);
    await deleteRoom(r.name);
  }
  await run("DELETE FROM room_members WHERE user_id = ?", [userId]);
  await run("DELETE FROM sessions WHERE user_id = ?", [userId]);
  await run("DELETE FROM friendships WHERE from_user = ? OR to_user = ?", [userId, userId]);
  await run("DELETE FROM direct_messages WHERE from_user = ? OR to_user = ?", [userId, userId]);
  await run("DELETE FROM messages WHERE user_id = ?", [userId]);
  return run("DELETE FROM users WHERE id = ?", [userId]);
}

async function deleteAllSessionsForUser(userId) {
  return run("DELETE FROM sessions WHERE user_id = ?", [userId]);
}

// Sessions
async function createSession(token, userId, expiresAt) {
  return run("INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)", [
    token,
    userId,
    expiresAt,
  ]);
}

async function getSession(token) {
  return get("SELECT * FROM sessions WHERE token = ? AND expires_at > ?", [token, Date.now()]);
}

async function deleteSession(token) {
  return run("DELETE FROM sessions WHERE token = ?", [token]);
}

async function purgeExpiredSessions() {
  return run("DELETE FROM sessions WHERE expires_at <= ?", [Date.now()]);
}

// Messages
async function insertMsg(room, userId, username, text, timestamp) {
  return run(
    "INSERT INTO messages (room, user_id, username, text, timestamp) VALUES (?, ?, ?, ?, ?)",
    [room, userId, username, text, timestamp]
  );
}

async function getRecentMessages(room, limit) {
  return all("SELECT * FROM messages WHERE room = ? ORDER BY timestamp DESC LIMIT ?", [
    room,
    limit,
  ]);
}

async function countMessages() {
  const row = await get("SELECT COUNT(*) AS count FROM messages");
  return row ? row.count : 0;
}

async function deleteOlderThan(cutoff) {
  return run("DELETE FROM messages WHERE timestamp < ?", [cutoff]);
}

async function deleteAllMessages() {
  return run("DELETE FROM messages");
}

// Rooms
async function getRooms() {
  return all("SELECT * FROM rooms ORDER BY created_at ASC");
}

async function getRoomsForUser(userId) {
  return all(
    `SELECT DISTINCT r.name, r.owner_id, r.is_private, r.created_at,
      (SELECT u.username FROM users u WHERE u.id = r.owner_id) AS owner_name
     FROM rooms r
     LEFT JOIN room_members m ON m.room = r.name
     WHERE r.is_private = 0 OR m.user_id = ? OR r.owner_id = ?
     ORDER BY r.created_at ASC`,
    [userId, userId]
  );
}

async function getRoom(name) {
  return get("SELECT * FROM rooms WHERE name = ?", [name]);
}

async function canAccessRoom(userId, roomName) {
  if (roomName === "general") return true;
  const room = await getRoom(roomName);
  if (!room) return false;
  if (!room.is_private) return true;
  if (room.owner_id === userId) return true;
  const row = await get("SELECT 1 AS ok FROM room_members WHERE room = ? AND user_id = ?", [
    roomName,
    userId,
  ]);
  return !!row;
}

async function insertRoom(name, ownerId, isPrivate = 0) {
  return run("INSERT OR IGNORE INTO rooms (name, created_at, owner_id, is_private) VALUES (?, ?, ?, ?)", [
    name,
    Date.now(),
    ownerId,
    isPrivate ? 1 : 0,
  ]);
}

async function addRoomMember(room, userId) {
  return run("INSERT OR IGNORE INTO room_members (room, user_id, added_at) VALUES (?, ?, ?)", [
    room,
    userId,
    Date.now(),
  ]);
}

async function getRoomMembers(room) {
  return all(
    `SELECT u.id, u.username FROM room_members m JOIN users u ON u.id = m.user_id WHERE m.room = ?`,
    [room]
  );
}

async function deleteRoom(name) {
  await run("DELETE FROM room_members WHERE room = ?", [name]);
  return run("DELETE FROM rooms WHERE name = ?", [name]);
}

async function deleteRoomMessages(name) {
  return run("DELETE FROM messages WHERE room = ?", [name]);
}

// Friends
async function addFriendRequest(fromUser, toUser) {
  return run(
    "INSERT INTO friendships (from_user, to_user, status, created_at) VALUES (?, ?, 'pending', ?)",
    [fromUser, toUser, Date.now()]
  );
}

async function getFriendship(a, b) {
  return get(
    `SELECT * FROM friendships WHERE
     (from_user = ? AND to_user = ?) OR (from_user = ? AND to_user = ?)`,
    [a, b, b, a]
  );
}

async function acceptFriend(fromUser, toUser) {
  return run(
    "UPDATE friendships SET status = 'accepted' WHERE from_user = ? AND to_user = ? AND status = 'pending'",
    [fromUser, toUser]
  );
}

async function listFriends(userId) {
  return all(
    `SELECT u.id AS friend_id, u.username FROM friendships f
     JOIN users u ON u.id = (CASE WHEN f.from_user = ? THEN f.to_user ELSE f.from_user END)
     WHERE (f.from_user = ? OR f.to_user = ?) AND f.status = 'accepted'`,
    [userId, userId, userId]
  );
}

async function listPendingRequests(userId) {
  return all(
    `SELECT f.*, u.username, u.id AS from_id FROM friendships f
     JOIN users u ON u.id = f.from_user
     WHERE f.to_user = ? AND f.status = 'pending'`,
    [userId]
  );
}

// DMs
async function insertDM(fromUser, toUser, text, timestamp) {
  return run(
    "INSERT INTO direct_messages (from_user, to_user, text, timestamp) VALUES (?, ?, ?, ?)",
    [fromUser, toUser, text, timestamp]
  );
}

async function getDMHistory(userA, userB, limit = 100) {
  return all(
    `SELECT * FROM direct_messages WHERE
     (from_user = ? AND to_user = ?) OR (from_user = ? AND to_user = ?)
     ORDER BY timestamp ASC LIMIT ?`,
    [userA, userB, userB, userA, limit]
  );
}

async function countDMs() {
  const row = await get("SELECT COUNT(*) AS count FROM direct_messages");
  return row ? row.count : 0;
}

async function purgeOldMessages(days) {
  if (!days || days <= 0) return 0;
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  const r = await deleteOlderThan(cutoff);
  if (r.changes > 0) await exec("VACUUM");
  return r.changes;
}

async function enforceStorageLimit(maxMB) {
  const currentMB = getStorageSizeMB();
  if (currentMB <= maxMB) return 0;
  const total = await countMessages();
  const toDelete = Math.ceil(total * 0.2);
  const oldest = await all("SELECT id FROM messages ORDER BY timestamp ASC LIMIT ?", [toDelete]);
  if (oldest.length === 0) return 0;
  const ids = oldest.map((r) => r.id);
  await run(`DELETE FROM messages WHERE id IN (${ids.join(",")})`);
  await exec("VACUUM");
  return ids.length;
}

function exportDataZip(destZipPath) {
  const { execSync } = require("child_process");
  const dir = DATA_DIR.replace(/'/g, "''");
  const zip = destZipPath.replace(/'/g, "''");
  if (fs.existsSync(destZipPath)) fs.unlinkSync(destZipPath);
  execSync(
    `powershell -NoProfile -Command "Compress-Archive -Path '${dir}\\*' -DestinationPath '${zip}' -Force"`,
    { timeout: 120000 }
  );
  return destZipPath;
}

module.exports = {
  initDatabase,
  get db() {
    return db;
  },
  getDataDir,
  getDbPath,
  relocateStorage,
  getStorageSizeMB,
  exportDataZip,
  createUser,
  getUserById,
  getUserByUsername,
  getUserAuth,
  userIdExists,
  countUsers,
  listAllUsers,
  deleteUser,
  deleteAllSessionsForUser,
  createSession,
  getSession,
  deleteSession,
  purgeExpiredSessions,
  insertMsg,
  getRecentMessages,
  countMessages,
  deleteAllMessages,
  getRooms,
  getRoomsForUser,
  getRoom,
  canAccessRoom,
  insertRoom,
  addRoomMember,
  getRoomMembers,
  deleteRoom,
  deleteRoomMessages,
  addFriendRequest,
  getFriendship,
  acceptFriend,
  listFriends,
  listPendingRequests,
  insertDM,
  getDMHistory,
  countDMs,
  purgeOldMessages,
  enforceStorageLimit,
  exec,
};
