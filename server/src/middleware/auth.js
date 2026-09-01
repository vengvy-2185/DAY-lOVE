const prisma = require("../prisma/client");
const { verifyToken, hashToken } = require("../utils/jwt");

// Verifies the JWT AND that a matching, unexpired session row still
// exists — this is what lets an admin instantly revoke a logged-in user
// (disable them / delete the session) without waiting for token expiry.
async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;
    if (!token) return res.status(401).json({ error: "Missing token" });

    const payload = verifyToken(token);
    const tokenHash = hashToken(token);

    const session = await prisma.session.findFirst({
      where: { tokenHash, userId: payload.sub, expiresAt: { gt: new Date() } },
    });
    if (!session) return res.status(401).json({ error: "Session expired or revoked" });

    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user || user.disabled) {
      return res.status(403).json({ error: "Account disabled" });
    }

    req.user = user;
    req.sessionId = session.id;
    req.tokenHash = tokenHash;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid token" });
  }
}

function requireAdmin(req, res, next) {
  if (!req.user?.isAdmin) return res.status(403).json({ error: "Admin only" });
  next();
}

module.exports = { requireAuth, requireAdmin };
