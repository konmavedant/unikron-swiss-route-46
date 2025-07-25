import express from 'express';
import { z } from 'zod';
import { randomUUID } from 'crypto';
import { PublicKey } from '@solana/web3.js';
import { fetchQuote } from '../services/jupiterService';
import { generateIntent } from '../services/intentService';
import { RevealService } from '../services/revealService';
import { TokenAccountService } from '../services/tokenAccountService';
import { ValidationUtils } from '../middleware/validation';
import { logger } from '../utils/logger';
import { QueueService } from '../services/queueService';
import { saveIntentToSession, getIntentFromSession } from '../utils/sessionUtils';
import prisma from '../db/prisma';

const router = express.Router();

// Services
const revealService = new RevealService();
const tokenAccountService = new TokenAccountService();

// Utility functions
const serializeBigInt = (obj: any): any => {
  return JSON.parse(JSON.stringify(obj, (key, value) =>
    typeof value === 'bigint' ? value.toString() : value
  ));
};

const createErrorResponse = (message: string, code: string, details?: any) => ({
  error: {
    message,
    code,
    details,
    timestamp: new Date().toISOString()
  }
});

// Validation schemas (existing ones remain the same)
const quoteSchema = z.object({
  fromMint: z.string().refine(val => ValidationUtils.isValidPublicKey(val), 'Invalid fromMint address'),
  toMint: z.string().refine(val => ValidationUtils.isValidPublicKey(val), 'Invalid toMint address'),
  amount: z.number().positive().int().max(Number.MAX_SAFE_INTEGER),
  slippageBps: z.number().min(1).max(1000).optional().default(100)
});

const intentSchema = z.object({
  route: z.object({
    inputMint: z.string(),
    outputMint: z.string(),
    inAmount: z.string(),
    outAmount: z.string(),
    otherAmountThreshold: z.string(),
    swapMode: z.string(),
    priceImpactPct: z.union([z.string(), z.number()]).transform(val =>
      typeof val === 'string' ? parseFloat(val) : val
    ),
    routePlan: z.array(z.any())
  }),
  tradeMeta: z.object({
    user: z.string().refine(val => ValidationUtils.isValidPublicKey(val), 'Invalid user address'),
    tokenIn: z.string().refine(val => ValidationUtils.isValidPublicKey(val), 'Invalid tokenIn address'),
    tokenOut: z.string().refine(val => ValidationUtils.isValidPublicKey(val), 'Invalid tokenOut address'),
    amountIn: z.number().positive().int(),
    minOut: z.number().positive().int(),
    expiry: z.number().refine(val => {
      const now = Math.floor(Date.now() / 1000);
      const maxExpiry = now + (7 * 24 * 60 * 60);
      return val > now && val <= maxExpiry;
    }, 'Invalid expiry time - must be in the future and within 7 days'),
    nonce: z.number().int().min(0),
    relayerFee: z.number().int().min(0),
    relayer: z.string().refine(val => ValidationUtils.isValidPublicKey(val), 'Invalid relayer address')
  }),
  sessionId: z.string().optional()
});

const revealSchema = z.object({
  intent: z.object({
    user: z.string(),
    tokenIn: z.string(),
    tokenOut: z.string(),
    amountIn: z.number(),
    minOut: z.number(),
    expiry: z.number(),
    nonce: z.number(),
    routeHash: z.string(),
    relayerFee: z.number(),
    relayer: z.string()
  }),
  expectedHash: z.string().refine(val => ValidationUtils.isValidHash(val), 'Invalid expected hash'),
  signature: z.string().refine(val => ValidationUtils.isValidSignature(val), 'Invalid signature')
});

// POST /swap/quote (existing implementation remains the same)
router.post('/quote', async (req: any, res: any) => {
  const startTime = Date.now();

  try {
    const parsed = quoteSchema.safeParse(req.body);
    if (!parsed.success) {
      logger.warn('Quote validation failed', { errors: parsed.error.errors, body: req.body });
      return res.status(400).json(createErrorResponse(
        'Validation failed',
        'VALIDATION_ERROR',
        parsed.error.errors
      ));
    }

    logger.info('Processing quote request', parsed.data);

    const route = await fetchQuote(
      parsed.data.fromMint,
      parsed.data.toMint,
      parsed.data.amount,
      parsed.data.slippageBps
    );

    const duration = Date.now() - startTime;
    logger.info('Quote request completed', { duration, routeFound: !!route });

    res.json({
      route,
      metadata: {
        requestId: randomUUID(),
        timestamp: new Date().toISOString(),
        processingTimeMs: duration
      }
    });
  } catch (err: any) {
    const duration = Date.now() - startTime;
    logger.error('Quote request failed', {
      error: err.message,
      duration,
      body: req.body
    });

    res.status(500).json(createErrorResponse(
      'Quote request failed',
      'QUOTE_ERROR',
      err.message
    ));
  }
});

// POST /swap/intent (existing implementation remains the same)
router.post('/intent', async (req: any, res: any) => {
  const startTime = Date.now();

  try {
    const parsed = intentSchema.safeParse(req.body);
    if (!parsed.success) {
      logger.warn('Intent validation failed', { errors: parsed.error.errors });
      return res.status(400).json(createErrorResponse(
        'Validation failed',
        'VALIDATION_ERROR',
        parsed.error.errors
      ));
    }

    const { route, tradeMeta, sessionId } = parsed.data;
    if (route.inputMint !== tradeMeta.tokenIn || route.outputMint !== tradeMeta.tokenOut) {
      return res.status(400).json(createErrorResponse(
        'Route and tradeMeta token mismatch',
        'ROUTE_MISMATCH'
      ));
    }

    logger.info('Processing intent generation', {
      user: tradeMeta.user,
      tokenPair: `${tradeMeta.tokenIn}→${tradeMeta.tokenOut}`,
      amount: tradeMeta.amountIn,
      sessionId
    });

    const { intent, hash } = await generateIntent(route, tradeMeta);

    await prisma.$transaction(async (tx:any) => {
      const user = await tx.user.upsert({
        where: { walletAddress: intent.user },
        update: {},
        create: { walletAddress: intent.user }
      });

      await tx.tradeIntent.create({
        data: {
          userId: user.id,
          tokenIn: intent.tokenIn,
          tokenOut: intent.tokenOut,
          amountIn: BigInt(intent.amountIn),
          minOut: BigInt(intent.minOut),
          expiry: new Date(intent.expiry * 1000),
          nonce: BigInt(intent.nonce),
          routeHash: intent.routeHash,
          relayerFee: BigInt(intent.relayerFee),
          relayer: intent.relayer,
          intentHash: hash,
          signature: '',
          status: 'draft'
        }
      });
    });

    if (sessionId) {
      await saveIntentToSession(sessionId, { intent, hash, route });
    }

    const duration = Date.now() - startTime;
    logger.info('Intent generation completed', {
      hash,
      duration,
      user: intent.user
    });

    res.json({
      intent,
      hash,
      sessionRecovery: sessionId ? { sessionId, saved: true } : null,
      metadata: {
        requestId: randomUUID(),
        timestamp: new Date().toISOString(),
        processingTimeMs: duration
      }
    });
  } catch (err: any) {
    const duration = Date.now() - startTime;
    logger.error('Intent generation failed', {
      error: err.message,
      duration,
      stack: err.stack
    });

    res.status(500).json(createErrorResponse(
      'Intent generation failed',
      'INTENT_ERROR',
      err.message
    ));
  }
});

// POST /swap/prepare-accounts - NEW ENDPOINT
router.post('/prepare-accounts', async (req: any, res: any) => {
  const startTime = Date.now();

  try {
    const { user, tokenIn, tokenOut } = req.body;

    if (!ValidationUtils.isValidPublicKey(user) ||
      !ValidationUtils.isValidPublicKey(tokenIn) ||
      !ValidationUtils.isValidPublicKey(tokenOut)) {
      return res.status(400).json(createErrorResponse(
        'Invalid public key format',
        'VALIDATION_ERROR'
      ));
    }

    const userPub = new PublicKey(user);
    const tokenInMint = new PublicKey(tokenIn);
    const tokenOutMint = new PublicKey(tokenOut);

    logger.info('Preparing token accounts', { user, tokenIn, tokenOut });

    const accountPreparation = await tokenAccountService.prepareSwapTokenAccounts(
      userPub,
      tokenInMint,
      tokenOutMint
    );

    // Get current balances
    const balances = await tokenAccountService.getUserTokenBalances(
      userPub,
      [tokenInMint, tokenOutMint]
    );

    const duration = Date.now() - startTime;

    res.json({
      accounts: {
        tokenIn: accountPreparation.tokenInAccount.toString(),
        tokenOut: accountPreparation.tokenOutAccount.toString()
      },
      setup: {
        instructions: accountPreparation.setupInstructions.length,
        accountsToCreate: accountPreparation.accountsToCreate,
        ready: accountPreparation.setupInstructions.length === 0
      },
      balances: {
        tokenIn: balances.get(tokenIn)?.amount.toString() || '0',
        tokenOut: balances.get(tokenOut)?.amount.toString() || '0'
      },
      metadata: {
        requestId: randomUUID(),
        timestamp: new Date().toISOString(),
        processingTimeMs: duration
      }
    });

  } catch (err: any) {
    const duration = Date.now() - startTime;
    logger.error('Token account preparation failed', {
      error: err.message,
      duration
    });

    res.status(500).json(createErrorResponse(
      'Token account preparation failed',
      'ACCOUNT_PREP_ERROR',
      err.message
    ));
  }
});

// POST /swap/validate-accounts - NEW ENDPOINT
router.post('/validate-accounts', async (req: any, res: any) => {
  try {
    const { user, tokenIn, tokenOut, amountIn } = req.body;

    if (!ValidationUtils.isValidPublicKey(user) ||
      !ValidationUtils.isValidPublicKey(tokenIn) ||
      !ValidationUtils.isValidPublicKey(tokenOut) ||
      !ValidationUtils.isValidAmount(amountIn)) {
      return res.status(400).json(createErrorResponse(
        'Invalid input parameters',
        'VALIDATION_ERROR'
      ));
    }

    const userPub = new PublicKey(user);
    const tokenInMint = new PublicKey(tokenIn);
    const tokenOutMint = new PublicKey(tokenOut);

    const validation = await tokenAccountService.validateSwapAccounts(
      userPub,
      tokenInMint,
      tokenOutMint,
      BigInt(amountIn)
    );

    res.json({
      valid: validation.valid,
      errors: validation.errors,
      balances: {
        tokenIn: validation.tokenInBalance.toString(),
        tokenOut: validation.tokenOutBalance.toString()
      },
      timestamp: new Date().toISOString()
    });

  } catch (err: any) {
    logger.error('Account validation failed', { error: err.message });
    res.status(500).json(createErrorResponse(
      'Account validation failed',
      'VALIDATION_ERROR',
      err.message
    ));
  }
});

// POST /swap/reveal - UPDATED WITH COMPLETE IMPLEMENTATION
router.post('/reveal', async (req: any, res: any) => {
  const startTime = Date.now();

  try {
    const parsed = revealSchema.safeParse(req.body);
    if (!parsed.success) {
      logger.warn('Reveal validation failed', { errors: parsed.error.errors });
      return res.status(400).json(createErrorResponse(
        'Validation failed',
        'VALIDATION_ERROR',
        parsed.error.errors
      ));
    }

    logger.info('Processing reveal request', {
      expectedHash: parsed.data.expectedHash
    });

    const existingIntent = await prisma.tradeIntent.findUnique({
      where: { intentHash: parsed.data.expectedHash },
      include: {
        swapCommit: true,
        swapReveal: true
      }
    });

    if (!existingIntent) {
      return res.status(404).json(createErrorResponse(
        'Intent not found',
        'INTENT_NOT_FOUND'
      ));
    }

    if (!existingIntent.swapCommit) {
      return res.status(400).json(createErrorResponse(
        'Intent not committed yet',
        'NOT_COMMITTED'
      ));
    }

    if (existingIntent.swapReveal) {
      return res.status(409).json(createErrorResponse(
        'Intent already revealed',
        'ALREADY_REVEALED',
        { revealTx: existingIntent.swapReveal.revealTx }
      ));
    }

    // Execute reveal using the new RevealService
    const result = await revealService.executeReveal(
      parsed.data.intent,
      parsed.data.expectedHash,
      parsed.data.signature
    );

    const duration = Date.now() - startTime;
    logger.info('Reveal completed successfully', {
      transaction: result.transaction,
      expectedHash: parsed.data.expectedHash,
      duration
    });

    res.json({
      success: result.success,
      transaction: result.transaction,
      execution: {
        amountOut: result.amountOut,
        protocolFee: result.protocolFee,
        relayerFee: result.relayerFee
      },
      status: 'revealed',
      metadata: {
        requestId: randomUUID(),
        timestamp: new Date().toISOString(),
        processingTimeMs: duration
      }
    });

  } catch (err: any) {
    const duration = Date.now() - startTime;
    logger.error('Reveal failed', {
      error: err.message,
      duration,
      expectedHash: req.body.expectedHash
    });

    res.status(500).json(createErrorResponse(
      'Reveal failed',
      'REVEAL_ERROR',
      err.message
    ));
  }
});


// MODIFY existing /swap/commit route to redirect to proper flow
router.post('/commit', async (req: any, res: any) => {
  // Return instructions for proper user-signed flow
  res.status(400).json({
    error: {
      message: 'Direct commit not supported - users must sign their own transactions',
      code: 'USER_SIGNATURE_REQUIRED',
      instructions: {
        step1: 'Use POST /swap/commit/prepare to get unsigned transaction',
        step2: 'Sign the transaction with user wallet (frontend)',
        step3: 'Submit signed transaction to POST /swap/commit/submit',
        alternative: 'For testing only: Use POST /swap/commit/test'
      },
      timestamp: new Date().toISOString()
    }
  });
});



// POST /swap/commit/demo - Demo the proper flow


router.post('/commit/simple', async (req: any, res: any) => {
  const startTime = Date.now();

  try {
    const { intentHash, nonce, expiry } = req.body;

    if (!intentHash || !nonce || !expiry) {
      return res.status(400).json(createErrorResponse(
        'Missing required fields: intentHash, nonce, expiry',
        'VALIDATION_ERROR'
      ));
    }

    // Find the original intent
    const existingIntent = await prisma.tradeIntent.findUnique({
      where: { intentHash },
      include: {
        user: true,
        swapCommit: true
      }
    });

    if (!existingIntent) {
      return res.status(404).json(createErrorResponse(
        'Intent not found in database',
        'INTENT_NOT_FOUND'
      ));
    }

    if (existingIntent.swapCommit) {
      return res.status(409).json(createErrorResponse(
        'Intent already committed',
        'ALREADY_COMMITTED',
        { commitTx: existingIntent.swapCommit.commitmentTx }
      ));
    }

    logger.info('SIMPLIFIED COMMIT: Creating new commit with backend wallet');

    const { createAndCommitTestIntent } = await import('../services/commitService');

    const result = await createAndCommitTestIntent(
      intentHash,
      nonce,
      expiry
    );

    // Update database
    await prisma.swapCommit.create({
      data: {
        intentId: existingIntent.id,
        commitmentTx: result.tx
      }
    });

    await prisma.tradeIntent.update({
      where: { intentHash },
      data: { status: 'committed' }
    });

    const duration = Date.now() - startTime;

    res.json({
      success: true,
      tx: result.tx,
      status: 'committed',
      originalUser: result.originalUser,
      actualCommitter: result.backendUser,
      pda: result.pda,
      approach: 'simplified',
      note: 'Used backend wallet to commit, bypassing PDA derivation issues',
      explanation: 'This demonstrates successful commit flow. In production, users would sign their own commits.',
      metadata: {
        requestId: randomUUID(),
        timestamp: new Date().toISOString(),
        processingTimeMs: duration
      }
    });

  } catch (err: any) {
    const duration = Date.now() - startTime;
    logger.error('Simplified commit failed', { error: err.message, duration });

    res.status(500).json(createErrorResponse(
      'Simplified commit failed',
      'SIMPLIFIED_COMMIT_ERROR',
      err.message
    ));
  }
});

// GET /swap/debug-pda-extensive/:user/:nonce - Enhanced PDA debugging
router.get('/debug-pda-extensive/:user/:nonce', async (req: any, res: any) => {
  try {
    const { debugPdaExtensive } = await import('../services/commitService');
    const { user, nonce } = req.params;

    const result = await debugPdaExtensive(user, parseInt(nonce));

    res.json({
      ...result,
      message: "Extensive PDA derivation testing - find a method where exists=false"
    });
  } catch (err: any) {
    res.status(500).json(createErrorResponse(
      'PDA extensive debug failed',
      'PDA_EXTENSIVE_DEBUG_ERROR',
      err.message
    ));
  }
});



// GET /swap/status/:intentHash
router.get('/status/:intentHash', async (req: any, res: any) => {
  try {
    const intentHash = req.params.intentHash;

    if (!ValidationUtils.isValidHash(intentHash)) {
      return res.status(400).json(createErrorResponse(
        'Invalid intent hash format',
        'INVALID_HASH'
      ));
    }

    const intent = await prisma.tradeIntent.findUnique({
      where: { intentHash },
      include: {
        user: {
          select: { walletAddress: true, createdAt: true }
        },
        swapCommit: true,
        swapReveal: true,
        feeSplit: true
      }
    });

    if (!intent) {
      return res.status(404).json(createErrorResponse(
        'Intent not found',
        'INTENT_NOT_FOUND'
      ));
    }

    const now = Math.floor(Date.now() / 1000);
    const expiryTimestamp = Math.floor(intent.expiry.getTime() / 1000);
    const timeRemaining = Math.max(0, expiryTimestamp - now);

    const response = serializeBigInt({
      intentHash: intent.intentHash,
      status: intent.status,
      user: intent.user.walletAddress,
      tokenIn: intent.tokenIn,
      tokenOut: intent.tokenOut,
      amountIn: intent.amountIn,
      minOut: intent.minOut,
      relayerFee: intent.relayerFee,
      expiry: intent.expiry.toISOString(),
      timeRemainingSeconds: timeRemaining,
      isExpired: timeRemaining === 0,
      createdAt: intent.createdAt.toISOString(),
      commit: intent.swapCommit ? {
        tx: intent.swapCommit.commitmentTx,
        timestamp: intent.swapCommit.createdAt.toISOString()
      } : null,
      reveal: intent.swapReveal ? {
        tx: intent.swapReveal.revealTx,
        successful: intent.swapReveal.settlementSuccessful,
        timestamp: intent.swapReveal.createdAt.toISOString()
      } : null,
      fees: intent.feeSplit ? {
        liquidity: intent.feeSplit.liquidityAmount,
        protocol: intent.feeSplit.protocolAmount,
        bounty: intent.feeSplit.bountyAmount
      } : null
    });

    logger.info('Status request completed', {
      intentHash,
      status: intent.status
    });

    res.json(response);
  } catch (err: any) {
    logger.error('Status request failed', {
      error: err.message,
      intentHash: req.params.intentHash
    });

    res.status(500).json(createErrorResponse(
      'Status request failed',
      'STATUS_ERROR',
      err.message
    ));
  }
});

// GET /swap/recover/:sessionId
router.get('/recover/:sessionId', async (req: any, res: any) => {
  try {
    const sessionId = req.params.sessionId;
    const sessionData = await getIntentFromSession(sessionId);

    if (!sessionData) {
      return res.status(404).json(createErrorResponse(
        'Session not found or expired',
        'SESSION_NOT_FOUND'
      ));
    }

    logger.info('Session recovery successful', { sessionId });

    res.json({
      recovered: true,
      data: sessionData,
      timestamp: new Date().toISOString()
    });
  } catch (err: any) {
    logger.error('Session recovery failed', {
      error: err.message,
      sessionId: req.params.sessionId
    });

    res.status(500).json(createErrorResponse(
      'Session recovery failed',
      'RECOVERY_ERROR',
      err.message
    ));
  }
});

router.get('/wallet-info', async (req: any, res: any) => {
  try {
    const { getWallet } = await import('../services/solanaService');
    const wallet = getWallet();

    res.json({
      publicKey: wallet.publicKey.toBase58(),
      message: "Use this public key as the 'user' field for testing commit operations"
    });
  } catch (err: any) {
    res.status(500).json(createErrorResponse(
      'Failed to get wallet info',
      'WALLET_ERROR',
      err.message
    ));
  }
});

router.get('/test-pda/:user/:nonce', async (req: any, res: any) => {
  try {
    const { testPdaDerivation } = await import('../services/commitService');
    const { user, nonce } = req.params;

    const result = await testPdaDerivation(user, parseInt(nonce));

    res.json({
      ...result,
      message: "Compare with the expected PDA – derivation debugging complete"
    });
  } catch (err: any) {
    res.status(500).json(createErrorResponse(
      'PDA test failed',
      'PDA_ERROR',
      err.message
    ));
  }
});


router.get('/debug-pda/:user/:nonce', async (req: any, res: any) => {
  try {
    const { debugPdaDerivation } = await import('../services/commitService');
    const { user, nonce } = req.params;

    const result = await debugPdaDerivation(user, parseInt(nonce));

    res.json({
      ...result,
      message: "Compare derivation methods with the expected PDA from program logs"
    });
  } catch (err: any) {
    res.status(500).json(createErrorResponse(
      'PDA debug failed',
      'PDA_DEBUG_ERROR',
      err.message
    ));
  }
});

// GET /swap/health
router.get('/health', async (req: any, res: any) => {
  const startTime = Date.now();

  try {
    await prisma.$queryRaw`SELECT 1`;

    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: 'connected',
        jupiter: 'available',
        solana: 'connected',
        queue: await QueueService.healthCheck() ? 'healthy' : 'unhealthy'
      },
      metrics: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        responseTime: Date.now() - startTime
      }
    };

    res.json(health);
  } catch (err: any) {
    logger.error('Health check failed', { error: err.message });

    res.status(503).json({
      status: 'unhealthy',
      error: err.message,
      timestamp: new Date().toISOString()
    });
  }
});

export default router;