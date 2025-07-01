
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { useState, useCallback } from 'react';
import { 
  PublicKey, 
  Transaction, 
  SystemProgram,
  LAMPORTS_PER_SOL,
  sendAndConfirmTransaction,
  Keypair
} from '@solana/web3.js';
import { 
  TOKEN_PROGRAM_ID,
  createTransferInstruction,
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  getAccount
} from '@solana/spl-token';

interface SolanaSwapParams {
  fromToken: string;
  toToken: string;
  amount: string;
  slippage?: number;
  recipient?: string;
}

export const useSolanaWallet = () => {
  const { connection } = useConnection();
  const wallet = useWallet();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txSignature, setTxSignature] = useState<string | null>(null);

  const getBalance = useCallback(async (tokenMint?: string) => {
    if (!wallet.publicKey) return 0;

    try {
      if (!tokenMint || tokenMint === 'SOL') {
        // Get SOL balance
        const balance = await connection.getBalance(wallet.publicKey);
        return balance / LAMPORTS_PER_SOL;
      } else {
        // Get SPL token balance
        const tokenMintPubkey = new PublicKey(tokenMint);
        const tokenAccount = await getAssociatedTokenAddress(
          tokenMintPubkey,
          wallet.publicKey
        );
        
        try {
          const account = await getAccount(connection, tokenAccount);
          return Number(account.amount) / Math.pow(10, 6); // Assuming 6 decimals for most tokens
        } catch {
          return 0; // Account doesn't exist
        }
      }
    } catch (err) {
      console.error('Error getting balance:', err);
      return 0;
    }
  }, [connection, wallet.publicKey]);

  const executeSwap = useCallback(async (params: SolanaSwapParams) => {
    if (!wallet.publicKey || !wallet.signTransaction) {
      throw new Error('Wallet not connected');
    }

    setLoading(true);
    setError(null);
    setTxSignature(null);

    try {
      // For demo purposes, we'll simulate a swap transaction
      // In production, this would interact with Jupiter or other Solana DEX aggregators
      console.log('Executing Solana swap with params:', params);

      // Create a simple transaction (placeholder)
      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: wallet.publicKey,
          toPubkey: wallet.publicKey, // Self-transfer for demo
          lamports: 1000, // Minimal amount
        })
      );

      const { blockhash } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = wallet.publicKey;

      const signed = await wallet.signTransaction(transaction);
      const signature = await connection.sendRawTransaction(signed.serialize());
      
      await connection.confirmTransaction(signature);
      setTxSignature(signature);

      return {
        success: true,
        signature,
        message: 'Solana swap executed successfully (simulated)'
      };

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Solana swap failed';
      setError(errorMessage);
      console.error('Solana swap error:', err);
      return {
        success: false,
        error: errorMessage
      };
    } finally {
      setLoading(false);
    }
  }, [connection, wallet]);

  const getQuote = useCallback(async (fromToken: string, toToken: string, amount: string) => {
    try {
      if (!amount || parseFloat(amount) <= 0) return null;

      // Simulate getting quote from Jupiter or other Solana DEX
      // In production, you'd integrate with Jupiter API
      const mockRate = Math.random() * 0.1 + 0.95; // Random rate between 0.95-1.05
      const estimatedOutput = parseFloat(amount) * mockRate;

      console.log('Solana quote request:', { fromToken, toToken, amount, estimatedOutput });

      return {
        amountIn: amount,
        amountOut: estimatedOutput.toString(),
        route: [fromToken, toToken],
        fee: (parseFloat(amount) * 0.003).toString() // 0.3% fee
      };
    } catch (err) {
      console.error('Solana quote error:', err);
      return null;
    }
  }, []);

  return {
    wallet,
    connection,
    loading,
    error,
    txSignature,
    getBalance,
    executeSwap,
    getQuote,
    isConnected: !!wallet.connected,
    publicKey: wallet.publicKey?.toString()
  };
};
