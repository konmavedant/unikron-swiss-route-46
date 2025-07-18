// src/hooks/useTokenBalance.ts (Fixed)
import { useState, useEffect } from 'react';
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

// Fixed Solana balance fetching
const fetchSolanaBalance = async (
  token: Token,
  userAddress: string,
  connection: Connection
): Promise<{ balance: string; usdValue?: number }> => {
  try {
    const publicKey = new PublicKey(userAddress);

    // Native SOL balance
    if (token.symbol === 'SOL' || 
        token.address === 'So11111111111111111111111111111111111111112' ||
        token.address === '11111111111111111111111111111111') {
      
      console.log('Fetching SOL balance for:', userAddress);
      const balance = await connection.getBalance(publicKey);
      const balanceInSol = balance / LAMPORTS_PER_SOL;
      
      console.log('SOL Balance (lamports):', balance);
      console.log('SOL Balance (SOL):', balanceInSol);

      // Get real-time SOL price
      let usdValue = 0;
      try {
        const priceData = await priceService.getTokenPrice(token.address, 'solana');
        usdValue = priceData ? balanceInSol * priceData.price : 0;
      } catch (priceError) {
        console.warn('Failed to fetch SOL price:', priceError);
        // Use fallback price
        usdValue = balanceInSol * 100; // Approximate SOL price
      }

      return {
        balance: balanceInSol.toString(),
        usdValue
      };
    }

    // SPL Token balance
    try {
      const tokenMint = new PublicKey(token.address);
      
      // Get the associated token account
      const associatedTokenAccount = await getAssociatedTokenAddress(
        tokenMint,
        publicKey,
        false // allowOwnerOffCurve
      );

      console.log('Checking token account:', associatedTokenAccount.toString());

      // Check if the account exists and get balance
      try {
        const accountInfo = await getAccount(connection, associatedTokenAccount);
        const balance = Number(accountInfo.amount) / Math.pow(10, token.decimals);
        
        console.log(`${token.symbol} balance:`, balance);

        // Get real-time token price
        let usdValue = 0;
        try {
          const priceData = await priceService.getTokenPrice(token.address, 'solana');
          usdValue = priceData ? balance * priceData.price : 0;
        } catch (priceError) {
          console.warn(`Failed to fetch ${token.symbol} price:`, priceError);
        }

        return {
          balance: balance.toString(),
          usdValue
        };
      } catch (accountError) {
        console.log(`No ${token.symbol} token account found for user`);
        return { balance: '0', usdValue: 0 };
      }
    } catch (tokenError) {
      console.error(`Error fetching ${token.symbol} balance:`, tokenError);
      return { balance: '0', usdValue: 0 };
    }
  } catch (error) {
    console.error('Error fetching Solana balance:', error);
    return { balance: '0', usdValue: 0 };
  }
};

// Mock EVM balance fetching with real prices
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

  // Get real-time prices from DexScreener for EVM tokens
  let usdValue = 0;
  try {
    const priceData = await priceService.getTokenPrice(token.address, 'evm');
    usdValue = priceData ? parseFloat(balance) * priceData.price : 0;
  } catch (error) {
    console.error('Error fetching EVM token price:', error);
    // Fallback to mock prices only if price service fails
    const fallbackPrices: Record<string, number> = {
      'ETH': 3000,
      'USDC': 1,
      'USDT': 1,
      'WBTC': 65000
    };
    usdValue = parseFloat(balance) * (fallbackPrices[token.symbol] || 1);
  }

  return { balance, usdValue };
};

// Main balance fetching function
const fetchTokenBalance = async (
  token: Token,
  userAddress: string,
  chainType: ChainType,
  connection?: Connection
): Promise<{ balance: string; usdValue?: number }> => {
  console.log(`Fetching balance for ${token.symbol} on ${chainType}`, {
    token: token.address,
    userAddress,
    chainType
  });

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

  console.log('Balance fetch conditions:', {
    token: token?.symbol,
    userAddress,
    chainType,
    hasRequiredData,
    enabled,
    connected: chainType === 'evm' ? evmConnected : solanaConnected
  });

  // Change the refetchInterval from 30000 to 10000 for faster updates
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['tokenBalance', token?.address, userAddress, chainType],
    queryFn: () => {
      console.log('Query function called for balance fetch');
      return fetchTokenBalance(token!, userAddress!, chainType, connection);
    },
    enabled: enabled && hasRequiredData,
    refetchInterval: 10000, // 10 seconds
    staleTime: 5000, // 5 seconds
    retry: 2,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });

  // Manual refetch when conditions change
  useEffect(() => {
    if (hasRequiredData && enabled) {
      console.log('Conditions changed, refetching balance...');
      refetch();
    }
  }, [hasRequiredData, enabled, userAddress, token?.address, refetch]);

  console.log('Balance query result:', {
    balance: data?.balance,
    isLoading,
    error: error?.message,
    token: token?.symbol
  });

  return {
    token: token!,
    balance: data?.balance || '0',
    usdValue: data?.usdValue,
    isLoading: isLoading && enabled,
    error: error?.message,
  };
};

// Hook for multiple token balances with filtering
export const useTokenBalances = (tokens: Token[], chainType: ChainType, hideZeroBalances: boolean = true) => {
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
    queryKey: ['tokenBalances', tokens.map(t => t.address), userAddress, chainType, hideZeroBalances],
    queryFn: async () => {
      if (!userAddress) return [];

      console.log(`Fetching balances for ${tokens.length} tokens`);

      const balances = await Promise.allSettled(
        tokens.map(async (token) => {
          const result = await fetchTokenBalance(token, userAddress, chainType, connection);
          return {
            token,
            ...result,
          };
        })
      );

      const successfulBalances = balances
        .filter((result): result is PromiseFulfilledResult<any> => result.status === 'fulfilled')
        .map(result => result.value);

      // Filter out zero balances if requested
      if (hideZeroBalances) {
        return successfulBalances.filter(balance => {
          const balanceNum = parseFloat(balance.balance);
          return balanceNum > 0;
        });
      }

      return successfulBalances;
    },
    enabled: hasRequiredData && tokens.length > 0,
    refetchInterval: 30000, // Refetch every 30 seconds
    staleTime: 10000,
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
      console.log('Token account does not exist:', error);
      return null;
    }
  } catch (error) {
    console.error('Error getting token account info:', error);
    return null;
  }
};