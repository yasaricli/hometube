"use client";

import { useState } from "react";
import Link from "next/link";

// Components
import ChannelAvatar from "@/components/ChannelAvatar";
import Icon from "@/components/Icon";

// Store
import useLibraryStore from "@/store/useLibraryStore";

// Utils
import { fmtBytes, fmtClock, fmtDuration, timeAgo } from "@/utils/shortcuts";
import { getSocket } from "@/utils/socket";

// Styles
import Styles from "./styles.module.scss";

const statusText = (video) => {
  if (video.status === "queued") return "Queued";
  if (video.status === "failed") return "Download failed";
  if (video.status === "waiting") return "Waiting for connection";
  if (video.progress?.stage === "processing") return "Processing…";
  return `Downloading ${Math.floor(video.progress?.percent || 0)}%`;
};

// Thumbnail plus, until the file is ready, the download state on top of it.
const Thumb = ({ video }) => {
  const [missing, setMissing] = useState(false);
  const ready = video.status === "ready";

  return (
    <div className={Styles.thumb}>
      {/* yt-dlp writes the thumbnail at the end, so only a ready video has one */}
      {ready && !missing && <img src={`/media/${video.id}/thumb.jpg`} alt="" loading="lazy" onError={() => setMissing(true)} />}
      {ready && !!video.duration && <span className={Styles.duration}>{fmtDuration(video.duration)}</span>}
      {!ready && (
        <div className={Styles.pending} data-status={video.status}>
          <span>
            <Icon name={{ failed: "close", waiting: "retry" }[video.status] || "download"} size={18} />
            {statusText(video)}
          </span>
          {video.status === "downloading" && (
            <i className={Styles.bar} style={{ width: `${video.progress?.percent || 0}%` }} />
          )}
        </div>
      )}
    </div>
  );
};

// compact: the small row used in "Up next" next to the player.
const VideoCard = ({ video, compact }) => {
  const channel = useLibraryStore((state) => state.channels.find((c) => c.id === video.channel));
  const category = useLibraryStore((state) => state.categories.find((c) => c.id === video.category));
  const ready = video.status === "ready";
  const channelName = channel?.name || "Unknown channel";

  const retry = (e) => {
    e.preventDefault();
    getSocket().emit("video:retry", video.id, () => {});
  };

  const body = (
    <>
      <Thumb video={video} />
      <div className={Styles.info}>
        {!compact && <ChannelAvatar channel={channel} />}
        <div className={Styles.text}>
          <h3 title={video.title}>{video.title}</h3>
          <span>{channelName}</span>
          <span>
            Saved {timeAgo(video.savedAt)}
            {ready && !!video.size && ` · ${fmtBytes(video.size)}`}
            {category && ` · ${category.name}`}
          </span>
          {video.status === "failed" && (
            <span className={Styles.error} title={video.error}>
              {video.error}
              <button type="button" onClick={retry}>
                <Icon name="retry" size={14} /> Retry
              </button>
            </span>
          )}
          {video.status === "waiting" && (
            <span className={Styles.waiting} title={video.error}>
              Retrying automatically{video.retryAt ? ` at ${fmtClock(video.retryAt)}` : ""}
              <button type="button" onClick={retry}>
                <Icon name="retry" size={14} /> Retry now
              </button>
            </span>
          )}
        </div>
      </div>
    </>
  );

  if (!ready) return <div className={`${Styles.card} ${compact ? Styles.compact : ""}`}>{body}</div>;
  return (
    <Link href={`/watch/${video.id}`} className={`${Styles.card} ${compact ? Styles.compact : ""}`}>
      {body}
    </Link>
  );
};

export default VideoCard;
