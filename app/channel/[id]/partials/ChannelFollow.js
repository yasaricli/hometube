import { useState } from "react";

// Components
import Icon from "@/components/Icon";

// Utils
import { getSocket } from "@/utils/socket";

// Styles
import Styles from "../styles.module.scss";

// Follows the channel: its new videos and Shorts download on their own from now on.
const ChannelFollow = ({ channel }) => {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const toggle = () => {
    setBusy(true);
    setError("");
    getSocket().emit("channel:follow", { id: channel.id, follow: !channel.follow }, (res) => {
      setBusy(false);
      if (res.error) setError(res.error);
    });
  };

  const label = () => {
    if (busy) return channel.follow ? "Unfollowing…" : "Following…";
    return channel.follow ? "Following" : "Follow";
  };

  return (
    <>
      <button
        type="button"
        className={channel.follow ? "btn" : "btnPrimary"}
        onClick={toggle}
        disabled={busy}
        aria-pressed={channel.follow}
        title={
          channel.follow
            ? "New uploads download on their own. Click to stop following."
            : "Download this channel's new videos and Shorts on their own from now on"
        }
      >
        <Icon name={channel.follow ? "check" : "bell"} size={20} /> {label()}
      </button>
      {error && (
        <p className={Styles.refreshError} role="alert">
          {error}
        </p>
      )}
    </>
  );
};

export default ChannelFollow;
