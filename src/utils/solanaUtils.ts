
import { PublicKey } from '@solana/web3.js';
import { SOLANA_TOKENS } from '@/config/solana';

export const isValidSolanaAddress = (address: string): boolean => {
  try {
    new PublicKey(address);
    return true;
  } catch {
    return false;
  }
};

export const formatSolanaAddress = (address: string, chars: number = 4): string => {
  if (!address) return '';
  if (address.length <= chars * 2) return address;
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
};

export const lamportsToSol = (lamports: number): number => {
  return lamports / 1_000_000_000;
};

export const solToLamports = (sol: number): number => {
  return Math.floor(sol * 1_000_000_000);
};

export const getSolanaTokenBySymbol = (symbol: string) => {
  return Object.values(SOLANA_TOKENS).find(token => 
    token.symbol.toLowerCase() === symbol.toLowerCase()
  );
};

export const getSolanaExplorerUrl = (signature: string, network: string = 'devnet'): string => {
  return `https://explorer.solana.com/tx/${signature}?cluster=${network}`;
};

export const getDefaultSolanaTokens = () => {
  return Object.values(SOLANA_TOKENS);
};
