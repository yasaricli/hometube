"use client";

// Components
import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";

// Hooks
import useLibrarySync from "@/hooks/useLibrarySync";

// Store
import useUiStore from "@/store/useUiStore";

// Styles
import Styles from "./styles.module.scss";

// Top bar, sidebar and the page; also keeps the library in sync with the server.
// theater: the page runs edge to edge and the sidebar only opens as an overlay, like a cinema view.
const AppShell = ({ children, theater }) => {
  useLibrarySync();
  const sidebarToggled = useUiStore((state) => state.sidebarToggled);

  return (
    <div className={Styles.shell} data-toggled={sidebarToggled} data-theater={!!theater}>
      <TopBar />
      <Sidebar overlay={theater} />
      <main className={Styles.main}>{children}</main>
    </div>
  );
};

export default AppShell;
