"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

// Components
import ChannelAvatar from "@/components/ChannelAvatar";
import Icon from "@/components/Icon";

// Partials
import NewCategory from "./partials/NewCategory";

// Store
import useLibraryStore from "@/store/useLibraryStore";
import useUiStore from "@/store/useUiStore";

// Utils
import { getSocket } from "@/utils/socket";

// Styles
import Styles from "./styles.module.scss";

// overlay: hidden until the menu button opens it, at every screen width.
const Sidebar = ({ overlay }) => {
  const router = useRouter();
  const pathname = usePathname();
  const { videos, channels, categories } = useLibraryStore();
  const { category, sidebarToggled, setCategory, closeSidebar } = useUiStore();
  // the category whose remove button was clicked once and waits for a second click
  const [armed, setArmed] = useState("");
  // videos per category and per channel, counted in one pass
  const counts = videos.reduce((acc, v) => {
    acc[v.category] = (acc[v.category] || 0) + 1;
    acc[v.channel] = (acc[v.channel] || 0) + 1;
    return acc;
  }, {});
  // channels that still have a video, most videos first
  const shownChannels = channels
    .map((c) => ({ ...c, count: counts[c.id] || 0 }))
    .filter((c) => c.count)
    .sort((a, b) => b.count - a.count);

  const pick = (id) => {
    setCategory(id);
    closeSidebar();
    if (pathname !== "/") router.push("/");
  };

  // first click arms the button for three seconds, the second removes the category
  const removeCategory = (e, id) => {
    e.stopPropagation();
    if (armed !== id) {
      setArmed(id);
      setTimeout(() => setArmed((current) => (current === id ? "" : current)), 3000);
      return;
    }
    setArmed("");
    if (category === id) setCategory("");
    getSocket().emit("category:remove", id, () => {});
  };

  return (
    <>
      <div className={Styles.scrim} data-toggled={sidebarToggled} data-overlay={!!overlay} onClick={closeSidebar} />
      <nav className={Styles.sidebar} data-toggled={sidebarToggled} data-overlay={!!overlay} aria-label="Library">
        <section>
          <button type="button" className={Styles.item} data-active={pathname === "/" && !category} onClick={() => pick("")}>
            <Icon name="home" size={22} />
            <span>Home</span>
          </button>
        </section>

        <section>
          <h3>Categories</h3>
          {categories.map((c) => (
            <div key={c.id} className={Styles.row}>
              <button type="button" className={Styles.item} data-active={pathname === "/" && category === c.id} onClick={() => pick(c.id)}>
                <Icon name="tag" size={22} />
                <span>{c.name}</span>
                <small className={Styles.count}>{counts[c.id] || 0}</small>
              </button>
              <button
                type="button"
                className={Styles.remove}
                data-armed={armed === c.id}
                onClick={(e) => removeCategory(e, c.id)}
                aria-label={armed === c.id ? `Click again to delete ${c.name}` : `Delete ${c.name}`}
                title="Delete category (its videos stay in the library)"
              >
                {armed === c.id ? "Delete?" : <Icon name="close" size={16} />}
              </button>
            </div>
          ))}
          <NewCategory />
        </section>

        <section>
          <Link href="/settings" className={Styles.item} data-active={pathname === "/settings"} onClick={closeSidebar}>
            <Icon name="sliders" size={22} />
            <span>Settings</span>
          </Link>
        </section>

        {!!shownChannels.length && (
          <section>
            <h3>Channels</h3>
            {shownChannels.map((c) => (
              <Link key={c.id} href={`/channel/${c.id}`} className={Styles.item} data-active={pathname === `/channel/${c.id}`} onClick={closeSidebar}>
                <ChannelAvatar channel={c} size={24} />
                <span>{c.name}</span>
              </Link>
            ))}
          </section>
        )}
      </nav>
    </>
  );
};

export default Sidebar;
