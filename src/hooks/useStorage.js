import { useEffect, useState } from "react";

// Store
import useLibraryStore from "@/store/useLibraryStore";

// Utils
import { getSocket } from "@/utils/socket";

// Disk use per channel and what the next cleanup would delete, read again whenever the library
// or the cleanup rules change. cleanNow() runs the cleanup right away.
const useStorage = (rules) => {
  const videos = useLibraryStore((state) => state.videos);
  const [storage, setStorage] = useState();
  const [cleaning, setCleaning] = useState(false);

  useEffect(() => {
    getSocket().emit("storage", setStorage);
  }, [videos, rules?.deleteWatchedDays, rules?.keepPerChannel]);

  const cleanNow = () => {
    setCleaning(true);
    getSocket().emit("storage:cleanup", () => {
      setCleaning(false);
      getSocket().emit("storage", setStorage);
    });
  };

  return { storage, cleaning, cleanNow };
};

export default useStorage;
