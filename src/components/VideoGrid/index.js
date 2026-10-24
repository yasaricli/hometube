// Components
import VideoCard from "@/components/VideoCard";

// Styles
import Styles from "./styles.module.scss";

// The home and channel pages' grid of video cards.
const VideoGrid = ({ videos }) => (
  <section className={Styles.grid}>
    {videos.map((v) => (
      <VideoCard key={v.id} video={v} />
    ))}
  </section>
);

export default VideoGrid;
