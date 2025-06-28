
import { useState, useEffect } from "react";
import { ChevronDown, Search, TrendingUp, TrendingDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAssetSearch } from "@/hooks/useAssetSearch";
import { usePrices } from "@/hooks/usePrices";

interface Token {
  symbol: string;
  name: string;
  chain: string;
  icon: string;
  id?: string;
}

interface TokenSelectorProps {
  label: string;
  token: { symbol: string; chain: string; balance: string; id?: string };
  onTokenChange: (token: { symbol: string; chain: string; balance: string; id?: string }) => void;
  showBalance: boolean;
}

const TokenSelector = ({ label, token, onTokenChange, showBalance }: TokenSelectorProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const { results, loading: searchLoading, searchAssets, clearResults } = useAssetSearch();
  const { getPriceData, loading: priceLoading } = usePrices([token.symbol]);

  const defaultTokens: Token[] = [
    { symbol: "ETH", name: "Ethereum", chain: "Ethereum", icon: "🔷", id: "ethereum" },
    { symbol: "BTC", name: "Bitcoin", chain: "Bitcoin", icon: "₿", id: "bitcoin" },
    { symbol: "USDC", name: "USD Coin", chain: "Ethereum", icon: "💵", id: "usd-coin" },
    { symbol: "USDC", name: "USD Coin", chain: "Polygon", icon: "💵", id: "usd-coin" },
    { symbol: "SOL", name: "Solana", chain: "Solana", icon: "🌞", id: "solana" },
    { symbol: "USDC", name: "USD Coin", chain: "Solana", icon: "💵", id: "usd-coin" },
  ];

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.length > 1) {
      await searchAssets(query);
    } else {
      clearResults();
    }
  };

  const handleTokenSelect = (selectedToken: Token | { id: string; symbol: string; name: string }) => {
    const tokenData = {
      symbol: selectedToken.symbol,
      chain: 'chain' in selectedToken ? selectedToken.chain : "Ethereum",
      balance: showBalance ? "0" : "0",
      id: selectedToken.id
    };
    
    onTokenChange(tokenData);
    setIsOpen(false);
    setSearchQuery("");
    clearResults();
  };

  const priceData = getPriceData(token.symbol);
  const displayTokens = searchQuery.length > 1 ? results : defaultTokens;

  return (
    <Card className="border border-gray-200">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-600">{label}</span>
          {showBalance && (
            <span className="text-sm text-gray-500">Balance: {token.balance}</span>
          )}
        </div>
        
        <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="w-full justify-between p-0 h-auto hover:bg-transparent"
            >
              <div className="flex items-center space-x-3">
                <div className="text-2xl">
                  {defaultTokens.find(t => t.symbol === token.symbol && t.chain === token.chain)?.icon || "🪙"}
                </div>
                <div className="text-left">
                  <div className="font-semibold text-lg text-gray-900">{token.symbol}</div>
                  <div className="text-sm text-gray-500 flex items-center space-x-2">
                    <span>{token.chain}</span>
                    {priceData && !priceLoading && (
                      <>
                        <span>•</span>
                        <span className="font-medium">${priceData.price.toFixed(4)}</span>
                        <span className={`flex items-center text-xs ${
                          priceData.change24h >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {priceData.change24h >= 0 ? (
                            <TrendingUp className="h-3 w-3 mr-1" />
                          ) : (
                            <TrendingDown className="h-3 w-3 mr-1" />
                          )}
                          {Math.abs(priceData.change24h).toFixed(2)}%
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <ChevronDown className="h-4 w-4 text-gray-400" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-80 bg-white border border-gray-200 shadow-lg">
            <div className="p-3 border-b">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search cryptocurrencies..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="max-h-60 overflow-y-auto">
              {searchLoading && (
                <div className="p-3 text-center text-gray-500">Searching...</div>
              )}
              {displayTokens.map((t, index) => (
                <DropdownMenuItem
                  key={`${t.symbol}-${('chain' in t ? t.chain : 'default')}-${index}`}
                  onClick={() => handleTokenSelect(t)}
                  className="p-3 cursor-pointer hover:bg-gray-50"
                >
                  <div className="flex items-center space-x-3 w-full">
                    <div className="text-xl">
                      {'icon' in t ? t.icon : "🪙"}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{t.symbol}</div>
                      <div className="text-sm text-gray-500">
                        {t.name} {('chain' in t) && `• ${t.chain}`}
                      </div>
                    </div>
                  </div>
                </DropdownMenuItem>
              ))}
              {!searchLoading && displayTokens.length === 0 && searchQuery.length > 1 && (
                <div className="p-3 text-center text-gray-500">No results found</div>
              )}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardContent>
    </Card>
  );
};

export default TokenSelector;
