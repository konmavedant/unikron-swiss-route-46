
import React, { useMemo } from 'react';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { SOLANA_RPC_ENDPOINTS, SOLANA_WALLETS, CURRENT_SOLANA_NETWORK } from '@/config/solana';

// Import Solana wallet styles
import '@solana/wallet-adapter-react-ui/styles.css';

interface SolanaWalletProviderProps {
  children: React.ReactNode;
}

export const SolanaWalletContextProvider: React.FC<SolanaWalletProviderProps> = ({ children }) => {
  const network = CURRENT_SOLANA_NETWORK as WalletAdapterNetwork;
  const endpoint = useMemo(() => SOLANA_RPC_ENDPOINTS[network], [network]);
  const wallets = useMemo(() => SOLANA_WALLETS, []);

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          {children}
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
};
