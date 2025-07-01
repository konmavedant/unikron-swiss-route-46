import { useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Clock, DollarSign, Shield, ArrowRight, RefreshCw, TrendingUp, Activity, Droplets } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { usePrices } from "@/hooks/usePrices";
import type { BlockchainType } from "./BlockchainSelector";

interface RoutePreviewProps {
  fromToken: { symbol: string; chain: string; id?: string };
  toToken: { symbol: string; chain: string; id?: string };
  amount: string;
  isCrossChain: boolean;
  blockchain?: BlockchainType;
}

const RoutePreview = ({ fromToken, toToken, amount, isCrossChain, blockchain = 'ethereum' }: RoutePreviewProps) => {
  const symbols = useMemo(() => [fromToken.symbol, toToken.symbol], [fromToken.symbol, toToken.symbol]);
  const { getPriceData, getLiquidityInfo, getVolumeInfo, getTradingActivity, refreshPrices, loading } = usePrices(symbols);
  
  const fromPriceData = getPriceData(fromToken.symbol);
  const toPriceData = getPriceData(toToken.symbol);
  const fromLiquidityInfo = getLiquidityInfo(fromToken.symbol);
  const toLiquidityInfo = getLiquidityInfo(toToken.symbol);
  const fromVolumeInfo = getVolumeInfo(fromToken.symbol);
  const toVolumeInfo = getVolumeInfo(toToken.symbol);

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

  const getNetworkInfo = () => {
    if (blockchain === 'solana') {
      return {
        fee: '~0.00025 SOL',
        time: '~2 seconds',
        network: 'Solana'
      };
    }
    return {
      fee: '~0.01 ETH',
      time: isCrossChain ? '2-5 minutes' : '~30 seconds',
      network: 'Ethereum'
    };
  };

  const networkInfo = getNetworkInfo();

  const formatVolume = (volume: number) => {
    if (volume >= 1000000) {
      return `$${(volume / 1000000).toFixed(1)}M`;
    } else if (volume >= 1000) {
      return `$${(volume / 1000).toFixed(1)}K`;
    }
    return `$${volume.toFixed(0)}`;
  };

  const formatLiquidity = (liquidity: number) => {
    if (liquidity >= 1000000) {
      return `$${(liquidity / 1000000).toFixed(1)}M`;
    } else if (liquidity >= 1000) {
      return `$${(liquidity / 1000).toFixed(1)}K`;
    }
    return `$${liquidity.toFixed(0)}`;
  };

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
            <div className="flex items-center space-x-2">
              <Badge variant="secondary" className={blockchain === 'solana' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}>
                {networkInfo.network}
              </Badge>
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
                  <div className="flex items-center justify-center space-x-4">
                    <span>{fromToken.symbol}: ${fromPriceData?.price.toFixed(4)}</span>
                    <span>{toToken.symbol}: ${toPriceData?.price.toFixed(4)}</span>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-xl text-gray-500">
                {loading ? "Loading rates..." : "Unable to fetch rates"}
              </div>
            )}
          </div>
          
          {/* Enhanced Market Data */}
          {(fromLiquidityInfo || fromVolumeInfo) && (
            <div className="grid grid-cols-2 gap-4 mt-4">
              {fromLiquidityInfo && (
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center justify-center space-x-1 text-blue-600 mb-1">
                    <Droplets className="h-4 w-4" />
                    <span className="text-xs font-medium">Liquidity</span>
                  </div>
                  <div className="text-sm font-semibold">
                    {formatLiquidity(fromLiquidityInfo.usd)}
                  </div>
                  <div className="text-xs text-gray-600">{fromToken.symbol}</div>
                </div>
              )}
              {fromVolumeInfo && (
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center justify-center space-x-1 text-green-600 mb-1">
                    <Activity className="h-4 w-4" />
                    <span className="text-xs font-medium">24h Volume</span>
                  </div>
                  <div className="text-sm font-semibold">
                    {formatVolume(fromVolumeInfo.h24)}
                  </div>
                  <div className="text-xs text-gray-600">{fromToken.symbol}</div>
                </div>
              )}
            </div>
          )}
          
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
              {networkInfo.time}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Shield className="h-4 w-4 text-green-500" />
              <span className="text-gray-600">MEV Protection</span>
            </div>
            <Badge variant="secondary" className="bg-green-100 text-green-700">
              {blockchain === 'solana' ? 'Native' : 'Active'}
            </Badge>
          </div>

          {/* Market Quality Indicators */}
          {(fromLiquidityInfo || toLiquidityInfo) && (
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-4 w-4 text-blue-500" />
                <span className="text-gray-600">Market Quality</span>
              </div>
              <div className="flex space-x-2">
                {fromLiquidityInfo && fromLiquidityInfo.usd > 100000 && (
                  <Badge variant="secondary" className="bg-green-100 text-green-700">
                    High Liquidity
                  </Badge>
                )}
                {fromVolumeInfo && fromVolumeInfo.h24 > 50000 && (
                  <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                    Active Trading
                  </Badge>
                )}
              </div>
            </div>
          )}

          <Separator />

          <div className="space-y-3">
            <h4 className="font-medium text-gray-900">Fee Breakdown</h4>
            
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Network Fee</span>
              <span className="text-gray-900">{networkInfo.fee}</span>
            </div>
            
            {isCrossChain && blockchain === 'ethereum' && (
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
      {(isCrossChain || blockchain === 'solana') && amount && (
        <Card className="swiss-card">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-gray-900">
              {blockchain === 'solana' ? 'Solana Route' : 'Cross-Chain Route'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-center">
                <div className={`w-12 h-12 ${blockchain === 'solana' ? 'bg-purple-100' : 'bg-blue-100'} rounded-full flex items-center justify-center mb-2`}>
                  <span className={`${blockchain === 'solana' ? 'text-purple-600' : 'text-blue-600'} font-semibold`}>
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
                  transition={{ duration: blockchain === 'solana' ? 1 : 2, repeat: Infinity, ease: "easeInOut" }}
                >
                  <div className={`w-3 h-3 ${blockchain === 'solana' ? 'bg-purple-500' : 'bg-unikron-blue'} rounded-full`}></div>
                </motion.div>
                <ArrowRight className="absolute h-4 w-4 text-gray-400" />
              </div>
              
              <div className="text-center">
                <div className={`w-12 h-12 ${blockchain === 'solana' ? 'bg-purple-100' : 'bg-purple-100'} rounded-full flex items-center justify-center mb-2`}>
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
