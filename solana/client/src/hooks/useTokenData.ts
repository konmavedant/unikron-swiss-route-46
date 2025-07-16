import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { UnikronApiService } from '@/services/api';
import { ChainType, Token, TokenWithMetadata } from '@/types';
import { useWalletStore } from '@/store/wallet';

// Hook for fetching and managing token data
export function useTokenData(chainType: ChainType) {
  const { address, isConnected } = useWalletStore();

  // Mock tokens for development since API is not accessible
  const mockTokenList = [
    {
      address: "0x0000000000000000000000000000000000000000",
      symbol: "ETH",
      name: "Ethereum",
      decimals: 18,
      logoURI: "https://tokens.coingecko.com/ethereum/images/thumb_logo.png",
      verified: true,
      tags: ["native"]
    },
    {
      address: "0xA0b86a33E6417946484e81aBceBa82A3a34fc5db7",
      symbol: "USDC",
      name: "USD Coin",
      decimals: 6,
      logoURI: "https://tokens.coingecko.com/usd-coin/images/thumb_logo.png",
      verified: true,
      tags: ["stablecoin"]
    },
    {
      address: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
      symbol: "USDT",
      name: "Tether USD",
      decimals: 6,
      logoURI: "https://tokens.coingecko.com/tether/images/thumb_logo.png",
      verified: true,
      tags: ["stablecoin"]
    },
    {
      address: "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599",
      symbol: "WBTC",
      name: "Wrapped Bitcoin",
      decimals: 8,
      logoURI: "https://tokens.coingecko.com/wrapped-bitcoin/images/thumb_logo.png",
      verified: true,
      tags: ["wrapped"]
    }
  ];

  // Fetch token list with fallback to mock data
  const {
    data: tokens = mockTokenList,
    isLoading: isLoadingTokens,
    error: tokensError,
  } = useQuery({
    queryKey: ['tokens', chainType],
    queryFn: async () => {
      try {
        return await UnikronApiService.getTokens(chainType);
      } catch (error) {
        console.warn('API not available, using mock token data');
        return mockTokenList;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1, // Reduce retries since we have fallback
  });

  // Fetch token prices (optional)
  const tokenAddresses = useMemo(() => 
    tokens.slice(0, 50).map(token => token.address), // Limit to top 50 for performance
    [tokens]
  );

  const {
    data: tokenPrices,
    isLoading: isLoadingPrices,
  } = useQuery({
    queryKey: ['tokenPrices', chainType, tokenAddresses],
    queryFn: () => {
      if (tokenAddresses.length === 0) return {};
      // This would be implemented when price API is available
      return Promise.resolve({});
    },
    enabled: tokenAddresses.length > 0,
    staleTime: 30 * 1000, // 30 seconds
  });

  // Combine tokens with price data
  const tokensWithMetadata = useMemo((): TokenWithMetadata[] => {
    return tokens.map(token => ({
      ...token,
      priceUSD: tokenPrices?.[token.address]?.price || 0,
      priceChange24h: tokenPrices?.[token.address]?.priceChange24h || 0,
      volume24h: tokenPrices?.[token.address]?.volume24h || 0,
      marketCap: tokenPrices?.[token.address]?.marketCap || 0,
      verified: token.verified ?? true, // Assume verified if not specified
      isPopular: isPopularToken(token.symbol),
    }));
  }, [tokens, tokenPrices]);

  // Popular tokens (hardcoded for now, could come from API)
  const popularTokens = useMemo(() => 
    tokensWithMetadata.filter(token => token.isPopular),
    [tokensWithMetadata]
  );

  // Recent tokens from localStorage
  const recentTokens = useMemo(() => {
    try {
      const stored = localStorage.getItem(`recentTokens_${chainType}_${address}`);
      if (!stored) return [];
      
      const recentAddresses = JSON.parse(stored) as string[];
      return tokensWithMetadata.filter(token => 
        recentAddresses.includes(token.address)
      ).slice(0, 5);
    } catch {
      return [];
    }
  }, [tokensWithMetadata, chainType, address]);

  // Save recent token selection
  const addRecentToken = (token: Token) => {
    if (!address) return;
    
    try {
      const key = `recentTokens_${chainType}_${address}`;
      const stored = localStorage.getItem(key);
      const existing = stored ? JSON.parse(stored) : [];
      
      // Add to front, remove duplicates, limit to 10
      const updated = [
        token.address,
        ...existing.filter((addr: string) => addr !== token.address)
      ].slice(0, 10);
      
      localStorage.setItem(key, JSON.stringify(updated));
    } catch (error) {
      console.warn('Failed to save recent token:', error);
    }
  };

  return {
    tokens: tokensWithMetadata,
    popularTokens,
    recentTokens: isConnected ? recentTokens : [],
    isLoading: isLoadingTokens,
    isLoadingPrices,
    error: tokensError,
    addRecentToken,
  };
}

// Helper function to determine if a token is popular
function isPopularToken(symbol: string): boolean {
  const popularSymbols = [
    // EVM
    'ETH', 'WETH', 'USDC', 'USDT', 'DAI', 'WBTC', 'UNI', 'LINK', 'AAVE', 'COMP',
    // Solana  
    'SOL', 'USDC', 'USDT', 'RAY', 'SRM', 'FIDA', 'STEP', 'COPE', 'MEDIA', 'ROPE',
  ];
  
  return popularSymbols.includes(symbol.toUpperCase());
}