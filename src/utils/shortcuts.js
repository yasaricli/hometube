const UNITS = [
  ["year", 31_536_000],
  ["month", 2_592_000],
  ["week", 604_800],
  ["day", 86_400],
  ["hour", 3_600],
  ["minute", 60],
];

// 4:05, 1:02:03
export const fmtDuration = (seconds) => {
  const s = Math.round(seconds || 0);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const ss = String(s % 60).padStart(2, "0");
  if (h) return `${h}:${String(m).padStart(2, "0")}:${ss}`;
  return `${m}:${ss}`;
};

// "3 days ago", "just now"
export const timeAgo = (t, now = Date.now()) => {
  const s = Math.max(0, (now - t) / 1000);
  const unit = UNITS.find(([, size]) => s >= size);
  if (!unit) return "just now";
  const n = Math.floor(s / unit[1]);
  return `${n} ${unit[0]}${n === 1 ? "" : "s"} ago`;
};

// 22:31
export const fmtClock = (t) => new Date(t).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });

// 12 Mar 2024
export const fmtDate = (t) => new Date(t).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

// 1.4 GB, 320 MB
export const fmtBytes = (bytes) => {
  if (!bytes) return "0 MB";
  if (bytes >= 1e9) return `${(bytes / 1e9).toFixed(1)} GB`;
  return `${Math.max(1, Math.round(bytes / 1e6))} MB`;
};

// a total running time: 2h 14m, 45m
export const fmtLength = (seconds) => {
  const min = Math.round((seconds || 0) / 60);
  if (min < 60) return `${min}m`;
  return `${Math.floor(min / 60)}h ${min % 60}m`;
};

// about 3.2 Mbit/s, roughly what a 1080p H.264 download comes to before the library has any
const FALLBACK_RATE = 400_000;

// Average bytes per second of the downloaded videos, to estimate the size of ones not downloaded yet.
export const bytesPerSecond = (videos) => {
  const ready = videos.filter((v) => v.status === "ready" && v.size && v.duration);
  const seconds = ready.reduce((a, v) => a + v.duration, 0);
  if (!seconds) return FALLBACK_RATE;
  return ready.reduce((a, v) => a + v.size, 0) / seconds;
};

// a stable hue per name, for letter avatars
export const hueOf = (name) => [...String(name)].reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 360, 7);

// whether a video matches the search box, by title or channel name
export const matches = (video, channelName, query) => {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return video.title.toLowerCase().includes(q) || channelName.toLowerCase().includes(q);
};
