import { Token, ChainType } from '@/types';
import { useTokenBalance } from '@/hooks/useTokenBalance';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Wallet } from 'lucide-react';

interface TokenBalanceDisplayProps {
  token: Token | null;
  chainType: ChainType;
  isConnected: boolean;
  showUsdValue?: boolean;
  className?: string;
}

export const TokenBalanceDisplay = ({ 
  token, 
  chainType, 
  isConnected, 
  showUsdValue = true,
  className = "" 
}: TokenBalanceDisplayProps) => {
  const { balance, usdValue, isLoading, error } = useTokenBalance({
    token,
    chainType,
    enabled: isConnected && !!token,
  });

  if (!isConnected) {
    return (
      <div className={`flex items-center gap-2 text-muted-foreground ${className}`}>
        <Wallet className="w-4 h-4" />
        <span className="text-sm">Connect wallet</span>
      </div>
    );
  }

  if (!token) {
    return (
      <div className={`flex items-center gap-2 text-muted-foreground ${className}`}>
        <Wallet className="w-4 h-4" />
        <span className="text-sm">Select token</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex items-center gap-2 text-destructive ${className}`}>
        <span className="text-sm">Error loading balance</span>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Skeleton className="h-4 w-16" />
        {showUsdValue && <Skeleton className="h-4 w-12" />}
      </div>
    );
  }

  const formattedBalance = parseFloat(balance).toLocaleString(undefined, {
    maximumFractionDigits: 6,
    minimumFractionDigits: 0,
  });

  const formattedUsdValue = usdValue?.toLocaleString(undefined, {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  });

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="flex items-center gap-1">
        <Wallet className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm font-medium">{formattedBalance}</span>
        <span className="text-sm text-muted-foreground">{token.symbol}</span>
      </div>
      {showUsdValue && usdValue && usdValue > 0 && (
        <Badge variant="outline" className="text-xs">
          {formattedUsdValue}
        </Badge>
      )}
    </div>
  );
};