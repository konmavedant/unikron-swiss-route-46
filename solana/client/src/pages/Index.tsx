import { Header } from "@/components/Header";
import { HeroSection } from "@/components/HeroSection";
import { ChainSelector } from "@/components/swap/ChainSelector";
import { SwapFlow } from "@/components/swap/SwapFlow";
import { WalletConnectButton } from "@/components/wallet/WalletConnectButton";
import { WalletInfo } from "@/components/wallet/WalletInfo";
import { UserOnboarding } from "@/components/ui/user-onboarding";
import { useWalletConnection } from "@/hooks/useWalletConnection";
import { useState, useEffect } from "react";
import { ChainType } from "@/types";
import { useAppStore } from "@/store/app";
import { useTokenData } from "@/hooks/useTokenData";

const Index = () => {
  const { 
    evmConnected, 
    evmAddress, 
    chainId, 
    solanaConnected, 
    solanaAddress, 
    isAnyWalletConnected,
    disconnectAll 
  } = useWalletConnection();
  const { settings } = useAppStore();
  const [selectedChain, setSelectedChain] = useState<ChainType>("evm");
  const [showOnboarding, setShowOnboarding] = useState(false);
  
  // Get real token data
  const { tokens } = useTokenData(selectedChain);

  // Check if user needs onboarding
  useEffect(() => {
    if (!settings.hasCompletedOnboarding) {
      setShowOnboarding(true);
    }
  }, [settings.hasCompletedOnboarding]);

  const handleWalletConnect = (address: string, chainType: ChainType) => {
    setSelectedChain(chainType);
  };

  const handleWalletDisconnect = async () => {
    await disconnectAll();
  };

  const handleSwap = (quote: any) => {
    console.log("Executing swap with quote:", quote);
  };

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
  };

  const handleOnboardingSkip = () => {
    setShowOnboarding(false);
  };

  return (
    <div className="min-h-screen bg-gradient-background">
      {/* User Onboarding */}
      {showOnboarding && (
        <UserOnboarding 
          onComplete={handleOnboardingComplete}
          onSkip={handleOnboardingSkip}
        />
      )}
      
      <Header />
      
      <main className="container mx-auto px-6 py-8 space-y-12">
        <HeroSection />
        
        <div className="grid lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <div className="lg:col-span-1 space-y-6">
            <ChainSelector 
              selectedChain={selectedChain}
              onChainSelect={setSelectedChain}
            />
            
            <div className="flex justify-center">
              {isAnyWalletConnected ? (
                <WalletInfo
                  address={(evmAddress || solanaAddress)!}
                  chainType={evmConnected ? 'evm' : 'solana'}
                  chainId={chainId}
                  balance="1.234"
                  onDisconnect={handleWalletDisconnect}
                />
              ) : (
                <WalletConnectButton onConnect={handleWalletConnect} />
              )}
            </div>
          </div>
          
          <div className="lg:col-span-2 flex justify-center">
            <SwapFlow
              chainType={selectedChain}
              tokens={tokens}
              isConnected={isAnyWalletConnected}
            />
          </div>
        </div>
        
        {/* Features Section */}
        <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <div className="text-center p-6 rounded-lg bg-card/50 border border-border/50">
            <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-gradient-cosmic flex items-center justify-center">
              <span className="text-2xl">🛡️</span>
            </div>
            <h3 className="text-lg font-semibold mb-2">MEV Protection</h3>
            <p className="text-sm text-muted-foreground">
              Commit-reveal protocol prevents front-running and sandwich attacks
            </p>
          </div>
          
          <div className="text-center p-6 rounded-lg bg-card/50 border border-border/50">
            <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-gradient-shield flex items-center justify-center">
              <span className="text-2xl">🌐</span>
            </div>
            <h3 className="text-lg font-semibold mb-2">Cross-Chain</h3>
            <p className="text-sm text-muted-foreground">
              Seamless swaps across EVM and Solana ecosystems
            </p>
          </div>
          
          <div className="text-center p-6 rounded-lg bg-card/50 border border-border/50">
            <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-primary/20 flex items-center justify-center">
              <span className="text-2xl">⚡</span>
            </div>
            <h3 className="text-lg font-semibold mb-2">Best Rates</h3>
            <p className="text-sm text-muted-foreground">
              Advanced routing across multiple DEXes for optimal pricing
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
