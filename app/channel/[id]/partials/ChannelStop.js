import { useState } from "react";

// Components
import Icon from "@/components/Icon";

// Utils
import { getSocket } from "@/utils/socket";

// Stops the channel's unfinished downloads and takes them off the queue and out of the library.
// count: how many there are; the button only shows while there are some. First click arms it for three seconds.
const ChannelStop = ({ channel, count }) => {
  const [armed, setArmed] = useState(false);
  const [busy, setBusy] = useState(false);

  if (!count) return null;

  const click = () => {
    if (!armed) {
      setArmed(true);
      setTimeout(() => setArmed(false), 3000);
      return;
    }
    setArmed(false);
    setBusy(true);
    getSocket().emit("channel:stop", channel.id, () => setBusy(false));
  };

  const label = () => {
    if (busy) return "Stopping…";
    if (armed) return `Click again to remove ${count}`;
    return `Stop ${count} ${count === 1 ? "download" : "downloads"}`;
  };

  return (
    <button
      type="button"
      className="btn"
      onClick={click}
      disabled={busy}
      title="Stop this channel's downloads and take them off the queue; you can pick them again later with Get videos"
    >
      <Icon name="close" size={20} /> {label()}
    </button>
  );
};

export default ChannelStop;
