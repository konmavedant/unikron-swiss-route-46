import { create } from 'zustand';
import { WalletState, ChainType } from '@/types';

interface WalletStore extends WalletState {
  setWallet: (wallet: Partial<WalletState>) => void;
  connect: (address: string, chainType: ChainType, chainId?: number) => void;
  disconnect: () => void;
  setConnecting: (connecting: boolean) => void;
  setReconnecting: (reconnecting: boolean) => void;
}

export const useWalletStore = create<WalletStore>((set) => ({
  address: null,
  chainType: null,
  chainId: undefined,
  walletType: undefined,
  isConnected: false,
  isConnecting: false,
  isReconnecting: false,
  balance: undefined,
  ensName: undefined,

  setWallet: (wallet) =>
    set((state) => ({ ...state, ...wallet })),

  connect: (address, chainType, chainId) =>
    set({
      address,
      chainType,
      chainId,
      isConnected: true,
      isConnecting: false,
      isReconnecting: false,
    }),

  disconnect: () =>
    set({
      address: null,
      chainType: null,
      chainId: undefined,
      walletType: undefined,
      isConnected: false,
      isConnecting: false,
      isReconnecting: false,
      balance: undefined,
      ensName: undefined,
    }),

  setConnecting: (isConnecting) =>
    set({ isConnecting }),

  setReconnecting: (isReconnecting) =>
    set({ isReconnecting }),
}));