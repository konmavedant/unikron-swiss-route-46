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
import { BN, web3 } from "@project-serum/anchor";
import { sha256 } from "js-sha256";
import type { Token, SwapQuote } from "@/types";

// Your contract's program ID - replace with your actual deployed program ID
const PROGRAM_ID = new PublicKey(
  "2bgpPzHUWu9jRAMUcF2Kex4dKti6U554hkhpkBi4EpHK"
);

// Contract constants
const FEE_BASIS_POINTS = 30; // 0.3% protocol fee
const LIQUIDITY_STAKER_PDA_SEED = Buffer.from("liquidity_staker");
const TREASURY_PDA_SEED = Buffer.from("treasury");
const BOUNTY_PDA_SEED = Buffer.from("bounty");

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

class ContractSwapService {
  private connection: Connection;
  private programId: PublicKey;

  constructor(programId?: string) {
    this.connection = new Connection(
      process.env.NEXT_PUBLIC_SOLANA_RPC_URL || "https://api.devnet.solana.com",
      "confirmed"
    );
    this.programId = new PublicKey(programId || PROGRAM_ID);
  }

  // Generate a unique nonce for the trade
  private generateNonce(): BN {
    return new BN(Date.now() + Math.floor(Math.random() * 1000));
  }

  // Create trade intent data
  private createTradeIntentData(
    userPublicKey: PublicKey,
    relayerPublicKey: PublicKey,
    inputToken: Token,
    outputToken: Token,
    inputAmount: string,
    minOutputAmount: string,
    nonce: BN
  ): TradeIntentData {
    const expiry = new BN(Math.floor(Date.now() / 1000) + 300); // 5 minutes from now
    const relayerFee = new BN(0); // No relayer fee for now

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

  // Hash the trade intent data
  private hashTradeIntent(intentData: TradeIntentData): Buffer {
    // Serialize the trade intent data (simplified version)
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

  // Find PDA for swap intent
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

  // Find fee collection authority PDA
  private findFeeCollectionAuthorityPDA(): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [Buffer.from("fee_authority")],
      this.programId
    );
  }

  // Find fee collection account PDA
  private findFeeCollectionAccountPDA(
    tokenMint: PublicKey
  ): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [Buffer.from("fee_collection"), tokenMint.toBuffer()],
      this.programId
    );
  }

  // Get or create associated token accounts
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

    // User token accounts
    const userTokenInAccount = await getAssociatedTokenAddress(
      tokenInMint,
      userPublicKey
    );
    const userTokenOutAccount = await getAssociatedTokenAddress(
      tokenOutMint,
      userPublicKey
    );

    // Relayer token accounts
    const relayerTokenInAccount = await getAssociatedTokenAddress(
      tokenInMint,
      relayerPublicKey
    );
    const relayerTokenOutAccount = await getAssociatedTokenAddress(
      tokenOutMint,
      relayerPublicKey
    );

    // Fee collection accounts
    const [feeCollectionAuthority] = this.findFeeCollectionAuthorityPDA();
    const [feeCollectionAccount] =
      this.findFeeCollectionAccountPDA(tokenInMint);

    // Check if accounts exist and create if needed
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

  // Create ED25519 signature instruction
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

  private async getAnchorDiscriminator(name: string) {
    const preimage = `global:${name}`;
    const hash = sha256.digest(preimage);
    return Buffer.from(hash).subarray(0, 8); // First 8 bytes
  }

  // Build commit transaction
  async buildCommitTransaction(
    userPublicKey: PublicKey,
    intentHash: Buffer,
    nonce: BN
  ): Promise<Transaction> {
    const [swapIntentPDA] = this.findSwapIntentPDA(userPublicKey, nonce);

    const expiry = new BN(Math.floor(Date.now() / 1000) + 300); // 5 minutes

    // Create commit instruction data
    const instructionData = Buffer.concat([
      Buffer.from([0]), // Instruction discriminator for commit
      intentHash,
      nonce.toArrayLike(Buffer, "le", 8),
      expiry.toArrayLike(Buffer, "le", 8),
    ]);

    const commitInstruction = new TransactionInstruction({
      keys: [
        { pubkey: swapIntentPDA, isSigner: false, isWritable: true },
        { pubkey: userPublicKey, isSigner: true, isWritable: true },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      ],
      programId: this.programId,
      data: instructionData,
    });

    const transaction = new Transaction();
    transaction.add(commitInstruction);

    return transaction;
  }

  // Build reveal transaction
  async buildRevealTransaction(
    userPublicKey: PublicKey,
    relayerPublicKey: PublicKey,
    intentData: TradeIntentData,
    intentHash: Buffer,
    signature: Uint8Array,
    tokenInMint: PublicKey,
    tokenOutMint: PublicKey
  ): Promise<Transaction> {
    const [swapIntentPDA] = this.findSwapIntentPDA(
      userPublicKey,
      intentData.nonce
    );

    // Get token accounts
    const { accounts, instructions } = await this.getOrCreateTokenAccounts(
      userPublicKey,
      relayerPublicKey,
      tokenInMint,
      tokenOutMint
    );

    const transaction = new Transaction();

    // Add account creation instructions if needed
    if (instructions.length > 0) {
      transaction.add(...instructions);
    }

    // Add ED25519 signature verification instruction
    const ed25519Instruction = this.createEd25519Instruction(
      signature,
      userPublicKey.toBytes(),
      intentHash
    );
    transaction.add(ed25519Instruction);

    // Serialize intent data for the instruction
    const serializedIntent = Buffer.concat([
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

    // Create reveal instruction data
    const discriminator = this.getAnchorDiscriminator("reveal");
    const instructionData = Buffer.concat([
      discriminator,
      serializedIntent,
      intentHash,
      signature,
    ]);

    const revealInstruction = new TransactionInstruction({
      keys: [
        { pubkey: swapIntentPDA, isSigner: false, isWritable: true },
        { pubkey: userPublicKey, isSigner: true, isWritable: true },
        {
          pubkey: SYSVAR_INSTRUCTIONS_PUBKEY,
          isSigner: false,
          isWritable: false,
        },
        {
          pubkey: accounts.userTokenInAccount,
          isSigner: false,
          isWritable: true,
        },
        {
          pubkey: accounts.userTokenOutAccount,
          isSigner: false,
          isWritable: true,
        },
        {
          pubkey: accounts.relayerTokenInAccount,
          isSigner: false,
          isWritable: true,
        },
        {
          pubkey: accounts.relayerTokenOutAccount,
          isSigner: false,
          isWritable: true,
        },
        { pubkey: relayerPublicKey, isSigner: true, isWritable: true },
        { pubkey: tokenInMint, isSigner: false, isWritable: false },
        { pubkey: tokenOutMint, isSigner: false, isWritable: false },
        {
          pubkey: accounts.feeCollectionAccount,
          isSigner: false,
          isWritable: true,
        },
        {
          pubkey: accounts.feeCollectionAuthority,
          isSigner: false,
          isWritable: false,
        },
        { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      ],
      programId: this.programId,
      data: instructionData,
    });

    transaction.add(revealInstruction);

    return transaction;
  }

  // Execute the complete swap flow
  async executeSwap(
    quote: SwapQuote,
    userPublicKey: PublicKey,
    signTransaction: (transaction: Transaction) => Promise<Transaction>,
    relayerPublicKey?: PublicKey
  ): Promise<string> {
    try {
      console.log("🚀 Starting contract-based swap execution...");

      // Use a default relayer if none provided (in production, this would be a known relayer)
      const relayer = relayerPublicKey || userPublicKey; // Self-relay for now

      const nonce = this.generateNonce();

      // Convert amounts to BN (assuming they're already in smallest units)
      const inputAmount = quote.inputAmount;
      const minOutputAmount = quote.minOutputAmount;

      // Create trade intent data
      const intentData = this.createTradeIntentData(
        userPublicKey,
        relayer,
        quote.inputToken,
        quote.outputToken,
        inputAmount,
        minOutputAmount,
        nonce
      );

      // Hash the intent
      const intentHash = this.hashTradeIntent(intentData);
      console.log("📝 Intent hash created:", intentHash.toString("hex"));

      // Step 1: Commit phase
      console.log("📤 Building commit transaction...");
      const commitTransaction = await this.buildCommitTransaction(
        userPublicKey,
        intentHash,
        nonce
      );

      // Get recent blockhash
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

      // Step 2: Create ED25519 signature for reveal
      console.log("🔐 Creating ED25519 signature...");

      // For demo purposes, we'll create a temporary keypair
      // In production, this should be done securely
      const tempKeypair = Keypair.generate();
      const messageToSign = intentHash;

      // Sign the message with the temporary keypair
      const ed25519Signature = tempKeypair.secretKey.slice(0, 64); // This is a placeholder

      // Step 3: Reveal phase
      console.log("📤 Building reveal transaction...");
      const revealTransaction = await this.buildRevealTransaction(
        userPublicKey,
        relayer,
        intentData,
        intentHash,
        ed25519Signature,
        new PublicKey(quote.inputToken.address),
        new PublicKey(quote.outputToken.address)
      );

      // Get fresh blockhash for reveal transaction
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

  // Initialize fee accounts for a token (call this once per token)
  async initializeFeeAccounts(
    tokenMint: PublicKey,
    payerPublicKey: PublicKey,
    signTransaction: (transaction: Transaction) => Promise<Transaction>
  ): Promise<string> {
    const [feeCollectionAuthority] = this.findFeeCollectionAuthorityPDA();
    const [liquidityStakerAccount] = PublicKey.findProgramAddressSync(
      [LIQUIDITY_STAKER_PDA_SEED, tokenMint.toBuffer()],
      this.programId
    );
    const [treasuryAccount] = PublicKey.findProgramAddressSync(
      [TREASURY_PDA_SEED, tokenMint.toBuffer()],
      this.programId
    );
    const [bountyAccount] = PublicKey.findProgramAddressSync(
      [BOUNTY_PDA_SEED, tokenMint.toBuffer()],
      this.programId
    );
    const [feeCollectionAccount] = this.findFeeCollectionAccountPDA(tokenMint);

    const instructionData = Buffer.from([2]); // Instruction discriminator for initialize

    const initializeInstruction = new TransactionInstruction({
      keys: [
        { pubkey: feeCollectionAuthority, isSigner: false, isWritable: true },
        { pubkey: liquidityStakerAccount, isSigner: false, isWritable: true },
        { pubkey: treasuryAccount, isSigner: false, isWritable: true },
        { pubkey: bountyAccount, isSigner: false, isWritable: true },
        { pubkey: feeCollectionAccount, isSigner: false, isWritable: true },
        { pubkey: tokenMint, isSigner: false, isWritable: false },
        { pubkey: payerPublicKey, isSigner: true, isWritable: true },
        { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
        { pubkey: web3.SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false },
      ],
      programId: this.programId,
      data: instructionData,
    });

    const transaction = new Transaction();
    transaction.add(initializeInstruction);

    const { blockhash } = await this.connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = payerPublicKey;

    const signedTx = await signTransaction(transaction);
    const signature = await this.connection.sendRawTransaction(
      signedTx.serialize()
    );

    await this.connection.confirmTransaction(signature, "confirmed");
    return signature;
  }

  // Check if fee accounts are initialized for a token
  async areFeeAccountsInitialized(tokenMint: PublicKey): Promise<boolean> {
    try {
      const [feeCollectionAccount] =
        this.findFeeCollectionAccountPDA(tokenMint);
      const accountInfo = await this.connection.getAccountInfo(
        feeCollectionAccount
      );
      return accountInfo !== null;
    } catch {
      return false;
    }
  }
}

export const contractSwapService = new ContractSwapService();
export { ContractSwapService };
