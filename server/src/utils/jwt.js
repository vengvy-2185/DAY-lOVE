const jwt = require("jsonwebtoken");
const crypto = require("crypto");

function signToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
}

function verifyToken(token) {
  return jwt.verify(token, process.env.JWT_SECRET);
}

// We store only a hash of the JWT in the sessions table, so a stolen DB
// dump can't be used to forge/replay tokens, and admins can revoke a
// session by deleting its row.
function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

module.exports = { signToken, verifyToken, hashToken };
