require("dotenv").config();
const express = require("express");
const http = require("http");
const cors = require("cors");
const helmet = require("helmet");
const { Server } = require("socket.io");
const prisma = require("./config/prisma");
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

// 1. Clean up CLIENT_ORIGIN
const rawOrigin = process.env.CLIENT_ORIGIN || "https://day-l-ove.vercel.app";
const CLIENT_ORIGIN = rawOrigin.replace(/\/+$/, "");

// 2. CORS Dynamic Allowed Origins Configuration
const allowedOrigins = [
  CLIENT_ORIGIN,
  "https://day-l-ove.vercel.app",
  "http://localhost:5173",
];

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin.replace(/\/+$/, ""))) {
      callback(null, true);
    } else {
      callback(null, true);
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

const io = new Server(server, {
  cors: corsOptions,
  maxHttpBufferSize: 1e8, // 100MB សម្រាប់ Socket.io ផ្ញើ File/Media ធំៗ
});
app.set("io", io);

// --- Security & core middleware ---
app.use(cors(corsOptions));
app.use(
  helmet({
    crossOriginResourcePolicy: false, // អនុញ្ញាតឱ្យ Browser ទាញយករូបភាព និងវីដេអូបង្ហាញលើ Frontend
  })
);

// ✅ កែប្រែទំហំ Limit ពី 1mb ទៅ 50mb ដើមី្បអាច Upload Photo/Video បាន
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

app.use(apiLimiter);

// --- Routes ---
app.get("/health", (req, res) => res.json({ status: "ok" }));
app.use("/auth", authRoutes);
app.use("/admin", adminRoutes);
app.use("/", chatRoutes);
app.use("/upload", uploadRoutes);

app.use(errorHandler);

initSockets(io);
scheduleAutoDelete();

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`Day Life server listening on port ${PORT}`);
});