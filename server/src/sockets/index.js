const { verifyToken, hashToken } = require("../utils/jwt");
const prisma = require("../prisma/client");

// Tracks which userIds currently have at least one open socket, so we can
// broadcast accurate online/offline status without hitting the DB per event.
const onlineUsers = new Map(); // userId -> Set(socketId)

function markOnline(io, userId, socketId) {
  if (!onlineUsers.has(userId)) onlineUsers.set(userId, new Set());
  onlineUsers.get(userId).add(socketId);
  if (onlineUsers.get(userId).size === 1) {
    io.emit("online", { userId, online: true });
  }
}

function markOffline(io, userId, socketId) {
  const set = onlineUsers.get(userId);
  if (!set) return;
  set.delete(socketId);
  if (set.size === 0) {
    onlineUsers.delete(userId);
    io.emit("online", { userId, online: false });
  }
}

function initSockets(io) {
  // Auth handshake middleware: every socket connection must present the
  // same JWT used for REST calls, and it must map to an active session.
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error("Missing token"));

      const payload = verifyToken(token);
      const session = await prisma.session.findFirst({
        where: { tokenHash: hashToken(token), userId: payload.sub, expiresAt: { gt: new Date() } },
      });
      if (!session) return next(new Error("Session expired or revoked"));

      const user = await prisma.user.findUnique({ where: { id: payload.sub } });
      if (!user || user.disabled) return next(new Error("Account disabled"));

      socket.user = user;
      next();
    } catch (err) {
      next(new Error("Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    markOnline(io, socket.user.id, socket.id);

    socket.on("join_room", (roomId) => {
      socket.join(roomId);
    });

    socket.on("leave_room", (roomId) => {
      socket.leave(roomId);
    });

    socket.on("typing", ({ roomId, isTyping }) => {
      socket.to(roomId).emit("typing", {
        roomId,
        userId: socket.user.id,
        name: socket.user.name,
        isTyping: !!isTyping,
      });
    });

    socket.on("send_message", async ({ roomId, type, content, mediaUrl }, callback) => {
      try {
        if (type === "text" && !content) throw new Error("content is required");
        if (type !== "text" && !mediaUrl) throw new Error("mediaUrl is required");

        const message = await prisma.message.create({
          data: { roomId, senderId: socket.user.id, type, content, mediaUrl },
          include: { sender: { select: { id: true, name: true, phone: true } } },
        });

        io.to(roomId).emit("receive_message", message);
        callback?.({ ok: true, message });
      } catch (err) {
        callback?.({ ok: false, error: err.message });
      }
    });

    socket.on("read_receipt", ({ roomId, messageId }) => {
      socket.to(roomId).emit("read_receipt", {
        roomId,
        messageId,
        userId: socket.user.id,
      });
    });

    socket.on("disconnect", () => {
      markOffline(io, socket.user.id, socket.id);
    });
  });
}

module.exports = { initSockets };
