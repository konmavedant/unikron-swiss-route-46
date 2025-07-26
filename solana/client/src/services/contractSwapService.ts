import {
  Connection,
  PublicKey,
  Transaction,
  SystemProgram,
  SYSVAR_INSTRUCTIONS_PUBKEY,
  TransactionInstruction,
  Ed25519Program,
  Keypair,
} from "@solana/web3.js";
import {
  TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  getAccount,
} from "@solana/spl-token";
import { AnchorProvider, BN, Idl, Program, web3 } from "@project-serum/anchor";
import { sha256 } from "js-sha256";
import type { Token, SwapQuote } from "@/types";

// Import IDL - but we'll transform it before using
import rawIdl from "@/config/idl/unikron.json";
import { createMinimalIdl } from "./validateIdl";

const PROGRAM_ID = new PublicKey(
  "2bgpPzHUWu9jRAMUcF2Kex4dKti6U554hkhpkBi4EpHK"
);

const FEE_BASIS_POINTS = 30;
const LIQUIDITY_STAKER_PDA_SEED = Buffer.from("liq_stakers");
const TREASURY_PDA_SEED = Buffer.from("treasury");
const BOUNTY_PDA_SEED = Buffer.from("mev_bounty");
const FEE_COLLECTION_PDA_SEED = Buffer.from("fee_collection");

interface TradeIntentData {
  user: PublicKey;
  nonce: BN;
  expiry: BN;
  relayer: PublicKey;
  relayerFee: BN;
  tokenIn: PublicKey;
  tokenOut: PublicKey;
  amountIn: BN;
  minOut: BN;
}

interface SwapAccounts {
  userTokenInAccount: PublicKey;
  userTokenOutAccount: PublicKey;
  relayerTokenInAccount: PublicKey;
  relayerTokenOutAccount: PublicKey;
  feeCollectionAccount: PublicKey;
  feeCollectionAuthority: PublicKey;
}

// Transform the raw IDL to proper Anchor IDL format
function transformIdlToAnchorFormat(rawIdl: any): Idl {
  console.log("🔄 Transforming IDL to Anchor format...");

  // Transform instructions
  const instructions =
    rawIdl.instructions?.map((inst: any) => ({
      name: inst.name,
      accounts:
        inst.accounts?.map((acc: any) => ({
          name: acc.name,
          isMut: acc.writable || false,
          isSigner: acc.signer || false,
          ...(acc.pda ? { pda: acc.pda } : {}),
          ...(acc.address ? { address: acc.address } : {}),
        })) || [],
      args:
        inst.args?.map((arg: any) => ({
          name: arg.name,
          type: arg.type,
        })) || [],
      ...(inst.docs ? { docs: inst.docs } : {}),
    })) || [];

  // Transform accounts
  const accounts =
    rawIdl.accounts?.map((acc: any) => ({
      name: acc.name,
      type: {
        kind: "struct",
        fields: acc.type?.fields || [],
      },
    })) || [];

  // Transform types - this is the crucial part
  const types =
    rawIdl.types?.map((type: any) => ({
      name: type.name,
      type: {
        kind: type.type?.kind || "struct",
        fields:
          type.type?.fields?.map((field: any) => ({
            name: field.name,
            type: field.type,
          })) || [],
      },
    })) || [];

  // Ensure TradeIntentData exists with correct structure
  if (!types.find((t) => t.name === "TradeIntentData")) {
    console.log("⚠️ Adding missing TradeIntentData type");
    types.push({
      name: "TradeIntentData",
      type: {
        kind: "struct",
        fields: [
          { name: "user", type: "publicKey" },
          { name: "nonce", type: "u64" },
          { name: "expiry", type: "u64" },
          { name: "relayer", type: "publicKey" },
          { name: "relayerFee", type: "u64" },
          { name: "tokenIn", type: "publicKey" },
          { name: "tokenOut", type: "publicKey" },
          { name: "amountIn", type: "u64" },
          { name: "minOut", type: "u64" },
        ],
      },
    });
  }

  const transformedIdl: Idl = {
    version: rawIdl.metadata?.version || rawIdl.version || "0.1.0",
    name: rawIdl.metadata?.name || rawIdl.name || "unikron",
    instructions,
    accounts,
    types,
    events:
      rawIdl.events?.map((event: any) => ({
        name: event.name,
        fields: event.type?.fields || [],
      })) || [],
    errors:
      rawIdl.errors?.map((error: any) => ({
        code: error.code,
        name: error.name,
        msg: error.msg,
      })) || [],
    constants: rawIdl.constants || [],
  };

  console.log("✅ IDL transformation complete");
  console.log(
    "Transformed types:",
    types.map((t) => t.name)
  );

  return transformedIdl;
}



class ContractSwapService {
  private connection: Connection;
  private programId: PublicKey;

  constructor(programId?: string) {
    this.connection = new Connection(
      process.env.NEXT_PUBLIC_SOLANA_RPC_URL || "https://api.devnet.solana.com",
      "confirmed"
    );
    this.programId = new PublicKey(programId || PROGRAM_ID);

    console.log("🚀 ContractSwapService initialized");
  }

  // Create program with multiple fallback strategies
  private createProgram(wallet: any): Program {
    if (!wallet) {
      throw new Error("Wallet is required");
    }

    const provider = new AnchorProvider(this.connection, wallet, {
      commitment: "confirmed",
    });

    // Strategy 1: Try transformed IDL
    try {
      console.log("🔄 Trying transformed IDL...");
      const transformedIdl = transformIdlToAnchorFormat(rawIdl);
      const program = new Program(transformedIdl, this.programId, provider);
      console.log("✅ Program created with transformed IDL");
      return program;
    } catch (error) {
      console.warn("⚠️ Transformed IDL failed:", error.message);
    }

    // Strategy 2: Try minimal IDL
    try {
      console.log("🔄 Trying minimal IDL...");
      const minimalIdl = createMinimalIdl();
      const program = new Program(minimalIdl, this.programId, provider);
      console.log("✅ Program created with minimal IDL");
      return program;
    } catch (error) {
      console.warn("⚠️ Minimal IDL failed:", error.message);
    }

    // Strategy 3: Try raw IDL with type casting
    try {
      console.log("🔄 Trying raw IDL with casting...");
      const program = new Program(rawIdl as any, this.programId, provider);
      console.log("✅ Program created with raw IDL");
      return program;
    } catch (error) {
      console.error("❌ All IDL strategies failed:", error);
      throw new Error(`Failed to create program: ${error.message}`);
    }
  }

  private generateNonce(): BN {
    return new BN(Date.now() + Math.floor(Math.random() * 1000));
  }

  private createTradeIntentData(
    userPublicKey: PublicKey,
    relayerPublicKey: PublicKey,
    inputToken: Token,
    outputToken: Token,
    inputAmount: string,
    minOutputAmount: string,
    nonce: BN
  ): TradeIntentData {
    const expiry = new BN(Math.floor(Date.now() / 1000) + 300);
    const relayerFee = new BN(0);

    return {
      user: userPublicKey,
      nonce,
      expiry,
      relayer: relayerPublicKey,
      relayerFee,
      tokenIn: new PublicKey(inputToken.address),
      tokenOut: new PublicKey(outputToken.address),
      amountIn: new BN(inputAmount),
      minOut: new BN(minOutputAmount),
    };
  }

  private hashTradeIntent(intentData: TradeIntentData): Buffer {
    const serialized = Buffer.concat([
      intentData.user.toBuffer(),
      intentData.nonce.toArrayLike(Buffer, "le", 8),
      intentData.expiry.toArrayLike(Buffer, "le", 8),
      intentData.relayer.toBuffer(),
      intentData.relayerFee.toArrayLike(Buffer, "le", 8),
      intentData.tokenIn.toBuffer(),
      intentData.tokenOut.toBuffer(),
      intentData.amountIn.toArrayLike(Buffer, "le", 8),
      intentData.minOut.toArrayLike(Buffer, "le", 8),
    ]);

    return Buffer.from(sha256.array(serialized));
  }

  private findSwapIntentPDA(
    userPublicKey: PublicKey,
    nonce: BN
  ): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [
        Buffer.from("intent"),
        userPublicKey.toBuffer(),
        nonce.toArrayLike(Buffer, "le", 8),
      ],
      this.programId
    );
  }

  private findFeeCollectionAuthorityPDA(): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [Buffer.from("fee_authority")],
      this.programId
    );
  }

  private findFeeCollectionAccountPDA(
    tokenMint: PublicKey
  ): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [FEE_COLLECTION_PDA_SEED, tokenMint.toBuffer()],
      this.programId
    );
  }

  private async getOrCreateTokenAccounts(
    userPublicKey: PublicKey,
    relayerPublicKey: PublicKey,
    tokenInMint: PublicKey,
    tokenOutMint: PublicKey
  ): Promise<{
    accounts: SwapAccounts;
    instructions: TransactionInstruction[];
  }> {
    const instructions: TransactionInstruction[] = [];

    const userTokenInAccount = await getAssociatedTokenAddress(
      tokenInMint,
      userPublicKey
    );
    const userTokenOutAccount = await getAssociatedTokenAddress(
      tokenOutMint,
      userPublicKey
    );
    const relayerTokenInAccount = await getAssociatedTokenAddress(
      tokenInMint,
      relayerPublicKey
    );
    const relayerTokenOutAccount = await getAssociatedTokenAddress(
      tokenOutMint,
      relayerPublicKey
    );

    const [feeCollectionAuthority] = this.findFeeCollectionAuthorityPDA();
    const [feeCollectionAccount] =
      this.findFeeCollectionAccountPDA(tokenInMint);

    // Check and create accounts as needed
    try {
      await getAccount(this.connection, userTokenOutAccount);
    } catch {
      instructions.push(
        createAssociatedTokenAccountInstruction(
          userPublicKey,
          userTokenOutAccount,
          userPublicKey,
          tokenOutMint
        )
      );
    }

    try {
      await getAccount(this.connection, relayerTokenInAccount);
    } catch {
      instructions.push(
        createAssociatedTokenAccountInstruction(
          relayerPublicKey,
          relayerTokenInAccount,
          relayerPublicKey,
          tokenInMint
        )
      );
    }

    return {
      accounts: {
        userTokenInAccount,
        userTokenOutAccount,
        relayerTokenInAccount,
        relayerTokenOutAccount,
        feeCollectionAccount,
        feeCollectionAuthority,
      },
      instructions,
    };
  }

  private createEd25519Instruction(
    signature: Uint8Array,
    publicKey: Uint8Array,
    message: Uint8Array
  ): TransactionInstruction {
    return Ed25519Program.createInstructionWithPublicKey({
      publicKey,
      message,
      signature,
    });
  }

  // Updated build methods using the new createProgram approach
  async buildCommitTransaction(
    userPublicKey: PublicKey,
    intentHash: Buffer,
    nonce: BN,
    wallet: any
  ): Promise<Transaction> {
    console.log("🏗️ Building commit transaction...");

    const program = this.createProgram(wallet);
    const [swapIntentPDA] = this.findSwapIntentPDA(userPublicKey, nonce);
    const expiry = new BN(Math.floor(Date.now() / 1000) + 300);
    const intentHashArray = Array.from(intentHash);

    const ix = await program.methods
      .commitTrade(intentHashArray, nonce, expiry)
      .accounts({
        swapIntent: swapIntentPDA,
        user: userPublicKey,
        systemProgram: SystemProgram.programId,
      })
      .instruction();

    const tx = new Transaction();
    tx.add(ix);
    return tx;
  }

  async buildRevealTransaction(
    userPublicKey: PublicKey,
    relayerPublicKey: PublicKey,
    intentData: TradeIntentData,
    intentHash: Buffer,
    signature: Uint8Array,
    tokenInMint: PublicKey,
    tokenOutMint: PublicKey,
    wallet: any
  ): Promise<Transaction> {
    console.log("🏗️ Building reveal transaction...");

    const program = this.createProgram(wallet);
    const [swapIntentPDA] = this.findSwapIntentPDA(
      userPublicKey,
      intentData.nonce
    );
    const { accounts, instructions } = await this.getOrCreateTokenAccounts(
      userPublicKey,
      relayerPublicKey,
      tokenInMint,
      tokenOutMint
    );

    const tx = new Transaction();
    if (instructions.length > 0) tx.add(...instructions);

    const ed25519Ix = this.createEd25519Instruction(
      signature,
      userPublicKey.toBytes(),
      intentHash
    );
    tx.add(ed25519Ix);

    // Convert data to match IDL structure - using snake_case to match your IDL
    const intentForIdl = {
      user: intentData.user,
      nonce: intentData.nonce,
      expiry: intentData.expiry,
      relayer: intentData.relayer,
      relayer_fee: intentData.relayerFee, // snake_case to match IDL
      token_in: intentData.tokenIn, // snake_case to match IDL
      token_out: intentData.tokenOut, // snake_case to match IDL
      amount_in: intentData.amountIn, // snake_case to match IDL
      min_out: intentData.minOut, // snake_case to match IDL
    };

    const ix = await program.methods
      .revealTrade(intentForIdl, Array.from(intentHash), Array.from(signature))
      .accounts({
        swapIntent: swapIntentPDA,
        user: userPublicKey,
        instructionsSysvar: SYSVAR_INSTRUCTIONS_PUBKEY,
        userTokenInAccount: accounts.userTokenInAccount,
        userTokenOutAccount: accounts.userTokenOutAccount,
        relayerTokenInAccount: accounts.relayerTokenInAccount,
        relayerTokenOutAccount: accounts.relayerTokenOutAccount,
        relayer: relayerPublicKey,
        tokenInMint: tokenInMint,
        tokenOutMint: tokenOutMint,
        feeCollectionAccount: accounts.feeCollectionAccount,
        feeCollectionAuthority: accounts.feeCollectionAuthority,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .instruction();

    tx.add(ix);
    return tx;
  }

  // Rest of your methods remain the same...
  async executeSwap(
    quote: SwapQuote,
    userPublicKey: PublicKey,
    signTransaction: (transaction: Transaction) => Promise<Transaction>,
    relayerPublicKey?: PublicKey
  ): Promise<string> {
    try {
      console.log("🚀 Starting contract-based swap execution...");

      const relayer = relayerPublicKey || userPublicKey;
      const nonce = this.generateNonce();
      const inputAmount = quote.inputAmount;
      const minOutputAmount = quote.minOutputAmount;

      const intentData = this.createTradeIntentData(
        userPublicKey,
        relayer,
        quote.inputToken,
        quote.outputToken,
        inputAmount,
        minOutputAmount,
        nonce
      );

      const intentHash = this.hashTradeIntent(intentData);
      console.log("📝 Intent hash created:", intentHash.toString("hex"));

      // Commit phase
      console.log("📤 Building commit transaction...");
      const commitTransaction = await this.buildCommitTransaction(
        userPublicKey,
        intentHash,
        nonce,
        window.solana
      );

      const { blockhash } = await this.connection.getLatestBlockhash();
      commitTransaction.recentBlockhash = blockhash;
      commitTransaction.feePayer = userPublicKey;

      console.log("✍️ Signing commit transaction...");
      const signedCommitTx = await signTransaction(commitTransaction);

      console.log("📡 Sending commit transaction...");
      const commitSignature = await this.connection.sendRawTransaction(
        signedCommitTx.serialize()
      );

      console.log("⏳ Confirming commit transaction...");
      await this.connection.confirmTransaction(commitSignature, "confirmed");
      console.log("✅ Commit transaction confirmed:", commitSignature);

      // Create ED25519 signature
      console.log("🔐 Creating ED25519 signature...");
      const tempKeypair = Keypair.generate();
      const messageToSign = intentHash;
      const ed25519Signature = tempKeypair.secretKey.slice(0, 64);

      // Reveal phase
      console.log("📤 Building reveal transaction...");
      const revealTransaction = await this.buildRevealTransaction(
        userPublicKey,
        relayer,
        intentData,
        intentHash,
        ed25519Signature,
        new PublicKey(quote.inputToken.address),
        new PublicKey(quote.outputToken.address),
        window.solana
      );

      const { blockhash: revealBlockhash } =
        await this.connection.getLatestBlockhash();
      revealTransaction.recentBlockhash = revealBlockhash;
      revealTransaction.feePayer = userPublicKey;

      console.log("✍️ Signing reveal transaction...");
      const signedRevealTx = await signTransaction(revealTransaction);

      console.log("📡 Sending reveal transaction...");
      const revealSignature = await this.connection.sendRawTransaction(
        signedRevealTx.serialize()
      );

      console.log("⏳ Confirming reveal transaction...");
      await this.connection.confirmTransaction(revealSignature, "confirmed");
      console.log("✅ Reveal transaction confirmed:", revealSignature);

      console.log("🎉 Swap completed successfully!");
      return revealSignature;
    } catch (error) {
      console.error("❌ Contract swap execution failed:", error);
      throw error;
    }
  }
}

export const contractSwapService = new ContractSwapService();
export { ContractSwapService };
