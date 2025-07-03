
interface DexScreenerToken {
  address: string;
  name: string;
  symbol: string;
}

interface DexScreenerPair {
  chainId: string;
  dexId: string;
  url: string;
  pairAddress: string;
  baseToken: DexScreenerToken;
  quoteToken: DexScreenerToken;
  priceNative: string;
  priceUsd: string;
  txns: {
    m5: { buys: number; sells: number };
    h1: { buys: number; sells: number };
    h6: { buys: number; sells: number };
    h24: { buys: number; sells: number };
  };
  volume: {
    h24: number;
    h6: number;
    h1: number;
    m5: number;
  };
  priceChange: {
    m5: number;
    h1: number;
    h6: number;
    h24: number;
  };
  liquidity?: {
    usd?: number;
    base: number;
    quote: number;
  };
  fdv?: number;
  marketCap?: number;
}

interface DexScreenerResponse {
  schemaVersion: string;
  pairs: DexScreenerPair[];
}

// Enhanced interface to match CoinCap format
interface CoinCapAsset {
  id: string;
  rank: string;
  symbol: string;
  name: string;
  supply: string;
  maxSupply: string | null;
  marketCapUsd: string;
  volumeUsd24Hr: string;
  priceUsd: string;
  changePercent24Hr: string;
  vwap24Hr: string;
}

// Token address mapping for DexScreener
const TOKEN_ADDRESSES: Record<string, { solana?: string; ethereum?: string }> = {
  SOL: {
    solana: 'So11111111111111111111111111111111111111112', // Wrapped SOL
  },
  USDC: {
    solana: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // USDC on Solana
    ethereum: '0xA0b86a33E6441E15d1d272b4FfC5fE5f4C8C0E16' // USDC on Ethereum
  },
  USDT: {
    solana: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB', // USDT on Solana
    ethereum: '0xdAC17F958D2ee523a2206206994597C13D831ec7' // USDT on Ethereum
  },
  BTC: {
    ethereum: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599' // WBTC on Ethereum
  },
  ETH: {
    ethereum: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2' // WETH on Ethereum
  }
};

// Mock price data as fallback
const MOCK_PRICE_DATA: Record<string, CoinCapAsset> = {
  BTC: {
    id: 'bitcoin',
    rank: '1',
    symbol: 'BTC',
    name: 'Bitcoin',
    supply: '19000000',
    maxSupply: '21000000',
    marketCapUsd: '800000000000',
    volumeUsd24Hr: '20000000000',
    priceUsd: '42000.00',
    changePercent24Hr: '2.5',
    vwap24Hr: '41800.00'
  },
  ETH: {
    id: 'ethereum',
    rank: '2',
    symbol: 'ETH',
    name: 'Ethereum',
    supply: '120000000',
    maxSupply: null,
    marketCapUsd: '300000000000',
    volumeUsd24Hr: '15000000000',
    priceUsd: '2500.00',
    changePercent24Hr: '1.8',
    vwap24Hr: '2480.00'
  },
  SOL: {
    id: 'solana',
    rank: '5',
    symbol: 'SOL',
    name: 'Solana',
    supply: '400000000',
    maxSupply: null,
    marketCapUsd: '40000000000',
    volumeUsd24Hr: '1000000000',
    priceUsd: '100.00',
    changePercent24Hr: '3.2',
    vwap24Hr: '98.50'
  },
  USDC: {
    id: 'usd-coin',
    rank: '6',
    symbol: 'USDC',
    name: 'USD Coin',
    supply: '50000000000',
    maxSupply: null,
    marketCapUsd: '50000000000',
    volumeUsd24Hr: '5000000000',
    priceUsd: '1.00',
    changePercent24Hr: '0.1',
    vwap24Hr: '1.00'
  },
  USDT: {
    id: 'tether',
    rank: '3',
    symbol: 'USDT',
    name: 'Tether',
    supply: '80000000000',
    maxSupply: null,
    marketCapUsd: '80000000000',
    volumeUsd24Hr: '30000000000',
    priceUsd: '1.00',
    changePercent24Hr: '-0.05',
    vwap24Hr: '1.00'
  }
};

interface PriceCache {
  data: CoinCapAsset;
  timestamp: number;
}

class PriceService {
  private baseUrl = 'https://api.dexscreener.com/latest/dex';
  private cache: Map<string, PriceCache> = new Map();
  private readonly CACHE_DURATION = 60000; // 1 minute in milliseconds
  private lastFetchTime: Map<string, number> = new Map();

  private shouldRefresh(symbol: string): boolean {
    const lastFetch = this.lastFetchTime.get(symbol) || 0;
    const now = Date.now();
    return now - lastFetch >= this.CACHE_DURATION;
  }

  private getCachedData(symbol: string): CoinCapAsset | null {
    const cached = this.cache.get(symbol);
    if (!cached) return null;
    
    const now = Date.now();
    if (now - cached.timestamp > this.CACHE_DURATION) {
      this.cache.delete(symbol);
      return null;
    }
    
    return cached.data;
  }

  private setCachedData(symbol: string, data: CoinCapAsset): void {
    this.cache.set(symbol, {
      data,
      timestamp: Date.now()
    });
    this.lastFetchTime.set(symbol, Date.now());
  }

  private getFallbackData(symbol: string): CoinCapAsset | null {
    const upperSymbol = symbol.toUpperCase();
    if (MOCK_PRICE_DATA[upperSymbol]) {
      console.log(`Using fallback data for ${symbol}`);
      return MOCK_PRICE_DATA[upperSymbol];
    }
    return null;
  }

  private convertDexScreenerToCoinCap(pair: DexScreenerPair): CoinCapAsset {
    const token = pair.baseToken;
    return {
      id: token.symbol.toLowerCase(),
      rank: '0',
      symbol: token.symbol,
      name: token.name,
      supply: '0',
      maxSupply: null,
      marketCapUsd: pair.marketCap?.toString() || '0',
      volumeUsd24Hr: pair.volume.h24.toString(),
      priceUsd: pair.priceUsd,
      changePercent24Hr: pair.priceChange.h24.toString(),
      vwap24Hr: pair.priceUsd
    };
  }

  async searchAssets(query: string): Promise<CoinCapAsset[]> {
    const upperQuery = query.toUpperCase();
    
    // Check cache first
    const cachedResults: CoinCapAsset[] = [];
    Object.keys(MOCK_PRICE_DATA).forEach(symbol => {
      if (symbol.includes(upperQuery) || MOCK_PRICE_DATA[symbol].name.toLowerCase().includes(query.toLowerCase())) {
        const cached = this.getCachedData(symbol);
        if (cached) {
          cachedResults.push(cached);
        }
      }
    });
    
    if (cachedResults.length > 0) {
      return cachedResults;
    }

    // Return fallback data that matches the query
    return Object.values(MOCK_PRICE_DATA).filter(asset => 
      asset.symbol.includes(upperQuery) || 
      asset.name.toLowerCase().includes(query.toLowerCase())
    );
  }

  async getAssetBySymbol(symbol: string): Promise<CoinCapAsset | null> {
    const upperSymbol = symbol.toUpperCase();
    
    // Check cache first to prevent flickering
    const cachedData = this.getCachedData(upperSymbol);
    if (cachedData && !this.shouldRefresh(upperSymbol)) {
      return cachedData;
    }

    try {
      const tokenAddress = TOKEN_ADDRESSES[upperSymbol];
      if (!tokenAddress?.solana) {
        console.log(`No address mapping for ${symbol}, using fallback`);
        const fallbackData = this.getFallbackData(upperSymbol);
        if (fallbackData) {
          this.setCachedData(upperSymbol, fallbackData);
        }
        return fallbackData;
      }

      const response = await fetch(
        `${this.baseUrl}/tokens/${tokenAddress.solana}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: DexScreenerResponse = await response.json();
      
      if (data.pairs && data.pairs.length > 0) {
        // Get the pair with highest liquidity
        const bestPair = data.pairs.reduce((best, current) => {
          const bestLiquidity = best.liquidity?.usd || 0;
          const currentLiquidity = current.liquidity?.usd || 0;
          return currentLiquidity > bestLiquidity ? current : best;
        });

        const asset = this.convertDexScreenerToCoinCap(bestPair);
        this.setCachedData(upperSymbol, asset);
        return asset;
      }

      throw new Error('No pairs found');
    } catch (error) {
      console.error(`Error getting asset by symbol from DexScreener, using fallback:`, error);
      const fallbackData = this.getFallbackData(upperSymbol);
      if (fallbackData) {
        this.setCachedData(upperSymbol, fallbackData);
      }
      return fallbackData;
    }
  }

  async getAssetById(id: string): Promise<CoinCapAsset | null> {
    // Try to find by ID in fallback data first
    const fallbackAsset = Object.values(MOCK_PRICE_DATA).find(asset => asset.id === id);
    if (fallbackAsset) {
      return this.getAssetBySymbol(fallbackAsset.symbol);
    }
    return null;
  }

  async getMultipleAssets(symbols: string[]): Promise<CoinCapAsset[]> {
    try {
      const promises = symbols.map(symbol => this.getAssetBySymbol(symbol));
      const results = await Promise.all(promises);
      return results.filter(asset => asset !== null) as CoinCapAsset[];
    } catch (error) {
      console.error('Error getting multiple assets, using fallback:', error);
      
      // Return fallback data for requested symbols
      return symbols
        .map(symbol => this.getFallbackData(symbol))
        .filter(asset => asset !== null) as CoinCapAsset[];
    }
  }

  // Clear cache method for manual refresh
  clearCache(): void {
    this.cache.clear();
    this.lastFetchTime.clear();
  }

  // Get cache info for debugging
  getCacheInfo(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

export const priceService = new PriceService();
export type { CoinCapAsset };
