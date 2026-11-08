import assert from "node:assert/strict";
import { pickForCleanup } from "./cleanupRules.js";

const DAY = 86_400_000;
const now = 100 * DAY;
const v = (_id, extra) => ({ _id, channel: "a", short: false, uploadedAt: new Date(0), createdAt: new Date(0), ...extra });
const ids = (list) => list.map((x) => x._id).sort();

const library = [
  v("old-watched", { uploadedAt: new Date(1 * DAY), watchedAt: new Date(now - 40 * DAY) }),
  v("new-watched", { uploadedAt: new Date(5 * DAY), watchedAt: new Date(now - 2 * DAY) }),
  v("unwatched-1", { uploadedAt: new Date(2 * DAY) }),
  v("unwatched-2", { uploadedAt: new Date(3 * DAY) }),
  v("short-1", { short: true, uploadedAt: new Date(1 * DAY) }),
  v("short-2", { short: true, uploadedAt: new Date(2 * DAY) }),
  v("other", { channel: "b", uploadedAt: new Date(0) }),
];

// both rules off: nothing
assert.deepEqual(pickForCleanup(library, { deleteWatchedDays: 0, keepPerChannel: 0 }, now), []);
// watched more than 30 days ago
assert.deepEqual(ids(pickForCleanup(library, { deleteWatchedDays: 30, keepPerChannel: 0 }, now)), ["old-watched"]);
// the newest 2 videos and 2 Shorts per channel stay; other channels are counted on their own
assert.deepEqual(ids(pickForCleanup(library, { deleteWatchedDays: 0, keepPerChannel: 2 }, now)), ["old-watched", "unwatched-1"]);
// one Short kept: the older one goes
assert.deepEqual(ids(pickForCleanup(library, { deleteWatchedDays: 0, keepPerChannel: 1 }, now)), ["old-watched", "short-1", "unwatched-1", "unwatched-2"]);
// a video matching both rules is listed once
assert.equal(pickForCleanup(library, { deleteWatchedDays: 30, keepPerChannel: 2 }, now).length, 2);

console.log("cleanup ok");
