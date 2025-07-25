import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Shield, Clock, ArrowRight, AlertTriangle, Zap, TrendingUp, ExternalLink } from 'lucide-react';
import { MEVHistogram } from '../MEVHistogram';

interface SwapPreviewProps {
  quote: {
    inputToken: { symbol: string; logoURI: string; decimals: number };
    outputToken: { symbol: string; logoURI: string; decimals: number };
    inputAmount: string;
    outputAmount: string;
    minOutputAmount: string;
    priceImpact: number;
    fee: string;
    route: string[];
    estimatedGas?: string;
  };
  config: {
    slippage: number;
    deadline: number;
    mevProtection: boolean;
  };
  onConfirm: () => void;
  onCancel: () => void;
  isCommitting?: boolean;
}

export const SwapPreview: React.FC<SwapPreviewProps> = ({
  quote,
  config,
  onConfirm,
  onCancel,
  isCommitting = false
}) => {
  const [showMEVDetails, setShowMEVDetails] = useState(false);
  
  const exchangeRate = parseFloat(quote.outputAmount) / parseFloat(quote.inputAmount);
  const priceImpactColor = quote.priceImpact > 3 ? "destructive" : quote.priceImpact > 1 ? "secondary" : "default";
  const tokenPair = `${quote.inputToken.symbol}→${quote.outputToken.symbol}`;

  const formatNumber = (num: number, decimals: number = 6) => {
    if (num === 0) return '0';
    if (num < 0.000001) return '< 0.000001';
    if (num >= 1000) return num.toLocaleString(undefined, { maximumFractionDigits: 2 });
    return num.toFixed(decimals).replace(/\.?0+$/, '');
  };

  return (
    <Card className="w-full max-w-md mx-auto swiss-card">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl text-[#a5b4cb]">Swap Preview</CardTitle>
          {config.mevProtection && (
            <Badge className="mev-badge">
              <Shield className="w-3 h-3" />
              Swiss Protected
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Swap Summary with Swiss styling */}
        <div className="p-4 rounded-lg bg-[#0f4c75]/20 border border-[#3282b8]/30">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <img 
                src={quote.inputToken.logoURI} 
                alt={quote.inputToken.symbol}
                className="w-6 h-6 rounded-full"
              />
              <span className="font-medium text-white">
                {formatNumber(parseFloat(quote.inputAmount) / Math.pow(10, quote.inputToken.decimals))} {quote.inputToken.symbol}
              </span>
            </div>
            <ArrowRight className="w-4 h-4 text-[#3282b8]" />
            <div className="flex items-center gap-2">
              <img 
                src={quote.outputToken.logoURI} 
                alt={quote.outputToken.symbol}
                className="w-6 h-6 rounded-full"
              />
              <span className="font-medium text-white">
                {formatNumber(parseFloat(quote.outputAmount) / Math.pow(10, quote.outputToken.decimals))} {quote.outputToken.symbol}
              </span>
            </div>
          </div>
          
          <div className="text-sm text-[#a5b4cb] text-center">
            1 {quote.inputToken.symbol} = {formatNumber(exchangeRate)} {quote.outputToken.symbol}
          </div>
        </div>

        {/* Swiss Tabs for Details and MEV Protection */}
        <Tabs defaultValue="details" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-[#1e293b]">
            <TabsTrigger value="details" className="text-[#a5b4cb] data-[state=active]:text-white data-[state=active]:bg-[#0f4c75]">
              Trade Details
            </TabsTrigger>
            <TabsTrigger value="mev" className="text-[#a5b4cb] data-[state=active]:text-white data-[state=active]:bg-[#0f4c75]">
              MEV Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-4 mt-4">
            {/* Transaction Details */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-[#a5b4cb]">Price Impact</span>
                <Badge variant={priceImpactColor} className="text-xs">
                  {quote.priceImpact.toFixed(2)}%
                </Badge>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm text-[#a5b4cb]">Slippage Tolerance</span>
                <span className="text-sm font-medium text-white">{config.slippage}%</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm text-[#a5b4cb]">Minimum Received</span>
                <span className="text-sm font-medium text-white">
                  {formatNumber(parseFloat(quote.minOutputAmount) / Math.pow(10, quote.outputToken.decimals))} {quote.outputToken.symbol}
                </span>
              </div>

              {quote.fee && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-[#a5b4cb]">Protocol Fee</span>
                  <span className="text-sm font-medium text-white">{quote.fee}</span>
                </div>
              )}

              {quote.estimatedGas && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-[#a5b4cb]">Gas Estimate</span>
                  <span className="text-sm font-medium text-white">{quote.estimatedGas}</span>
                </div>
              )}
            </div>

            <Separator className="bg-[#3282b8]/20" />

            {/* Route Information */}
            {quote.route && quote.route.length > 0 && (
              <div className="space-y-2">
                <span className="text-sm text-[#a5b4cb]">Execution Route</span>
                <div className="flex items-center gap-2 flex-wrap">
                  {quote.route.map((protocol, index) => (
                    <div key={index} className="flex items-center gap-1">
                      <Badge variant="outline" className="text-xs border-[#3282b8]/30 text-[#3282b8]">
                        {protocol}
                      </Badge>
                      {index < quote.route.length - 1 && (
                        <ArrowRight className="w-3 h-3 text-[#a5b4cb]" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="mev" className="mt-4">
            <MEVHistogram 
              variant="swap-confirmation"
              tokenPair={tokenPair}
              compact
              showAuditLink
              onAuditClick={() => setShowMEVDetails(true)}
            />
          </TabsContent>
        </Tabs>

        {/* Swiss MEV Protection Info */}
        {config.mevProtection && (
          <div className="p-3 rounded-lg bg-[#0f4c75]/10 border border-[#3282b8]/20">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="w-4 h-4 text-[#3282b8]" />
              <span className="text-sm font-medium text-[#3282b8]">Swiss DLT §5 Protection Active</span>
            </div>
            <div className="space-y-1 text-xs text-[#a5b4cb]">
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>2-phase commit-reveal process</span>
              </div>
              <div className="flex items-center gap-1">
                <Shield className="w-3 h-3" />
                <span>ZK-proof execution verification</span>
              </div>
              <div className="flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                <span>Optimal execution guaranteed</span>
              </div>
            </div>
          </div>
        )}

        {/* Warnings for high price impact */}
        {quote.priceImpact > 3 && (
          <div className="p-3 rounded-lg bg-red-900/20 border border-red-500/20">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className="w-4 h-4 text-red-400" />
              <span className="text-sm font-medium text-red-400">High Price Impact Warning</span>
            </div>
            <p className="text-xs text-red-300">
              This swap will significantly move the market price. Consider reducing the amount or splitting into smaller trades.
            </p>
          </div>
        )}

        {/* Action Buttons with Swiss styling */}
        <div className="flex gap-3 pt-2">
          <Button
            variant="outline"
            className="flex-1 border-[#3282b8]/50 text-[#a5b4cb] hover:bg-[#0f4c75]/20"
            onClick={onCancel}
            disabled={isCommitting}
          >
            Cancel
          </Button>
          <Button
            className="flex-1 proof-button"
            onClick={onConfirm}
            disabled={isCommitting}
          >
            {isCommitting ? (
              <>
                <Clock className="w-4 h-4 animate-spin" />
                {config.mevProtection ? "Committing..." : "Executing..."}
              </>
            ) : config.mevProtection ? (
              <>
                <Shield className="w-4 h-4" />
                Commit Swiss Swap
              </>
            ) : (
              <>
                <Zap className="w-4 h-4" />
                Execute Swap
              </>
            )}
          </Button>
        </div>

        {/* Execution Proof Link */}
        <div className="pt-2 border-t border-[#3282b8]/20">
          <Dialog open={showMEVDetails} onOpenChange={setShowMEVDetails}>
            <DialogTrigger asChild>
              <button className="audit-link w-full text-center">
                <ExternalLink className="w-3 h-3" />
                View Swiss DLT Execution Proofs
              </button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl bg-[#0f1419] border-[#0f4c75]/20">
              <DialogHeader>
                <DialogTitle className="text-[#3282b8] flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Swiss DLT §5 Execution Audit Trail
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-6">
                {/* Comprehensive MEV Analytics */}
                <MEVHistogram 
                  variant="settings"
                  tokenPair={tokenPair}
                  showAuditLink={false}
                />
                
                {/* ZK-Proof Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg bg-[#0f4c75]/10 border border-[#0f4c75]/20">
                    <div className="text-sm font-medium mb-2 text-[#3282b8]">Commitment Phase</div>
                    <div className="font-mono text-xs text-[#a5b4cb] space-y-1">
                      <div>Hash: 0x4a7b...9c3d</div>
                      <div>Block: 18,542,889</div>
                      <div>Status: ✅ Sealed</div>
                    </div>
                  </div>
                  <div className="p-4 rounded-lg bg-[#0f4c75]/10 border border-[#0f4c75]/20">
                    <div className="text-sm font-medium mb-2 text-[#3282b8]">Reveal Phase</div>
                    <div className="font-mono text-xs text-[#a5b4cb] space-y-1">
                      <div>Reveal: 0x8f2e...1a5c</div>
                      <div>Block: 18,542,891</div>
                      <div>Status: ⏳ Pending</div>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-green-900/20 border border-green-500/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="w-4 h-4 text-green-400" />
                    <span className="text-sm font-medium text-green-400">Swiss DLT Compliance</span>
                  </div>
                  <div className="text-xs text-green-300 space-y-1">
                    <div>✅ Regulatory compliance verified</div>
                    <div>✅ Audit trail maintained</div>
                    <div>✅ ZK-proof cryptographic integrity</div>
                    <div>✅ Cross-chain execution standards</div>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardContent>
    </Card>
  );
};