"use client";

import { usePathname, useRouter } from "next/navigation";

// Components
import AddVideoDialog from "@/components/AddVideoDialog";
import Icon from "@/components/Icon";
import Logo from "@/components/Logo";

// Store
import useLibraryStore from "@/store/useLibraryStore";
import useUiStore from "@/store/useUiStore";

// Utils
import { fmtBytes, fmtLength } from "@/utils/shortcuts";

// Styles
import Styles from "./styles.module.scss";

const TopBar = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { videos, connected } = useLibraryStore();
  const ready = videos.filter((v) => v.status === "ready");
  const size = ready.reduce((a, v) => a + v.size, 0);
  const length = ready.reduce((a, v) => a + v.duration, 0);
  const { query, setQuery, toggleSidebar } = useUiStore();

  // the search filters the home grid, so searching from another page goes home
  const search = (e) => {
    e.preventDefault();
    if (pathname !== "/") router.push("/");
  };

  return (
    <header className={Styles.bar}>
      <div className={Styles.start}>
        <button type="button" className={Styles.iconButton} onClick={toggleSidebar} aria-label="Menu">
          <Icon name="menu" />
        </button>
        <Logo />
      </div>

      <form className={Styles.search} onSubmit={search} role="search">
        <input type="search" placeholder="Search your library" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Search" />
        <button aria-label="Search">
          <Icon name="search" size={22} />
        </button>
      </form>

      <div className={Styles.end}>
        {!!ready.length && (
          <span className={Styles.stats} title="Downloaded to your server">
            {ready.length} {ready.length === 1 ? "video" : "videos"} · {fmtBytes(size)} · {fmtLength(length)}
          </span>
        )}
        <span className={Styles.status} data-connected={connected} title={connected ? "Connected to your server" : "Reconnecting…"} />
        <AddVideoDialog />
      </div>
    </header>
  );
};

export default TopBar;
