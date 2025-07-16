import { create } from 'zustand';
import { Token, SwapQuote, SwapConfig, ChainType } from '@/types';

// Updated to use new SwapConfig type
const DEFAULT_CONFIG: SwapConfig = {
  slippage: 0.5,
  deadline: 20,
  mevProtection: true,
};

interface SwapStore {
  // State
  chainType: ChainType;
  inputToken: Token | null;
  outputToken: Token | null;
  inputAmount: string;
  outputAmount: string;
  quote: SwapQuote | null;
  config: SwapConfig;
  isLoadingQuote: boolean;
  isSwapping: boolean;
  activeIntentId: string | null;
  error: string | null;
  // Actions
  setChainType: (chainType: ChainType) => void;
  setInputToken: (token: Token | null) => void;
  setOutputToken: (token: Token | null) => void;
  setInputAmount: (amount: string) => void;
  setOutputAmount: (amount: string) => void;
  setQuote: (quote: SwapQuote | null) => void;
  setLoadingQuote: (loading: boolean) => void;
  setSwapping: (swapping: boolean) => void;
  setConfig: (config: Partial<SwapConfig>) => void;
  setError: (error: string | null) => void;
  swapTokens: () => void;
  resetSwap: () => void;
  setActiveIntentId: (intentId: string | null) => void;
}

export const useSwapStore = create<SwapStore>((set, get) => ({
  // Initial state
  chainType: 'evm',
  inputToken: null,
  outputToken: null,
  inputAmount: '',
  outputAmount: '',
  quote: null,
  config: DEFAULT_CONFIG,
  isLoadingQuote: false,
  isSwapping: false,
  activeIntentId: null,
  error: null,

  // Actions
  setChainType: (chainType) => 
    set({ chainType, inputToken: null, outputToken: null, quote: null, error: null }),

  setInputToken: (token) => 
    set({ inputToken: token, quote: null, error: null }),

  setOutputToken: (token) => 
    set({ outputToken: token, quote: null, error: null }),

  setInputAmount: (amount) => 
    set({ inputAmount: amount, quote: null, error: null }),

  setOutputAmount: (amount) => 
    set({ outputAmount: amount }),

  setQuote: (quote) => {
    set({ 
      quote,
      outputAmount: quote?.outputAmount || '',
      error: null,
    });
  },

  setLoadingQuote: (isLoadingQuote) => 
    set({ isLoadingQuote }),

  setSwapping: (isSwapping) => 
    set({ isSwapping }),

  setConfig: (configUpdate) => 
    set((state) => ({ 
      config: { ...state.config, ...configUpdate },
      quote: null, // Reset quote when config changes
      error: null,
    })),

  setError: (error) => 
    set({ error }),

  setActiveIntentId: (activeIntentId) => 
    set({ activeIntentId }),

  swapTokens: () => {
    const { inputToken, outputToken, inputAmount, outputAmount } = get();
    set({
      inputToken: outputToken,
      outputToken: inputToken,
      inputAmount: outputAmount,
      outputAmount: inputAmount,
      quote: null,
      error: null,
    });
  },

  resetSwap: () => 
    set({
      inputToken: null,
      outputToken: null,
      inputAmount: '',
      outputAmount: '',
      quote: null,
      isLoadingQuote: false,
      isSwapping: false,
      activeIntentId: null,
      error: null,
      config: DEFAULT_CONFIG,
    }),
}));