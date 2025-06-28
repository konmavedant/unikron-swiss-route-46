
import { useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Clock, DollarSign, Shield, ArrowRight, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { usePrices } from "@/hooks/usePrices";

interface RoutePreviewProps {
  fromToken: { symbol: string; chain: string; id?: string };
  toToken: { symbol: string; chain: string; id?: string };
  amount: string;
  isCrossChain: boolean;
}

const RoutePreview = ({ fromToken, toToken, amount, isCrossChain }: RoutePreviewProps) => {
  const symbols = useMemo(() => [fromToken.symbol, toToken.symbol], [fromToken.symbol, toToken.symbol]);
  const { getPriceData, refreshPrices, loading } = usePrices(symbols);
  
  const fromPriceData = getPriceData(fromToken.symbol);
  const toPriceData = getPriceData(toToken.symbol);

  const exchangeRate = useMemo(() => {
    return fromPriceData && toPriceData ? 
      (fromPriceData.price / toPriceData.price) : 0;
  }, [fromPriceData?.price, toPriceData?.price]);

  const estimatedOutput = useMemo(() => {
    return amount && exchangeRate ? 
      (parseFloat(amount) * exchangeRate).toFixed(6) : "0.00";
  }, [amount, exchangeRate]);

  const mockFees = useMemo(() => {
    return amount ? (parseFloat(amount) * 0.005).toFixed(4) : "0.0000";
  }, [amount]);

  const bridgeFee = isCrossChain ? "0.25" : "0.00";

  const handleRefresh = () => {
    refreshPrices();
  };
  
  return (
    <div className="space-y-6">
      {/* Rate Preview */}
      <Card className="swiss-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-semibold text-gray-900">
              Live Exchange Rate
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              disabled={loading}
              className="text-gray-500 hover:text-gray-700"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center py-4">
            {exchangeRate ? (
              <>
                <div className="text-3xl font-bold text-gray-900 mb-2">
                  1 {fromToken.symbol} ≈ {exchangeRate.toFixed(6)} {toToken.symbol}
                </div>
                <div className="text-sm text-gray-500 space-y-1">
                  <div>{fromToken.symbol}: ${fromPriceData?.price.toFixed(4)}</div>
                  <div>{toToken.symbol}: ${toPriceData?.price.toFixed(4)}</div>
                </div>
              </>
            ) : (
              <div className="text-xl text-gray-500">
                {loading ? "Loading rates..." : "Unable to fetch rates"}
              </div>
            )}
          </div>
          
          {amount && exchangeRate && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-unikron-gray rounded-lg p-4"
            >
              <div className="flex justify-between items-center">
                <span className="text-gray-600">You'll receive approximately:</span>
                <span className="text-xl font-semibold text-gray-900">
                  {estimatedOutput} {toToken.symbol}
                </span>
              </div>
              {fromPriceData && (
                <div className="text-sm text-gray-500 mt-1">
                  ≈ ${(parseFloat(amount) * fromPriceData.price).toFixed(2)} USD
                </div>
              )}
            </motion.div>
          )}
        </CardContent>
      </Card>

      {/* Route Information */}
      <Card className="swiss-card">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-gray-900 flex items-center">
            Route Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-gray-500" />
              <span className="text-gray-600">Estimated Time</span>
            </div>
            <span className="font-medium text-gray-900">
              {isCrossChain ? "2-5 minutes" : "~30 seconds"}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Shield className="h-4 w-4 text-green-500" />
              <span className="text-gray-600">MEV Protection</span>
            </div>
            <span className="font-medium text-green-600">Active</span>
          </div>

          <Separator />

          <div className="space-y-3">
            <h4 className="font-medium text-gray-900">Fee Breakdown</h4>
            
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Network Fee</span>
              <span className="text-gray-900">{mockFees} {fromToken.symbol}</span>
            </div>
            
            {isCrossChain && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Cross-Chain Bridge Fee</span>
                <span className="text-gray-900">{bridgeFee} USDC</span>
              </div>
            )}
            
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">UNIKRON Fee</span>
              <span className="text-green-600">0.00% (Launch Promo)</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Route Visualization */}
      {isCrossChain && amount && (
        <Card className="swiss-card">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-gray-900">
              Cross-Chain Route
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-2">
                  <span className="text-blue-600 font-semibold">
                    {fromToken.chain.slice(0, 1)}
                  </span>
                </div>
                <p className="text-sm font-medium text-gray-900">{fromToken.chain}</p>
              </div>
              
              <div className="flex-1 flex items-center justify-center relative">
                <div className="flex-1 h-px bg-gray-300"></div>
                <motion.div
                  className="absolute"
                  animate={{ x: [-20, 20, -20] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                >
                  <div className="w-3 h-3 bg-unikron-blue rounded-full"></div>
                </motion.div>
                <ArrowRight className="absolute h-4 w-4 text-gray-400" />
              </div>
              
              <div className="text-center">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mb-2">
                  <span className="text-purple-600 font-semibold">
                    {toToken.chain.slice(0, 1)}
                  </span>
                </div>
                <p className="text-sm font-medium text-gray-900">{toToken.chain}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default RoutePreview;
