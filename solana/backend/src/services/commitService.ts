import { getSolanaConnection, getWallet, PROGRAM_ID } from './solanaService';
import { 
  PublicKey, 
  Transaction, 
  TransactionInstruction,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
  sendAndConfirmTransaction
} from '@solana/web3.js';
import { Buffer } from 'buffer';

// Instruction discriminators (8 bytes each)
const COMMIT_TRADE_DISCRIMINATOR = Buffer.from([0x8a, 0x9c, 0x44, 0xd2, 0x15, 0x6e, 0x7f, 0x91]);
//const REVEAL_TRADE_DISCRIMINATOR = Buffer.from([0x12, 0x34, 0x56, 0x78, 0x9a, 0xbc, 0xde, 0xf0]);

// Account discriminators
const SWAP_INTENT_DISCRIMINATOR = Buffer.from([242, 212, 249, 216, 109, 94, 238, 134]);

// Borsh schemas for serialization
const CommitTradeSchema = {
  struct: {
    discriminator: { array: { type: 'u8', len: 8 } },
    intentHash: { array: { type: 'u8', len: 32 } },
    nonce: 'u64',
    expiry: 'u64'
  }
};

const RevealTradeSchema = new Map([
  ['RevealTradeInstruction', {
    kind: 'struct',
    fields: [
      ['discriminator', [8]], // u8 array of length 8
      ['intent', 'TradeIntent'],
      ['expectedHash', [32]], // u8 array of length 32
      ['signature', [64]]     // u8 array of length 64
    ]
  }],
  ['TradeIntent', {
    kind: 'struct',
    fields: [
      ['user', [32]],        // Pubkey as bytes
      ['nonce', 'u64'],
      ['expiry', 'u64'],
      ['relayer', [32]],     // Pubkey as bytes
      ['relayerFee', 'u64'],
      ['tokenIn', [32]],     // Pubkey as bytes
      ['tokenOut', [32]],    // Pubkey as bytes
      ['amountIn', 'u64'],
      ['minOut', 'u64']
    ]
  }]
]);

// Enhanced program validation
export async function validateProgramSetup(): Promise<boolean> {
  try {
    console.log('Starting program validation...');

    // 1. Get connection
    const connection = getSolanaConnection();
    console.log('✅ Connection established');

    // 2. Test connection
    try {
      const version = await connection.getVersion();
      console.log('✅ Connection test passed:', version);
    } catch (error) {
      console.error('❌ Connection test failed:', error);
      throw error;
    }

    // 3. Verify program exists on chain
    const programAccount = await connection.getAccountInfo(PROGRAM_ID);
    console.log('ℹ️ Program account info:', {
      exists: !!programAccount,
      executable: programAccount?.executable,
      owner: programAccount?.owner.toBase58(),
      lamports: programAccount?.lamports
    });

    if (!programAccount) {
      throw new Error('Program account not found on chain');
    }

    if (!programAccount.executable) {
      throw new Error('Program account is not executable');
    }

    // 4. Verify wallet
    const wallet = getWallet();
    const balance = await connection.getBalance(wallet.publicKey);
    console.log('✅ Wallet info:', {
      publicKey: wallet.publicKey.toBase58(),
      balance: balance / 1e9 // Convert lamports to SOL
    });

    if (balance === 0) {
      console.warn('⚠️ Wallet has zero balance');
    }

    console.log('✅ All program validations passed');
    return true;
  } catch (error) {
    console.error('❌ Program validation failed:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    return false;
  }
}

// Helper function to derive PDA
function deriveSwapIntentPda(user: PublicKey, nonce: number): [PublicKey, number] {
  const nonceBuffer = Buffer.alloc(8);
  nonceBuffer.writeBigUInt64LE(BigInt(nonce), 0);

  return PublicKey.findProgramAddressSync(
    [
      Buffer.from("intent"),
      user.toBuffer(),
      nonceBuffer
    ],
    PROGRAM_ID
  );
}

// Create commit trade instruction
function createCommitTradeInstruction(
  user: PublicKey,
  swapIntentPda: PublicKey,
  intentHash: Buffer,
  nonce: number,
  expiry: number
): TransactionInstruction {
  const buffer = Buffer.alloc(56); // 8 + 32 + 8 + 8 = 56 bytes
  let offset = 0;
  
  // Write discriminator (8 bytes)
  COMMIT_TRADE_DISCRIMINATOR.copy(buffer, offset);
  offset += 8;
  
  // Write intent hash (32 bytes)
  intentHash.copy(buffer, offset);
  offset += 32;
  
  // Write nonce (8 bytes, little endian)
  buffer.writeBigUInt64LE(BigInt(nonce), offset);
  offset += 8;
  
  // Write expiry (8 bytes, little endian)
  buffer.writeBigUInt64LE(BigInt(expiry), offset);

  return new TransactionInstruction({
    keys: [
      { pubkey: swapIntentPda, isSigner: false, isWritable: true },
      { pubkey: user, isSigner: true, isWritable: true },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false }
    ],
    programId: PROGRAM_ID,
    data: buffer
  });
}

// Enhanced commit function with complete implementation
export async function commitIntent(
  user: string,
  intentHash: string,
  nonce: number,
  expiry: number
): Promise<string> {
  try {
    console.log('Starting commit process...');

    // Validate inputs
    if (!PublicKey.isOnCurve(user)) {
      throw new Error('Invalid user public key');
    }

    if (!/^[0-9a-fA-F]{64}$/.test(intentHash)) {
      throw new Error('Intent hash must be 64-character hex string');
    }

    const connection = getSolanaConnection();
    const wallet = getWallet();
    const userPub = new PublicKey(user);

    // Convert hash to bytes
    const hashBytes = Buffer.from(intentHash, 'hex');
    if (hashBytes.length !== 32) {
      throw new Error(`Invalid hash length: ${hashBytes.length} bytes`);
    }

    // Derive PDA for the swap intent
    const [swapIntentPda] = deriveSwapIntentPda(userPub, nonce);

    console.log('Commit transaction parameters:', {
      swapIntentPda: swapIntentPda.toBase58(),
      user: userPub.toBase58(),
      nonce,
      expiry,
      intentHash
    });

    // Create transaction
    const transaction = new Transaction();
    const commitInstruction = createCommitTradeInstruction(
      userPub,
      swapIntentPda,
      hashBytes,
      nonce,
      expiry
    );

    transaction.add(commitInstruction);

    // Get recent blockhash
    const { blockhash } = await connection.getLatestBlockhash('confirmed');
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = wallet.publicKey;

    // Sign and send transaction
    transaction.sign(wallet);
    
    const txSignature = await sendAndConfirmTransaction(
      connection,
      transaction,
      [wallet],
      { commitment: 'confirmed' }
    );

    console.log('✅ Commit transaction successful:', txSignature);
    return txSignature;

  } catch (error) {
    console.error('❌ Commit failed:', error);
    throw error;
  }
}

// Helper function to fetch swap intent account
export async function fetchSwapIntent(address: PublicKey) {
  try {
    const connection = getSolanaConnection();
    const accountInfo = await connection.getAccountInfo(address);
    
    if (!accountInfo) {
      throw new Error('Account does not exist');
    }

    // Verify discriminator
    const accountDiscriminator = accountInfo.data.slice(0, 8);
    if (!accountDiscriminator.equals(SWAP_INTENT_DISCRIMINATOR)) {
      throw new Error('Invalid account discriminator - not a SwapIntent account');
    }

    // Parse account data (simplified - you may need to adjust based on actual account structure)
    const data = accountInfo.data.slice(8);
    
    return {
      publicKey: address,
      account: accountInfo,
      data: data,
      // Add specific field parsing here based on your SwapIntent structure
    };
  } catch (error) {
    console.error('Failed to fetch swap intent:', error);
    throw error;
  }
}

// Type definitions
export interface CommitParams {
  user: string;
  intentHash: string;
  nonce: number;
  expiry: number;
}

export interface CommitResult {
  signature: string;
  pda: string;
  timestamp: number;
}

export interface SwapIntentAccount {
  publicKey: PublicKey;
  account: any;
  data: Buffer;
}