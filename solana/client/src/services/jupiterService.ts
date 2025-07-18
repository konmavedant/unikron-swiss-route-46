// src/services/jupiterService.ts (Fixed)
import { Connection, PublicKey, Transaction, VersionedTransaction } from '@solana/web3.js';
import { QuoteResponse, SwapRequest, SwapResponse } from '@/types/api';
import { Token } from '@/types';

interface JupiterQuoteRequest {
  inputMint: string;
  outputMint: string;
  amount: string;
  slippageBps: number;
  feeBps?: number;
  onlyDirectRoutes?: boolean;
  asLegacyTransaction?: boolean;
}

interface JupiterQuoteResponse {
  inputMint: string;
  inAmount: string;
  outputMint: string;
  outAmount: string;
  otherAmountThreshold: string;
  swapMode: string;
  slippageBps: number;
  platformFee: null | any;
  priceImpactPct: string;
  routePlan: Array<{
    swapInfo: {
      ammKey: string;
      label: string;
      inputMint: string;
      outputMint: string;
      inAmount: string;
      outAmount: string;
      feeAmount: string;
      feeMint: string;
    };
    percent: number;
  }>;
  contextSlot: number;
  timeTaken: number;
}

interface JupiterSwapRequest {
  quoteResponse: JupiterQuoteResponse;
  userPublicKey: string;
  wrapAndUnwrapSol?: boolean;
  useSharedAccounts?: boolean;
  feeAccount?: string;
  trackingAccount?: string;
  computeUnitPriceMicroLamports?: number;
  asLegacyTransaction?: boolean;
}

interface JupiterSwapResponse {
  swapTransaction: string;
  lastValidBlockHeight: number;
  prioritizationFeeLamports: number;
}

class JupiterSwapService {
  private baseUrl = 'https://quote-api.jup.ag/v6';
  private connection: Connection;

  constructor() {
    // Use devnet for testing
    this.connection = new Connection('https://api.devnet.solana.com', 'confirmed');
  }

  // Get a quote from Jupiter
  async getQuote(
    inputMint: string,
    outputMint: string,
    amount: string,
    slippageBps: number = 50 // 0.5% default slippage
  ): Promise<JupiterQuoteResponse> {
    const params = new URLSearchParams({
      inputMint,
      outputMint,
      amount,
      slippageBps: slippageBps.toString(),
      onlyDirectRoutes: 'false',
      asLegacyTransaction: 'false'
    });

    console.log('Jupiter quote request:', {
      inputMint,
      outputMint,
      amount,
      slippageBps,
      url: `${this.baseUrl}/quote?${params}`
    });

    const response = await fetch(`${this.baseUrl}/quote?${params}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Jupiter quote error:', errorText);
      throw new Error(`Jupiter quote failed: ${response.statusText}`);
    }

    const result = await response.json();
    console.log('Jupiter quote response:', result);
    return result;
  }

  // Get swap transaction from Jupiter
  async getSwapTransaction(
    quoteResponse: JupiterQuoteResponse,
    userPublicKey: string,
    options: Partial<JupiterSwapRequest> = {}
  ): Promise<JupiterSwapResponse> {
    const swapRequest: JupiterSwapRequest = {
      quoteResponse,
      userPublicKey,
      wrapAndUnwrapSol: true,
      useSharedAccounts: true,
      computeUnitPriceMicroLamports: 1000,
      asLegacyTransaction: false,
      ...options
    };

    const response = await fetch(`${this.baseUrl}/swap`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(swapRequest),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Jupiter swap transaction failed: ${errorText}`);
    }

    return await response.json();
  }

  // Convert Jupiter quote to our internal format with proper decimal handling
  convertQuoteToInternal(
    jupiterQuote: JupiterQuoteResponse,
    inputToken: Token,
    outputToken: Token
  ): QuoteResponse {
    console.log('Converting Jupiter quote:', {
      jupiterQuote,
      inputToken,
      outputToken
    });

    // Convert from smallest units to human readable amounts
    const inputAmountHuman = parseFloat(jupiterQuote.inAmount) / Math.pow(10, inputToken.decimals);
    const outputAmountHuman = parseFloat(jupiterQuote.outAmount) / Math.pow(10, outputToken.decimals);
    
    // Calculate exchange rate
    const exchangeRate = outputAmountHuman / inputAmountHuman;
    
    // Parse price impact (convert from decimal to percentage)
    const priceImpact = Math.abs(parseFloat(jupiterQuote.priceImpactPct || '0'));
    
    // Calculate minimum output amount with slippage
    const slippageDecimal = jupiterQuote.slippageBps / 10000; // Convert BPS to decimal
    const minOutputAmountHuman = outputAmountHuman * (1 - slippageDecimal);

    // Extract route information
    const route = jupiterQuote.routePlan.map(plan => plan.swapInfo.label);

    // Calculate fee in human readable format
    const totalFeeAmount = jupiterQuote.routePlan.reduce((acc, plan) => {
      return acc + parseFloat(plan.swapInfo.feeAmount || '0');
    }, 0);
    const feeHuman = totalFeeAmount / Math.pow(10, inputToken.decimals);

    const convertedQuote: QuoteResponse & { 
      _displayAmounts?: {
        inputAmountHuman: string;
        outputAmountHuman: string;
        minOutputAmountHuman: string;
        exchangeRate: string;
      }
    } = {
      inputToken,
      outputToken,
      inputAmount: jupiterQuote.inAmount, // Keep original for execution
      outputAmount: jupiterQuote.outAmount, // Keep original for execution
      priceImpact,
      fee: feeHuman.toFixed(6),
      route,
      slippage: jupiterQuote.slippageBps / 100, // Convert BPS to percentage
      minOutputAmount: Math.floor(minOutputAmountHuman * Math.pow(10, outputToken.decimals)).toString(),
      quoteId: this.generateQuoteId(jupiterQuote),
      validUntil: Date.now() + 30000, // 30 seconds validity
      // Add human readable amounts for display
      _displayAmounts: {
        inputAmountHuman: inputAmountHuman.toString(),
        outputAmountHuman: outputAmountHuman.toString(),
        minOutputAmountHuman: minOutputAmountHuman.toString(),
        exchangeRate: exchangeRate.toString()
      }
    };

    console.log('Converted quote:', convertedQuote);
    return convertedQuote;
  }

  // Execute the swap
  async executeSwap(
    jupiterQuote: JupiterQuoteResponse,
    userPublicKey: string,
    signTransaction: (transaction: VersionedTransaction) => Promise<VersionedTransaction>
  ): Promise<string> {
    try {
      console.log('Executing swap with Jupiter quote:', jupiterQuote);
      
      // Get swap transaction from Jupiter
      const swapResponse = await this.getSwapTransaction(jupiterQuote, userPublicKey);
      
      console.log('Got swap response:', swapResponse);
      
      // Deserialize the transaction
      const swapTransactionBuf = Buffer.from(swapResponse.swapTransaction, 'base64');
      const transaction = VersionedTransaction.deserialize(swapTransactionBuf);

      console.log('Deserialized transaction, requesting signature...');

      // Sign the transaction
      const signedTransaction = await signTransaction(transaction);

      console.log('Transaction signed, sending...');

      // Send the transaction
      const signature = await this.connection.sendTransaction(signedTransaction, {
        skipPreflight: false,
        preflightCommitment: 'confirmed',
        maxRetries: 3,
      });

      console.log('Transaction sent with signature:', signature);

      // Confirm the transaction
      const confirmation = await this.connection.confirmTransaction(
        {
          signature,
          blockhash: transaction.message.recentBlockhash!,
          lastValidBlockHeight: swapResponse.lastValidBlockHeight,
        },
        'confirmed'
      );

      if (confirmation.value.err) {
        throw new Error(`Transaction failed: ${JSON.stringify(confirmation.value.err)}`);
      }

      console.log('Transaction confirmed:', confirmation);
      return signature;
    } catch (error) {
      console.error('Jupiter swap execution failed:', error);
      throw error;
    }
  }

  // Generate a unique quote ID
  private generateQuoteId(jupiterQuote: JupiterQuoteResponse): string {
    return `jupiter_${Date.now()}_${jupiterQuote.contextSlot}`;
  }

  // Get token list from Jupiter (for popular tokens)
  async getTokenList(): Promise<Token[]> {
    try {
      const response = await fetch('https://token.jup.ag/all');
      if (!response.ok) {
        throw new Error('Failed to fetch Jupiter token list');
      }

      const tokens = await response.json();
      
      // Convert Jupiter tokens to our format and filter for devnet-compatible tokens
      const convertedTokens = tokens
        .filter((token: any) => {
          // Only include well-known tokens that are likely available on devnet
          const popularSymbols = ['SOL', 'USDC', 'USDT', 'BONK', 'JUP', 'WIF', 'RAY', 'SRM'];
          return popularSymbols.includes(token.symbol);
        })
        .map((token: any) => ({
          address: token.address,
          symbol: token.symbol,
          name: token.name,
          decimals: token.decimals,
          logoURI: token.logoURI || '',
          verified: token.verified || false,
          tags: token.tags || []
        }));

      console.log('Filtered Jupiter tokens for devnet:', convertedTokens);
      return convertedTokens;
    } catch (error) {
      console.error('Failed to fetch Jupiter token list:', error);
      return [];
    }
  }

  // Check if token is supported by Jupiter
  async isTokenSupported(tokenMint: string): Promise<boolean> {
    try {
      const tokens = await this.getTokenList();
      return tokens.some(token => token.address === tokenMint);
    } catch {
      return false;
    }
  }

  // Get current SOL price (for fee calculations)
  async getSOLPrice(): Promise<number> {
    try {
      const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd');
      const data = await response.json();
      return data.solana.usd;
    } catch {
      return 100; // Fallback price
    }
  }
}

export const jupiterSwapService = new JupiterSwapService();
export { JupiterSwapService };