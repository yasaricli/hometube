import { execFile } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { MEDIA_DIR } from "./config.js";

const TYPES = { "video.mp4": "video/mp4", "thumb.jpg": "image/jpeg", "avatar.jpg": "image/jpeg" };
// /media/<video id>/video.mp4 | thumb.jpg and /media/channels/<channel id>/avatar.jpg
const ROUTE = /^\/media\/((?:channels\/)?[0-9a-f]{24})\/(video\.mp4|thumb\.jpg|avatar\.jpg)(\?.*)?$/;

export const mediaDir = (id) => path.join(MEDIA_DIR, String(id));
export const channelDir = (id) => path.join(MEDIA_DIR, "channels", String(id));

// Shorts are vertical and at most three minutes long.
const SHORT_MAX_SECONDS = 180;

// Whether a downloaded file looks like a YouTube Short, read from the file itself (no YouTube request).
export function looksLikeShort(id) {
  const args = ["-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height:format=duration", "-of", "json"];
  return new Promise((resolve) => {
    execFile("ffprobe", [...args, path.join(mediaDir(id), "video.mp4")], (err, stdout) => {
      if (err) return resolve(false);
      const { streams = [], format = {} } = JSON.parse(stdout);
      const { width = 0, height = 0 } = streams[0] || {};
      resolve(height > width && Number(format.duration) <= SHORT_MAX_SECONDS);
    });
  });
}

function notFound(res) {
  res.writeHead(404, { "content-type": "text/plain" });
  res.end("not found");
}

// Serves a downloaded file with Range support, so the player can seek.
export async function serveMedia(req, res) {
  const match = ROUTE.exec(req.url);
  if (!match) return notFound(res);
  const [, dir, name] = match;
  // avatars live only under channels/, videos and thumbnails never do
  if (dir.startsWith("channels/") !== (name === "avatar.jpg")) return notFound(res);
  const file = path.join(MEDIA_DIR, dir, name);
  const stat = await fs.promises.stat(file).catch(() => undefined);
  if (!stat) return notFound(res);

  const headers = { "content-type": TYPES[name], "accept-ranges": "bytes", "cache-control": "private, max-age=3600" };
  const range = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range || "");
  if (!range) {
    res.writeHead(200, { ...headers, "content-length": stat.size });
    if (req.method === "HEAD") return res.end();
    return fs.createReadStream(file).pipe(res);
  }

  // "bytes=500-", "bytes=500-999" or the suffix form "bytes=-500"
  const start = range[1] ? Number(range[1]) : stat.size - Number(range[2]);
  const end = range[1] && range[2] ? Math.min(Number(range[2]), stat.size - 1) : stat.size - 1;
  if (start < 0 || start >= stat.size || start > end) {
    res.writeHead(416, { "content-range": `bytes */${stat.size}` });
    return res.end();
  }
  res.writeHead(206, { ...headers, "content-range": `bytes ${start}-${end}/${stat.size}`, "content-length": end - start + 1 });
  if (req.method === "HEAD") return res.end();
  fs.createReadStream(file, { start, end }).pipe(res);
}
