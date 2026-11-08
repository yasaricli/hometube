import assert from "node:assert/strict";
import { resumeAt } from "./playback.js";

// picks up where it was left
assert.equal(resumeAt(300, 600), 300);
// barely started or never played: from the start
assert.equal(resumeAt(10, 600), 0);
assert.equal(resumeAt(0, 600), 0);
// watched to (almost) the end: from the start again
assert.equal(resumeAt(600, 600), 0);
assert.equal(resumeAt(590, 600), 0);
// duration not known yet
assert.equal(resumeAt(300, NaN), 0);

console.log("playback ok");
