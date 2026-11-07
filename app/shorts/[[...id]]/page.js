"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";

// Components
import AppShell from "@/components/AppShell";
import Icon from "@/components/Icon";

// Partials
import ShortItem from "./partials/ShortItem";

// Store
import useLibraryStore from "@/store/useLibraryStore";

// Utils
import { mixShorts } from "@/utils/feed";

// Styles
import Styles from "./styles.module.scss";

// how many Shorts on each side of the one on screen load their file ahead
const PRELOAD = 1;

const typing = (el) => ["INPUT", "TEXTAREA", "SELECT"].includes(el?.tagName);

// The Shorts player: one Short per screen, scroll (wheel, swipe, arrow keys) for the next one.
// /shorts/<id> starts with that Short; the rest follow in a mixed order picked once per visit.
const ShortsPage = () => {
  const params = useParams();
  const startId = params.id?.[0];
  const { videos, channels, categories, loaded } = useLibraryStore();
  const [seed] = useState(() => Math.floor(Math.random() * 2 ** 32));
  const [category, setCategory] = useState("");
  // the order is fixed when the feed opens (or its category changes), so watching a Short doesn't
  // reshuffle it; Shorts downloaded meanwhile join at the end. key: the category it was made for.
  const [order, setOrder] = useState({ key: null, ids: [] });
  const [active, setActive] = useState(0);
  const [muted, setMuted] = useState(false);
  const feed = useRef();
  const current = useRef();

  const shorts = videos.filter((v) => v.short && v.status === "ready");
  const shortCategories = categories.filter((c) => shorts.some((v) => v.category === c.id));
  const byId = Object.fromEntries(shorts.map((v) => [v.id, v]));
  const list = order.ids.map((id) => byId[id]).filter(Boolean);

  useEffect(() => {
    if (!loaded) return;
    const pool = shorts.filter((v) => !category || v.category === category);
    if (order.key !== category) {
      let ids = mixShorts(pool, seed).map((v) => v.id);
      if (order.key === null && ids.includes(startId)) ids = [startId, ...ids.filter((id) => id !== startId)];
      setOrder({ key: category, ids });
      setActive(0);
      feed.current?.scrollTo({ top: 0 });
      return;
    }
    const added = pool.filter((v) => !order.ids.includes(v.id));
    if (added.length) setOrder({ key: category, ids: [...order.ids, ...added.map((v) => v.id)] });
  }, [loaded, category, videos]);

  // the Short that fills most of the feed is the one playing
  useEffect(() => {
    const root = feed.current;
    if (!root) return;
    const observer = new IntersectionObserver(
      (entries) => entries.filter((e) => e.isIntersecting).forEach((e) => setActive(Number(e.target.dataset.index))),
      { root, threshold: 0.6 },
    );
    [...root.children].forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [list.length]);

  // the address follows the Short on screen, so it can be shared or reloaded
  const activeId = list[active]?.id;
  useEffect(() => {
    if (activeId) window.history.replaceState(null, "", `/shorts/${activeId}`);
  }, [activeId]);

  const go = (index) => feed.current?.children[index]?.scrollIntoView({ behavior: "smooth", block: "start" });

  useEffect(() => {
    const onKey = (e) => {
      if (typing(e.target) || e.metaKey || e.ctrlKey || e.altKey) return;
      const keys = {
        ArrowDown: () => go(active + 1),
        ArrowUp: () => go(active - 1),
        m: () => setMuted((m) => !m),
        " ": () => (current.current?.paused ? current.current.play() : current.current?.pause()),
      };
      if (!keys[e.key]) return;
      e.preventDefault();
      keys[e.key]();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active]);

  return (
    <AppShell>
      <title>Shorts · HomeTube</title>
      <div className={Styles.page}>
        {!!shortCategories.length && (
          <div className={Styles.chips} role="tablist" aria-label="Categories">
            <button type="button" role="tab" aria-selected={!category} onClick={() => setCategory("")}>
              All
            </button>
            {shortCategories.map((c) => (
              <button key={c.id} type="button" role="tab" aria-selected={category === c.id} onClick={() => setCategory(c.id)}>
                {c.name}
              </button>
            ))}
          </div>
        )}

        {loaded && !shorts.length && (
          <div className={Styles.empty}>
            <Icon name="shorts" size={56} />
            <h2>No Shorts yet</h2>
            <p>Open a channel, choose Get videos and switch to its Shorts. You can also paste a youtube.com/shorts link with Add video.</p>
          </div>
        )}

        <div ref={feed} className={Styles.feed} data-chips={!!shortCategories.length}>
          {list.map((v, i) => (
            <section key={v.id} className={Styles.slide} data-index={i}>
              <ShortItem
                video={v}
                channel={channels.find((c) => c.id === v.channel)}
                active={i === active}
                near={Math.abs(i - active) <= PRELOAD}
                muted={muted}
                setMuted={setMuted}
                register={(el) => (current.current = el)}
              />
            </section>
          ))}
        </div>

        {list.length > 1 && (
          <div className={Styles.nav}>
            <button type="button" onClick={() => go(active - 1)} disabled={active === 0} aria-label="Previous Short">
              <Icon name="up" size={24} />
            </button>
            <button type="button" onClick={() => go(active + 1)} disabled={active >= list.length - 1} aria-label="Next Short">
              <Icon name="down" size={24} />
            </button>
          </div>
        )}
      </div>
    </AppShell>
  );
};

export default ShortsPage;
