// utils/hashUtils.ts - Fixed to use tweetnacl as specified in requirements

import nacl from 'tweetnacl';
import { encodeBase64, decodeUTF8 } from 'tweetnacl-util';
import { TradeIntent } from '../types/TradeIntent';

/**
 * Hash a TradeIntent using tweetnacl (as specified in requirements)
 * This ensures consistency between frontend and backend hashing
 */
export function hashTradeIntent(intent: TradeIntent): string {
  try {
    // Create a deterministic string representation
    const intentString = [
      intent.user,
      intent.tokenIn,
      intent.tokenOut,
      intent.amountIn.toString(),
      intent.minOut.toString(),
      intent.expiry.toString(),
      intent.nonce.toString(),
      intent.routeHash,
      intent.relayerFee.toString(),
      intent.relayer
    ].join('|');

    // Convert to Uint8Array for hashing
    const data = decodeUTF8(intentString);
    
    // Hash using nacl
    const hash = nacl.hash(data);
    
    // Return as hex string (first 32 bytes for 256-bit hash)
    return Buffer.from(hash.slice(0, 32)).toString('hex');
  } catch (error) {
    throw new Error(`Failed to hash trade intent: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Hash arbitrary data using tweetnacl
 */
export function hashData(data: string): string {
  try {
    const dataBytes = decodeUTF8(data);
    const hash = nacl.hash(dataBytes);
    return Buffer.from(hash.slice(0, 32)).toString('hex');
  } catch (error) {
    throw new Error(`Failed to hash data: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Hash route data for routeHash field
 */
export function hashRoute(route: any): string {
  try {
    // Create deterministic route representation
    const routeData = {
      inputMint: route.inputMint,
      outputMint: route.outputMint,
      inAmount: route.inAmount,
      outAmount: route.outAmount,
      swapMode: route.swapMode,
      routePlan: route.routePlan
    };
    
    return hashData(JSON.stringify(routeData));
  } catch (error) {
    throw new Error(`Failed to hash route: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Verify if a hash matches the expected format (64 hex characters)
 */
export function isValidHash(hash: string): boolean {
  return /^[0-9a-fA-F]{64}$/.test(hash);
}

/**
 * Generate a secure random nonce
 */
export function generateNonce(): number {
  const randomBytes = nacl.randomBytes(8);
  // Convert to number (using first 6 bytes to stay within safe integer range)
  let nonce = 0;
  for (let i = 0; i < 6; i++) {
    nonce = nonce * 256 + randomBytes[i];
  }
  return nonce;
}

/**
 * Sign data using tweetnacl (if keypair is provided)
 */
export function signData(data: string, secretKey: Uint8Array): string {
  try {
    const dataBytes = decodeUTF8(data);
    const signature = nacl.sign.detached(dataBytes, secretKey);
    return Buffer.from(signature).toString('hex');
  } catch (error) {
    throw new Error(`Failed to sign data: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Verify signature using tweetnacl
 */
export function verifySignature(data: string, signature: string, publicKey: Uint8Array): boolean {
  try {
    const dataBytes = decodeUTF8(data);
    const signatureBytes = Buffer.from(signature, 'hex');
    return nacl.sign.detached.verify(dataBytes, signatureBytes, publicKey);
  } catch (error) {
    console.error('Signature verification failed:', error);
    return false;
  }
}