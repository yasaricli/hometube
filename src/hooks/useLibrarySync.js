import { useEffect } from "react";

// Store
import useLibraryStore from "@/store/useLibraryStore";

// Utils
import { getSocket } from "@/utils/socket";

let bound = false;

// Wires the socket into useLibraryStore once per page load; later calls do nothing.
const bind = () => {
  if (bound) return;
  bound = true;

  const socket = getSocket();
  const { setLibrary, setConnected, setProgress } = useLibraryStore.getState();
  const load = () => {
    setConnected(true);
    socket.emit("library", setLibrary);
  };

  if (socket.connected) load();
  socket.on("connect", load);
  socket.on("disconnect", () => setConnected(false));
  socket.on("library", setLibrary);
  socket.on("video:progress", setProgress);
};

const useLibrarySync = () => {
  useEffect(bind, []);
};

export default useLibrarySync;
