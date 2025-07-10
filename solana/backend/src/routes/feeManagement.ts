// src/routes/feeManagement.ts
import express from 'express';
import { z } from 'zod';
import { PublicKey, Transaction, SystemProgram } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID, NATIVE_MINT } from '@solana/spl-token';
import { getSolanaConnection, getWallet, PROGRAM_ID } from '../services/solanaService';
import { ValidationUtils } from '../middleware/validation';
import { logger } from '../utils/logger';
import { randomUUID } from 'crypto';

const router = express.Router();

// Validation schemas
const initializeFeeAccountsSchema = z.object({
  tokenMint: z.string().refine(val => ValidationUtils.isValidPublicKey(val), 'Invalid token mint address')
});

const settleFeeSchema = z.object({
  tokenMint: z.string().refine(val => ValidationUtils.isValidPublicKey(val), 'Invalid token mint address'),
  feeAmount: z.number().positive().int()
});

/**
 * POST /fee/initialize-accounts
 * Initialize fee distribution accounts for a specific token mint
 */
router.post('/initialize-accounts', async (req: any, res: any) => {
  const startTime = Date.now();

  try {
    const parsed = initializeFeeAccountsSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: parsed.error.errors,
        timestamp: new Date().toISOString()
      });
    }

    const { tokenMint } = parsed.data;
    const tokenMintPub = new PublicKey(tokenMint);
    const connection = getSolanaConnection();
    const wallet = getWallet();

    logger.info('Initializing fee accounts', { tokenMint });

    // Derive all PDA addresses
    const [feeCollectionAuthority, feeCollectionAuthorityBump] = PublicKey.findProgramAddressSync(
      [Buffer.from("fee_authority")],
      PROGRAM_ID
    );

    const [liquidityStakerAccount, liquidityStakerBump] = PublicKey.findProgramAddressSync(
      [Buffer.from("liq_stakers"), tokenMintPub.toBuffer()],
      PROGRAM_ID
    );

    const [treasuryAccount, treasuryBump] = PublicKey.findProgramAddressSync(
      [Buffer.from("treasury"), tokenMintPub.toBuffer()],
      PROGRAM_ID
    );

    const [bountyAccount, bountyBump] = PublicKey.findProgramAddressSync(
      [Buffer.from("mev_bounty"), tokenMintPub.toBuffer()],
      PROGRAM_ID
    );

    const [feeCollectionAccount, feeCollectionBump] = PublicKey.findProgramAddressSync(
      [Buffer.from("fee_collection"), tokenMintPub.toBuffer()],
      PROGRAM_ID
    );

    // Check if accounts already exist
    const existingAccounts = await Promise.all([
      connection.getAccountInfo(feeCollectionAuthority),
      connection.getAccountInfo(liquidityStakerAccount),
      connection.getAccountInfo(treasuryAccount),
      connection.getAccountInfo(bountyAccount),
      connection.getAccountInfo(feeCollectionAccount)
    ]);

    const accountNames = ['authority', 'liquidity', 'treasury', 'bounty', 'collection'];
    const existingAccountNames = existingAccounts
      .map((account, index) => account ? accountNames[index] : null)
      .filter(Boolean);

    if (existingAccountNames.length > 0) {
      return res.status(409).json({
        error: 'Fee accounts already exist',
        existingAccounts: existingAccountNames,
        addresses: {
          feeCollectionAuthority: feeCollectionAuthority.toString(),
          liquidityStakerAccount: liquidityStakerAccount.toString(),
          treasuryAccount: treasuryAccount.toString(),
          bountyAccount: bountyAccount.toString(),
          feeCollectionAccount: feeCollectionAccount.toString()
        },
        timestamp: new Date().toISOString()
      });
    }

    // Create initialization instruction
    const discriminator = Buffer.from([233, 63, 142, 11, 168, 28, 143, 222]); // initialize_fee_accounts
    const instructionData = discriminator;

    const initializeInstruction = {
      keys: [
        { pubkey: feeCollectionAuthority, isSigner: false, isWritable: true },
        { pubkey: liquidityStakerAccount, isSigner: false, isWritable: true },
        { pubkey: treasuryAccount, isSigner: false, isWritable: true },
        { pubkey: bountyAccount, isSigner: false, isWritable: true },
        { pubkey: feeCollectionAccount, isSigner: false, isWritable: true },
        { pubkey: tokenMintPub, isSigner: false, isWritable: false },
        { pubkey: wallet.publicKey, isSigner: true, isWritable: true },
        { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
        { pubkey: new PublicKey('SysvarRent111111111111111111111111111111111'), isSigner: false, isWritable: false }
      ],
      programId: PROGRAM_ID,
      data: instructionData
    };

    // Build and send transaction
    const transaction = new Transaction();
    transaction.add(initializeInstruction);

    const { blockhash } = await connection.getLatestBlockhash('confirmed');
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = wallet.publicKey;

    // Sign and send
    transaction.sign(wallet);
    
    const signature = await connection.sendRawTransaction(transaction.serialize(), {
      skipPreflight: false,
      preflightCommitment: 'confirmed'
    });

    // Wait for confirmation
    await connection.confirmTransaction(signature, 'confirmed');

    const duration = Date.now() - startTime;
    
    logger.info('Fee accounts initialized successfully', {
      tokenMint,
      signature,
      duration
    });

    res.json({
      success: true,
      signature,
      accounts: {
        feeCollectionAuthority: feeCollectionAuthority.toString(),
        liquidityStakerAccount: liquidityStakerAccount.toString(),
        treasuryAccount: treasuryAccount.toString(),
        bountyAccount: bountyAccount.toString(),
        feeCollectionAccount: feeCollectionAccount.toString()
      },
      bumps: {
        feeCollectionAuthorityBump,
        liquidityStakerBump,
        treasuryBump,
        bountyBump,
        feeCollectionBump
      },
      metadata: {
        requestId: randomUUID(),
        timestamp: new Date().toISOString(),
        processingTimeMs: duration
      }
    });

  } catch (error: any) {
    const duration = Date.now() - startTime;
    logger.error('Fee account initialization failed', {
      error: error.message,
      duration,
      tokenMint: req.body.tokenMint
    });

    res.status(500).json({
      error: 'Fee account initialization failed',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * POST /fee/settle
 * Distribute collected fees to different pools
 */
router.post('/settle', async (req: any, res: any) => {
  const startTime = Date.now();

  try {
    const parsed = settleFeeSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: parsed.error.errors,
        timestamp: new Date().toISOString()
      });
    }

    const { tokenMint, feeAmount } = parsed.data;
    const tokenMintPub = new PublicKey(tokenMint);
    const connection = getSolanaConnection();
    const wallet = getWallet();

    logger.info('Settling fees', { tokenMint, feeAmount });

    // Derive PDA addresses
    const [feeCollectionAuthority] = PublicKey.findProgramAddressSync(
      [Buffer.from("fee_authority")],
      PROGRAM_ID
    );

    const [feeCollectionAccount] = PublicKey.findProgramAddressSync(
      [Buffer.from("fee_collection"), tokenMintPub.toBuffer()],
      PROGRAM_ID
    );

    const [liquidityStakerAccount] = PublicKey.findProgramAddressSync(
      [Buffer.from("liq_stakers"), tokenMintPub.toBuffer()],
      PROGRAM_ID
    );

    const [treasuryAccount] = PublicKey.findProgramAddressSync(
      [Buffer.from("treasury"), tokenMintPub.toBuffer()],
      PROGRAM_ID
    );

    const [bountyAccount] = PublicKey.findProgramAddressSync(
      [Buffer.from("mev_bounty"), tokenMintPub.toBuffer()],
      PROGRAM_ID
    );

    // Verify accounts exist
    const accountInfos = await Promise.all([
      connection.getAccountInfo(feeCollectionAccount),
      connection.getAccountInfo(liquidityStakerAccount),
      connection.getAccountInfo(treasuryAccount),
      connection.getAccountInfo(bountyAccount)
    ]);

    if (accountInfos.some(info => !info)) {
      return res.status(404).json({
        error: 'Fee accounts not initialized',
        message: 'Run POST /fee/initialize-accounts first',
        timestamp: new Date().toISOString()
      });
    }

    // Create settle instruction
    const discriminator = Buffer.from([252, 176, 98, 248, 73, 123, 8, 157]); // settle_trade
    const feeAmountBuffer = Buffer.alloc(8);
    feeAmountBuffer.writeBigUInt64LE(BigInt(feeAmount), 0);
    
    const instructionData = Buffer.concat([discriminator, feeAmountBuffer]);

    const settleInstruction = {
      keys: [
        { pubkey: feeCollectionAuthority, isSigner: false, isWritable: false },
        { pubkey: feeCollectionAccount, isSigner: false, isWritable: true },
        { pubkey: liquidityStakerAccount, isSigner: false, isWritable: true },
        { pubkey: treasuryAccount, isSigner: false, isWritable: true },
        { pubkey: bountyAccount, isSigner: false, isWritable: true },
        { pubkey: tokenMintPub, isSigner: false, isWritable: false },
        { pubkey: wallet.publicKey, isSigner: true, isWritable: true },
        { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false }
      ],
      programId: PROGRAM_ID,
      data: instructionData
    };

    // Build and send transaction
    const transaction = new Transaction();
    transaction.add(settleInstruction);

    const { blockhash } = await connection.getLatestBlockhash('confirmed');
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = wallet.publicKey;

    transaction.sign(wallet);
    
    const signature = await connection.sendRawTransaction(transaction.serialize(), {
      skipPreflight: false,
      preflightCommitment: 'confirmed'
    });

    await connection.confirmTransaction(signature, 'confirmed');

    // Calculate distribution
    const liquidityFee = Math.floor(feeAmount * 0.5);
    const treasuryFee = Math.floor(feeAmount * 0.3);
    const bountyFee = feeAmount - liquidityFee - treasuryFee;

    const duration = Date.now() - startTime;
    
    logger.info('Fee settlement completed', {
      tokenMint,
      signature,
      distribution: { liquidityFee, treasuryFee, bountyFee },
      duration
    });

    res.json({
      success: true,
      signature,
      distribution: {
        totalFee: feeAmount,
        liquidityStakers: liquidityFee,
        treasury: treasuryFee,
        mevBounty: bountyFee
      },
      accounts: {
        liquidityStakerAccount: liquidityStakerAccount.toString(),
        treasuryAccount: treasuryAccount.toString(),
        bountyAccount: bountyAccount.toString()
      },
      metadata: {
        requestId: randomUUID(),
        timestamp: new Date().toISOString(),
        processingTimeMs: duration
      }
    });

  } catch (error: any) {
    const duration = Date.now() - startTime;
    logger.error('Fee settlement failed', {
      error: error.message,
      duration,
      tokenMint: req.body.tokenMint,
      feeAmount: req.body.feeAmount
    });

    res.status(500).json({
      error: 'Fee settlement failed',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /fee/accounts/:tokenMint
 * Get fee account addresses and balances for a token mint
 */
router.get('/accounts/:tokenMint', async (req: any, res: any) => {
  try {
    const tokenMint = req.params.tokenMint;
    
    if (!ValidationUtils.isValidPublicKey(tokenMint)) {
      return res.status(400).json({
        error: 'Invalid token mint address',
        timestamp: new Date().toISOString()
      });
    }

    const tokenMintPub = new PublicKey(tokenMint);
    const connection = getSolanaConnection();

    // Derive PDA addresses
    const [feeCollectionAuthority] = PublicKey.findProgramAddressSync(
      [Buffer.from("fee_authority")],
      PROGRAM_ID
    );

    const [feeCollectionAccount] = PublicKey.findProgramAddressSync(
      [Buffer.from("fee_collection"), tokenMintPub.toBuffer()],
      PROGRAM_ID
    );

    const [liquidityStakerAccount] = PublicKey.findProgramAddressSync(
      [Buffer.from("liq_stakers"), tokenMintPub.toBuffer()],
      PROGRAM_ID
    );

    const [treasuryAccount] = PublicKey.findProgramAddressSync(
      [Buffer.from("treasury"), tokenMintPub.toBuffer()],
      PROGRAM_ID
    );

    const [bountyAccount] = PublicKey.findProgramAddressSync(
      [Buffer.from("mev_bounty"), tokenMintPub.toBuffer()],
      PROGRAM_ID
    );

    // Get account balances
    const accountInfos = await Promise.all([
      connection.getTokenAccountBalance(feeCollectionAccount).catch(() => null),
      connection.getTokenAccountBalance(liquidityStakerAccount).catch(() => null),
      connection.getTokenAccountBalance(treasuryAccount).catch(() => null),
      connection.getTokenAccountBalance(bountyAccount).catch(() => null)
    ]);

    const accounts = {
      feeCollectionAuthority: {
        address: feeCollectionAuthority.toString(),
        type: 'authority'
      },
      feeCollection: {
        address: feeCollectionAccount.toString(),
        balance: accountInfos[0]?.value?.uiAmount || 0,
        exists: !!accountInfos[0]
      },
      liquidityStakers: {
        address: liquidityStakerAccount.toString(),
        balance: accountInfos[1]?.value?.uiAmount || 0,
        exists: !!accountInfos[1]
      },
      treasury: {
        address: treasuryAccount.toString(),
        balance: accountInfos[2]?.value?.uiAmount || 0,
        exists: !!accountInfos[2]
      },
      mevBounty: {
        address: bountyAccount.toString(),
        balance: accountInfos[3]?.value?.uiAmount || 0,
        exists: !!accountInfos[3]
      }
    };

    const allInitialized = Object.values(accounts)
      .filter(acc => (acc as any).exists !== undefined)
      .every(acc => (acc as { exists: boolean }).exists);

    res.json({
      tokenMint,
      accounts,
      initialized: allInitialized,
      totalCollected: Object.values(accounts)
        .filter(acc => (acc as any).balance !== undefined)
        .reduce((sum, acc) => sum + ((acc as { balance: number }).balance || 0), 0),
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    logger.error('Failed to get fee accounts', {
      error: error.message,
      tokenMint: req.params.tokenMint
    });

    res.status(500).json({
      error: 'Failed to get fee accounts',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /fee/health
 * Health check for fee management system
 */
router.get('/health', async (req: any, res: any) => {
  try {
    const connection = getSolanaConnection();
    const wallet = getWallet();

    // Test connection and wallet
    const balance = await connection.getBalance(wallet.publicKey);
    
    res.json({
      status: 'healthy',
      services: {
        solana: 'connected',
        wallet: 'loaded',
        program: PROGRAM_ID.toString()
      },
      walletBalance: balance / 1e9, // SOL
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    res.status(503).json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

export default router;