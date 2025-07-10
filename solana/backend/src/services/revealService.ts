// src/services/revealService.ts
import { 
  Connection, 
  PublicKey, 
  Transaction,
  TransactionInstruction,
  sendAndConfirmTransaction,
  Ed25519Program,
  SYSVAR_INSTRUCTIONS_PUBKEY,
  SystemProgram
} from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { getSolanaConnection, getWallet, PROGRAM_ID } from './solanaService';
import { TokenAccountService } from './tokenAccountService';
import { TradeIntent } from '../types/TradeIntent';
import { logger } from '../utils/logger';
import prisma from '../db/prisma';

export interface RevealResult {
  transaction: string;
  success: boolean;
  amountOut: number;
  protocolFee: number;
  relayerFee: number;
  gasUsed?: number;
}

export class RevealService {
  private connection: Connection;
  private tokenAccountService: TokenAccountService;

  constructor() {
    this.connection = getSolanaConnection();
    this.tokenAccountService = new TokenAccountService();
  }

  /**
   * Complete reveal and execution flow
   */
  async executeReveal(
    intent: TradeIntent,
    expectedHash: string,
    signature: string,
    userWallet?: PublicKey
  ): Promise<RevealResult> {
    try {
      logger.info('Starting reveal execution', {
        intentHash: expectedHash,
        user: intent.user,
        tokenIn: intent.tokenIn,
        tokenOut: intent.tokenOut,
        amountIn: intent.amountIn
      });

      // Validate inputs
      this.validateRevealInputs(intent, expectedHash, signature);

      // Get user and relayer public keys
      const userPub = new PublicKey(intent.user);
      const relayerPub = new PublicKey(intent.relayer);
      const wallet = getWallet();

      // Prepare token accounts
      const tokenAccounts = await this.prepareTokenAccounts(
        userPub,
        relayerPub,
        new PublicKey(intent.tokenIn),
        new PublicKey(intent.tokenOut)
      );

      // Validate balances
      await this.validateBalances(userPub, intent, tokenAccounts);

      // Derive PDA for swap intent
      const [swapIntentPda] = this.deriveSwapIntentPda(userPub, intent.nonce);

      // Verify commitment exists
      await this.verifyCommitment(swapIntentPda, expectedHash);

      // Derive fee collection accounts
      const feeAccounts = await this.deriveFeeAccounts(new PublicKey(intent.tokenIn));

      // Build transaction
      const transaction = await this.buildRevealTransaction(
        intent,
        expectedHash,
        signature,
        swapIntentPda,
        tokenAccounts,
        feeAccounts,
        userPub,
        relayerPub
      );

      // Execute transaction
      const txSignature = await sendAndConfirmTransaction(
        this.connection,
        transaction,
        [wallet], // Relayer signs
        {
          commitment: 'confirmed',
          skipPreflight: false
        }
      );

      // Calculate results
      const protocolFee = Math.floor(intent.amountIn * 0.001); // 0.1%
      const actualAmountOut = Math.floor(intent.amountIn * 0.95); // Mock 5% difference

      // Update database
      await this.updateDatabase(expectedHash, txSignature, actualAmountOut, protocolFee);

      logger.info('Reveal execution completed successfully', {
        transaction: txSignature,
        intentHash: expectedHash,
        amountOut: actualAmountOut,
        protocolFee
      });

      return {
        transaction: txSignature,
        success: true,
        amountOut: actualAmountOut,
        protocolFee,
        relayerFee: intent.relayerFee
      };

    } catch (error) {
      logger.error('Reveal execution failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        intentHash: expectedHash,
        stack: error instanceof Error ? error.stack : undefined
      });

      // Update database with failure
      await this.updateDatabaseFailure(expectedHash, error instanceof Error ? error.message : 'Unknown error');

      throw error;
    }
  }

  /**
   * Validate reveal inputs
   */
  private validateRevealInputs(intent: TradeIntent, expectedHash: string, signature: string): void {
    if (!/^[0-9a-fA-F]{64}$/.test(expectedHash)) {
      throw new Error('Invalid expected hash format');
    }

    if (!/^[0-9a-fA-F]{128}$/.test(signature)) {
      throw new Error('Invalid signature format');
    }

    if (!intent.user || !intent.tokenIn || !intent.tokenOut) {
      throw new Error('Invalid intent: missing required fields');
    }

    if (intent.amountIn <= 0 || intent.minOut <= 0) {
      throw new Error('Invalid intent: amounts must be positive');
    }

    const currentTime = Math.floor(Date.now() / 1000);
    if (intent.expiry <= currentTime) {
      throw new Error('Intent has expired');
    }
  }

  /**
   * Prepare all required token accounts
   */
  private async prepareTokenAccounts(
    userPub: PublicKey,
    relayerPub: PublicKey,
    tokenInMint: PublicKey,
    tokenOutMint: PublicKey
  ) {
    const userTokenIn = await this.tokenAccountService.getAssociatedTokenAccount(userPub, tokenInMint);
    const userTokenOut = await this.tokenAccountService.getAssociatedTokenAccount(userPub, tokenOutMint);
    const relayerTokenIn = await this.tokenAccountService.getAssociatedTokenAccount(relayerPub, tokenInMint);
    const relayerTokenOut = await this.tokenAccountService.getAssociatedTokenAccount(relayerPub, tokenOutMint);

    return {
      userTokenIn,
      userTokenOut,
      relayerTokenIn,
      relayerTokenOut
    };
  }

  /**
   * Validate user has sufficient balance
   */
  private async validateBalances(
    userPub: PublicKey,
    intent: TradeIntent,
    tokenAccounts: any
  ): Promise<void> {
    const tokenInInfo = await this.tokenAccountService.getTokenAccountInfo(
      userPub,
      new PublicKey(intent.tokenIn)
    );

    if (!tokenInInfo.exists) {
      throw new Error(`User does not have a token account for ${intent.tokenIn}`);
    }

    if (tokenInInfo.amount < BigInt(intent.amountIn)) {
      throw new Error(`Insufficient balance. Required: ${intent.amountIn}, Available: ${tokenInInfo.amount}`);
    }
  }

  /**
   * Derive swap intent PDA
   */
  private deriveSwapIntentPda(userPub: PublicKey, nonce: number): [PublicKey, number] {
    const nonceBuffer = Buffer.alloc(8);
    nonceBuffer.writeBigUInt64LE(BigInt(nonce), 0);

    return PublicKey.findProgramAddressSync(
      [
        Buffer.from("intent"),
        userPub.toBuffer(),
        nonceBuffer
      ],
      PROGRAM_ID
    );
  }

  /**
   * Verify commitment exists on-chain
   */
  private async verifyCommitment(swapIntentPda: PublicKey, expectedHash: string): Promise<void> {
    const accountInfo = await this.connection.getAccountInfo(swapIntentPda);
    
    if (!accountInfo) {
      throw new Error('Swap intent commitment not found. Must commit first.');
    }

    // Additional validation can be added here to check the stored hash
    logger.debug('Commitment verified', {
      pda: swapIntentPda.toString(),
      expectedHash
    });
  }

  /**
   * Derive fee collection accounts
   */
  private async deriveFeeAccounts(tokenMint: PublicKey) {
    const [feeCollectionAuthority] = PublicKey.findProgramAddressSync(
      [Buffer.from("fee_authority")],
      PROGRAM_ID
    );

    const [feeCollectionAccount] = PublicKey.findProgramAddressSync(
      [Buffer.from("fee_collection"), tokenMint.toBuffer()],
      PROGRAM_ID
    );

    return {
      feeCollectionAuthority,
      feeCollectionAccount
    };
  }

  /**
   * Build the reveal transaction
   */
  private async buildRevealTransaction(
    intent: TradeIntent,
    expectedHash: string,
    signature: string,
    swapIntentPda: PublicKey,
    tokenAccounts: any,
    feeAccounts: any,
    userPub: PublicKey,
    relayerPub: PublicKey
  ): Promise<Transaction> {
    const transaction = new Transaction();

    // Add ed25519 signature verification instruction
    const ed25519Instruction = Ed25519Program.createInstructionWithPublicKey({
      publicKey: userPub.toBytes(),
      message: Buffer.from(expectedHash, 'hex'),
      signature: Buffer.from(signature, 'hex')
    });
    transaction.add(ed25519Instruction);

    // Create reveal instruction data
    const intentData = this.serializeTradeIntentData(intent);
    const expectedHashBytes = Buffer.from(expectedHash, 'hex');
    const signatureBytes = Buffer.from(signature, 'hex');

    // Build instruction data buffer
    const instructionData = Buffer.concat([
      Buffer.from([72, 86, 206, 182, 223, 187, 228, 226]), // discriminator
      intentData,
      expectedHashBytes,
      signatureBytes
    ]);

    // Create reveal instruction
    const revealInstruction = new TransactionInstruction({
      keys: [
        { pubkey: swapIntentPda, isSigner: false, isWritable: true },
        { pubkey: userPub, isSigner: false, isWritable: true },
        { pubkey: SYSVAR_INSTRUCTIONS_PUBKEY, isSigner: false, isWritable: false },
        { pubkey: tokenAccounts.userTokenIn, isSigner: false, isWritable: true },
        { pubkey: tokenAccounts.userTokenOut, isSigner: false, isWritable: true },
        { pubkey: tokenAccounts.relayerTokenIn, isSigner: false, isWritable: true },
        { pubkey: tokenAccounts.relayerTokenOut, isSigner: false, isWritable: true },
        { pubkey: relayerPub, isSigner: true, isWritable: true },
        { pubkey: new PublicKey(intent.tokenIn), isSigner: false, isWritable: false },
        { pubkey: new PublicKey(intent.tokenOut), isSigner: false, isWritable: false },
        { pubkey: feeAccounts.feeCollectionAccount, isSigner: false, isWritable: true },
        { pubkey: feeAccounts.feeCollectionAuthority, isSigner: false, isWritable: false },
        { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false }
      ],
      programId: PROGRAM_ID,
      data: instructionData
    });
    transaction.add(revealInstruction);

    // Set recent blockhash
    const { blockhash } = await this.connection.getLatestBlockhash('confirmed');
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = getWallet().publicKey;

    return transaction;
  }

  /**
   * Serialize TradeIntentData for instruction
   */
  private serializeTradeIntentData(intent: TradeIntent): Buffer {
    const buffer = Buffer.alloc(256); // Allocate enough space
    let offset = 0;

    // user (32 bytes)
    new PublicKey(intent.user).toBuffer().copy(buffer, offset);
    offset += 32;

    // nonce (8 bytes)
    buffer.writeBigUInt64LE(BigInt(intent.nonce), offset);
    offset += 8;

    // expiry (8 bytes)
    buffer.writeBigUInt64LE(BigInt(intent.expiry), offset);
    offset += 8;

    // relayer (32 bytes)
    new PublicKey(intent.relayer).toBuffer().copy(buffer, offset);
    offset += 32;

    // relayer_fee (8 bytes)
    buffer.writeBigUInt64LE(BigInt(intent.relayerFee), offset);
    offset += 8;

    // token_in (32 bytes)
    new PublicKey(intent.tokenIn).toBuffer().copy(buffer, offset);
    offset += 32;

    // token_out (32 bytes)
    new PublicKey(intent.tokenOut).toBuffer().copy(buffer, offset);
    offset += 32;

    // amount_in (8 bytes)
    buffer.writeBigUInt64LE(BigInt(intent.amountIn), offset);
    offset += 8;

    // min_out (8 bytes)
    buffer.writeBigUInt64LE(BigInt(intent.minOut), offset);
    offset += 8;

    return buffer.slice(0, offset);
  }

  /**
   * Update database with successful reveal
   */
  private async updateDatabase(
    intentHash: string,
    txSignature: string,
    amountOut: number,
    protocolFee: number
  ): Promise<void> {
    await prisma.$transaction([
      prisma.swapReveal.create({
        data: {
          intent: { connect: { intentHash } },
          revealTx: txSignature,
          settlementSuccessful: true
        }
      }),
      prisma.tradeIntent.update({
        where: { intentHash },
        data: { status: 'revealed' }
      }),
      prisma.feeSplit.create({
        data: {
          tradeIntent: { connect: { intentHash } },
          liquidityAmount: BigInt(Math.floor(protocolFee * 0.5)),
          protocolAmount: BigInt(Math.floor(protocolFee * 0.3)),
          bountyAmount: BigInt(Math.floor(protocolFee * 0.2))
        }
      })
    ]);
  }

  /**
   * Update database with failure
   */
  private async updateDatabaseFailure(intentHash: string, error: string): Promise<void> {
    try {
      await prisma.tradeIntent.update({
        where: { intentHash },
        data: { 
          status: 'failed',
          // Could add error field to schema if needed
        }
      });
    } catch (dbError) {
      logger.error('Failed to update database with failure', {
        intentHash,
        originalError: error,
        dbError: dbError instanceof Error ? dbError.message : 'Unknown DB error'
      });
    }
  }
}