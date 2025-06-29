import { useState, useCallback } from 'react';
import { UNIKRON_SWAP_ROUTER_ABI, SEPOLIA_ADDRESSES, getDeadline, parseUnits, formatUnits, calculateMinAmountOut, convertSlippageToBasicPoints } from '@/utils/contractUtils';

interface SwapParams {
  fromToken: string;
  toToken: string;
  amount: string;
  slippage?: number;
  recipient?: string;
}

interface CrossChainSwapParams extends SwapParams {
  targetChainId: number;
  targetAddress: string;
}

interface SwapQuoteResult {
  expectedAmountOut: string;
  minAmountOut: string;
  feeAmount: string;
  slippageBps: number;
  priceImpact: string;
}

export const useWeb3Contract = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  const executeSwap = useCallback(async (params: SwapParams) => {
    setLoading(true);
    setError(null);
    setTxHash(null);

    try {
      // Check if Web3 is available
      if (typeof (window as any).ethereum === 'undefined') {
        throw new Error('MetaMask or Web3 wallet not detected');
      }

      const ethereum = (window as any).ethereum;
      
      // Request account access
      const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
      const userAccount = accounts[0];

      // Check if we're on Sepolia
      const chainId = await ethereum.request({ method: 'eth_chainId' });
      if (chainId !== '0xaa36a7') { // Sepolia chain ID in hex
        throw new Error('Please switch to Sepolia testnet');
      }

      // Get contract instance
      const contractAddress = SEPOLIA_ADDRESSES.UNIKRON_SWAP_ROUTER;
      if (!contractAddress || contractAddress === '0x0000000000000000000000000000000000000000') {
        throw new Error('Contract not deployed yet. Please deploy the contract first.');
      }

      // Prepare transaction parameters with slippage
      const path = [params.fromToken, params.toToken];
      const amountIn = parseUnits(params.amount);
      const slippageBps = convertSlippageToBasicPoints(params.slippage || 2);
      const amountOutMin = parseUnits(calculateMinAmountOut(params.amount, params.slippage || 2));
      const to = params.recipient || userAccount;
      const deadline = getDeadline(20);

      console.log('Enhanced swap parameters:', {
        amountIn: amountIn.toString(),
        amountOutMin: amountOutMin.toString(),
        path,
        to,
        deadline: deadline.toString(),
        slippageBps,
        slippagePercent: params.slippage || 2
      });

      // For demo purposes, we'll simulate the enhanced swap
      // In production, you'd use the swapExactTokensForTokensWithSlippage function
      console.log('Would execute enhanced swap with slippage protection:', contractAddress);
      
      // Simulate transaction hash
      const simulatedTxHash = '0x' + Math.random().toString(16).substr(2, 64);
      setTxHash(simulatedTxHash);

      return {
        success: true,
        txHash: simulatedTxHash,
        message: `Swap initiated successfully with ${params.slippage || 2}% slippage protection (simulated)`
      };

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Swap failed';
      setError(errorMessage);
      console.error('Swap error:', err);
      return {
        success: false,
        error: errorMessage
      };
    } finally {
      setLoading(false);
    }
  }, []);

  const getQuoteWithSlippage = useCallback(async (
    fromToken: string, 
    toToken: string, 
    amount: string, 
    slippagePercent: number = 2
  ): Promise<SwapQuoteResult | null> => {
    try {
      if (!amount || parseFloat(amount) <= 0) {
        return null;
      }

      // Simulate getting enhanced quote from contract
      // In production, this would call getSwapQuoteWithSlippage
      const mockExchangeRate = Math.random() * 0.1 + 0.9; // Random rate between 0.9-1.0
      const expectedOutput = parseFloat(amount) * mockExchangeRate;
      const minOutput = expectedOutput * (1 - slippagePercent / 100);
      const feeAmount = parseFloat(amount) * 0.0025; // 0.25% fee
      const slippageBps = convertSlippageToBasicPoints(slippagePercent);
      
      // Calculate price impact (simplified)
      const priceImpact = ((expectedOutput - minOutput) / expectedOutput * 100).toFixed(2);

      console.log('Enhanced quote request:', { 
        fromToken, 
        toToken, 
        amount, 
        slippagePercent,
        expectedOutput,
        minOutput,
        feeAmount,
        slippageBps,
        priceImpact
      });

      return {
        expectedAmountOut: expectedOutput.toString(),
        minAmountOut: minOutput.toString(),
        feeAmount: feeAmount.toString(),
        slippageBps,
        priceImpact
      };
    } catch (err) {
      console.error('Quote error:', err);
      return null;
    }
  }, []);

  const executeCrossChainSwap = useCallback(async (params: CrossChainSwapParams) => {
    setLoading(true);
    setError(null);
    setTxHash(null);

    try {
      if (typeof (window as any).ethereum === 'undefined') {
        throw new Error('MetaMask or Web3 wallet not detected');
      }

      const ethereum = (window as any).ethereum;
      const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
      const userAccount = accounts[0];

      const chainId = await ethereum.request({ method: 'eth_chainId' });
      if (chainId !== '0xaa36a7') {
        throw new Error('Please switch to Sepolia testnet');
      }

      console.log('Cross-chain swap parameters:', {
        fromToken: params.fromToken,
        amount: params.amount,
        targetChainId: params.targetChainId,
        targetAddress: params.targetAddress,
        slippage: params.slippage
      });

      // For demo purposes, simulate cross-chain transaction
      const simulatedTxHash = '0x' + Math.random().toString(16).substr(2, 64);
      setTxHash(simulatedTxHash);

      return {
        success: true,
        txHash: simulatedTxHash,
        message: 'Cross-chain swap initiated successfully (simulated)'
      };

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Cross-chain swap failed';
      setError(errorMessage);
      console.error('Cross-chain swap error:', err);
      return {
        success: false,
        error: errorMessage
      };
    } finally {
      setLoading(false);
    }
  }, []);

  const getQuote = useCallback(async (fromToken: string, toToken: string, amount: string) => {
    try {
      if (!amount || parseFloat(amount) <= 0) {
        return null;
      }

      // Use the enhanced quote function with default 2% slippage
      const enhancedQuote = await getQuoteWithSlippage(fromToken, toToken, amount, 2);
      
      if (!enhancedQuote) return null;

      return {
        amountIn: amount,
        amountOut: enhancedQuote.expectedAmountOut,
        path: [fromToken, toToken],
        fee: enhancedQuote.feeAmount
      };
    } catch (err) {
      console.error('Quote error:', err);
      return null;
    }
  }, [getQuoteWithSlippage]);

  return {
    loading,
    error,
    txHash,
    executeSwap,
    executeCrossChainSwap,
    getQuote,
    getQuoteWithSlippage
  };
};
