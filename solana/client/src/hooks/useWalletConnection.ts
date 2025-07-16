import { useAccount, useDisconnect } from 'wagmi';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletStore } from '@/store/wallet';
import { useEffect } from 'react';

export const useWalletConnection = () => {
  const { address: evmAddress, isConnected: evmConnected, chainId } = useAccount();
  const { disconnect: evmDisconnect } = useDisconnect();
  
  const { 
    publicKey: solanaAddress, 
    connected: solanaConnected, 
    disconnect: solanaDisconnect 
  } = useWallet();
  
  const { 
    connect: storeConnect, 
    disconnect: storeDisconnect,
    setWallet 
  } = useWalletStore();

  // Sync EVM wallet state
  useEffect(() => {
    if (evmConnected && evmAddress) {
      storeConnect(evmAddress, 'evm', chainId);
      setWallet({
        walletType: 'rainbow',
        balance: undefined, // TODO: Fetch balance
        ensName: undefined, // TODO: Fetch ENS
      });
    } else if (!evmConnected) {
      // Only disconnect store if no Solana connection either
      if (!solanaConnected) {
        storeDisconnect();
      }
    }
  }, [evmConnected, evmAddress, chainId, solanaConnected]);

  // Sync Solana wallet state
  useEffect(() => {
    if (solanaConnected && solanaAddress) {
      const address = solanaAddress.toString();
      storeConnect(address, 'solana');
      setWallet({
        walletType: 'phantom',
        balance: undefined, // TODO: Fetch balance
      });
    } else if (!solanaConnected) {
      // Only disconnect store if no EVM connection either
      if (!evmConnected) {
        storeDisconnect();
      }
    }
  }, [solanaConnected, solanaAddress, evmConnected]);

  const disconnectAll = async () => {
    try {
      if (evmConnected) {
        evmDisconnect();
      }
      if (solanaConnected) {
        await solanaDisconnect();
      }
      storeDisconnect();
    } catch (error) {
      console.error('Error disconnecting wallets:', error);
    }
  };

  const isAnyWalletConnected = evmConnected || solanaConnected;

  return {
    evmConnected,
    evmAddress,
    chainId,
    solanaConnected,
    solanaAddress: solanaAddress?.toString(),
    isAnyWalletConnected,
    disconnectAll,
  };
};