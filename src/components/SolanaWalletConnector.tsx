
import React from 'react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useWallet } from '@solana/wallet-adapter-react';
import { useSolanaWallet } from '@/hooks/useSolanaWallet';

interface SolanaWalletConnectorProps {
  onConnectionChange?: (connected: boolean) => void;
}

const SolanaWalletConnector = ({ onConnectionChange }: SolanaWalletConnectorProps) => {
  const { connected } = useWallet();
  const { publicKey } = useSolanaWallet();

  // Notify parent of connection changes
  React.useEffect(() => {
    onConnectionChange?.(connected);
  }, [connected, onConnectionChange]);

  return (
    <div className="solana-wallet-connector">
      <WalletMultiButton className="!bg-gradient-to-r !from-purple-500 !to-pink-500 hover:!from-purple-600 hover:!to-pink-600 !text-white !font-medium !px-4 !py-2 !rounded-md !transition-all !duration-200" />
      {connected && publicKey && (
        <div className="text-xs text-gray-500 mt-1 text-center max-w-[120px] truncate">
          {publicKey.slice(0, 4)}...{publicKey.slice(-4)}
        </div>
      )}
    </div>
  );
};

export default SolanaWalletConnector;
