
import { useState, useEffect, useCallback } from 'react';
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

  const fetchPrices = useCallback(async (symbolsToFetch: string[]) => {
    if (symbolsToFetch.length === 0) return;

    setLoading(true);
    setError(null);

    try {
      const assets = await priceService.getMultipleAssets(symbolsToFetch);
      const newPrices: PriceData = {};

      assets.forEach(asset => {
        newPrices[asset.symbol] = {
          price: parseFloat(asset.priceUsd),
          change24h: parseFloat(asset.changePercent24Hr),
          lastUpdated: Date.now(),
          asset: asset
        };
      });

      setPrices(prev => ({ ...prev, ...newPrices }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch prices');
      console.error('Error fetching prices:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (symbols.length > 0) {
      fetchPrices(symbols);
    }
  }, [symbols, fetchPrices]);

  const refreshPrices = useCallback(() => {
    fetchPrices(symbols);
  }, [symbols, fetchPrices]);

  const getPriceData = useCallback((symbol: string) => {
    return prices[symbol] || null;
  }, [prices]);

  return {
    prices,
    loading,
    error,
    refreshPrices,
    getPriceData,
    fetchPrices
  };
};
