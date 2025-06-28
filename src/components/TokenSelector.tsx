
import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Token {
  symbol: string;
  name: string;
  chain: string;
  icon: string;
}

interface TokenSelectorProps {
  label: string;
  token: { symbol: string; chain: string; balance: string };
  onTokenChange: (token: { symbol: string; chain: string; balance: string }) => void;
  showBalance: boolean;
}

const TokenSelector = ({ label, token, onTokenChange, showBalance }: TokenSelectorProps) => {
  const tokens: Token[] = [
    { symbol: "ETH", name: "Ethereum", chain: "Ethereum", icon: "🔷" },
    { symbol: "USDC", name: "USD Coin", chain: "Ethereum", icon: "💵" },
    { symbol: "USDC", name: "USD Coin", chain: "Polygon", icon: "💵" },
    { symbol: "SOL", name: "Solana", chain: "Solana", icon: "🌞" },
    { symbol: "USDC", name: "USD Coin", chain: "Solana", icon: "💵" },
  ];

  const handleTokenSelect = (selectedToken: Token) => {
    onTokenChange({
      symbol: selectedToken.symbol,
      chain: selectedToken.chain,
      balance: showBalance ? "0" : "0"
    });
  };

  return (
    <Card className="border border-gray-200">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-600">{label}</span>
          {showBalance && (
            <span className="text-sm text-gray-500">Balance: {token.balance}</span>
          )}
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="w-full justify-between p-0 h-auto hover:bg-transparent"
            >
              <div className="flex items-center space-x-3">
                <div className="text-2xl">
                  {tokens.find(t => t.symbol === token.symbol && t.chain === token.chain)?.icon || "🪙"}
                </div>
                <div className="text-left">
                  <div className="font-semibold text-lg text-gray-900">{token.symbol}</div>
                  <div className="text-sm text-gray-500">{token.chain}</div>
                </div>
              </div>
              <ChevronDown className="h-4 w-4 text-gray-400" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-80 bg-white border border-gray-200 shadow-lg">
            {tokens.map((t, index) => (
              <DropdownMenuItem
                key={`${t.symbol}-${t.chain}-${index}`}
                onClick={() => handleTokenSelect(t)}
                className="p-3 cursor-pointer hover:bg-gray-50"
              >
                <div className="flex items-center space-x-3 w-full">
                  <div className="text-xl">{t.icon}</div>
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{t.symbol}</div>
                    <div className="text-sm text-gray-500">{t.name} • {t.chain}</div>
                  </div>
                </div>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </CardContent>
    </Card>
  );
};

export default TokenSelector;
