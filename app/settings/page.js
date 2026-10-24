"use client";

// Components
import AppShell from "@/components/AppShell";

// Hooks
import useSettings from "@/hooks/useSettings";

// Styles
import Styles from "./styles.module.scss";

// [height, label, hint]; sizes are typical, real ones depend on the video
const QUALITIES = [
  [0, "Best available", "Up to 4K or more when the video has it · the largest files"],
  [2160, "2160p (4K)", "About 8 GB per hour"],
  [1440, "1440p", "About 4 GB per hour"],
  [1080, "1080p", "About 1.5–2 GB per hour · recommended"],
  [720, "720p", "About 0.8 GB per hour"],
  [480, "480p", "About 0.4 GB per hour"],
  [360, "360p", "About 0.25 GB per hour"],
];

const RATE_LIMITS = [0, 1, 2, 5, 10, 20, 50];

const Settings = () => {
  const { settings, status, save } = useSettings();
  // H.264 stops at 1080p, so a higher pick only applies once compatibility is off
  const capped = settings?.compatible && (!settings.quality || settings.quality > 1080);

  return (
    <AppShell>
      <title>Settings · HomeTube</title>
      <div className={Styles.page}>
        <header className={Styles.head}>
          <h1>Settings</h1>
          <span className={Styles.status} aria-live="polite">
            {status}
          </span>
        </header>

        {settings && (
          <>
            <section className={Styles.card}>
              <h2>Download quality</h2>
              <p>The highest resolution HomeTube saves. Applies to queued and new downloads; saved videos stay as they are.</p>
              <div className={Styles.options} role="radiogroup" aria-label="Download quality">
                {QUALITIES.map(([height, label, hint]) => (
                  <label key={height} className={Styles.option} data-checked={settings.quality === height}>
                    <input type="radio" name="quality" checked={settings.quality === height} onChange={() => save({ quality: height })} />
                    <span>
                      <b>{label}</b>
                      <small>{hint}</small>
                    </span>
                  </label>
                ))}
              </div>
              {capped && (
                <p className={Styles.note}>
                  YouTube offers H.264 only up to 1080p, so videos are saved at 1080p. Turn off “Plays everywhere” below for higher quality.
                </p>
              )}
            </section>

            <section className={Styles.card}>
              <h2>Compatibility</h2>
              <label className={Styles.switch}>
                <span>
                  <b>Plays everywhere</b>
                  <small>
                    Saves H.264 video with AAC audio, which every browser, phone and TV can play. Turn it off for VP9/AV1: smaller files and
                    quality above 1080p, but older Safari and iPhones may not play them.
                  </small>
                </span>
                <input type="checkbox" role="switch" checked={settings.compatible} onChange={(e) => save({ compatible: e.target.checked })} />
              </label>
            </section>

            <section className={Styles.card}>
              <h2>Download speed</h2>
              <label className={Styles.row}>
                <span>
                  <b>Speed limit</b>
                  <small>Keep downloads from filling your home connection.</small>
                </span>
                <select value={settings.rateLimit} onChange={(e) => save({ rateLimit: Number(e.target.value) })}>
                  {RATE_LIMITS.map((mb) => (
                    <option key={mb} value={mb}>
                      {mb ? `${mb} MB/s` : "Unlimited"}
                    </option>
                  ))}
                </select>
              </label>
            </section>
          </>
        )}
      </div>
    </AppShell>
  );
};

export default Settings;
