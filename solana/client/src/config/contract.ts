import { PublicKey } from "@solana/web3.js"

// Contract configuration
export const CONTRACT_CONFIG = {
  // Replace with your actual deployed program ID
  PROGRAM_ID: process.env.NEXT_PUBLIC_PROGRAM_ID || "YOUR_PROGRAM_ID_HERE",

  // Network configuration
  NETWORK: process.env.NEXT_PUBLIC_SOLANA_NETWORK || "devnet",
  RPC_URL: process.env.NEXT_PUBLIC_SOLANA_RPC_URL || "https://api.devnet.solana.com",

  // Contract constants
  FEE_BASIS_POINTS: 30, // 0.3% protocol fee
  MAX_SLIPPAGE_BPS: 1000, // 10% max slippage
  DEFAULT_SLIPPAGE_BPS: 50, // 0.5% default slippage

  // Timeout configurations
  QUOTE_VALIDITY_MS: 20000, // 20 seconds
  TRANSACTION_TIMEOUT_MS: 60000, // 60 seconds

  // PDA seeds
  SEEDS: {
    INTENT: "intent",
    FEE_AUTHORITY: "fee_authority",
    FEE_COLLECTION: "fee_collection",
    LIQUIDITY_STAKER: "liquidity_staker",
    TREASURY: "treasury",
    BOUNTY: "bounty",
  },
} as const

// Validate program ID
export const validateProgramId = (programId: string): boolean => {
  try {
    new PublicKey(programId)
    return true
  } catch {
    return false
  }
}

// Get program ID as PublicKey
export const getProgramId = (): PublicKey => {
  const programId = CONTRACT_CONFIG.PROGRAM_ID

  if (!validateProgramId(programId)) {
    throw new Error(`Invalid program ID: ${programId}. Please set NEXT_PUBLIC_PROGRAM_ID environment variable.`)
  }

  return new PublicKey(programId)
}
