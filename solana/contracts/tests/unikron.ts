import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Keypair, PublicKey, SystemProgram, SYSVAR_INSTRUCTIONS_PUBKEY } from "@solana/web3.js";
import { 
  TOKEN_PROGRAM_ID, 
  createMint, 
  createAssociatedTokenAccount, 
  mintTo,
  getAssociatedTokenAddress 
} from "@solana/spl-token";
import { assert } from "chai";
import * as crypto from "crypto";
import { Unikron } from "../target/types/unikron";

describe("unikron", () => {
  // Configure the client to use the local cluster
  anchor.setProvider(anchor.AnchorProvider.env());
  const program = anchor.workspace.Unikron as Program<Unikron>;
  const provider = anchor.getProvider();

  // Test accounts
  let user: Keypair;
  let payer: Keypair;
  let tokenMintA: PublicKey;
  let tokenMintB: PublicKey;
  let userTokenAccountA: PublicKey;
  let userTokenAccountB: PublicKey;
  let feeAccount: PublicKey;
  let treasuryAccount: PublicKey;
  let stakersAccount: PublicKey;
  let bountyAccount: PublicKey;

  // Test data
  const nonce = new anchor.BN(12345);
  const expiry = new anchor.BN(Math.floor(Date.now() / 1000) + 3600); // 1 hour from now
  const amountIn = new anchor.BN(1000000); // 1 token (6 decimals)
  const minOut = new anchor.BN(900000); // 0.9 tokens minimum
  const relayerFee = new anchor.BN(1000); // 0.001 tokens

  before(async () => {
    // Initialize keypairs
    user = Keypair.generate();
    payer = Keypair.generate();

    // Airdrop SOL to accounts
    await provider.connection.confirmTransaction(
      await provider.connection.requestAirdrop(user.publicKey, 2 * anchor.web3.LAMPORTS_PER_SOL)
    );
    await provider.connection.confirmTransaction(
      await provider.connection.requestAirdrop(payer.publicKey, 2 * anchor.web3.LAMPORTS_PER_SOL)
    );

    // Create token mints
    tokenMintA = await createMint(
      provider.connection,
      payer,
      payer.publicKey,
      null,
      6
    );

    tokenMintB = await createMint(
      provider.connection,
      payer,
      payer.publicKey,
      null,
      6
    );

    // Create associated token accounts
    userTokenAccountA = await createAssociatedTokenAccount(
      provider.connection,
      payer,
      tokenMintA,
      user.publicKey
    );

    userTokenAccountB = await createAssociatedTokenAccount(
      provider.connection,
      payer,
      tokenMintB,
      user.publicKey
    );

    // Create fee distribution accounts
    feeAccount = await createAssociatedTokenAccount(
      provider.connection,
      payer,
      tokenMintA,
      payer.publicKey
    );

    treasuryAccount = await createAssociatedTokenAccount(
      provider.connection,
      payer,
      tokenMintA,
      payer.publicKey
    );

    stakersAccount = await createAssociatedTokenAccount(
      provider.connection,
      payer,
      tokenMintA,
      payer.publicKey
    );

    bountyAccount = await createAssociatedTokenAccount(
      provider.connection,
      payer,
      tokenMintA,
      payer.publicKey
    );

    // Mint tokens to user
    await mintTo(
      provider.connection,
      payer,
      tokenMintA,
      userTokenAccountA,
      payer,
      10000000 // 10 tokens
    );

    // Mint some tokens to fee account for testing
    await mintTo(
      provider.connection,
      payer,
      tokenMintA,
      feeAccount,
      payer,
      1000000 // 1 token for fees
    );
  });

  it("Creates a trade intent commitment", async () => {
    // Create trade intent data
    const tradeIntent = {
      user: user.publicKey,
      nonce: nonce,
      expiry: expiry,
      relayer: payer.publicKey,
      relayerFee: relayerFee,
      tokenIn: tokenMintA,
      tokenOut: tokenMintB,
      amountIn: amountIn,
      minOut: minOut,
    };

    // Serialize and hash the trade intent
    const serialized = Buffer.concat([
      user.publicKey.toBuffer(),
      Buffer.from(nonce.toArray("le", 8)),
      Buffer.from(expiry.toArray("le", 8)),
      payer.publicKey.toBuffer(),
      Buffer.from(relayerFee.toArray("le", 8)),
      tokenMintA.toBuffer(),
      tokenMintB.toBuffer(),
      Buffer.from(amountIn.toArray("le", 8)),
      Buffer.from(minOut.toArray("le", 8)),
    ]);

    const intentHash = crypto.createHash('sha256').update(serialized).digest();
    const intentHashArray = Array.from(intentHash);

    // Derive PDA
    const [swapIntentPda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("intent"),
        user.publicKey.toBuffer(),
        Buffer.from(nonce.toArray("le", 8))
      ],
      program.programId
    );

    // Commit trade
    const tx = await program.methods
      .commitTrade(intentHashArray, nonce, expiry)
      .accountsStrict({
        swapIntent: swapIntentPda,
        user: user.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([user])
      .rpc();

    console.log("Commit transaction signature:", tx);

    // Verify the committed data
    const swapIntentAccount = await program.account.swapIntent.fetch(swapIntentPda);
    assert(swapIntentAccount.user.equals(user.publicKey));
    assert(swapIntentAccount.nonce.eq(nonce));
    assert(swapIntentAccount.expiry.eq(expiry));
    assert.deepEqual(Array.from(swapIntentAccount.intentHash), intentHashArray);
    assert.equal(swapIntentAccount.revealed, false);
  });

  it("Reveals and executes trade", async () => {
    // Create trade intent data (same as before)
    const tradeIntent = {
      user: user.publicKey,
      nonce: nonce,
      expiry: expiry,
      relayer: payer.publicKey,
      relayerFee: relayerFee,
      tokenIn: tokenMintA,
      tokenOut: tokenMintB,
      amountIn: amountIn,
      minOut: minOut,
    };

    // Hash the intent
    const serialized = Buffer.concat([
      user.publicKey.toBuffer(),
      Buffer.from(nonce.toArray("le", 8)),
      Buffer.from(expiry.toArray("le", 8)),
      payer.publicKey.toBuffer(),
      Buffer.from(relayerFee.toArray("le", 8)),
      tokenMintA.toBuffer(),
      tokenMintB.toBuffer(),
      Buffer.from(amountIn.toArray("le", 8)),
      Buffer.from(minOut.toArray("le", 8)),
    ]);

    const intentHash = crypto.createHash('sha256').update(serialized).digest();
    const intentHashArray = Array.from(intentHash);

    // Mock signature (64 bytes)
    const mockSignature = new Array(64).fill(0);

    // Derive PDA
    const [swapIntentPda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("intent"),
        user.publicKey.toBuffer(),
        Buffer.from(nonce.toArray("le", 8))
      ],
      program.programId
    );

    // Create ed25519 verify instruction first
    const ed25519Instruction = anchor.web3.Ed25519Program.createInstructionWithPublicKey({
      publicKey: user.publicKey.toBytes(),
      message: serialized,
      signature: new Uint8Array(mockSignature),
    });

    // Reveal trade with ed25519 instruction
    const tx = new anchor.web3.Transaction();
    tx.add(ed25519Instruction);
    
    const revealIx = await program.methods
      .revealTrade(tradeIntent, intentHashArray, mockSignature)
      .accounts({
        swapIntent: swapIntentPda,
        user: user.publicKey,
        instructionsSysvar: SYSVAR_INSTRUCTIONS_PUBKEY,
      })
      .instruction();
    
    tx.add(revealIx);

    const txSig = await provider.sendAndConfirm(tx, [user]);
    console.log("Reveal transaction signature:", txSig);

    // Verify the trade was revealed
    const swapIntentAccount = await program.account.swapIntent.fetch(swapIntentPda);
    assert.equal(swapIntentAccount.revealed, true);
  });

  it("Distributes fees correctly", async () => {
    const feeAmount = new anchor.BN(10000); // 0.01 tokens

    // Get initial balances
    const initialTreasuryBalance = await provider.connection.getTokenAccountBalance(treasuryAccount);
    const initialStakersBalance = await provider.connection.getTokenAccountBalance(stakersAccount);
    const initialBountyBalance = await provider.connection.getTokenAccountBalance(bountyAccount);

    // Settle fee
    const tx = await program.methods
      .settleTrade(feeAmount)
      .accountsStrict({
        payer: payer.publicKey,
        sourceFeeAccount: feeAccount,
        liquidityStakerAccount: stakersAccount,
        treasuryAccount: treasuryAccount,
        bountyAccount: bountyAccount,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .signers([payer])
      .rpc();

    console.log("Fee settlement transaction signature:", tx);

    // Verify fee distribution
    const finalTreasuryBalance = await provider.connection.getTokenAccountBalance(treasuryAccount);
    const finalStakersBalance = await provider.connection.getTokenAccountBalance(stakersAccount);
    const finalBountyBalance = await provider.connection.getTokenAccountBalance(bountyAccount);

    // Calculate expected distributions
    const expectedTreasuryFee = feeAmount.toNumber() * 30 / 100; // 30%
    const expectedStakersFee = feeAmount.toNumber() * 50 / 100;  // 50%
    const expectedBountyFee = feeAmount.toNumber() - expectedTreasuryFee - expectedStakersFee; // 20%

    assert.equal(
      finalTreasuryBalance.value.uiAmount - initialTreasuryBalance.value.uiAmount,
      expectedTreasuryFee / 1000000 // Convert to UI amount
    );
    assert.equal(
      finalStakersBalance.value.uiAmount - initialStakersBalance.value.uiAmount,
      expectedStakersFee / 1000000
    );
    assert.equal(
      finalBountyBalance.value.uiAmount - initialBountyBalance.value.uiAmount,
      expectedBountyFee / 1000000
    );
  });

  it("Full flow: commit -> reveal -> settle", async () => {
    const testNonce = new anchor.BN(54321);
    const testExpiry = new anchor.BN(Math.floor(Date.now() / 1000) + 3600);
    
    // 1. Create and commit intent
    const tradeIntent = {
      user: user.publicKey,
      nonce: testNonce,
      expiry: testExpiry,
      relayer: payer.publicKey,
      relayerFee: relayerFee,
      tokenIn: tokenMintA,
      tokenOut: tokenMintB,
      amountIn: amountIn,
      minOut: minOut,
    };

    const serialized = Buffer.concat([
      user.publicKey.toBuffer(),
      Buffer.from(testNonce.toArray("le", 8)),
      Buffer.from(testExpiry.toArray("le", 8)),
      payer.publicKey.toBuffer(),
      Buffer.from(relayerFee.toArray("le", 8)),
      tokenMintA.toBuffer(),
      tokenMintB.toBuffer(),
      Buffer.from(amountIn.toArray("le", 8)),
      Buffer.from(minOut.toArray("le", 8)),
    ]);

    const intentHash = crypto.createHash('sha256').update(serialized).digest();
    const intentHashArray = Array.from(intentHash);

    const [testSwapIntentPda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("intent"),
        user.publicKey.toBuffer(),
        Buffer.from(testNonce.toArray("le", 8))
      ],
      program.programId
    );

    // Commit
    await program.methods
      .commitTrade(intentHashArray, testNonce, testExpiry)
      .accountsStrict({
        swapIntent: testSwapIntentPda,
        user: user.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([user])
      .rpc();

    // 2. Reveal
    const mockSignature = new Array(64).fill(0);
    const ed25519Instruction = anchor.web3.Ed25519Program.createInstructionWithPublicKey({
      publicKey: user.publicKey.toBytes(),
      message: serialized,
      signature: new Uint8Array(mockSignature),
    });

    const revealTx = new anchor.web3.Transaction();
    revealTx.add(ed25519Instruction);
    
    const revealIx = await program.methods
      .revealTrade(tradeIntent, intentHashArray, mockSignature)
      .accounts({
        swapIntent: testSwapIntentPda,
        user: user.publicKey,
        instructionsSysvar: SYSVAR_INSTRUCTIONS_PUBKEY,
      })
      .instruction();
    
    revealTx.add(revealIx);
    await provider.sendAndConfirm(revealTx, [user]);

    // 3. Settle fees
    const feeAmount = new anchor.BN(5000);
    await program.methods
      .settleTrade(feeAmount)
      .accountsStrict({
        payer: payer.publicKey,
        sourceFeeAccount: feeAccount,
        liquidityStakerAccount: stakersAccount,
        treasuryAccount: treasuryAccount,
        bountyAccount: bountyAccount,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .signers([payer])
      .rpc();

    console.log("✅ Full flow completed successfully");
  });

  it("Rejects expired intents", async () => {
    const expiredNonce = new anchor.BN(99999);
    const expiredExpiry = new anchor.BN(Math.floor(Date.now() / 1000) - 3600); // 1 hour ago

    const tradeIntent = {
      user: user.publicKey,
      nonce: expiredNonce,
      expiry: expiredExpiry,
      relayer: payer.publicKey,
      relayerFee: relayerFee,
      tokenIn: tokenMintA,
      tokenOut: tokenMintB,
      amountIn: amountIn,
      minOut: minOut,
    };

    const serialized = Buffer.concat([
      user.publicKey.toBuffer(),
      Buffer.from(expiredNonce.toArray("le", 8)),
      Buffer.from(expiredExpiry.toArray("le", 8)),
      payer.publicKey.toBuffer(),
      Buffer.from(relayerFee.toArray("le", 8)),
      tokenMintA.toBuffer(),
      tokenMintB.toBuffer(),
      Buffer.from(amountIn.toArray("le", 8)),
      Buffer.from(minOut.toArray("le", 8)),
    ]);

    const intentHash = crypto.createHash('sha256').update(serialized).digest();
    const intentHashArray = Array.from(intentHash);

    const [expiredSwapIntentPda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("intent"),
        user.publicKey.toBuffer(),
        Buffer.from(expiredNonce.toArray("le", 8))
      ],
      program.programId
    );

    // Commit expired intent
    await program.methods
      .commitTrade(intentHashArray, expiredNonce, expiredExpiry)
      .accountsStrict({
        swapIntent: expiredSwapIntentPda,
        user: user.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([user])
      .rpc();

    // Try to reveal - should fail
    const mockSignature = new Array(64).fill(0);
    const ed25519Instruction = anchor.web3.Ed25519Program.createInstructionWithPublicKey({
      publicKey: user.publicKey.toBytes(),
      message: serialized,
      signature: new Uint8Array(mockSignature),
    });

    const revealTx = new anchor.web3.Transaction();
    revealTx.add(ed25519Instruction);
    
    const revealIx = await program.methods
      .revealTrade(tradeIntent, intentHashArray, mockSignature)
      .accounts({
        swapIntent: expiredSwapIntentPda,
        user: user.publicKey,
        instructionsSysvar: SYSVAR_INSTRUCTIONS_PUBKEY,
      })
      .instruction();
    
    revealTx.add(revealIx);

    try {
      await provider.sendAndConfirm(revealTx, [user]);
      assert.fail("Should have thrown an error for expired intent");
    } catch (error) {
      assert(error.message.includes("IntentExpired") || error.message.includes("Trade intent expired"));
      console.log("✅ Correctly rejected expired intent");
    }
  });
});