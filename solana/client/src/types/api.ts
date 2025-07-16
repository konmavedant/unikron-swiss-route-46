import { Token } from './tokens';
import { ChainType } from './chains';
import { SwapQuote, SwapConfig, SwapIntent } from './swap';

// API Base Types
export interface ApiResponse<T = any> {
  data: T;
  success: boolean;
  message?: string;
  timestamp: number;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Error Types
export interface ApiError {
  message: string;
  code?: string;
  details?: any;
  timestamp?: number;
}

export class ApiException extends Error {
  constructor(
    message: string,
    public code?: string,
    public status?: number,
    public details?: any
  ) {
    super(message);
    this.name = 'ApiException';
  }
}

// Token API Types
export interface TokenListResponse {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  logoURI: string;
  chainId?: number; // EVM only
  verified?: boolean;
  tags?: string[];
}

export interface TokenSearchRequest {
  query: string;
  chainType: ChainType;
  limit?: number;
  verified?: boolean;
}

export interface TokenPriceRequest {
  tokens: string[];
  chainType: ChainType;
  currency?: string;
}

export interface TokenPriceResponse {
  [tokenAddress: string]: {
    price: number;
    priceChange24h: number;
    volume24h: number;
    marketCap: number;
    lastUpdated: number;
  };
}

// Quote API Types
export interface QuoteRequest {
  inputToken: string;
  outputToken: string;
  inputAmount: string;
  slippage: number;
  user: string;
  config?: Partial<SwapConfig>;
}

export interface QuoteResponse {
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
  quoteId: string;
  validUntil: number;
}

// Swap API Types
export interface SwapRequest {
  inputToken: string;
  outputToken: string;
  inputAmount: string;
  minOutputAmount: string;
  slippage: number;
  user: string;
  deadline: number;
  quoteId?: string;
  signature?: string;
  config?: SwapConfig;
}

export interface SwapResponse {
  tx: string; // EVM: raw tx data; Solana: base64 tx
  intentId: string;
  status: string;
  estimatedConfirmation?: number;
}

export interface SwapStatusResponse {
  intentId: string;
  status: 'pending' | 'committed' | 'executed' | 'expired' | 'cancelled' | 'failed';
  txHash?: string;
  createdAt: number;
  executedAt?: number;
  failedAt?: number;
  error?: string;
  actualOutputAmount?: string;
  gasUsed?: string;
}

export interface SwapHistoryItem extends SwapStatusResponse {
  inputToken: Token;
  outputToken: Token;
  inputAmount: string;
  outputAmount: string;
  config: SwapConfig;
  chainType: ChainType;
}

export interface SwapHistoryRequest {
  user: string;
  chainType?: ChainType;
  status?: SwapIntent['status'];
  limit?: number;
  offset?: number;
  dateFrom?: number;
  dateTo?: number;
}

// Analytics API Types
export interface SwapAnalytics {
  totalVolume: string;
  totalTrades: number;
  uniqueUsers: number;
  topTokens: {
    token: Token;
    volume: string;
    trades: number;
  }[];
  priceImpactDistribution: {
    range: string;
    count: number;
  }[];
}

export interface UserAnalytics {
  totalTrades: number;
  totalVolume: string;
  averageTradeSize: string;
  favoriteTokens: Token[];
  tradingFrequency: {
    daily: number;
    weekly: number;
    monthly: number;
  };
}