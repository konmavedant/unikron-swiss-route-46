import { Token } from './tokens';
import { ChainType } from './chains';

// Swap Quote Types
export interface SwapQuote {
  inputToken: Token;
  outputToken: Token;
  inputAmount: string;
  outputAmount: string;
  priceImpact: number;
  fee: string;
  route: string[];
  estimatedGas?: string; // EVM only
  slippage: number;
  minOutputAmount: string;
  quoteId?: string;
  validUntil?: number; // timestamp
}

// Enhanced swap quote with additional data
export interface SwapQuoteDetailed extends SwapQuote {
  exchangeRate: number;
  executionPrice: number;
  feeUSD?: number;
  gasUSD?: number; // EVM only
  totalCostUSD?: number;
  savings?: {
    amount: string;
    percentage: number;
    comparedTo: string[];
  };
  warnings?: string[];
}

// Swap Configuration
export interface SwapConfig {
  slippage: number;
  deadline: number; // minutes
  mevProtection: boolean;
  gasSpeed?: 'slow' | 'standard' | 'fast'; // EVM only
  priorityFee?: string; // Solana only
}

// Swap Intent/Transaction
export interface SwapIntent {
  intentId: string;
  status: 'pending' | 'committed' | 'executed' | 'expired' | 'cancelled' | 'failed';
  txHash?: string;
  createdAt: number;
  executedAt?: number;
  failedAt?: number;
  inputToken: Token;
  outputToken: Token;
  inputAmount: string;
  outputAmount: string;
  actualOutputAmount?: string;
  config: SwapConfig;
  chainType: ChainType;
  user: string;
  error?: string;
}

// Swap State Management
export interface SwapState {
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
}

// Swap History
export interface SwapHistoryItem extends SwapIntent {
  priceImpactActual?: number;
  gasUsed?: string;
  gasCost?: string;
  totalCost?: string;
}

export interface SwapHistoryFilters {
  chainType?: ChainType;
  status?: SwapIntent['status'];
  tokenSymbol?: string;
  dateFrom?: Date;
  dateTo?: Date;
  minAmount?: number;
  maxAmount?: number;
}

// Route Information
export interface SwapRoute {
  protocol: string;
  percentage: number;
  poolAddress?: string;
  poolFee?: number;
}

export interface DetailedRoute {
  routes: SwapRoute[];
  gasEstimate?: string;
  confidence: number;
  expectedSlippage: number;
}