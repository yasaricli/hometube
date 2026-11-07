import assert from "node:assert/strict";
import { mixFeed, mixShorts } from "./feed.js";

const DAY = 86_400_000;
const now = Date.UTC(2026, 10, 5);
const video = (id, extra) => ({ id, status: "ready", category: "", savedAt: now - 30 * DAY, watchedAt: 0, ...extra });

const library = [
  video("queued-old", { status: "queued", savedAt: now - 2 * DAY }),
  video("old"),
  video("fresh", { savedAt: now, watchedAt: now }),
  video("failed-new", { status: "failed", savedAt: now - DAY }),
  ...Array.from({ length: 20 }, (_, i) => video(`v${i}`, { savedAt: now - i * DAY })),
];

const mixed = mixFeed(library, 42, now);
assert.equal(mixed.length, library.length);
// the same seed keeps the same order
assert.deepEqual(mixFeed(library, 42, now), mixed);
// just saved and watched beats a month-old unwatched video, whatever chance says
assert.ok(mixed.indexOf(mixed.find((v) => v.id === "fresh")) < mixed.findIndex((v) => v.id === "old"));
// videos not downloaded yet come last, newest first
assert.deepEqual(mixed.slice(-2).map((v) => v.id), ["failed-new", "queued-old"]);
// another seed mixes differently
assert.notDeepEqual(mixFeed(library, 7, now).map((v) => v.id), mixed.map((v) => v.id));
// the bigger category leans ahead
const cats = [...Array.from({ length: 10 }, (_, i) => video(`big${i}`, { category: "big" })), video("small", { category: "small" })];
const rank = Object.fromEntries(Array.from({ length: 50 }, (_, s) => s).flatMap((s) => mixFeed(cats, s, now).map((v, i) => [`${s}:${v.id}`, i])));
const avg = (id) => Array.from({ length: 50 }, (_, s) => rank[`${s}:${id}`]).reduce((a, b) => a + b) / 50;
assert.ok(avg("small") > avg("big0"));


// Shorts: unwatched ones first, whatever chance says; nothing that isn't downloaded
const shorts = [video("seen", { watchedAt: now }), video("new1"), video("queued", { status: "queued" }), video("new2")];
for (let seed = 0; seed < 20; seed += 1) {
  const order = mixShorts(shorts, seed, now).map((v) => v.id);
  assert.equal(order.length, 3);
  assert.equal(order.at(-1), "seen");
}
console.log("feed ok");
