
import { useState, useEffect, useCallback, useRef } from 'react';
import { priceService, CoinCapAsset } from '@/services/priceService';

interface PriceData {
  [symbol: string]: {
    price: number;
    change24h: number;
    lastUpdated: number;
    asset: CoinCapAsset;
    liquidity?: {
      usd: number;
      base: number;
      quote: number;
    };
    volume?: {
      h1: number;
      h24: number;
    };
    txns?: {
      h1: { buys: number; sells: number };
      h24: { buys: number; sells: number };
    };
  };
}

const PRICE_CACHE_DURATION = 30000; // 30 seconds
const globalPriceCache = new Map<string, { data: PriceData[string], timestamp: number }>();

export const usePrices = (symbols: string[] = []) => {
  const [prices, setPrices] = useState<PriceData>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastFetchRef = useRef<number>(0);

  const fetchPrices = useCallback(async (symbolsToFetch: string[], force = false) => {
    if (symbolsToFetch.length === 0) return;

    const now = Date.now();
    
    // Check if we should skip fetching based on cache
    if (!force && now - lastFetchRef.current < PRICE_CACHE_DURATION) {
      // Use cached data if available
      const cachedPrices: PriceData = {};
      let hasValidCache = true;
      
      for (const symbol of symbolsToFetch) {
        const cached = globalPriceCache.get(symbol);
        if (cached && now - cached.timestamp < PRICE_CACHE_DURATION) {
          cachedPrices[symbol] = cached.data;
        } else {
          hasValidCache = false;
          break;
        }
      }
      
      if (hasValidCache && Object.keys(cachedPrices).length > 0) {
        setPrices(prev => ({ ...prev, ...cachedPrices }));
        return;
      }
    }

    setLoading(true);
    setError(null);
    lastFetchRef.current = now;

    try {
      const assets = await priceService.getMultipleAssets(symbolsToFetch);
      const newPrices: PriceData = {};

      assets.forEach(asset => {
        const priceData = {
          price: parseFloat(asset.priceUsd),
          change24h: parseFloat(asset.changePercent24Hr),
          lastUpdated: now,
          asset: asset,
          liquidity: asset.liquidity,
          volume: asset.volume,
          txns: asset.txns
        };
        
        newPrices[asset.symbol] = priceData;
        // Update global cache
        globalPriceCache.set(asset.symbol, { data: priceData, timestamp: now });
      });

      setPrices(prev => ({ ...prev, ...newPrices }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch prices');
      console.error('Error fetching prices:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch and setup interval
  useEffect(() => {
    if (symbols.length === 0) return;

    // Clear existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    // Initial fetch
    fetchPrices(symbols);

    // Set up interval for subsequent fetches
    intervalRef.current = setInterval(() => {
      fetchPrices(symbols, true);
    }, PRICE_CACHE_DURATION);

    // Cleanup interval on unmount or dependency change
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [symbols.join(','), fetchPrices]); // Use symbols.join(',') to avoid infinite re-renders

  const refreshPrices = useCallback(() => {
    fetchPrices(symbols, true);
  }, [symbols, fetchPrices]);

  const getPriceData = useCallback((symbol: string) => {
    return prices[symbol] || null;
  }, [prices]);

  const getLiquidityInfo = useCallback((symbol: string) => {
    const priceData = prices[symbol];
    return priceData?.liquidity || null;
  }, [prices]);

  const getVolumeInfo = useCallback((symbol: string) => {
    const priceData = prices[symbol];
    return priceData?.volume || null;
  }, [prices]);

  const getTradingActivity = useCallback((symbol: string) => {
    const priceData = prices[symbol];
    return priceData?.txns || null;
  }, [prices]);

  return {
    prices,
    loading,
    error,
    refreshPrices,
    getPriceData,
    getLiquidityInfo,
    getVolumeInfo,
    getTradingActivity,
    fetchPrices
  };
};
