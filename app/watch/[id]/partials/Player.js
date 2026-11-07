import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

// Components
import Icon from "@/components/Icon";

// Store
import useLibraryStore from "@/store/useLibraryStore";

// Utils
import { getSocket } from "@/utils/socket";
import { nextInChannel } from "@/utils/upNext";

// Styles
import Styles from "../styles.module.scss";

const COUNTDOWN = 5;

// The player; when the video ends, another one from the same channel starts after a short countdown.
// Mounted per video (key), so the countdown and the watched report start over on the next one.
const Player = ({ video }) => {
  const router = useRouter();
  const { videos } = useLibraryStore();
  const reported = useRef(false);
  // seconds left before the next video plays; null while this one is playing or after Cancel
  const [left, setLeft] = useState(null);
  // picked once the video ends, so a library update during the countdown doesn't swap it
  const [next, setNext] = useState();

  const play = (v) => router.push(`/watch/${v.id}`);

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

  const ended = () => {
    const upcoming = nextInChannel(video, videos);
    if (!upcoming) return;
    setNext(upcoming);
    setLeft(COUNTDOWN);
  };

  return (
    <>
      <video
        src={`/media/${video.id}/video.mp4`}
        poster={`/media/${video.id}/thumb.jpg`}
        controls
        autoPlay
        playsInline
        onPlay={watched}
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
