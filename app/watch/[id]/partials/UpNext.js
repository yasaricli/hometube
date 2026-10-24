import { useState } from "react";

// Components
import VideoCard from "@/components/VideoCard";

// Store
import useLibraryStore from "@/store/useLibraryStore";

// Styles
import Styles from "../styles.module.scss";

const LIMIT = 20;

// Other videos next to the player, filtered by chips: the video's category, its channel, or everything.
// Ready videos come first; the rest show their download state like on the home page.
const UpNext = ({ video }) => {
  const { videos, channels, categories } = useLibraryStore();
  const category = categories.find((c) => c.id === video.category);
  const channel = channels.find((c) => c.id === video.channel);
  const [filter, setFilter] = useState(category ? "category" : "all");

  const chips = [
    category && { key: "category", label: category.name, test: (v) => v.category === category.id },
    channel && { key: "channel", label: `From ${channel.name}`, test: (v) => v.channel === channel.id },
    { key: "all", label: "All", test: () => true },
  ].filter(Boolean);
  const active = chips.find((c) => c.key === filter) || chips.at(-1);
  const list = videos
    .filter((v) => v.id !== video.id && active.test(v))
    .sort((a, b) => (b.status === "ready") - (a.status === "ready"))
    .slice(0, LIMIT);

  return (
    <aside className={Styles.upNext}>
      <div className={Styles.upNextChips} role="tablist" aria-label="Up next">
        {chips.map((c) => (
          <button key={c.key} type="button" role="tab" aria-selected={c.key === active.key} onClick={() => setFilter(c.key)}>
            {c.label}
          </button>
        ))}
      </div>
      {list.map((v) => (
        <VideoCard key={v.id} video={v} compact />
      ))}
      {!list.length && <p className={Styles.upNextEmpty}>No other videos here yet.</p>}
    </aside>
  );
};

export default UpNext;
