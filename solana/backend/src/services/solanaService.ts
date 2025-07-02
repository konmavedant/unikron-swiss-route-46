import { 
  Connection, 
  Keypair, 
  PublicKey, 
  clusterApiUrl,
  Transaction,
  TransactionInstruction,
  sendAndConfirmTransaction,
  SYSVAR_INSTRUCTIONS_PUBKEY
} from '@solana/web3.js';
import * as fs from 'fs';
import { TradeIntent } from '../types/TradeIntent';
import dotenv from 'dotenv';

dotenv.config();

// Constants
export const PROGRAM_ID = new PublicKey('2bgpPzHUWu9jRAMUcF2Kex4dKti6U554hkhpkBi4EpHK');
const DEFAULT_RPC_URL = clusterApiUrl('devnet');
const COMMITMENT = 'confirmed';

// Global instances
let connection: Connection | null = null;
let wallet: Keypair | null = null;

// Instruction discriminators
const REVEAL_TRADE_DISCRIMINATOR = Buffer.from([0x12, 0x34, 0x56, 0x78, 0x9a, 0xbc, 0xde, 0xf0]);

// Initialize Solana connection
export function getSolanaConnection(): Connection {
  if (!connection) {
    const rpcUrl = process.env.ANCHOR_PROVIDER_URL || process.env.SOLANA_RPC_URL || DEFAULT_RPC_URL;
    
    connection = new Connection(rpcUrl, {
      commitment: COMMITMENT,
      disableRetryOnRateLimit: false,
      confirmTransactionInitialTimeout: 60000, // 60 seconds
      wsEndpoint: undefined, // Let it auto-detect
    });

    console.log('✅ Connection initialized:', {
      rpcUrl,
      commitment: COMMITMENT
    });
  }
  
  return connection;
}

// Initialize wallet with enhanced error handling
export function getWallet(): Keypair {
  if (!wallet) {
    try {
      // Validate environment variables
      if (!process.env.ANCHOR_WALLET && !process.env.SOLANA_KEYPAIR_PATH) {
        throw new Error('Neither ANCHOR_WALLET nor SOLANA_KEYPAIR_PATH environment variable is set');
      }

      const walletPath = process.env.ANCHOR_WALLET || process.env.SOLANA_KEYPAIR_PATH;
      
      if (!walletPath) {
        throw new Error('Wallet path is undefined');
      }

      if (!fs.existsSync(walletPath)) {
        throw new Error(`Wallet file not found at path: ${walletPath}`);
      }

      // Load wallet keypair
      const walletData = fs.readFileSync(walletPath, 'utf-8');
      let secretKey: Uint8Array;

      try {
        // Try to parse as JSON array first (standard format)
        const keyArray = JSON.parse(walletData);
        if (!Array.isArray(keyArray)) {
          throw new Error('Wallet file does not contain a valid key array');
        }
        secretKey = new Uint8Array(keyArray);
      } catch (jsonError) {
        // If JSON parsing fails, try to parse as base58 string
        try {
          const bs58 = require('bs58');
          secretKey = bs58.decode(walletData.trim());
        } catch (bs58Error) {
          throw new Error('Wallet file format not recognized. Expected JSON array or base58 string');
        }
      }

      if (secretKey.length !== 64) {
        throw new Error(`Invalid secret key length: ${secretKey.length}. Expected 64 bytes`);
      }

      wallet = Keypair.fromSecretKey(secretKey);
      
      console.log('✅ Wallet loaded successfully:', {
        publicKey: wallet.publicKey.toBase58(),
        path: walletPath
      });

    } catch (error) {
      console.error('❌ Failed to load wallet:', error);
      throw new Error(`Wallet initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  return wallet;
}

// Initialize provider (compatibility function)
export function initializeProvider() {
  try {
    const conn = getSolanaConnection();
    const walletKeypair = getWallet();
    
    console.log('✅ Provider initialized successfully');
    return {
      connection: conn,
      wallet: walletKeypair,
      publicKey: walletKeypair.publicKey
    };
  } catch (error) {
    console.error('❌ Failed to initialize provider:', error);
    throw new Error(`Provider initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Helper function to derive PDA
export function deriveSwapIntentPda(
  user: PublicKey,
  nonce: number
): [PublicKey, number] {
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

// Create reveal trade instruction
function createRevealTradeInstruction(
  swapIntent: PublicKey,
  user: PublicKey,
  intent: TradeIntent,
  expectedHash: Buffer,
  signature: Buffer
): TransactionInstruction {
  // Manual serialization for better control
  const buffer = Buffer.alloc(500); // Allocate sufficient buffer
  let offset = 0;
  
  // Write discriminator (8 bytes)
  REVEAL_TRADE_DISCRIMINATOR.copy(buffer, offset);
  offset += 8;
  
  // Write TradeIntent struct
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
  
  // relayerFee (8 bytes)
  buffer.writeBigUInt64LE(BigInt(intent.relayerFee), offset);
  offset += 8;
  
  // tokenIn (32 bytes)
  new PublicKey(intent.tokenIn).toBuffer().copy(buffer, offset);
  offset += 32;
  
  // tokenOut (32 bytes)
  new PublicKey(intent.tokenOut).toBuffer().copy(buffer, offset);
  offset += 32;
  
  // amountIn (8 bytes)
  buffer.writeBigUInt64LE(BigInt(intent.amountIn), offset);
  offset += 8;
  
  // minOut (8 bytes)
  buffer.writeBigUInt64LE(BigInt(intent.minOut), offset);
  offset += 8;
  
  // expectedHash (32 bytes)
  expectedHash.copy(buffer, offset);
  offset += 32;
  
  // signature (64 bytes)
  signature.copy(buffer, offset);
  offset += 64;
  
  const finalBuffer = buffer.slice(0, offset);

  return new TransactionInstruction({
    keys: [
      { pubkey: swapIntent, isSigner: false, isWritable: true },
      { pubkey: user, isSigner: true, isWritable: false },
      { pubkey: SYSVAR_INSTRUCTIONS_PUBKEY, isSigner: false, isWritable: false }
    ],
    programId: PROGRAM_ID,
    data: finalBuffer
  });
}

// Enhanced revealIntent function
export async function revealIntent(
  intent: TradeIntent,
  expectedHash: string,
  signature: string
): Promise<string> {
  try {
    console.log('Starting reveal intent process...');
    
    // Validate inputs
    if (!/^[0-9a-fA-F]{64}$/.test(expectedHash)) {
      throw new Error('Expected hash must be 64-character hex string');
    }

    if (!/^[0-9a-fA-F]{128}$/.test(signature)) {
      throw new Error('Signature must be 128-character hex string');
    }

    const connection = getSolanaConnection();
    const wallet = getWallet();
    const userPub = new PublicKey(intent.user);

    // Convert to buffers
    const expectedHashBuffer = Buffer.from(expectedHash, 'hex');
    const signatureBuffer = Buffer.from(signature, 'hex');

    // Derive PDA
    const [intentPda] = deriveSwapIntentPda(userPub, intent.nonce);

    console.log('Reveal intent parameters:', {
      intentPda: intentPda.toBase58(),
      user: userPub.toBase58(),
      nonce: intent.nonce
    });

    // Verify that the swap intent account exists
    const accountInfo = await connection.getAccountInfo(intentPda);
    if (!accountInfo) {
      throw new Error('Swap intent account does not exist. Must commit first.');
    }

    // Create transaction
    const transaction = new Transaction();
    const revealInstruction = createRevealTradeInstruction(
      intentPda,
      userPub,
      intent,
      expectedHashBuffer,
      signatureBuffer
    );

    transaction.add(revealInstruction);

    // Get recent blockhash
    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');
    transaction.recentBlockhash = blockhash;
    transaction.lastValidBlockHeight = lastValidBlockHeight;
    transaction.feePayer = wallet.publicKey;

    // Sign and send transaction
    transaction.sign(wallet);
    
    const txSignature = await sendAndConfirmTransaction(
      connection,
      transaction,
      [wallet],
      {
        commitment: 'confirmed',
        skipPreflight: false,
      }
    );

    console.log('✅ Reveal transaction successful:', txSignature);
    return txSignature;
  } catch (error) {
    console.error('❌ Reveal intent failed:', error);
    throw error;
  }
}

// Utility function to get account info
export async function getAccountInfo(publicKey: PublicKey) {
  try {
    const connection = getSolanaConnection();
    const accountInfo = await connection.getAccountInfo(publicKey);
    
    return {
      exists: !!accountInfo,
      lamports: accountInfo?.lamports || 0,
      owner: accountInfo?.owner.toBase58(),
      executable: accountInfo?.executable || false,
      rentEpoch: accountInfo?.rentEpoch,
      dataLength: accountInfo?.data.length || 0
    };
  } catch (error) {
    console.error('Failed to get account info:', error);
    throw error;
  }
}

// Utility function to get balance
export async function getBalance(publicKey: PublicKey): Promise<number> {
  try {
    const connection = getSolanaConnection();
    const balance = await connection.getBalance(publicKey);
    return balance;
  } catch (error) {
    console.error('Failed to get balance:', error);
    throw error;
  }
}

// Utility function to airdrop SOL (for devnet/testnet)
export async function requestAirdrop(publicKey: PublicKey, lamports: number): Promise<string> {
  try {
    const connection = getSolanaConnection();
    const signature = await connection.requestAirdrop(publicKey, lamports);
    
    // Wait for confirmation
    await connection.confirmTransaction(signature, 'confirmed');
    
    console.log('✅ Airdrop successful:', {
      signature,
      publicKey: publicKey.toBase58(),
      amount: lamports / 1e9 // Convert to SOL
    });
    
    return signature;
  } catch (error) {
    console.error('❌ Airdrop failed:', error);
    throw error;
  }
}

// Utility function to get transaction details
export async function getTransactionDetails(signature: string) {
  try {
    const connection = getSolanaConnection();
    const transaction = await connection.getTransaction(signature, {
      commitment: 'confirmed',
      maxSupportedTransactionVersion: 0
    });
    
    return transaction;
  } catch (error) {
    console.error('Failed to get transaction details:', error);
    throw error;
  }
}

// Health check function
export async function healthCheck(): Promise<boolean> {
  try {
    const connection = getSolanaConnection();
    const wallet = getWallet();
    
    // Test connection
    const version = await connection.getVersion();
    console.log('Connection version:', version);
    
    // Test wallet balance
    const balance = await getBalance(wallet.publicKey);
    console.log('Wallet balance:', balance / 1e9, 'SOL');
    
    // Test program account
    const programAccount = await getAccountInfo(PROGRAM_ID);
    console.log('Program account:', programAccount);
    
    if (!programAccount.exists) {
      throw new Error('Program account does not exist');
    }
    
    console.log('✅ Health check passed');
    return true;
  } catch (error) {
    console.error('❌ Health check failed:', error);
    return false;
  }
}

// Export types and constants
export { COMMITMENT, DEFAULT_RPC_URL };
export type SolanaProvider = {
  connection: Connection;
  wallet: Keypair;
  publicKey: PublicKey;
};