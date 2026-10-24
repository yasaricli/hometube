"use client";

import { useParams } from "next/navigation";
import Link from "next/link";

// Components
import AppShell from "@/components/AppShell";
import ChannelAvatar from "@/components/ChannelAvatar";
import Icon from "@/components/Icon";

// Partials
import DeleteButton from "./partials/DeleteButton";
import Description from "./partials/Description";
import UpNext from "./partials/UpNext";

// Store
import useLibraryStore from "@/store/useLibraryStore";

// Utils
import { getSocket } from "@/utils/socket";

// Styles
import Styles from "./styles.module.scss";

const Watch = () => {
  const { id } = useParams();
  const { videos, channels, categories, loaded } = useLibraryStore();
  const video = videos.find((v) => v.id === id);

  if (!video) {
    return (
      <AppShell>
        {loaded && (
          <div className={Styles.missing}>
            <h2>This video isn't in your library.</h2>
            <Link href="/" className="btn">
              Back to home
            </Link>
          </div>
        )}
      </AppShell>
    );
  }

  const channel = channels.find((c) => c.id === video.channel);
  const channelName = channel?.name || "Unknown channel";

  const setCategory = (e) => getSocket().emit("video:category", { id, category: e.target.value }, () => {});

  return (
    <AppShell theater>
      <title>{`${video.title} · HomeTube`}</title>
      <div className={Styles.theater}>
        {video.status === "ready" ? (
          <video key={id} src={`/media/${id}/video.mp4`} poster={`/media/${id}/thumb.jpg`} controls autoPlay playsInline />
        ) : (
          <p>This video is still downloading.</p>
        )}
      </div>

      <div className={Styles.layout}>
        <div className={Styles.primary}>
          <h1 className={Styles.title}>{video.title}</h1>

          <div className={Styles.meta}>
            <Link href={`/channel/${video.channel}`} className={Styles.channel}>
              <ChannelAvatar channel={channel} size={40} />
              <span className={Styles.channelText}>
                <b>{channelName}</b>
                {videos.filter((v) => v.channel === video.channel).length} saved
              </span>
            </Link>

            <div className={Styles.actions}>
              <label className={`btn ${Styles.category}`}>
                <Icon name="tag" size={20} />
                <select value={video.category} onChange={setCategory} aria-label="Category">
                  <option value="">No category</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </label>
              <a href={video.url} target="_blank" rel="noreferrer" className="btn">
                <Icon name="external" size={20} /> YouTube
              </a>
              <DeleteButton id={id} />
            </div>
          </div>

          <Description video={video} />
        </div>

        <UpNext key={id} video={video} />
      </div>
    </AppShell>
  );
};

export default Watch;
