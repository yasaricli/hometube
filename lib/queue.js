import fs from "node:fs/promises";
import path from "node:path";
import { Video, getSettings } from "./models.js";
import { mediaDir } from "./media.js";
import { download, isBotCheck, isForbidden, isNetworkError, probe, videoFields } from "./youtube.js";

const THROTTLE_MS = 500;
// automatic retries for a download YouTube refused with 403 before it counts as failed
const FORBIDDEN_RETRIES = 3;
// waits after each failed attempt while offline; the last one repeats until the connection is back
const RETRY_DELAYS = [15_000, 30_000, 60_000, 120_000, 300_000];
// how long the whole queue pauses when YouTube takes us for a bot; longer each time it happens again
const MINUTE = 60_000;
const SLOW_DOWN_DELAYS = [15 * MINUTE, 30 * MINUTE, 60 * MINUTE, 120 * MINUTE];
// a short, uneven break between downloads so a long queue doesn't look like a bot to begin with
const REST_MS = [8_000, 20_000];

// ponytail: one download at a time, in memory; parallel downloads if a single one ever feels slow
const pending = [];
let running;
// resting between two downloads; paused (until pausedUntil) after YouTube's bot check
let resting = false;
let pausedUntil = 0;
let pauseTimer;
// bot checks in a row; a finished download resets it
let strikes = 0;

// live progress of the running download, by video id: { stage, percent }
export const progress = new Map();

// failed attempts in a row and the pending retry timer, by video id
const attempts = new Map();
const timers = new Map();

let hooks;

// io: socket.io server; changed(): broadcasts the library after a status change.
export async function startQueue(io, changed) {
  hooks = { io, changed };
  // a restart interrupts whatever was downloading, and ends any wait for the connection
  await Video.updateMany({ status: { $in: ["downloading", "waiting"] } }, { status: "queued", error: "", $unset: { retryAt: 1 } });
  // failures from before automatic retries existed that were only the connection
  const failed = await Video.find({ status: "failed" }).lean();
  // and the ones YouTube's bot check stopped before the queue knew to wait it out
  const offline = failed.filter((v) => isNetworkError(v.error) || isBotCheck(v.error)).map((v) => v._id);
  await Video.updateMany({ _id: { $in: offline } }, { status: "queued", error: "" });
  const queued = await Video.find({ status: "queued" }).sort({ createdAt: 1 }).lean();
  queued.forEach((v) => enqueue(String(v._id)));
}

export function enqueue(id) {
  clearTimeout(timers.get(id));
  timers.delete(id);
  if (pending.includes(id) || running?.id === id) return;
  pending.push(id);
  next();
}

// Drops a queued or waiting download, or stops the running one.
export function cancel(id) {
  clearTimeout(timers.get(id));
  timers.delete(id);
  attempts.delete(id);
  const at = pending.indexOf(id);
  if (at >= 0) pending.splice(at, 1);
  if (running?.id === id) running.child.kill();
}

// Ends a bot-check pause early, e.g. when YouTube answered a request again or on "Retry now".
export function resume() {
  clearTimeout(pauseTimer);
  pausedUntil = 0;
  next();
}

// The connection works again (a download finished or a video was added): retry every waiting video now.
export async function wakeWaiting() {
  resume();
  if (!timers.size) return;
  const ids = [...timers.keys()];
  await Video.updateMany({ _id: { $in: ids }, status: "waiting" }, { status: "queued", error: "", $unset: { retryAt: 1 } });
  ids.forEach(enqueue);
  hooks.changed();
}

// Stops the running yt-dlp so it doesn't outlive the server; the video is queued again on the next start.
export const stopRunning = () => running?.child?.kill();

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function next() {
  if (running || resting || Date.now() < pausedUntil || !pending.length) return;
  const id = pending.shift();
  running = { id };
  await work(id).catch((err) => console.error("download failed", id, err.message));
  running = undefined;
  progress.delete(id);
  if (pending.length) {
    resting = true;
    await sleep(REST_MS[0] + Math.random() * (REST_MS[1] - REST_MS[0]));
    resting = false;
  }
  next();
}

// YouTube took us for a bot: every download would fail the same way, so the whole queue pauses
// and this video goes first when it resumes.
async function slowDown(id, error) {
  const delay = SLOW_DOWN_DELAYS[Math.min(strikes, SLOW_DOWN_DELAYS.length - 1)];
  strikes += 1;
  pausedUntil = Date.now() + delay;
  clearTimeout(pauseTimer);
  pauseTimer = setTimeout(resume, delay);
  pending.unshift(id);
  await Video.updateOne({ _id: id }, { status: "waiting", error, retryAt: new Date(pausedUntil) });
  console.log(`youtube asked to slow down; downloads resume in ${delay / MINUTE} min`);
  hooks.changed();
}

// Lost the connection: wait a little longer each time, then queue the video again.
async function retryLater(id, error) {
  const n = attempts.get(id) || 0;
  attempts.set(id, n + 1);
  const delay = RETRY_DELAYS[Math.min(n, RETRY_DELAYS.length - 1)];
  await Video.updateOne({ _id: id }, { status: "waiting", error, retryAt: new Date(Date.now() + delay) });
  timers.set(
    id,
    setTimeout(async () => {
      timers.delete(id);
      const { modifiedCount } = await Video.updateOne({ _id: id, status: "waiting" }, { status: "queued", error: "", $unset: { retryAt: 1 } });
      if (!modifiedCount) return;
      hooks.changed();
      enqueue(id);
    }, delay),
  );
  hooks.changed();
}

async function work(id) {
  const video = await Video.findById(id).lean();
  if (!video) return;
  const dir = mediaDir(id);
  await fs.mkdir(dir, { recursive: true });
  await Video.updateOne({ _id: id }, { status: "downloading", error: "", $unset: { retryAt: 1 } });
  hooks.changed();

  let sentAt = 0;
  let best = 0;
  const onProgress = ({ stage, percent }) => {
    // video and audio download one after the other; keep the bar from jumping back
    best = Math.max(best, percent);
    const state = { stage, percent: best };
    progress.set(id, state);
    if (stage === "download" && Date.now() - sentAt < THROTTLE_MS) return;
    sentAt = Date.now();
    hooks.io.emit("video:progress", { id, ...state });
  };

  try {
    if (video.needsProbe) {
      const info = await probe(video.ytId);
      await Video.updateOne({ _id: id }, { ...videoFields(info), needsProbe: false });
      hooks.changed();
    }
    const job = download(video.ytId, dir, await getSettings(), onProgress);
    running.child = job.child;
    await job.done;
  } catch (err) {
    // removed while downloading: nothing left to update
    if (!(await Video.exists({ _id: id }))) return;
    if (isBotCheck(err.message)) return slowDown(id, err.message);
    if (isNetworkError(err.message)) return retryLater(id, err.message);
    if (isForbidden(err.message) && (attempts.get(id) || 0) < FORBIDDEN_RETRIES) return retryLater(id, err.message);
    attempts.delete(id);
    await Video.updateOne({ _id: id }, { status: "failed", error: err.message });
    hooks.changed();
    throw err;
  }
  attempts.delete(id);
  strikes = 0;
  const { size } = await fs.stat(path.join(dir, "video.mp4"));
  await Video.updateOne({ _id: id }, { status: "ready", size });
  hooks.changed();
  wakeWaiting();
}
