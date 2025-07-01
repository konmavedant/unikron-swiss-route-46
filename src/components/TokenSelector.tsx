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
import type { BlockchainType } from "./BlockchainSelector";

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
  blockchain?: BlockchainType;
}

const TokenSelector = ({ label, token, onTokenChange, showBalance, blockchain = 'ethereum' }: TokenSelectorProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const { results, loading: searchLoading, searchAssets, clearResults } = useAssetSearch();
  const { getPriceData, loading: priceLoading } = usePrices([token.symbol]);

  const getSolanaTokens = (): Token[] => [
    { symbol: "SOL", name: "Solana", chain: "Solana", icon: "🌞", id: "solana" },
    { symbol: "USDC", name: "USD Coin", chain: "Solana", icon: "💵", id: "usd-coin" },
    { symbol: "USDT", name: "Tether", chain: "Solana", icon: "💚", id: "tether" },
    { symbol: "RAY", name: "Raydium", chain: "Solana", icon: "⚡", id: "raydium" },
    { symbol: "SRM", name: "Serum", chain: "Solana", icon: "🔥", id: "serum" },
    { symbol: "ORCA", name: "Orca", chain: "Solana", icon: "🐋", id: "orca" },
    { symbol: "STEP", name: "Step Finance", chain: "Solana", icon: "📈", id: "step-finance" },
    { symbol: "MNGO", name: "Mango", chain: "Solana", icon: "🥭", id: "mango-markets" },
  ];

  const getEthereumTokens = (): Token[] => [
    // Major cryptocurrencies
    { symbol: "BTC", name: "Bitcoin", chain: "Bitcoin", icon: "₿", id: "bitcoin" },
    { symbol: "ETH", name: "Ethereum", chain: "Ethereum", icon: "🔷", id: "ethereum" },
    { symbol: "BNB", name: "BNB", chain: "BSC", icon: "🟡", id: "binancecoin" },
    { symbol: "XRP", name: "XRP", chain: "XRP Ledger", icon: "💧", id: "ripple" },
    { symbol: "ADA", name: "Cardano", chain: "Cardano", icon: "🔵", id: "cardano" },
    { symbol: "DOT", name: "Polkadot", chain: "Polkadot", icon: "🔴", id: "polkadot" },
    { symbol: "DOGE", name: "Dogecoin", chain: "Dogecoin", icon: "🐕", id: "dogecoin" },
    { symbol: "AVAX", name: "Avalanche", chain: "Avalanche", icon: "🔺", id: "avalanche-2" },
    { symbol: "MATIC", name: "Polygon", chain: "Polygon", icon: "🟣", id: "matic-network" },
    { symbol: "SHIB", name: "Shiba Inu", chain: "Ethereum", icon: "🐕‍🦺", id: "shiba-inu" },
    { symbol: "LTC", name: "Litecoin", chain: "Litecoin", icon: "🥈", id: "litecoin" },
    { symbol: "UNI", name: "Uniswap", chain: "Ethereum", icon: "🦄", id: "uniswap" },
    { symbol: "LINK", name: "Chainlink", chain: "Ethereum", icon: "🔗", id: "chainlink" },
    { symbol: "ATOM", name: "Cosmos", chain: "Cosmos", icon: "⚛️", id: "cosmos" },
    
    // Stablecoins across different chains
    { symbol: "USDT", name: "Tether", chain: "Ethereum", icon: "💚", id: "tether" },
    { symbol: "USDT", name: "Tether", chain: "BSC", icon: "💚", id: "tether" },
    { symbol: "USDT", name: "Tether", chain: "Polygon", icon: "💚", id: "tether" },
    { symbol: "USDC", name: "USD Coin", chain: "Ethereum", icon: "💵", id: "usd-coin" },
    { symbol: "USDC", name: "USD Coin", chain: "BSC", icon: "💵", id: "usd-coin" },
    { symbol: "USDC", name: "USD Coin", chain: "Polygon", icon: "💵", id: "usd-coin" },
    { symbol: "USDC", name: "USD Coin", chain: "Avalanche", icon: "💵", id: "usd-coin" },
    { symbol: "BUSD", name: "Binance USD", chain: "BSC", icon: "💛", id: "binance-usd" },
    { symbol: "DAI", name: "Dai", chain: "Ethereum", icon: "💸", id: "dai" },
    
    // Layer 2 and other popular tokens
    { symbol: "WETH", name: "Wrapped Ethereum", chain: "Ethereum", icon: "🔷", id: "weth" },
    { symbol: "WBTC", name: "Wrapped Bitcoin", chain: "Ethereum", icon: "₿", id: "wrapped-bitcoin" },
    { symbol: "CRO", name: "Cronos", chain: "Cronos", icon: "🔵", id: "crypto-com-chain" },
    { symbol: "FTM", name: "Fantom", chain: "Fantom", icon: "👻", id: "fantom" },
    { symbol: "NEAR", name: "NEAR Protocol", chain: "NEAR", icon: "🌟", id: "near" },
    { symbol: "ICP", name: "Internet Computer", chain: "ICP", icon: "♾️", id: "internet-computer" },
    { symbol: "VET", name: "VeChain", chain: "VeChain", icon: "✅", id: "vechain" },
    { symbol: "ALGO", name: "Algorand", chain: "Algorand", icon: "◯", id: "algorand" },
    { symbol: "XLM", name: "Stellar", chain: "Stellar", icon: "🌟", id: "stellar" },
    { symbol: "HBAR", name: "Hedera", chain: "Hedera", icon: "♦️", id: "hedera-hashgraph" },
    { symbol: "FLOW", name: "Flow", chain: "Flow", icon: "🌊", id: "flow" },
    { symbol: "SAND", name: "The Sandbox", chain: "Ethereum", icon: "🏖️", id: "the-sandbox" },
    { symbol: "MANA", name: "Decentraland", chain: "Ethereum", icon: "🏢", id: "decentraland" },
    { symbol: "AXS", name: "Axie Infinity", chain: "Ethereum", icon: "🎮", id: "axie-infinity" },
    { symbol: "APE", name: "ApeCoin", chain: "Ethereum", icon: "🐒", id: "apecoin" },
  ];

  const defaultTokens = blockchain === 'solana' ? getSolanaTokens() : getEthereumTokens();

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
      chain: 'chain' in selectedToken ? selectedToken.chain : (blockchain === 'solana' ? "Solana" : "Ethereum"),
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
