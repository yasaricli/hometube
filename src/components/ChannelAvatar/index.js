"use client";

import { useState } from "react";

// Utils
import { hueOf } from "@/utils/shortcuts";

// Styles
import Styles from "./styles.module.scss";

// The channel's saved profile picture, or a colored letter when there is none (yet).
const ChannelAvatar = ({ channel, size = 36 }) => {
  // the picture that didn't load; a refreshed channel gets a new one to try
  const [failed, setFailed] = useState("");
  const name = channel?.name || "?";
  const src = `/media/channels/${channel?.id}/avatar.jpg?v=${channel?.version || 0}`;
  const style = { width: size, height: size, fontSize: size * 0.42, background: `hsl(${hueOf(name)} 45% 42%)` };

  return (
    <span className={Styles.avatar} style={style} aria-hidden="true">
      {channel?.avatar && failed !== src ? (
        <img src={src} alt="" loading="lazy" onError={() => setFailed(src)} />
      ) : (
        name[0].toUpperCase()
      )}
    </span>
  );
};

export default ChannelAvatar;
