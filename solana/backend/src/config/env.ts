import dotenv from 'dotenv';

dotenv.config();

const requiredEnvVars = [
  'DATABASE_URL',
  'SOLANA_RPC',
  'PROGRAM_ID',
  'ANCHOR_WALLET'
];

export function validateEnvironment() {
  const missing = requiredEnvVars.filter(envVar => !process.env[envVar]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
  
  // Validate specific formats
  if (process.env.PROGRAM_ID && !/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(process.env.PROGRAM_ID)) {
    throw new Error('PROGRAM_ID must be a valid base58 public key');
  }
  
  if (process.env.SOLANA_RPC && !process.env.SOLANA_RPC.startsWith('http')) {
    throw new Error('SOLANA_RPC must be a valid HTTP URL');
  }
  
  console.log('✅ Environment variables validated');
}

export const config = {
  port: parseInt(process.env.PORT || '5000'),
  databaseUrl: process.env.DATABASE_URL!,
  solanaRpc: process.env.SOLANA_RPC!,
  programId: process.env.PROGRAM_ID!,
  anchorWallet: process.env.ANCHOR_WALLET!,
  nodeEnv: process.env.NODE_ENV || 'development',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  
  // Rate limiting
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
  },
  
  // Request timeouts
  timeouts: {
    jupiter: 10000, // 10 seconds
    solana: 30000,  // 30 seconds
    database: 5000  // 5 seconds
  }
};