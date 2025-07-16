import { apiClient } from '@/lib/api-client';
import { ChainType } from '@/types';
import { 
  TokenListResponse, 
  QuoteRequest, 
  QuoteResponse, 
  SwapRequest, 
  SwapResponse, 
  SwapStatusResponse,
  SwapHistoryItem 
} from '@/types/api';

export class UnikronApiService {
  /**
   * Get supported tokens for a specific chain
   */
  static async getTokens(chainType: ChainType): Promise<TokenListResponse[]> {
    return apiClient.getForChain<TokenListResponse[]>(chainType, '/tokens');
  }

  /**
   * Get swap quote for token pair
   */
  static async getQuote(
    chainType: ChainType, 
    request: QuoteRequest
  ): Promise<QuoteResponse> {
    return apiClient.postForChain<QuoteResponse>(chainType, '/quote', request);
  }

  /**
   * Create swap intent and get transaction data
   */
  static async createSwap(
    chainType: ChainType, 
    request: SwapRequest
  ): Promise<SwapResponse> {
    return apiClient.postForChain<SwapResponse>(chainType, '/swap', request);
  }

  /**
   * Get swap intent status
   */
  static async getSwapStatus(
    chainType: ChainType, 
    intentId: string
  ): Promise<SwapStatusResponse> {
    return apiClient.getForChain<SwapStatusResponse>(chainType, `/swap/${intentId}`);
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
    const params: Record<string, string> = { user: userAddress };
    if (limit) params.limit = limit.toString();
    if (offset) params.offset = offset.toString();

    return apiClient.getForChain<SwapHistoryItem[]>(chainType, '/history', params);
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