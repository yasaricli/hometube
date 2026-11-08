import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

// Components
import Icon from "@/components/Icon";

// Store
import useLibraryStore from "@/store/useLibraryStore";

// Utils
import { getSocket } from "@/utils/socket";
import { resumeAt } from "@/utils/playback";
import { nextInChannel } from "@/utils/upNext";

// Styles
import Styles from "../styles.module.scss";

const COUNTDOWN = 5;
// how often the playback position is saved while playing, in seconds of watching
const SAVE_EVERY = 10;


// The player; when the video ends, another one from the same channel starts after a short countdown.
// It picks up where the video was left and keeps saving the position while it plays.
// Mounted per video (key), so the countdown and the watched report start over on the next one.
const Player = ({ video }) => {
  const router = useRouter();
  const { videos, setPosition } = useLibraryStore();
  const reported = useRef(false);
  const element = useRef();
  // read once: the store's position changes as this player saves it
  const startAt = useRef(video.position);
  const savedAt = useRef(0);
  // seconds left before the next video plays; null while this one is playing or after Cancel
  const [left, setLeft] = useState(null);
  // picked once the video ends, so a library update during the countdown doesn't swap it
  const [next, setNext] = useState();

  const play = (v) => router.push(`/watch/${v.id}`);

  const savePosition = (seconds) => {
    if (!Number.isFinite(seconds)) return;
    savedAt.current = seconds;
    setPosition(video.id, seconds);
    getSocket().emit("video:position", { id: video.id, position: seconds });
  };

  // leaving the page or the video while it plays: keep the spot
  useEffect(() => {
    const leave = () => {
      const el = element.current;
      if (el && !el.ended && Math.abs(el.currentTime - savedAt.current) >= 1) savePosition(el.currentTime);
    };
    window.addEventListener("pagehide", leave);
    return () => {
      window.removeEventListener("pagehide", leave);
      leave();
    };
  }, []);

  const loaded = (e) => {
    const at = resumeAt(startAt.current || 0, e.currentTarget.duration);
    if (at) e.currentTarget.currentTime = at;
    savedAt.current = at;
  };

  const timeUpdate = (e) => {
    const { currentTime } = e.currentTarget;
    if (Math.abs(currentTime - savedAt.current) >= SAVE_EVERY) savePosition(currentTime);
  };

  useEffect(() => {
    if (left === null || !next) return;
    if (left <= 0) return play(next);
    const timer = setTimeout(() => setLeft(left - 1), 1000);
    return () => clearTimeout(timer);
  }, [left, next]);

  const watched = () => {
    setLeft(null);
    if (reported.current) return;
    reported.current = true;
    getSocket().emit("video:watched", video.id, () => {});
  };

  const ended = (e) => {
    // watched to the end: a full red line on the card, and the next play starts over
    savePosition(e.currentTarget.duration);
    const upcoming = nextInChannel(video, videos);
    if (!upcoming) return;
    setNext(upcoming);
    setLeft(COUNTDOWN);
  };

  return (
    <>
      <video
        ref={element}
        src={`/media/${video.id}/video.mp4`}
        poster={`/media/${video.id}/thumb.jpg`}
        controls
        autoPlay
        playsInline
        onPlay={watched}
        onLoadedMetadata={loaded}
        onTimeUpdate={timeUpdate}
        onPause={(e) => !e.currentTarget.ended && savePosition(e.currentTarget.currentTime)}
        onEnded={ended}
      />
      {left !== null && next && (
        <div className={Styles.autoplay} role="dialog" aria-label="Up next">
          <small>Up next in {left}</small>
          <img src={`/media/${next.id}/thumb.jpg`} alt="" />
          <b>{next.title}</b>
          <div className={Styles.autoplayActions}>
            <button type="button" className="btn" onClick={() => setLeft(null)}>
              Cancel
            </button>
            <button type="button" className="btnPrimary" onClick={() => play(next)}>
              <Icon name="play" size={20} /> Play now
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default Player;
