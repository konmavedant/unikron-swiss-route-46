
import { useEffect } from "react";
import { motion } from "framer-motion";
import { Clock, DollarSign, Shield, ArrowRight, RefreshCw, Zap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { usePrices } from "@/hooks/usePrices";
import { useBlockchain } from "@/contexts/BlockchainContext";

interface RoutePreviewProps {
  fromToken: { symbol: string; chain: string; id?: string };
  toToken: { symbol: string; chain: string; id?: string };
  amount: string;
  isCrossChain: boolean;
}

const RoutePreview = ({ fromToken, toToken, amount, isCrossChain }: RoutePreviewProps) => {
  const { getPriceData, loading, refreshPrices, isDataStale } = usePrices([fromToken.symbol, toToken.symbol]);
  const { isSolana, isEthereum } = useBlockchain();
  
  const fromPriceData = getPriceData(fromToken.symbol);
  const toPriceData = getPriceData(toToken.symbol);
  const isFromStale = isDataStale(fromToken.symbol);
  const isToStale = isDataStale(toToken.symbol);

  const exchangeRate = fromPriceData && toPriceData ? 
    (fromPriceData.price / toPriceData.price) : 0;

  const estimatedOutput = amount && exchangeRate ? 
    (parseFloat(amount) * exchangeRate).toFixed(6) : "0.00";

  // Blockchain-specific fee calculations
  const getNetworkFees = () => {
    if (isSolana) {
      return {
        networkFee: amount ? (0.000005).toFixed(6) : "0.000005", // ~0.000005 SOL
        networkFeeToken: "SOL",
        bridgeFee: isCrossChain ? "0.25" : "0.00",
        jupiterFee: amount ? (parseFloat(amount) * 0.001).toFixed(4) : "0.0000" // 0.1% Jupiter fee
      };
    } else {
      return {
        networkFee: amount ? (parseFloat(amount) * 0.003).toFixed(4) : "0.0000", // ~0.3% ETH gas
        networkFeeToken: "ETH",
        bridgeFee: isCrossChain ? "0.25" : "0.00",
        jupiterFee: "0.0000"
      };
    }
  };

  const fees = getNetworkFees();

  const getEstimatedTime = () => {
    if (isSolana && !isCrossChain) return "~1-2 seconds";
    if (isSolana && isCrossChain) return "2-5 minutes";
    if (isEthereum && !isCrossChain) return "~30 seconds";
    return "2-5 minutes";
  };

  const handleRefresh = () => {
    console.log('Manual refresh requested from RoutePreview');
    refreshPrices();
  };

  const shouldShowRefresh = isFromStale || isToStale || loading;
  
  return (
    <div className="space-y-6">
      {/* Rate Preview */}
      <Card className="swiss-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-semibold text-gray-900 flex items-center space-x-2">
              <span>Live Exchange Rate</span>
              {isSolana && <Zap className="h-4 w-4 text-yellow-500" />}
              {(isFromStale || isToStale) && (
                <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded">
                  Stale Data
                </span>
              )}
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              disabled={loading}
              className={`text-gray-500 hover:text-gray-700 ${shouldShowRefresh ? 'visible' : 'invisible'}`}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center py-4">
            {loading && !fromPriceData && !toPriceData ? (
              <div className="text-xl text-gray-500">Loading rates...</div>
            ) : exchangeRate ? (
              <>
                <div className="text-3xl font-bold text-gray-900 mb-2">
                  1 {fromToken.symbol} ≈ {exchangeRate.toFixed(6)} {toToken.symbol}
                </div>
                <div className="text-sm text-gray-500 space-y-1">
                  <div className={isFromStale ? 'text-orange-500' : ''}>
                    {fromToken.symbol}: ${fromPriceData?.price.toFixed(4)}
                    {isFromStale && ' (stale)'}
                  </div>
                  <div className={isToStale ? 'text-orange-500' : ''}>
                    {toToken.symbol}: ${toPriceData?.price.toFixed(4)}
                    {isToStale && ' (stale)'}
                  </div>
                </div>
                {(isFromStale || isToStale) && (
                  <div className="text-xs text-orange-600 mt-2">
                    Prices update every minute. Click refresh for latest data.
                  </div>
                )}
              </>
            ) : (
              <div className="text-xl text-gray-500">
                {loading ? 'Loading rates...' : 'Unable to fetch rates'}
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
                  {isFromStale && ' (estimated)'}
                </div>
              )}
            </motion.div>
          )}
        </CardContent>
      </Card>

      {/* Route Information */}
      <Card className="swiss-card">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-gray-900 flex items-center space-x-2">
            <span>Route Information</span>
            {isSolana && <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">Jupiter</span>}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-gray-500" />
              <span className="text-gray-600">Estimated Time</span>
            </div>
            <span className="font-medium text-gray-900">
              {getEstimatedTime()}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Shield className="h-4 w-4 text-green-500" />
              <span className="text-gray-600">MEV Protection</span>
            </div>
            <span className="font-medium text-green-600">
              {isSolana ? "Jupiter Protected" : "Active"}
            </span>
          </div>

          <Separator />

          <div className="space-y-3">
            <h4 className="font-medium text-gray-900">Fee Breakdown</h4>
            
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Network Fee</span>
              <span className="text-gray-900">{fees.networkFee} {fees.networkFeeToken}</span>
            </div>
            
            {isSolana && parseFloat(fees.jupiterFee) > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Jupiter Protocol Fee</span>
                <span className="text-gray-900">{fees.jupiterFee} {fromToken.symbol}</span>
              </div>
            )}
            
            {isCrossChain && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Cross-Chain Bridge Fee</span>
                <span className="text-gray-900">{fees.bridgeFee} USDC</span>
              </div>
            )}
            
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">UNIKRON Fee</span>
              <span className="text-green-600">0.00% (Launch Promo)</span>
            </div>

            <div className="text-xs text-gray-500 border-t pt-2">
              Prices refresh automatically every minute via DexScreener API
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Route Visualization */}
      {(isCrossChain || fromToken.chain !== toToken.chain) && amount && (
        <Card className="swiss-card">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-gray-900">
              {isSolana ? "Jupiter Route" : "Cross-Chain Route"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-2">
                  <span className="text-blue-600 font-semibold">
                    {fromToken.chain === "Solana" ? "🌞" : "🔷"}
                  </span>
                </div>
                <p className="text-sm font-medium text-gray-900">{fromToken.chain}</p>
              </div>
              
              <div className="flex-1 flex items-center justify-center relative">
                <div className="flex-1 h-px bg-gray-300"></div>
                <motion.div
                  className="absolute"
                  animate={{ x: [-20, 20, -20] }}
                  transition={{ duration: isSolana ? 1 : 2, repeat: Infinity, ease: "easeInOut" }}
                >
                  <div className={`w-3 h-3 ${isSolana ? 'bg-yellow-500' : 'bg-unikron-blue'} rounded-full`}></div>
                </motion.div>
                <ArrowRight className="absolute h-4 w-4 text-gray-400" />
              </div>
              
              <div className="text-center">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mb-2">
                  <span className="text-purple-600 font-semibold">
                    {toToken.chain === "Solana" ? "🌞" : "🔷"}
                  </span>
                </div>
                <p className="text-sm font-medium text-gray-900">{toToken.chain}</p>
              </div>
            </div>
            
            {isSolana && (
              <div className="mt-4 text-center">
                <div className="text-xs text-gray-500 bg-yellow-50 border border-yellow-200 rounded p-2">
                  Optimized routing through Jupiter's aggregated liquidity sources
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default RoutePreview;
