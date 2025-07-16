import { Token } from './tokens';
import { SwapQuote, SwapConfig } from './swap';
import { ChainType } from './chains';

// Component Prop Types
export interface TokenSelectorProps {
  selectedToken?: Token;
  onTokenSelect: (token: Token) => void;
  tokens: Token[];
  label?: string;
  disabled?: boolean;
  chainType: ChainType;
  showBalance?: boolean;
  showPrice?: boolean;
  placeholder?: string;
}

export interface SwapFormProps {
  chainType: ChainType;
  tokens: Token[];
  onSwap?: (quote: SwapQuote) => void;
  isConnected?: boolean;
  defaultConfig?: Partial<SwapConfig>;
}

export interface SwapQuoteDisplayProps {
  quote: SwapQuote | null;
  isLoading: boolean;
  mevProtection: boolean;
  showDetails?: boolean;
  onConfigChange?: (config: Partial<SwapConfig>) => void;
}

export interface ChainSelectorProps {
  selectedChain: ChainType;
  onChainSelect: (chain: ChainType) => void;
  disabled?: boolean;
  showTestnets?: boolean;
}

export interface WalletModalProps {
  open: boolean;
  onClose: () => void;
  onConnect?: (address: string, chainType: ChainType) => void;
  preferredChainType?: ChainType;
}

export interface WalletInfoProps {
  address: string;
  chainType: ChainType;
  chainId?: number;
  balance?: string;
  onDisconnect: () => void;
  showBalance?: boolean;
  showActions?: boolean;
}

// Form Types
export interface SwapFormData {
  inputToken: Token | null;
  outputToken: Token | null;
  inputAmount: string;
  config: SwapConfig;
}

export interface SwapFormErrors {
  inputToken?: string;
  outputToken?: string;
  inputAmount?: string;
  balance?: string;
  quote?: string;
  general?: string;
}

// Settings Types
export interface UserSettings {
  defaultSlippage: number;
  defaultDeadline: number;
  mevProtectionEnabled: boolean;
  preferredChainType: ChainType;
  theme: 'light' | 'dark' | 'system';
  currency: 'USD' | 'EUR' | 'GBP';
  gasSettings: {
    evm: 'slow' | 'standard' | 'fast';
    solana: number; // priority fee
  };
}

// Loading and State Types
export interface LoadingState {
  isLoading: boolean;
  message?: string;
  progress?: number;
}

export interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  lastUpdated?: number;
}

// Event Types
export interface SwapEvent {
  type: 'swap_initiated' | 'swap_completed' | 'swap_failed' | 'quote_updated';
  payload: any;
  timestamp: number;
}

export interface WalletEvent {
  type: 'wallet_connected' | 'wallet_disconnected' | 'chain_changed' | 'account_changed';
  payload: any;
  timestamp: number;
}

// Utility Types
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

// Status Types
export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'reconnecting' | 'error';
export type TransactionStatus = 'idle' | 'pending' | 'success' | 'error';
export type QuoteStatus = 'idle' | 'loading' | 'success' | 'error' | 'stale';