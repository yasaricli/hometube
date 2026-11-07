import { useEffect, useRef, useState } from "react";
import Link from "next/link";

// Components
import ChannelAvatar from "@/components/ChannelAvatar";
import Icon from "@/components/Icon";

// Utils
import { getSocket } from "@/utils/socket";

// Styles
import Styles from "../styles.module.scss";

// One Short in the feed. near: close enough to the one on screen to load its file; active: the one on screen,
// which plays from the start and loops. register(el) hands the <video> to the page for its keyboard shortcuts.
const ShortItem = ({ video, channel, active, near, muted, setMuted, register }) => {
  const ref = useRef();
  const [paused, setPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const reported = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.muted = muted;
  }, [muted, near]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!active) {
      el.pause();
      return;
    }
    register(el);
    el.currentTime = 0;
    // a browser that won't play sound before the first click plays it muted instead
    el.play().catch(() => {
      setMuted(true);
      el.muted = true;
      el.play().catch(() => setPaused(true));
    });
  }, [active, near]);

  const toggle = () => {
    const el = ref.current;
    if (!el) return;
    if (el.paused) el.play();
    else el.pause();
  };

  const played = () => {
    setPaused(false);
    if (reported.current) return;
    reported.current = true;
    getSocket().emit("video:watched", video.id, () => {});
  };

  const stop = (e) => e.stopPropagation();

  return (
    <div className={Styles.stage}>
      <div className={Styles.player} onClick={toggle}>
        {near ? (
          <video
            ref={ref}
            src={`/media/${video.id}/video.mp4`}
            poster={`/media/${video.id}/thumb.jpg`}
            loop
            playsInline
            preload="auto"
            onPlay={played}
            onPause={() => setPaused(true)}
            onTimeUpdate={(e) => setProgress(e.target.currentTime / (e.target.duration || 1))}
          />
        ) : (
          <img src={`/media/${video.id}/thumb.jpg`} alt="" loading="lazy" />
        )}

        {active && paused && (
          <span className={Styles.paused} aria-hidden="true">
            <Icon name="play" size={40} />
          </span>
        )}

        <button
          type="button"
          className={Styles.mute}
          onClick={(e) => {
            stop(e);
            setMuted(!muted);
          }}
          aria-label={muted ? "Unmute" : "Mute"}
        >
          <Icon name={muted ? "muted" : "volume"} size={22} />
        </button>

        <div className={Styles.info}>
          <Link href={`/channel/${video.channel}`} className={Styles.channel} onClick={stop}>
            <ChannelAvatar channel={channel} size={32} />
            <b>{channel?.name || "Unknown channel"}</b>
          </Link>
          <p>{video.title}</p>
        </div>

        <i className={Styles.progress} style={{ width: `${progress * 100}%` }} />
      </div>

      <div className={Styles.side}>
        <Link href={`/watch/${video.id}`} className={Styles.sideButton} title="Details, category and delete">
          <Icon name="tag" size={22} />
          <small>Details</small>
        </Link>
        <a href={video.url} target="_blank" rel="noreferrer" className={Styles.sideButton} title="Open on YouTube">
          <Icon name="external" size={22} />
          <small>YouTube</small>
        </a>
      </div>
    </div>
  );
};

export default ShortItem;
