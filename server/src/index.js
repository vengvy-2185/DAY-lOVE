require("dotenv").config();
const express = require("express");
const http = require("http");
const cors = require("cors");
const helmet = require("helmet");
const { Server } = require("socket.io");
const prisma = require('../config/prisma'); // ✅
const authRoutes = require("./routes/auth.routes");
const adminRoutes = require("./routes/admin.routes");
const chatRoutes = require("./routes/chat.routes");
const uploadRoutes = require("./routes/upload.routes");
const errorHandler = require("./middleware/errorHandler");
const { apiLimiter } = require("./middleware/rateLimit");
const { initSockets } = require("./sockets");
const { scheduleAutoDelete } = require("./jobs/autoDelete");

const app = express();
const server = http.createServer(app);

// 1. Clean up CLIENT_ORIGIN (ដក trailing slash ប្រសិនបើមាន)
const CLIENT_ORIGIN = (process.env.CLIENT_ORIGIN || "http://localhost:5173").replace(/\/+$/, "");

// 2. CORS Option Configuration
const corsOptions = {
  origin: [CLIENT_ORIGIN, "https://day-life-two.vercel.app"],
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

const io = new Server(server, {
  cors: corsOptions,
});
app.set("io", io);

// --- Security & core middleware ---
app.use(helmet());
app.use(cors(corsOptions));
app.options("*", cors(corsOptions)); // Handle Preflight requests

app.use(express.json({ limit: "1mb" }));
app.use(apiLimiter);

// --- Routes ---
app.get("/health", (req, res) => res.json({ status: "ok" }));
app.use("/auth", authRoutes);
app.use("/admin", adminRoutes);
app.use("/", chatRoutes);       // /rooms, /messages/:roomId, /messages
app.use("/upload", uploadRoutes);

app.use(errorHandler);

initSockets(io);
scheduleAutoDelete();

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`Day Life server listening on port ${PORT}`);
});