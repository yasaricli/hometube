import { useId, useRef, useState } from "react";

// Components
import Icon from "@/components/Icon";

// Store
import useLibraryStore from "@/store/useLibraryStore";

// Utils
import { bytesPerSecond, fmtBytes, fmtDuration } from "@/utils/shortcuts";
import { getSocket } from "@/utils/socket";

// Styles
import DialogStyles from "@/styles/dialog.module.scss";
import Styles from "../styles.module.scss";

const FILTERS = [
  ["new", "Not saved"],
  ["saved", "Saved"],
  ["all", "All"],
];

const buttonLabel = (busy, n) => {
  if (busy) return "Adding…";
  if (!n) return "Download";
  return `Download ${n} ${n === 1 ? "video" : "videos"}`;
};

// Lists the channel's uploads on YouTube; the picked ones that aren't saved yet are queued for download.
const ChannelImport = ({ channel }) => {
  const dialog = useRef();
  const titleId = useId();
  const { categories, videos: library } = useLibraryStore();
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [filter, setFilter] = useState("new");
  const [picked, setPicked] = useState([]);
  const [category, setCategory] = useState("");

  const fresh = videos.filter((v) => !v.saved);
  const shown = videos.filter((v) => filter === "all" || (filter === "saved") === v.saved);
  const count = { new: fresh.length, saved: videos.length - fresh.length, all: videos.length };
  const allPicked = !!fresh.length && fresh.every((v) => picked.includes(v.ytId));
  // YouTube's channel list has no file sizes, so estimate them from the library's average bitrate
  const rate = bytesPerSecond(library);
  const estimate = (v) => v.duration * rate;
  const pickedSize = videos.filter((v) => picked.includes(v.ytId)).reduce((a, v) => a + estimate(v), 0);

  const open = () => {
    setVideos([]);
    setPicked([]);
    setError("");
    setFilter("new");
    setCategory("");
    setLoading(true);
    dialog.current.showModal();
    getSocket().emit("channel:browse", channel.id, (res) => {
      setLoading(false);
      if (res.error) return setError(res.error);
      setVideos(res.videos);
    });
  };

  const close = () => dialog.current.close();

  const toggle = (ytId) => setPicked(picked.includes(ytId) ? picked.filter((x) => x !== ytId) : [...picked, ytId]);

  const toggleAll = () => setPicked(allPicked ? [] : fresh.map((v) => v.ytId));

  const submit = (e) => {
    e.preventDefault();
    setBusy(true);
    const chosen = videos.filter((v) => picked.includes(v.ytId));
    getSocket().emit("channel:download", { channel: channel.id, category, videos: chosen }, (res) => {
      setBusy(false);
      if (res.error) return setError(res.error);
      close();
    });
  };

  return (
    <>
      <button type="button" className="btnPrimary" onClick={open}>
        <Icon name="download" size={20} /> Get videos
      </button>

      <dialog
        ref={dialog}
        className={`${DialogStyles.dialog} ${Styles.importDialog}`}
        aria-labelledby={titleId}
        onClick={(e) => e.target === dialog.current && close()}
      >
        <form className={DialogStyles.sheet} onSubmit={submit}>
          <header className={DialogStyles.head}>
            <h2 id={titleId}>Videos from {channel.name}</h2>
            <button type="button" className={DialogStyles.close} onClick={close} aria-label="Close">
              <Icon name="close" size={20} />
            </button>
          </header>

          {loading && <p className={DialogStyles.hint}>Reading the channel on YouTube…</p>}
          {error && <p className={DialogStyles.error}>{error}</p>}

          {!!videos.length && (
            <>
              <div className={Styles.importBar}>
                <div className={Styles.importFilters} role="tablist" aria-label="Show">
                  {FILTERS.map(([key, label]) => (
                    <button key={key} type="button" role="tab" aria-selected={filter === key} onClick={() => setFilter(key)}>
                      {label} <small>{count[key]}</small>
                    </button>
                  ))}
                </div>
                {!!fresh.length && (
                  <label className={Styles.importAll}>
                    <input type="checkbox" checked={allPicked} onChange={toggleAll} /> Select all not saved
                  </label>
                )}
              </div>

              <ul className={Styles.importList}>
                {shown.map((v) => (
                  <li key={v.ytId}>
                    <label data-saved={v.saved}>
                      <input type="checkbox" checked={v.saved || picked.includes(v.ytId)} disabled={v.saved} onChange={() => toggle(v.ytId)} />
                      <span className={Styles.importThumb}>
                        <img src={`https://i.ytimg.com/vi/${v.ytId}/mqdefault.jpg`} alt="" loading="lazy" />
                        {!!v.duration && <small>{fmtDuration(v.duration)}</small>}
                      </span>
                      <span className={Styles.importTitle}>{v.title}</span>
                      {v.saved ? <em>In library</em> : <small className={Styles.importSize}>≈ {fmtBytes(estimate(v))}</small>}
                    </label>
                  </li>
                ))}
                {!shown.length && <li className={DialogStyles.hint}>Nothing here.</li>}
              </ul>
            </>
          )}

          <footer className={DialogStyles.foot}>
            {!!categories.length && (
              <select className={Styles.importCategory} value={category} onChange={(e) => setCategory(e.target.value)} aria-label="Category">
                <option value="">No category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            )}
            {!!picked.length && (
              <span className={Styles.importTotal} title="Estimated from the average size of your downloaded videos">
                ≈ {fmtBytes(pickedSize)}
              </span>
            )}
            <button type="button" className="btn" onClick={close}>
              Cancel
            </button>
            <button className="btnBrand" disabled={busy || !picked.length}>
              {buttonLabel(busy, picked.length)}
            </button>
          </footer>
        </form>
      </dialog>
    </>
  );
};

export default ChannelImport;
