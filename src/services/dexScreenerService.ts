
export interface DexScreenerPair {
  chainId: string;
  dexId: string;
  url: string;
  pairAddress: string;
  baseToken: {
    address: string;
    name: string;
    symbol: string;
  };
  quoteToken: {
    address: string;
    name: string;
    symbol: string;
  };
  priceNative: string;
  priceUsd?: string;
  txns: {
    m5: { buys: number; sells: number };
    h1: { buys: number; sells: number };
    h6: { buys: number; sells: number };
    h24: { buys: number; sells: number };
  };
  volume: {
    m5: number;
    h1: number;
    h6: number;
    h24: number;
  };
  priceChange: {
    m5: number;
    h1: number;
    h6: number;
    h24: number;
  };
  liquidity?: {
    usd: number;
    base: number;
    quote: number;
  };
  fdv?: number;
  marketCap?: number;
  pairCreatedAt?: number;
}

export interface DexScreenerResponse {
  schemaVersion: string;
  pairs: DexScreenerPair[];
}

export interface DexScreenerTokenResponse {
  schemaVersion: string;
  pairs: DexScreenerPair[];
}

class DexScreenerService {
  private baseUrl = 'https://api.dexscreener.com/latest/dex';

  async getTokenPairs(tokenAddress: string): Promise<DexScreenerPair[]> {
    try {
      const response = await fetch(`${this.baseUrl}/tokens/${tokenAddress}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data: DexScreenerTokenResponse = await response.json();
      return data.pairs || [];
    } catch (error) {
      console.error('Error fetching token pairs from DexScreener:', error);
      return [];
    }
  }

  async searchTokens(query: string): Promise<DexScreenerPair[]> {
    try {
      const response = await fetch(`${this.baseUrl}/search/?q=${encodeURIComponent(query)}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data: DexScreenerResponse = await response.json();
      return data.pairs?.slice(0, 20) || [];
    } catch (error) {
      console.error('Error searching tokens on DexScreener:', error);
      return [];
    }
  }

  async getPairsByChainAndPair(chainId: string, pairAddresses: string[]): Promise<DexScreenerPair[]> {
    try {
      const addresses = pairAddresses.join(',');
      const response = await fetch(`${this.baseUrl}/pairs/${chainId}/${addresses}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data: DexScreenerResponse = await response.json();
      return data.pairs || [];
    } catch (error) {
      console.error('Error fetching pairs from DexScreener:', error);
      return [];
    }
  }

  getBestPairForToken(pairs: DexScreenerPair[]): DexScreenerPair | null {
    if (!pairs.length) return null;
    
    // Prioritize pairs with:
    // 1. USD price available
    // 2. Higher liquidity
    // 3. More recent activity (24h volume)
    return pairs
      .filter(pair => pair.priceUsd && parseFloat(pair.priceUsd) > 0)
      .sort((a, b) => {
        const aLiquidity = a.liquidity?.usd || 0;
        const bLiquidity = b.liquidity?.usd || 0;
        const aVolume = a.volume?.h24 || 0;
        const bVolume = b.volume?.h24 || 0;
        
        // Weight liquidity more heavily than volume
        const aScore = aLiquidity * 0.7 + aVolume * 0.3;
        const bScore = bLiquidity * 0.7 + bVolume * 0.3;
        
        return bScore - aScore;
      })[0] || null;
  }
}

export const dexScreenerService = new DexScreenerService();
