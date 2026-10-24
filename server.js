import { createServer } from "node:http";
import fs from "node:fs/promises";
import next from "next";
import mongoose from "mongoose";
import { Server } from "socket.io";
import { MONGODB_URI, PORT, MEDIA_DIR } from "./lib/config.js";
import { Channel, Category, Video, Settings, getSettings, QUALITIES, RATE_LIMITS } from "./lib/models.js";
import { serveMedia, mediaDir, channelDir } from "./lib/media.js";
import { startQueue, enqueue, cancel, progress, stopRunning, wakeWaiting } from "./lib/queue.js";
import { videoIdOf, watchUrl, probe, videoFields, channelAvatarUrl, channelVideos } from "./lib/youtube.js";

const dev = process.argv.includes("--dev");
const app = next({ dev });

const ORDER = { order: 1, createdAt: 1 };
const categoryName = (name) => String(name || "").trim().slice(0, 40);
const validId = (id) => mongoose.isValidObjectId(id);

const videoWire = (v) => ({
  id: String(v._id),
  ytId: v.ytId,
  url: v.url,
  title: v.title,
  description: v.description,
  duration: v.duration,
  uploadedAt: v.uploadedAt ? new Date(v.uploadedAt).getTime() : 0,
  savedAt: new Date(v.createdAt).getTime(),
  channel: String(v.channel),
  category: v.category ? String(v.category) : "",
  status: v.status,
  error: v.error,
  retryAt: v.retryAt ? new Date(v.retryAt).getTime() : 0,
  size: v.size,
  progress: progress.get(String(v._id)),
});

async function library() {
  const [videos, channels, categories] = await Promise.all([
    Video.find().sort({ createdAt: -1 }).lean(),
    Channel.find().sort({ name: 1 }).lean(),
    Category.find().sort(ORDER).lean(),
  ]);
  return {
    videos: videos.map(videoWire),
    channels: channels.map((c) => ({ id: String(c._id), name: c.name, url: c.url, avatar: !!c.avatar })),
    categories: categories.map((c) => ({ id: String(c._id), name: c.name })),
  };
}

// Saves the channel's profile picture next to the videos; the letter avatar stays if it can't.
async function saveAvatar(channel) {
  if (!channel.url) return false;
  const src = await channelAvatarUrl(channel.url);
  if (!src) return false;
  const res = await fetch(src);
  if (!res.ok) throw new Error(`avatar ${res.status}`);
  const dir = channelDir(channel._id);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(`${dir}/avatar.jpg`, Buffer.from(await res.arrayBuffer()));
  await Channel.updateOne({ _id: channel._id }, { avatar: true });
  return true;
}

async function addVideo({ url, category }) {
  const ytId = videoIdOf(url);
  if (!ytId) return { error: "Paste a YouTube video link." };
  if (await Video.exists({ ytId })) return { error: "This video is already in your library." };

  const info = await probe(ytId).catch((err) => ({ error: err.message }));
  if (info.error) return { error: `Couldn't read that video: ${info.error}` };
  if (info.is_live) return { error: "Live streams can't be saved while they're live." };

  const channel = await Channel.findOneAndUpdate(
    { ytId: info.channel_id || info.uploader_id || "unknown" },
    { name: info.channel || info.uploader || "Unknown channel", url: info.channel_url || info.uploader_url || "" },
    { upsert: true, new: true },
  );
  if (!channel.avatar) avatarQueue.push(channel);
  const video = await Video.create({
    ytId,
    url: watchUrl(ytId),
    ...videoFields(info),
    channel: channel._id,
    category: validId(category) ? category : undefined,
  });
  return { id: String(video._id) };
}

// The channel's uploads on YouTube, each marked with whether it's already in the library.
async function browseChannel(id) {
  const channel = validId(id) && (await Channel.findById(id).lean());
  if (!channel?.url) return { error: "This channel has no YouTube link to read from." };
  const uploads = await channelVideos(channel.url).catch((err) => ({ error: err.message }));
  if (uploads.error) return { error: `Couldn't read the channel: ${uploads.error}` };
  const saved = new Set((await Video.find({ ytId: { $in: uploads.map((u) => u.ytId) } }, { ytId: 1 }).lean()).map((v) => v.ytId));
  return { videos: uploads.map((u) => ({ ...u, saved: saved.has(u.ytId) })) };
}

// Queues the picked uploads of a channel; details are read when each one's turn comes.
async function addFromChannel({ channel: id, videos, category }) {
  const channel = validId(id) && (await Channel.findById(id).lean());
  if (!channel) return { error: "This channel no longer exists." };
  const picked = (Array.isArray(videos) ? videos : []).filter((v) => videoIdOf(v?.ytId) === v.ytId);
  const saved = new Set((await Video.find({ ytId: { $in: picked.map((v) => v.ytId) } }, { ytId: 1 }).lean()).map((v) => v.ytId));
  const fresh = picked.filter((v) => !saved.has(v.ytId));
  const created = await Video.insertMany(
    fresh.map((v) => ({
      ytId: v.ytId,
      url: watchUrl(v.ytId),
      title: String(v.title || v.ytId).slice(0, 300),
      duration: Number(v.duration) || 0,
      channel: channel._id,
      category: validId(category) ? category : undefined,
      needsProbe: true,
    })),
  );
  return { ids: created.map((v) => String(v._id)) };
}

async function removeVideo(id) {
  const video = await Video.findByIdAndDelete(id).lean();
  if (!video) return;
  cancel(id);
  await fs.rm(mediaDir(id), { recursive: true, force: true });
  // a channel lives only as long as one of its videos does
  if (await Video.exists({ channel: video.channel })) return;
  await Channel.deleteOne({ _id: video.channel });
  await fs.rm(channelDir(video.channel), { recursive: true, force: true });
}

// Channel avatars are fetched one after another in the background, never blocking an add.
const avatarQueue = {
  pending: [],
  busy: false,
  onSaved: () => {},
  push(channel) {
    if (this.pending.some((c) => String(c._id) === String(channel._id))) return;
    this.pending.push(channel);
    this.run();
  },
  async run() {
    if (this.busy || !this.pending.length) return;
    this.busy = true;
    const channel = this.pending.shift();
    const saved = await saveAvatar(channel).catch((err) => console.error("avatar failed", channel.name, err.message));
    if (saved) this.onSaved();
    this.busy = false;
    this.run();
  },
};

function wire(io) {
  const broadcast = async () => io.emit("library", await library());

  io.on("connection", (socket) => {
    socket.on("library", async (ack) => ack(await library()));

    socket.on("video:add", async (data, ack) => {
      const res = await addVideo(data || {});
      ack(res);
      if (res.error) return;
      await broadcast();
      enqueue(res.id);
      // reading the new video worked, so the connection is back for the waiting ones too
      wakeWaiting();
    });

    // "Retry now" on a failed video, or on one waiting for the connection
    socket.on("settings", async (ack) => ack(await getSettings()));

    // applies from the next download on; videos already downloaded stay as they are
    socket.on("settings:save", async (data, ack) => {
      const quality = Number(data?.quality);
      const rateLimit = Number(data?.rateLimit);
      if (!QUALITIES.includes(quality) || !RATE_LIMITS.includes(rateLimit)) return ack({ error: "Unknown setting." });
      await Settings.updateOne({ key: "app" }, { quality, rateLimit, compatible: !!data.compatible }, { upsert: true });
      const settings = await getSettings();
      ack(settings);
      io.emit("settings", settings);
    });

    socket.on("channel:browse", async (id, ack) => ack(await browseChannel(id)));

    socket.on("channel:download", async (data, ack) => {
      const res = await addFromChannel(data || {});
      ack(res);
      if (res.error) return;
      await broadcast();
      res.ids.forEach(enqueue);
    });

    socket.on("video:retry", async (id, ack) => {
      if (!validId(id)) return ack();
      await Video.updateOne({ _id: id, status: { $in: ["failed", "waiting"] } }, { status: "queued", error: "", $unset: { retryAt: 1 } });
      ack();
      await broadcast();
      enqueue(id);
    });

    socket.on("video:category", async ({ id, category }, ack) => {
      if (!validId(id)) return ack();
      const update = validId(category) ? { category } : { $unset: { category: 1 } };
      await Video.updateOne({ _id: id }, update);
      ack();
      await broadcast();
    });

    socket.on("video:remove", async (id, ack) => {
      if (!validId(id)) return ack();
      await removeVideo(id);
      ack();
      await broadcast();
    });

    socket.on("category:add", async (name, ack) => {
      if (!categoryName(name)) return ack({ error: "Give the category a name." });
      const category = await Category.create({ name: categoryName(name), order: await Category.countDocuments() });
      ack({ id: String(category._id) });
      await broadcast();
    });

    // the videos stay, they just leave the category
    socket.on("category:remove", async (id, ack) => {
      if (!validId(id)) return ack();
      await Promise.all([Category.deleteOne({ _id: id }), Video.updateMany({ category: id }, { $unset: { category: 1 } })]);
      ack();
      await broadcast();
    });
  });

  return broadcast;
}

await fs.mkdir(MEDIA_DIR, { recursive: true });
await mongoose.connect(MONGODB_URI);
await app.prepare();

const handle = app.getRequestHandler();
const server = createServer((req, res) => {
  if (req.url.startsWith("/media/")) return serveMedia(req, res);
  handle(req, res);
});
const io = new Server(server);
const broadcast = wire(io);
const changed = () => broadcast().catch((err) => console.error("broadcast failed", err));
avatarQueue.onSaved = changed;
await startQueue(io, changed);
// channels saved before avatars existed, or whose avatar failed last time
(await Channel.find({ avatar: { $ne: true } }).lean()).forEach((c) => avatarQueue.push(c));

server.listen(PORT, "0.0.0.0", () => console.log(`hometube ready on :${PORT}`));

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => {
    stopRunning();
    process.exit(0);
  });
}
