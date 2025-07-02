// services/intentService.ts - Updated to use tweetnacl and proper route hashing

import { TradeIntent } from '../types/TradeIntent';
import { hashTradeIntent, hashRoute } from '../utils/hashUtils';
import { logger } from '../utils/logger';

/**
 * Generate a TradeIntent and its hash using tweetnacl
 * This ensures consistency with frontend hashing
 */
export async function generateIntent(
  route: any, 
  meta: any
): Promise<{ intent: TradeIntent; hash: string }> {
  try {
    logger.debug('Generating intent', { 
      routeInfo: {
        inputMint: route.inputMint,
        outputMint: route.outputMint,
        inAmount: route.inAmount,
        outAmount: route.outAmount
      },
      meta: {
        user: meta.user,
        amountIn: meta.amountIn,
        minOut: meta.minOut,
        expiry: meta.expiry,
        nonce: meta.nonce
      }
    });

    // Validate route consistency
    if (route.inputMint !== meta.tokenIn) {
      throw new Error(`Route inputMint (${route.inputMint}) doesn't match meta.tokenIn (${meta.tokenIn})`);
    }

    if (route.outputMint !== meta.tokenOut) {
      throw new Error(`Route outputMint (${route.outputMint}) doesn't match meta.tokenOut (${meta.tokenOut})`);
    }

    // Generate routeHash from the route data using tweetnacl
    const routeHash = hashRoute(route);
    
    // Create the TradeIntent object
    const tradeIntent: TradeIntent = {
      user: meta.user,
      tokenIn: meta.tokenIn,
      tokenOut: meta.tokenOut,
      amountIn: meta.amountIn,
      minOut: meta.minOut,
      expiry: meta.expiry,
      nonce: meta.nonce,
      routeHash: routeHash,
      relayerFee: meta.relayerFee,
      relayer: meta.relayer,
    };

    // Validate the TradeIntent fields
    validateTradeIntent(tradeIntent);

    // Generate the intent hash using tweetnacl
    const hash = hashTradeIntent(tradeIntent);

    logger.info('Intent generated successfully', { 
      intentHash: hash,
      routeHash,
      user: tradeIntent.user,
      tokenPair: `${tradeIntent.tokenIn} → ${tradeIntent.tokenOut}`,
      amount: tradeIntent.amountIn,
      expiry: new Date(tradeIntent.expiry * 1000).toISOString()
    });

    return { intent: tradeIntent, hash };

  } catch (error) {
    logger.error('Intent generation failed', { 
      error: error instanceof Error ? error.message : 'Unknown error',
      route: route ? {
        inputMint: route.inputMint,
        outputMint: route.outputMint,
        inAmount: route.inAmount
      } : null,
      meta
    });
    throw error;
  }
}

/**
 * Validate TradeIntent fields
 */
function validateTradeIntent(intent: TradeIntent): void {
  const errors: string[] = [];

  // Validate user address
  if (!intent.user || intent.user.length < 32) {
    errors.push('Invalid user address');
  }

  // Validate token addresses
  if (!intent.tokenIn || intent.tokenIn.length < 32) {
    errors.push('Invalid tokenIn address');
  }

  if (!intent.tokenOut || intent.tokenOut.length < 32) {
    errors.push('Invalid tokenOut address');
  }

  // Validate amounts
  if (!intent.amountIn || intent.amountIn <= 0) {
    errors.push('Invalid amountIn - must be positive');
  }

  if (!intent.minOut || intent.minOut <= 0) {
    errors.push('Invalid minOut - must be positive');
  }

  // Validate expiry
  const currentTime = Math.floor(Date.now() / 1000);
  if (!intent.expiry || intent.expiry <= currentTime) {
    errors.push(`Invalid expiry - must be in the future (current: ${currentTime}, provided: ${intent.expiry})`);
  }

  // Validate nonce
  if (intent.nonce < 0) {
    errors.push('Invalid nonce - must be non-negative');
  }

  // Validate relayer fee
  if (intent.relayerFee < 0) {
    errors.push('Invalid relayerFee - must be non-negative');
  }

  // Validate relayer address
  if (!intent.relayer || intent.relayer.length < 32) {
    errors.push('Invalid relayer address');
  }

  // Validate route hash
  if (!intent.routeHash || !/^[0-9a-fA-F]{64}$/.test(intent.routeHash)) {
    errors.push('Invalid routeHash format');
  }

  if (errors.length > 0) {
    throw new Error(`TradeIntent validation failed: ${errors.join(', ')}`);
  }
}

/**
 * Reconstruct intent from database record
 */
export function reconstructIntent(dbRecord: any): TradeIntent {
  return {
    user: dbRecord.user?.walletAddress || dbRecord.userId,
    tokenIn: dbRecord.tokenIn,
    tokenOut: dbRecord.tokenOut,
    amountIn: Number(dbRecord.amountIn),
    minOut: Number(dbRecord.minOut),
    expiry: Math.floor(dbRecord.expiry.getTime() / 1000), // Convert Date to Unix timestamp
    nonce: Number(dbRecord.nonce),
    routeHash: dbRecord.routeHash,
    relayerFee: Number(dbRecord.relayerFee),
    relayer: dbRecord.relayer,
  };
}

/**
 * Verify intent hash matches the intent data
 */
export function verifyIntentHash(intent: TradeIntent, expectedHash: string): boolean {
  try {
    const computedHash = hashTradeIntent(intent);
    const isValid = computedHash === expectedHash;
    
    if (!isValid) {
      logger.warn('Intent hash verification failed', {
        expectedHash,
        computedHash,
        intent: {
          user: intent.user,
          nonce: intent.nonce,
          tokenIn: intent.tokenIn,
          tokenOut: intent.tokenOut
        }
      });
    }

    return isValid;
  } catch (error) {
    logger.error('Intent hash verification error', {
      error: error instanceof Error ? error.message : 'Unknown error',
      expectedHash,
      intent
    });
    return false;
  }
}

/**
 * Check if intent is expired
 */
export function isIntentExpired(intent: TradeIntent): boolean {
  const currentTime = Math.floor(Date.now() / 1000);
  return intent.expiry <= currentTime;
}

/**
 * Calculate time remaining for intent
 */
export function getTimeRemaining(intent: TradeIntent): number {
  const currentTime = Math.floor(Date.now() / 1000);
  return Math.max(0, intent.expiry - currentTime);
}

/**
 * Format intent for API response
 */
export function formatIntentForResponse(intent: TradeIntent, hash: string) {
  return {
    intent,
    hash,
    metadata: {
      expiryDate: new Date(intent.expiry * 1000).toISOString(),
      timeRemainingSeconds: getTimeRemaining(intent),
      isExpired: isIntentExpired(intent),
      tokenPair: `${intent.tokenIn}→${intent.tokenOut}`,
      estimatedValue: intent.amountIn, // Could be enhanced with USD conversion
    }
  };
}