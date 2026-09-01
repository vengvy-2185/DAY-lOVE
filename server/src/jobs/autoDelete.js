const cron = require("node-cron");
const prisma = require("../../prisma/schema.prisma");
const { supabase, BUCKET } = require("../config/supabase");

const CUTOFF_MS = 24 * 60 * 60 * 1000; // 24 hours

// Deletes every message older than 24h, and — for media messages — first
// removes the underlying object from Supabase Storage so nothing orphaned
// is left in the bucket. Runs on the schedule set by AUTO_DELETE_CRON.
async function runAutoDelete() {
  const cutoff = new Date(Date.now() - CUTOFF_MS);

  const expired = await prisma.message.findMany({
    where: { createdAt: { lt: cutoff }, mediaUrl: { not: null } },
    select: { id: true, mediaUrl: true },
  });

  if (expired.length > 0) {
    const keys = expired
      .map((m) => extractStorageKey(m.mediaUrl))
      .filter(Boolean);
    if (keys.length > 0) {
      const { error } = await supabase.storage.from(BUCKET).remove(keys);
      if (error) console.error("Auto-delete: failed removing storage objects", error);
    }
  }

  const result = await prisma.message.deleteMany({
    where: { createdAt: { lt: cutoff } },
  });

  // Housekeeping: also clear out spent/expired login codes and sessions.
  await prisma.loginCode.deleteMany({
    where: { expiresAt: { lt: new Date(Date.now() - CUTOFF_MS) } },
  });
  await prisma.session.deleteMany({ where: { expiresAt: { lt: new Date() } } });

  if (result.count > 0) {
    console.log(`Auto-delete: removed ${result.count} message(s) older than 24h`);
  }
}

function extractStorageKey(publicUrl) {
  try {
    const marker = `/object/public/`;
    const idx = publicUrl.indexOf(marker);
    if (idx === -1) return null;
    const afterMarker = publicUrl.slice(idx + marker.length); // "bucket/key..."
    const slashIdx = afterMarker.indexOf("/");
    return afterMarker.slice(slashIdx + 1);
  } catch {
    return null;
  }
}

function scheduleAutoDelete() {
  const schedule = process.env.AUTO_DELETE_CRON || "*/15 * * * *";
  cron.schedule(schedule, () => {
    runAutoDelete().catch((err) => console.error("Auto-delete job failed", err));
  });
  console.log(`Auto-delete job scheduled: "${schedule}"`);
}

module.exports = { scheduleAutoDelete, runAutoDelete };
