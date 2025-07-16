import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Clock, 
  Shield,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Copy,
  AlertCircle
} from "lucide-react";
import { SwapQuote, Token } from '@/types';
import { formatNumber, formatUSDValue } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface EnhancedSwapQuoteProps {
  quote: SwapQuote | null;
  inputToken?: Token;
  outputToken?: Token;
  inputAmount?: string;
  isLoading?: boolean;
  mevProtection?: boolean;
  className?: string;
}

export const EnhancedSwapQuote = ({
  quote,
  inputToken,
  outputToken,
  inputAmount,
  isLoading,
  mevProtection = true,
  className
}: EnhancedSwapQuoteProps) => {
  const [showDetails, setShowDetails] = useState(false);

  if (isLoading) {
    return (
      <Card className={cn("w-full", className)}>
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="w-20 h-4 bg-muted animate-pulse rounded" />
            <div className="w-16 h-4 bg-muted animate-pulse rounded" />
          </div>
          <div className="space-y-2">
            <div className="w-full h-3 bg-muted animate-pulse rounded" />
            <div className="w-3/4 h-3 bg-muted animate-pulse rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!quote || !inputToken || !outputToken) {
    return (
      <Card className={cn("w-full border-dashed", className)}>
        <CardContent className="p-4 text-center text-muted-foreground">
          <DollarSign className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Enter amount to see quote</p>
        </CardContent>
      </Card>
    );
  }

  const exchangeRate = parseFloat(quote.outputAmount) / parseFloat(inputAmount || "1");
  const priceImpactColor = quote.priceImpact > 3 ? "text-red-500" : quote.priceImpact > 1 ? "text-yellow-500" : "text-green-500";
  const savingsAmount = quote.fee ? `$${(parseFloat(quote.fee) * 0.1).toFixed(2)}` : null;

  return (
    <Card className={cn("w-full", className)}>
      <CardContent className="p-4 space-y-4">
        {/* Quick Quote Summary */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">You'll receive</p>
            <p className="text-lg font-semibold">
              {formatNumber(parseFloat(quote.outputAmount))} {outputToken.symbol}
            </p>
          </div>
          
          <div className="text-right space-y-1">
            <div className="flex items-center gap-1">
              <span className={cn("text-sm font-medium", priceImpactColor)}>
                {quote.priceImpact > 0 ? <TrendingDown className="w-3 h-3" /> : <TrendingUp className="w-3 h-3" />}
                {quote.priceImpact.toFixed(2)}%
              </span>
            </div>
            <p className="text-xs text-muted-foreground">Price Impact</p>
          </div>
        </div>

        {/* Exchange Rate */}
        <div className="flex items-center justify-between p-2 rounded-lg bg-secondary/30">
          <span className="text-sm text-muted-foreground">Rate</span>
          <span className="text-sm font-medium">
            1 {inputToken.symbol} = {formatNumber(exchangeRate)} {outputToken.symbol}
          </span>
        </div>

        {/* MEV Protection Badge */}
        {mevProtection && (
          <div className="flex items-center justify-center">
            <Badge variant="secondary" className="flex items-center gap-1 text-shield-cyan border-shield-cyan/30">
              <Shield className="w-3 h-3" />
              MEV Protected
            </Badge>
          </div>
        )}

        {/* Expandable Details */}
        <div className="space-y-3">
          <Button
            variant="ghost"
            onClick={() => setShowDetails(!showDetails)}
            className="w-full flex items-center justify-between p-2 h-auto"
          >
            <span className="text-sm font-medium">Quote Details</span>
            {showDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </Button>

          {showDetails && (
            <div className="space-y-3 pt-2 border-t">
              {/* Detailed Breakdown */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Minimum Received</span>
                    <span className="font-medium">
                      {formatNumber(parseFloat(quote.minOutputAmount))} {outputToken.symbol}
                    </span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Slippage</span>
                    <span className="font-medium">{quote.slippage}%</span>
                  </div>
                  
                  {quote.estimatedGas && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Gas Fee</span>
                      <span className="font-medium">{quote.estimatedGas}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Network Fee</span>
                    <span className="font-medium">{quote.fee}</span>
                  </div>
                  
                  {quote.validUntil && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Valid Until</span>
                      <span className="font-medium flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(quote.validUntil).toLocaleTimeString()}
                      </span>
                    </div>
                  )}
                  
                  {savingsAmount && (
                    <div className="flex justify-between">
                      <span className="text-green-600">Savings</span>
                      <span className="font-medium text-green-600">{savingsAmount}</span>
                    </div>
                  )}
                </div>
              </div>

              <Separator />

              {/* Route Information */}
              {quote.route && quote.route.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Route</h4>
                  <div className="flex items-center gap-2 flex-wrap">
                    {quote.route.map((protocol, index) => (
                      <div key={index} className="flex items-center gap-1">
                        <Badge variant="outline" className="text-xs">{protocol}</Badge>
                        {index < quote.route.length - 1 && (
                          <span className="text-muted-foreground">→</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Warnings */}
              {quote.priceImpact > 3 && (
                <div className="flex items-start gap-2 p-3 rounded-lg bg-red-500/5 border border-red-500/20">
                  <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-red-600">High Price Impact</p>
                    <p className="text-xs text-muted-foreground">
                      This trade will significantly move the market price. Consider smaller amounts.
                    </p>
                  </div>
                </div>
              )}

              {/* Quote Actions */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigator.clipboard.writeText(quote.quoteId || '')}
                  className="flex-1"
                >
                  <Copy className="w-3 h-3" />
                  Copy Quote ID
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(`https://explorer.example.com/quote/${quote.quoteId}`, '_blank')}
                  className="flex-1"
                >
                  <ExternalLink className="w-3 h-3" />
                  View Details
                </Button>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};