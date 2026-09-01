const prisma = require('../config/prisma');

// GET /rooms
async function listRooms(req, res) {
  const rooms = await prisma.room.findMany({ orderBy: { createdAt: "desc" } });
  return res.json(rooms);
}

// POST /rooms
async function createRoom(req, res) {
  const { name } = req.body;
  const room = await prisma.room.create({ data: { name } });
  return res.status(201).json(room);
}

// DELETE /rooms/:id
async function deleteRoom(req, res) {
  const { id } = req.params;

  const room = await prisma.room.findUnique({ where: { id } });
  if (!room) {
    return res.status(404).json({ error: "Room not found" });
  }

  await prisma.room.delete({ where: { id } });

  const io = req.app.get("io");
  io.to(id).emit("room_deleted", { roomId: id });

  return res.status(204).send();
}

// GET /messages/:roomId
async function listMessages(req, res) {
  const { roomId } = req.params;
  const messages = await prisma.message.findMany({
    where: { roomId },
    orderBy: { createdAt: "asc" },
    include: { sender: { select: { id: true, name: true, phone: true } } },
  });
  return res.json(messages);
}

// POST /messages — REST fallback for sending a message (Socket.IO's
// `send_message` event is the primary real-time path; both write through
// the same Prisma call so history stays consistent either way).
async function createMessage(req, res) {
  const { roomId, type, content, mediaUrl } = req.body;

  if (type === "text" && !content) {
    return res.status(400).json({ error: "content is required for text messages" });
  }
  if (type !== "text" && !mediaUrl) {
    return res.status(400).json({ error: "mediaUrl is required for media messages" });
  }

  const message = await prisma.message.create({
    data: { roomId, senderId: req.user.id, type, content, mediaUrl },
    include: { sender: { select: { id: true, name: true, phone: true } } },
  });

  const io = req.app.get("io");
  io.to(roomId).emit("receive_message", message);

  return res.status(201).json(message);
}

module.exports = { listRooms, createRoom, deleteRoom, listMessages, createMessage };
