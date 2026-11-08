import { useState } from "react";

// Components
import Icon from "@/components/Icon";

// Utils
import { getSocket } from "@/utils/socket";

// Styles
import Styles from "../styles.module.scss";

// Reads the channel again from YouTube: its name, link and profile picture, and for a followed
// channel looks for new uploads right away.
const ChannelRefresh = ({ channel }) => {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [note, setNote] = useState("");

  const refresh = () => {
    setBusy(true);
    setError("");
    setNote("");
    getSocket().emit("channel:refresh", channel.id, (res) => {
      setBusy(false);
      if (res.error) return setError(res.error);
      if (!channel.follow) return;
      setNote(res.queued ? `${res.queued} new ${res.queued === 1 ? "upload" : "uploads"} queued` : "No new uploads");
      setTimeout(() => setNote(""), 5000);
    });
  };

  return (
    <>
      <button type="button" className="btn" onClick={refresh} disabled={busy} title="Read the name and picture again from YouTube">
        <span className={busy ? Styles.spinning : Styles.refreshIcon}>
          <Icon name="retry" size={20} />
        </span> {busy ? "Refreshing…" : "Refresh"}
      </button>
      {note && (
        <p className={Styles.refreshNote} role="status">
          {note}
        </p>
      )}
      {error && (
        <p className={Styles.refreshError} role="alert">
          {error}
        </p>
      )}
    </>
  );
};

export default ChannelRefresh;
