import { RetryConfig } from '@/types/errors';

export const APP_CONFIG = {
  // API Configuration
  API_TIMEOUT: 30000, // 30 seconds
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000, // 1 second base delay
  
  // Performance Configuration
  DEBOUNCE_DELAY: 500,
  QUOTE_REFRESH_INTERVAL: 15000, // 15 seconds
  VIRTUAL_LIST_ITEM_HEIGHT: 80,
  VIRTUAL_LIST_OVERSCAN: 5,
  
  // Security Configuration
  MAX_INPUT_LENGTH: 100,
  MAX_DECIMAL_PLACES: 18,
  RATE_LIMIT_REQUESTS: 10,
  RATE_LIMIT_WINDOW: 60000, // 1 minute
  
  // Validation Rules
  MIN_SWAP_AMOUNT: 0.000001,
  MAX_SLIPPAGE: 50, // 50%
  MIN_SLIPPAGE: 0.1, // 0.1%
  
  // Monitoring
  ERROR_REPORT_THRESHOLD: ErrorSeverity.MEDIUM,
  PERFORMANCE_SAMPLE_RATE: 0.1, // 10% sampling
} as const;

export const RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  backoffMultiplier: 2,
};

export const SUPPORTED_NETWORKS = {
  EVM: ['ethereum', 'polygon', 'bsc', 'arbitrum'],
  SOLANA: ['mainnet-beta', 'devnet'],
} as const;

export const ERROR_MESSAGES = {
  NETWORK_UNAVAILABLE: 'Network is currently unavailable. Please try again.',
  WALLET_NOT_CONNECTED: 'Please connect your wallet to continue.',
  INSUFFICIENT_BALANCE: 'Insufficient balance for this transaction.',
  INVALID_AMOUNT: 'Please enter a valid amount.',
  SLIPPAGE_TOO_HIGH: 'Slippage tolerance is too high.',
  RATE_LIMITED: 'Too many requests. Please wait a moment.',
  TRANSACTION_FAILED: 'Transaction failed. Please try again.',
  QUOTE_EXPIRED: 'Quote has expired. Getting a new quote...',
} as const;

import { ErrorSeverity } from '@/types/errors';