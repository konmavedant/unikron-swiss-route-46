
import { dexScreenerService, DexScreenerPair } from './dexScreenerService';

interface CoinGeckoResponse {
  [key: string]: {
    usd: number;
    usd_24h_change: number;
  };
}

export interface CoinCapAsset {
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
  // Enhanced data from DexScreener
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
  dexPair?: DexScreenerPair;
}

interface CoinCapResponse {
  data: CoinCapAsset | CoinCapAsset[];
  timestamp: number;
}

// Enhanced mapping with contract addresses for DexScreener
const TOKEN_INFO: { [key: string]: { 
  coinGeckoId: string; 
  contractAddress?: string;
  chain?: string;
}} = {
  'BTC': { coinGeckoId: 'bitcoin' },
  'ETH': { 
    coinGeckoId: 'ethereum', 
    contractAddress: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
    chain: 'ethereum'
  },
  'USDC': { 
    coinGeckoId: 'usd-coin',
    contractAddress: '0xA0b86a33E6441d5639D62Cf4d0E10b84aEE8a3e8',
    chain: 'ethereum'
  },
  'USDT': { 
    coinGeckoId: 'tether',
    contractAddress: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
    chain: 'ethereum'
  },
  'BNB': { 
    coinGeckoId: 'binancecoin',
    contractAddress: '0xB8c77482e45F1F44dE1745F52C74426C631bDD52',
    chain: 'ethereum'
  },
  'ADA': { coinGeckoId: 'cardano' },
  'DOT': { coinGeckoId: 'polkadot' },
  'MATIC': { 
    coinGeckoId: 'matic-network',
    contractAddress: '0x7D1AfA7B718fb893dB30A3aBc0Cfc608AaCfeBB0',
    chain: 'ethereum'
  },
  'SOL': { coinGeckoId: 'solana' },
  'AVAX': { coinGeckoId: 'avalanche-2' }
};

class PriceService {
  private coinGeckoBaseUrl = 'https://api.coingecko.com/api/v3';

  async getMultipleAssets(symbols: string[]): Promise<CoinCapAsset[]> {
    const assets: CoinCapAsset[] = [];
    
    // Try to get data from both sources and merge
    const coinGeckoData = await this.getCoinGeckoData(symbols);
    
    // For each symbol, try to enhance with DexScreener data
    for (const symbol of symbols) {
      const coinGeckoAsset = coinGeckoData.find(asset => 
        asset.symbol.toLowerCase() === symbol.toLowerCase()
      );
      
      let enhancedAsset = coinGeckoAsset;
      
      // Try to get DexScreener data if we have contract address
      const tokenInfo = TOKEN_INFO[symbol.toUpperCase()];
      if (tokenInfo?.contractAddress) {
        try {
          const dexPairs = await dexScreenerService.getTokenPairs(tokenInfo.contractAddress);
          const bestPair = dexScreenerService.getBestPairForToken(dexPairs);
          
          if (bestPair && enhancedAsset) {
            // Enhance the asset with DexScreener data
            enhancedAsset = {
              ...enhancedAsset,
              liquidity: bestPair.liquidity,
              volume: {
                h1: bestPair.volume?.h1 || 0,
                h24: bestPair.volume?.h24 || 0
              },
              txns: {
                h1: bestPair.txns?.h1 || { buys: 0, sells: 0 },
                h24: bestPair.txns?.h24 || { buys: 0, sells: 0 }
              },
              dexPair: bestPair
            };
            
            // Use DexScreener price if CoinGecko failed but DexScreener has data
            if (bestPair.priceUsd && (!enhancedAsset.priceUsd || enhancedAsset.priceUsd === '0')) {
              enhancedAsset.priceUsd = bestPair.priceUsd;
              enhancedAsset.changePercent24Hr = bestPair.priceChange?.h24?.toString() || '0';
            }
          }
        } catch (error) {
          console.warn(`Failed to enhance ${symbol} with DexScreener data:`, error);
        }
      }
      
      if (enhancedAsset) {
        assets.push(enhancedAsset);
      } else {
        // Fallback: create a basic asset entry
        assets.push({
          id: symbol.toLowerCase(),
          rank: '0',
          symbol: symbol.toUpperCase(),
          name: symbol.toUpperCase(),
          supply: '0',
          maxSupply: null,
          marketCapUsd: '0',
          volumeUsd24Hr: '0',
          priceUsd: '0',
          changePercent24Hr: '0',
          vwap24Hr: '0'
        });
      }
    }
    
    return assets;
  }

  private async getCoinGeckoData(symbols: string[]): Promise<CoinCapAsset[]> {
    try {
      const coinGeckoIds = symbols
        .map(symbol => TOKEN_INFO[symbol.toUpperCase()]?.coinGeckoId)
        .filter(id => id !== undefined);

      if (coinGeckoIds.length === 0) {
        console.warn('No valid CoinGecko IDs found for symbols:', symbols);
        return [];
      }

      const response = await fetch(
        `${this.coinGeckoBaseUrl}/simple/price?ids=${coinGeckoIds.join(',')}&vs_currencies=usd&include_24hr_change=true`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: CoinGeckoResponse = await response.json();
      const assets: CoinCapAsset[] = [];

      Object.entries(data).forEach(([coinId, priceData]) => {
        const symbol = Object.keys(TOKEN_INFO).find(
          key => TOKEN_INFO[key].coinGeckoId === coinId
        );

        if (symbol) {
          assets.push({
            id: coinId,
            rank: '1',
            symbol: symbol,
            name: symbol,
            supply: '0',
            maxSupply: null,
            marketCapUsd: '0',
            volumeUsd24Hr: '0',
            priceUsd: priceData.usd.toString(),
            changePercent24Hr: priceData.usd_24h_change?.toString() || '0',
            vwap24Hr: priceData.usd.toString()
          });
        }
      });

      return assets;
    } catch (error) {
      console.error('Error fetching prices from CoinGecko:', error);
      return [];
    }
  }

  async getAssetBySymbol(symbol: string): Promise<CoinCapAsset | null> {
    try {
      const assets = await this.getMultipleAssets([symbol]);
      return assets.find(asset => 
        asset.symbol.toLowerCase() === symbol.toLowerCase()
      ) || null;
    } catch (error) {
      console.error('Error getting asset by symbol:', error);
      return null;
    }
  }

  async getAssetById(id: string): Promise<CoinCapAsset | null> {
    try {
      const response = await fetch(
        `${this.coinGeckoBaseUrl}/simple/price?ids=${id}&vs_currencies=usd&include_24hr_change=true`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: CoinGeckoResponse = await response.json();
      const priceData = data[id];

      if (!priceData) {
        return null;
      }

      return {
        id: id,
        rank: '1',
        symbol: id.toUpperCase(),
        name: id,
        supply: '0',
        maxSupply: null,
        marketCapUsd: '0',
        volumeUsd24Hr: '0',
        priceUsd: priceData.usd.toString(),
        changePercent24Hr: priceData.usd_24h_change?.toString() || '0',
        vwap24Hr: priceData.usd.toString()
      };
    } catch (error) {
      console.error('Error getting asset by ID:', error);
      return null;
    }
  }

  async searchAssets(query: string): Promise<CoinCapAsset[]> {
    try {
      // Try both CoinGecko and DexScreener search
      const [coinGeckoResults, dexScreenerResults] = await Promise.allSettled([
        this.searchCoinGecko(query),
        dexScreenerService.searchTokens(query)
      ]);

      const assets: CoinCapAsset[] = [];
      
      // Add CoinGecko results
      if (coinGeckoResults.status === 'fulfilled') {
        assets.push(...coinGeckoResults.value);
      }
      
      // Add DexScreener results (convert to CoinCapAsset format)
      if (dexScreenerResults.status === 'fulfilled') {
        dexScreenerResults.value.forEach(pair => {
          const asset: CoinCapAsset = {
            id: pair.baseToken.address,
            rank: '0',
            symbol: pair.baseToken.symbol.toUpperCase(),
            name: pair.baseToken.name,
            supply: '0',
            maxSupply: null,
            marketCapUsd: pair.marketCap?.toString() || '0',
            volumeUsd24Hr: pair.volume?.h24?.toString() || '0',
            priceUsd: pair.priceUsd || '0',
            changePercent24Hr: pair.priceChange?.h24?.toString() || '0',
            vwap24Hr: pair.priceUsd || '0',
            liquidity: pair.liquidity,
            volume: {
              h1: pair.volume?.h1 || 0,
              h24: pair.volume?.h24 || 0
            },
            txns: pair.txns,
            dexPair: pair
          };
          
          // Avoid duplicates
          if (!assets.find(a => a.symbol === asset.symbol)) {
            assets.push(asset);
          }
        });
      }

      return assets;
    } catch (error) {
      console.error('Error searching assets:', error);
      return [];
    }
  }

  private async searchCoinGecko(query: string): Promise<CoinCapAsset[]> {
    try {
      const response = await fetch(
        `${this.coinGeckoBaseUrl}/search?query=${encodeURIComponent(query)}`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const assets: CoinCapAsset[] = [];

      data.coins?.slice(0, 10).forEach((coin: any) => {
        assets.push({
          id: coin.id,
          rank: coin.market_cap_rank?.toString() || '0',
          symbol: coin.symbol.toUpperCase(),
          name: coin.name,
          supply: '0',
          maxSupply: null,
          marketCapUsd: '0',
          volumeUsd24Hr: '0',
          priceUsd: '0',
          changePercent24Hr: '0',
          vwap24Hr: '0'
        });
      });

      return assets;
    } catch (error) {
      console.error('Error searching CoinGecko:', error);
      return [];
    }
  }
}

export const priceService = new PriceService();
export type { CoinCapAsset };
