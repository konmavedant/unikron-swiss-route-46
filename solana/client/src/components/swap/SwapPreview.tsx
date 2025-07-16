import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Shield, Clock, ArrowRight, AlertTriangle, Zap } from "lucide-react";
import { SwapQuote, Token, SwapConfig } from "@/types";
import { formatNumber } from "@/lib/utils";

interface SwapPreviewProps {
  quote: SwapQuote;
  inputToken: Token;
  outputToken: Token;
  inputAmount: string;
  config: SwapConfig;
  onConfirm: () => void;
  onCancel: () => void;
  isCommitting?: boolean;
  mevProtection?: boolean;
}

export const SwapPreview = ({
  quote,
  inputToken,
  outputToken,
  inputAmount,
  config,
  onConfirm,
  onCancel,
  isCommitting = false,
  mevProtection = true
}: SwapPreviewProps) => {
  const exchangeRate = parseFloat(quote.outputAmount) / parseFloat(inputAmount);
  const priceImpactColor: "default" | "destructive" | "secondary" | "outline" = 
    quote.priceImpact > 3 ? "destructive" : quote.priceImpact > 1 ? "secondary" : "default";

  return (
    <Card className="w-full max-w-md mx-auto shadow-card">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl">Swap Preview</CardTitle>
          {mevProtection && (
            <Badge variant="secondary" className="flex items-center gap-1">
              <Shield className="w-3 h-3" />
              Protected
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Swap Summary */}
        <div className="p-4 rounded-lg bg-secondary/50 border border-border/50">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <img 
                src={inputToken.logoURI} 
                alt={inputToken.symbol}
                className="w-6 h-6 rounded-full"
              />
              <span className="font-medium">{formatNumber(parseFloat(inputAmount))} {inputToken.symbol}</span>
            </div>
            <ArrowRight className="w-4 h-4 text-muted-foreground" />
            <div className="flex items-center gap-2">
              <img 
                src={outputToken.logoURI} 
                alt={outputToken.symbol}
                className="w-6 h-6 rounded-full"
              />
              <span className="font-medium">{formatNumber(parseFloat(quote.outputAmount))} {outputToken.symbol}</span>
            </div>
          </div>
          
          <div className="text-sm text-muted-foreground text-center">
            1 {inputToken.symbol} = {formatNumber(exchangeRate)} {outputToken.symbol}
          </div>
        </div>

        <Separator />

        {/* Transaction Details */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Price Impact</span>
            <Badge variant={priceImpactColor} className="text-xs">
              {quote.priceImpact.toFixed(2)}%
            </Badge>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Slippage Tolerance</span>
            <span className="text-sm font-medium">{config.slippage}%</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Minimum Received</span>
            <span className="text-sm font-medium">
              {formatNumber(parseFloat(quote.minOutputAmount))} {outputToken.symbol}
            </span>
          </div>

          {quote.fee && (
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Network Fee</span>
              <span className="text-sm font-medium">{quote.fee}</span>
            </div>
          )}

          {quote.estimatedGas && (
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Gas Estimate</span>
              <span className="text-sm font-medium">{quote.estimatedGas}</span>
            </div>
          )}
        </div>

        <Separator />

        {/* Route Information */}
        {quote.route && quote.route.length > 0 && (
          <div className="space-y-2">
            <span className="text-sm text-muted-foreground">Route</span>
            <div className="flex items-center gap-2 flex-wrap">
              {quote.route.map((protocol, index) => (
                <div key={index} className="flex items-center gap-1">
                  <Badge variant="outline" className="text-xs">{protocol}</Badge>
                  {index < quote.route.length - 1 && (
                    <ArrowRight className="w-3 h-3 text-muted-foreground" />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* MEV Protection Info */}
        {mevProtection && (
          <div className="p-3 rounded-lg bg-shield-cyan/5 border border-shield-cyan/20">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="w-4 h-4 text-shield-cyan" />
              <span className="text-sm font-medium text-shield-cyan">MEV Protection Active</span>
            </div>
            <div className="space-y-1 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>2-phase commit process (commit + reveal)</span>
              </div>
              <div className="flex items-center gap-1">
                <Shield className="w-3 h-3" />
                <span>Protection against front-running & sandwich attacks</span>
              </div>
            </div>
          </div>
        )}

        {/* Warnings */}
        {quote.priceImpact > 3 && (
          <div className="p-3 rounded-lg bg-destructive/5 border border-destructive/20">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className="w-4 h-4 text-destructive" />
              <span className="text-sm font-medium text-destructive">High Price Impact</span>
            </div>
            <p className="text-xs text-muted-foreground">
              This swap will move the market price significantly. Consider swapping smaller amounts.
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 pt-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={onCancel}
            disabled={isCommitting}
          >
            Cancel
          </Button>
          <Button
            variant={mevProtection ? "shield" : "cosmic"}
            className="flex-1"
            onClick={onConfirm}
            disabled={isCommitting}
          >
            {isCommitting ? (
              <>
                <Clock className="w-4 h-4 animate-spin" />
                {mevProtection ? "Committing..." : "Swapping..."}
              </>
            ) : mevProtection ? (
              <>
                <Shield className="w-4 h-4" />
                Commit Swap
              </>
            ) : (
              <>
                <Zap className="w-4 h-4" />
                Confirm Swap
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};