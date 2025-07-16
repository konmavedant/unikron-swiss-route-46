import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SwapForm } from "./SwapForm";
import { SwapPreview } from "./SwapPreview";
import { SwapStatus } from "./SwapStatus";
import { SwapCommitReveal } from "./SwapCommitReveal";
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

type SwapStep = "form" | "preview" | "commit-reveal" | "status";

export const SwapFlow = ({ chainType, tokens, isConnected }: SwapFlowProps) => {
  const [currentStep, setCurrentStep] = useState<SwapStep>("form");
  const { evmAddress, solanaAddress } = useWalletConnection();
  
  const { 
    setChainType, 
    quote, 
    activeIntentId,
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
    setCurrentStep("commit-reveal");
  };

  const handleSwapComplete = (intentId: string) => {
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
        <CardTitle className="text-center">
          Swap Tokens - {chainType.toUpperCase()}
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
            config={{ slippage: quote.slippage, deadline: 20, mevProtection: true }}
            onConfirm={handleSwapConfirmed}
            onCancel={() => setCurrentStep("form")}
            mevProtection={true}
          />
        )}
        
        {currentStep === "commit-reveal" && quote && userAddress && (
          <SwapCommitReveal
            quote={quote}
            chainType={chainType}
            userAddress={userAddress}
            onSwapComplete={handleSwapComplete}
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