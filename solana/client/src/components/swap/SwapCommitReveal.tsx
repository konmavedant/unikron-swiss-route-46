import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Shield, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { SwapQuote } from '@/types';
import { UnikronApiService } from '@/services/api';
import { useToast } from '@/hooks/use-toast';

interface SwapCommitRevealProps {
  quote: SwapQuote;
  chainType: 'evm' | 'solana';
  userAddress: string;
  onSwapComplete: (intentId: string) => void;
  onCancel: () => void;
}

type CommitRevealState = 'idle' | 'committing' | 'committed' | 'revealing' | 'completed' | 'failed';

export const SwapCommitReveal = ({ 
  quote, 
  chainType, 
  userAddress, 
  onSwapComplete, 
  onCancel 
}: SwapCommitRevealProps) => {
  const [state, setState] = useState<CommitRevealState>('idle');
  const [commitTxHash, setCommitTxHash] = useState<string | null>(null);
  const [intentId, setIntentId] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const COMMIT_PHASE_DURATION = 30; // 30 seconds

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (state === 'committed' && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setState('revealing');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [state, timeLeft]);

  const handleCommit = async () => {
    setState('committing');
    setError(null);

    try {
      // Create the swap intent with commit phase
      const swapRequest = {
        inputToken: quote.inputToken.address,
        outputToken: quote.outputToken.address,
        inputAmount: quote.inputAmount,
        minOutputAmount: quote.minOutputAmount,
        slippage: quote.slippage,
        user: userAddress,
        deadline: Math.floor(Date.now() / 1000) + (20 * 60), // 20 minutes
        quoteId: quote.quoteId,
        config: {
          slippage: quote.slippage,
          deadline: 20,
          mevProtection: true
        }
      };

      const response = await UnikronApiService.createSwap(chainType, swapRequest);
      
      setCommitTxHash(response.tx);
      setIntentId(response.intentId);
      setState('committed');
      setTimeLeft(COMMIT_PHASE_DURATION);

      toast({
        title: "Commit Phase Started",
        description: "Your swap intent has been committed. Waiting for reveal phase...",
      });

    } catch (err) {
      console.error('Commit failed:', err);
      setError(err instanceof Error ? err.message : 'Commit phase failed');
      setState('failed');
      toast({
        title: "Commit Failed",
        description: "Failed to commit swap intent. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleReveal = async () => {
    if (!intentId) return;

    setState('revealing');
    setError(null);

    try {
      // Poll for swap completion
      const result = await UnikronApiService.pollSwapStatus(
        chainType, 
        intentId, 
        2000, // Poll every 2 seconds
        120000 // 2 minute timeout
      );

      if (result.status === 'executed') {
        setState('completed');
        onSwapComplete(intentId);
        toast({
          title: "Swap Completed",
          description: "Your swap has been executed successfully!",
        });
      } else {
        throw new Error(`Swap failed with status: ${result.status}`);
      }

    } catch (err) {
      console.error('Reveal failed:', err);
      setError(err instanceof Error ? err.message : 'Reveal phase failed');
      setState('failed');
      toast({
        title: "Swap Failed",
        description: "The swap could not be completed. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getStateDisplay = () => {
    switch (state) {
      case 'idle':
        return { icon: Shield, text: 'Ready to Commit', color: 'text-primary' };
      case 'committing':
        return { icon: Clock, text: 'Committing...', color: 'text-yellow-500' };
      case 'committed':
        return { icon: Clock, text: `Waiting ${timeLeft}s`, color: 'text-blue-500' };
      case 'revealing':
        return { icon: Clock, text: 'Executing Swap...', color: 'text-blue-500' };
      case 'completed':
        return { icon: CheckCircle, text: 'Completed', color: 'text-green-500' };
      case 'failed':
        return { icon: AlertCircle, text: 'Failed', color: 'text-red-500' };
    }
  };

  const stateDisplay = getStateDisplay();
  const StateIcon = stateDisplay.icon;

  const getProgress = () => {
    switch (state) {
      case 'committing': return 25;
      case 'committed': return 50 + (25 * (COMMIT_PHASE_DURATION - timeLeft) / COMMIT_PHASE_DURATION);
      case 'revealing': return 75;
      case 'completed': return 100;
      case 'failed': return 0;
      default: return 0;
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <StateIcon className={`h-5 w-5 ${stateDisplay.color}`} />
          MEV Protection
        </CardTitle>
        <Badge variant="secondary" className="w-fit">
          Commit-Reveal Protocol
        </Badge>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Progress</span>
            <span>{Math.round(getProgress())}%</span>
          </div>
          <Progress value={getProgress()} className="h-2" />
          <p className="text-sm text-muted-foreground">{stateDisplay.text}</p>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        <div className="space-y-2">
          <h4 className="font-medium">Swap Details</h4>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">From:</span>
              <span>{quote.inputAmount} {quote.inputToken.symbol}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">To:</span>
              <span>{quote.outputAmount} {quote.outputToken.symbol}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Min Received:</span>
              <span>{quote.minOutputAmount} {quote.outputToken.symbol}</span>
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          {state === 'idle' && (
            <>
              <Button onClick={handleCommit} className="flex-1">
                Start Commit Phase
              </Button>
              <Button variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            </>
          )}
          
          {state === 'committed' && timeLeft === 0 && (
            <Button onClick={handleReveal} className="flex-1">
              Execute Swap
            </Button>
          )}
          
          {state === 'failed' && (
            <>
              <Button onClick={handleCommit} className="flex-1">
                Retry
              </Button>
              <Button variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            </>
          )}
          
          {state === 'completed' && (
            <Button onClick={() => onSwapComplete(intentId!)} className="flex-1">
              View Details
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};