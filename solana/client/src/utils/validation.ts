import { z } from 'zod';
import { APP_CONFIG } from '@/constants/app';
import { ErrorType, AppError, ErrorSeverity } from '@/types/errors';

// Sanitization functions
export const sanitizeInput = (input: string): string => {
  return input.trim().replace(/[<>\"'&]/g, '');
};

export const sanitizeAmount = (amount: string): string => {
  // Remove any non-numeric characters except decimal point
  return amount.replace(/[^0-9.]/g, '');
};

// Validation schemas
export const amountSchema = z.string()
  .min(1, 'Amount is required')
  .max(APP_CONFIG.MAX_INPUT_LENGTH, 'Amount too long')
  .refine((val) => {
    const num = parseFloat(val);
    return !isNaN(num) && num > 0;
  }, 'Must be a valid positive number')
  .refine((val) => {
    const num = parseFloat(val);
    return num >= APP_CONFIG.MIN_SWAP_AMOUNT;
  }, `Minimum amount is ${APP_CONFIG.MIN_SWAP_AMOUNT}`)
  .refine((val) => {
    const decimalPlaces = val.split('.')[1]?.length || 0;
    return decimalPlaces <= APP_CONFIG.MAX_DECIMAL_PLACES;
  }, `Maximum ${APP_CONFIG.MAX_DECIMAL_PLACES} decimal places allowed`);

export const slippageSchema = z.number()
  .min(APP_CONFIG.MIN_SLIPPAGE, `Minimum slippage is ${APP_CONFIG.MIN_SLIPPAGE}%`)
  .max(APP_CONFIG.MAX_SLIPPAGE, `Maximum slippage is ${APP_CONFIG.MAX_SLIPPAGE}%`);

export const addressSchema = z.string()
  .min(1, 'Address is required')
  .max(100, 'Address too long')
  .refine((val) => {
    // Basic validation for EVM and Solana addresses
    return /^(0x[a-fA-F0-9]{40}|[1-9A-HJ-NP-Za-km-z]{32,44})$/.test(val);
  }, 'Invalid wallet address format');

// Validation functions
export const validateAmount = (amount: string): void => {
  try {
    const sanitized = sanitizeAmount(amount);
    amountSchema.parse(sanitized);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new AppError({
        type: ErrorType.VALIDATION_ERROR,
        severity: ErrorSeverity.MEDIUM,
        message: error.errors[0].message,
        retry: false,
      });
    }
    throw error;
  }
};

export const validateSlippage = (slippage: number): void => {
  try {
    slippageSchema.parse(slippage);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new AppError({
        type: ErrorType.VALIDATION_ERROR,
        severity: ErrorSeverity.MEDIUM,
        message: error.errors[0].message,
        retry: false,
      });
    }
    throw error;
  }
};

export const validateAddress = (address: string): void => {
  try {
    const sanitized = sanitizeInput(address);
    addressSchema.parse(sanitized);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new AppError({
        type: ErrorType.VALIDATION_ERROR,
        severity: ErrorSeverity.MEDIUM,
        message: error.errors[0].message,
        retry: false,
      });
    }
    throw error;
  }
};

// Rate limiting utilities
class RateLimiter {
  private requests: Map<string, number[]> = new Map();

  isRateLimited(key: string): boolean {
    const now = Date.now();
    const windowStart = now - APP_CONFIG.RATE_LIMIT_WINDOW;
    
    const userRequests = this.requests.get(key) || [];
    const validRequests = userRequests.filter(time => time > windowStart);
    
    this.requests.set(key, validRequests);
    
    return validRequests.length >= APP_CONFIG.RATE_LIMIT_REQUESTS;
  }

  addRequest(key: string): void {
    const now = Date.now();
    const userRequests = this.requests.get(key) || [];
    userRequests.push(now);
    this.requests.set(key, userRequests);
  }
}

export const rateLimiter = new RateLimiter();