import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Shield, 
  ExternalLink, 
  ArrowRightLeft, 
  CheckCircle, 
  Clock, 
  XCircle,
  TrendingUp,
  AlertTriangle,
  Info,
  BarChart3
} from 'lucide-react';
import { MEVHistogram } from './MEVHistogram';

// Mock transaction history data with MEV analytics
const mockTransactionHistory = [
  {
    id: '1',
    intentId: 'intent_2024_001',
    txHash: '0x4a7b8f2e9c3d1a5c6e8f0b2d4a6c8e0f2b4d6a8c0e2f4b6d8a0c2e4f6b8d0a2c4e',
    timestamp: Date.now() - 3600000, // 1 hour ago
    status: 'executed',
    inputToken: { symbol: 'ETH', logoURI: 'https://tokens.coingecko.com/ethereum/images/thumb_logo.png' },
    outputToken: { symbol: 'USDC', logoURI: 'https://tokens.coingecko.com/usd-coin/images/thumb_logo.png' },
    inputAmount: '1.5',
    outputAmount: '4,287.32',
    actualSlippage: 0.12,
    mevProtected: true,
    mevSavings: 156.78,
    gasUsed: '0.0023',
    executionTime: 28.5,
    priceImpact: 0.45,
    mevAttacksBlocked: ['sandwich', 'frontrun']
  },
  {
    id: '2',
    intentId: 'intent_2024_002',
    txHash: '0x8f2e9c3d1a5c6e0f2b4d6a8c0e4f6b8d0a2c4e6f8b0d2a4c6e8f0b2d4a6c8e0f2b',
    timestamp: Date.now() - 7200000, // 2 hours ago
    status: 'executed',
    inputToken: { symbol: 'USDC', logoURI: 'https://tokens.coingecko.com/usd-coin/images/thumb_logo.png' },
    outputToken: { symbol: 'SOL', logoURI: 'https://tokens.coingecko.com/solana/images/thumb_logo.png' },
    inputAmount: '1,000.00',
    outputAmount: '8.234',
    actualSlippage: 0.08,
    mevProtected: true,
    mevSavings: 89.45,
    gasUsed: '0.0015',
    executionTime: 31.2,
    priceImpact: 0.22,
    mevAttacksBlocked: ['sandwich']
  },
  {
    id: '3',
    intentId: 'intent_2024_003',
    txHash: '0x2c4e6f8b0d2a4c6e8f0b4d6a8c0e2f4b6d8a0c4e6f8b0d2a4c6e8f0b2d4a6c8e0f',
    timestamp: Date.now() - 14400000, // 4 hours ago
    status: 'failed',
    inputToken: { symbol: 'WBTC', logoURI: 'https://tokens.coingecko.com/wrapped-bitcoin/images/thumb_logo.png' },
    outputToken: { symbol: 'ETH', logoURI: 'https://tokens.coingecko.com/ethereum/images/thumb_logo.png' },
    inputAmount: '0.5',
    outputAmount: '0.0',
    actualSlippage: 0.0,
    mevProtected: false,
    mevSavings: 0,
    gasUsed: '0.0012',
    executionTime: 0,
    priceImpact: 2.15,
    error: 'MEV attack detected, transaction reverted for user protection'
  }
];

interface TransactionHistoryProps {
  walletAddress?: string;
}

export const MEVAnalyticsHistory: React.FC<TransactionHistoryProps> = ({ walletAddress }) => {
  const [selectedTransaction, setSelectedTransaction] = useState<string | null>(null);
  const [showMEVDetails, setShowMEVDetails] = useState(false);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'executed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500 animate-spin" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      executed: 'bg-green-900/20 text-green-400 border-green-500/20',
      pending: 'bg-yellow-900/20 text-yellow-400 border-yellow-500/20',
      failed: 'bg-red-900/20 text-red-400 border-red-500/20'
    };
    return colors[status as keyof typeof colors] || colors.pending;
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const getMEVSavingsColor = (savings: number) => {
    if (savings > 100) return 'text-green-400';
    if (savings > 50) return 'text-[#5dade2]';
    return 'text-[#3282b8]';
  };

  return (
    <div className="space-y-6">
      {/* Header with overall MEV statistics */}
      <Card className="swiss-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-[#a5b4cb]">
            <BarChart3 className="w-5 h-5 text-[#3282b8]" />
            MEV Protection Analytics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-3 rounded-lg bg-[#0f4c75]/20 border border-[#3282b8]/20">
              <div className="text-2xl font-bold text-[#3282b8]">$246.23</div>
              <div className="text-sm text-[#a5b4cb]">Total MEV Saved</div>
              <div className="text-xs text-[#6b7280]">This month</div>
            </div>
            <div className="text-center p-3 rounded-lg bg-[#0f4c75]/20 border border-[#3282b8]/20">
              <div className="text-2xl font-bold text-green-400">98.7%</div>
              <div className="text-sm text-[#a5b4cb]">Protection Rate</div>
              <div className="text-xs text-[#6b7280]">Success ratio</div>
            </div>
            <div className="text-center p-3 rounded-lg bg-[#0f4c75]/20 border border-[#3282b8]/20">
              <div className="text-2xl font-bold text-[#5dade2]">23</div>
              <div className="text-sm text-[#a5b4cb]">Attacks Blocked</div>
              <div className="text-xs text-[#6b7280]">Last 7 days</div>
            </div>
            <div className="text-center p-3 rounded-lg bg-[#0f4c75]/20 border border-[#3282b8]/20">
              <div className="text-2xl font-bold text-[#85c1e9]">0.18%</div>
              <div className="text-sm text-[#a5b4cb]">Avg. Slippage</div>
              <div className="text-xs text-[#6b7280]">Protected trades</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transaction History */}
      <Card className="swiss-card">
        <CardHeader>
          <CardTitle className="text-[#a5b4cb]">Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {mockTransactionHistory.map((tx) => (
              <div
                key={tx.id}
                className="p-4 rounded-lg bg-[#1e293b]/50 border border-[#3282b8]/20 hover:border-[#3282b8]/40 transition-all duration-200"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <img
                        src={tx.inputToken.logoURI}
                        alt={tx.inputToken.symbol}
                        className="w-6 h-6 rounded-full"
                      />
                      <ArrowRightLeft className="w-4 h-4 text-[#a5b4cb]" />
                      <img
                        src={tx.outputToken.logoURI}
                        alt={tx.outputToken.symbol}
                        className="w-6 h-6 rounded-full"
                      />
                    </div>
                    <div>
                      <div className="font-medium text-white">
                        {tx.inputAmount} {tx.inputToken.symbol} → {tx.outputAmount} {tx.outputToken.symbol}
                      </div>
                      <div className="text-xs text-[#a5b4cb]">{formatTime(tx.timestamp)}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {tx.mevProtected && (
                      <Badge className="mev-badge">
                        <Shield className="w-3 h-3" />
                        Protected
                      </Badge>
                    )}
                    <Badge className={getStatusBadge(tx.status)}>
                      {getStatusIcon(tx.status)}
                      {tx.status.charAt(0).toUpperCase() + tx.status.slice(1)}
                    </Badge>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <div className="text-[#a5b4cb]">Slippage</div>
                    <div className="font-medium text-white">{tx.actualSlippage}%</div>
                  </div>
                  <div>
                    <div className="text-[#a5b4cb]">Price Impact</div>
                    <div className="font-medium text-white">{tx.priceImpact}%</div>
                  </div>
                  {tx.mevSavings > 0 && (
                    <div>
                      <div className="text-[#a5b4cb]">MEV Saved</div>
                      <div className={`font-medium ${getMEVSavingsColor(tx.mevSavings)}`}>
                        ${tx.mevSavings.toFixed(2)}
                      </div>
                    </div>
                  )}
                  <div>
                    <div className="text-[#a5b4cb]">Gas Used</div>
                    <div className="font-medium text-white">{tx.gasUsed} ETH</div>
                  </div>
                </div>

                {tx.error && (
                  <div className="mt-3 p-2 rounded bg-red-900/20 border border-red-500/20">
                    <div className="flex items-center gap-2 text-red-400">
                      <AlertTriangle className="w-4 h-4" />
                      <span className="text-xs">{tx.error}</span>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between mt-3 pt-3 border-t border-[#3282b8]/20">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 text-xs text-[#3282b8] hover:text-[#42a5f5]"
                      onClick={() => window.open(`https://etherscan.io/tx/${tx.txHash}`, '_blank')}
                    >
                      <ExternalLink className="w-3 h-3" />
                      View on Explorer
                    </Button>
                    {tx.mevProtected && (
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 text-xs text-[#3282b8] hover:text-[#42a5f5]"
                          >
                            <BarChart3 className="w-3 h-3" />
                            MEV Analysis
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl bg-[#0f1419] border-[#0f4c75]/20">
                          <DialogHeader>
                            <DialogTitle className="text-[#3282b8] flex items-center gap-2">
                              <Shield className="w-5 h-5" />
                              MEV Protection Analysis - {tx.inputToken.symbol}→{tx.outputToken.symbol}
                            </DialogTitle>
                          </DialogHeader>
                          
                          <Tabs defaultValue="analytics" className="w-full">
                            <TabsList className="grid w-full grid-cols-3 bg-[#1e293b]">
                              <TabsTrigger value="analytics">Analytics</TabsTrigger>
                              <TabsTrigger value="execution">Execution</TabsTrigger>
                              <TabsTrigger value="proofs">ZK Proofs</TabsTrigger>
                            </TabsList>
                            
                            <TabsContent value="analytics" className="space-y-4">
                              <MEVHistogram 
                                variant="history"
                                tokenPair={`${tx.inputToken.symbol}→${tx.outputToken.symbol}`}
                                showAuditLink={false}
                              />
                              
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="p-3 rounded-lg bg-green-900/20 border border-green-500/20">
                                  <div className="text-sm text-green-400">MEV Saved</div>
                                  <div className="text-xl font-bold text-white">${tx.mevSavings.toFixed(2)}</div>
                                  <div className="text-xs text-[#a5b4cb]">vs. unprotected</div>
                                </div>
                                <div className="p-3 rounded-lg bg-[#0f4c75]/20 border border-[#3282b8]/20">
                                  <div className="text-sm text-[#3282b8]">Execution Time</div>
                                  <div className="text-xl font-bold text-white">{tx.executionTime}s</div>
                                  <div className="text-xs text-[#a5b4cb]">commit-reveal</div>
                                </div>
                                <div className="p-3 rounded-lg bg-[#0f4c75]/20 border border-[#3282b8]/20">
                                  <div className="text-sm text-[#3282b8]">Attacks Blocked</div>
                                  <div className="text-xl font-bold text-white">{tx.mevAttacksBlocked?.length || 0}</div>
                                  <div className="text-xs text-[#a5b4cb]">
                                    {tx.mevAttacksBlocked?.join(', ') || 'none'}
                                  </div>
                                </div>
                              </div>
                            </TabsContent>
                            
                            <TabsContent value="execution" className="space-y-4">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-3">
                                  <h4 className="font-medium text-[#3282b8]">Execution Details</h4>
                                  <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                      <span className="text-[#a5b4cb]">Intent ID:</span>
                                      <span className="font-mono text-white">{formatAddress(tx.intentId)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-[#a5b4cb]">Actual Slippage:</span>
                                      <span className="text-white">{tx.actualSlippage}%</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-[#a5b4cb]">Price Impact:</span>
                                      <span className="text-white">{tx.priceImpact}%</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-[#a5b4cb]">Gas Used:</span>
                                      <span className="text-white">{tx.gasUsed} ETH</span>
                                    </div>
                                  </div>
                                </div>
                                
                                <div className="space-y-3">
                                  <h4 className="font-medium text-[#3282b8]">Protection Status</h4>
                                  <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-sm">
                                      <CheckCircle className="w-4 h-4 text-green-400" />
                                      <span className="text-white">Commit phase completed</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm">
                                      <CheckCircle className="w-4 h-4 text-green-400" />
                                      <span className="text-white">Reveal phase executed</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm">
                                      <CheckCircle className="w-4 h-4 text-green-400" />
                                      <span className="text-white">MEV attacks prevented</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm">
                                      <CheckCircle className="w-4 h-4 text-green-400" />
                                      <span className="text-white">Optimal execution achieved</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </TabsContent>
                            
                            <TabsContent value="proofs" className="space-y-4">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="p-4 rounded-lg bg-[#0f4c75]/10 border border-[#0f4c75]/20">
                                  <div className="text-sm font-medium mb-2 text-[#3282b8]">ZK-Proof Verification</div>
                                  <div className="font-mono text-xs text-[#a5b4cb] space-y-1">
                                    <div>Proof Hash: {formatAddress(tx.txHash)}</div>
                                    <div>Commitment: {formatAddress(tx.intentId)}</div>
                                    <div>Reveal Block: 18,542,891</div>
                                    <div className="text-green-400">Status: ✅ Verified</div>
                                  </div>
                                </div>
                                
                                <div className="p-4 rounded-lg bg-[#0f4c75]/10 border border-[#0f4c75]/20">
                                  <div className="text-sm font-medium mb-2 text-[#3282b8]">Swiss DLT Compliance</div>
                                  <div className="text-xs text-[#a5b4cb] space-y-1">
                                    <div className="text-green-400">✅ Regulatory compliance verified</div>
                                    <div className="text-green-400">✅ Audit trail maintained</div>
                                    <div className="text-green-400">✅ Cross-chain execution standards</div>
                                    <div className="text-green-400">✅ MEV protection validated</div>
                                  </div>
                                </div>
                              </div>
                              
                              <div className="p-4 rounded-lg bg-green-900/10 border border-green-500/20">
                                <div className="flex items-center gap-2 mb-2">
                                  <Shield className="w-4 h-4 text-green-400" />
                                  <span className="text-sm font-medium text-green-400">Execution Integrity Verified</span>
                                </div>
                                <p className="text-xs text-green-300">
                                  This transaction has been cryptographically verified through our Swiss DLT §5 compliance framework. 
                                  All MEV protection measures were successfully applied and can be independently audited.
                                </p>
                              </div>
                            </TabsContent>
                          </Tabs>
                        </DialogContent>
                      </Dialog>
                    )}
                  </div>
                  
                  <div className="text-xs text-[#a5b4cb] font-mono">
                    {formatAddress(tx.txHash)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};