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
    disconnect: solanaDisconnect,
    connecting: solanaConnecting,
    disconnecting: solanaDisconnecting
  } = useWallet();
  
  const { 
    connect: storeConnect, 
    disconnect: storeDisconnect,
    setWallet,
    setConnecting
  } = useWalletStore();

  // Sync EVM wallet state
  useEffect(() => {
    if (evmConnected && evmAddress) {
      storeConnect(evmAddress, 'evm', chainId);
      setWallet({
        walletType: 'rainbow',
        balance: undefined, // Will be fetched by useTokenBalance
        ensName: undefined, // TODO: Fetch ENS
      });
    }
  }, [evmConnected, evmAddress, chainId, storeConnect, setWallet]);

  // Sync Solana wallet state
  useEffect(() => {
    if (solanaConnected && solanaAddress) {
      const address = solanaAddress.toString();
      storeConnect(address, 'solana');
      setWallet({
        walletType: 'phantom',
        balance: undefined, // Will be fetched by useTokenBalance
      });
    }
  }, [solanaConnected, solanaAddress, storeConnect, setWallet]);

  // Handle disconnection
  useEffect(() => {
    if (!evmConnected && !solanaConnected) {
      storeDisconnect();
    }
  }, [evmConnected, solanaConnected, storeDisconnect]);

  // Handle connection loading states
  useEffect(() => {
    setConnecting(solanaConnecting);
  }, [solanaConnecting, setConnecting]);

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
    isConnecting: solanaConnecting,
    isDisconnecting: solanaDisconnecting,
    disconnectAll,
  };
};