import { PublicKey } from '@solana/web3.js';

export class ValidationUtils {
  static isValidPublicKey(key: string): boolean {
    try {
      new PublicKey(key);
      return true;
    } catch {
      return false;
    }
  }

  static isValidHash(hash: string): boolean {
    return /^[0-9a-fA-F]{64}$/.test(hash);
  }

  static isValidSignature(signature: string): boolean {
    return /^[0-9a-fA-F]{128}$/.test(signature);
  }

  static isValidAmount(amount: number): boolean {
    return amount > 0 && Number.isInteger(amount) && amount <= Number.MAX_SAFE_INTEGER;
  }

  static isValidExpiry(expiry: number): boolean {
    const now = Math.floor(Date.now() / 1000);
    const maxExpiry = now + (24 * 60 * 60); // 24 hours from now
    return expiry > now && expiry <= maxExpiry;
  }

  static sanitizeAmount(amount: any): number {
    const num = Number(amount);
    if (!this.isValidAmount(num)) {
      throw new Error('Invalid amount: must be a positive integer');
    }
    return num;
  }
}