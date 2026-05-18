import { create } from 'zustand';

interface SidebarState {
  collapsed: boolean;

  toggleSidebar: () => void;
}

export const useSidebarStore = create<SidebarState>((set) => ({
  collapsed: false,

  toggleSidebar: () =>
    set((state) => ({
      collapsed: !state.collapsed,
    })),
}));
