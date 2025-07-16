// Chain and Network Types
export type ChainType = 'evm' | 'solana';

export interface ChainInfo {
  id: number | string;
  name: string;
  symbol: string;
  type: ChainType;
  rpcUrl?: string;
  explorerUrl?: string;
  logoURI?: string;
  testnet?: boolean;
}

export interface SupportedChain extends ChainInfo {
  isActive: boolean;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
}

// EVM specific chain information
export interface EVMChain extends ChainInfo {
  type: 'evm';
  id: number;
  chainId: number;
  networkId?: number;
}

// Solana specific chain information  
export interface SolanaChain extends ChainInfo {
  type: 'solana';
  id: 'mainnet-beta' | 'testnet' | 'devnet';
  cluster: string;
}