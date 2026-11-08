import { useState } from "react";
import Link from "next/link";

// Hooks
import useStorage from "@/hooks/useStorage";

// Utils
import { fmtBytes } from "@/utils/shortcuts";

// Styles
import Styles from "../styles.module.scss";

const DELETE_DAYS = [
  [0, "Never"],
  [7, "After 7 days"],
  [14, "After 14 days"],
  [30, "After 30 days"],
  [60, "After 60 days"],
  [90, "After 90 days"],
];
const KEEP_COUNTS = [0, 10, 25, 50, 100];
// channels listed before "Show all"
const TOP = 8;

// How much room the library takes, per channel, and the rules that delete old videos.
const Storage = ({ settings, save }) => {
  const { storage, cleaning, cleanNow } = useStorage(settings);
  const [all, setAll] = useState(false);
  const other = storage ? Math.max(0, storage.total - storage.free - storage.used) : 0;
  const pct = (bytes) => `${storage?.total ? (bytes / storage.total) * 100 : 0}%`;
  const channels = storage ? (all ? storage.channels : storage.channels.slice(0, TOP)) : [];

  return (
    <>
      <section className={Styles.card}>
        <h2>Storage</h2>
        {storage && (
          <>
            <p>
              HomeTube uses <b className={Styles.inline}>{fmtBytes(storage.used)}</b>
              {!!storage.total && ` · ${fmtBytes(storage.free)} free of ${fmtBytes(storage.total)}`}
            </p>
            {!!storage.total && (
              <>
                <div className={Styles.disk} role="img" aria-label={`${fmtBytes(storage.used)} used by HomeTube, ${fmtBytes(storage.free)} free`}>
                  <i className={Styles.diskOurs} style={{ width: pct(storage.used) }} />
                  <i className={Styles.diskOther} style={{ width: pct(other) }} />
                </div>
                <div className={Styles.legend}>
                  <span><i className={Styles.diskOurs} /> HomeTube</span>
                  <span><i className={Styles.diskOther} /> Other files</span>
                  <span><i /> Free</span>
                </div>
              </>
            )}
            <ul className={Styles.channels}>
              {channels.map((c) => (
                <li key={c.id}>
                  <Link href={`/channel/${c.id}`}>{c.name}</Link>
                  <small>{c.count} saved</small>
                  <b className={Styles.inline}>{fmtBytes(c.size)}</b>
                </li>
              ))}
            </ul>
            {storage.channels.length > TOP && (
              <button type="button" className={Styles.more} onClick={() => setAll(!all)}>
                {all ? "Show fewer" : `Show all ${storage.channels.length} channels`}
              </button>
            )}
          </>
        )}
      </section>

      <section className={Styles.card}>
        <h2>Cleanup</h2>
        <p>Deletes old videos on its own to make room. It runs every hour, so there's time to change your mind after picking a rule.</p>
        <label className={Styles.row}>
          <span>
            <b>Delete watched videos</b>
            <small>Counted from the last time a video was played.</small>
          </span>
          <select value={settings.deleteWatchedDays} onChange={(e) => save({ deleteWatchedDays: Number(e.target.value) })}>
            {DELETE_DAYS.map(([days, label]) => (
              <option key={days} value={days}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label className={Styles.row}>
          <span>
            <b>Videos kept per channel</b>
            <small>Only each channel's newest videos stay, and as many of its newest Shorts.</small>
          </span>
          <select value={settings.keepPerChannel} onChange={(e) => save({ keepPerChannel: Number(e.target.value) })}>
            {KEEP_COUNTS.map((n) => (
              <option key={n} value={n}>
                {n ? `Newest ${n}` : "All"}
              </option>
            ))}
          </select>
        </label>
        {!!storage?.cleanup.count && (
          <div className={Styles.note}>
            <span>
              The next cleanup deletes {storage.cleanup.count} {storage.cleanup.count === 1 ? "video" : "videos"} and frees{" "}
              {fmtBytes(storage.cleanup.size)}.
            </span>
            <button type="button" className="btn" onClick={cleanNow} disabled={cleaning}>
              {cleaning ? "Deleting…" : "Delete now"}
            </button>
          </div>
        )}
      </section>
    </>
  );
};

export default Storage;
