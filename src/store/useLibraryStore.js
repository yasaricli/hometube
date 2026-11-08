import { create } from "zustand";

// Videos, channels and categories as the server last sent them, kept live by useLibrarySync.
const useLibraryStore = create((set) => ({
  videos: [],
  channels: [],
  categories: [],
  loaded: false,
  connected: false,

  setLibrary: ({ videos, channels, categories }) => set({ videos, channels, categories, loaded: true }),
  setConnected: (connected) => set({ connected }),

  // where playback was left in a video, saved by the player
  setPosition: (id, position) =>
    set((state) => ({
      videos: state.videos.map((v) => (v.id === id ? { ...v, position } : v)),
    })),

  // live download progress for one video: { stage, percent }
  setProgress: ({ id, stage, percent }) =>
    set((state) => ({
      videos: state.videos.map((v) => (v.id === id ? { ...v, progress: { stage, percent } } : v)),
    })),
}));

export default useLibraryStore;
