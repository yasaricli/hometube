import { useState } from "react";

// Utils
import { fmtBytes, fmtDate, timeAgo } from "@/utils/shortcuts";

// Styles
import Styles from "../styles.module.scss";

// Dates and size on top, the description folded to a few lines until opened.
const Description = ({ video }) => {
  const [open, setOpen] = useState(false);
  const long = video.description.length > 240 || video.description.split("\n").length > 4;

  return (
    <div className={Styles.description} data-open={open || !long}>
      <b>
        {video.uploadedAt ? `Published ${fmtDate(video.uploadedAt)}` : "Publish date unknown"} · Saved {timeAgo(video.savedAt)} · {fmtBytes(video.size)}
      </b>
      <p>{video.description || "No description."}</p>
      {long && (
        <button type="button" onClick={() => setOpen(!open)}>
          {open ? "Show less" : "…more"}
        </button>
      )}
    </div>
  );
};

export default Description;
