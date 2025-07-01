
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { useCallback, useState } from 'react';
import { solanaService } from '@/services/solanaService';

export const useSolanaWallet = () => {
  const { connection } = useConnection();
  const { 
    publicKey, 
    connected, 
    connecting, 
    disconnect, 
    sendTransaction,
    signTransaction,
    wallet
  } = useWallet();
  
  const [balance, setBalance] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  const getBalance = useCallback(async () => {
    if (!publicKey) return 0;
    
    setLoading(true);
    try {
      const balanceAmount = await solanaService.getBalance(publicKey.toString());
      setBalance(balanceAmount);
      return balanceAmount;
    } catch (error) {
      console.error('Error fetching balance:', error);
      return 0;
    } finally {
      setLoading(false);
    }
  }, [publicKey]);

  const sendSOL = useCallback(async (toAddress: string, amount: number) => {
    if (!publicKey || !signTransaction) {
      throw new Error('Wallet not connected');
    }

    setLoading(true);
    try {
      const transaction = await solanaService.createTransferTransaction(
        publicKey.toString(),
        toAddress,
        amount
      );

      const signature = await sendTransaction(transaction, connection);
      await connection.confirmTransaction(signature, 'confirmed');
      
      return signature;
    } catch (error) {
      console.error('Error sending SOL:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [publicKey, sendTransaction, signTransaction, connection]);

  return {
    // Wallet state
    publicKey: publicKey?.toString() || null,
    connected,
    connecting,
    wallet: wallet?.adapter.name || null,
    
    // Balance
    balance,
    getBalance,
    
    // Actions
    disconnect,
    sendSOL,
    
    // Loading states
    loading,
  };
};
