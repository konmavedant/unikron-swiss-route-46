import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Token, ChainType } from '@/types';
import { useAccount } from 'wagmi';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';

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

// Real Solana balance fetching
const fetchSolanaBalance = async (
  token: Token,
  userAddress: string,
  connection: Connection
): Promise<{ balance: string; usdValue?: number }> => {
  try {
    const publicKey = new PublicKey(userAddress);
    
    // Native SOL balance
    if (token.symbol === 'SOL' || token.address === 'So11111111111111111111111111111111111111112') {
      const balance = await connection.getBalance(publicKey);
      const balanceInSol = balance / LAMPORTS_PER_SOL;
      return { 
        balance: balanceInSol.toFixed(6),
        usdValue: balanceInSol * 100 // Mock price, replace with real price API
      };
    }
    
    // SPL Token balance
    const tokenMint = new PublicKey(token.address);
    const tokenAccounts = await connection.getTokenAccountsByOwner(publicKey, {
      mint: tokenMint
    });

    if (tokenAccounts.value.length === 0) {
      return { balance: '0', usdValue: 0 };
    }

    const tokenAccount = tokenAccounts.value[0];
    const tokenBalance = await connection.getTokenAccountBalance(tokenAccount.pubkey);
    
    const balance = tokenBalance.value.uiAmount || 0;
    const mockPrice = token.symbol === 'USDC' || token.symbol === 'USDT' ? 1 : 2.5; // Mock prices
    
    return { 
      balance: balance.toFixed(6),
      usdValue: balance * mockPrice
    };
  } catch (error) {
    console.error('Error fetching Solana balance:', error);
    return { balance: '0', usdValue: 0 };
  }
};

// Mock EVM balance fetching (you can replace this with real EVM RPC calls)
const fetchEVMBalance = async (
  token: Token,
  userAddress: string,
  chainType: ChainType
): Promise<{ balance: string; usdValue?: number }> => {
  // This would be replaced with actual RPC calls to get real EVM balances
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Mock data for EVM - replace with real implementation
  const mockBalances: Record<string, string> = {
    'ETH': '2.5',
    'USDC': '1250.00',
    'USDT': '980.50',
    'WBTC': '0.05'
  };
  
  const balance = mockBalances[token.symbol] || '0.0';
  
  // Mock USD values
  const prices: Record<string, number> = {
    'ETH': 3000,
    'USDC': 1,
    'USDT': 1,
    'WBTC': 65000
  };
  const usdValue = parseFloat(balance) * (prices[token.symbol] || 1);
  
  return { balance, usdValue };
};

// Main balance fetching function
const fetchTokenBalance = async (
  token: Token,
  userAddress: string,
  chainType: ChainType,
  connection?: Connection
): Promise<{ balance: string; usdValue?: number }> => {
  if (chainType === 'solana' && connection) {
    return fetchSolanaBalance(token, userAddress, connection);
  } else if (chainType === 'evm') {
    return fetchEVMBalance(token, userAddress, chainType);
  }
  
  return { balance: '0', usdValue: 0 };
};

export const useTokenBalance = ({ token, chainType, enabled = true }: UseTokenBalanceProps): TokenBalance => {
  const { address: evmAddress, isConnected: evmConnected } = useAccount();
  const { publicKey: solanaAddress, connected: solanaConnected } = useWallet();
  const { connection } = useConnection();
  
  // Get the appropriate address based on chain type
  const userAddress = chainType === 'evm' 
    ? (evmConnected ? evmAddress : null)
    : (solanaConnected ? solanaAddress?.toBase58() : null);
  
  // Check if we have all required data
  const hasRequiredData = chainType === 'evm' 
    ? (!!token && !!userAddress && evmConnected)
    : (!!token && !!userAddress && solanaConnected && !!connection);
  
  const { data, isLoading, error } = useQuery({
    queryKey: ['tokenBalance', token?.address, userAddress, chainType],
    queryFn: () => fetchTokenBalance(token!, userAddress!, chainType, connection),
    enabled: enabled && hasRequiredData,
    refetchInterval: 10000, // Refetch every 10 seconds
    staleTime: 5000, // Consider data stale after 5 seconds
    retry: 2, // Retry failed requests
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
  const { address: evmAddress, isConnected: evmConnected } = useAccount();
  const { publicKey: solanaAddress, connected: solanaConnected } = useWallet();
  const { connection } = useConnection();
  
  const userAddress = chainType === 'evm' 
    ? (evmConnected ? evmAddress : null)
    : (solanaConnected ? solanaAddress?.toBase58() : null);
  
  const hasRequiredData = chainType === 'evm' 
    ? (!!userAddress && evmConnected)
    : (!!userAddress && solanaConnected && !!connection);
  
  const { data, isLoading, error } = useQuery({
    queryKey: ['tokenBalances', tokens.map(t => t.address), userAddress, chainType],
    queryFn: async () => {
      if (!userAddress) return [];
      
      const balances = await Promise.all(
        tokens.map(async (token) => {
          const result = await fetchTokenBalance(token, userAddress, chainType, connection);
          return {
            token,
            ...result,
          };
        })
      );
      
      return balances;
    },
    enabled: hasRequiredData && tokens.length > 0,
    refetchInterval: 10000,
    staleTime: 5000,
    retry: 2,
  });

  return {
    balances: data || [],
    isLoading,
    error: error?.message,
  };
};

// Helper function to get token account info for SPL tokens
export const getTokenAccountInfo = async (
  connection: Connection,
  walletAddress: string,
  tokenMintAddress: string
) => {
  try {
    const walletPublicKey = new PublicKey(walletAddress);
    const tokenMint = new PublicKey(tokenMintAddress);
    
    const tokenAccounts = await connection.getTokenAccountsByOwner(walletPublicKey, {
      mint: tokenMint
    });

    if (tokenAccounts.value.length === 0) {
      return null;
    }

    const tokenAccount = tokenAccounts.value[0];
    const tokenBalance = await connection.getTokenAccountBalance(tokenAccount.pubkey);
    
    return {
      address: tokenAccount.pubkey.toString(),
      balance: tokenBalance.value.uiAmount || 0,
      decimals: tokenBalance.value.decimals,
    };
  } catch (error) {
    console.error('Error getting token account info:', error);
    return null;
  }
};