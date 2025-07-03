
import { useState, useEffect, useCallback, useRef } from 'react';
import { priceService, CoinCapAsset } from '@/services/priceService';

interface PriceData {
  [symbol: string]: {
    price: number;
    change24h: number;
    lastUpdated: number;
    asset: CoinCapAsset;
  };
}

export const usePrices = (symbols: string[] = []) => {
  const [prices, setPrices] = useState<PriceData>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lastFetchRef = useRef<{ [symbol: string]: number }>({});
  const fetchTimeoutRef = useRef<NodeJS.Timeout>();

  const REFRESH_INTERVAL = 60000; // 1 minute

  const fetchPrices = useCallback(async (symbolsToFetch: string[], forceRefresh = false) => {
    if (symbolsToFetch.length === 0) return;

    const now = Date.now();
    const symbolsToUpdate = forceRefresh 
      ? symbolsToFetch 
      : symbolsToFetch.filter(symbol => {
          const lastFetch = lastFetchRef.current[symbol] || 0;
          return now - lastFetch >= REFRESH_INTERVAL;
        });

    if (symbolsToUpdate.length === 0) return;

    // Only show loading for first fetch or force refresh
    const isFirstFetch = symbolsToUpdate.some(symbol => !lastFetchRef.current[symbol]);
    if (isFirstFetch || forceRefresh) {
      setLoading(true);
    }
    
    setError(null);

    try {
      console.log(`Fetching prices for: ${symbolsToUpdate.join(', ')}`);
      const assets = await priceService.getMultipleAssets(symbolsToUpdate);
      const newPrices: Partial<PriceData> = {};

      assets.forEach(asset => {
        newPrices[asset.symbol] = {
          price: parseFloat(asset.priceUsd),
          change24h: parseFloat(asset.changePercent24Hr),
          lastUpdated: now,
          asset: asset
        };
        lastFetchRef.current[asset.symbol] = now;
      });

      // Update prices without causing flickering
      setPrices(prev => ({ ...prev, ...newPrices }));
      console.log(`Updated prices for: ${Object.keys(newPrices).join(', ')}`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch prices';
      setError(errorMessage);
      console.error('Error fetching prices:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Set up automatic refresh
  useEffect(() => {
    if (symbols.length > 0) {
      // Initial fetch
      fetchPrices(symbols);

      // Set up interval for automatic refresh
      const intervalId = setInterval(() => {
        fetchPrices(symbols);
      }, REFRESH_INTERVAL);

      return () => {
        clearInterval(intervalId);
        if (fetchTimeoutRef.current) {
          clearTimeout(fetchTimeoutRef.current);
        }
      };
    }
  }, [symbols, fetchPrices]);

  const refreshPrices = useCallback(() => {
    console.log('Manual refresh requested');
    fetchPrices(symbols, true);
  }, [symbols, fetchPrices]);

  const getPriceData = useCallback((symbol: string) => {
    return prices[symbol] || null;
  }, [prices]);

  // Check if data is stale (older than refresh interval)
  const isDataStale = useCallback((symbol: string) => {
    const priceData = prices[symbol];
    if (!priceData) return true;
    
    const now = Date.now();
    return now - priceData.lastUpdated > REFRESH_INTERVAL;
  }, [prices]);

  return {
    prices,
    loading,
    error,
    refreshPrices,
    getPriceData,
    fetchPrices,
    isDataStale,
    cacheInfo: priceService.getCacheInfo()
  };
};
