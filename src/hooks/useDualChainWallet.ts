
import { useState, useCallback, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { useSolanaWallet } from './useSolanaWallet';
import { useWeb3Contract } from './useWeb3Contract';
import type { BlockchainType } from '@/components/BlockchainSelector';

interface DualChainSwapParams {
  blockchain: BlockchainType;
  fromToken: string;
  toToken: string;
  amount: string;
  slippage?: number;
  recipient?: string;
}

export const useDualChainWallet = () => {
  const [selectedBlockchain, setSelectedBlockchain] = useState<BlockchainType>('ethereum');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Ethereum hooks
  const { isConnected: ethConnected } = useAccount();
  const ethContract = useWeb3Contract();

  // Solana hooks
  const solanaWallet = useSolanaWallet();

  // Combined connection status
  const isConnected = selectedBlockchain === 'ethereum' ? ethConnected : solanaWallet.isConnected;

  const executeSwap = useCallback(async (params: DualChainSwapParams) => {
    setLoading(true);
    setError(null);

    try {
      if (params.blockchain === 'ethereum') {
        return await ethContract.executeSwap({
          fromToken: params.fromToken,
          toToken: params.toToken,
          amount: params.amount,
          slippage: params.slippage,
          recipient: params.recipient
        });
      } else {
        return await solanaWallet.executeSwap({
          fromToken: params.fromToken,
          toToken: params.toToken,
          amount: params.amount,
          slippage: params.slippage,
          recipient: params.recipient
        });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Swap failed';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [ethContract, solanaWallet]);

  const getQuote = useCallback(async (fromToken: string, toToken: string, amount: string) => {
    if (selectedBlockchain === 'ethereum') {
      return await ethContract.getQuote(fromToken, toToken, amount);
    } else {
      return await solanaWallet.getQuote(fromToken, toToken, amount);
    }
  }, [selectedBlockchain, ethContract, solanaWallet]);

  const getBalance = useCallback(async (tokenAddress?: string) => {
    if (selectedBlockchain === 'solana') {
      return await solanaWallet.getBalance(tokenAddress);
    }
    // For Ethereum, you'd implement balance fetching here
    return 0;
  }, [selectedBlockchain, solanaWallet]);

  return {
    selectedBlockchain,
    setSelectedBlockchain,
    isConnected,
    loading: loading || ethContract.loading || solanaWallet.loading,
    error: error || ethContract.error || solanaWallet.error,
    executeSwap,
    getQuote,
    getBalance,
    // Expose individual wallet states
    ethereum: {
      connected: ethConnected,
      loading: ethContract.loading,
      error: ethContract.error,
      txHash: ethContract.txHash
    },
    solana: {
      connected: solanaWallet.isConnected,
      loading: solanaWallet.loading,
      error: solanaWallet.error,
      signature: solanaWallet.txSignature,
      publicKey: solanaWallet.publicKey
    }
  };
};
