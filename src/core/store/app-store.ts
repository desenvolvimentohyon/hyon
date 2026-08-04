import { create } from 'zustand';
import { logger } from '@/core/logger/logger';

interface AppState {
  isSidebarOpen: boolean;
  theme: 'light' | 'dark' | 'system';
  toggleSidebar: () => void;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
}

export const useAppStore = create<AppState>((set) => ({
  isSidebarOpen: true,
  theme: (localStorage.getItem('theme') as any) || 'system',
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  setTheme: (theme) => {
    localStorage.setItem('theme', theme);
    set({ theme });
    logger.info(`Theme changed to ${theme}`);
  },
}));
