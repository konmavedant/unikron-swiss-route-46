
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

interface CoinCapResponse {
  data: CoinCapAsset | CoinCapAsset[];
  timestamp: number;
}

// Mock price data as fallback when API fails
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

class PriceService {
  private baseUrl = 'https://api.coincap.io/v2';
  private apiKey = '3bf47ffbb40640d3f525cde946be11e5eb4a553fc525560d930fec818ad41338';
  private usesFallback = true; // Always use fallback for now

  private getFallbackData(symbol: string): CoinCapAsset | null {
    const upperSymbol = symbol.toUpperCase();
    if (MOCK_PRICE_DATA[upperSymbol]) {
      console.log(`Using mock data for ${symbol}`);
      return MOCK_PRICE_DATA[upperSymbol];
    }
    return null;
  }

  async searchAssets(query: string): Promise<CoinCapAsset[]> {
    console.log(`Searching assets for: ${query} (using mock data)`);
    
    // Return fallback data that matches the query
    const upperQuery = query.toUpperCase();
    return Object.values(MOCK_PRICE_DATA).filter(asset => 
      asset.symbol.includes(upperQuery) || 
      asset.name.toLowerCase().includes(query.toLowerCase())
    );
  }

  async getAssetBySymbol(symbol: string): Promise<CoinCapAsset | null> {
    console.log(`Getting asset by symbol: ${symbol} (using mock data)`);
    return this.getFallbackData(symbol);
  }

  async getAssetById(id: string): Promise<CoinCapAsset | null> {
    console.log(`Getting asset by ID: ${id} (using mock data)`);
    
    // Try to find by ID in fallback data
    const fallbackAsset = Object.values(MOCK_PRICE_DATA).find(asset => asset.id === id);
    return fallbackAsset || null;
  }

  async getMultipleAssets(symbols: string[]): Promise<CoinCapAsset[]> {
    console.log(`Getting multiple assets: ${symbols.join(', ')} (using mock data)`);
    
    // Return fallback data for requested symbols
    return symbols
      .map(symbol => this.getFallbackData(symbol))
      .filter(asset => asset !== null) as CoinCapAsset[];
  }
}

export const priceService = new PriceService();
export type { CoinCapAsset };
