// The video to play when this one ends: another downloaded video from the same channel.
// Unwatched ones first, the one uploaded right after this video before any other (the next episode),
// then the newest; when every one has been watched, the one watched longest ago. undefined: none.
export function nextInChannel(video, videos) {
  const others = videos.filter((v) => v.channel === video.channel && v.id !== video.id && v.status === "ready");
  const unwatched = others.filter((v) => !v.watchedAt);
  if (unwatched.length) {
    const later = unwatched.filter((v) => v.uploadedAt > video.uploadedAt).sort((a, b) => a.uploadedAt - b.uploadedAt);
    return later[0] || unwatched.sort((a, b) => b.uploadedAt - a.uploadedAt)[0];
  }
  return others.sort((a, b) => a.watchedAt - b.watchedAt)[0];
}
