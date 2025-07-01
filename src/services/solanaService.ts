
import { Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { solanaConnection, SOLANA_TOKENS } from '@/config/solana';

class SolanaService {
  private connection: Connection;

  constructor() {
    this.connection = solanaConnection;
  }

  async getBalance(publicKey: string): Promise<number> {
    try {
      const pubKey = new PublicKey(publicKey);
      const balance = await this.connection.getBalance(pubKey);
      return balance / LAMPORTS_PER_SOL;
    } catch (error) {
      console.error('Error getting balance:', error);
      return 0;
    }
  }

  async getTokenAccounts(publicKey: string) {
    try {
      const pubKey = new PublicKey(publicKey);
      const tokenAccounts = await this.connection.getParsedTokenAccountsByOwner(pubKey, {
        programId: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
      });
      
      return tokenAccounts.value.map(account => ({
        mint: account.account.data.parsed.info.mint,
        amount: account.account.data.parsed.info.tokenAmount.uiAmount,
        decimals: account.account.data.parsed.info.tokenAmount.decimals,
      }));
    } catch (error) {
      console.error('Error getting token accounts:', error);
      return [];
    }
  }

  async createTransferTransaction(
    fromPubkey: string,
    toPubkey: string,
    amount: number
  ): Promise<Transaction> {
    const fromPublicKey = new PublicKey(fromPubkey);
    const toPublicKey = new PublicKey(toPubkey);
    const lamports = amount * LAMPORTS_PER_SOL;

    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: fromPublicKey,
        toPubkey: toPublicKey,
        lamports,
      })
    );

    const { blockhash } = await this.connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = fromPublicKey;

    return transaction;
  }

  async simulateTransaction(transaction: Transaction): Promise<any> {
    try {
      const simulation = await this.connection.simulateTransaction(transaction);
      return simulation;
    } catch (error) {
      console.error('Error simulating transaction:', error);
      throw error;
    }
  }

  getAvailableTokens() {
    return SOLANA_TOKENS;
  }
}

export const solanaService = new SolanaService();
