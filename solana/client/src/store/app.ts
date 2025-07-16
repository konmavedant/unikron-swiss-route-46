import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { ChainType } from '@/types';

// Global app preferences and settings
interface AppSettings {
  theme: 'light' | 'dark' | 'system';
  slippageTolerance: number;
  deadline: number;
  mevProtectionDefault: boolean;
  gasSpeed: 'slow' | 'standard' | 'fast';
  showTestTokens: boolean;
  currency: 'USD' | 'EUR' | 'GBP';
  soundEnabled: boolean;
  animationsEnabled: boolean;
  compactMode: boolean;
  hasCompletedOnboarding: boolean;
}

// UI state for better UX
interface UIState {
  isLoading: boolean;
  loadingMessage: string;
  toasts: Array<{
    id: string;
    title: string;
    description?: string;
    variant?: 'default' | 'destructive';
    duration?: number;
  }>;
  modals: {
    settingsOpen: boolean;
    historyOpen: boolean;
    aboutOpen: boolean;
  };
  animations: {
    swapFormVisible: boolean;
    previewVisible: boolean;
    commitRevealVisible: boolean;
  };
}

// Network and connectivity state
interface NetworkState {
  isOnline: boolean;
  latency: number;
  lastApiCall: number;
  apiHealth: 'healthy' | 'degraded' | 'down';
  retryCount: number;
}

// Combined app store
interface AppStore {
  // Settings
  settings: AppSettings;
  updateSettings: (settings: Partial<AppSettings>) => void;
  resetSettings: () => void;
  
  // UI State
  ui: UIState;
  setLoading: (loading: boolean, message?: string) => void;
  addToast: (toast: Omit<UIState['toasts'][0], 'id'>) => void;
  removeToast: (id: string) => void;
  toggleModal: (modal: keyof UIState['modals']) => void;
  setAnimationVisible: (animation: keyof UIState['animations'], visible: boolean) => void;
  
  // Network State
  network: NetworkState;
  updateNetworkState: (state: Partial<NetworkState>) => void;
  
  // Session Management
  lastActiveChain: ChainType | null;
  sessionStartTime: number;
  setLastActiveChain: (chain: ChainType) => void;
  resetSession: () => void;
  
  // User Preferences
  favoriteTokens: string[];
  addFavoriteToken: (address: string) => void;
  removeFavoriteToken: (address: string) => void;
  
  // Analytics/Usage tracking (privacy-friendly)
  usageStats: {
    swapsCompleted: number;
    chainsUsed: ChainType[];
    lastSwapTime: number;
  };
  incrementSwapCount: () => void;
  recordChainUsage: (chain: ChainType) => void;
}

const DEFAULT_SETTINGS: AppSettings = {
  theme: 'dark',
  slippageTolerance: 0.5,
  deadline: 20,
  mevProtectionDefault: true,
  gasSpeed: 'standard',
  showTestTokens: false,
  currency: 'USD',
  soundEnabled: true,
  animationsEnabled: true,
  compactMode: false,
  hasCompletedOnboarding: false,
};

const DEFAULT_UI_STATE: UIState = {
  isLoading: false,
  loadingMessage: '',
  toasts: [],
  modals: {
    settingsOpen: false,
    historyOpen: false,
    aboutOpen: false,
  },
  animations: {
    swapFormVisible: true,
    previewVisible: false,
    commitRevealVisible: false,
  },
};

const DEFAULT_NETWORK_STATE: NetworkState = {
  isOnline: navigator.onLine,
  latency: 0,
  lastApiCall: 0,
  apiHealth: 'healthy',
  retryCount: 0,
};

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      // Settings
      settings: DEFAULT_SETTINGS,
      updateSettings: (newSettings) =>
        set((state) => ({
          settings: { ...state.settings, ...newSettings },
        })),
      resetSettings: () =>
        set({ settings: DEFAULT_SETTINGS }),

      // UI State
      ui: DEFAULT_UI_STATE,
      setLoading: (loading, message = '') =>
        set((state) => ({
          ui: { ...state.ui, isLoading: loading, loadingMessage: message },
        })),
      
      addToast: (toast) =>
        set((state) => ({
          ui: {
            ...state.ui,
            toasts: [
              ...state.ui.toasts,
              { ...toast, id: Date.now().toString() + Math.random() },
            ],
          },
        })),
      
      removeToast: (id) =>
        set((state) => ({
          ui: {
            ...state.ui,
            toasts: state.ui.toasts.filter((toast) => toast.id !== id),
          },
        })),
      
      toggleModal: (modal) =>
        set((state) => ({
          ui: {
            ...state.ui,
            modals: {
              ...state.ui.modals,
              [modal]: !state.ui.modals[modal],
            },
          },
        })),
      
      setAnimationVisible: (animation, visible) =>
        set((state) => ({
          ui: {
            ...state.ui,
            animations: {
              ...state.ui.animations,
              [animation]: visible,
            },
          },
        })),

      // Network State
      network: DEFAULT_NETWORK_STATE,
      updateNetworkState: (networkState) =>
        set((state) => ({
          network: { ...state.network, ...networkState },
        })),

      // Session Management
      lastActiveChain: null,
      sessionStartTime: Date.now(),
      setLastActiveChain: (chain) =>
        set({ lastActiveChain: chain }),
      resetSession: () =>
        set({ sessionStartTime: Date.now() }),

      // User Preferences
      favoriteTokens: [],
      addFavoriteToken: (address) =>
        set((state) => ({
          favoriteTokens: [...new Set([...state.favoriteTokens, address])],
        })),
      removeFavoriteToken: (address) =>
        set((state) => ({
          favoriteTokens: state.favoriteTokens.filter((addr) => addr !== address),
        })),

      // Usage Stats
      usageStats: {
        swapsCompleted: 0,
        chainsUsed: [],
        lastSwapTime: 0,
      },
      incrementSwapCount: () =>
        set((state) => ({
          usageStats: {
            ...state.usageStats,
            swapsCompleted: state.usageStats.swapsCompleted + 1,
            lastSwapTime: Date.now(),
          },
        })),
      recordChainUsage: (chain) =>
        set((state) => ({
          usageStats: {
            ...state.usageStats,
            chainsUsed: [...new Set([...state.usageStats.chainsUsed, chain])],
          },
        })),
    }),
    {
      name: 'unikron-app-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        settings: state.settings,
        lastActiveChain: state.lastActiveChain,
        favoriteTokens: state.favoriteTokens,
        usageStats: state.usageStats,
      }),
    }
  )
);

// Network monitoring hook
export const useNetworkMonitor = () => {
  const { network, updateNetworkState } = useAppStore();

  // Monitor online/offline status
  if (typeof window !== 'undefined') {
    window.addEventListener('online', () => {
      updateNetworkState({ isOnline: true });
    });

    window.addEventListener('offline', () => {
      updateNetworkState({ isOnline: false });
    });
  }

  return {
    isOnline: network.isOnline,
    apiHealth: network.apiHealth,
    latency: network.latency,
  };
};