// src/hooks/useTokenBalance.ts (Fixed - No Repeated Calls)
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Token, ChainType } from '@/types';
import { useAccount } from 'wagmi';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID, getAssociatedTokenAddress, getAccount } from '@solana/spl-token';
import { priceService } from '@/services/priceService';

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

// Cache to prevent duplicate calls
const balanceCache = new Map();
const lastFetchTime = new Map();
const CACHE_DURATION = 30000; // 30 seconds

// Fixed Solana balance fetching with caching
const fetchSolanaBalance = async (
  token: Token,
  userAddress: string,
  connection: Connection
): Promise<{ balance: string; usdValue?: number }> => {
  const cacheKey = `${token.address}-${userAddress}-solana`;
  const now = Date.now();
  
  // Check cache first
  const lastFetch = lastFetchTime.get(cacheKey);
  const cachedData = balanceCache.get(cacheKey);
  
  if (lastFetch && cachedData && (now - lastFetch) < CACHE_DURATION) {
    console.log('Returning cached balance for', token.symbol);
    return cachedData;
  }

  console.log('Fetching fresh balance for', token.symbol);

  try {
    const publicKey = new PublicKey(userAddress);

    // Native SOL balance
    if (token.symbol === 'SOL' || 
        token.address === 'So11111111111111111111111111111111111111112' ||
        token.address === '11111111111111111111111111111111') {
      
      const balance = await connection.getBalance(publicKey);
      const balanceInSol = balance / LAMPORTS_PER_SOL;

      // Get real-time SOL price
      let usdValue = 0;
      try {
        const priceData = await priceService.getTokenPrice(token.address, 'solana');
        usdValue = priceData ? balanceInSol * priceData.price : 0;
      } catch (priceError) {
        console.warn('Failed to fetch SOL price:', priceError);
        usdValue = balanceInSol * 100; // Approximate SOL price
      }

      const result = {
        balance: balanceInSol.toFixed(6),
        usdValue
      };

      // Cache the result
      balanceCache.set(cacheKey, result);
      lastFetchTime.set(cacheKey, now);

      return result;
    }

    // SPL Token balance
    try {
      const tokenMint = new PublicKey(token.address);
      
      const associatedTokenAccount = await getAssociatedTokenAddress(
        tokenMint,
        publicKey,
        false
      );

      try {
        const accountInfo = await getAccount(connection, associatedTokenAccount);
        const balance = Number(accountInfo.amount) / Math.pow(10, token.decimals);

        let usdValue = 0;
        try {
          const priceData = await priceService.getTokenPrice(token.address, 'solana');
          usdValue = priceData ? balance * priceData.price : 0;
        } catch (priceError) {
          console.warn(`Failed to fetch ${token.symbol} price:`, priceError);
        }

        const result = {
          balance: balance.toFixed(token.decimals > 6 ? 6 : token.decimals),
          usdValue
        };

        // Cache the result
        balanceCache.set(cacheKey, result);
        lastFetchTime.set(cacheKey, now);

        return result;
      } catch (accountError) {
        const result = { balance: '0', usdValue: 0 };
        balanceCache.set(cacheKey, result);
        lastFetchTime.set(cacheKey, now);
        return result;
      }
    } catch (tokenError) {
      console.error(`Error fetching ${token.symbol} balance:`, tokenError);
      const result = { balance: '0', usdValue: 0 };
      balanceCache.set(cacheKey, result);
      lastFetchTime.set(cacheKey, now);
      return result;
    }
  } catch (error) {
    console.error('Error fetching Solana balance:', error);
    const result = { balance: '0', usdValue: 0 };
    balanceCache.set(cacheKey, result);
    lastFetchTime.set(cacheKey, now);
    return result;
  }
};

// Mock EVM balance fetching with caching
const fetchEVMBalance = async (
  token: Token,
  userAddress: string,
  chainType: ChainType
): Promise<{ balance: string; usdValue?: number }> => {
  const cacheKey = `${token.address}-${userAddress}-evm`;
  const now = Date.now();
  
  // Check cache first
  const lastFetch = lastFetchTime.get(cacheKey);
  const cachedData = balanceCache.get(cacheKey);
  
  if (lastFetch && cachedData && (now - lastFetch) < CACHE_DURATION) {
    console.log('Returning cached EVM balance for', token.symbol);
    return cachedData;
  }

  console.log('Fetching fresh EVM balance for', token.symbol);

  await new Promise(resolve => setTimeout(resolve, 500));

  const mockBalances: Record<string, string> = {
    'ETH': '2.5',
    'USDC': '1250.00',
    'USDT': '980.50',
    'WBTC': '0.05'
  };

  const balance = mockBalances[token.symbol] || '0.0';

  let usdValue = 0;
  try {
    const priceData = await priceService.getTokenPrice(token.address, 'evm');
    usdValue = priceData ? parseFloat(balance) * priceData.price : 0;
  } catch (error) {
    console.error('Error fetching EVM token price:', error);
    const fallbackPrices: Record<string, number> = {
      'ETH': 3000,
      'USDC': 1,
      'USDT': 1,
      'WBTC': 65000
    };
    usdValue = parseFloat(balance) * (fallbackPrices[token.symbol] || 1);
  }

  const result = { balance, usdValue };
  
  // Cache the result
  balanceCache.set(cacheKey, result);
  lastFetchTime.set(cacheKey, now);

  return result;
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
  const lastQueryRef = useRef<string>('');

  // Get user address based on chain type
  const userAddress = useMemo(() => {
    if (chainType === 'evm') {
      return evmConnected ? evmAddress : null;
    } else {
      return solanaConnected ? solanaAddress?.toBase58() : null;
    }
  }, [chainType, evmConnected, evmAddress, solanaConnected, solanaAddress]);

  // Check if we have required data
  const hasRequiredData = useMemo(() => {
    if (!token || !userAddress) return false;
    
    if (chainType === 'evm') {
      return evmConnected;
    } else {
      return solanaConnected && !!connection;
    }
  }, [token, userAddress, chainType, evmConnected, solanaConnected, connection]);

  // Create stable query key
  const queryKey = useMemo(() => {
    if (!token || !userAddress) return ['tokenBalance', 'disabled'];
    return ['tokenBalance', token.address, userAddress, chainType];
  }, [token?.address, userAddress, chainType]);

  // Track if query key changed to prevent duplicate calls
  const currentQueryKey = JSON.stringify(queryKey);
  const shouldFetch = currentQueryKey !== lastQueryRef.current && hasRequiredData && enabled;
  
  if (shouldFetch) {
    lastQueryRef.current = currentQueryKey;
  }

  const { data, isLoading, error } = useQuery({
    queryKey,
    queryFn: async () => {
      if (!token || !userAddress) {
        throw new Error('Missing required parameters');
      }
      
      console.log(`Fetching balance for ${token.symbol} - ${userAddress.slice(0, 8)}...`);
      return fetchTokenBalance(token, userAddress, chainType, connection);
    },
    enabled: hasRequiredData && enabled,
    staleTime: CACHE_DURATION, // 30 seconds
    gcTime: CACHE_DURATION * 2, // 60 seconds
    refetchInterval: false, // Disable automatic refetching
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    retry: false, // Disable retries to prevent repeated calls
  });

  return {
    token: token!,
    balance: data?.balance || '0',
    usdValue: data?.usdValue,
    isLoading: isLoading && enabled,
    error: error?.message,
  };
};

// Simplified hook for multiple token balances
export const useTokenBalances = (tokens: Token[], chainType: ChainType, hideZeroBalances: boolean = true) => {
  const { address: evmAddress, isConnected: evmConnected } = useAccount();
  const { publicKey: solanaAddress, connected: solanaConnected } = useWallet();
  const { connection } = useConnection();

  const userAddress = useMemo(() => {
    if (chainType === 'evm') {
      return evmConnected ? evmAddress : null;
    } else {
      return solanaConnected ? solanaAddress?.toBase58() : null;
    }
  }, [chainType, evmConnected, evmAddress, solanaConnected, solanaAddress]);

  const hasRequiredData = useMemo(() => {
    if (!userAddress || tokens.length === 0) return false;
    
    if (chainType === 'evm') {
      return evmConnected;
    } else {
      return solanaConnected && !!connection;
    }
  }, [userAddress, tokens.length, chainType, evmConnected, solanaConnected, connection]);

  const queryKey = useMemo(() => {
    if (!userAddress) return ['tokenBalances', 'disabled'];
    return [
      'tokenBalances',
      tokens.map(t => t.address).sort().join(','),
      userAddress,
      chainType,
      hideZeroBalances
    ];
  }, [tokens, userAddress, chainType, hideZeroBalances]);

  const { data, isLoading, error } = useQuery({
    queryKey,
    queryFn: async () => {
      if (!userAddress) return [];

      console.log(`Fetching balances for ${tokens.length} tokens`);

      // Process tokens sequentially to avoid overwhelming the RPC
      const results = [];
      for (const token of tokens) {
        try {
          const result = await fetchTokenBalance(token, userAddress, chainType, connection);
          results.push({
            token,
            ...result,
          });
        } catch (error) {
          console.error(`Error fetching balance for ${token.symbol}:`, error);
          results.push({
            token,
            balance: '0',
            usdValue: 0,
          });
        }
        
        // Small delay between requests to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Filter zero balances if requested
      if (hideZeroBalances) {
        return results.filter(balance => parseFloat(balance.balance) > 0.000001);
      }

      return results;
    },
    enabled: hasRequiredData,
    staleTime: CACHE_DURATION,
    gcTime: CACHE_DURATION * 2,
    refetchInterval: false,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    retry: false,
  });

  return {
    balances: data || [],
    isLoading,
    error: error?.message,
  };
};

// Helper function to manually refresh balances (call this when needed)
export const refreshBalances = () => {
  balanceCache.clear();
  lastFetchTime.clear();
  console.log('Balance cache cleared');
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

    const associatedTokenAccount = await getAssociatedTokenAddress(
      tokenMint,
      walletPublicKey,
      false
    );

    try {
      const accountInfo = await getAccount(connection, associatedTokenAccount);
      return {
        address: associatedTokenAccount.toString(),
        balance: Number(accountInfo.amount),
        decimals: accountInfo.mint,
      };
    } catch (error) {
      console.error('Token account does not exist:', error);
      return null;
    }
  } catch (error) {
    console.error('Error getting token account info:', error);
    return null;
  }
};