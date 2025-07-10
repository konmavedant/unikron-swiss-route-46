// tests/integration/completeFlow.test.ts
import request from 'supertest';
import { Connection, Keypair, PublicKey } from '@solana/web3.js';
import { createMint, createAssociatedTokenAccount, mintTo } from '@solana/spl-token';
import app from '../../src/index';
import { getSolanaConnection } from '../../src/services/solanaService';
import { TokenAccountService } from '../../src/services/tokenAccountService';
import prisma from '../../src/db/prisma';

describe('Complete UNIKRON Flow Integration Tests', () => {
  let connection: Connection;
  let tokenAccountService: TokenAccountService;
  let testUser: Keypair;
  let payer: Keypair;
  let tokenMintA: PublicKey;
  let tokenMintB: PublicKey;
  let userTokenAccountA: PublicKey;
  let userTokenAccountB: PublicKey;

  beforeAll(async () => {
    // Setup test environment
    connection = getSolanaConnection();
    tokenAccountService = new TokenAccountService();
    testUser = Keypair.generate();
    payer = Keypair.generate();

    // Airdrop SOL for gas fees
    await connection.confirmTransaction(
      await connection.requestAirdrop(testUser.publicKey, 2e9) // 2 SOL
    );
    await connection.confirmTransaction(
      await connection.requestAirdrop(payer.publicKey, 2e9)
    );

    // Create test token mints
    tokenMintA = await createMint(
      connection,
      payer,
      payer.publicKey,
      null,
      6 // USDC-like decimals
    );

    tokenMintB = await createMint(
      connection,
      payer,
      payer.publicKey,
      null,
      9 // SOL-like decimals
    );

    // Create associated token accounts
    userTokenAccountA = await createAssociatedTokenAccount(
      connection,
      payer,
      tokenMintA,
      testUser.publicKey
    );

    userTokenAccountB = await createAssociatedTokenAccount(
      connection,
      payer,
      tokenMintB,
      testUser.publicKey
    );

    // Mint test tokens to user
    await mintTo(
      connection,
      payer,
      tokenMintA,
      userTokenAccountA,
      payer,
      1000000000 // 1000 tokens (6 decimals)
    );

    console.log('Test setup completed:');
    console.log('User:', testUser.publicKey.toString());
    console.log('Token A:', tokenMintA.toString());
    console.log('Token B:', tokenMintB.toString());
  });

  afterAll(async () => {
    // Cleanup database
    await prisma.feeSplit.deleteMany();
    await prisma.swapReveal.deleteMany();
    await prisma.swapCommit.deleteMany();
    await prisma.tradeIntent.deleteMany();
    await prisma.user.deleteMany();
  });

  describe('1. Fee Account Initialization', () => {
    it('should initialize fee accounts for token A', async () => {
      const response = await request(app)
        .post('/fee/initialize-accounts')
        .send({
          tokenMint: tokenMintA.toString()
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.signature).toBeDefined();
      expect(response.body.accounts.feeCollectionAuthority).toBeDefined();
      expect(response.body.accounts.liquidityStakerAccount).toBeDefined();
      expect(response.body.accounts.treasuryAccount).toBeDefined();
      expect(response.body.accounts.bountyAccount).toBeDefined();
    });

    it('should get fee account information', async () => {
      const response = await request(app)
        .get(`/fee/accounts/${tokenMintA.toString()}`)
        .expect(200);

      expect(response.body.initialized).toBe(true);
      expect(response.body.accounts.feeCollection.exists).toBe(true);
      expect(response.body.accounts.liquidityStakers.exists).toBe(true);
      expect(response.body.accounts.treasury.exists).toBe(true);
      expect(response.body.accounts.mevBounty.exists).toBe(true);
    });
  });

  describe('2. Token Account Management', () => {
    it('should prepare token accounts for swap', async () => {
      const response = await request(app)
        .post('/swap/prepare-accounts')
        .send({
          user: testUser.publicKey.toString(),
          tokenIn: tokenMintA.toString(),
          tokenOut: tokenMintB.toString()
        })
        .expect(200);

      expect(response.body.accounts.tokenIn).toBeDefined();
      expect(response.body.accounts.tokenOut).toBeDefined();
      expect(response.body.setup.ready).toBe(true); // Accounts already exist
      expect(response.body.balances.tokenIn).toBe('1000000000'); // 1000 tokens
    });

    it('should validate token accounts', async () => {
      const response = await request(app)
        .post('/swap/validate-accounts')
        .send({
          user: testUser.publicKey.toString(),
          tokenIn: tokenMintA.toString(),
          tokenOut: tokenMintB.toString(),
          amountIn: 100000000 // 100 tokens
        })
        .expect(200);

      expect(response.body.valid).toBe(true);
      expect(response.body.errors).toHaveLength(0);
      expect(response.body.balances.tokenIn).toBe('1000000000');
    });

    it('should fail validation for insufficient balance', async () => {
      const response = await request(app)
        .post('/swap/validate-accounts')
        .send({
          user: testUser.publicKey.toString(),
          tokenIn: tokenMintA.toString(),
          tokenOut: tokenMintB.toString(),
          amountIn: 2000000000 // 2000 tokens (more than available)
        })
        .expect(200);

      expect(response.body.valid).toBe(false);
      expect(response.body.errors.length).toBeGreaterThan(0);
      expect(response.body.errors[0]).toContain('Insufficient');
    });
  });

  describe('3. Complete Swap Flow', () => {
    let quoteResponse: any;
    let intentResponse: any;
    let commitResponse: any;

    it('should get a swap quote', async () => {
      quoteResponse = await request(app)
        .post('/swap/quote')
        .send({
          fromMint: tokenMintA.toString(),
          toMint: tokenMintB.toString(),
          amount: 100000000, // 100 tokens
          slippageBps: 500 // 5%
        })
        .expect(200);

      expect(quoteResponse.body.route).toBeDefined();
      expect(quoteResponse.body.route.inputMint).toBe(tokenMintA.toString());
      expect(quoteResponse.body.route.outputMint).toBe(tokenMintB.toString());
      expect(quoteResponse.body.route.inAmount).toBe('100000000');
    });

    it('should generate trade intent', async () => {
      const currentTime = Math.floor(Date.now() / 1000);
      
      intentResponse = await request(app)
        .post('/swap/intent')
        .send({
          route: quoteResponse.body.route,
          tradeMeta: {
            user: testUser.publicKey.toString(),
            tokenIn: tokenMintA.toString(),
            tokenOut: tokenMintB.toString(),
            amountIn: 100000000,
            minOut: 90000000, // 90 tokens minimum
            expiry: currentTime + 3600, // 1 hour
            nonce: Math.floor(Math.random() * 1000000),
            relayerFee: 1000000, // 0.001 tokens
            relayer: testUser.publicKey.toString() // Self-relay for testing
          },
          sessionId: 'test-session-123'
        })
        .expect(200);

      expect(intentResponse.body.intent).toBeDefined();
      expect(intentResponse.body.hash).toBeDefined();
      expect(intentResponse.body.sessionRecovery.saved).toBe(true);

      // Verify database entry
      const dbIntent = await prisma.tradeIntent.findUnique({
        where: { intentHash: intentResponse.body.hash }
      });
      expect(dbIntent).toBeTruthy();
      expect(dbIntent?.status).toBe('draft');
    });

    it('should commit trade intent', async () => {
      commitResponse = await request(app)
        .post('/swap/commit/simple')
        .send({
          intentHash: intentResponse.body.hash,
          nonce: intentResponse.body.intent.nonce,
          expiry: intentResponse.body.intent.expiry
        })
        .expect(200);

      expect(commitResponse.body.success).toBe(true);
      expect(commitResponse.body.tx).toBeDefined();
      expect(commitResponse.body.status).toBe('committed');

      // Verify database update
      const dbIntent = await prisma.tradeIntent.findUnique({
        where: { intentHash: intentResponse.body.hash },
        include: { swapCommit: true }
      });
      expect(dbIntent?.status).toBe('committed');
      expect(dbIntent?.swapCommit).toBeTruthy();
    });

    it('should check intent status', async () => {
      const response = await request(app)
        .get(`/swap/status/${intentResponse.body.hash}`)
        .expect(200);

      expect(response.body.status).toBe('committed');
      expect(response.body.commit.tx).toBe(commitResponse.body.tx);
      expect(response.body.reveal).toBeNull();
      expect(response.body.isExpired).toBe(false);
    });

    it('should recover session data', async () => {
      const response = await request(app)
        .get('/swap/recover/test-session-123')
        .expect(200);

      expect(response.body.recovered).toBe(true);
      expect(response.body.data.intent).toEqual(intentResponse.body.intent);
      expect(response.body.data.hash).toBe(intentResponse.body.hash);
    });

    // Note: Reveal test would require proper signature generation
    // This is complex in testing environment, so we'll mock it
    it('should handle reveal request (mocked)', async () => {
      // Mock signature for testing
      const mockSignature = '0'.repeat(128);

      const response = await request(app)
        .post('/swap/reveal')
        .send({
          intent: intentResponse.body.intent,
          expectedHash: intentResponse.body.hash,
          signature: mockSignature
        })
        .expect(500); // Expected to fail due to signature verification

      expect(response.body.error.code).toBe('REVEAL_ERROR');
      // This confirms the endpoint is working and validation is happening
    });
  });

  describe('4. Fee Management', () => {
    it('should settle fees', async () => {
      const feeAmount = 1000000; // 1 token worth of fees

      const response = await request(app)
        .post('/fee/settle')
        .send({
          tokenMint: tokenMintA.toString(),
          feeAmount
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.distribution.totalFee).toBe(feeAmount);
      expect(response.body.distribution.liquidityStakers).toBe(500000); // 50%
      expect(response.body.distribution.treasury).toBe(300000); // 30%
      expect(response.body.distribution.mevBounty).toBe(200000); // 20%
    });

    it('should show updated fee account balances', async () => {
      const response = await request(app)
        .get(`/fee/accounts/${tokenMintA.toString()}`)
        .expect(200);

      expect(response.body.totalCollected).toBeGreaterThan(0);
      expect(response.body.accounts.liquidityStakers.balance).toBeGreaterThan(0);
      expect(response.body.accounts.treasury.balance).toBeGreaterThan(0);
      expect(response.body.accounts.mevBounty.balance).toBeGreaterThan(0);
    });
  });

  describe('5. System Health and Monitoring', () => {
    it('should check main health endpoint', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body.status).toBe('healthy');
      expect(response.body.services.database).toBe('connected');
      expect(response.body.services.solana).toBe('connected');
    });

    it('should check fee system health', async () => {
      const response = await request(app)
        .get('/fee/health')
        .expect(200);

      expect(response.body.status).toBe('healthy');
      expect(response.body.services.solana).toBe('connected');
      expect(response.body.services.wallet).toBe('loaded');
    });

    it('should check swap system health', async () => {
      const response = await request(app)
        .get('/swap/health')
        .expect(200);

      expect(response.body.status).toBe('healthy');
      expect(response.body.services.database).toBe('connected');
    });
  });

  describe('6. Error Handling', () => {
    it('should handle invalid public keys', async () => {
      const response = await request(app)
        .post('/swap/prepare-accounts')
        .send({
          user: 'invalid-key',
          tokenIn: tokenMintA.toString(),
          tokenOut: tokenMintB.toString()
        })
        .expect(400);

      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should handle non-existent intent hash', async () => {
      const fakeHash = '0'.repeat(64);
      
      const response = await request(app)
        .get(`/swap/status/${fakeHash}`)
        .expect(404);

      expect(response.body.error.code).toBe('INTENT_NOT_FOUND');
    });

    it('should handle expired session', async () => {
      const response = await request(app)
        .get('/swap/recover/non-existent-session')
        .expect(404);

      expect(response.body.error.code).toBe('SESSION_NOT_FOUND');
    });

    it('should handle fee initialization for existing accounts', async () => {
      const response = await request(app)
        .post('/fee/initialize-accounts')
        .send({
          tokenMint: tokenMintA.toString()
        })
        .expect(409);

      expect(response.body.error).toBe('Fee accounts already exist');
      expect(response.body.existingAccounts.length).toBeGreaterThan(0);
    });
  });

  describe('7. Database Consistency', () => {
    it('should maintain referential integrity', async () => {
      const user = await prisma.user.findFirst({
        where: { walletAddress: testUser.publicKey.toString() },
        include: {
          tradeIntents: {
            include: {
              swapCommit: true,
              swapReveal: true,
              feeSplit: true
            }
          }
        }
      });

      expect(user).toBeTruthy();
      expect(user?.tradeIntents.length).toBeGreaterThan(0);
      
      const intent = user?.tradeIntents[0];
      expect(intent?.swapCommit).toBeTruthy();
      expect(intent?.status).toBe('committed');
    });

    it('should track fee splits correctly', async () => {
      const feeSplits = await prisma.feeSplit.findMany({
        include: {
          tradeIntent: true
        }
      });

      if (feeSplits.length > 0) {
        const split = feeSplits[0];
        const total = Number(split.liquidityAmount) + Number(split.protocolAmount) + Number(split.bountyAmount);
        expect(total).toBeGreaterThan(0);
        
        // Verify percentage splits (approximately)
        const liquidityPercent = Number(split.liquidityAmount) / total;
        const protocolPercent = Number(split.protocolAmount) / total;
        const bountyPercent = Number(split.bountyAmount) / total;
        
        expect(liquidityPercent).toBeCloseTo(0.5, 1); // 50%
        expect(protocolPercent).toBeCloseTo(0.3, 1);  // 30%
        expect(bountyPercent).toBeCloseTo(0.2, 1);    // 20%
      }
    });
  });
});