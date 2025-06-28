
import { useState, useCallback } from 'react';
import { UNIKRON_SWAP_ROUTER_ABI, SEPOLIA_ADDRESSES, getDeadline, parseUnits, formatUnits, calculateMinAmountOut } from '@/utils/contractUtils';

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

      // Get contract instance (using ethers.js would be better, but for demo purposes)
      const contractAddress = SEPOLIA_ADDRESSES.UNIKRON_SWAP_ROUTER;
      if (!contractAddress || contractAddress === '0x') {
        throw new Error('Contract not deployed yet. Please deploy the contract first.');
      }

      // Prepare transaction parameters
      const path = [params.fromToken, params.toToken];
      const amountIn = parseUnits(params.amount);
      const amountOutMin = parseUnits(calculateMinAmountOut(params.amount, params.slippage || 2));
      const to = params.recipient || userAccount;
      const deadline = getDeadline(20);

      // Encode function call
      const functionSignature = 'swapExactTokensForTokens(uint256,uint256,address[],address,uint256)';
      
      console.log('Swap parameters:', {
        amountIn: amountIn.toString(),
        amountOutMin: amountOutMin.toString(),
        path,
        to,
        deadline
      });

      // For demo purposes, we'll just log the transaction
      // In production, you'd use ethers.js or web3.js to actually execute
      console.log('Would execute swap with contract:', contractAddress);
      
      // Simulate transaction hash
      const simulatedTxHash = '0x' + Math.random().toString(16).substr(2, 64);
      setTxHash(simulatedTxHash);

      return {
        success: true,
        txHash: simulatedTxHash,
        message: 'Swap initiated successfully (simulated)'
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
        targetAddress: params.targetAddress
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

      // Simulate getting quote from contract
      // In production, this would call the contract's getSwapQuote function
      const mockExchangeRate = Math.random() * 0.1 + 0.9; // Random rate between 0.9-1.0
      const estimatedOutput = (parseFloat(amount) * mockExchangeRate).toString();

      console.log('Quote request:', { fromToken, toToken, amount, estimatedOutput });

      return {
        amountIn: amount,
        amountOut: estimatedOutput,
        path: [fromToken, toToken],
        fee: (parseFloat(amount) * 0.0025).toString() // 0.25% fee
      };
    } catch (err) {
      console.error('Quote error:', err);
      return null;
    }
  }, []);

  return {
    loading,
    error,
    txHash,
    executeSwap,
    executeCrossChainSwap,
    getQuote
  };
};
