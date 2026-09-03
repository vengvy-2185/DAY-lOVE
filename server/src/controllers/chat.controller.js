const prisma = require("../config/prisma");

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

// GET /messages/:roomId — Fetch messages with sender & reply details
async function listMessages(req, res) {
  const { roomId } = req.params;
  const messages = await prisma.message.findMany({
    where: { roomId },
    orderBy: { createdAt: "asc" },
    include: {
      sender: { select: { id: true, name: true, phone: true } },
      replyTo: {
        include: {
          sender: { select: { id: true, name: true } },
        },
      },
    },
  });
  return res.json(messages);
}

// POST /messages — Support text, media, and replyToId
async function createMessage(req, res) {
  const { roomId, type, content, mediaUrl, replyToId } = req.body;

  if (type === "text" && !content) {
    return res.status(400).json({ error: "content is required for text messages" });
  }
  if (type !== "text" && !mediaUrl) {
    return res.status(400).json({ error: "mediaUrl is required for media messages" });
  }

  const message = await prisma.message.create({
    data: {
      roomId,
      senderId: req.user.id,
      type,
      content,
      mediaUrl,
      replyToId: replyToId || null,
    },
    include: {
      sender: { select: { id: true, name: true, phone: true } },
      replyTo: {
        include: {
          sender: { select: { id: true, name: true } },
        },
      },
    },
  });

  const io = req.app.get("io");
  io.to(roomId).emit("receive_message", message);

  return res.status(201).json(message);
}

// PUT /messages/:id — Edit a message
async function editMessage(req, res) {
  const { id } = req.params;
  const { content } = req.body;

  if (!content) {
    return res.status(400).json({ error: "Content is required to edit message" });
  }

  const message = await prisma.message.findUnique({ where: { id } });
  if (!message) {
    return res.status(404).json({ error: "Message not found" });
  }

  if (message.senderId !== req.user.id) {
    return res.status(403).json({ error: "Unauthorized to edit this message" });
  }

  const updatedMessage = await prisma.message.update({
    where: { id },
    data: {
      content,
      isEdited: true,
    },
    include: {
      sender: { select: { id: true, name: true, phone: true } },
      replyTo: {
        include: {
          sender: { select: { id: true, name: true } },
        },
      },
    },
  });

  const io = req.app.get("io");
  io.to(message.roomId).emit("message_edited", updatedMessage);

  return res.json(updatedMessage);
}

// DELETE /messages/:id — Delete a message
async function deleteMessage(req, res) {
  const { id } = req.params;

  const message = await prisma.message.findUnique({ where: { id } });
  if (!message) {
    return res.status(404).json({ error: "Message not found" });
  }

  if (message.senderId !== req.user.id) {
    return res.status(403).json({ error: "Unauthorized to delete this message" });
  }

  await prisma.message.delete({ where: { id } });

  const io = req.app.get("io");
  io.to(message.roomId).emit("message_deleted", { id, roomId: message.roomId });

  return res.status(204).send();
}

module.exports = {
  listRooms,
  createRoom,
  deleteRoom,
  listMessages,
  createMessage,
  editMessage,
  deleteMessage,
};