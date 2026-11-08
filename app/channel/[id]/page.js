"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

// Components
import AppShell from "@/components/AppShell";
import ChannelAvatar from "@/components/ChannelAvatar";
import Icon from "@/components/Icon";
import ShortsGrid from "@/components/ShortsGrid";
import VideoGrid from "@/components/VideoGrid";

// Partials
import ChannelFollow from "./partials/ChannelFollow";
import ChannelImport from "./partials/ChannelImport";
import ChannelRefresh from "./partials/ChannelRefresh";
import ChannelStop from "./partials/ChannelStop";

// Store
import useLibraryStore from "@/store/useLibraryStore";

// Styles
import Styles from "./styles.module.scss";

const ChannelPage = () => {
  const { id } = useParams();
  const { videos, channels, loaded } = useLibraryStore();
  const channel = channels.find((c) => c.id === id);
  const saved = videos.filter((v) => v.channel === id);
  // queued, waiting or downloading: what "Stop downloads" takes off the queue
  const unfinished = saved.filter((v) => ["queued", "waiting", "downloading"].includes(v.status)).length;
  const longs = saved.filter((v) => !v.short);
  const shorts = saved.filter((v) => v.short);
  const [tab, setTab] = useState("videos");
  // a channel with only Shorts opens on them
  const shown = shorts.length && (tab === "shorts" || !longs.length) ? "shorts" : "videos";

  if (!channel) {
    return (
      <AppShell>
        {loaded && (
          <div className={Styles.missing}>
            <h2>This channel has no saved videos.</h2>
            <Link href="/" className="btn">
              Back to home
            </Link>
          </div>
        )}
      </AppShell>
    );
  }

  return (
    <AppShell>
      <title>{`${channel.name} · HomeTube`}</title>
      <header className={Styles.head}>
        <ChannelAvatar channel={channel} size={120} />
        <div>
          <h1>{channel.name}</h1>
          <p>
            {longs.length} saved {longs.length === 1 ? "video" : "videos"}
            {!!shorts.length && ` · ${shorts.length} ${shorts.length === 1 ? "Short" : "Shorts"}`}
          </p>
          {channel.url && (
            <div className={Styles.actions}>
              <ChannelFollow channel={channel} />
              <ChannelImport channel={channel} />
              <a href={channel.url} target="_blank" rel="noreferrer" className="btn">
                <Icon name="external" size={20} /> Channel on YouTube
              </a>
              <ChannelRefresh channel={channel} />
              <ChannelStop channel={channel} count={unfinished} />
            </div>
          )}
        </div>
      </header>

      <div className={`${Styles.tabs} ${Styles.pageTabs}`} role="tablist" aria-label="Uploads">
        <button type="button" role="tab" aria-selected={shown === "videos"} onClick={() => setTab("videos")}>
          Videos
        </button>
        {!!shorts.length && (
          <button type="button" role="tab" aria-selected={shown === "shorts"} onClick={() => setTab("shorts")}>
            Shorts
          </button>
        )}
      </div>

      {shown === "shorts" ? <ShortsGrid videos={shorts} /> : <VideoGrid videos={longs} />}
    </AppShell>
  );
};

export default ChannelPage;
