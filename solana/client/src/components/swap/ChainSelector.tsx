import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { Link, Zap } from "lucide-react";
import { ChainType } from "@/types/chains";

interface ChainSelectorProps {
  selectedChain: ChainType;
  onChainSelect: (chain: ChainType) => void;
}

export const ChainSelector = ({ selectedChain, onChainSelect }: ChainSelectorProps) => {
  const chains = [
    {
      id: 'evm' as ChainType,
      name: 'Ethereum',
      description: 'EVM Compatible',
      icon: Link,
      isActive: true
    },
    {
      id: 'solana' as ChainType,
      name: 'Solana',
      description: 'High Performance',
      icon: Zap,
      isActive: true
    }
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Select Chain</h2>
        <Badge variant="secondary">{selectedChain.toUpperCase()}</Badge>
      </div>
      
      <div className="grid grid-cols-2 gap-3">
        {chains.map((chain) => (
          <Button
            key={chain.id}
            variant={selectedChain === chain.id ? "default" : "outline"}
            className="p-4 h-auto flex flex-col gap-2 relative"
            onClick={() => onChainSelect(chain.id)}
            disabled={!chain.isActive}
          >
            <chain.icon className="h-6 w-6" />
            <div className="flex flex-col gap-1">
              <span className="font-medium">{chain.name}</span>
              <span className="text-xs text-muted-foreground">{chain.description}</span>
            </div>
            {selectedChain === chain.id && (
              <Badge className="absolute -top-2 -right-2">
                Active
              </Badge>
            )}
          </Button>
        ))}
      </div>
    </div>
  );
};