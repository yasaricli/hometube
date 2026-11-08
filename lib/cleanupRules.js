const DAY = 86_400_000;

const newest = (v) => new Date(v.uploadedAt || v.createdAt).getTime();

// Which of the downloaded videos the cleanup rules delete.
// deleteWatchedDays: last watched longer ago than that; keepPerChannel: beyond a channel's newest
// that many videos, counted apart from its newest that many Shorts. 0 turns a rule off.
export function pickForCleanup(ready, { deleteWatchedDays, keepPerChannel }, now = Date.now()) {
  const doomed = new Map();
  if (deleteWatchedDays) {
    const before = now - deleteWatchedDays * DAY;
    ready.filter((v) => v.watchedAt && new Date(v.watchedAt).getTime() < before).forEach((v) => doomed.set(String(v._id), v));
  }
  if (keepPerChannel) {
    const groups = new Map();
    for (const v of ready) {
      const key = `${v.channel}:${!!v.short}`;
      groups.set(key, [...(groups.get(key) || []), v]);
    }
    for (const group of groups.values()) {
      group.sort((a, b) => newest(b) - newest(a));
      group.slice(keepPerChannel).forEach((v) => doomed.set(String(v._id), v));
    }
  }
  return [...doomed.values()];
}
