import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Search, ChevronDown, Star, Clock, AlertCircle, Loader2, Wallet } from "lucide-react";
import { useState, useMemo, useCallback } from "react";
import { Token, TokenWithMetadata, ChainType } from "@/types";
import { useTokenData } from "@/hooks/useTokenData";
import { useTokenBalances } from "@/hooks/useTokenBalance";
import { TokenListItem, TokenListItemSkeleton } from "./TokenListItem";
import { useWalletConnection } from "@/hooks/useWalletConnection";

interface TokenSelectorProps {
  selectedToken?: Token;
  onTokenSelect: (token: Token) => void;
  chainType: ChainType;
  label?: string;
  disabled?: boolean;
  showBalance?: boolean;
  showPrice?: boolean;
  placeholder?: string;
}

export const TokenSelector = ({
  selectedToken,
  onTokenSelect,
  chainType,
  label = "Select Token",
  disabled = false,
  showBalance = true,
  showPrice = true,
  placeholder = "Search by name or symbol"
}: TokenSelectorProps) => {
  
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("popular");
  const [hideZeroBalances, setHideZeroBalances] = useState(true);

  // Get wallet connection status
  const { isAnyWalletConnected, evmConnected, solanaConnected } = useWalletConnection();

  // Check if connected to the correct chain
  const isConnectedToChain = useMemo(() => {
    if (chainType === 'evm') {
      return evmConnected;
    } else {
      return solanaConnected;
    }
  }, [chainType, evmConnected, solanaConnected]);

  // Fetch token data
  const {
    tokens,
    popularTokens,
    recentTokens,
    isLoading,
    error,
    addRecentToken,
  } = useTokenData(chainType);

  // Fetch user token balances (only for connected wallets)
  const { balances: userBalances, isLoading: isLoadingBalances } = useTokenBalances(
    tokens,
    chainType,
    hideZeroBalances && isConnectedToChain
  );

  // Create a map of token addresses to balances for quick lookup
  const balanceMap = useMemo(() => {
    const map = new Map<string, { balance: string; usdValue?: number }>();
    userBalances.forEach(balance => {
      map.set(balance.token.address, {
        balance: balance.balance,
        usdValue: balance.usdValue
      });
    });
    return map;
  }, [userBalances]);

  // Filter tokens based on search query and balance filter
  const filteredTokens = useMemo(() => {
    let tokensToFilter = tokens;

    // If connected and hideZeroBalances is enabled, show only tokens with balances
    if (isConnectedToChain && hideZeroBalances) {
      tokensToFilter = tokens.filter(token => {
        const balance = balanceMap.get(token.address);
        return balance && parseFloat(balance.balance) > 0;
      });
    }

    if (!searchQuery.trim()) {
      return tokensToFilter;
    }

    const query = searchQuery.toLowerCase().trim();
    return tokensToFilter.filter(token =>
      token.symbol.toLowerCase().includes(query) ||
      token.name.toLowerCase().includes(query) ||
      token.address.toLowerCase().includes(query)
    );
  }, [tokens, searchQuery, isConnectedToChain, hideZeroBalances, balanceMap]);

  // Group tokens by category
  const tokenGroups = useMemo(() => {
    if (searchQuery.trim()) {
      // When searching, show all filtered results
      return {
        filtered: filteredTokens,
        popular: [],
        recent: [],
        all: [],
      };
    }

    let popularList = popularTokens.slice(0, 8);
    let recentList = recentTokens;

    // Filter popular and recent tokens if hideZeroBalances is enabled and wallet is connected
    if (isConnectedToChain && hideZeroBalances) {
      popularList = popularList.filter(token => {
        const balance = balanceMap.get(token.address);
        return balance && parseFloat(balance.balance) > 0;
      });

      recentList = recentList.filter(token => {
        const balance = balanceMap.get(token.address);
        return balance && parseFloat(balance.balance) > 0;
      });
    }

    return {
      filtered: [],
      popular: popularList,
      recent: recentList,
      all: filteredTokens,
    };
  }, [filteredTokens, popularTokens, recentTokens, searchQuery, isConnectedToChain, hideZeroBalances, balanceMap]);

  const handleTokenSelect = useCallback((token: TokenWithMetadata) => {
    onTokenSelect(token);
    addRecentToken(token);
    setOpen(false);
    setSearchQuery("");
    setActiveTab("popular");
  }, [onTokenSelect, addRecentToken]);

  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
    if (value.trim()) {
      setActiveTab("search");
    } else {
      setActiveTab("popular");
    }
  }, []);

  return (
    <>
      <Button
        variant="outline"
        className="h-12 px-4 justify-between min-w-[120px]"
        onClick={() => setOpen(true)}
        disabled={disabled}
      >
        {selectedToken ? (
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-gradient-cosmic flex items-center justify-center overflow-hidden">
              {selectedToken.logoURI ? (
                <img
                  src={selectedToken.logoURI}
                  alt={selectedToken.symbol}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-xs font-bold">
                  {selectedToken.symbol.charAt(0)}
                </span>
              )}
            </div>
            <span className="font-medium">{selectedToken.symbol}</span>
          </div>
        ) : (
          <span className="text-muted-foreground">{label}</span>
        )}
        <ChevronDown className="w-4 h-4 ml-2" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md max-h-[75vh] p-0">
          <DialogHeader className="p-6 pb-4">
            <DialogTitle className="flex items-center gap-2">
              Select Token
              <Badge variant="outline" className="text-xs">
                {chainType === 'evm' ? 'EVM' : 'Solana'}
              </Badge>
              {/* Connection Status Badge */}
              {isConnectedToChain && (
                <Badge variant="outline" className="text-xs text-green-600 border-green-600">
                  Connected
                </Badge>
              )}
            </DialogTitle>
          </DialogHeader>

          <div className="px-6 pb-4 space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder={placeholder}
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-10"
                autoFocus
              />
            </div>

            {/* Balance Filter Toggle - Only show when wallet is connected */}
            {isConnectedToChain && (
              <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 border border-border/50">
                <div className="flex items-center gap-2">
                  <Wallet className="w-4 h-4 text-muted-foreground" />
                  <Label htmlFor="hide-zero-balances" className="text-sm font-medium">
                    Hide zero balances
                  </Label>
                </div>
                <Switch
                  id="hide-zero-balances"
                  checked={hideZeroBalances}
                  onCheckedChange={setHideZeroBalances}
                />
              </div>
            )}
          </div>

          {error ? (
            <div className="px-6 pb-6">
              <div className="flex items-center gap-2 p-4 rounded-lg bg-destructive/10 border border-destructive/20">
                <AlertCircle className="w-4 h-4 text-destructive" />
                <span className="text-sm text-destructive">
                  Failed to load tokens. Please try again.
                </span>
              </div>
            </div>
          ) : isLoading ? (
            <div className="px-6 pb-6">
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin" />
                <span className="ml-2 text-sm text-muted-foreground">
                  Loading tokens...
                </span>
              </div>
            </div>
          ) : (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
              {!searchQuery.trim() && (
                <TabsList className="mx-6 grid w-auto grid-cols-3">
                  <TabsTrigger value="popular" className="flex items-center gap-1">
                    <Star className="w-3 h-3" />
                    Popular
                  </TabsTrigger>
                  {tokenGroups.recent.length > 0 && (
                    <TabsTrigger value="recent" className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Recent
                    </TabsTrigger>
                  )}
                  <TabsTrigger value="all">
                    {isConnectedToChain && hideZeroBalances ? 'My Tokens' : 'All'}
                  </TabsTrigger>
                </TabsList>
              )}

              <div className="flex-1 min-h-0">
                {/* Search Results */}
                {searchQuery.trim() && (
                  <ScrollArea className="h-86 px-6 pb-6">
                    {tokenGroups.filtered.length > 0 ? (
                      <div className="space-y-1">
                        {tokenGroups.filtered.map((token) => (
                          <TokenListItem
                            key={token.address}
                            token={token}
                            onSelect={handleTokenSelect}
                            chainType={chainType}
                            showBalance={showBalance}
                            showPrice={showPrice}
                            isConnected={isConnectedToChain}
                            balance={balanceMap.get(token.address)?.balance}
                            usdValue={balanceMap.get(token.address)?.usdValue}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p>No tokens found for "{searchQuery}"</p>
                        <p className="text-sm mt-1">Try a different search term</p>
                      </div>
                    )}
                  </ScrollArea>
                )}

                {/* Popular Tokens */}
                {!searchQuery.trim() && (
                  <TabsContent value="popular" className="mt-0">
                    <ScrollArea className="h-86 px-6 pb-6">
                      {isLoadingBalances && isConnectedToChain ? (
                        <div className="space-y-1">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <TokenListItemSkeleton key={i} />
                          ))}
                        </div>
                      ) : tokenGroups.popular.length > 0 ? (
                        <div className="space-y-1">
                          {tokenGroups.popular.map((token) => (
                            <TokenListItem
                              key={token.address}
                              token={token}
                              onSelect={handleTokenSelect}
                              chainType={chainType}
                              showBalance={showBalance}
                              showPrice={showPrice}
                              isPopular
                              isConnected={isConnectedToChain}
                              balance={balanceMap.get(token.address)?.balance}
                              usdValue={balanceMap.get(token.address)?.usdValue}
                            />
                          ))}
                        </div>
                      ) : isConnectedToChain && hideZeroBalances ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <Wallet className="w-8 h-8 mx-auto mb-2 opacity-50" />
                          <p>No tokens with balance found</p>
                          <p className="text-sm mt-1">Try turning off "Hide zero balances"</p>
                        </div>
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          <Star className="w-8 h-8 mx-auto mb-2 opacity-50" />
                          <p>No popular tokens available</p>
                        </div>
                      )}
                    </ScrollArea>
                  </TabsContent>
                )}

                {/* Recent Tokens */}
                {!searchQuery.trim() && tokenGroups.recent.length > 0 && (
                  <TabsContent value="recent" className="mt-0">
                    <ScrollArea className="h-86 px-6 pb-6">
                      <div className="space-y-1">
                        {tokenGroups.recent.map((token) => (
                          <TokenListItem
                            key={token.address}
                            token={token}
                            onSelect={handleTokenSelect}
                            chainType={chainType}
                            showBalance={showBalance}
                            showPrice={showPrice}
                            isRecent
                            isConnected={isConnectedToChain}
                            balance={balanceMap.get(token.address)?.balance}
                            usdValue={balanceMap.get(token.address)?.usdValue}
                          />
                        ))}
                      </div>
                    </ScrollArea>
                  </TabsContent>
                )}

                {/* All Tokens */}
                {!searchQuery.trim() && (
                  <TabsContent value="all" className="mt-0">
                    <ScrollArea className="h-86 px-6 pb-6">
                      {isLoadingBalances && isConnectedToChain ? (
                        <div className="space-y-1">
                          {Array.from({ length: 8 }).map((_, i) => (
                            <TokenListItemSkeleton key={i} />
                          ))}
                        </div>
                      ) : tokenGroups.all.length > 0 ? (
                        <div className="space-y-1">
                          {tokenGroups.all.map((token) => (
                            <TokenListItem
                              key={token.address}
                              token={token}
                              onSelect={handleTokenSelect}
                              chainType={chainType}
                              showBalance={showBalance}
                              showPrice={showPrice}
                              isConnected={isConnectedToChain}
                              balance={balanceMap.get(token.address)?.balance}
                              usdValue={balanceMap.get(token.address)?.usdValue}
                            />
                          ))}
                        </div>
                      ) : isConnectedToChain && hideZeroBalances ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <Wallet className="w-8 h-8 mx-auto mb-2 opacity-50" />
                          <p>No tokens with balance found</p>
                          <p className="text-sm mt-1">Try turning off "Hide zero balances"</p>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          {Array.from({ length: 8 }).map((_, i) => (
                            <TokenListItemSkeleton key={i} />
                          ))}
                        </div>
                      )}
                    </ScrollArea>
                  </TabsContent>
                )}
              </div>
            </Tabs>
          )}

          {/* Footer info */}
          <div className="px-6 pb-4 pt-2 border-t">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                {isConnectedToChain
                  ? (hideZeroBalances
                    ? 'Showing tokens with balance only'
                    : 'Live balances and prices')
                  : 'Connect wallet to see balances'
                }
              </p>
              {isConnectedToChain && (
                <Badge variant="outline" className="text-xs text-green-600 border-green-600">
                  ✓ Connected
                </Badge>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};