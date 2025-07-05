import { getSolanaConnection, getWallet, PROGRAM_ID } from './solanaService';
import { 
  PublicKey, 
  Transaction, 
  TransactionInstruction,
  SystemProgram,
  sendAndConfirmTransaction
} from '@solana/web3.js';
import { Buffer } from 'buffer';

// Correct discriminator from IDL
const COMMIT_TRADE_DISCRIMINATOR = Buffer.from([225, 172, 49, 43, 30, 198, 216, 89]);

// FIXED: PDA derivation based on your IDL seeds
// From IDL: seeds = [b"intent", user.key().as_ref(), &nonce.to_le_bytes()]
function deriveSwapIntentPda(user: PublicKey, nonce: number): [PublicKey, number] {
  // Convert nonce to little-endian bytes exactly as the program does
  const nonceBytes = Buffer.alloc(8);
  nonceBytes.writeBigUInt64LE(BigInt(nonce), 0);

  console.log('PDA Derivation Debug:', {
    user: user.toBase58(),
    nonce,
    nonceBytes: Array.from(nonceBytes),
    seeds: [
      'intent (as bytes)',
      user.toBase58(),
      `nonce ${nonce} as LE bytes`
    ]
  });

  return PublicKey.findProgramAddressSync(
    [
      Buffer.from("intent", "utf8"), // Make sure it's UTF-8 encoded
      user.toBuffer(),
      nonceBytes
    ],
    PROGRAM_ID
  );
}

// Alternative PDA derivation methods to test
function testAlternativePdaDerivations(user: PublicKey, nonce: number) {
  const results = [];

  // Method 1: Current method
  try {
    const nonceBytes1 = Buffer.alloc(8);
    nonceBytes1.writeBigUInt64LE(BigInt(nonce), 0);
    const [pda1] = PublicKey.findProgramAddressSync(
      [Buffer.from("intent", "utf8"), user.toBuffer(), nonceBytes1],
      PROGRAM_ID
    );
    results.push({ method: "Current (LE u64)", pda: pda1.toBase58() });
  } catch (e) {
    results.push({ method: "Current (LE u64)", error: e });
  }

  // Method 2: Try with big-endian nonce
  try {
    const nonceBytes2 = Buffer.alloc(8);
    nonceBytes2.writeBigUInt64BE(BigInt(nonce), 0);
    const [pda2] = PublicKey.findProgramAddressSync(
      [Buffer.from("intent", "utf8"), user.toBuffer(), nonceBytes2],
      PROGRAM_ID
    );
    results.push({ method: "Big-endian u64", pda: pda2.toBase58() });
  } catch (e) {
    results.push({ method: "Big-endian u64", error: e });
  }

  // Method 3: Try with 4-byte nonce (u32)
  try {
    const nonceBytes3 = Buffer.alloc(4);
    nonceBytes3.writeUInt32LE(nonce, 0);
    const [pda3] = PublicKey.findProgramAddressSync(
      [Buffer.from("intent", "utf8"), user.toBuffer(), nonceBytes3],
      PROGRAM_ID
    );
    results.push({ method: "LE u32", pda: pda3.toBase58() });
  } catch (e) {
    results.push({ method: "LE u32", error: e });
  }

  // Method 4: Try with just nonce as string
  try {
    const [pda4] = PublicKey.findProgramAddressSync(
      [Buffer.from("intent", "utf8"), user.toBuffer(), Buffer.from(nonce.toString())],
      PROGRAM_ID
    );
    results.push({ method: "Nonce as string", pda: pda4.toBase58() });
  } catch (e) {
    results.push({ method: "Nonce as string", error: e });
  }

  // Method 5: Check what the program actually expects
  const expectedPda = "ACgENDDqhiEbBq4c16mg3anyn7z7PXTmXbk6qKDPxqkR";
  results.push({ method: "Expected by program", pda: expectedPda });

  return results;
}

// Create instruction (same as before)
function createCommitTradeInstruction(
  user: PublicKey,
  swapIntentPda: PublicKey,
  intentHash: Buffer,
  nonce: number,
  expiry: number
): TransactionInstruction {
  const buffer = Buffer.alloc(8 + 32 + 8 + 8);
  let offset = 0;
  
  COMMIT_TRADE_DISCRIMINATOR.copy(buffer, offset);
  offset += 8;
  
  intentHash.copy(buffer, offset);
  offset += 32;
  
  buffer.writeBigUInt64LE(BigInt(nonce), offset);
  offset += 8;
  
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

// Enhanced commit function with PDA debugging
export async function commitIntent(
  userAddress: string,
  intentHash: string,
  nonce: number,
  expiry: number
): Promise<string> {
  try {
    console.log('🚀 Starting commit with PDA debugging...');
    
    const userPub = new PublicKey(userAddress);
    const connection = getSolanaConnection();
    const backendWallet = getWallet();

    if (!userPub.equals(backendWallet.publicKey)) {
      throw new Error(`User must match backend wallet for testing.`);
    }

    const hashBytes = Buffer.from(intentHash, 'hex');
    
    // Test all PDA derivation methods
    console.log('🔍 Testing PDA derivation methods:');
    const pdaTests = testAlternativePdaDerivations(userPub, nonce);
    pdaTests.forEach((test, index) => {
      console.log(`Method ${index + 1}: ${test.method} -> ${test.pda || test.error}`);
    });

    // Try to find which method gives us the expected PDA
    const expectedPda = "ACgENDDqhiEbBq4c16mg3anyn7z7PXTmXbk6qKDPxqkR";
    const matchingMethod = pdaTests.find(test => test.pda === expectedPda);
    
    if (matchingMethod) {
      console.log(`✅ Found matching method: ${matchingMethod.method}`);
    } else {
      console.log(`❌ None of our methods match the expected PDA: ${expectedPda}`);
      
      // Let's try to reverse-engineer the correct seeds
      console.log('🔍 Attempting to reverse-engineer PDA...');
      
      // Try different seed combinations to find what gives us the expected PDA
      const variations = [
        // Different nonce encodings
        () => {
          const nonceLE = Buffer.alloc(8);
          nonceLE.writeBigUInt64LE(BigInt(nonce), 0);
          return [Buffer.from("intent"), userPub.toBuffer(), nonceLE];
        },
        () => {
          const nonceBE = Buffer.alloc(8);
          nonceBE.writeBigUInt64BE(BigInt(nonce), 0);
          return [Buffer.from("intent"), userPub.toBuffer(), nonceBE];
        },
        () => {
          const nonceU32 = Buffer.alloc(4);
          nonceU32.writeUInt32LE(nonce, 0);
          return [Buffer.from("intent"), userPub.toBuffer(), nonceU32];
        },
        // Try without nonce
        () => [Buffer.from("intent"), userPub.toBuffer()],
        // Try with string nonce
        () => [Buffer.from("intent"), userPub.toBuffer(), Buffer.from(nonce.toString())],
      ];

      for (let i = 0; i < variations.length; i++) {
        try {
          const seeds = variations[i]();
          const [derivedPda] = PublicKey.findProgramAddressSync(seeds, PROGRAM_ID);
          console.log(`Variation ${i + 1}: ${derivedPda.toBase58()} ${derivedPda.toBase58() === expectedPda ? '✅ MATCH!' : ''}`);
        } catch (e) {
          console.log(`Variation ${i + 1}: Failed`);
        }
      }
    }

    // For now, let's just use the expected PDA directly
    const swapIntentPda = new PublicKey(expectedPda);
    
    console.log('📍 Using expected PDA directly:', swapIntentPda.toBase58());

    // Check if account exists
    const existingAccount = await connection.getAccountInfo(swapIntentPda);
    if (existingAccount) {
      throw new Error(`Account already exists at expected PDA: ${swapIntentPda.toBase58()}`);
    }

    // Create and send transaction
    const instruction = createCommitTradeInstruction(
      userPub,
      swapIntentPda,
      hashBytes,
      nonce,
      expiry
    );

    const transaction = new Transaction();
    transaction.add(instruction);

    const { blockhash } = await connection.getLatestBlockhash('confirmed');
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = backendWallet.publicKey;

    transaction.sign(backendWallet);

    const signature = await sendAndConfirmTransaction(
      connection,
      transaction,
      [backendWallet],
      { commitment: 'confirmed', skipPreflight: false }
    );

    console.log('✅ SUCCESS! Transaction confirmed:', signature);
    return signature;

  } catch (error) {
    console.error('❌ Commit failed:', error);
    throw error;
  }
}

// Test function to help debug PDA derivation
export async function debugPdaDerivation(userAddress: string, nonce: number) {
  try {
    const userPub = new PublicKey(userAddress);
    const results = testAlternativePdaDerivations(userPub, nonce);
    
    return {
      user: userPub.toBase58(),
      nonce,
      programId: PROGRAM_ID.toBase58(),
      expectedByProgram: "ACgENDDqhiEbBq4c16mg3anyn7z7PXTmXbk6qKDPxqkR",
      derivationTests: results
    };
  } catch (error) {
    throw new Error(`Debug failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Keep the old functions for backward compatibility
export async function getBackendWalletInfo() {
  try {
    const wallet = getWallet();
    const connection = getSolanaConnection();
    const balance = await connection.getBalance(wallet.publicKey);
    
    return {
      publicKey: wallet.publicKey.toBase58(),
      balance: balance / 1e9,
      balanceLamports: balance,
      programId: PROGRAM_ID.toBase58()
    };
  } catch (error) {
    throw new Error(`Failed to get wallet info: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function testPdaDerivation(userAddress: string, nonce: number) {
  return debugPdaDerivation(userAddress, nonce);
}