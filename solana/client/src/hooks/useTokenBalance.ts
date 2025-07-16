import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Token, ChainType } from '@/types';
import { useAccount } from 'wagmi';
import { useWallet } from '@solana/wallet-adapter-react';

interface TokenBalance {
  token: Token;
  balance: string;
  usdValue?: number;
  isLoading: boolean;
  error?: string;
}

interface UseTokenBalanceProps {
  token: Token | null;
  chainType: ChainType;
  enabled?: boolean;
}

// Mock balance fetching - replace with actual implementation
const fetchTokenBalance = async (
  token: Token,
  userAddress: string,
  chainType: ChainType
): Promise<{ balance: string; usdValue?: number }> => {
  // This would be replaced with actual RPC calls
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Mock data
  const mockBalances: Record<string, string> = {
    ETH: '2.5',
    USDC: '1250.00',
    SOL: '15.7',
    USDT: '980.50'
  };
  
  const balance = mockBalances[token.symbol] || '0.0';
  const usdValue = parseFloat(balance) * (token.symbol === 'ETH' ? 3000 : token.symbol === 'SOL' ? 100 : 1);
  
  return { balance, usdValue };
};

export const useTokenBalance = ({ token, chainType, enabled = true }: UseTokenBalanceProps): TokenBalance => {
  const { address: evmAddress } = useAccount();
  const { publicKey } = useWallet();
  
  const userAddress = chainType === 'evm' ? evmAddress : publicKey?.toBase58();
  
  const { data, isLoading, error } = useQuery({
    queryKey: ['tokenBalance', token?.address, userAddress, chainType],
    queryFn: () => fetchTokenBalance(token!, userAddress!, chainType),
    enabled: enabled && !!token && !!userAddress,
    refetchInterval: 10000, // Refetch every 10 seconds
    staleTime: 5000, // Consider data stale after 5 seconds
  });

  return {
    token: token!,
    balance: data?.balance || '0.0',
    usdValue: data?.usdValue,
    isLoading: isLoading && enabled,
    error: error?.message,
  };
};

// Hook for multiple token balances
export const useTokenBalances = (tokens: Token[], chainType: ChainType) => {
  const { address: evmAddress } = useAccount();
  const { publicKey } = useWallet();
  
  const userAddress = chainType === 'evm' ? evmAddress : publicKey?.toBase58();
  
  const { data, isLoading, error } = useQuery({
    queryKey: ['tokenBalances', tokens.map(t => t.address), userAddress, chainType],
    queryFn: async () => {
      if (!userAddress) return [];
      
      const balances = await Promise.all(
        tokens.map(async (token) => {
          const result = await fetchTokenBalance(token, userAddress, chainType);
          return {
            token,
            ...result,
          };
        })
      );
      
      return balances;
    },
    enabled: !!userAddress && tokens.length > 0,
    refetchInterval: 10000,
    staleTime: 5000,
  });

  return {
    balances: data || [],
    isLoading,
    error: error?.message,
  };
};