import assert from "node:assert/strict";
import { videoIdOf, isNetworkError, formatFor } from "./youtube.js";

const ID = "aqz-KE-bpKQ";

assert.equal(videoIdOf(`https://www.youtube.com/watch?v=${ID}`), ID);
assert.equal(videoIdOf(`https://www.youtube.com/watch?v=${ID}&t=42s&list=PL123`), ID);
assert.equal(videoIdOf(`https://m.youtube.com/watch?v=${ID}`), ID);
assert.equal(videoIdOf(`https://youtu.be/${ID}?si=abc`), ID);
assert.equal(videoIdOf(`https://www.youtube.com/shorts/${ID}`), ID);
assert.equal(videoIdOf(`https://www.youtube.com/embed/${ID}`), ID);
assert.equal(videoIdOf(`https://www.youtube.com/live/${ID}`), ID);
assert.equal(videoIdOf(`  ${ID}  `), ID);

assert.equal(videoIdOf("https://www.youtube.com/@blender"), "");
assert.equal(videoIdOf(`https://evil.example/watch?v=${ID}`), "");
assert.equal(videoIdOf("https://www.youtube.com/watch?v=short"), "");
assert.equal(videoIdOf("not a link"), "");
assert.equal(videoIdOf(""), "");

assert.ok(isNetworkError("[download] Got error: HTTPSConnection(host='rr1.googlevideo.com', port=443): Failed to establish a new connection: [Errno 51] Network is unreachable. Giving up after 10 retries"));
assert.ok(isNetworkError("Unable to download API page: HTTPSConnection(host='www.youtube.com', port=443): Failed to establish a new connection"));
assert.ok(isNetworkError("Unable to download webpage: <urlopen error [Errno 8] nodename nor servname provided, or not known>"));
assert.ok(isNetworkError("Unable to download webpage: The read operation timed out"));
assert.ok(isNetworkError("Unable to download webpage: HTTP Error 429: Too Many Requests"));
assert.ok(isNetworkError("HTTP Error 503: Service Unavailable"));
assert.ok(!isNetworkError("Video unavailable. This video has been removed by the uploader"));
assert.ok(!isNetworkError("Private video. Sign in if you've been granted access to this video"));
assert.ok(!isNetworkError("Unable to download webpage: HTTP Error 404: Not Found"));
assert.ok(!isNetworkError(""));

assert.equal(formatFor({ quality: 1080, compatible: true }), "bv*[ext=mp4][vcodec^=avc1][height<=1080]+ba[ext=m4a]/b[ext=mp4][height<=1080]/bv*[height<=1080]+ba/b");
assert.equal(formatFor({ quality: 0, compatible: true }), "bv*[ext=mp4][vcodec^=avc1]+ba[ext=m4a]/b[ext=mp4]/bv*+ba/b");
assert.equal(formatFor({ quality: 2160, compatible: false }), "bv*[height<=2160]+ba[ext=m4a]/bv*[height<=2160]+ba/b[height<=2160]/b");

console.log("youtube ok");
