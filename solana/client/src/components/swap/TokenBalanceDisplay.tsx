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

  // Format balance with appropriate decimal places
  // Replace the formatBalance function with this improved version:
  const formatBalance = (bal: string) => {
    const num = parseFloat(bal);
    if (num === 0 || isNaN(num)) return '0';

    // Don't show if balance is effectively zero
    if (num < 0.000001) return '0';

    // For very small amounts but not zero
    if (num < 0.0001) return '< 0.0001';

    // For small amounts, show more decimals
    if (num < 0.01) {
      return num.toFixed(6).replace(/\.?0+$/, ''); // Remove trailing zeros
    }

    // For larger amounts, show fewer decimals
    return num.toLocaleString(undefined, {
      maximumFractionDigits: 4,
      minimumFractionDigits: 0,
    });
  };

  // Format USD value
  const formatUsdValue = (value: number) => {
    if (value === 0) return '$0.00';
    if (value < 0.01) return '< $0.01';

    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(2)}M`;
    }

    if (value >= 1000) {
      return `$${(value / 1000).toFixed(2)}K`;
    }

    return value.toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 2,
    });
  };

  const formattedBalance = formatBalance(balance);
  const balanceNum = parseFloat(balance);

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="flex items-center gap-1">
        <Wallet className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm font-medium">{formattedBalance}</span>
        <span className="text-sm text-muted-foreground">{token.symbol}</span>
      </div>
      {showUsdValue && usdValue !== undefined && usdValue > 0 && (
        <Badge variant="outline" className="text-xs">
          {formatUsdValue(usdValue)}
        </Badge>
      )}
    </div>
  );
};