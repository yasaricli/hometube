"use client";

import { useState } from "react";

// Utils
import { hueOf } from "@/utils/shortcuts";

// Styles
import Styles from "./styles.module.scss";

// The channel's saved profile picture, or a colored letter when there is none (yet).
const ChannelAvatar = ({ channel, size = 36 }) => {
  const [failed, setFailed] = useState(false);
  const name = channel?.name || "?";
  const style = { width: size, height: size, fontSize: size * 0.42, background: `hsl(${hueOf(name)} 45% 42%)` };

  return (
    <span className={Styles.avatar} style={style} aria-hidden="true">
      {channel?.avatar && !failed ? (
        <img src={`/media/channels/${channel.id}/avatar.jpg`} alt="" loading="lazy" onError={() => setFailed(true)} />
      ) : (
        name[0].toUpperCase()
      )}
    </span>
  );
};

export default ChannelAvatar;
