import { create } from "zustand";

// Search text, the selected category and the sidebar toggle; shared by the top bar, sidebar and pages.
const useUiStore = create((set) => ({
  query: "",
  category: "",
  sidebarToggled: false,

  setQuery: (query) => set({ query }),
  setCategory: (category) => set({ category }),
  toggleSidebar: () => set((state) => ({ sidebarToggled: !state.sidebarToggled })),
  closeSidebar: () => set({ sidebarToggled: false }),
}));

export default useUiStore;
