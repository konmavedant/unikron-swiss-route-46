import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle, Clock, XCircle, ExternalLink, RefreshCw } from "lucide-react";
import { useSwapStatus } from "@/hooks/useApi";
import { ChainType } from "@/types";
import { formatNumber, truncateAddress } from "@/lib/utils";

interface SwapStatusProps {
  intentId: string;
  chainType: ChainType;
  onReset: () => void;
}

export const SwapStatus = ({ intentId, chainType, onReset }: SwapStatusProps) => {
  const { data: status, isLoading, refetch } = useSwapStatus(chainType, intentId);

  const getStatusIcon = () => {
    if (!status) return <Clock className="w-5 h-5 text-gray-500 animate-spin" />;
    
    switch (status.status) {
      case 'executed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'pending':
      case 'committed':
        return <Clock className="w-5 h-5 text-yellow-500 animate-spin" />;
      case 'failed':
      case 'cancelled':
      case 'expired':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Clock className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = () => {
    if (!status) return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    
    switch (status.status) {
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

  const getExplorerUrl = () => {
    if (!status?.txHash) return null;
    
    if (chainType === 'solana') {
      return `https://solscan.io/tx/${status.txHash}`;
    }
    
    return `https://etherscan.io/tx/${status.txHash}`;
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-lg">Swap Status</CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            {getStatusIcon()}
            <Badge className={getStatusColor()}>
              {status ? status.status.charAt(0).toUpperCase() + status.status.slice(1) : 'Loading...'}
            </Badge>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Intent ID:</span>
            <span className="font-mono text-xs">
              {truncateAddress(intentId, 8, 4)}
            </span>
          </div>
          
          {status?.txHash && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Transaction:</span>
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 text-xs font-mono"
                onClick={() => {
                  const url = getExplorerUrl();
                  if (url) window.open(url, '_blank');
                }}
              >
                {truncateAddress(status.txHash, 8, 4)}
                <ExternalLink className="w-3 h-3 ml-1" />
              </Button>
            </div>
          )}
          
          {status?.createdAt && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Created:</span>
              <span className="text-xs">
                {new Date(status.createdAt).toLocaleTimeString()}
              </span>
            </div>
          )}
          
          {status?.executedAt && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Executed:</span>
              <span className="text-xs">
                {new Date(status.executedAt).toLocaleTimeString()}
              </span>
            </div>
          )}
          
          {status?.gasUsed && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Gas Used:</span>
              <span className="text-xs font-medium">
                {formatNumber(parseFloat(status.gasUsed))}
              </span>
            </div>
          )}
          
          {status?.actualOutputAmount && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Actual Output:</span>
              <span className="text-xs font-medium">
                {formatNumber(parseFloat(status.actualOutputAmount), 6)}
              </span>
            </div>
          )}
          
          {status?.error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
              <p className="text-xs text-red-500">{status.error}</p>
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => refetch()}
            disabled={isLoading}
            className="flex-1"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          
          <Button variant="default" size="sm" onClick={onReset} className="flex-1">
            New Swap
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};