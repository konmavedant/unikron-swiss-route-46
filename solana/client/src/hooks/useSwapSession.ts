import { useState, useEffect, useCallback } from 'react';
import { SwapIntent, ChainType } from '@/types';
import { UnikronApiService } from '@/services/api';
import { useToast } from '@/hooks/use-toast';

interface SwapSession {
  swapIntent: SwapIntent | null;
  isPolling: boolean;
  timeRemaining: number;
  phase: 'idle' | 'preview' | 'commit' | 'reveal' | 'executed' | 'expired';
}

export const useSwapSession = (chainType: ChainType) => {
  const [session, setSession] = useState<SwapSession>({
    swapIntent: null,
    isPolling: false,
    timeRemaining: 0,
    phase: 'idle'
  });
  
  const { toast } = useToast();

  // Calculate time remaining for commit window (5 minutes)
  const calculateTimeRemaining = useCallback((createdAt: number) => {
    const commitWindow = 5 * 60 * 1000; // 5 minutes in ms
    const elapsed = Date.now() - createdAt;
    return Math.max(0, commitWindow - elapsed);
  }, []);

  // Update phase based on swap intent status and time
  const updatePhase = useCallback((swapIntent: SwapIntent | null) => {
    if (!swapIntent) {
      setSession(prev => ({ ...prev, phase: 'idle' }));
      return;
    }

    const timeRemaining = calculateTimeRemaining(swapIntent.createdAt);
    
    let newPhase: SwapSession['phase'] = 'idle';
    
    if (swapIntent.status === 'executed') {
      newPhase = 'executed';
    } else if (swapIntent.status === 'expired' || timeRemaining <= 0) {
      newPhase = 'expired';
    } else if (swapIntent.status === 'committed') {
      newPhase = 'reveal';
    } else if (swapIntent.status === 'pending') {
      newPhase = 'commit';
    }

    setSession(prev => ({
      ...prev,
      phase: newPhase,
      timeRemaining,
      swapIntent
    }));
  }, [calculateTimeRemaining]);

  // Poll swap status
  const pollSwapStatus = useCallback(async (intentId: string) => {
    if (session.isPolling) return;

    setSession(prev => ({ ...prev, isPolling: true }));

    try {
      const status = await UnikronApiService.getSwapStatus(chainType, intentId);
      
      // Note: SwapStatusResponse doesn't include full swap details
      // We need to reconstruct them from stored data or fetch separately
      const swapIntent: SwapIntent = {
        intentId: status.intentId,
        status: status.status,
        txHash: status.txHash,
        createdAt: status.createdAt,
        executedAt: status.executedAt,
        failedAt: status.failedAt,
        inputToken: { address: '', symbol: '', name: '', decimals: 18, logoURI: '' }, // Placeholder
        outputToken: { address: '', symbol: '', name: '', decimals: 18, logoURI: '' }, // Placeholder
        inputAmount: '',
        outputAmount: '',
        actualOutputAmount: status.actualOutputAmount,
        config: { slippage: 0.5, deadline: 20, mevProtection: true }, // Default config
        chainType,
        user: '', // Not available in status response
        error: status.error
      };

      updatePhase(swapIntent);

      // Continue polling if still active
      if (['pending', 'committed'].includes(status.status)) {
        const timeRemaining = calculateTimeRemaining(status.createdAt);
        if (timeRemaining > 0) {
          setTimeout(() => pollSwapStatus(intentId), 2000);
        } else {
          // Expired
          updatePhase({ ...swapIntent, status: 'expired' });
        }
      }
    } catch (error) {
      console.error('Error polling swap status:', error);
      toast({
        title: "Error",
        description: "Failed to update swap status",
        variant: "destructive",
      });
    } finally {
      setSession(prev => ({ ...prev, isPolling: false }));
    }
  }, [chainType, session.isPolling, updatePhase, calculateTimeRemaining, toast]);

  // Start a new swap session
  const startSession = useCallback((swapIntent: SwapIntent) => {
    updatePhase(swapIntent);
    
    // Save to localStorage for recovery with full swap details
    localStorage.setItem('activeSwapSession', JSON.stringify({
      intentId: swapIntent.intentId,
      chainType,
      createdAt: swapIntent.createdAt,
      inputToken: swapIntent.inputToken,
      outputToken: swapIntent.outputToken,
      inputAmount: swapIntent.inputAmount,
      outputAmount: swapIntent.outputAmount,
      config: swapIntent.config,
      user: swapIntent.user
    }));

    // Start polling
    pollSwapStatus(swapIntent.intentId);
  }, [updatePhase, pollSwapStatus, chainType]);

  // Recover session from localStorage
  const recoverSession = useCallback(async () => {
    try {
      const saved = localStorage.getItem('activeSwapSession');
      if (!saved) return false;

      const sessionData = JSON.parse(saved);
      const { intentId, chainType: savedChainType, createdAt, inputToken, outputToken, inputAmount, outputAmount, config, user } = sessionData;
      
      // Check if this is for the current chain and not expired
      if (savedChainType !== chainType) return false;
      
      const timeRemaining = calculateTimeRemaining(createdAt);
      if (timeRemaining <= 0) {
        localStorage.removeItem('activeSwapSession');
        return false;
      }

      // Fetch current status
      const status = await UnikronApiService.getSwapStatus(chainType, intentId);
      
      // Use saved session data to reconstruct full swap intent
      const swapIntent: SwapIntent = {
        intentId: status.intentId,
        status: status.status,
        txHash: status.txHash,
        createdAt: status.createdAt,
        executedAt: status.executedAt,
        failedAt: status.failedAt,
        inputToken: inputToken || { address: '', symbol: '', name: '', decimals: 18, logoURI: '' },
        outputToken: outputToken || { address: '', symbol: '', name: '', decimals: 18, logoURI: '' },
        inputAmount: inputAmount || '',
        outputAmount: outputAmount || '',
        actualOutputAmount: status.actualOutputAmount,
        config: config || { slippage: 0.5, deadline: 20, mevProtection: true },
        chainType,
        user: user || '',
        error: status.error
      };

      // If still active, resume session
      if (['pending', 'committed'].includes(status.status)) {
        startSession(swapIntent);
        toast({
          title: "Session Recovered",
          description: "Resumed your active swap session",
        });
        return true;
      } else {
        // Clean up expired session
        localStorage.removeItem('activeSwapSession');
      }
    } catch (error) {
      console.error('Error recovering session:', error);
      localStorage.removeItem('activeSwapSession');
    }
    
    return false;
  }, [chainType, calculateTimeRemaining, startSession, toast]);

  // Clear session
  const clearSession = useCallback(() => {
    setSession({
      swapIntent: null,
      isPolling: false,
      timeRemaining: 0,
      phase: 'idle'
    });
    localStorage.removeItem('activeSwapSession');
  }, []);

  // Reveal swap
  const revealSwap = useCallback(async () => {
    if (!session.swapIntent) return;

    try {
      // In a real implementation, this would call the reveal API
      // For now, we'll simulate the reveal by updating the status
      const updatedIntent = { ...session.swapIntent, status: 'executed' as const };
      updatePhase(updatedIntent);
      
      toast({
        title: "Swap Executed",
        description: "Your protected swap has been completed!",
      });
      
      // Clean up session after successful execution
      setTimeout(() => clearSession(), 3000);
    } catch (error) {
      console.error('Error revealing swap:', error);
      toast({
        title: "Error",
        description: "Failed to execute swap",
        variant: "destructive",
      });
    }
  }, [session.swapIntent, updatePhase, toast, clearSession]);

  // Timer effect for updating time remaining
  useEffect(() => {
    if (session.swapIntent && ['commit', 'reveal'].includes(session.phase)) {
      const timer = setInterval(() => {
        const timeRemaining = calculateTimeRemaining(session.swapIntent!.createdAt);
        
        if (timeRemaining <= 0) {
          // Expired
          const expiredIntent = { ...session.swapIntent!, status: 'expired' as const };
          updatePhase(expiredIntent);
        } else {
          setSession(prev => ({ ...prev, timeRemaining }));
        }
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [session.swapIntent, session.phase, calculateTimeRemaining, updatePhase]);

  return {
    session,
    startSession,
    recoverSession,
    clearSession,
    revealSwap,
    pollSwapStatus
  };
};