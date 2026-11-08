import { Channel, getSettings } from "./models.js";
import { channelVideos, isBotCheck } from "./youtube.js";
import { isPaused } from "./queue.js";

const MINUTE = 60_000;
// how often to look for followed channels that are due a check
const TICK_MS = 10 * MINUTE;
// newest uploads looked at per tab on each check; a channel rarely posts more between two checks
const CHECK_LIMIT = 30;
// an uneven break between two channels, so a check of many channels doesn't look like a bot
const REST_MS = [5_000, 15_000];

const TABS = ["videos", "shorts"];
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

let deps;
let busy = false;

// A channel's uploads from both tabs, each marked short when it came from the Shorts tab.
// limit: newest per tab; undefined lists as many as a channel listing allows.
async function listUploads(url, limit) {
  const uploads = [];
  for (const tab of TABS) {
    try {
      const { videos } = await channelVideos(url, tab, limit);
      uploads.push(...videos.map((v) => ({ ...v, short: tab === "shorts" })));
    } catch (err) {
      // a channel that never posted a Short (or a video) has no such tab
      if (!/does not have a \w+ tab/.test(err.message)) throw err;
    }
  }
  return uploads;
}

// Follows or unfollows a channel. Following remembers what the channel has now, so only uploads
// after it are downloaded; the back catalog stays with "Get videos".
export async function followChannel(id, follow) {
  const channel = await Channel.findById(id).lean();
  if (!channel) return { error: "This channel no longer exists." };
  if (!follow) {
    await Channel.updateOne({ _id: id }, { follow: false, seen: [] });
    return {};
  }
  if (!channel.url) return { error: "This channel has no YouTube link to follow." };
  const uploads = await listUploads(channel.url).catch((err) => ({ error: err.message }));
  if (uploads.error) return { error: `Couldn't read the channel: ${uploads.error}` };
  await Channel.updateOne({ _id: id }, { follow: true, seen: uploads.map((u) => u.ytId), checkedAt: new Date() });
  return {};
}

// Queues a followed channel's uploads it hasn't seen yet: { queued }.
export async function checkChannel(channel) {
  const uploads = await listUploads(channel.url, CHECK_LIMIT);
  const seen = new Set(channel.seen);
  const fresh = uploads.filter((u) => !seen.has(u.ytId));
  let ids = [];
  for (const shorts of [false, true]) {
    const picked = fresh.filter((u) => u.short === shorts);
    if (picked.length) ids = ids.concat((await deps.queueUploads(channel, picked, { shorts })).ids);
  }
  await Channel.updateOne({ _id: channel._id }, { $addToSet: { seen: { $each: fresh.map((u) => u.ytId) } }, checkedAt: new Date() });
  ids.forEach(deps.enqueue);
  if (ids.length) console.log(`${channel.name}: ${ids.length} new uploads queued`);
  return { queued: ids.length };
}

// Checks every followed channel that is due, one after another.
async function tick() {
  if (busy || isPaused()) return;
  busy = true;
  try {
    const { syncHours } = await getSettings();
    const due = new Date(Date.now() - syncHours * 60 * MINUTE);
    const channels = await Channel.find({ follow: true, $or: [{ checkedAt: { $lt: due } }, { checkedAt: { $exists: false } }] }).lean();
    for (const [i, channel] of channels.entries()) {
      if (i) await sleep(REST_MS[0] + Math.random() * (REST_MS[1] - REST_MS[0]));
      if (isPaused()) break;
      try {
        const { queued } = await checkChannel(channel);
        if (queued) deps.changed();
      } catch (err) {
        console.error("checking channel failed", channel.name, err.message);
        // YouTube is refusing everything for a while; the next tick tries again
        if (isBotCheck(err.message)) break;
      }
    }
  } finally {
    busy = false;
  }
}

// queueUploads(channel, videos, { shorts }) → { ids }; enqueue(id); changed(): broadcasts the library.
export function startSync(dependencies) {
  deps = dependencies;
  setInterval(() => tick().catch((err) => console.error("channel check failed", err.message)), TICK_MS);
  // a minute after start, so a restart doesn't hit YouTube at once
  setTimeout(() => tick().catch((err) => console.error("channel check failed", err.message)), MINUTE);
}
