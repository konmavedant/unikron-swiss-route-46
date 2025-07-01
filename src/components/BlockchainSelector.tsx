
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export type BlockchainType = 'ethereum' | 'solana';

interface BlockchainSelectorProps {
  selected: BlockchainType;
  onSelect: (blockchain: BlockchainType) => void;
  className?: string;
}

const BlockchainSelector = ({ selected, onSelect, className = '' }: BlockchainSelectorProps) => {
  const blockchains = [
    {
      id: 'ethereum' as BlockchainType,
      name: 'Ethereum',
      icon: '🔷',
      color: 'bg-blue-100 text-blue-800',
      description: 'EVM Compatible',
      features: ['Smart Contracts', 'DeFi Hub', 'High Liquidity']
    },
    {
      id: 'solana' as BlockchainType,
      name: 'Solana',
      icon: '🌞',
      color: 'bg-purple-100 text-purple-800',
      description: 'High Performance',
      features: ['Fast & Cheap', 'Growing Ecosystem', 'Jupiter DEX']
    }
  ];

  return (
    <Card className={`border border-gray-200 ${className}`}>
      <CardContent className="p-4">
        <h3 className="font-medium text-gray-900 mb-3">Select Blockchain</h3>
        <div className="grid grid-cols-2 gap-3">
          {blockchains.map((blockchain) => (
            <Button
              key={blockchain.id}
              variant={selected === blockchain.id ? "default" : "outline"}
              onClick={() => onSelect(blockchain.id)}
              className={`h-auto p-3 flex flex-col items-center space-y-2 ${
                selected === blockchain.id 
                  ? 'bg-unikron-blue hover:bg-unikron-darkblue text-white' 
                  : 'hover:bg-gray-50'
              }`}
            >
              <div className="text-2xl">{blockchain.icon}</div>
              <div className="text-center">
                <div className="font-medium">{blockchain.name}</div>
                <div className="text-xs opacity-75">{blockchain.description}</div>
              </div>
              {selected === blockchain.id && (
                <Badge variant="secondary" className="bg-white/20 text-white text-xs">
                  Active
                </Badge>
              )}
            </Button>
          ))}
        </div>
        
        {selected && (
          <div className="mt-3 p-3 bg-gray-50 rounded-lg">
            <div className="text-sm font-medium text-gray-900 mb-2">
              {blockchains.find(b => b.id === selected)?.name} Features:
            </div>
            <div className="flex flex-wrap gap-1">
              {blockchains.find(b => b.id === selected)?.features.map((feature, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {feature}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default BlockchainSelector;
