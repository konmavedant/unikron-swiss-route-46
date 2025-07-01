
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

class PriceService {
  private baseUrl = 'https://api.coincap.io/v2';
  private apiKey = '3bf47ffbb40640d3f525cde946be11e5eb4a553fc525560d930fec818ad41338';

  private async fetchWithAuth(url: string): Promise<Response> {
    return fetch(url, {
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
    });
  }

  async searchAssets(query: string): Promise<CoinCapAsset[]> {
    try {
      const response = await this.fetchWithAuth(
        `${this.baseUrl}/assets?search=${encodeURIComponent(query)}&limit=10`
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data: CoinCapResponse = await response.json();
      return Array.isArray(data.data) ? data.data : [];
    } catch (error) {
      console.error('Error searching assets:', error);
      return [];
    }
  }

  async getAssetBySymbol(symbol: string): Promise<CoinCapAsset | null> {
    try {
      const response = await this.fetchWithAuth(
        `${this.baseUrl}/assets?search=${encodeURIComponent(symbol)}&limit=1`
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data: CoinCapResponse = await response.json();
      const assets = Array.isArray(data.data) ? data.data : [];
      
      // Find exact symbol match
      const exactMatch = assets.find(asset => 
        asset.symbol.toLowerCase() === symbol.toLowerCase()
      );
      
      return exactMatch || null;
    } catch (error) {
      console.error('Error getting asset by symbol:', error);
      return null;
    }
  }

  async getAssetById(id: string): Promise<CoinCapAsset | null> {
    try {
      const response = await this.fetchWithAuth(`${this.baseUrl}/assets/${id}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data: CoinCapResponse = await response.json();
      return data.data as CoinCapAsset;
    } catch (error) {
      console.error('Error getting asset by ID:', error);
      return null;
    }
  }

  async getMultipleAssets(symbols: string[]): Promise<CoinCapAsset[]> {
    try {
      const promises = symbols.map(symbol => this.getAssetBySymbol(symbol));
      const results = await Promise.all(promises);
      return results.filter(asset => asset !== null) as CoinCapAsset[];
    } catch (error) {
      console.error('Error getting multiple assets:', error);
      return [];
    }
  }
}

export const priceService = new PriceService();
export type { CoinCapAsset };
