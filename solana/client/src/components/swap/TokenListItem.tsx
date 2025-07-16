import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Star, TrendingUp, TrendingDown, ExternalLink } from "lucide-react";
import { TokenWithMetadata, ChainType } from "@/types";
import { formatNumber } from "@/lib/utils";

interface TokenListItemProps {
  token: TokenWithMetadata;
  onSelect: (token: TokenWithMetadata) => void;
  chainType: ChainType;
  showBalance?: boolean;
  showPrice?: boolean;
  isPopular?: boolean;
  isRecent?: boolean;
}

export const TokenListItem = ({
  token,
  onSelect,
  chainType,
  showBalance = true,
  showPrice = true,
  isPopular = false,
  isRecent = false,
}: TokenListItemProps) => {
  const handleSelect = () => {
    onSelect(token);
  };

  const getExplorerUrl = () => {
    if (chainType === 'solana') {
      return `https://solscan.io/token/${token.address}`;
    }
    
    const baseUrls: Record<number, string> = {
      1: 'https://etherscan.io/token/',
      137: 'https://polygonscan.com/token/',
      42161: 'https://arbiscan.io/token/',
      10: 'https://optimistic.etherscan.io/token/',
      8453: 'https://basescan.org/token/',
    };
    
    const baseUrl = baseUrls[token.chainId || 1] || baseUrls[1];
    return `${baseUrl}${token.address}`;
  };

  return (
    <Button
      variant="ghost"
      className="w-full h-auto p-3 justify-between hover:bg-secondary/50 group"
      onClick={handleSelect}
    >
      <div className="flex items-center gap-3 flex-1">
        {/* Token Icon */}
        <div className="relative">
          <div 
            className="w-10 h-10 rounded-full bg-gradient-cosmic flex items-center justify-center overflow-hidden"
          >
            {token.logoURI ? (
              <img 
                src={token.logoURI} 
                alt={token.symbol} 
                className="w-full h-full object-cover"
                onError={(e) => {
                  // Fallback to gradient with symbol
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  target.nextElementSibling?.classList.remove('hidden');
                }}
              />
            ) : null}
            <span className={`text-sm font-bold ${token.logoURI ? 'hidden' : ''}`}>
              {token.symbol.charAt(0)}
            </span>
          </div>
          
          {/* Popular/Recent indicator */}
          {(isPopular || isRecent) && (
            <div className="absolute -top-1 -right-1">
              {isPopular && (
                <div className="w-4 h-4 bg-yellow-500 rounded-full flex items-center justify-center">
                  <Star className="w-2 h-2 text-white fill-current" />
                </div>
              )}
              {isRecent && !isPopular && (
                <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                  <div className="w-1.5 h-1.5 bg-white rounded-full" />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Token Info */}
        <div className="flex-1 text-left min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium truncate">{token.symbol}</span>
            {token.verified && (
              <Badge variant="outline" className="text-xs px-1 py-0 h-4">
                ✓
              </Badge>
            )}
            {token.tags?.includes('new') && (
              <Badge variant="secondary" className="text-xs px-1 py-0 h-4">
                NEW
              </Badge>
            )}
          </div>
          <div className="text-sm text-muted-foreground truncate">
            {token.name}
          </div>
          
          {/* Market info */}
          {showPrice && token.priceUSD && token.priceUSD > 0 && (
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs font-medium">
                ${formatNumber(token.priceUSD, 4)}
              </span>
              {token.priceChange24h !== undefined && (
                <div className={`flex items-center gap-1 text-xs ${
                  token.priceChange24h >= 0 ? 'text-green-500' : 'text-red-500'
                }`}>
                  {token.priceChange24h >= 0 ? (
                    <TrendingUp className="w-3 h-3" />
                  ) : (
                    <TrendingDown className="w-3 h-3" />
                  )}
                  {Math.abs(token.priceChange24h).toFixed(2)}%
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Balance and Chain Info */}
      <div className="text-right space-y-1">
        {showBalance && token.balance && (
          <div className="text-sm font-medium">
            {formatNumber(parseFloat(token.balance), 4)}
          </div>
        )}
        
        <div className="flex items-center gap-1">
          <Badge variant="outline" className="text-xs">
            {token.chainId ? getChainName(token.chainId) : 'Solana'}
          </Badge>
          
          {/* Explorer link */}
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => {
              e.stopPropagation();
              window.open(getExplorerUrl(), '_blank');
            }}
          >
            <ExternalLink className="w-3 h-3" />
          </Button>
        </div>
        
        {token.volume24h && token.volume24h > 0 && (
          <div className="text-xs text-muted-foreground">
            Vol: ${formatNumber(token.volume24h)}
          </div>
        )}
      </div>
    </Button>
  );
};

// Loading skeleton for token list items
export const TokenListItemSkeleton = () => (
  <div className="w-full h-16 p-3 flex items-center gap-3">
    <Skeleton className="w-10 h-10 rounded-full" />
    <div className="flex-1 space-y-2">
      <Skeleton className="h-4 w-20" />
      <Skeleton className="h-3 w-32" />
    </div>
    <div className="text-right space-y-2">
      <Skeleton className="h-4 w-16" />
      <Skeleton className="h-3 w-12" />
    </div>
  </div>
);

function getChainName(chainId: number): string {
  const chainNames: Record<number, string> = {
    1: 'Ethereum',
    137: 'Polygon',
    42161: 'Arbitrum',
    10: 'Optimism',
    8453: 'Base',
  };
  
  return chainNames[chainId] || `Chain ${chainId}`;
}