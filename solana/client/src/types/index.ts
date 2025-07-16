// Re-export all type modules for easy importing
export * from './chains';
export * from './tokens';
export * from './wallet';
export * from './swap';
export * from './ui';
export * from './constants';
// Re-export API types but resolve naming conflicts
export type { 
  ApiResponse, 
  PaginatedResponse, 
  ApiError, 
  TokenListResponse,
  TokenSearchRequest,
  TokenPriceRequest,
  TokenPriceResponse,
  QuoteRequest,
  QuoteResponse,
  SwapRequest,
  SwapResponse,
  SwapStatusResponse,
  SwapHistoryRequest,
  SwapAnalytics,
  UserAnalytics
} from './api';
export { ApiException } from './api';
// Rename the conflicting type
export type { SwapHistoryItem as ApiSwapHistoryItem } from './api';

// Legacy types for backward compatibility (will be removed in next version)
/** @deprecated Use Token from './tokens' instead */
export interface LegacyToken {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  logoURI: string;
  chainId?: number;
  balance?: string;
}

/** @deprecated Use SwapQuote from './swap' instead */
export interface LegacySwapQuote {
  inputToken: LegacyToken;
  outputToken: LegacyToken;
  inputAmount: string;
  outputAmount: string;
  priceImpact: number;
  fee: string;
  route: string[];
  estimatedGas?: string;
  slippage: number;
  minOutputAmount: string;
}

/** @deprecated Use SwapIntent from './swap' instead */
export interface Intent {
  intentId: string;
  status: 'pending' | 'committed' | 'executed' | 'expired' | 'cancelled';
  txHash?: string;
  createdAt: number;
  executedAt?: number;
  inputToken: LegacyToken;
  outputToken: LegacyToken;
  inputAmount: string;
  outputAmount: string;
}

/** @deprecated Use WalletState from './wallet' instead */
export interface LegacyWalletState {
  address: string | null;
  chainType: 'evm' | 'solana' | null;
  chainId?: number;
  isConnected: boolean;
  isConnecting: boolean;
}

/** @deprecated Use SwapState from './swap' instead */
export interface LegacySwapState {
  inputToken: LegacyToken | null;
  outputToken: LegacyToken | null;
  inputAmount: string;
  outputAmount: string;
  quote: LegacySwapQuote | null;
  isLoadingQuote: boolean;
  isSwapping: boolean;
  slippage: number;
}