// src/constants/devnetTokens.ts (Updated)
import { Token } from '@/types';

// Updated tokens available on Solana Devnet for testing
// These are either wrapped tokens or devnet-specific versions
export const DEVNET_TOKENS: Token[] = [
  {
    address: 'So11111111111111111111111111111111111111112', // Wrapped SOL
    symbol: 'SOL',
    name: 'Solana',
    decimals: 9,
    logoURI: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png',
    verified: true,
    tags: ['native']
  },
  {
    address: '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU', // USDC on devnet
    symbol: 'USDC',
    name: 'USD Coin (Devnet)',
    decimals: 6,
    logoURI: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png',
    verified: true,
    tags: ['stablecoin']
  },
  // Add some mock tokens for testing if real devnet tokens aren't available
  {
    address: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // Mainnet USDC (for fallback)
    symbol: 'USDC',
    name: 'USD Coin',
    decimals: 6,
    logoURI: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png',
    verified: true,
    tags: ['stablecoin']
  }
];

// Jupiter-compatible tokens for devnet
export const JUPITER_DEVNET_TOKENS: Token[] = [
  {
    address: 'So11111111111111111111111111111111111111112',
    symbol: 'SOL',
    name: 'Solana',
    decimals: 9,
    logoURI: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png',
    verified: true,
    tags: ['native']
  },
  // Note: Most tokens on Jupiter are mainnet-only
  // For devnet testing, we'll use SOL swaps primarily
];

// Helper function to get devnet tokens
export const getDevnetTokens = (): Token[] => {
  // For now, return just SOL since most other tokens aren't available on devnet Jupiter
  return [DEVNET_TOKENS[0]]; // Just SOL
};

// Helper function to check if we're on devnet
export const isDevnet = (): boolean => {
  return import.meta.env.MODE === 'development' || 
         import.meta.env.VITE_ENVIRONMENT === 'development' ||
         window.location.hostname === 'localhost' ||
         window.location.hostname.includes('dev');
};

// Helper function to get appropriate token list
export const getTokenList = async (chainType: 'evm' | 'solana'): Promise<Token[]> => {
  if (chainType === 'solana' && isDevnet()) {
    // Try to get Jupiter tokens first, fallback to our devnet list
    try {
      const response = await fetch('https://token.jup.ag/all');
      if (response.ok) {
        const allTokens = await response.json();
        
        // Filter for tokens that might work on devnet
        const devnetCompatible = allTokens.filter((token: any) => {
          // Include native SOL and popular tokens that might have devnet versions
          const compatibleSymbols = ['SOL', 'USDC', 'USDT'];
          return compatibleSymbols.includes(token.symbol);
        }).map((token: any) => ({
          address: token.address,
          symbol: token.symbol,
          name: token.name,
          decimals: token.decimals,
          logoURI: token.logoURI || '',
          verified: token.verified || false,
          tags: token.tags || []
        }));

        console.log('Jupiter devnet-compatible tokens:', devnetCompatible);
        return devnetCompatible.length > 0 ? devnetCompatible : getDevnetTokens();
      }
    } catch (error) {
      console.warn('Failed to fetch Jupiter tokens, using devnet fallback:', error);
    }
    
    return getDevnetTokens();
  }
  
  // For production or EVM, use the regular token fetching logic
  return [];
};

// Create a simple swap pair for testing
export const getTestSwapPair = (): { inputToken: Token; outputToken: Token } => {
  const tokens = getDevnetTokens();
  return {
    inputToken: tokens[0], // SOL
    outputToken: tokens[0], // SOL (for testing, same token)
  };
};