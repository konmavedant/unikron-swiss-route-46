// src/components/swap/SwapQuoteDisplay.tsx (Fixed)
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, TrendingDown, ArrowRight, Clock, Zap } from "lucide-react";
import { SwapQuote } from "@/types";

interface SwapQuoteDisplayProps {
  quote: SwapQuote | null;
  isLoading: boolean;
  mevProtection: boolean;
}

export const SwapQuoteDisplay = ({ quote, isLoading, mevProtection }: SwapQuoteDisplayProps) => {
  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Quote Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-28" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!quote) {
    return null;
  }

  // Get display amounts from the quote
  const displayAmounts = (quote as any)._displayAmounts;
  
  // Calculate proper exchange rate using display amounts
  let exchangeRate = 0;
  let inputAmountDisplay = '0';
  let outputAmountDisplay = '0';
  let minOutputAmountDisplay = '0';

  if (displayAmounts) {
    // Use the human-readable amounts from Jupiter conversion
    inputAmountDisplay = parseFloat(displayAmounts.inputAmountHuman).toFixed(6);
    outputAmountDisplay = parseFloat(displayAmounts.outputAmountHuman).toFixed(6);
    minOutputAmountDisplay = parseFloat(displayAmounts.minOutputAmountHuman).toFixed(6);
    exchangeRate = parseFloat(displayAmounts.exchangeRate);
  } else {
    // Fallback: convert from raw amounts
    const inputAmount = parseFloat(quote.inputAmount) / Math.pow(10, quote.inputToken.decimals);
    const outputAmount = parseFloat(quote.outputAmount) / Math.pow(10, quote.outputToken.decimals);
    const minOutputAmount = parseFloat(quote.minOutputAmount) / Math.pow(10, quote.outputToken.decimals);
    
    inputAmountDisplay = inputAmount.toFixed(6);
    outputAmountDisplay = outputAmount.toFixed(6);
    minOutputAmountDisplay = minOutputAmount.toFixed(6);
    exchangeRate = outputAmount / inputAmount;
  }

  const priceImpactColor = quote.priceImpact > 5 
    ? "text-destructive" 
    : quote.priceImpact > 1 
    ? "text-yellow-500" 
    : "text-green-500";

  // Format numbers for display
  const formatNumber = (num: number, decimals: number = 6) => {
    if (num === 0) return '0';
    if (num < 0.000001) return '< 0.000001';
    if (num >= 1000) return num.toLocaleString(undefined, { maximumFractionDigits: 2 });
    return num.toFixed(decimals).replace(/\.?0+$/, '');
  };

  const formatRate = (rate: number) => {
    if (rate === 0) return '0';
    if (rate < 0.000001) return '< 0.000001';
    if (rate >= 1000) return rate.toLocaleString(undefined, { maximumFractionDigits: 6 });
    return rate.toFixed(6).replace(/\.?0+$/, '');
  };

  console.log('Quote display data:', {
    quote,
    displayAmounts,
    exchangeRate,
    inputAmountDisplay,
    outputAmountDisplay,
    minOutputAmountDisplay
  });

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm">Quote Details</CardTitle>
          {mevProtection && (
            <Badge variant="outline" className="text-shield-cyan border-shield-cyan/50">
              Protected
            </Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Exchange Rate */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Rate</span>
          <div className="flex items-center gap-1 text-sm font-medium">
            <span>1 {quote.inputToken.symbol}</span>
            <ArrowRight className="w-3 h-3" />
            <span>
              {formatRate(exchangeRate)} {quote.outputToken.symbol}
            </span>
          </div>
        </div>

        {/* Price Impact */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Price Impact</span>
          <div className="flex items-center gap-1">
            {quote.priceImpact > 0 ? (
              <TrendingDown className={`w-3 h-3 ${priceImpactColor}`} />
            ) : (
              <TrendingUp className="w-3 h-3 text-green-500" />
            )}
            <span className={`text-sm font-medium ${priceImpactColor}`}>
              {quote.priceImpact.toFixed(2)}%
            </span>
          </div>
        </div>

        {/* Route */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Route</span>
          <div className="flex items-center gap-1 text-sm">
            {quote.route.slice(0, 3).map((step, index) => (
              <div key={index} className="flex items-center gap-1">
                <span className="text-xs bg-secondary/50 px-1.5 py-0.5 rounded">
                  {step}
                </span>
                {index < Math.min(quote.route.length - 1, 2) && (
                  <ArrowRight className="w-2 h-2 text-muted-foreground" />
                )}
              </div>
            ))}
            {quote.route.length > 3 && (
              <span className="text-xs text-muted-foreground">
                +{quote.route.length - 3} more
              </span>
            )}
          </div>
        </div>

        {/* Protocol Fee */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Protocol Fee</span>
          <span className="text-sm font-medium">
            {formatNumber(parseFloat(quote.fee), 6)} {quote.inputToken.symbol}
          </span>
        </div>

        {/* Gas (EVM only) */}
        {quote.estimatedGas && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Est. Gas</span>
            <div className="flex items-center gap-1">
              <Zap className="w-3 h-3 text-yellow-500" />
              <span className="text-sm font-medium">{quote.estimatedGas} ETH</span>
            </div>
          </div>
        )}

        {/* Slippage */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Max Slippage</span>
          <span className="text-sm font-medium">{quote.slippage}%</span>
        </div>

        {/* Minimum Received */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Minimum Received</span>
          <span className="text-sm font-medium">
            {formatNumber(parseFloat(minOutputAmountDisplay), 6)} {quote.outputToken.symbol}
          </span>
        </div>

        {/* MEV Protection Info */}
        {mevProtection && (
          <div className="mt-4 p-3 rounded-lg bg-shield-cyan/5 border border-shield-cyan/20">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="w-3 h-3 text-shield-cyan" />
              <span className="text-xs font-medium text-shield-cyan">
                Protected Execution
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Your swap will use Jupiter's aggregation with MEV protection. 
              Execution typically takes 1-2 blocks.
            </p>
          </div>
        )}

        {/* Debug info (only in development) */}
        {import.meta.env.MODE === 'development' && (
          <details className="text-xs text-muted-foreground">
            <summary className="cursor-pointer">Debug Info</summary>
            <div className="mt-2 p-2 bg-secondary/20 rounded text-xs font-mono">
              <div>Input: {quote.inputAmount} (raw) → {inputAmountDisplay} (display)</div>
              <div>Output: {quote.outputAmount} (raw) → {outputAmountDisplay} (display)</div>
              <div>Rate: {formatRate(exchangeRate)}</div>
              <div>Impact: {quote.priceImpact}%</div>
            </div>
          </details>
        )}
      </CardContent>
    </Card>
  );
};