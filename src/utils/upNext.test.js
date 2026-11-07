import assert from "node:assert/strict";
import { nextInChannel } from "./upNext.js";

const video = (id, extra) => ({ id, channel: "c", status: "ready", uploadedAt: 0, watchedAt: 0, ...extra });

const ep1 = video("ep1", { uploadedAt: 1, watchedAt: 50 });
const ep2 = video("ep2", { uploadedAt: 2 });
const ep3 = video("ep3", { uploadedAt: 3 });
const other = video("other", { channel: "x", uploadedAt: 9 });
const queued = video("queued", { status: "queued", uploadedAt: 2 });

// the next episode, not the newest or one still downloading or from another channel
assert.equal(nextInChannel(ep1, [ep3, queued, ep2, other, ep1]).id, "ep2");
// nothing uploaded later and unwatched: the newest unwatched
assert.equal(nextInChannel(ep3, [ep1, ep2, ep3]).id, "ep2");
// everything watched: the one watched longest ago
const seen = [ep1, video("ep2", { uploadedAt: 2, watchedAt: 10 }), video("ep3", { uploadedAt: 3, watchedAt: 30 })];
assert.equal(nextInChannel(seen[2], seen).id, "ep2");
// Shorts play in the Shorts player, never after a video
assert.equal(nextInChannel(ep1, [ep1, video("s", { uploadedAt: 2, short: true }), ep3]).id, "ep3");
// the only video of its channel
assert.equal(nextInChannel(other, [other, ep1]), undefined);
console.log("upNext ok");
