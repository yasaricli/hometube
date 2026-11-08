import fs from "node:fs/promises";
import { MEDIA_DIR } from "./config.js";
import { Channel, Video, getSettings } from "./models.js";

import { pickForCleanup } from "./cleanupRules.js";

const HOUR = 3_600_000;

// The downloaded videos the cleanup rules would delete now: [{ _id, size }].
export async function cleanupPlan(rules) {
  if (!rules.deleteWatchedDays && !rules.keepPerChannel) return [];
  const ready = await Video.find({ status: "ready" }, { channel: 1, short: 1, watchedAt: 1, uploadedAt: 1, createdAt: 1, size: 1 }).lean();
  return pickForCleanup(ready, rules);
}

// How much room the library takes, per channel, the disk around it, and what the next cleanup removes.
export async function storage() {
  const [videos, channels, disk, plan] = await Promise.all([
    Video.find({}, { channel: 1, size: 1 }).lean(),
    Channel.find({}, { name: 1 }).lean(),
    fs.statfs(MEDIA_DIR).catch(() => undefined),
    getSettings().then(cleanupPlan),
  ]);
  const byChannel = new Map(channels.map((c) => [String(c._id), { id: String(c._id), name: c.name, count: 0, size: 0 }]));
  for (const v of videos) {
    const row = byChannel.get(String(v.channel));
    if (!row) continue;
    row.count += 1;
    row.size += v.size || 0;
  }
  return {
    used: videos.reduce((sum, v) => sum + (v.size || 0), 0),
    free: disk ? disk.bavail * disk.bsize : 0,
    total: disk ? disk.blocks * disk.bsize : 0,
    channels: [...byChannel.values()].filter((c) => c.count).sort((a, b) => b.size - a.size),
    cleanup: { count: plan.length, size: plan.reduce((sum, v) => sum + (v.size || 0), 0) },
  };
}

// Deletes what the cleanup rules say: { removed }. removeVideo(id) deletes one video and its files.
export async function runCleanup(removeVideo) {
  const plan = await cleanupPlan(await getSettings());
  for (const v of plan) await removeVideo(String(v._id));
  if (plan.length) console.log(`cleanup removed ${plan.length} videos`);
  return { removed: plan.length };
}

// Runs the cleanup every hour, so a new rule gives an hour to change one's mind.
export function startCleanup(removeVideo, changed) {
  setInterval(async () => {
    const { removed } = await runCleanup(removeVideo).catch((err) => {
      console.error("cleanup failed", err.message);
      return { removed: 0 };
    });
    if (removed) changed();
  }, HOUR);
}
