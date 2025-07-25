// src/lib/solana.tsx (Updated for Devnet)
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-phantom';
import { SolflareWalletAdapter } from '@solana/wallet-adapter-solflare';
import { clusterApiUrl } from '@solana/web3.js';
import { useMemo } from 'react';

interface SolanaWalletProviderProps {
  children: React.ReactNode;
}

export const SolanaWalletProvider = ({ children }: SolanaWalletProviderProps) => {
  // Use devnet for Jupiter swaps
  const network = WalletAdapterNetwork.Devnet;
  
  // You can also use a custom RPC endpoint for better performance
  const endpoint = useMemo(() => {
    // For production, consider using a paid RPC provider like:
    // - Helius: https://rpc.helius.xyz/?api-key=YOUR_API_KEY
    // - QuickNode: https://your-endpoint.solana.quiknode.pro/YOUR_API_KEY/
    // - Alchemy: https://solana-devnet.g.alchemy.com/v2/YOUR_API_KEY
    
    return import.meta.env.VITE_SOLANA_RPC_URL || clusterApiUrl(network);
  }, []);

  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter({ network }),
    ],
    []
  );

  return (
    <ConnectionProvider 
      endpoint={endpoint}
      config={{
        commitment: 'confirmed',
        confirmTransactionInitialTimeout: 60000,
      }}
    >
      <WalletProvider 
        wallets={wallets} 
        autoConnect={false}
        onError={(error) => {
          console.error('Wallet error:', error);
        }}
      >
        {children}
      </WalletProvider>
    </ConnectionProvider>
  );
};