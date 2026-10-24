"use client";

// Components
import AddVideoDialog from "@/components/AddVideoDialog";
import AppShell from "@/components/AppShell";
import { LogoMark } from "@/components/Logo";
import VideoGrid from "@/components/VideoGrid";

// Partials
import CategoryChips from "./partials/CategoryChips";

// Store
import useLibraryStore from "@/store/useLibraryStore";
import useUiStore from "@/store/useUiStore";

// Utils
import { matches } from "@/utils/shortcuts";

// Styles
import Styles from "./styles.module.scss";

const Home = () => {
  const { videos, channels, loaded } = useLibraryStore();
  const { query, category } = useUiStore();
  const channelName = (id) => channels.find((c) => c.id === id)?.name || "";
  const shown = videos.filter((v) => (!category || v.category === category) && matches(v, channelName(v.channel), query));

  return (
    <AppShell>
      <CategoryChips />

      {loaded && !videos.length && (
        <div className={Styles.empty}>
          <LogoMark size={72} />
          <h2>Your library is empty</h2>
          <p>Paste a YouTube link and HomeTube downloads the video to your server, so you can watch it any time, even offline.</p>
          <AddVideoDialog label="Add your first video" primary />
        </div>
      )}

      {!!videos.length && !shown.length && (
        <p className={Styles.none}>{query ? `Nothing in your library matches "${query}".` : "No videos in this category yet."}</p>
      )}

      <VideoGrid videos={shown} />
    </AppShell>
  );
};

export default Home;
