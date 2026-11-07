import { useState } from "react";

// Components
import Icon from "@/components/Icon";

// Utils
import { getSocket } from "@/utils/socket";

// Styles
import Styles from "../styles.module.scss";

// Reads the channel again from YouTube: its name, link and profile picture.
const ChannelRefresh = ({ channel }) => {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const refresh = () => {
    setBusy(true);
    setError("");
    getSocket().emit("channel:refresh", channel.id, (res) => {
      setBusy(false);
      if (res.error) setError(res.error);
    });
  };

  return (
    <>
      <button type="button" className="btn" onClick={refresh} disabled={busy} title="Read the name and picture again from YouTube">
        <span className={busy ? Styles.spinning : Styles.refreshIcon}>
          <Icon name="retry" size={20} />
        </span> {busy ? "Refreshing…" : "Refresh"}
      </button>
      {error && (
        <p className={Styles.refreshError} role="alert">
          {error}
        </p>
      )}
    </>
  );
};

export default ChannelRefresh;
