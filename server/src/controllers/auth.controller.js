const bcrypt = require("bcrypt");
const prisma = require("../prisma/client");
const { signToken, hashToken } = require("../utils/jwt");

const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

// POST /auth/login — no password here. This only checks the phone is a
// known, approved, non-disabled user. The actual one-time code was
// already generated and handed out by an Admin.
async function login(req, res) {
  const { phone } = req.body;
  const user = await prisma.user.findUnique({ where: { phone } });

  if (!user || user.disabled) {
    return res.status(403).json({ error: "Account not found or disabled" });
  }
  if (!user.approved) {
    return res.status(403).json({ error: "Account pending admin approval" });
  }

  return res.json({ message: "Enter the one-time code provided by your admin." });
}

// POST /auth/verify — checks the one-time code, marks it used, issues a JWT.
async function verify(req, res) {
  const { phone, code } = req.body;

  const user = await prisma.user.findUnique({ where: { phone } });
  if (!user || user.disabled || !user.approved) {
    return res.status(403).json({ error: "Account not found, disabled, or unapproved" });
  }

  const candidates = await prisma.loginCode.findMany({
    where: { userId: user.id, used: false, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: "desc" },
  });

  let matched = null;
  for (const candidate of candidates) {
    if (await bcrypt.compare(code, candidate.codeHash)) {
      matched = candidate;
      break;
    }
  }

  if (!matched) {
    return res.status(401).json({ error: "Invalid or expired code" });
  }

  // Single-use: mark this code used immediately so it can never be replayed.
  await prisma.loginCode.update({
    where: { id: matched.id },
    data: { used: true },
  });

  const token = signToken({ sub: user.id, isAdmin: user.isAdmin });
  await prisma.session.create({
    data: {
      userId: user.id,
      tokenHash: hashToken(token),
      expiresAt: new Date(Date.now() + SESSION_TTL_MS),
    },
  });

  return res.json({
    token,
    user: { id: user.id, name: user.name, phone: user.phone, isAdmin: user.isAdmin },
  });
}

// POST /auth/logout — deletes the current session row, revoking the token.
async function logout(req, res) {
  await prisma.session.deleteMany({
    where: { userId: req.user.id, tokenHash: req.tokenHash },
  });
  return res.json({ message: "Logged out" });
}

module.exports = { login, verify, logout };
