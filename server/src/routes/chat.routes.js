const express = require("express");
const {
  listRooms,
  createRoom,
  deleteRoom,
  listMessages,
  createMessage,
} = require("../controllers/chat.controller");
const { createRoomSchema, createMessageSchema, validate } = require("../utils/validation");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

router.use(requireAuth);

router.get("/rooms", listRooms);
router.post("/rooms", validate(createRoomSchema), createRoom);
router.delete("/rooms/:id", deleteRoom);
router.get("/messages/:roomId", listMessages);
router.post("/messages", validate(createMessageSchema), createMessage);
router.put("/messages/:id", requireAuth, chatController.editMessage);
router.delete("/messages/:id", requireAuth, chatController.deleteMessage);

module.exports = router;
