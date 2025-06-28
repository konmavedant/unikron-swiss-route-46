
interface CoinGeckoResponse {
  [key: string]: {
    usd: number;
    usd_24h_change: number;
  };
}

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

// Mapping of symbols to CoinGecko IDs
const SYMBOL_TO_COINGECKO_ID: { [key: string]: string } = {
  'BTC': 'bitcoin',
  'ETH': 'ethereum',
  'USDC': 'usd-coin',
  'USDT': 'tether',
  'BNB': 'binancecoin',
  'ADA': 'cardano',
  'DOT': 'polkadot',
  'MATIC': 'matic-network',
  'SOL': 'solana',
  'AVAX': 'avalanche-2'
};

class PriceService {
  private baseUrl = 'https://api.coingecko.com/api/v3';

  async getMultipleAssets(symbols: string[]): Promise<CoinCapAsset[]> {
    try {
      const coinGeckoIds = symbols
        .map(symbol => SYMBOL_TO_COINGECKO_ID[symbol.toUpperCase()])
        .filter(id => id !== undefined);

      if (coinGeckoIds.length === 0) {
        console.warn('No valid CoinGecko IDs found for symbols:', symbols);
        return [];
      }

      const response = await fetch(
        `${this.baseUrl}/simple/price?ids=${coinGeckoIds.join(',')}&vs_currencies=usd&include_24hr_change=true`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: CoinGeckoResponse = await response.json();
      const assets: CoinCapAsset[] = [];

      Object.entries(data).forEach(([coinId, priceData]) => {
        const symbol = Object.keys(SYMBOL_TO_COINGECKO_ID).find(
          key => SYMBOL_TO_COINGECKO_ID[key] === coinId
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
        `${this.baseUrl}/simple/price?ids=${id}&vs_currencies=usd&include_24hr_change=true`
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
      const response = await fetch(
        `${this.baseUrl}/search?query=${encodeURIComponent(query)}`
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
      console.error('Error searching assets:', error);
      return [];
    }
  }
}

export const priceService = new PriceService();
export type { CoinCapAsset };
