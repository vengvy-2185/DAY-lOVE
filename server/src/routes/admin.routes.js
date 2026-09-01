const express = require("express");
const {
  createCode,
  listUsers,
  updateUser,
  revokeCode,
  deleteMessage,
  deleteRoom,
} = require("../controllers/admin.controller");
const { createCodeSchema, updateUserSchema, validate } = require("../utils/validation");
const { requireAuth, requireAdmin } = require("../middleware/auth");

const router = express.Router();

router.use(requireAuth, requireAdmin);

router.post("/code", validate(createCodeSchema), createCode);
router.get("/users", listUsers);
router.patch("/users/:id", validate(updateUserSchema), updateUser);
router.delete("/codes/:codeId", revokeCode);
router.delete("/messages/:id", deleteMessage);
router.delete("/rooms/:id", deleteRoom);

module.exports = router;
