import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Copy, ExternalLink, LogOut, Wallet } from "lucide-react";
import { useState } from "react";
import { toast } from "@/hooks/use-toast";
import { useWalletStore } from "@/store/wallet";
import { useDisconnect } from 'wagmi';
import { useWallet } from '@solana/wallet-adapter-react';

interface WalletInfoProps {
  address: string;
  chainType: 'evm' | 'solana';
  chainId?: number;
  balance?: string;
  onDisconnect: () => void;
}

export const WalletInfo = ({ 
  address, 
  chainType, 
  chainId, 
  balance,
  onDisconnect 
}: WalletInfoProps) => {
  const [showFull, setShowFull] = useState(false);
  const { disconnect: storeDisconnect } = useWalletStore();
  const { disconnect: evmDisconnect } = useDisconnect();
  const { disconnect: solanaDisconnect } = useWallet();

  const handleDisconnect = async () => {
    try {
      if (chainType === 'evm') {
        evmDisconnect();
      } else {
        await solanaDisconnect();
      }
      storeDisconnect();
      onDisconnect();
      toast({
        title: "Wallet Disconnected",
        description: "Your wallet has been disconnected successfully",
      });
    } catch (error) {
      console.error('Disconnect failed:', error);
    }
  };

  const formatAddress = (addr: string) => {
    if (showFull) return addr;
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const copyAddress = () => {
    navigator.clipboard.writeText(address);
    toast({
      title: "Address copied",
      description: "Wallet address has been copied to clipboard",
    });
  };

  const getChainName = () => {
    if (chainType === 'solana') return 'Solana';
    
    switch (chainId) {
      case 1: return 'Ethereum';
      case 137: return 'Polygon';
      case 42161: return 'Arbitrum';
      case 10: return 'Optimism';
      default: return 'EVM';
    }
  };

  const getExplorerUrl = () => {
    if (chainType === 'solana') {
      return `https://explorer.solana.com/address/${address}`;
    }
    
    switch (chainId) {
      case 1: return `https://etherscan.io/address/${address}`;
      case 137: return `https://polygonscan.com/address/${address}`;
      case 42161: return `https://arbiscan.io/address/${address}`;
      case 10: return `https://optimistic.etherscan.io/address/${address}`;
      default: return `https://etherscan.io/address/${address}`;
    }
  };

  return (
    <Card className="w-full max-w-sm">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wallet className="w-4 h-4" />
            <span className="text-sm font-medium">Connected</span>
          </div>
          <Badge 
            variant="outline" 
            className={`${
              chainType === 'evm' 
                ? 'border-cosmic-purple text-cosmic-purple' 
                : 'border-shield-cyan text-shield-cyan'
            }`}
          >
            {getChainName()}
          </Badge>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowFull(!showFull)}
              className="p-0 h-auto font-mono text-sm"
            >
              {formatAddress(address)}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={copyAddress}
              className="h-6 w-6"
            >
              <Copy className="w-3 h-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => window.open(getExplorerUrl(), '_blank')}
              className="h-6 w-6"
            >
              <ExternalLink className="w-3 h-3" />
            </Button>
          </div>

          {balance && (
            <div className="text-sm text-muted-foreground">
              Balance: {balance} {chainType === 'evm' ? 'ETH' : 'SOL'}
            </div>
          )}
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={handleDisconnect}
          className="w-full flex items-center gap-2"
        >
          <LogOut className="w-4 h-4" />
          Disconnect
        </Button>
      </CardContent>
    </Card>
  );
};