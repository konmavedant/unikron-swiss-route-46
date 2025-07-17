// src/services/priceService.ts
import { ChainType } from '@/types';

interface DexScreenerPair {
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
  priceUsd: string;
  txns: {
    m5: {
      buys: number;
      sells: number;
    };
    h1: {
      buys: number;
      sells: number;
    };
    h6: {
      buys: number;
      sells: number;
    };
    h24: {
      buys: number;
      sells: number;
    };
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
  liquidity: {
    usd: number;
    base: number;
    quote: number;
  };
  fdv: number;
  marketCap: number;
  pairCreatedAt: number;
  info: {
    imageUrl: string;
    websites: { url: string }[];
    socials: { type: string; url: string }[];
  };
}

interface DexScreenerResponse {
  schemaVersion: string;
  pairs: DexScreenerPair[];
}

interface TokenPrice {
  price: number;
  priceChange24h: number;
  volume24h: number;
  marketCap: number;
  lastUpdated: number;
}

class PriceService {
  private baseUrl = 'https://api.dexscreener.com/latest/dex/tokens';
  private priceCache = new Map<string, { price: TokenPrice; timestamp: number }>();
  private readonly cacheTimeout = 30000; // 30 seconds cache

  // Map token addresses to their DexScreener compatible addresses
  private getTokenAddressForAPI(tokenAddress: string, chainType: ChainType): string {
    // Handle native tokens
    if (chainType === 'solana') {
      // SOL native token
      if (tokenAddress === 'So11111111111111111111111111111111111111112' || tokenAddress === 'SOL') {
        return 'So11111111111111111111111111111111111111112';
      }
      return tokenAddress;
    } else {
      // EVM native tokens
      if (tokenAddress === '0x0000000000000000000000000000000000000000' || tokenAddress === 'ETH') {
        return '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'; // WETH address
      }
      return tokenAddress.startsWith('0x') ? tokenAddress : `0x${tokenAddress}`;
    }
  }

  /**
   * Get token price from DexScreener API
   */
  async getTokenPrice(tokenAddress: string, chainType: ChainType): Promise<TokenPrice | null> {
    try {
      const apiAddress = this.getTokenAddressForAPI(tokenAddress, chainType);
      const cacheKey = `${chainType}-${apiAddress}`;
      const cached = this.priceCache.get(cacheKey);
      
      // Return cached result if still valid
      if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.price;
      }

      const response = await fetch(`${this.baseUrl}/${apiAddress}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });
      
      if (!response.ok) {
        console.warn(`DexScreener API returned ${response.status} for ${apiAddress}`);
        return this.getFallbackPrice(tokenAddress, chainType);
      }

      const data: DexScreenerResponse = await response.json();
      
      if (!data.pairs || data.pairs.length === 0) {
        console.warn(`No pairs found for token ${apiAddress} on DexScreener`);
        return this.getFallbackPrice(tokenAddress, chainType);
      }

      // Find the most liquid pair for better price accuracy
      const bestPair = data.pairs.reduce((best, current) => {
        const currentLiquidity = current.liquidity?.usd || 0;
        const bestLiquidity = best.liquidity?.usd || 0;
        return currentLiquidity > bestLiquidity ? current : best;
      });

      const tokenPrice: TokenPrice = {
        price: parseFloat(bestPair.priceUsd) || 0,
        priceChange24h: bestPair.priceChange?.h24 || 0,
        volume24h: bestPair.volume?.h24 || 0,
        marketCap: bestPair.marketCap || 0,
        lastUpdated: Date.now(),
      };

      // Cache the result
      this.priceCache.set(cacheKey, {
        price: tokenPrice,
        timestamp: Date.now(),
      });

      return tokenPrice;
    } catch (error) {
      console.error('Error fetching token price from DexScreener:', error);
      return this.getFallbackPrice(tokenAddress, chainType);
    }
  }

  /**
   * Fallback price data for common tokens when API fails
   */
  private getFallbackPrice(tokenAddress: string, chainType: ChainType): TokenPrice | null {
    // Common token fallback prices (should be updated regularly)
    const fallbackPrices: Record<string, TokenPrice> = {
      // Solana tokens
      'So11111111111111111111111111111111111111112': {
        price: 200, // SOL approximate price
        priceChange24h: 0,
        volume24h: 0,
        marketCap: 0,
        lastUpdated: Date.now(),
      },
      'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v': {
        price: 1, // USDC
        priceChange24h: 0,
        volume24h: 0,
        marketCap: 0,
        lastUpdated: Date.now(),
      },
      'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB': {
        price: 1, // USDT
        priceChange24h: 0,
        volume24h: 0,
        marketCap: 0,
        lastUpdated: Date.now(),
      },
      // EVM tokens
      '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2': {
        price: 3000, // WETH approximate price
        priceChange24h: 0,
        volume24h: 0,
        marketCap: 0,
        lastUpdated: Date.now(),
      },
      '0xA0b86a33E6417946484e81aBceBa82A3a34fc5db7': {
        price: 1, // USDC
        priceChange24h: 0,
        volume24h: 0,
        marketCap: 0,
        lastUpdated: Date.now(),
      },
    };

    const key = this.getTokenAddressForAPI(tokenAddress, chainType);
    return fallbackPrices[key] || null;
  }

  /**
   * Get multiple token prices in batch
   */
  async getTokenPrices(
    tokenAddresses: string[],
    chainType: ChainType
  ): Promise<Map<string, TokenPrice>> {
    const prices = new Map<string, TokenPrice>();
    
    // Process in batches to avoid rate limits
    const batchSize = 3; // Reduced batch size to be more conservative
    for (let i = 0; i < tokenAddresses.length; i += batchSize) {
      const batch = tokenAddresses.slice(i, i + batchSize);
      const batchPromises = batch.map(address => 
        this.getTokenPrice(address, chainType)
      );
      
      const batchResults = await Promise.allSettled(batchPromises);
      
      batchResults.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value) {
          prices.set(batch[index], result.value);
        }
      });
      
      // Add delay between batches to respect rate limits
      if (i + batchSize < tokenAddresses.length) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    
    return prices;
  }

  /**
   * Calculate USD value for a token amount
   */
  async calculateUSDValue(
    tokenAddress: string,
    amount: string,
    chainType: ChainType
  ): Promise<number> {
    const price = await this.getTokenPrice(tokenAddress, chainType);
    if (!price) return 0;
    
    const tokenAmount = parseFloat(amount);
    if (isNaN(tokenAmount) || tokenAmount <= 0) return 0;
    
    return tokenAmount * price.price;
  }

  /**
   * Get Solana native token price (SOL)
   */
  async getSOLPrice(): Promise<number> {
    const solPrice = await this.getTokenPrice(
      'So11111111111111111111111111111111111111112',
      'solana'
    );
    return solPrice?.price || 200; // fallback price
  }

  /**
   * Get Ethereum price (ETH/WETH)
   */
  async getETHPrice(): Promise<number> {
    const ethPrice = await this.getTokenPrice(
      '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
      'evm'
    );
    return ethPrice?.price || 3000; // fallback price
  }

  /**
   * Clear price cache
   */
  clearCache(): void {
    this.priceCache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.priceCache.size,
      keys: Array.from(this.priceCache.keys()),
    };
  }
}

// Export singleton instance
export const priceService = new PriceService();

// Export class for testing
export { PriceService };

// Helper function to get chain-specific token address formatting
export function formatTokenAddressForDexScreener(address: string, chainType: ChainType): string {
  if (chainType === 'solana') {
    return address;
  } else {
    // For EVM chains, ensure address starts with 0x
    return address.startsWith('0x') ? address : `0x${address}`;
  }
}