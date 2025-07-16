import { ChainType } from './chains';

// Wallet Connection Types
export type WalletType = 
  // EVM Wallets
  | 'metamask' 
  | 'walletconnect' 
  | 'coinbase' 
  | 'rainbow'
  | 'injected'
  // Solana Wallets  
  | 'phantom'
  | 'solflare'
  | 'backpack'
  | 'glow';

export interface WalletInfo {
  type: WalletType;
  name: string;
  icon: string;
  downloadUrl?: string;
  isDetected: boolean;
  isInstalled: boolean;
  supportedChains: ChainType[];
}

export interface WalletState {
  address: string | null;
  chainType: ChainType | null;
  chainId?: number; // EVM only
  walletType?: WalletType;
  isConnected: boolean;
  isConnecting: boolean;
  isReconnecting: boolean;
  balance?: string;
  ensName?: string; // EVM only
}

export interface WalletConnection {
  wallet: WalletInfo;
  account: {
    address: string;
    chainType: ChainType;
    chainId?: number;
  };
  provider?: any;
}

// Wallet Action Types
export interface ConnectWalletAction {
  type: 'CONNECT_WALLET';
  payload: {
    walletType: WalletType;
    chainType: ChainType;
  };
}

export interface DisconnectWalletAction {
  type: 'DISCONNECT_WALLET';
}

export interface SwitchChainAction {
  type: 'SWITCH_CHAIN';
  payload: {
    chainId: number;
    chainType: ChainType;
  };
}

export type WalletAction = 
  | ConnectWalletAction 
  | DisconnectWalletAction 
  | SwitchChainAction;