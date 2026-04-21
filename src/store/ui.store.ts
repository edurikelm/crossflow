import { create } from "zustand";

interface UIState {
  sidebar: {
    isCollapsed: boolean;
  };
  theme: "light" | "dark" | "system";

  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setTheme: (theme: "light" | "dark" | "system") => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebar: {
    isCollapsed: false,
  },
  theme: "system",

  toggleSidebar: () =>
    set((state) => ({
      sidebar: {
        ...state.sidebar,
        isCollapsed: !state.sidebar.isCollapsed,
      },
    })),

  setSidebarCollapsed: (isCollapsed) =>
    set((state) => ({
      sidebar: { ...state.sidebar, isCollapsed },
    })),

  setTheme: (theme) => set({ theme }),
}));
