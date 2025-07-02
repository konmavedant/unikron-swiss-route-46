import axios from 'axios';
import { logger } from '../utils/logger';
import { config } from '../config/env';

export async function fetchQuote(
  fromMint: string, 
  toMint: string, 
  amount: number,
  slippageBps: number = 100
) {
  const url = `https://quote-api.jup.ag/v6/quote`;
  const params = {
    inputMint: fromMint,
    outputMint: toMint,
    amount: amount.toString(),
    slippageBps,
    onlyDirectRoutes: false,
    asLegacyTransaction: false,
    maxAccounts: 64,
    minimizeSlippage: true
  };

  try {
    logger.debug('Jupiter API request', { url, params });
    
    const response = await axios.get(url, { 
      params,
      timeout: config.timeouts.jupiter,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'UNIKRON-Backend/1.0.0'
      }
    });
    
    logger.debug('Jupiter API response', { 
      status: response.status,
      hasData: !!response.data,
      routePlan: response.data?.routePlan?.length || 0
    });

    if (!response.data) {
      throw new Error("No route found from Jupiter - empty response");
    }

    if (response.data.error) {
      throw new Error(`Jupiter API error: ${response.data.error}`);
    }

    // Validate response structure
    if (!response.data.inputMint || !response.data.outputMint || !response.data.inAmount) {
      throw new Error("Invalid route structure from Jupiter");
    }

    return {
      ...response.data,
      metadata: {
        provider: 'Jupiter',
        version: 'v6',
        timestamp: new Date().toISOString()
      }
    };
  } catch (err: any) {
    logger.error('Jupiter API error', {
      message: err.message,
      response: err.response?.data,
      status: err.response?.status,
      params
    });

    if (err.code === 'ECONNABORTED') {
      throw new Error('Jupiter API timeout - service unavailable');
    }

    if (err.response?.status === 400) {
      throw new Error(`Jupiter quote failed: Invalid parameters - ${err.response?.data?.error || err.message}`);
    } else if (err.response?.status === 404) {
      throw new Error(`Jupiter quote failed: No route found for this token pair`);
    } else if (err.response?.status === 429) {
      throw new Error(`Jupiter quote failed: Rate limit exceeded`);
    } else if (err.response?.data?.error) {
      throw new Error(`Jupiter quote failed: ${err.response.data.error}`);
    } else {
      throw new Error(`Jupiter quote failed: ${err.message}`);
    }
  }
}