
import { useState, useEffect, useCallback } from 'react';
import { useBlockchain } from '@/contexts/BlockchainContext';
import { SOLANA_TOKENS } from '@/config/solana';
import { priceService } from '@/services/priceService';

interface Token {
  symbol: string;
  name: string;
  chain: string;
  icon: string;
  id?: string;
  address?: string;
  decimals?: number;
}

export const useMultiChainTokens = () => {
  const { selectedBlockchain, isEthereum, isSolana } = useBlockchain();
  const [tokens, setTokens] = useState<Token[]>([]);
  const [loading, setLoading] = useState(false);

  const ethereumTokens: Token[] = [
    { symbol: "ETH", name: "Ethereum", chain: "Ethereum", icon: "🔷", id: "ethereum" },
    { symbol: "USDT", name: "Tether", chain: "Ethereum", icon: "💚", id: "tether" },
    { symbol: "USDC", name: "USD Coin", chain: "Ethereum", icon: "💵", id: "usd-coin" },
    { symbol: "WBTC", name: "Wrapped Bitcoin", chain: "Ethereum", icon: "₿", id: "wrapped-bitcoin" },
    { symbol: "UNI", name: "Uniswap", chain: "Ethereum", icon: "🦄", id: "uniswap" },
    { symbol: "LINK", name: "Chainlink", chain: "Ethereum", icon: "🔗", id: "chainlink" },
  ];

  const solanaTokens: Token[] = [
    { 
      symbol: "SOL", 
      name: "Solana", 
      chain: "Solana", 
      icon: "🌞", 
      id: "solana",
      address: SOLANA_TOKENS.SOL.address,
      decimals: SOLANA_TOKENS.SOL.decimals
    },
    { 
      symbol: "USDC", 
      name: "USD Coin", 
      chain: "Solana", 
      icon: "💵", 
      id: "usd-coin",
      address: SOLANA_TOKENS.USDC.address,
      decimals: SOLANA_TOKENS.USDC.decimals
    },
    { symbol: "USDT", name: "Tether", chain: "Solana", icon: "💚", id: "tether" },
    { symbol: "RAY", name: "Raydium", chain: "Solana", icon: "⚡", id: "raydium" },
    { symbol: "SRM", name: "Serum", chain: "Solana", icon: "🔥", id: "serum" },
  ];

  const loadTokens = useCallback(async () => {
    setLoading(true);
    try {
      const tokenList = isEthereum ? ethereumTokens : solanaTokens;
      setTokens(tokenList);
    } catch (error) {
      console.error('Error loading tokens:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedBlockchain, isEthereum, isSolana]);

  useEffect(() => {
    loadTokens();
  }, [loadTokens]);

  const getTokensByChain = useCallback((chain: string) => {
    return tokens.filter(token => token.chain.toLowerCase() === chain.toLowerCase());
  }, [tokens]);

  const searchTokens = useCallback(async (query: string) => {
    if (query.length < 2) return [];
    
    try {
      const searchResults = await priceService.searchAssets(query);
      return searchResults.map(asset => ({
        symbol: asset.symbol,
        name: asset.name,
        chain: isEthereum ? 'Ethereum' : 'Solana',
        icon: '🪙',
        id: asset.id
      }));
    } catch (error) {
      console.error('Error searching tokens:', error);
      return [];
    }
  }, [isEthereum, isSolana]);

  return {
    tokens,
    loading,
    loadTokens,
    getTokensByChain,
    searchTokens,
    selectedBlockchain,
    isEthereum,
    isSolana
  };
};
