
import React, { createContext, useContext, useState, ReactNode } from 'react';

export type BlockchainType = 'ethereum' | 'solana';

interface BlockchainContextType {
  selectedBlockchain: BlockchainType;
  setSelectedBlockchain: (blockchain: BlockchainType) => void;
  isEthereum: boolean;
  isSolana: boolean;
}

const BlockchainContext = createContext<BlockchainContextType | undefined>(undefined);

interface BlockchainProviderProps {
  children: ReactNode;
}

export const BlockchainProvider: React.FC<BlockchainProviderProps> = ({ children }) => {
  const [selectedBlockchain, setSelectedBlockchain] = useState<BlockchainType>('ethereum');

  const value = {
    selectedBlockchain,
    setSelectedBlockchain,
    isEthereum: selectedBlockchain === 'ethereum',
    isSolana: selectedBlockchain === 'solana',
  };

  return (
    <BlockchainContext.Provider value={value}>
      {children}
    </BlockchainContext.Provider>
  );
};

export const useBlockchain = () => {
  const context = useContext(BlockchainContext);
  if (context === undefined) {
    throw new Error('useBlockchain must be used within a BlockchainProvider');
  }
  return context;
};
