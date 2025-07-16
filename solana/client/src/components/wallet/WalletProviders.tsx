import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider } from 'wagmi';
import { RainbowKitProvider } from '@rainbow-me/rainbowkit';
import { wagmiConfig } from '@/lib/wagmi';
import { SolanaWalletProvider } from '@/lib/solana';
import '@rainbow-me/rainbowkit/styles.css';

const queryClient = new QueryClient();

interface WalletProvidersProps {
  children: React.ReactNode;
}

export const WalletProviders = ({ children }: WalletProvidersProps) => {
  return (
    <QueryClientProvider client={queryClient}>
      <WagmiProvider config={wagmiConfig}>
        <RainbowKitProvider>
          <SolanaWalletProvider>
            {children}
          </SolanaWalletProvider>
        </RainbowKitProvider>
      </WagmiProvider>
    </QueryClientProvider>
  );
};