const express = require("express");
const { login, verify, logout } = require("../controllers/auth.controller");
const { loginSchema, verifySchema, validate } = require("../utils/validation");
const { requireAuth } = require("../middleware/auth");
const { authLimiter } = require("../middleware/rateLimit");

const router = express.Router();

router.post("/login", authLimiter, validate(loginSchema), login);
router.post("/verify", authLimiter, validate(verifySchema), verify);
router.post("/logout", requireAuth, logout);

module.exports = router;
