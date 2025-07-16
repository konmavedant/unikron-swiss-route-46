export enum ErrorType {
  NETWORK_ERROR = 'NETWORK_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  WALLET_ERROR = 'WALLET_ERROR',
  API_ERROR = 'API_ERROR',
  RATE_LIMIT_ERROR = 'RATE_LIMIT_ERROR',
  INSUFFICIENT_BALANCE = 'INSUFFICIENT_BALANCE',
  TRANSACTION_FAILED = 'TRANSACTION_FAILED',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export interface ErrorDetails {
  type: ErrorType;
  severity: ErrorSeverity;
  message: string;
  code?: string;
  retry?: boolean;
  maxRetries?: number;
  timestamp: number;
  metadata?: Record<string, any>;
}

export interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
}

export class AppError extends Error {
  public readonly type: ErrorType;
  public readonly severity: ErrorSeverity;
  public readonly code?: string;
  public readonly retry: boolean;
  public readonly timestamp: number;
  public readonly metadata?: Record<string, any>;

  constructor(details: Partial<ErrorDetails> & { message: string }) {
    super(details.message);
    this.name = 'AppError';
    this.type = details.type || ErrorType.UNKNOWN_ERROR;
    this.severity = details.severity || ErrorSeverity.MEDIUM;
    this.code = details.code;
    this.retry = details.retry ?? true;
    this.timestamp = details.timestamp || Date.now();
    this.metadata = details.metadata;
  }
}

export const isRetryableError = (error: unknown): boolean => {
  if (error instanceof AppError) {
    return error.retry;
  }
  
  // Network errors are generally retryable
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return message.includes('network') || 
           message.includes('timeout') || 
           message.includes('connection') ||
           message.includes('fetch');
  }
  
  return false;
};