// One-off script: creates (or promotes) the first admin user and prints a
// one-time login code for them, so there's a way in before any admin exists.
// Usage: PHONE=+15551234567 NAME="Admin" node src/utils/seedAdmin.js
require("dotenv").config();
const bcrypt = require("bcrypt");
const prisma = require("../prisma/client");
const { generateCode } = require("./otp");

async function main() {
  const phone = process.env.PHONE;
  const name = process.env.NAME || "Admin";
  if (!phone) {
    console.error("Set PHONE env var, e.g. PHONE=+15551234567 node src/utils/seedAdmin.js");
    process.exit(1);
  }

  const user = await prisma.user.upsert({
    where: { phone },
    update: { isAdmin: true, approved: true, disabled: false },
    create: { phone, name, isAdmin: true, approved: true },
  });

  const code = generateCode();
  const codeHash = await bcrypt.hash(code, 12);
  await prisma.loginCode.create({
    data: {
      userId: user.id,
      codeHash,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    },
  });

  console.log(`Admin ready: ${user.phone}`);
  console.log(`One-time login code (valid 5 min): ${code}`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
