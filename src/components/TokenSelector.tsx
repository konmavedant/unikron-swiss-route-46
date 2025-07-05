
import { useState, useEffect } from "react";
import { ChevronDown, Search, TrendingUp, TrendingDown, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useMultiChainTokens } from "@/hooks/useMultiChainTokens";
import { usePrices } from "@/hooks/usePrices";
import { useBlockchain } from "@/contexts/BlockchainContext";

interface Token {
  symbol: string;
  name: string;
  chain: string;
  icon: string;
  id?: string;
  address?: string;
  decimals?: number;
}

interface TokenSelectorProps {
  label: string;
  token: { symbol: string; chain: string; balance: string; id?: string; address?: string; decimals?: number };
  onTokenChange: (token: { symbol: string; chain: string; balance: string; id?: string; address?: string; decimals?: number }) => void;
  showBalance: boolean;
}

const TokenSelector = ({ label, token, onTokenChange, showBalance }: TokenSelectorProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [searchResults, setSearchResults] = useState<Token[]>([]);
  
  const { tokens, loading: tokensLoading, searchTokens } = useMultiChainTokens();
  const { selectedBlockchain, isEthereum, isSolana } = useBlockchain();
  const { getPriceData, loading: priceLoading, isDataStale, refreshPrices } = usePrices([token.symbol]);

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.length > 1) {
      const results = await searchTokens(query);
      setSearchResults(results);
    } else {
      setSearchResults([]);
    }
  };

  const handleTokenSelect = (selectedToken: Token) => {
    const tokenData = {
      symbol: selectedToken.symbol,
      chain: selectedToken.chain,
      balance: showBalance ? "0" : "0",
      id: selectedToken.id,
      address: selectedToken.address,
      decimals: selectedToken.decimals
    };
    
    onTokenChange(tokenData);
    setIsOpen(false);
    setSearchQuery("");
    setSearchResults([]);
  };

  const priceData = getPriceData(token.symbol);
  const displayTokens = searchQuery.length > 1 ? searchResults : tokens;
  const isStale = isDataStale(token.symbol);

  // Get the icon for the current blockchain
  const getBlockchainIcon = () => {
    if (isSolana) return "🌞";
    return "🔷";
  };

  const handleRefreshPrice = (e: React.MouseEvent) => {
    e.stopPropagation();
    refreshPrices();
  };

  return (
    <Card className="border border-gray-200">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-600 flex items-center space-x-2">
            <span>{label}</span>
            <span className="text-xs bg-gray-100 px-2 py-1 rounded">
              {getBlockchainIcon()} {selectedBlockchain.toUpperCase()}
            </span>
          </span>
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
                  {tokens.find(t => t.symbol === token.symbol && t.chain === token.chain)?.icon || "🪙"}
                </div>
                <div className="text-left">
                  <div className="font-semibold text-lg text-gray-900">{token.symbol}</div>
                  <div className="text-sm text-gray-500 flex items-center space-x-2">
                    <span>{token.chain}</span>
                    {priceData && (
                      <>
                        <span>•</span>
                        <span className={`font-medium ${isStale ? 'text-gray-400' : ''}`}>
                          ${priceData.price.toFixed(4)}
                        </span>
                        <span className={`flex items-center text-xs ${
                          priceData.change24h >= 0 ? 'text-green-600' : 'text-red-600'
                        } ${isStale ? 'text-gray-400' : ''}`}>
                          {priceData.change24h >= 0 ? (
                            <TrendingUp className="h-3 w-3 mr-1" />
                          ) : (
                            <TrendingDown className="h-3 w-3 mr-1" />
                          )}
                          {Math.abs(priceData.change24h).toFixed(2)}%
                        </span>
                        {(isStale || priceLoading) && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleRefreshPrice}
                            className="p-1 h-auto"
                            disabled={priceLoading}
                          >
                            <RefreshCw className={`h-3 w-3 ${priceLoading ? 'animate-spin' : ''}`} />
                          </Button>
                        )}
                      </>
                    )}
                    {priceLoading && !priceData && (
                      <span className="text-xs text-gray-400">Loading...</span>
                    )}
                  </div>
                </div>
              </div>
              <ChevronDown className="h-4 w-4 text-gray-400" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-80 bg-white border border-gray-200 shadow-lg z-50">
            <div className="p-3 border-b">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder={`Search ${selectedBlockchain} tokens...`}
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="max-h-60 overflow-y-auto">
              {tokensLoading && (
                <div className="p-3 text-center text-gray-500">Loading tokens...</div>
              )}
              {displayTokens.map((t, index) => (
                <DropdownMenuItem
                  key={`${t.symbol}-${t.chain}-${index}`}
                  onClick={() => handleTokenSelect(t)}
                  className="p-3 cursor-pointer hover:bg-gray-50"
                >
                  <div className="flex items-center space-x-3 w-full">
                    <div className="text-xl">{t.icon}</div>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{t.symbol}</div>
                      <div className="text-sm text-gray-500">
                        {t.name} • {t.chain}
                      </div>
                    </div>
                  </div>
                </DropdownMenuItem>
              ))}
              {!tokensLoading && displayTokens.length === 0 && searchQuery.length > 1 && (
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
