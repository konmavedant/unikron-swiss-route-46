// src/services/jupiterService.ts (Fixed with improved transaction handling)
import {
  Connection,
  PublicKey,
  Transaction,
  VersionedTransaction,
  TransactionExpiredBlockheightExceededError,
} from "@solana/web3.js";
import { QuoteResponse, SwapRequest, SwapResponse } from "@/types/api";
import { Token } from "@/types";

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
  onlyDirectRoutes?: boolean;
}

interface JupiterSwapResponse {
  swapTransaction: string;
  lastValidBlockHeight: number;
  prioritizationFeeLamports: number;
}

class JupiterSwapService {
  private baseUrl = "https://quote-api.jup.ag/v6";
  private connection: Connection;

  constructor() {
    // Use devnet for testing with confirmed commitment for faster processing
    this.connection = new Connection("https://api.devnet.solana.com", {
      commitment: "confirmed",
      confirmTransactionInitialTimeout: 60000, // 60 seconds
    });
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
      onlyDirectRoutes: "false",
      asLegacyTransaction: "false",
    });

    console.log("Jupiter quote request:", {
      inputMint,
      outputMint,
      amount,
      slippageBps,
      url: `${this.baseUrl}/quote?${params}`,
    });

    const response = await fetch(`${this.baseUrl}/quote?${params}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Jupiter quote error:", errorText);
      throw new Error(`Jupiter quote failed: ${response.statusText}`);
    }

    const result = await response.json();
    console.log("Jupiter quote response:", result);
    return result;
  }

  // Get swap transaction from Jupiter
  async getSwapTransaction(
    quoteResponse: JupiterQuoteResponse,
    userPublicKey: string,
    options: Partial<JupiterSwapRequest> = {}
  ): Promise<JupiterSwapResponse> {
    const swapRequest= {
      quoteResponse,
      userPublicKey,
      wrapAndUnwrapSol: true,
      useSharedAccounts: false,
      dynamicComputeUnitLimit: true,
      dynamicSlippage: true,
      prioritizationFeeLamports: {
        priorityLevelWithMaxLamports: {
          maxLamports: 1000000,
          priorityLevel: "veryHigh",
        },
      },
      asLegacyTransaction:true,
      onlyDirectRoutes: true,
      ...options,
    };
    const response = await fetch(`${this.baseUrl}/swap`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(swapRequest),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Jupiter swap transaction failed: ${errorText}`);
    }

    return await response.json();
  }

  // Check if blockhash is still valid
  private async isBlockhashValid(
    blockhash: string,
    lastValidBlockHeight: number
  ): Promise<boolean> {
    try {
      const currentBlockHeight = await this.connection.getBlockHeight(
        "confirmed"
      );
      const isValid = currentBlockHeight <= lastValidBlockHeight;
      console.log("Blockhash validity check:", {
        currentBlockHeight,
        lastValidBlockHeight,
        isValid,
        remainingBlocks: lastValidBlockHeight - currentBlockHeight,
      });
      return isValid;
    } catch (error) {
      console.error("Error checking blockhash validity:", error);
      return false;
    }
  }

  // Enhanced execute swap with better error handling
  async executeSwap(
    jupiterQuote: JupiterQuoteResponse,
    userPublicKey: string,
    signTransaction: (
      transaction: VersionedTransaction
    ) => Promise<VersionedTransaction>,
    maxRetries: number = 3
  ): Promise<string> {
    let lastError: Error | null = null;
    let currentQuote = jupiterQuote;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`Executing swap attempt ${attempt}/${maxRetries}`);

        // Get a fresh swap transaction from Jupiter for each attempt
        const swapResponse = await this.getSwapTransaction(
          currentQuote,
          userPublicKey
          // {
          //   computeUnitPriceMicroLamports: 5000 + attempt * 2000, // Increase priority fee with each retry
          // }
        );

        console.log("Got fresh swap response:", {
          lastValidBlockHeight: swapResponse.lastValidBlockHeight,
          prioritizationFeeLamports: swapResponse.prioritizationFeeLamports,
        });

        // Deserialize the transaction
        const swapTransactionBuf = Buffer.from(
          swapResponse.swapTransaction,
          "base64"
        );
        const transaction =
          VersionedTransaction.deserialize(swapTransactionBuf);
        const recentBlockhash = transaction.message.recentBlockhash;

        // Check if the blockhash is still valid before signing
        const isValid = await this.isBlockhashValid(
          recentBlockhash,
          swapResponse.lastValidBlockHeight
        );

        if (!isValid) {
          console.warn("Blockhash is no longer valid, getting fresh quote...");
          if (attempt < maxRetries) {
            currentQuote = await this.getQuote(
              currentQuote.inputMint,
              currentQuote.outputMint,
              currentQuote.inAmount,
              currentQuote.slippageBps
            );
            continue;
          }
        }

        console.log("Signing transaction...");
        const signStartTime = Date.now();
        const signedTransaction = await signTransaction(transaction);
        const signDuration = Date.now() - signStartTime;

        console.log(`Transaction signed in ${signDuration}ms`);

        // Check blockhash validity again after signing if it took too long
        if (signDuration > 8000) {
          // 8 seconds threshold
          const stillValid = await this.isBlockhashValid(
            recentBlockhash,
            swapResponse.lastValidBlockHeight
          );

          if (!stillValid) {
            console.warn("Blockhash expired during signing, retrying...");
            if (attempt < maxRetries) {
              currentQuote = await this.getQuote(
                currentQuote.inputMint,
                currentQuote.outputMint,
                currentQuote.inAmount,
                currentQuote.slippageBps
              );
              continue;
            }
          }
        }

        // Send the transaction with aggressive settings
        console.log("Sending transaction...");
        const signature = await this.connection.sendRawTransaction(
          signedTransaction.serialize(),
          {
            maxRetries: 3,
            skipPreflight: true, // If you set this to true, you can skip the next one.
            preflightCommitment: "processed",
          }
        );

        console.log("Transaction sent with signature:", signature);

        // Use a more aggressive confirmation strategy
        const confirmationPromise = this.confirmTransactionWithTimeout(
          signature,
          recentBlockhash,
          swapResponse.lastValidBlockHeight,
          30000 // 30 second timeout
        );

        const confirmation = await confirmationPromise;

        if (confirmation.value?.err) {
          throw new Error(
            `Transaction failed: ${JSON.stringify(confirmation.value.err)}`
          );
        }

        console.log("Transaction confirmed successfully:", confirmation);
        return signature;
      } catch (error: any) {
        console.error(`Swap execution attempt ${attempt} failed:`, error);
        lastError = error;

        // Handle specific error types
        const isBlockhashError =
          error instanceof TransactionExpiredBlockheightExceededError ||
          error.message?.includes("Blockhash not found") ||
          error.message?.includes("block hash not found") ||
          error.message?.includes("BlockhashNotFound") ||
          error.message?.includes("block height exceeded") ||
          error.message?.includes("Simulation failed");

        const isNetworkError =
          error.message?.includes("Network request failed") ||
          error.message?.includes("timeout") ||
          error.message?.includes("ECONNRESET");

        if ((isBlockhashError || isNetworkError) && attempt < maxRetries) {
          console.log("Retryable error detected, getting fresh quote...");

          // Exponential backoff with jitter
          const baseDelay = 1000 * Math.pow(2, attempt - 1);
          const jitter = Math.random() * 1000;
          const delay = baseDelay + jitter;

          console.log(`Waiting ${delay}ms before retry...`);
          await new Promise((resolve) => setTimeout(resolve, delay));

          // Get a fresh quote for the next attempt
          try {
            currentQuote = await this.getQuote(
              currentQuote.inputMint,
              currentQuote.outputMint,
              currentQuote.inAmount,
              currentQuote.slippageBps + attempt * 10 // Increase slippage tolerance with retries
            );
            console.log("Got fresh quote for retry");
          } catch (quoteError) {
            console.error("Failed to get fresh quote:", quoteError);
            // Continue with original quote if fresh quote fails
          }

          continue;
        }

        // If it's the last attempt or not a retryable error, throw
        if (attempt === maxRetries) {
          throw error;
        }
      }
    }

    throw lastError || new Error("All swap execution attempts failed");
  }

  // Enhanced confirmation with timeout handling
  private async confirmTransactionWithTimeout(
    signature: string,
    blockhash: string,
    lastValidBlockHeight: number,
    timeoutMs: number = 30000
  ): Promise<any> {
    return new Promise(async (resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(
          new Error(`Transaction confirmation timeout after ${timeoutMs}ms`)
        );
      }, timeoutMs);

      try {
        // Use both signature-based and blockhash-based confirmation
        const confirmationPromise = this.connection.confirmTransaction(
          {
            signature,
            blockhash,
            lastValidBlockHeight,
          },
          "confirmed"
        );

        // Also poll for transaction status
        const pollPromise = this.pollTransactionStatus(signature, 1000, 30);

        // Race between confirmation and polling
        const result = await Promise.race([confirmationPromise, pollPromise]);

        clearTimeout(timeoutId);
        resolve(result);
      } catch (error) {
        clearTimeout(timeoutId);
        reject(error);
      }
    });
  }

  // Poll transaction status as backup confirmation method
  private async pollTransactionStatus(
    signature: string,
    intervalMs: number = 1000,
    maxPolls: number = 30
  ): Promise<any> {
    for (let i = 0; i < maxPolls; i++) {
      try {
        const status = await this.connection.getSignatureStatus(signature);

        if (
          status.value?.confirmationStatus === "confirmed" ||
          status.value?.confirmationStatus === "finalized"
        ) {
          return { value: { err: status.value.err } };
        }

        if (status.value?.err) {
          throw new Error(
            `Transaction failed: ${JSON.stringify(status.value.err)}`
          );
        }

        // Wait before next poll
        await new Promise((resolve) => setTimeout(resolve, intervalMs));
      } catch (error) {
        if (i === maxPolls - 1) throw error;
        await new Promise((resolve) => setTimeout(resolve, intervalMs));
      }
    }

    throw new Error("Transaction status polling timeout");
  }

  // Alternative method: Execute swap with manual blockhash management (keep as backup)
  async executeSwapWithFreshBlockhash(
    jupiterQuote: JupiterQuoteResponse,
    userPublicKey: string,
    signTransaction: (
      transaction: VersionedTransaction
    ) => Promise<VersionedTransaction>
  ): Promise<string> {
    try {
      console.log("Executing swap with fresh blockhash strategy");

      // Get fresh blockhash first
      const { blockhash, lastValidBlockHeight } =
        await this.connection.getLatestBlockhash("confirmed");

      console.log("Fresh blockhash obtained:", {
        blockhash,
        lastValidBlockHeight,
      });

      // Get swap transaction from Jupiter
      const swapResponse = await this.getSwapTransaction(
        jupiterQuote,
        userPublicKey,
        {
          computeUnitPriceMicroLamports: 10000, // Higher priority fee for this method
        }
      );

      // Deserialize and update transaction with fresh blockhash
      const swapTransactionBuf = Buffer.from(
        swapResponse.swapTransaction,
        "base64"
      );
      const originalTransaction =
        VersionedTransaction.deserialize(swapTransactionBuf);

      // Update with our fresh blockhash
      const { MessageV0 } = await import("@solana/web3.js");
      const serializedMessage = originalTransaction.message.serialize();

      let updatedTransaction: VersionedTransaction;
      if (originalTransaction.message.version === 0) {
        const deserializedMessage = MessageV0.deserialize(serializedMessage);
        deserializedMessage.recentBlockhash = blockhash;
        updatedTransaction = new VersionedTransaction(deserializedMessage);
      } else {
        throw new Error("Legacy transaction format not supported");
      }

      console.log("Transaction prepared with fresh blockhash, signing...");
      const signedTransaction = await signTransaction(updatedTransaction);

      console.log("Sending transaction immediately...");
      const signature = await this.connection.sendRawTransaction(
        signedTransaction.serialize(),
        {
          skipPreflight: true,
          maxRetries: 2,
          preflightCommitment: "processed",
        }
      );

      console.log("Transaction sent:", signature);

      // Confirm with our fresh blockhash info
      const confirmation = await this.confirmTransactionWithTimeout(
        signature,
        blockhash,
        lastValidBlockHeight,
        45000 // 45 second timeout for this method
      );

      if (confirmation.value?.err) {
        throw new Error(
          `Transaction failed: ${JSON.stringify(confirmation.value.err)}`
        );
      }

      console.log("Transaction confirmed:", confirmation);
      return signature;
    } catch (error) {
      console.error("Fresh blockhash swap execution failed:", error);
      throw error;
    }
  }

  // Convert Jupiter quote to our internal format with proper decimal handling
  convertQuoteToInternal(
    jupiterQuote: JupiterQuoteResponse,
    inputToken: Token,
    outputToken: Token
  ): QuoteResponse {
    console.log("Converting Jupiter quote:", {
      jupiterQuote,
      inputToken,
      outputToken,
    });

    // Convert from smallest units to human readable amounts
    const inputAmountHuman =
      parseFloat(jupiterQuote.inAmount) / Math.pow(10, inputToken.decimals);
    const outputAmountHuman =
      parseFloat(jupiterQuote.outAmount) / Math.pow(10, outputToken.decimals);

    // Calculate exchange rate
    const exchangeRate = outputAmountHuman / inputAmountHuman;

    // Parse price impact (convert from decimal to percentage)
    const priceImpact = Math.abs(
      parseFloat(jupiterQuote.priceImpactPct || "0")
    );

    // Calculate minimum output amount with slippage
    const slippageDecimal = jupiterQuote.slippageBps / 10000; // Convert BPS to decimal
    const minOutputAmountHuman = outputAmountHuman * (1 - slippageDecimal);

    // Extract route information
    const route = jupiterQuote.routePlan.map((plan) => plan.swapInfo.label);

    // Calculate fee in human readable format
    const totalFeeAmount = jupiterQuote.routePlan.reduce((acc, plan) => {
      return acc + parseFloat(plan.swapInfo.feeAmount || "0");
    }, 0);
    const feeHuman = totalFeeAmount / Math.pow(10, inputToken.decimals);

    const convertedQuote: QuoteResponse & {
      _displayAmounts?: {
        inputAmountHuman: string;
        outputAmountHuman: string;
        minOutputAmountHuman: string;
        exchangeRate: string;
      };
    } = {
      inputToken,
      outputToken,
      inputAmount: jupiterQuote.inAmount, // Keep original for execution
      outputAmount: jupiterQuote.outAmount, // Keep original for execution
      priceImpact,
      fee: feeHuman.toFixed(6),
      route,
      slippage: jupiterQuote.slippageBps / 100, // Convert BPS to percentage
      minOutputAmount: Math.floor(
        minOutputAmountHuman * Math.pow(10, outputToken.decimals)
      ).toString(),
      quoteId: this.generateQuoteId(jupiterQuote),
      validUntil: Date.now() + 20000, // Reduced to 20 seconds for faster refresh
      _displayAmounts: {
        inputAmountHuman: inputAmountHuman.toString(),
        outputAmountHuman: outputAmountHuman.toString(),
        minOutputAmountHuman: minOutputAmountHuman.toString(),
        exchangeRate: exchangeRate.toString(),
      },
    };

    console.log("Converted quote:", convertedQuote);
    return convertedQuote;
  }

  // Generate a unique quote ID
  private generateQuoteId(jupiterQuote: JupiterQuoteResponse): string {
    return `jupiter_${Date.now()}_${jupiterQuote.contextSlot}`;
  }

  // Get token list from Jupiter (for popular tokens)
  async getTokenList(): Promise<Token[]> {
    try {
      const response = await fetch("https://token.jup.ag/all");
      if (!response.ok) {
        throw new Error("Failed to fetch Jupiter token list");
      }

      const tokens = await response.json();

      // Convert Jupiter tokens to our format and filter for devnet-compatible tokens
      const convertedTokens = tokens
        .filter((token: any) => {
          // Only include well-known tokens that are likely available on devnet
          const popularSymbols = [
            "SOL",
            "USDC",
            "USDT",
            "BONK",
            "JUP",
            "WIF",
            "RAY",
            "SRM",
          ];
          return popularSymbols.includes(token.symbol);
        })
        .map((token: any) => ({
          address: token.address,
          symbol: token.symbol,
          name: token.name,
          decimals: token.decimals,
          logoURI: token.logoURI || "",
          verified: token.verified || false,
          tags: token.tags || [],
        }));

      console.log("Filtered Jupiter tokens for devnet:", convertedTokens);
      return convertedTokens;
    } catch (error) {
      console.error("Failed to fetch Jupiter token list:", error);
      return [];
    }
  }

  // Check if token is supported by Jupiter
  async isTokenSupported(tokenMint: string): Promise<boolean> {
    try {
      const tokens = await this.getTokenList();
      return tokens.some((token) => token.address === tokenMint);
    } catch {
      return false;
    }
  }

  // Get current SOL price (for fee calculations)
  async getSOLPrice(): Promise<number> {
    try {
      const response = await fetch(
        "https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd"
      );
      const data = await response.json();
      return data.solana.usd;
    } catch {
      return 100; // Fallback price
    }
  }
}

export const jupiterSwapService = new JupiterSwapService();
export { JupiterSwapService };
