import { useEffect, useState } from "react";

// Utils
import { getSocket } from "@/utils/socket";

// The download settings, kept in sync with the server; save() sends a change right away.
const useSettings = () => {
  const [settings, setSettings] = useState();
  const [status, setStatus] = useState("");

  useEffect(() => {
    const socket = getSocket();
    const load = () => socket.emit("settings", setSettings);
    load();
    socket.on("connect", load);
    socket.on("settings", setSettings);
    return () => {
      socket.off("connect", load);
      socket.off("settings", setSettings);
    };
  }, []);

  const save = (change) => {
    const next = { ...settings, ...change };
    setSettings(next);
    setStatus("Saving…");
    getSocket().emit("settings:save", next, (res) => {
      if (res.error) return setStatus(res.error);
      setSettings(res);
      setStatus("Saved");
    });
  };

  return { settings, status, save };
};

export default useSettings;
