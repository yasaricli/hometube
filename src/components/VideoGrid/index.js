"use client";

import { useEffect, useRef, useState } from "react";

// Components
import VideoCard from "@/components/VideoCard";

// Styles
import Styles from "./styles.module.scss";

const PAGE = 24;

// The home and channel pages' grid of video cards: draws one page of cards, then the next as you scroll near the end.
const VideoGrid = ({ videos }) => {
  const [count, setCount] = useState(PAGE);
  const end = useRef(null);
  const more = count < videos.length;

  useEffect(() => {
    if (!more) return;
    const io = new IntersectionObserver(([e]) => e.isIntersecting && setCount((c) => c + PAGE), { rootMargin: "800px" });
    io.observe(end.current);
    return () => io.disconnect();
  }, [more, count]);

  return (
    <>
      <section className={Styles.grid}>
        {videos.slice(0, count).map((v) => (
          <VideoCard key={v.id} video={v} />
        ))}
      </section>
      {more && <div ref={end} />}
    </>
  );
};

export default VideoGrid;
