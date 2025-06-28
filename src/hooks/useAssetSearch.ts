
import { useState, useCallback } from 'react';
import { priceService, CoinCapAsset } from '@/services/priceService';

export const useAssetSearch = () => {
  const [results, setResults] = useState<CoinCapAsset[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchAssets = useCallback(async (query: string) => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const assets = await priceService.searchAssets(query);
      setResults(assets);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
      console.error('Error searching assets:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const clearResults = useCallback(() => {
    setResults([]);
    setError(null);
  }, []);

  return {
    results,
    loading,
    error,
    searchAssets,
    clearResults
  };
};
