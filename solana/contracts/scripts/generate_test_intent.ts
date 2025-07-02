/**
 * generate_test_intent.ts
 * Generates and signs a valid TradeIntent for testing purposes
 */

import * as anchor from "@coral-xyz/anchor";
import { 
  PublicKey, 
  Keypair, 
  Connection, 
  clusterApiUrl,
  SystemProgram,
  Transaction
} from "@solana/web3.js";
import { createHash, randomBytes } from "crypto";
import * as ed25519 from "@noble/ed25519";

interface TradeIntentData {
  user: PublicKey;
  nonce: number;
  expiry: number;
  relayer: PublicKey;
  relayer_fee: number;
  token_in: PublicKey;
  token_out: PublicKey;
  amount_in: number;
  min_out: number;
}

interface SignedTradeIntent {
  intent: TradeIntentData;
  signature: Uint8Array;
  intentHash: string;
  publicKey: PublicKey;
}

interface JupiterRouteInfo {
  inputMint: string;
  inAmount: string;
  outputMint: string;
  outAmount: string;
  otherAmountThreshold: string;
  swapMode: string;
  slippageBps: number;
  priceImpactPct: string;
  routePlan: Array<{
    percent: number;
    swapInfo: {
      ammKey: string;
      label: string;
      inputMint: string;
      outputMint: string;
      inAmount: string;
      outAmount: string;
      feeAmount: string;
      feeMint: string;
    }
  }>;
}

class TradeIntentGenerator {
  private connection: Connection;
  private userKeypair: Keypair;
  private relayerKeypair: Keypair;

  constructor(rpcUrl: string = clusterApiUrl("devnet")) {
    this.connection = new Connection(rpcUrl);
    this.userKeypair = Keypair.generate();
    this.relayerKeypair = Keypair.generate();
    
    console.log("👤 Generated User Keypair:", this.userKeypair.publicKey.toString());
    console.log("🔄 Generated Relayer Keypair:", this.relayerKeypair.publicKey.toString());
  }

  /**
   * Generate mock Jupiter route for testing
   */
  generateMockJupiterRoute(
    tokenIn: PublicKey,
    tokenOut: PublicKey,
    amountIn: number
  ): JupiterRouteInfo {
    const slippageBps = 500; // 5%
    const priceImpact = 0.1; // 0.1%
    const outAmount = Math.floor(amountIn * 0.95); // Mock 5% difference
    const minOut = Math.floor(outAmount * (1 - slippageBps / 10000));

    return {
      inputMint: tokenIn.toString(),
      inAmount: amountIn.toString(),
      outputMint: tokenOut.toString(),
      outAmount: outAmount.toString(),
      otherAmountThreshold: minOut.toString(),
      swapMode: "ExactIn",
      slippageBps,
      priceImpactPct: priceImpact.toString(),
      routePlan: [
        {
          percent: 100,
          swapInfo: {
            ammKey: "58oQChx4yWmvKdwLLZzBi4ChoCc2fqCUWBkwMihLYQo2", // Mock Raydium AMM
            label: "Raydium",
            inputMint: tokenIn.toString(),
            outputMint: tokenOut.toString(),
            inAmount: amountIn.toString(),
            outAmount: outAmount.toString(),
            feeAmount: "25000", // Mock fee
            feeMint: tokenIn.toString()
          }
        }
      ]
    };
  }

  /**
   * Create a trade intent with mock data
   */
  createTradeIntent(customParams?: Partial<TradeIntentData>): TradeIntentData {
    const currentTime = Math.floor(Date.now() / 1000);
    
    // Mock SPL token addresses (Devnet)
    const USDC_MINT = new PublicKey("4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU"); // Devnet USDC
    const SOL_MINT = new PublicKey("So11111111111111111111111111111111111111112"); // Wrapped SOL
    
    const defaultIntent: TradeIntentData = {
      user: this.userKeypair.publicKey,
      nonce: Math.floor(Math.random() * 1000000),
      expiry: currentTime + 3600, // 1 hour from now
      relayer: this.relayerKeypair.publicKey,
      relayer_fee: 1_000_000, // 0.001 SOL
      token_in: USDC_MINT,
      token_out: SOL_MINT,
      amount_in: 100_000_000, // 100 USDC (6 decimals)
      min_out: 500_000_000, // 0.5 SOL (9 decimals)
    };

    return { ...defaultIntent, ...customParams };
  }

  /**
   * Serialize TradeIntent for hashing
   */
  serializeTradeIntent(intent: TradeIntentData): Buffer {
    // Create a deterministic serialization
    const data = {
      user: intent.user.toString(),
      nonce: intent.nonce,
      expiry: intent.expiry,
      relayer: intent.relayer.toString(),
      relayer_fee: intent.relayer_fee,
      token_in: intent.token_in.toString(),
      token_out: intent.token_out.toString(),
      amount_in: intent.amount_in,
      min_out: intent.min_out
    };
    
    return Buffer.from(JSON.stringify(data, Object.keys(data).sort()));
  }

  /**
   * Hash a trade intent
   */
  hashTradeIntent(intent: TradeIntentData): string {
    const serialized = this.serializeTradeIntent(intent);
    return createHash('sha256').update(serialized).digest('hex');
  }

  /**
   * Sign a trade intent using ed25519
   */
  async signTradeIntent(intent: TradeIntentData): Promise<Uint8Array> {
    const intentHash = this.hashTradeIntent(intent);
    const messageBytes = Buffer.from(intentHash, 'hex');
    
    // Sign using the user's private key
    const signature = await ed25519.sign(messageBytes, this.userKeypair.secretKey.slice(0, 32));
    
    return signature;
  }

  /**
   * Generate a complete signed trade intent
   */
  async generateSignedIntent(customParams?: Partial<TradeIntentData>): Promise<SignedTradeIntent> {
    console.log("🔧 Generating TradeIntent...");
    
    const intent = this.createTradeIntent(customParams);
    console.log("📝 Created TradeIntent:", {
      user: intent.user.toString(),
      nonce: intent.nonce,
      expiry: new Date(intent.expiry * 1000).toISOString(),
      relayer: intent.relayer.toString(),
      relayer_fee: intent.relayer_fee,
      token_in: intent.token_in.toString(),
      token_out: intent.token_out.toString(),
      amount_in: intent.amount_in,
      min_out: intent.min_out
    });

    const intentHash = this.hashTradeIntent(intent);
    console.log("🔐 Intent Hash:", intentHash);

    const signature = await this.signTradeIntent(intent);
    console.log("✍️ Signature:", Buffer.from(signature).toString('hex'));

    return {
      intent,
      signature,
      intentHash,
      publicKey: this.userKeypair.publicKey
    };
  }

  /**
   * Generate multiple test intents for different scenarios
   */
  async generateTestSuite(): Promise<{
    validIntent: SignedTradeIntent;
    expiredIntent: SignedTradeIntent;
    largeAmountIntent: SignedTradeIntent;
    differentTokensIntent: SignedTradeIntent;
  }> {
    console.log("🧪 Generating Test Suite...");
    console.log("=".repeat(50));

    // Valid intent
    const validIntent = await this.generateSignedIntent();
    
    // Expired intent (already expired)
    const expiredIntent = await this.generateSignedIntent({
      expiry: Math.floor(Date.now() / 1000) - 3600, // 1 hour ago
      nonce: Math.floor(Math.random() * 1000000)
    });

    // Large amount intent
    const largeAmountIntent = await this.generateSignedIntent({
      amount_in: 1_000_000_000_000, // 1M USDC
      min_out: 5_000_000_000_000, // 5K SOL
      nonce: Math.floor(Math.random() * 1000000)
    });

    // Different tokens intent (e.g., USDC to USDT)
    const USDT_MINT = new PublicKey("Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB"); // Mainnet USDT
    const differentTokensIntent = await this.generateSignedIntent({
      token_out: USDT_MINT,
      nonce: Math.floor(Math.random() * 1000000)
    });

    console.log("\n✅ Test Suite Generated!");
    
    return {
      validIntent,
      expiredIntent,
      largeAmountIntent,
      differentTokensIntent
    };
  }

  /**
   * Verify a signature (for testing purposes)
   */
  async verifySignature(intent: TradeIntentData, signature: Uint8Array, publicKey: PublicKey): Promise<boolean> {
    try {
      const intentHash = this.hashTradeIntent(intent);
      const messageBytes = Buffer.from(intentHash, 'hex');
      
      return await ed25519.verify(signature, messageBytes, publicKey.toBytes());
    } catch (error) {
      console.error("Signature verification failed:", error);
      return false;
    }
  }

  /**
   * Generate intent for commit-reveal testing
   */
  async generateCommitRevealData() {
    const signedIntent = await this.generateSignedIntent();
    const intentHashBytes = Buffer.from(signedIntent.intentHash, 'hex');
    
    // Convert to the format expected by Solana program
    const intentHashArray: number[] = Array.from(intentHashBytes);
    const signatureArray: number[] = Array.from(signedIntent.signature);
    
    console.log("\n🔄 Commit-Reveal Data:");
    console.log("Intent Hash (for commit):", intentHashArray);
    console.log("Signature (for reveal):", signatureArray);
    console.log("Nonce:", signedIntent.intent.nonce);
    console.log("Expiry:", signedIntent.intent.expiry);
    
    return {
      ...signedIntent,
      intentHashArray,
      signatureArray
    };
  }

  // Getters for keypairs (useful for testing)
  getUserKeypair(): Keypair {
    return this.userKeypair;
  }

  getRelayerKeypair(): Keypair {
    return this.relayerKeypair;
  }
}

// Example usage and testing
async function main() {
  console.log("🚀 TradeIntent Generator Test");
  console.log("=".repeat(50));
  
  const generator = new TradeIntentGenerator();
  
  // Generate a single intent
  console.log("\n1️⃣ Generating Single Intent:");
  const singleIntent = await generator.generateSignedIntent();
  
  // Verify the signature
  const isValid = await generator.verifySignature(
    singleIntent.intent,
    singleIntent.signature,
    singleIntent.publicKey
  );
  console.log("🔍 Signature Valid:", isValid);
  
  // Generate test suite
  console.log("\n2️⃣ Generating Test Suite:");
  const testSuite = await generator.generateTestSuite();
  
  // Generate commit-reveal data
  console.log("\n3️⃣ Generating Commit-Reveal Data:");
  const commitRevealData = await generator.generateCommitRevealData();
  
  console.log("\n✅ All tests completed!");
  
  return {
    generator,
    singleIntent,
    testSuite,
    commitRevealData
  };
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

export { 
  TradeIntentGenerator, 
  TradeIntentData, 
  SignedTradeIntent, 
  JupiterRouteInfo 
};