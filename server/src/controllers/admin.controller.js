const bcrypt = require('bcryptjs');
const prisma = require('../config/prisma'); // ✅;
const { generateCode } = require("../utils/otp");

const CODE_TTL_MINUTES = Number(process.env.LOGIN_CODE_TTL_MINUTES || 5);

// POST /admin/code — generate (and return, once) a one-time login code
// for a user. Creates the user record if they don't exist yet
// (approved=false by default — admin must separately approve them).
async function createCode(req, res) {
  const { phone, name } = req.body;

  let user = await prisma.user.findUnique({ where: { phone } });
  if (!user) {
    user = await prisma.user.create({
      data: { phone, name: name || phone, approved: false },
    });
  }

  const code = generateCode();
  const codeHash = await bcrypt.hash(code, 12);

  await prisma.loginCode.create({
    data: {
      userId: user.id,
      codeHash,
      expiresAt: new Date(Date.now() + CODE_TTL_MINUTES * 60 * 1000),
    },
  });

  // The plaintext code is returned exactly once, here, to the admin who
  // generated it. It is never logged or stored anywhere in plaintext.
  return res.status(201).json({
    userId: user.id,
    phone: user.phone,
    code,
    expiresInMinutes: CODE_TTL_MINUTES,
  });
}

// GET /admin/users
async function listUsers(req, res) {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      phone: true,
      name: true,
      approved: true,
      disabled: true,
      isAdmin: true,
      createdAt: true,
      sessions: { select: { expiresAt: true }, where: { expiresAt: { gt: new Date() } } },
    },
  });

  const result = users.map((u) => ({
    ...u,
    online: u.sessions.length > 0,
    sessions: undefined,
  }));

  return res.json(result);
}

// PATCH /admin/users/:id — approve / disable / rename a user.
// Disabling a user also revokes all of their active sessions immediately.
async function updateUser(req, res) {
  const { id } = req.params;
  const data = req.body;

  const user = await prisma.user.update({ where: { id }, data });

  if (data.disabled === true) {
    await prisma.session.deleteMany({ where: { userId: id } });
  }

  return res.json(user);
}

// DELETE /admin/users/:id/codes/:codeId — revoke an unused one-time code.
async function revokeCode(req, res) {
  const { codeId } = req.params;
  await prisma.loginCode.updateMany({
    where: { id: codeId, used: false },
    data: { used: true },
  });
  return res.json({ message: "Code revoked" });
}

// DELETE /admin/messages/:id
async function deleteMessage(req, res) {
  const { id } = req.params;
  await prisma.message.delete({ where: { id } }).catch(() => null);
  return res.json({ message: "Message deleted" });
}

// DELETE /admin/rooms/:id — delete an entire conversation.
async function deleteRoom(req, res) {
  const { id } = req.params;
  await prisma.room.delete({ where: { id } }).catch(() => null);
  return res.json({ message: "Conversation deleted" });
}

module.exports = {
  createCode,
  listUsers,
  updateUser,
  revokeCode,
  deleteMessage,
  deleteRoom,
};
