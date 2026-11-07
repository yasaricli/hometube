import { useState } from "react";
import Link from "next/link";

// Components
import Icon from "@/components/Icon";

// Styles
import Styles from "./styles.module.scss";

const statusText = (video) => {
  if (video.membersOnly) return "Members only";
  if (video.status === "failed") return "Download failed";
  if (video.status === "waiting") return "Retrying soon";
  if (video.status === "queued") return "Queued";
  return `Downloading ${Math.floor(video.progress?.percent || 0)}%`;
};

// One tall card; a ready Short opens in the Shorts player, the rest on their watch page (state, retry, delete).
const ShortCard = ({ video }) => {
  const [missing, setMissing] = useState(false);
  const ready = video.status === "ready";

  return (
    <Link href={ready ? `/shorts/${video.id}` : `/watch/${video.id}`} className={Styles.card}>
      <span className={Styles.thumb}>
        {ready && !missing && <img src={`/media/${video.id}/thumb.jpg`} alt="" loading="lazy" onError={() => setMissing(true)} />}
        {/* not downloaded yet: YouTube's own cover, dimmed under the state */}
        {!ready && <img src={`https://i.ytimg.com/vi/${video.ytId}/oar2.jpg`} alt="" loading="lazy" className={Styles.remote} />}
        {!ready && (
          <span className={Styles.pending} data-status={video.status}>
            <Icon name={video.status === "failed" ? "close" : "download"} size={18} />
            {statusText(video)}
          </span>
        )}
      </span>
      <h3 title={video.title}>{video.title}</h3>
    </Link>
  );
};

// The channel page's Shorts: tall cards, like the Shorts tab on YouTube.
const ShortsGrid = ({ videos }) => (
  <section className={Styles.grid}>
    {videos.map((v) => (
      <ShortCard key={v.id} video={v} />
    ))}
  </section>
);

export default ShortsGrid;
