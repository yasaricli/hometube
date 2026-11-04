const DAY = 86_400_000;

// How much each signal counts towards a video's place in the mix; they add up to 1.
const WEIGHTS = { added: 0.3, watched: 0.25, category: 0.2, chance: 0.25 };
// a video saved a week ago counts about a third as "new" as one saved today; watches fade faster
const ADDED_FADE_DAYS = 7;
const WATCHED_FADE_DAYS = 3;

// A number in [0, 1) that stays the same for the same id and seed, so the mix doesn't reshuffle
// every time the library updates (download progress, a new video) while the page is open.
const chance = (id, seed) => {
  let h = seed >>> 0;
  for (const c of id) h = Math.imul(h ^ c.charCodeAt(0), 2654435761) >>> 0;
  h = Math.imul(h ^ (h >>> 16), 2246822507) >>> 0;
  return (h ^ (h >>> 13)) / 2 ** 32;
};

const fade = (t, now, days) => (t ? Math.exp(-Math.max(0, now - t) / (days * DAY)) : 0);

// How much each category is part of the library, from 0 to 1: its videos, with watches counting double.
function categoryShare(videos) {
  const weight = {};
  for (const v of videos) weight[v.category] = (weight[v.category] || 0) + 1 + (v.watchedAt ? 2 : 0);
  const top = Math.max(1, ...Object.values(weight));
  return (category) => (weight[category] || 0) / top;
}

// The home page's "All" view: downloaded videos mixed by how recently they were saved and watched,
// how big their category is, and a dash of chance; the ones not downloaded yet follow, newest first.
export function mixFeed(videos, seed, now = Date.now()) {
  const ready = videos.filter((v) => v.status === "ready");
  const rest = videos.filter((v) => v.status !== "ready").sort((a, b) => b.savedAt - a.savedAt);
  const share = categoryShare(ready);
  const score = (v) =>
    WEIGHTS.added * fade(v.savedAt, now, ADDED_FADE_DAYS) +
    WEIGHTS.watched * fade(v.watchedAt, now, WATCHED_FADE_DAYS) +
    WEIGHTS.category * share(v.category) +
    WEIGHTS.chance * chance(v.id, seed);
  const scored = ready.map((v) => [score(v), v]).sort((a, b) => b[0] - a[0]);
  return [...scored.map(([, v]) => v), ...rest];
}
