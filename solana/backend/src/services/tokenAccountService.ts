// src/services/tokenAccountService.ts
import { 
  Connection, 
  PublicKey, 
  Transaction,
  Keypair 
} from '@solana/web3.js';
import {
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  getAccount,
  TokenAccountNotFoundError,
  TokenInvalidAccountOwnerError
} from '@solana/spl-token';
import { getSolanaConnection } from './solanaService';
import { logger } from '../utils/logger';

export interface TokenAccountInfo {
  address: PublicKey;
  mint: PublicKey;
  owner: PublicKey;
  amount: bigint;
  exists: boolean;
}

export class TokenAccountService {
  private connection: Connection;

  constructor() {
    this.connection = getSolanaConnection();
  }

  /**
   * Get Associated Token Account address for user and mint
   */
  async getAssociatedTokenAccount(
    userPublicKey: PublicKey,
    mintPublicKey: PublicKey
  ): Promise<PublicKey> {
    try {
      return await getAssociatedTokenAddress(
        mintPublicKey,
        userPublicKey,
        false, // allowOwnerOffCurve
        TOKEN_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
      );
    } catch (error) {
      logger.error('Failed to derive ATA address', {
        user: userPublicKey.toString(),
        mint: mintPublicKey.toString(),
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Check if token account exists and get its info
   */
  async getTokenAccountInfo(
    userPublicKey: PublicKey,
    mintPublicKey: PublicKey
  ): Promise<TokenAccountInfo> {
    try {
      const ataAddress = await this.getAssociatedTokenAccount(userPublicKey, mintPublicKey);
      
      try {
        const tokenAccount = await getAccount(
          this.connection,
          ataAddress,
          'confirmed',
          TOKEN_PROGRAM_ID
        );

        return {
          address: ataAddress,
          mint: tokenAccount.mint,
          owner: tokenAccount.owner,
          amount: tokenAccount.amount,
          exists: true
        };
      } catch (error) {
        if (error instanceof TokenAccountNotFoundError || 
            error instanceof TokenInvalidAccountOwnerError) {
          // Account doesn't exist
          return {
            address: ataAddress,
            mint: mintPublicKey,
            owner: userPublicKey,
            amount: BigInt(0),
            exists: false
          };
        }
        throw error;
      }
    } catch (error) {
      logger.error('Failed to get token account info', {
        user: userPublicKey.toString(),
        mint: mintPublicKey.toString(),
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Create Associated Token Account instruction
   */
  async createAssociatedTokenAccountInstruction(
    payer: PublicKey,
    owner: PublicKey,
    mint: PublicKey
  ) {
    const ataAddress = await this.getAssociatedTokenAccount(owner, mint);
    
    return {
      instruction: createAssociatedTokenAccountInstruction(
        payer,      // payer
        ataAddress, // ata
        owner,      // owner
        mint,       // mint
        TOKEN_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
      ),
      address: ataAddress
    };
  }

  /**
   * Prepare token accounts for swap (create if needed)
   */
  async prepareSwapTokenAccounts(
    userPublicKey: PublicKey,
    tokenInMint: PublicKey,
    tokenOutMint: PublicKey,
    payer?: PublicKey
  ): Promise<{
    tokenInAccount: PublicKey;
    tokenOutAccount: PublicKey;
    setupInstructions: any[];
    accountsToCreate: string[];
  }> {
    try {
      const payerKey = payer || userPublicKey;
      const setupInstructions: any[] = [];
      const accountsToCreate: string[] = [];

      // Check token in account
      const tokenInInfo = await this.getTokenAccountInfo(userPublicKey, tokenInMint);
      if (!tokenInInfo.exists) {
        const { instruction } = await this.createAssociatedTokenAccountInstruction(
          payerKey,
          userPublicKey,
          tokenInMint
        );
        setupInstructions.push(instruction);
        accountsToCreate.push('tokenIn');
        logger.info('Token in account will be created', {
          address: tokenInInfo.address.toString()
        });
      }

      // Check token out account
      const tokenOutInfo = await this.getTokenAccountInfo(userPublicKey, tokenOutMint);
      if (!tokenOutInfo.exists) {
        const { instruction } = await this.createAssociatedTokenAccountInstruction(
          payerKey,
          userPublicKey,
          tokenOutMint
        );
        setupInstructions.push(instruction);
        accountsToCreate.push('tokenOut');
        logger.info('Token out account will be created', {
          address: tokenOutInfo.address.toString()
        });
      }

      return {
        tokenInAccount: tokenInInfo.address,
        tokenOutAccount: tokenOutInfo.address,
        setupInstructions,
        accountsToCreate
      };
    } catch (error) {
      logger.error('Failed to prepare swap token accounts', {
        user: userPublicKey.toString(),
        tokenIn: tokenInMint.toString(),
        tokenOut: tokenOutMint.toString(),
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Validate token accounts for swap
   */
  async validateSwapAccounts(
    userPublicKey: PublicKey,
    tokenInMint: PublicKey,
    tokenOutMint: PublicKey,
    requiredAmountIn: bigint
  ): Promise<{
    valid: boolean;
    errors: string[];
    tokenInBalance: bigint;
    tokenOutBalance: bigint;
  }> {
    const errors: string[] = [];
    let tokenInBalance = BigInt(0);
    let tokenOutBalance = BigInt(0);

    try {
      // Check token in account
      const tokenInInfo = await this.getTokenAccountInfo(userPublicKey, tokenInMint);
      if (!tokenInInfo.exists) {
        errors.push(`Token in account does not exist for mint: ${tokenInMint.toString()}`);
      } else {
        tokenInBalance = tokenInInfo.amount;
        if (tokenInBalance < requiredAmountIn) {
          errors.push(`Insufficient token in balance. Required: ${requiredAmountIn}, Available: ${tokenInBalance}`);
        }
      }

      // Check token out account (should exist to receive tokens)
      const tokenOutInfo = await this.getTokenAccountInfo(userPublicKey, tokenOutMint);
      if (!tokenOutInfo.exists) {
        errors.push(`Token out account does not exist for mint: ${tokenOutMint.toString()}`);
      } else {
        tokenOutBalance = tokenOutInfo.amount;
      }

      return {
        valid: errors.length === 0,
        errors,
        tokenInBalance,
        tokenOutBalance
      };
    } catch (error) {
      errors.push(`Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return {
        valid: false,
        errors,
        tokenInBalance,
        tokenOutBalance
      };
    }
  }

  /**
   * Get multiple token balances for a user
   */
  async getUserTokenBalances(
    userPublicKey: PublicKey,
    mintAddresses: PublicKey[]
  ): Promise<Map<string, TokenAccountInfo>> {
    const balances = new Map<string, TokenAccountInfo>();

    try {
      const promises = mintAddresses.map(async (mint) => {
        const info = await this.getTokenAccountInfo(userPublicKey, mint);
        return [mint.toString(), info] as [string, TokenAccountInfo];
      });

      const results = await Promise.allSettled(promises);
      
      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          balances.set(result.value[0], result.value[1]);
        } else {
          logger.warn('Failed to get balance for mint', {
            mint: mintAddresses[index].toString(),
            error: result.reason
          });
        }
      });

      return balances;
    } catch (error) {
      logger.error('Failed to get user token balances', {
        user: userPublicKey.toString(),
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }
}