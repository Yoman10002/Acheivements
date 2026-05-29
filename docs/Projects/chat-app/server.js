require("dotenv").config();
const http = require("http");
const fs = require("fs");
const path = require("path");
const { WebSocketServer } = require("ws");
const db = require("./db");
const auth = require("./auth");
const { estimateCapacity } = require("./capacity");

const PORT = parseInt(process.env.PORT) || 3000;
const HOST = process.env.HOST || "0.0.0.0";
const SESSION_DAYS = 30;

function cfg(key, fallback) {
  return process.env[key] ?? fallback;
}

function getAdminPassword() {
  return cfg("ADMIN_PASSWORD", "admin123");
}

// ── Tracking ──

const clients = new Map();
const rateLimits = new Map();
const serverStartTime = Date.now();
let totalMessagesServed = 0;

const MIME = {
  ".html": "text/html",
  ".css": "text/css",
  ".js": "application/javascript",
  ".json": "application/json",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".zip": "application/zip",
  ".exe": "application/octet-stream",
};

// ── HTTP ──

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = url.pathname;

  if (pathname.startsWith("/api/auth/")) return handleAuthAPI(req, res, url);
  if (pathname.startsWith("/api/admin/")) return handleAdminAPI(req, res, url);

  let filePath;
  if (pathname === "/" || pathname === "/index.html") {
    filePath = path.join(__dirname, "public", "index.html");
  } else if (pathname === "/dashboard" || pathname === "/dashboard.html") {
    filePath = path.join(__dirname, "public", "dashboard.html");
  } else {
    filePath = path.join(__dirname, "public", pathname);
  }

  const publicRoot = path.join(__dirname, "public");
  if (!filePath.startsWith(publicRoot)) {
    res.writeHead(403);
    return res.end("Forbidden");
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { "Content-Type": "text/plain" });
      return res.end("Not found");
    }
    res.writeHead(200, { "Content-Type": MIME[path.extname(filePath)] || "application/octet-stream" });
    res.end(data);
  });
});

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 1e5) {
        req.destroy();
        reject(new Error("too large"));
      }
    });
    req.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        reject(new Error("invalid json"));
      }
    });
  });
}

function json(res, code, data) {
  res.writeHead(code, { "Content-Type": "application/json" });
  res.end(JSON.stringify(data));
}

// ── Auth API ──

async function handleAuthAPI(req, res, url) {
  const route = url.pathname.replace("/api/auth/", "");

  try {
    if (req.method === "POST" && route === "register") {
      const data = await readBody(req);
      const username = (data.username || "").trim().slice(0, 24);
      const password = (data.password || "").trim();
      if (!username || password.length < 4) {
        return json(res, 400, { error: "Username and password (4+ chars) required" });
      }
      let userId;
      for (let i = 0; i < 10; i++) {
        userId = auth.generateUserId();
        if (!(await db.userIdExists(userId))) break;
      }
      const token = auth.createToken();
      const expires = Date.now() + SESSION_DAYS * 86400000;
      await db.createUser(userId, username, auth.hashPassword(password));
      await db.createSession(token, userId, expires);
      return json(res, 200, { token, userId, username });
    }

    if (req.method === "POST" && route === "login") {
      const data = await readBody(req);
      const username = (data.username || "").trim();
      const password = (data.password || "").trim();
      const user = await db.getUserByUsername(username);
      if (!user || !auth.verifyPassword(password, user.password_hash)) {
        return json(res, 401, { error: "Invalid username or password" });
      }
      const token = auth.createToken();
      await db.createSession(token, user.id, Date.now() + SESSION_DAYS * 86400000);
      return json(res, 200, { token, userId: user.id, username: user.username });
    }

    if (req.method === "POST" && route === "logout") {
      const data = await readBody(req);
      if (data.token) await db.deleteSession(data.token);
      return json(res, 200, { ok: true });
    }

    if (req.method === "GET" && route === "me") {
      const token = req.headers.authorization?.replace("Bearer ", "");
      const session = token ? await db.getSession(token) : null;
      if (!session) return json(res, 401, { error: "Not logged in" });
      const user = await db.getUserById(session.user_id);
      if (!user) return json(res, 401, { error: "User not found" });
      return json(res, 200, { userId: user.id, username: user.username });
    }

    if (req.method === "GET" && route === "lookup") {
      const id = (url.searchParams.get("id") || "").trim().toUpperCase();
      const user = await db.getUserById(id);
      if (!user) return json(res, 404, { error: "User not found" });
      return json(res, 200, { userId: user.id, username: user.username });
    }

    if (req.method === "POST" && route === "delete-account") {
      const data = await readBody(req);
      const token = data.token || req.headers.authorization?.replace("Bearer ", "");
      const session = token ? await db.getSession(token) : null;
      if (!session) return json(res, 401, { error: "Not logged in" });
      const user = await db.getUserAuth(session.user_id);
      if (!user || !auth.verifyPassword((data.password || "").trim(), user.password_hash)) {
        return json(res, 401, { error: "Password required to delete account" });
      }
      disconnectUser(session.user_id);
      await db.deleteUser(session.user_id);
      return json(res, 200, { ok: true });
    }

    json(res, 404, { error: "Not found" });
  } catch (e) {
    console.error("Auth API error:", e);
    json(res, 500, { error: e.message || "Server error" });
  }
}

async function getUserFromToken(token) {
  if (!token) return null;
  const session = await db.getSession(token);
  if (!session) return null;
  return db.getUserById(session.user_id);
}

// ── Admin API ──

async function handleAdminAPI(req, res, url) {
  const authHeader = req.headers["x-admin-password"];
  if (authHeader !== getAdminPassword()) {
    return json(res, 401, { error: "Unauthorized" });
  }

  const route = url.pathname.replace("/api/admin/", "");

  try {
    if (req.method === "GET" && route === "stats") {
      const mem = process.memoryUsage();
      const memoryMB = parseInt(cfg("MEMORY_MB", "256"));
      const maxConnections = parseInt(cfg("MAX_CONNECTIONS", "50"));
      const rateLimitPerMin = parseInt(cfg("RATE_LIMIT_PER_MIN", "30"));
      const maxStorageMB = parseInt(cfg("MAX_STORAGE_MB", "500"));
      const autoPurgeDays = parseInt(cfg("AUTO_PURGE_DAYS", "30"));
      const workerThreads = parseInt(cfg("WORKER_THREADS", "1"));

      const capacity = estimateCapacity({ memoryMB, maxConnections, rateLimitPerMin, workerThreads });
      const totalUsers = await db.countUsers();
      const onlineUserIds = new Set([...clients.values()].map((c) => c.userId));
      const usersOnline = onlineUserIds.size;
      const usersOffline = Math.max(0, totalUsers - usersOnline);

      return json(res, 200, {
        uptime: Math.floor((Date.now() - serverStartTime) / 1000),
        connections: clients.size,
        maxConnections,
        totalMessages: await db.countMessages(),
        totalDMs: await db.countDMs(),
        totalUsers,
        usersOnline,
        usersOffline,
        allUsers: (await db.listAllUsers()).map((u) => ({
          ...u,
          online: onlineUserIds.has(u.id),
        })),
        totalMessagesServed,
        storageMB: db.getStorageSizeMB(),
        maxStorageMB,
        storagePath: db.getDataDir(),
        memoryMB: +(mem.heapUsed / (1024 * 1024)).toFixed(1),
        memoryLimitMB: memoryMB,
        workerThreads,
        rooms: await db.getRooms(),
        rateLimitPerMin,
        autoPurgeDays,
        capacity,
        onlineUsers: [...clients.values()].map((c) => ({
          username: c.username,
          userId: c.userId,
          room: c.room,
        })),
        installerReady: fs.existsSync(path.join(__dirname, "dist", "ChatServer-Portable.zip")),
      });
    }

    if (req.method === "GET" && route === "download") {
      const zipPath = path.join(__dirname, "dist", "ChatServer-Portable.zip");
      if (!fs.existsSync(zipPath)) {
        return json(res, 404, { error: "Installer not built yet. Click Build Installer first." });
      }
      res.writeHead(200, {
        "Content-Type": "application/zip",
        "Content-Disposition": 'attachment; filename="ChatServer-Portable.zip"',
      });
      return fs.createReadStream(zipPath).pipe(res);
    }

    if (req.method === "GET" && route === "export-data") {
      const exportDir = path.join(__dirname, "dist");
      if (!fs.existsSync(exportDir)) fs.mkdirSync(exportDir, { recursive: true });
      const zipPath = path.join(exportDir, `chat-data-export-${Date.now()}.zip`);
      try {
        db.exportDataZip(zipPath);
        res.writeHead(200, {
          "Content-Type": "application/zip",
          "Content-Disposition": 'attachment; filename="chat-data-export.zip"',
        });
        const stream = fs.createReadStream(zipPath);
        stream.pipe(res);
        stream.on("end", () => {
          try {
            fs.unlinkSync(zipPath);
          } catch {
            /* temp cleanup */
          }
        });
        return;
      } catch (e) {
        return json(res, 500, { error: e.message });
      }
    }

    if (req.method === "POST") {
      const data = await readBody(req);
      return handleAdminPost(route, data, res);
    }

    json(res, 404, { error: "Not found" });
  } catch (e) {
    console.error("Admin API error:", e);
    json(res, 500, { error: e.message || "Server error" });
  }
}

async function handleAdminPost(route, data, res) {
  try {
    switch (route) {
      case "settings": {
        if (data.maxConnections != null) process.env.MAX_CONNECTIONS = String(data.maxConnections);
        if (data.rateLimitPerMin != null) process.env.RATE_LIMIT_PER_MIN = String(data.rateLimitPerMin);
        if (data.maxStorageMB != null) process.env.MAX_STORAGE_MB = String(data.maxStorageMB);
        if (data.autoPurgeDays != null) process.env.AUTO_PURGE_DAYS = String(data.autoPurgeDays);
        if (data.memoryMB != null) process.env.MEMORY_MB = String(data.memoryMB);
        if (data.workerThreads != null) process.env.WORKER_THREADS = String(data.workerThreads);
        if (data.adminPassword) process.env.ADMIN_PASSWORD = data.adminPassword;
        saveEnv();
        const needsRestart = !!(data.memoryMB != null || data.workerThreads != null || data.storagePath);
        return json(res, 200, { ok: true, needsRestart });
      }
      case "storage/move": {
        const newPath = (data.path || "").trim();
        if (!newPath) return json(res, 400, { error: "Path required" });
        const result = await db.relocateStorage(newPath);
        process.env.STORAGE_PATH = result.dataDir;
        saveEnv();
        return json(res, 200, {
          ok: true,
          storagePath: result.dataDir,
          message: "Storage moved. Data copied if needed.",
        });
      }
      case "purge": {
        let deleted;
        if (data.days === -1) {
          const r = await db.deleteAllMessages();
          await db.exec("VACUUM");
          deleted = r.changes;
        } else {
          deleted = await db.purgeOldMessages(data.days || 0);
        }
        return json(res, 200, { deleted });
      }
      case "rooms/create": {
        const name = (data.name || "").trim().toLowerCase().replace(/[^a-z0-9-_]/g, "");
        if (!name || name === "general") return json(res, 400, { error: "Invalid room name" });
        await db.insertRoom(name, null, 0);
        await refreshAllRoomLists();
        return json(res, 200, { ok: true });
      }
      case "users/delete": {
        const targetId = (data.userId || "").trim().toUpperCase();
        if (!targetId) return json(res, 400, { error: "userId required" });
        if (!(await db.getUserById(targetId))) return json(res, 404, { error: "User not found" });
        disconnectUser(targetId);
        await db.deleteUser(targetId);
        return json(res, 200, { ok: true });
      }
      case "rooms/delete": {
        const name = (data.name || "").trim();
        if (name === "general") return json(res, 400, { error: "Cannot delete #general" });
        await db.deleteRoomMessages(name);
        await db.deleteRoom(name);
        for (const [ws, info] of clients) {
          if (info.room === name) {
            info.room = "general";
            ws.send(JSON.stringify({ type: "room_deleted", room: name }));
          }
        }
        await refreshAllRoomLists();
        return json(res, 200, { ok: true });
      }
      case "kick": {
        for (const [ws, info] of clients) {
          if (info.userId === data.userId || info.username === data.username) {
            ws.send(JSON.stringify({ type: "kicked" }));
            ws.close();
          }
        }
        return json(res, 200, { ok: true });
      }
      case "build-installer": {
        const { execSync } = require("child_process");
        try {
          execSync("powershell -ExecutionPolicy Bypass -File build\\package-portable.ps1", {
            cwd: __dirname,
            timeout: 120000,
            stdio: "pipe",
          });
          return json(res, 200, { ok: true });
        } catch (e) {
          return json(res, 500, { error: e.stderr?.toString() || e.message });
        }
      }
      default:
        return json(res, 404, { error: "Unknown route" });
    }
  } catch (e) {
    console.error("Admin POST error:", e);
    return json(res, 500, { error: e.message || "Server error" });
  }
}

function saveEnv() {
  const lines = [
    `PORT=${cfg("PORT", "3000")}`,
    `HOST=${cfg("HOST", "0.0.0.0")}`,
    `ADMIN_PASSWORD=${getAdminPassword()}`,
    `MAX_STORAGE_MB=${cfg("MAX_STORAGE_MB", "500")}`,
    `MAX_CONNECTIONS=${cfg("MAX_CONNECTIONS", "50")}`,
    `RATE_LIMIT_PER_MIN=${cfg("RATE_LIMIT_PER_MIN", "30")}`,
    `AUTO_PURGE_DAYS=${cfg("AUTO_PURGE_DAYS", "30")}`,
    `MEMORY_MB=${cfg("MEMORY_MB", "256")}`,
    `WORKER_THREADS=${cfg("WORKER_THREADS", "1")}`,
    `STORAGE_PATH=${cfg("STORAGE_PATH", db.getDataDir())}`,
  ];
  fs.writeFileSync(path.join(__dirname, ".env"), lines.join("\n") + "\n");
}

// ── WebSocket ──

const wss = new WebSocketServer({ server, path: "/ws" });

wss.on("connection", (ws, req) => {
  const ip = req.headers["x-forwarded-for"]?.split(",")[0]?.trim() || req.socket.remoteAddress;
  const maxConn = parseInt(cfg("MAX_CONNECTIONS", "50"));

  if (clients.size >= maxConn) {
    ws.send(JSON.stringify({ type: "error", message: "Server is full." }));
    ws.close();
    return;
  }

  ws.on("message", (raw) => {
    let msg;
    try {
      const str = raw.toString();
      if (str.length > 8000) return;
      msg = JSON.parse(str);
    } catch {
      return;
    }

    const handlers = {
      auth: () => handleAuth(ws, msg, ip),
      message: () => handleRoomMessage(ws, msg),
      switch_room: () => handleSwitchRoom(ws, msg),
      dm_send: () => handleDMSend(ws, msg),
      dm_history: () => handleDMHistory(ws, msg),
      friend_request: () => handleFriendRequest(ws, msg),
      friend_accept: () => handleFriendAccept(ws, msg),
      friends_list: () => handleFriendsList(ws),
      create_room: () => handleCreateRoom(ws, msg),
    };

    const handler = handlers[msg.type];
    if (handler) {
      handler().catch((e) => {
        console.error(`WS ${msg.type} error:`, e);
        if (ws.readyState === 1) {
          ws.send(JSON.stringify({ type: "error", message: "Server error. Try again." }));
        }
      });
    }
  });

  ws.on("close", () => {
    const info = clients.get(ws);
    if (info) {
      clients.delete(ws);
      broadcastToRoom(info.room, {
        type: "user_left",
        username: info.username,
        userId: info.userId,
        online: onlineInRoom(info.room),
      });
    }
  });
});

async function handleAuth(ws, msg, ip) {
  const user = await getUserFromToken(msg.token);
  if (!user) {
    ws.send(JSON.stringify({ type: "error", message: "Login required. Please sign in." }));
    return;
  }

  const room = "general";
  clients.set(ws, { userId: user.id, username: user.username, room, ip, token: msg.token });

  const recent = (await db.getRecentMessages(room, 50)).reverse();
  const friends = await db.listFriends(user.id);
  const pending = await db.listPendingRequests(user.id);

  ws.send(
    JSON.stringify({
      type: "init",
      room,
      userId: user.id,
      username: user.username,
      messages: recent,
      rooms: formatRoomsForClient(await db.getRoomsForUser(user.id)),
      friends: friends.map((f) => ({ userId: f.friend_id, username: f.username })),
      friendRequests: pending.map((p) => ({ userId: p.from_id, username: p.username })),
    })
  );

  broadcastToRoom(room, {
    type: "user_joined",
    username: user.username,
    userId: user.id,
    online: onlineInRoom(room),
  });
}

async function handleRoomMessage(ws, msg) {
  const info = clients.get(ws);
  if (!info) return;

  if (!(await db.canAccessRoom(info.userId, info.room))) {
    ws.send(JSON.stringify({ type: "error", message: "You do not have access to this room." }));
    return;
  }

  const text = (msg.text || "").trim().slice(0, 2000);
  if (!text) return;

  const limit = parseInt(cfg("RATE_LIMIT_PER_MIN", "30"));
  const now = Date.now();
  let rl = rateLimits.get(info.ip);
  if (!rl || now > rl.resetAt) {
    rl = { count: 0, resetAt: now + 60000 };
    rateLimits.set(info.ip, rl);
  }
  rl.count++;
  if (rl.count > limit) {
    ws.send(JSON.stringify({ type: "error", message: "Slow down! Rate limit reached." }));
    return;
  }

  await db.enforceStorageLimit(parseInt(cfg("MAX_STORAGE_MB", "500")));
  const timestamp = Date.now();
  const result = await db.insertMsg(info.room, info.userId, info.username, text, timestamp);
  totalMessagesServed++;

  broadcastToRoom(info.room, {
    type: "message",
    id: result.lastInsertRowid,
    userId: info.userId,
    username: info.username,
    text,
    timestamp,
    room: info.room,
  });
}

async function handleSwitchRoom(ws, msg) {
  const info = clients.get(ws);
  if (!info) return;
  const newRoom = (msg.room || "").trim().toLowerCase();
  if (!newRoom) return;

  if (!(await db.canAccessRoom(info.userId, newRoom))) {
    ws.send(JSON.stringify({ type: "error", message: "You are not a member of this room." }));
    return;
  }

  const oldRoom = info.room;
  info.room = newRoom;

  broadcastToRoom(oldRoom, {
    type: "user_left",
    username: info.username,
    userId: info.userId,
    online: onlineInRoom(oldRoom),
  });

  const recent = (await db.getRecentMessages(newRoom, 50)).reverse();
  ws.send(JSON.stringify({ type: "room_switched", room: newRoom, messages: recent }));

  broadcastToRoom(newRoom, {
    type: "user_joined",
    username: info.username,
    userId: info.userId,
    online: onlineInRoom(newRoom),
  });
}

async function handleDMSend(ws, msg) {
  const info = clients.get(ws);
  if (!info) return;
  const toUser = (msg.toUserId || "").trim().toUpperCase();
  const text = (msg.text || "").trim().slice(0, 2000);
  if (!toUser || !text) return;

  const target = await db.getUserById(toUser);
  if (!target) {
    ws.send(JSON.stringify({ type: "error", message: "User ID not found" }));
    return;
  }

  const friendship = await db.getFriendship(info.userId, toUser);
  if (!friendship || friendship.status !== "accepted") {
    ws.send(
      JSON.stringify({
        type: "error",
        message: "You must be friends to send DMs. Send a friend request first.",
      })
    );
    return;
  }

  const timestamp = Date.now();
  const result = await db.insertDM(info.userId, toUser, text, timestamp);
  const payload = {
    type: "dm",
    id: result.lastInsertRowid,
    fromUserId: info.userId,
    fromUsername: info.username,
    toUserId: toUser,
    text,
    timestamp,
  };

  ws.send(JSON.stringify(payload));
  for (const [sock, c] of clients) {
    if (c.userId === toUser && sock.readyState === 1) {
      sock.send(JSON.stringify(payload));
    }
  }
}

async function handleDMHistory(ws, msg) {
  const info = clients.get(ws);
  if (!info) return;
  const withUser = (msg.withUserId || "").trim().toUpperCase();
  if (!withUser) return;
  const messages = await db.getDMHistory(info.userId, withUser, 100);
  ws.send(JSON.stringify({ type: "dm_history", withUserId: withUser, messages }));
}

async function handleFriendRequest(ws, msg) {
  const info = clients.get(ws);
  if (!info) return;
  const toUser = (msg.toUserId || "").trim().toUpperCase();
  if (!toUser || toUser === info.userId) {
    ws.send(JSON.stringify({ type: "error", message: "Invalid user ID" }));
    return;
  }
  if (!(await db.getUserById(toUser))) {
    ws.send(JSON.stringify({ type: "error", message: "User ID not found" }));
    return;
  }
  const existing = await db.getFriendship(info.userId, toUser);
  if (existing) {
    ws.send(
      JSON.stringify({
        type: "error",
        message: existing.status === "accepted" ? "Already friends" : "Request already sent",
      })
    );
    return;
  }
  await db.addFriendRequest(info.userId, toUser);

  const targetUser = await db.getUserById(toUser);
  for (const [sock, c] of clients) {
    if (c.userId === toUser && sock.readyState === 1) {
      sock.send(
        JSON.stringify({
          type: "friend_request",
          fromUserId: info.userId,
          fromUsername: info.username,
        })
      );
    }
  }
  ws.send(JSON.stringify({ type: "friend_sent", userId: toUser, username: targetUser?.username }));
}

async function handleFriendAccept(ws, msg) {
  const info = clients.get(ws);
  if (!info) return;
  const fromUser = (msg.fromUserId || "").trim().toUpperCase();
  await db.acceptFriend(fromUser, info.userId);
  const from = await db.getUserById(fromUser);
  ws.send(
    JSON.stringify({
      type: "friend_accepted",
      userId: fromUser,
      username: from?.username,
    })
  );
  for (const [sock, c] of clients) {
    if (c.userId === fromUser && sock.readyState === 1) {
      sock.send(
        JSON.stringify({
          type: "friend_accepted",
          userId: info.userId,
          username: info.username,
        })
      );
    }
  }
}

async function handleFriendsList(ws) {
  const info = clients.get(ws);
  if (!info) return;
  const friends = await db.listFriends(info.userId);
  ws.send(
    JSON.stringify({
      type: "friends_list",
      friends: friends.map((f) => ({ userId: f.friend_id, username: f.username })),
    })
  );
}

async function handleCreateRoom(ws, msg) {
  const info = clients.get(ws);
  if (!info) return;

  const name = (msg.name || "").trim().toLowerCase().replace(/[^a-z0-9-_]/g, "");
  if (!name || name === "general") {
    ws.send(JSON.stringify({ type: "error", message: "Invalid room name" }));
    return;
  }
  if (await db.getRoom(name)) {
    ws.send(JSON.stringify({ type: "error", message: "Room already exists" }));
    return;
  }

  const memberIds = Array.isArray(msg.memberIds)
    ? msg.memberIds.map((id) => String(id).trim().toUpperCase())
    : [];
  const uniqueMembers = new Set([info.userId, ...memberIds]);

  await db.insertRoom(name, info.userId, 1);
  for (const uid of uniqueMembers) {
    if (!(await db.getUserById(uid))) continue;
    const friendship = await db.getFriendship(info.userId, uid);
    if (uid === info.userId || (friendship && friendship.status === "accepted")) {
      await db.addRoomMember(name, uid);
    }
  }

  ws.send(
    JSON.stringify({
      type: "room_created",
      room: name,
      rooms: formatRoomsForClient(await db.getRoomsForUser(info.userId)),
    })
  );

  for (const uid of uniqueMembers) {
    for (const [sock, c] of clients) {
      if (c.userId === uid && sock.readyState === 1) {
        sock.send(
          JSON.stringify({
            type: "room_list",
            rooms: formatRoomsForClient(await db.getRoomsForUser(uid)),
          })
        );
      }
    }
  }
}

function formatRoomsForClient(rooms) {
  return rooms.map((r) => ({
    name: r.name,
    isPrivate: !!r.is_private,
    ownerId: r.owner_id,
    ownerName: r.owner_name,
  }));
}

async function refreshAllRoomLists() {
  for (const [sock, c] of clients) {
    if (sock.readyState === 1) {
      sock.send(
        JSON.stringify({
          type: "room_list",
          rooms: formatRoomsForClient(await db.getRoomsForUser(c.userId)),
        })
      );
    }
  }
}

function disconnectUser(userId) {
  for (const [sock, info] of clients) {
    if (info.userId === userId) {
      sock.send(JSON.stringify({ type: "account_deleted" }));
      sock.close();
    }
  }
  db.deleteAllSessionsForUser(userId).catch((e) => console.error("delete sessions:", e));
}

function broadcastToRoom(room, data) {
  const payload = JSON.stringify(data);
  for (const [ws, info] of clients) {
    if (info.room === room && ws.readyState === 1) ws.send(payload);
  }
}

function onlineInRoom(room) {
  const users = [];
  for (const info of clients.values()) {
    if (info.room === room) users.push({ username: info.username, userId: info.userId });
  }
  const seen = new Set();
  return users.filter((u) => {
    const k = u.userId;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

setInterval(() => {
  db.purgeExpiredSessions().catch((e) => console.error("purge sessions:", e));
}, 3600000);
setInterval(() => {
  const days = parseInt(cfg("AUTO_PURGE_DAYS", "30"));
  if (days > 0) {
    db.purgeOldMessages(days).catch((e) => console.error("purge messages:", e));
  }
}, 3600000);
setInterval(() => {
  const now = Date.now();
  for (const [ip, rl] of rateLimits) {
    if (now > rl.resetAt) rateLimits.delete(ip);
  }
}, 300000);

db.initDatabase()
  .then(() => {
    server.listen(PORT, HOST, () => {
      const mem = cfg("MEMORY_MB", "256");
      console.log(`
  ┌──────────────────────────────────────────┐
  │         Chat Server Running              │
  │  Chat:       http://localhost:${PORT}       │
  │  Dashboard:  http://localhost:${PORT}/dashboard │
  │  Network:     http://0.0.0.0:${PORT} (all interfaces) │
  │  Memory cap: ${String(mem + " MB").padEnd(26)}│
  │  Storage:    ${db.getDataDir().slice(0, 26).padEnd(26)}│
  └──────────────────────────────────────────┘
  `);
    });
  })
  .catch((err) => {
    console.error("Failed to open database:", err);
    process.exit(1);
  });
