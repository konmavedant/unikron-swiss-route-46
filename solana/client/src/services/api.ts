// src/services/api.ts (Updated)
import { apiClient } from '@/lib/api-client';
import { jupiterSwapService } from '@/services/jupiterService';
import { ChainType, Token } from '@/types';
import { 
  QuoteRequest, 
  QuoteResponse, 
  SwapRequest, 
  SwapResponse,
  SwapStatusResponse,
  SwapHistoryItem,
  ApiException 
} from '@/types/api';

// Mock EVM tokens for development
const mockEvmTokens = [
  {
    address: "0x0000000000000000000000000000000000000000",
    symbol: "ETH",
    name: "Ethereum",
    decimals: 18,
    logoURI: "https://tokens.coingecko.com/ethereum/images/thumb_logo.png",
    verified: true,
    tags: ["native"]
  },
  {
    address: "0xA0b86a33E6417946484e81aBceBa82A3a34fc5db7",
    symbol: "USDC",
    name: "USD Coin",
    decimals: 6,
    logoURI: "https://tokens.coingecko.com/usd-coin/images/thumb_logo.png",
    verified: true,
    tags: ["stablecoin"]
  },
  {
    address: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
    symbol: "USDT",
    name: "Tether USD",
    decimals: 6,
    logoURI: "https://tokens.coingecko.com/tether/images/thumb_logo.png",
    verified: true,
    tags: ["stablecoin"]
  }
];

export class UnikronApiService {
  /**
   * Get supported tokens for a specific chain
   */
  static async getTokens(chainType: ChainType): Promise<Token[]> {
    try {
      // Try to get from real API first
      return await apiClient.getForChain<Token[]>(chainType, '/tokens');
    } catch (error) {
      console.warn('API not available, using fallback token data');
      
      if (chainType === 'solana') {
        // Get Jupiter token list for Solana
        try {
          const jupiterTokens = await jupiterSwapService.getTokenList();
          
          // Add SOL as native token if not present
          const hasSOL = jupiterTokens.some(token => 
            token.address === 'So11111111111111111111111111111111111111112'
          );
          
          if (!hasSOL) {
            jupiterTokens.unshift({
              address: 'So11111111111111111111111111111111111111112',
              symbol: 'SOL',
              name: 'Solana',
              decimals: 9,
              logoURI: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png',
              verified: true,
              tags: ['native']
            });
          }
          
          // Filter for popular tokens on devnet
          const popularTokens = jupiterTokens.filter(token => 
            ['SOL', 'USDC', 'USDT', 'BONK', 'JUP', 'WIF'].includes(token.symbol)
          );
          
          return popularTokens.length > 0 ? popularTokens : jupiterTokens.slice(0, 20);
        } catch (jupiterError) {
          console.error('Jupiter token list failed:', jupiterError);
          // Return basic Solana tokens
          return [
            {
              address: 'So11111111111111111111111111111111111111112',
              symbol: 'SOL',
              name: 'Solana',
              decimals: 9,
              logoURI: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png',
              verified: true,
              tags: ['native']
            }
          ];
        }
      } else {
        // Return mock EVM tokens
        return mockEvmTokens;
      }
    }
  }

  /**
   * Get swap quote for token pair
   */
  static async getQuote(
    chainType: ChainType, 
    request: QuoteRequest
  ): Promise<QuoteResponse> {
    try {
      // Try real API first
      return await apiClient.postForChain<QuoteResponse>(chainType, '/quote', request);
    } catch (error) {
      console.warn('API not available, using fallback quote service');
      
      if (chainType === 'solana') {
        // Use Jupiter for Solana quotes
        try {
          const inputAmount = request.inputAmount;
          const slippageBps = Math.floor(request.slippage * 100);
          
          const jupiterQuote = await jupiterSwapService.getQuote(
            request.inputToken,
            request.outputToken,
            inputAmount,
            slippageBps
          );

          // We need to get token metadata
          const [inputToken, outputToken] = await Promise.all([
            this.getTokenMetadata(request.inputToken, chainType),
            this.getTokenMetadata(request.outputToken, chainType)
          ]);

          return jupiterSwapService.convertQuoteToInternal(
            jupiterQuote,
            inputToken,
            outputToken
          );
        } catch (jupiterError) {
          console.error('Jupiter quote failed:', jupiterError);
          throw new ApiException(
            'Jupiter quote service unavailable',
            'JUPITER_ERROR'
          );
        }
      } else {
        // Mock EVM quote
        return this.getMockEvmQuote(request);
      }
    }
  }

  /**
   * Create swap intent (for Solana, this will be handled by Jupiter directly)
   */
  static async createSwap(
    chainType: ChainType, 
    request: SwapRequest
  ): Promise<SwapResponse> {
    try {
      return await apiClient.postForChain<SwapResponse>(chainType, '/swap', request);
    } catch (error) {
      console.warn('API not available, using mock swap response');
      
      // For development, return mock response
      // In production, Solana swaps are handled directly through Jupiter
      const intentId = `${chainType}_intent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      return {
        tx: chainType === 'solana' 
          ? btoa('mock_solana_transaction_data') 
          : '0x' + '0'.repeat(64),
        intentId,
        status: 'pending',
        estimatedConfirmation: chainType === 'solana' ? 15 : 30
      };
    }
  }

  /**
   * Get swap intent status
   */
  static async getSwapStatus(
    chainType: ChainType, 
    intentId: string
  ): Promise<SwapStatusResponse> {
    try {
      return await apiClient.getForChain<SwapStatusResponse>(chainType, `/swap/${intentId}`);
    } catch (error) {
      // Mock status for development
      return {
        intentId,
        status: Math.random() > 0.5 ? 'executed' : 'pending',
        txHash: chainType === 'solana' 
          ? `${Math.random().toString(36).substr(2, 64)}` 
          : `0x${Math.random().toString(16).substr(2, 64)}`,
        createdAt: Date.now() - Math.random() * 60000,
        executedAt: Date.now(),
      };
    }
  }

  /**
   * Get user swap history
   */
  static async getSwapHistory(
    chainType: ChainType, 
    userAddress: string,
    limit?: number,
    offset?: number
  ): Promise<SwapHistoryItem[]> {
    try {
      const params: Record<string, string> = { user: userAddress };
      if (limit) params.limit = limit.toString();
      if (offset) params.offset = offset.toString();

      return await apiClient.getForChain<SwapHistoryItem[]>(chainType, '/history', params);
    } catch (error) {
      // Return empty history for development
      return [];
    }
  }

  /**
   * Poll swap status until completion or timeout
   */
  static async pollSwapStatus(
    chainType: ChainType,
    intentId: string,
    intervalMs: number = 2000,
    timeoutMs: number = 60000
  ): Promise<SwapStatusResponse> {
    const startTime = Date.now();

    return new Promise((resolve, reject) => {
      const poll = async () => {
        try {
          const status = await this.getSwapStatus(chainType, intentId);
          
          // Check if swap is completed
          if (['executed', 'expired', 'cancelled'].includes(status.status)) {
            resolve(status);
            return;
          }

          // Check timeout
          if (Date.now() - startTime > timeoutMs) {
            reject(new Error('Swap status polling timeout'));
            return;
          }

          // Continue polling
          setTimeout(poll, intervalMs);
        } catch (error) {
          reject(error);
        }
      };

      poll();
    });
  }

  // Helper methods
  private static async getTokenMetadata(address: string, chainType: ChainType): Promise<Token> {
    const tokens = await this.getTokens(chainType);
    const token = tokens.find(t => t.address === address);
    
    if (token) {
      return token;
    }

    // Return basic metadata if not found
    return {
      address,
      symbol: 'UNKNOWN',
      name: 'Unknown Token',
      decimals: chainType === 'solana' ? 9 : 18,
      logoURI: '',
      verified: false
    };
  }

  private static getMockEvmQuote(request: QuoteRequest): QuoteResponse {
    const inputAmount = request.inputAmount;
    const outputAmount = (parseFloat(inputAmount) * 0.98).toString(); // Mock 2% slippage
    
    return {
      inputToken: {
        address: request.inputToken,
        symbol: "ETH",
        name: "Ethereum", 
        decimals: 18,
        logoURI: "https://tokens.coingecko.com/ethereum/images/thumb_logo.png"
      },
      outputToken: {
        address: request.outputToken,
        symbol: "USDC",
        name: "USD Coin",
        decimals: 6,
        logoURI: "https://tokens.coingecko.com/usd-coin/images/thumb_logo.png"
      },
      inputAmount,
      outputAmount,
      priceImpact: 0.5,
      fee: "0.3",
      route: [request.inputToken, request.outputToken],
      slippage: request.slippage,
      minOutputAmount: (parseFloat(outputAmount) * (1 - request.slippage / 100)).toString(),
      quoteId: `mock_quote_${Date.now()}`,
      validUntil: Date.now() + 30000
    };
  }
}

// Export individual methods for convenience
export const {
  getTokens,
  getQuote,
  createSwap,
  getSwapStatus,
  getSwapHistory,
  pollSwapStatus
} = UnikronApiService;