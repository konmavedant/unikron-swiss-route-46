
import { clusterApiUrl, Connection } from '@solana/web3.js';

export const SOLANA_NETWORK = 'devnet';
export const SOLANA_RPC_URL = clusterApiUrl(SOLANA_NETWORK);

export const solanaConnection = new Connection(SOLANA_RPC_URL, 'confirmed');

export const SOLANA_CONFIG = {
  network: SOLANA_NETWORK,
  rpcUrl: SOLANA_RPC_URL,
  commitment: 'confirmed' as const,
};

// Common Solana token addresses on devnet
export const SOLANA_TOKENS = {
  SOL: {
    address: 'So11111111111111111111111111111111111111112', // Wrapped SOL
    symbol: 'SOL',
    name: 'Solana',
    decimals: 9,
  },
  USDC: {
    address: '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU', // USDC on devnet
    symbol: 'USDC',
    name: 'USD Coin',
    decimals: 6,
  },
};
