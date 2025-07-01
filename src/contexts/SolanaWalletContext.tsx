
import React, { createContext, useContext, ReactNode } from 'react';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
} from '@solana/wallet-adapter-wallets';
import { SOLANA_RPC_URL } from '@/config/solana';

const wallets = [
  new PhantomWalletAdapter(),
  new SolflareWalletAdapter(),
];

interface SolanaWalletProviderProps {
  children: ReactNode;
}

export const SolanaWalletProvider: React.FC<SolanaWalletProviderProps> = ({ children }) => {
  return (
    <ConnectionProvider endpoint={SOLANA_RPC_URL}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          {children}
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
};

// Context for Solana-specific state management
interface SolanaContextType {
  isConnected: boolean;
  publicKey: string | null;
}

const SolanaContext = createContext<SolanaContextType>({
  isConnected: false,
  publicKey: null,
});

export const useSolanaContext = () => useContext(SolanaContext);
