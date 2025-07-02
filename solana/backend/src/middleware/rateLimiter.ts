import { rateLimit } from 'express-rate-limit';
import { config } from '../config/env';

export const createRateLimiter = (options?: Partial<Parameters<typeof rateLimit>[0]>) => {
  return rateLimit({
    windowMs: config.rateLimit.windowMs,
    max: config.rateLimit.max,
    message: {
      error: 'Too many requests',
      details: 'Please try again later'
    },
    standardHeaders: true,
    legacyHeaders: false,
    ...options
  });
};

// Specific rate limiters for different endpoints
export const quoteRateLimit = createRateLimiter({
  max: 50, // 50 requests per 15 minutes for quotes
  message: {
    error: 'Too many quote requests',
    details: 'Please wait before requesting more quotes'
  }
});

export const commitRateLimit = createRateLimiter({
  max: 20, // 20 commits per 15 minutes
  message: {
    error: 'Too many commit requests',
    details: 'Please wait before committing more transactions'
  }
});