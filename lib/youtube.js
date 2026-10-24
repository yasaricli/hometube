import { execFile, spawn } from "node:child_process";

const HOSTS = new Set(["youtube.com", "www.youtube.com", "m.youtube.com", "music.youtube.com", "youtu.be", "www.youtu.be"]);
const ID = /^[\w-]{11}$/;
const PATH_IDS = ["shorts", "embed", "live", "v"];

// Connection drops, timeouts, DNS failures and YouTube's 5xx/429 answers: worth retrying later.
// Anything else (removed, private, age-gated…) won't fix itself.
const NETWORK =
  /HTTPS?Connection|timed out|Connection (reset|refused|aborted)|Network is unreachable|No route to host|Temporary failure in name resolution|Name or service not known|nodename nor servname|getaddrinfo|Remote end closed|IncompleteRead|EOF occurred|HTTP Error (5\d\d|429)/i;

export const isNetworkError = (message) => NETWORK.test(message || "");

// yt-dlp's format choice for the settings. compatible: H.264 + AAC first so every browser plays
// the file without transcoding; otherwise the best codec (VP9/AV1), the only option above 1080p.
export function formatFor({ quality, compatible }) {
  const h = quality ? `[height<=${quality}]` : "";
  if (compatible) return `bv*[ext=mp4][vcodec^=avc1]${h}+ba[ext=m4a]/b[ext=mp4]${h}/bv*${h}+ba/b`;
  return `bv*${h}+ba[ext=m4a]/bv*${h}+ba/b${h}/b`;
}

export const watchUrl = (id) => `https://www.youtube.com/watch?v=${id}`;

function idFromUrl(url) {
  const parts = url.pathname.split("/").filter(Boolean);
  if (url.hostname.endsWith("youtu.be")) return parts[0];
  if (url.pathname === "/watch") return url.searchParams.get("v");
  if (PATH_IDS.includes(parts[0])) return parts[1];
  return "";
}

// The 11-character video id from any YouTube video link (or a bare id); "" when there is none.
export function videoIdOf(raw) {
  const text = String(raw || "").trim();
  if (ID.test(text)) return text;
  let url;
  try {
    url = new URL(text);
  } catch {
    return "";
  }
  if (!HOSTS.has(url.hostname)) return "";
  const id = idFromUrl(url) || "";
  return ID.test(id) ? id : "";
}

// yt-dlp's last stderr line, without its "ERROR: [youtube] id:" prefix.
function reason(stderr) {
  const last = stderr.trim().split("\n").at(-1) || "";
  return last.replace(/^ERROR:\s*/, "").replace(/^\[[^\]]+\]\s*[\w-]+:\s*/, "");
}

// youtube's upload_date is "YYYYMMDD"
const uploadDate = (raw) => (/^\d{8}$/.test(raw || "") ? new Date(`${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6)}`) : undefined);

// The fields a Video keeps from yt-dlp's metadata.
export function videoFields(info) {
  return {
    title: info.title || info.id,
    description: info.description || "",
    duration: info.duration || 0,
    uploadedAt: uploadDate(info.upload_date),
  };
}

// Video metadata without downloading anything.
export function probe(id) {
  return new Promise((resolve, reject) => {
    const args = ["-J", "--no-playlist", "--no-warnings", watchUrl(id)];
    execFile("yt-dlp", args, { maxBuffer: 64 * 1024 * 1024 }, (err, stdout, stderr) => {
      if (err) return reject(new Error(reason(stderr) || err.message));
      resolve(JSON.parse(stdout));
    });
  });
}

// The channel's profile picture URL, or "" when it has none.
export function channelAvatarUrl(channelUrl) {
  return new Promise((resolve, reject) => {
    const args = ["-J", "--flat-playlist", "--playlist-items", "0", "--no-warnings", channelUrl];
    execFile("yt-dlp", args, { maxBuffer: 16 * 1024 * 1024 }, (err, stdout, stderr) => {
      if (err) return reject(new Error(reason(stderr) || err.message));
      const thumbs = JSON.parse(stdout).thumbnails || [];
      const url = thumbs.find((t) => t.id === "avatar_uncropped")?.url || "";
      // "=s0" is the full-size original; 240px is plenty for a 120px avatar on a sharp screen
      resolve(url.replace(/=s\d+[^/]*$/, "=s240"));
    });
  });
}

// ponytail: newest uploads only; page through the channel if someone needs its whole back catalog
const CHANNEL_LIMIT = 300;

// A channel's uploads, newest first, without per-video details: { ytId, title, duration }.
export function channelVideos(channelUrl) {
  return new Promise((resolve, reject) => {
    const args = ["-J", "--flat-playlist", "-I", `1:${CHANNEL_LIMIT}`, "--no-warnings", `${channelUrl.replace(/\/$/, "")}/videos`];
    execFile("yt-dlp", args, { maxBuffer: 64 * 1024 * 1024 }, (err, stdout, stderr) => {
      if (err) return reject(new Error(reason(stderr) || err.message));
      const entries = JSON.parse(stdout).entries || [];
      // upcoming premieres and live streams can't be saved yet
      const saveable = entries.filter((e) => ID.test(e.id || "") && !["is_upcoming", "is_live"].includes(e.live_status));
      resolve(saveable.map((e) => ({ ytId: e.id, title: e.title || e.id, duration: e.duration || 0 })));
    });
  });
}

// Downloads video.mp4 and thumb.jpg into dir with the given settings. onProgress gets { stage, percent }.
export function download(id, dir, settings, onProgress) {
  const limit = settings.rateLimit ? ["--limit-rate", `${settings.rateLimit}M`] : [];
  const child = spawn("yt-dlp", [
    ...limit,
    "--no-playlist",
    "--no-warnings",
    // ride out short drops without failing; longer outages are retried by the queue
    "--retries",
    "10",
    "--fragment-retries",
    "10",
    "--retry-sleep",
    "exp=1:20",
    "--newline",
    "--progress",
    "--progress-template",
    "download:LT %(progress._percent_str)s",
    "-f",
    formatFor(settings),
    "--merge-output-format",
    "mp4",
    "--remux-video",
    "mp4",
    "--write-thumbnail",
    "--convert-thumbnails",
    "jpg",
    "-P",
    dir,
    "-o",
    "video.%(ext)s",
    "-o",
    "thumbnail:thumb.%(ext)s",
    watchUrl(id),
  ]);

  let pending = "";
  let stderr = "";
  const onLine = (line) => {
    const pct = /^LT\s+([\d.]+)%/.exec(line.trim());
    if (pct) return onProgress({ stage: "download", percent: Number(pct[1]) });
    if (/^\[(Merger|VideoRemuxer|FixupM3u8)\]/.test(line)) onProgress({ stage: "processing", percent: 100 });
  };

  child.stdout.on("data", (chunk) => {
    const lines = (pending + chunk).split("\n");
    pending = lines.pop();
    lines.forEach(onLine);
  });
  child.stderr.on("data", (chunk) => {
    stderr += chunk;
  });

  const done = new Promise((resolve, reject) => {
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) return resolve();
      reject(new Error(reason(stderr) || `yt-dlp exited with code ${code}`));
    });
  });

  return { child, done };
}
