import { ChainType } from './chains';

// Core Token Interface
export interface Token {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  logoURI: string;
  chainId?: number; // EVM only
  balance?: string;
  priceUSD?: number;
  verified?: boolean;
  tags?: string[];
}

// Token with additional metadata
export interface TokenWithMetadata extends Token {
  marketCap?: number;
  volume24h?: number;
  priceChange24h?: number;
  liquidity?: string;
  isPopular?: boolean;
  coingeckoId?: string;
}

// Token list from API
export interface TokenList {
  name: string;
  version: {
    major: number;
    minor: number;
    patch: number;
  };
  tokens: Token[];
  timestamp: string;
  chainType: ChainType;
}

// Token balance information
export interface TokenBalance {
  token: Token;
  balance: string;
  balanceFormatted: string;
  balanceUSD?: number;
}