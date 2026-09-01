const express = require("express");
const multer = require("multer");
const crypto = require("crypto");
const path = require("path");
const { supabase, BUCKET } = require("../config/supabase");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

const ALLOWED_MIME = {
  image: ["image/jpeg", "image/png", "image/webp", "image/gif"],
  video: ["video/mp4", "video/webm", "video/quicktime"],
  voice: ["audio/mpeg", "audio/ogg", "audio/webm", "audio/wav", "audio/mp4"],
};
const ALL_ALLOWED = Object.values(ALLOWED_MIME).flat();
const MAX_SIZE_BYTES = 50 * 1024 * 1024; // 50MB

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_SIZE_BYTES },
  fileFilter: (req, file, cb) => {
    if (!ALL_ALLOWED.includes(file.mimetype)) {
      return cb(new Error("Unsupported file type"));
    }
    cb(null, true);
  },
});

function typeFromMime(mime) {
  if (ALLOWED_MIME.image.includes(mime)) return "image";
  if (ALLOWED_MIME.video.includes(mime)) return "video";
  if (ALLOWED_MIME.voice.includes(mime)) return "voice";
  return null;
}

// POST /upload — accepts one file, streams it to Supabase Storage under a
// random, non-guessable key, and returns { url, type } for use when
// creating a message. File type is validated by MIME (not extension).
router.post("/", requireAuth, upload.single("file"), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    const mediaType = typeFromMime(req.file.mimetype);
    if (!mediaType) return res.status(400).json({ error: "Unsupported file type" });

    const ext = path.extname(req.file.originalname) || "";
    const key = `${req.user.id}/${crypto.randomUUID()}${ext}`;

    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(key, req.file.buffer, { contentType: req.file.mimetype, upsert: false });

    if (error) throw error;

    const { data: publicUrlData } = supabase.storage.from(BUCKET).getPublicUrl(key);

    return res.status(201).json({ url: publicUrlData.publicUrl, type: mediaType, key });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
