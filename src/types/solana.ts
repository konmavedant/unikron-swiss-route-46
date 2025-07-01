
export interface SolanaToken {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  balance?: number;
}

export interface SolanaWalletInfo {
  publicKey: string | null;
  connected: boolean;
  balance: number;
  tokens: SolanaToken[];
}

export interface SolanaTransactionParams {
  fromAddress: string;
  toAddress: string;
  amount: number;
  tokenMint?: string;
}

export interface SolanaSwapParams {
  inputMint: string;
  outputMint: string;
  amount: number;
  slippage: number;
}

export interface SolanaTransactionResult {
  signature: string;
  success: boolean;
  error?: string;
}
