import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Wallet, Shield, Zap, ExternalLink } from "lucide-react";
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletStore } from "@/store/wallet";
import { useEffect } from "react";
import { toast } from "@/hooks/use-toast";

interface WalletModalProps {
  open: boolean;
  onClose: () => void;
  onConnect?: (address: string, chainType: 'evm' | 'solana') => void;
}

export const WalletModal = ({ open, onClose, onConnect }: WalletModalProps) => {
  // EVM wallet hooks
  const { address: evmAddress, isConnected: evmConnected, chainId } = useAccount();

  // Solana wallet hooks  
  const { publicKey: solanaAddress, connected: solanaConnected, select, connect: solanaConnect, disconnect: solanaDisconnect, wallets } = useWallet();

  // Global wallet store
  const { connect: storeConnect, setConnecting } = useWalletStore();

  // Handle EVM connection
  useEffect(() => {
    if (evmConnected && evmAddress) {
      storeConnect(evmAddress, 'evm', chainId);
      onConnect?.(evmAddress, 'evm');
      onClose();
      toast({
        title: "EVM Wallet Connected",
        description: `Connected to ${evmAddress.slice(0, 6)}...${evmAddress.slice(-4)}`,
      });
    }
  }, [evmConnected, evmAddress, chainId]);

  // Handle Solana connection
  useEffect(() => {
    if (solanaConnected && solanaAddress) {
      const address = solanaAddress.toString();
      storeConnect(address, 'solana');
      onConnect?.(address, 'solana');
      onClose();
      toast({
        title: "Solana Wallet Connected", 
        description: `Connected to ${address.slice(0, 6)}...${address.slice(-4)}`,
      });
    }
  }, [solanaConnected, solanaAddress]);

  const handlePhantomConnect = async () => {
    try {
      setConnecting(true);
      
      // Find Phantom wallet
      const phantomWallet = wallets.find(wallet => wallet.adapter.name === 'Phantom');
      
      if (phantomWallet) {
        // Select Phantom wallet
        select(phantomWallet.adapter.name);
        
        // Connect to Phantom
        await solanaConnect();
      } else {
        throw new Error('Phantom wallet not found');
      }
    } catch (error) {
      console.error('Phantom wallet connection failed:', error);
      toast({
        title: "Connection Failed",
        description: "Failed to connect to Phantom wallet. Please make sure Phantom is installed.",
        variant: "destructive",
      });
      setConnecting(false);
    }
  };

  const openPhantomDownload = () => {
    window.open('https://phantom.app/', '_blank');
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wallet className="w-5 h-5" />
            Connect Wallet
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="evm" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="evm" className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-gradient-cosmic"></div>
              EVM
            </TabsTrigger>
            <TabsTrigger value="solana" className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-gradient-shield"></div>
              Solana
            </TabsTrigger>
          </TabsList>

          <TabsContent value="evm" className="space-y-3 mt-4">
            <div className="flex items-center justify-between p-2 rounded-lg bg-secondary/50">
              <Badge variant="outline" className="text-shield-cyan border-shield-cyan/50">
                <Shield className="w-3 h-3 mr-1" />
                MEV Protected
              </Badge>
              <span className="text-xs text-muted-foreground">Ethereum & L2s</span>
            </div>

            <div className="space-y-2">
              {/* RainbowKit Connect Button */}
              <div className="flex justify-center">
                <ConnectButton.Custom>
                  {({
                    account,
                    chain,
                    openAccountModal,
                    openChainModal,
                    openConnectModal,
                    authenticationStatus,
                    mounted,
                  }) => {
                    const ready = mounted && authenticationStatus !== 'loading';
                    const connected =
                      ready &&
                      account &&
                      chain &&
                      (!authenticationStatus ||
                        authenticationStatus === 'authenticated');

                    return (
                      <Button
                        variant="outline"
                        className="w-full justify-between h-12"
                        onClick={connected ? openAccountModal : openConnectModal}
                        disabled={!ready}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-rainbow flex items-center justify-center">
                            🌈
                          </div>
                          {connected ? `${account.displayName}` : 'RainbowKit'}
                        </div>
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    );
                  }}
                </ConnectButton.Custom>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="solana" className="space-y-3 mt-4">
            <div className="flex items-center justify-between p-2 rounded-lg bg-secondary/50">
              <Badge variant="outline" className="text-shield-cyan border-shield-cyan/50">
                <Zap className="w-3 h-3 mr-1" />
                Fast & Cheap
              </Badge>
              <span className="text-xs text-muted-foreground">Solana Network</span>
            </div>

            <div className="space-y-2">
              {/* Phantom Wallet Button */}
              {solanaConnected ? (
                <Button
                  variant="outline"
                  className="w-full justify-between h-12"
                  onClick={() => {
                    solanaDisconnect();
                    onClose();
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center">
                      👻
                    </div>
                    {solanaAddress ? `${solanaAddress.toString().slice(0, 6)}...${solanaAddress.toString().slice(-4)}` : 'Phantom'}
                  </div>
                  <span className="text-xs">Disconnect</span>
                </Button>
              ) : (
                <Button
                  variant="outline"
                  className="w-full justify-between h-12"
                  onClick={handlePhantomConnect}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center">
                      👻
                    </div>
                    Phantom
                  </div>
                  <ExternalLink className="w-4 h-4" />
                </Button>
              )}
              
              {/* Install Phantom if not detected */}
              {!window.phantom && !solanaConnected && (
                <div className="text-center py-4 text-muted-foreground">
                  <p className="text-sm">Phantom wallet not detected.</p>
                  <p className="text-xs mt-1">Please install Phantom wallet to continue.</p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-2"
                    onClick={openPhantomDownload}
                  >
                    Install Phantom
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};