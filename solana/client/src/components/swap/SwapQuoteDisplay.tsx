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

  const priceImpactColor = quote.priceImpact > 5 
    ? "text-destructive" 
    : quote.priceImpact > 1 
    ? "text-yellow-500" 
    : "text-green-500";

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
              {(parseFloat(quote.outputAmount) / parseFloat(quote.inputAmount)).toFixed(6)} {quote.outputToken.symbol}
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
            {quote.route.map((step, index) => (
              <div key={index} className="flex items-center gap-1">
                <span className="text-xs bg-secondary/50 px-1.5 py-0.5 rounded">
                  {step}
                </span>
                {index < quote.route.length - 1 && (
                  <ArrowRight className="w-2 h-2 text-muted-foreground" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Fees */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Protocol Fee</span>
          <span className="text-sm font-medium">
            {quote.fee} {quote.inputToken.symbol}
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
            {quote.minOutputAmount} {quote.outputToken.symbol}
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
              Your swap will use commit-reveal protocol to prevent MEV attacks. 
              Execution may take 1-2 additional blocks.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};