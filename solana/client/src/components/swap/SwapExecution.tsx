// src/components/swap/SwapExecution.tsx
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, ExternalLink, AlertCircle, Loader2 } from 'lucide-react';
import { SwapQuote, ChainType } from '@/types';
import { useSolanaSwap } from '@/hooks/useSolanaSwap';
import { useToast } from '@/hooks/use-toast';
import { truncateAddress } from '@/lib/utils';

interface SwapExecutionProps {
  quote: SwapQuote;
  chainType: ChainType;
  onComplete: (signature: string) => void;
  onCancel: () => void;
}

type ExecutionStep = 'preparing' | 'signing' | 'submitting' | 'confirming' | 'completed' | 'failed';

export const SwapExecution = ({
  quote,
  chainType,
  onComplete,
  onCancel
}: SwapExecutionProps) => {
  const [currentStep, setCurrentStep] = useState<ExecutionStep>('preparing');
  const [signature, setSignature] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  const { executeSwap, isLoading } = useSolanaSwap();
  const { toast } = useToast();

  // Auto-start execution when component mounts
  useEffect(() => {
    if (chainType === 'solana') {
      handleSolanaSwap();
    }
  }, []);

  // Progress animation
  useEffect(() => {
    const progressValues = {
      preparing: 10,
      signing: 30,
      submitting: 60,
      confirming: 90,
      completed: 100,
      failed: 0
    };

    setProgress(progressValues[currentStep]);
  }, [currentStep]);

  const handleSolanaSwap = async () => {
    try {
      setCurrentStep('preparing');
      await new Promise(resolve => setTimeout(resolve, 1000)); // Show preparing step

      setCurrentStep('signing');
      const txSignature = await executeSwap(quote);

      if (!txSignature) {
        throw new Error('Transaction was not signed or failed');
      }

      setSignature(txSignature);
      setCurrentStep('submitting');
      await new Promise(resolve => setTimeout(resolve, 1000));

      setCurrentStep('confirming');
      // In a real implementation, you'd wait for transaction confirmation
      await new Promise(resolve => setTimeout(resolve, 3000));

      setCurrentStep('completed');
      onComplete(txSignature);

    } catch (error) {
      console.error('Swap execution failed:', error);
      setError(error instanceof Error ? error.message : 'Swap failed');
      setCurrentStep('failed');
      
      toast({
        title: 'Swap Failed',
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: 'destructive',
      });
    }
  };

  const getStepIcon = () => {
    switch (currentStep) {
      case 'preparing':
      case 'signing':
      case 'submitting':
      case 'confirming':
        return <Loader2 className="w-5 h-5 animate-spin text-blue-500" />;
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'failed':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
    }
  };

  const getStepText = () => {
    switch (currentStep) {
      case 'preparing':
        return 'Preparing transaction...';
      case 'signing':
        return 'Please sign the transaction in your wallet';
      case 'submitting':
        return 'Submitting transaction to network...';
      case 'confirming':
        return 'Waiting for confirmation...';
      case 'completed':
        return 'Swap completed successfully!';
      case 'failed':
        return 'Swap failed';
    }
  };

  const getExplorerUrl = () => {
    if (!signature) return null;
    
    if (chainType === 'solana') {
      return `https://explorer.solana.com/tx/${signature}?cluster=devnet`;
    }
    
    return `https://etherscan.io/tx/${signature}`;
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {getStepIcon()}
          Executing Swap
        </CardTitle>
        <Badge variant="outline" className="w-fit">
          {chainType === 'solana' ? 'Jupiter • Solana Devnet' : 'EVM Network'}
        </Badge>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Progress</span>
            <span>{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
          <p className="text-sm text-muted-foreground">{getStepText()}</p>
        </div>

        {/* Swap Details */}
        <div className="space-y-2">
          <h4 className="font-medium">Swap Details</h4>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">From:</span>
              <span>
                {(parseFloat(quote.inputAmount) / Math.pow(10, quote.inputToken.decimals)).toFixed(6)} {quote.inputToken.symbol}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">To:</span>
              <span>
                {(parseFloat(quote.outputAmount) / Math.pow(10, quote.outputToken.decimals)).toFixed(6)} {quote.outputToken.symbol}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Min Received:</span>
              <span>
                {(parseFloat(quote.minOutputAmount) / Math.pow(10, quote.outputToken.decimals)).toFixed(6)} {quote.outputToken.symbol}
              </span>
            </div>
            {quote.fee && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Fee:</span>
                <span>{quote.fee} {quote.inputToken.symbol}</span>
              </div>
            )}
          </div>
        </div>

        {/* Transaction Hash */}
        {signature && (
          <div className="space-y-2">
            <h4 className="font-medium">Transaction</h4>
            <div className="flex items-center gap-2 p-2 rounded bg-secondary/50">
              <span className="text-sm font-mono flex-1">
                {truncateAddress(signature, 12, 8)}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  const url = getExplorerUrl();
                  if (url) window.open(url, '_blank');
                }}
              >
                <ExternalLink className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          {currentStep === 'failed' && (
            <Button
              onClick={() => {
                setCurrentStep('preparing');
                setError(null);
                setSignature(null);
                handleSolanaSwap();
              }}
              className="flex-1"
            >
              Retry Swap
            </Button>
          )}
          
          {currentStep === 'completed' && signature && (
            <Button
              onClick={() => onComplete(signature)}
              className="flex-1"
            >
              View Details
            </Button>
          )}
          
          {(currentStep === 'failed' || currentStep === 'completed') && (
            <Button 
              variant="outline" 
              onClick={onCancel}
              className="flex-1"
            >
              {currentStep === 'completed' ? 'New Swap' : 'Cancel'}
            </Button>
          )}
        </div>

        {/* Execution Steps */}
        <div className="space-y-2">
          <h4 className="font-medium text-sm">Execution Steps</h4>
          <div className="space-y-1">
            {[
              { key: 'preparing', label: 'Prepare Transaction' },
              { key: 'signing', label: 'Sign Transaction' },
              { key: 'submitting', label: 'Submit to Network' },
              { key: 'confirming', label: 'Confirm Transaction' },
              { key: 'completed', label: 'Complete' }
            ].map((step, index) => {
              const stepIndex = ['preparing', 'signing', 'submitting', 'confirming', 'completed'].indexOf(currentStep);
              const isActive = index === stepIndex;
              const isCompleted = index < stepIndex || currentStep === 'completed';
              const isFailed = currentStep === 'failed' && index === stepIndex;

              return (
                <div key={step.key} className="flex items-center gap-2 text-xs">
                  <div className={`w-2 h-2 rounded-full ${
                    isFailed ? 'bg-red-500' :
                    isCompleted ? 'bg-green-500' :
                    isActive ? 'bg-blue-500 animate-pulse' :
                    'bg-gray-300'
                  }`} />
                  <span className={`${
                    isActive ? 'text-foreground' :
                    isCompleted ? 'text-green-600' :
                    isFailed ? 'text-red-600' :
                    'text-muted-foreground'
                  }`}>
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};