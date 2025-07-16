import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Wallet, ChevronDown } from "lucide-react";
import { useState } from "react";
import { WalletModal } from "./WalletModal";
import { useWalletStore } from "@/store/wallet";
import { useAccount } from 'wagmi';
import { useWallet } from '@solana/wallet-adapter-react';

interface WalletConnectButtonProps {
  onConnect?: (address: string, chainType: 'evm' | 'solana') => void;
}

export const WalletConnectButton = ({ onConnect }: WalletConnectButtonProps) => {
  const [showModal, setShowModal] = useState(false);
  const { isConnecting } = useWalletStore();
  const { isConnected: evmConnected, address: evmAddress } = useAccount();
  const { connected: solanaConnected, publicKey: solanaAddress } = useWallet();

  const isAnyWalletConnected = evmConnected || solanaConnected;
  
  const getConnectedWalletInfo = () => {
    if (evmConnected && evmAddress) {
      return {
        address: evmAddress,
        type: 'EVM',
        shortAddress: `${evmAddress.slice(0, 6)}...${evmAddress.slice(-4)}`
      };
    }
    if (solanaConnected && solanaAddress) {
      const address = solanaAddress.toString();
      return {
        address,
        type: 'Solana',
        shortAddress: `${address.slice(0, 6)}...${address.slice(-4)}`
      };
    }
    return null;
  };

  const connectedWallet = getConnectedWalletInfo();

  if (isAnyWalletConnected && connectedWallet) {
    return (
      <>
        <Button
          variant="outline"
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 h-12 px-4"
        >
          <Wallet className="w-4 h-4" />
          <div className="flex flex-col items-start">
            <span className="text-xs text-muted-foreground">{connectedWallet.type}</span>
            <span className="text-sm">{connectedWallet.shortAddress}</span>
          </div>
          <ChevronDown className="w-4 h-4" />
        </Button>

        <WalletModal 
          open={showModal}
          onClose={() => setShowModal(false)}
          onConnect={onConnect}
        />
      </>
    );
  }

  return (
    <>
      <Button
        variant="cosmic"
        onClick={() => setShowModal(true)}
        className="flex items-center gap-2 h-12 px-6"
        disabled={isConnecting}
      >
        <Wallet className="w-5 h-5" />
        {isConnecting ? "Connecting..." : "Connect Wallet"}
        <Badge variant="outline" className="ml-2 text-xs border-white/20 text-white/90">
          Multi-Chain
        </Badge>
      </Button>

      <WalletModal 
        open={showModal}
        onClose={() => setShowModal(false)}
        onConnect={onConnect}
      />
    </>
  );
};