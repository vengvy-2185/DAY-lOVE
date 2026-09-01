const { PrismaClient } = require("@prisma/client");

// Single shared Prisma instance across the app (avoids exhausting DB
// connections in dev with hot-reload).
const prisma = global.__dayLifePrisma || new PrismaClient();
if (process.env.NODE_ENV !== "production") {
  global.__dayLifePrisma = prisma;
}

module.exports = prisma;
