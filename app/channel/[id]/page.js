"use client";

import { useParams } from "next/navigation";
import Link from "next/link";

// Components
import AppShell from "@/components/AppShell";
import ChannelAvatar from "@/components/ChannelAvatar";
import Icon from "@/components/Icon";
import VideoGrid from "@/components/VideoGrid";

// Partials
import ChannelImport from "./partials/ChannelImport";

// Store
import useLibraryStore from "@/store/useLibraryStore";

// Styles
import Styles from "./styles.module.scss";

const ChannelPage = () => {
  const { id } = useParams();
  const { videos, channels, loaded } = useLibraryStore();
  const channel = channels.find((c) => c.id === id);
  const saved = videos.filter((v) => v.channel === id);

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
            {saved.length} saved {saved.length === 1 ? "video" : "videos"}
          </p>
          {channel.url && (
            <div className={Styles.actions}>
              <ChannelImport channel={channel} />
              <a href={channel.url} target="_blank" rel="noreferrer" className="btn">
                <Icon name="external" size={20} /> Channel on YouTube
              </a>
            </div>
          )}
        </div>
      </header>

      <VideoGrid videos={saved} />
    </AppShell>
  );
};

export default ChannelPage;
