// src/hooks/useSolanaSwap.ts (Updated with better swap execution)
import { useState, useCallback } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { VersionedTransaction, PublicKey } from '@solana/web3.js';
import { jupiterSwapService } from '@/services/jupiterService';
import { useToast } from '@/hooks/use-toast';
import { Token, SwapQuote } from '@/types';

interface UseSolanaSwapReturn {
  getQuote: (
    inputToken: Token,
    outputToken: Token,
    inputAmount: string,
    slippage: number
  ) => Promise<SwapQuote | null>;
  executeSwap: (quote: SwapQuote) => Promise<string | null>;
  isLoading: boolean;
  error: string | null;
}

export const useSolanaSwap = (): UseSolanaSwapReturn => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { publicKey, signTransaction } = useWallet();
  const { connection } = useConnection();
  const { toast } = useToast();

  const getQuote = useCallback(async (
    inputToken: Token,
    outputToken: Token,
    inputAmount: string,
    slippage: number
  ): Promise<SwapQuote | null> => {
    if (!inputToken || !outputToken || !inputAmount) {
      return null;
    }

    // Check if trying to swap the same token
    if (inputToken.address === outputToken.address) {
      setError('Cannot swap the same token');
      toast({
        title: 'Invalid Swap',
        description: 'Cannot swap the same token. Please select different tokens.',
        variant: 'destructive',
      });
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log('🔍 Getting quote for:', {
        inputToken: inputToken.symbol,
        outputToken: outputToken.symbol,
        inputAmount,
        slippage
      });

      // Convert input amount to smallest unit (handle decimals properly)
      const inputAmountNumber = parseFloat(inputAmount);
      if (isNaN(inputAmountNumber) || inputAmountNumber <= 0) {
        throw new Error('Invalid input amount');
      }

      const amountInSmallestUnit = Math.floor(inputAmountNumber * Math.pow(10, inputToken.decimals)).toString();
      const slippageBps = Math.floor(slippage * 100); // Convert percentage to basis points

      console.log('📊 Quote request params:', {
        inputMint: inputToken.address,
        outputMint: outputToken.address,
        amountInSmallestUnit,
        slippageBps
      });

      // Get quote from Jupiter
      const jupiterQuote = await jupiterSwapService.getQuote(
        inputToken.address,
        outputToken.address,
        amountInSmallestUnit,
        slippageBps
      );

      console.log('✅ Jupiter quote received successfully');

      // Convert to our internal format
      const quote = jupiterSwapService.convertQuoteToInternal(
        jupiterQuote,
        inputToken,
        outputToken
      );

      // Store the original Jupiter quote for later use
      (quote as any)._jupiterQuote = jupiterQuote;

      console.log('✅ Quote converted successfully');
      return quote;
    } catch (err) {
      console.error('❌ Quote error:', err);
      let errorMessage = 'Failed to get quote';
      
      if (err instanceof Error) {
        if (err.message.includes('No routes found')) {
          errorMessage = 'No trading route found for this token pair';
        } else if (err.message.includes('Insufficient liquidity')) {
          errorMessage = 'Insufficient liquidity for this amount';
        } else if (err.message.includes('Invalid token')) {
          errorMessage = 'One or both tokens are not supported';
        } else if (err.message.includes('amount too small')) {
          errorMessage = 'Amount too small, try increasing the input amount';
        } else {
          errorMessage = err.message;
        }
      }
      
      setError(errorMessage);
      
      toast({
        title: 'Quote Error',
        description: errorMessage,
        variant: 'destructive',
      });

      return null;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const executeSwap = useCallback(async (quote: SwapQuote): Promise<string | null> => {
    if (!publicKey || !signTransaction) {
      toast({
        title: 'Wallet Not Connected',
        description: 'Please connect your Solana wallet to proceed',
        variant: 'destructive',
      });
      return null;
    }

    if (!(quote as any)._jupiterQuote) {
      toast({
        title: 'Invalid Quote',
        description: 'Quote data is missing, please get a new quote',
        variant: 'destructive',
      });
      return null;
    }

    // Check if quote is still valid
    if (Date.now() > quote.validUntil) {
      toast({
        title: 'Quote Expired',
        description: 'Quote has expired, please get a new quote',
        variant: 'destructive',
      });
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      const jupiterQuote = (quote as any)._jupiterQuote;

      console.log('🚀 Starting swap execution...');
      console.log('📋 Swap details:', {
        inputToken: quote.inputToken.symbol,
        outputToken: quote.outputToken.symbol,
        inputAmount: quote.inputAmount,
        expectedOutput: quote.outputAmount,
        slippage: quote.slippage,
      });

      // Show initial toast
      toast({
        title: 'Swap in Progress',
        description: 'Please sign the transaction and wait for confirmation...',
      });

      // Execute the swap using the improved service
      const signature = await jupiterSwapService.executeSwap(
        jupiterQuote,
        publicKey.toString(),
        signTransaction
      );

      console.log('🎉 Swap completed successfully!');
      console.log('📝 Transaction signature:', signature);

      // Verify swap completion (optional)
      try {
        const isVerified = await jupiterSwapService.verifySwapCompletion(
          signature,
          publicKey.toString(),
          quote.inputToken.address,
          quote.outputToken.address
        );
        
        if (isVerified) {
          console.log('✅ Swap completion verified');
        } else {
          console.log('⚠️ Could not verify swap completion, but transaction was successful');
        }
      } catch (verifyError) {
        console.warn('⚠️ Verification failed, but swap might be successful:', verifyError);
      }

     toast({
        title: 'Swap successfull',
        description: 'swap done',
      });

      return signature;
    } catch (err) {
      console.error('❌ Swap execution error:', err);
      let errorMessage = 'Swap failed';
      
      if (err instanceof Error) {
        if (err.message.includes('User rejected')) {
          errorMessage = 'Transaction was rejected by user';
        } else if (err.message.includes('Insufficient funds') || err.message.includes('insufficient lamports')) {
          errorMessage = 'Insufficient funds for transaction (including fees)';
        } else if (err.message.includes('Slippage tolerance exceeded')) {
          errorMessage = 'Price moved too much, try increasing slippage tolerance';
        } else if (err.message.includes('Transaction failed')) {
          errorMessage = 'Transaction failed on-chain, please try again';
        } else if (err.message.includes('Blockhash not found')) {
          errorMessage = 'Network congestion, please try again';
        } else if (err.message.includes('Transaction was not confirmed')) {
          errorMessage = 'Transaction timeout, please check your wallet and try again';
        } else {
          errorMessage = err.message;
        }
      }
      
      setError(errorMessage);
      
      toast({
        title: 'Swap Failed',
        description: errorMessage,
        variant: 'destructive',
      });

      return null;
    } finally {
      setIsLoading(false);
    }
  }, [publicKey, signTransaction, toast]);

  return {
    getQuote,
    executeSwap,
    isLoading,
    error,
  };
};