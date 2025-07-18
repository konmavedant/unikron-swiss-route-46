// src/components/swap/SwapFlow.tsx (Updated)
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SwapForm } from "./SwapForm";
import { SwapPreview } from "./SwapPreview";
import { SwapStatus } from "./SwapStatus";
import { SwapCommitReveal } from "./SwapCommitReveal";
import { SwapExecution } from "./SwapExecution";
import { Token } from "@/types/tokens";
import { ChainType } from "@/types/chains";
import { useSwapStore } from "@/store/swap";
import { useSwapQuote } from "@/hooks/useSwapQuote";
import { useWalletConnection } from "@/hooks/useWalletConnection";

interface SwapFlowProps {
  chainType: ChainType;
  tokens: Token[];
  isConnected: boolean;
}

type SwapStep = "form" | "preview" | "commit-reveal" | "execution" | "status";

export const SwapFlow = ({ chainType, tokens, isConnected }: SwapFlowProps) => {
  const [currentStep, setCurrentStep] = useState<SwapStep>("form");
  const { evmAddress, solanaAddress } = useWalletConnection();
  
  const { 
    setChainType, 
    quote, 
    activeIntentId,
    config,
    resetSwap 
  } = useSwapStore();
  
  const { hasValidInputs } = useSwapQuote();

  const userAddress = chainType === 'evm' ? evmAddress : solanaAddress;

  // Update store when chain changes
  useEffect(() => {
    setChainType(chainType);
  }, [chainType, setChainType]);

  const handlePreview = () => {
    if (hasValidInputs && quote) {
      setCurrentStep("preview");
    }
  };

  const handleSwapConfirmed = () => {
    // For Solana, go directly to execution
    // For EVM, use commit-reveal if MEV protection is enabled
    if (chainType === 'solana') {
      setCurrentStep("execution");
    } else if (config.mevProtection) {
      setCurrentStep("commit-reveal");
    } else {
      setCurrentStep("execution");
    }
  };

  const handleSwapComplete = (signature: string) => {
    // Store the transaction signature as intent ID for tracking
    useSwapStore.getState().setActiveIntentId(signature);
    setCurrentStep("status");
  };

  const handleReset = () => {
    setCurrentStep("form");
    resetSwap();
  };

  const handleCancel = () => {
    setCurrentStep("form");
  };

  return (
    <Card className="w-full max-w-lg mx-auto">
      <CardHeader>
        <CardTitle className="text-center flex items-center justify-center gap-2">
          <span>Swap Tokens</span>
          <span className="text-sm font-normal text-muted-foreground">
            • {chainType.toUpperCase()}
          </span>
          {chainType === 'solana' && (
            <span className="text-xs bg-gradient-shield text-transparent bg-clip-text font-medium">
              Unikron
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {currentStep === "form" && (
          <SwapForm
            tokens={tokens}
            isConnected={isConnected}
            onPreview={handlePreview}
          />
        )}
        
        {currentStep === "preview" && quote && (
          <SwapPreview
            quote={quote}
            inputToken={quote.inputToken}
            outputToken={quote.outputToken}
            inputAmount={quote.inputAmount}
            config={config}
            onConfirm={handleSwapConfirmed}
            onCancel={() => setCurrentStep("form")}
            mevProtection={config.mevProtection}
          />
        )}
        
        {currentStep === "commit-reveal" && quote && userAddress && chainType === 'evm' && (
          <SwapCommitReveal
            quote={quote}
            chainType={chainType}
            userAddress={userAddress}
            onSwapComplete={handleSwapComplete}
            onCancel={handleCancel}
          />
        )}
        
        {currentStep === "execution" && quote && (
          <SwapExecution
            quote={quote}
            chainType={chainType}
            onComplete={handleSwapComplete}
            onCancel={handleCancel}
          />
        )}
        
        {currentStep === "status" && activeIntentId && (
          <SwapStatus
            intentId={activeIntentId}
            chainType={chainType}
            onReset={handleReset}
          />
        )}
      </CardContent>
    </Card>
  );
};