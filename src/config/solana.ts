
import { clusterApiUrl, Connection, PublicKey } from '@solana/web3.js';
import { 
  PhantomWalletAdapter,
  SolflareWalletAdapter,
  TorusWalletAdapter,
  LedgerWalletAdapter,
} from '@solana/wallet-adapter-wallets';

// Solana network configuration
export const SOLANA_NETWORKS = {
  mainnet: 'mainnet-beta',
  testnet: 'testnet',
  devnet: 'devnet',
} as const;

export const SOLANA_RPC_ENDPOINTS = {
  mainnet: clusterApiUrl('mainnet-beta'),
  testnet: clusterApiUrl('testnet'),
  devnet: clusterApiUrl('devnet'),
} as const;

// Current network (change this for production)
export const CURRENT_SOLANA_NETWORK = SOLANA_NETWORKS.devnet;
export const SOLANA_CONNECTION = new Connection(SOLANA_RPC_ENDPOINTS.devnet, 'confirmed');

// Wallet adapters for Solana
export const SOLANA_WALLETS = [
  new PhantomWalletAdapter(),
  new SolflareWalletAdapter(),
  new TorusWalletAdapter(),
  new LedgerWalletAdapter(),
];

// Program addresses (update these when you deploy your Solana program)
export const SOLANA_PROGRAM_IDS = {
  unikronSwap: new PublicKey('11111111111111111111111111111111'), // Placeholder
} as const;

// Token addresses on Solana
export const SOLANA_TOKEN_ADDRESSES = {
  WSOL: 'So11111111111111111111111111111111111111112',
  USDC: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
  USDT: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
  RAY: '4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R',
  SRM: 'SRMuApVNdxXokk5GT7XD5cUUgXMBCoAz2LHeuAoKWRt',
} as const;

export type SolanaNetwork = keyof typeof SOLANA_NETWORKS;
export type SolanaTokenSymbol = keyof typeof SOLANA_TOKEN_ADDRESSES;
