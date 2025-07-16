import { Header } from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ExternalLink, ArrowRightLeft, Clock, CheckCircle, XCircle } from "lucide-react";
import { useSwapHistory } from "@/hooks/useApi";
import { useWalletStore } from "@/store/wallet";
import { formatNumber, formatUSDValue, truncateAddress } from "@/lib/utils";

const History = () => {
  const { address, chainType, isConnected } = useWalletStore();
  
  const {
    data: swapHistory = [],
    isLoading,
    error,
  } = useSwapHistory(chainType || 'evm', address, isConnected);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'executed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'pending':
      case 'committed':
        return <Clock className="w-4 h-4 text-yellow-500 animate-spin" />;
      case 'failed':
      case 'cancelled':
      case 'expired':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'executed':
        return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'pending':
      case 'committed':
        return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'failed':
      case 'cancelled':
      case 'expired':
        return 'bg-red-500/10 text-red-500 border-red-500/20';
      default:
        return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-background">
        <Header />
        <main className="container mx-auto px-6 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="text-center py-16">
              <h1 className="text-2xl font-bold mb-4">Swap History</h1>
              <p className="text-muted-foreground mb-8">
                Connect your wallet to view your swap history
              </p>
              <div className="flex justify-center">
                <Button variant="cosmic">Connect Wallet</Button>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-background">
      <Header />
      <main className="container mx-auto px-6 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Swap History</h1>
            <p className="text-muted-foreground">
              Track all your swaps and their current status
            </p>
          </div>

          {error ? (
            <Card>
              <CardContent className="p-8 text-center">
                <XCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
                <h3 className="text-lg font-semibold mb-2">Failed to Load History</h3>
                <p className="text-muted-foreground">
                  There was an error loading your swap history. Please try again.
                </p>
              </CardContent>
            </Card>
          ) : isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <Skeleton className="w-10 h-10 rounded-full" />
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-3 w-24" />
                        </div>
                      </div>
                      <div className="text-right space-y-2">
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-3 w-16" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : swapHistory.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <ArrowRightLeft className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No Swaps Yet</h3>
                <p className="text-muted-foreground mb-6">
                  Start trading to see your swap history here
                </p>
                <Button variant="cosmic">Start Swapping</Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {swapHistory.map((swap) => (
                <Card key={swap.intentId} className="hover:shadow-card transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-gradient-cosmic flex items-center justify-center">
                            <img 
                              src={swap.inputToken.logoURI} 
                              alt={swap.inputToken.symbol}
                              className="w-6 h-6 rounded-full"
                            />
                          </div>
                          <ArrowRightLeft className="w-4 h-4 text-muted-foreground" />
                          <div className="w-8 h-8 rounded-full bg-gradient-shield flex items-center justify-center">
                            <img 
                              src={swap.outputToken.logoURI} 
                              alt={swap.outputToken.symbol}
                              className="w-6 h-6 rounded-full"
                            />
                          </div>
                        </div>
                        <div>
                          <div className="font-semibold">
                            {swap.inputToken.symbol} → {swap.outputToken.symbol}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {formatDate(swap.createdAt)}
                          </div>
                        </div>
                      </div>
                      
                      <Badge className={getStatusColor(swap.status)}>
                        {getStatusIcon(swap.status)}
                        {swap.status.charAt(0).toUpperCase() + swap.status.slice(1)}
                      </Badge>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="pt-0">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Input Amount:</span>
                          <span className="font-medium">
                            {formatNumber(parseFloat(swap.inputAmount) / Math.pow(10, swap.inputToken.decimals), 6)} {swap.inputToken.symbol}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Output Amount:</span>
                          <span className="font-medium">
                            {formatNumber(parseFloat(swap.outputAmount) / Math.pow(10, swap.outputToken.decimals), 6)} {swap.outputToken.symbol}
                          </span>
                        </div>
                        {swap.config.mevProtection && (
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">MEV Protection:</span>
                            <Badge variant="outline" className="text-shield-cyan border-shield-cyan/30">
                              Active
                            </Badge>
                          </div>
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Intent ID:</span>
                          <span className="font-mono text-xs">
                            {truncateAddress(swap.intentId, 8, 4)}
                          </span>
                        </div>
                        {swap.txHash && (
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Transaction:</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-auto p-0 text-xs font-mono"
                              onClick={() => {
                                const baseUrl = swap.chainType === 'evm' 
                                  ? 'https://etherscan.io/tx/' 
                                  : 'https://solscan.io/tx/';
                                window.open(`${baseUrl}${swap.txHash}`, '_blank');
                              }}
                            >
                              {truncateAddress(swap.txHash, 8, 4)}
                              <ExternalLink className="w-3 h-3 ml-1" />
                            </Button>
                          </div>
                        )}
                        {swap.gasUsed && (
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Gas Used:</span>
                            <span className="font-medium">{formatNumber(parseFloat(swap.gasUsed))}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default History;