// Fix for solana/backend/src/routes/swap.ts
// The issue is likely in the route parameter definitions

import express from 'express';
import { z } from 'zod';
import { fetchQuote } from '../services/jupiterService';
import { generateIntent } from '../services/intentService';
import { commitIntent } from '../services/commitService';
import { revealIntent } from '../services/solanaService';
import { ValidationUtils } from '../middleware/validation';
import { logger } from '../utils/logger';
import { QueueService } from '../services/queueService';
import { saveIntentToSession, getIntentFromSession } from '../utils/sessionUtils';
import prisma from '../db/prisma';

const router = express.Router();

// BigInt JSON serialization helper
const serializeBigInt = (obj: any): any => {
  return JSON.parse(JSON.stringify(obj, (key, value) =>
    typeof value === 'bigint' ? value.toString() : value
  ));
};

// Enhanced schemas with proper validation
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
    priceImpactPct: z.number(),
    routePlan: z.array(z.any())
  }),
  tradeMeta: z.object({
    user: z.string().refine(val => ValidationUtils.isValidPublicKey(val), 'Invalid user address'),
    tokenIn: z.string().refine(val => ValidationUtils.isValidPublicKey(val), 'Invalid tokenIn address'),
    tokenOut: z.string().refine(val => ValidationUtils.isValidPublicKey(val), 'Invalid tokenOut address'),
    amountIn: z.number().positive().int(),
    minOut: z.number().positive().int(),
    expiry: z.number().refine(val => ValidationUtils.isValidExpiry(val), 'Invalid expiry time'),
    nonce: z.number().int().min(0),
    relayerFee: z.number().int().min(0),
    relayer: z.string().refine(val => ValidationUtils.isValidPublicKey(val), 'Invalid relayer address')
  }),
  sessionId: z.string().optional()
});

const commitSchema = z.object({
  user: z.string().refine(val => ValidationUtils.isValidPublicKey(val), 'Invalid user address'),
  intentHash: z.string().refine(val => ValidationUtils.isValidHash(val), 'Invalid intent hash'),
  nonce: z.number().int().min(0),
  expiry: z.number().refine(val => ValidationUtils.isValidExpiry(val), 'Invalid expiry time'),
  enableRelay: z.boolean().optional().default(false)
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

// Utility function for error responses
const createErrorResponse = (message: string, code: string, details?: any) => ({
  error: {
    message,
    code,
    details,
    timestamp: new Date().toISOString()
  }
});

// Fee calculation utilities
const calculateLiquidityFee = (intent: any): bigint => {
  return BigInt(Math.floor(intent.amountIn * 0.0025));
};

const calculateProtocolFee = (intent: any): bigint => {
  return BigInt(Math.floor(intent.amountIn * 0.0005));
};

// Routes with enhanced error handling and logging

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
        requestId: crypto.randomUUID(),
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

    await prisma.$transaction(async (tx) => {
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
        requestId: crypto.randomUUID(),
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

router.post('/commit', async (req: any, res: any) => {
  const startTime = Date.now();

  try {
    const parsed = commitSchema.safeParse(req.body);
    if (!parsed.success) {
      logger.warn('Commit validation failed', { errors: parsed.error.errors });
      return res.status(400).json(createErrorResponse(
        'Validation failed',
        'VALIDATION_ERROR',
        parsed.error.errors
      ));
    }

    logger.info('Processing commit request', {
      user: parsed.data.user,
      intentHash: parsed.data.intentHash,
      enableRelay: parsed.data.enableRelay
    });

    const existingIntent = await prisma.tradeIntent.findUnique({
      where: { intentHash: parsed.data.intentHash },
      include: { swapCommit: true }
    });

    if (!existingIntent) {
      return res.status(404).json(createErrorResponse(
        'Intent not found',
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

    const tx = await commitIntent(
      parsed.data.user,
      parsed.data.intentHash,
      parsed.data.nonce,
      parsed.data.expiry
    );

    await prisma.$transaction(async (txClient) => {
      await txClient.swapCommit.create({
        data: {
          intentId: existingIntent.id,
          commitmentTx: tx
        }
      });

      await txClient.tradeIntent.update({
        where: { intentHash: parsed.data.intentHash },
        data: { status: 'committed' }
      });
    });

    if (parsed.data.enableRelay) {
      try {
        await QueueService.queueReveal(parsed.data.intentHash, {
          delaySeconds: 30
        });
        logger.info('Added to relay queue', { intentHash: parsed.data.intentHash });
      } catch (queueError) {
        logger.warn('Failed to add to relay queue', {
          error: queueError,
          intentHash: parsed.data.intentHash
        });
      }
    }

    const duration = Date.now() - startTime;
    logger.info('Commit completed', {
      tx,
      intentHash: parsed.data.intentHash,
      duration,
      relayQueued: parsed.data.enableRelay
    });

    res.json({
      tx,
      status: 'committed',
      relayQueued: parsed.data.enableRelay,
      metadata: {
        requestId: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        processingTimeMs: duration
      }
    });
  } catch (err: any) {
    const duration = Date.now() - startTime;
    logger.error('Commit failed', {
      error: err.message,
      duration,
      intentHash: req.body.intentHash
    });

    res.status(500).json(createErrorResponse(
      'Commit failed',
      'COMMIT_ERROR',
      err.message
    ));
  }
});

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

    const tx = await revealIntent(
      parsed.data.intent,
      parsed.data.expectedHash,
      parsed.data.signature
    );

    await prisma.$transaction([
      prisma.swapReveal.create({
        data: {
          intentId: existingIntent.id,
          revealTx: tx,
          settlementSuccessful: true
        }
      }),

      prisma.tradeIntent.update({
        where: { intentHash: parsed.data.expectedHash },
        data: {
          status: 'revealed',
          signature: parsed.data.signature
        }
      }),

      prisma.feeSplit.create({
        data: {
          intentId: existingIntent.id,
          liquidityAmount: calculateLiquidityFee(parsed.data.intent),
          protocolAmount: calculateProtocolFee(parsed.data.intent),
          bountyAmount: BigInt(parsed.data.intent.relayerFee)
        }
      })
    ]);

    const duration = Date.now() - startTime;
    logger.info('Reveal completed', {
      tx,
      expectedHash: parsed.data.expectedHash,
      duration
    });

    res.json({
      tx,
      status: 'revealed',
      metadata: {
        requestId: crypto.randomUUID(),
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

// FIXED: Proper route parameter syntax
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

// FIXED: Proper route parameter syntax
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

router.get('/health', async (req, res) => {
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