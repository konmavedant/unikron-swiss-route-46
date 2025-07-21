import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Shield, TrendingUp, Clock, ExternalLink, Info } from 'lucide-react';

// Mock data for demonstration
const mockMEVData = {
  slippageDistribution: [
    { range: '0-0.1%', count: 450, percentage: 45 },
    { range: '0.1-0.3%', count: 350, percentage: 35 },
    { range: '0.3-0.5%', count: 120, percentage: 12 },
    { range: '0.5-1%', count: 60, percentage: 6 },
    { range: '1%+', count: 20, percentage: 2 }
  ],
  mevAttacksBlocked: [
    { type: 'Sandwich', count: 23, timeframe: 'Last 24h' },
    { type: 'Front-running', count: 41, timeframe: 'Last 24h' },
    { type: 'Back-running', count: 12, timeframe: 'Last 24h' }
  ],
  timeOfDayRisk: [
    { hour: 0, risk: 0.2 }, { hour: 1, risk: 0.15 }, { hour: 2, risk: 0.1 },
    { hour: 3, risk: 0.08 }, { hour: 4, risk: 0.12 }, { hour: 5, risk: 0.18 },
    { hour: 6, risk: 0.25 }, { hour: 7, risk: 0.35 }, { hour: 8, risk: 0.45 },
    { hour: 9, risk: 0.65 }, { hour: 10, risk: 0.8 }, { hour: 11, risk: 0.9 },
    { hour: 12, risk: 0.95 }, { hour: 13, risk: 0.85 }, { hour: 14, risk: 0.75 },
    { hour: 15, risk: 0.85 }, { hour: 16, risk: 0.9 }, { hour: 17, risk: 0.7 },
    { hour: 18, risk: 0.5 }, { hour: 19, risk: 0.4 }, { hour: 20, risk: 0.35 },
    { hour: 21, risk: 0.3 }, { hour: 22, risk: 0.25 }, { hour: 23, risk: 0.22 }
  ]
};

interface MEVHistogramProps {
  variant?: 'swap-confirmation' | 'history' | 'settings' | 'tooltip';
  tokenPair?: string;
  compact?: boolean;
  showAuditLink?: boolean;
  onAuditClick?: () => void;
}

export const MEVHistogram: React.FC<MEVHistogramProps> = ({ 
  variant = 'swap-confirmation',
  tokenPair = 'ETH→SOL',
  compact = false,
  showAuditLink = true,
  onAuditClick
}) => {
  const [activeTab, setActiveTab] = useState<'slippage' | 'attacks' | 'timing'>('slippage');

  const maxCount = useMemo(() => {
    return Math.max(...mockMEVData.slippageDistribution.map(d => d.count));
  }, []);

  const maxRisk = useMemo(() => {
    return Math.max(...mockMEVData.timeOfDayRisk.map(d => d.risk));
  }, []);

  const SlippageHistogram = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-foreground">Slippage Distribution</h4>
        <Badge variant="outline" className="text-green-600 border-green-600/30">
          90% &lt; 0.5%
        </Badge>
      </div>
      <div className="space-y-2">
        {mockMEVData.slippageDistribution.map((item, index) => (
          <div key={index} className="flex items-center gap-3">
            <div className="w-16 text-xs text-muted-foreground font-mono">
              {item.range}
            </div>
            <div className="flex-1 relative">
              <div className="h-4 bg-[#1e293b] rounded-sm overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-[#0f4c75] to-[#3282b8] transition-all duration-500 ease-out"
                  style={{ 
                    width: `${(item.count / maxCount) * 100}%`,
                    background: index < 3 ? 'linear-gradient(90deg, #059669, #10b981)' : 'linear-gradient(90deg, #dc2626, #ef4444)'
                  }}
                />
              </div>
            </div>
            <div className="w-12 text-xs text-muted-foreground text-right">
              {item.percentage}%
            </div>
            <div className="w-12 text-xs text-muted-foreground text-right">
              {item.count}
            </div>
          </div>
        ))}
      </div>
      <div className="text-xs text-muted-foreground">
        Based on {mockMEVData.slippageDistribution.reduce((acc, curr) => acc + curr.count, 0)} recent {tokenPair} swaps
      </div>
    </div>
  );

  const AttacksPrevented = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-foreground">MEV Attacks Blocked</h4>
        <Badge variant="outline" className="text-[#0f4c75] border-[#0f4c75]/30">
          76 Prevented
        </Badge>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {mockMEVData.mevAttacksBlocked.map((attack, index) => (
          <div key={index} className="text-center p-3 rounded-lg bg-[#0f1419] border border-[#0f4c75]/20">
            <div className="text-lg font-bold text-[#3282b8]">{attack.count}</div>
            <div className="text-xs text-muted-foreground">{attack.type}</div>
            <div className="text-xs text-muted-foreground mt-1">{attack.timeframe}</div>
          </div>
        ))}
      </div>
    </div>
  );

  const TimingAnalysis = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-foreground">MEV Risk by Hour (UTC)</h4>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <Info className="w-4 h-4 text-muted-foreground" />
            </TooltipTrigger>
            <TooltipContent>
              <p>Higher values indicate increased MEV attack frequency</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      <div className="h-24 flex items-end gap-1">
        {mockMEVData.timeOfDayRisk.map((data, index) => (
          <div key={index} className="flex-1 flex flex-col items-center">
            <div 
              className="w-full bg-gradient-to-t from-[#0f4c75] to-[#3282b8] rounded-sm transition-all duration-300 hover:opacity-80"
              style={{ 
                height: `${(data.risk / maxRisk) * 80}px`,
                backgroundColor: data.risk > 0.7 ? '#dc2626' : data.risk > 0.4 ? '#f59e0b' : '#059669'
              }}
            />
            {index % 4 === 0 && (
              <div className="text-xs text-muted-foreground mt-1">{data.hour}</div>
            )}
          </div>
        ))}
      </div>
      <div className="text-xs text-muted-foreground">
        Current time: {new Date().getHours()}:00 UTC - <span className={`font-medium ${
          mockMEVData.timeOfDayRisk[new Date().getHours()].risk > 0.7 ? 'text-red-500' :
          mockMEVData.timeOfDayRisk[new Date().getHours()].risk > 0.4 ? 'text-yellow-500' : 'text-green-500'
        }`}>
          {mockMEVData.timeOfDayRisk[new Date().getHours()].risk > 0.7 ? 'High' :
           mockMEVData.timeOfDayRisk[new Date().getHours()].risk > 0.4 ? 'Medium' : 'Low'} Risk
        </span>
      </div>
    </div>
  );

  const handleAuditClick = () => {
    if (onAuditClick) {
      onAuditClick();
    } else {
      // Default behavior - show audit trail dialog
      console.log('Opening audit trail for ZK-proofs');
    }
  };

  if (variant === 'tooltip') {
    return (
      <div className="p-3 max-w-xs">
        <div className="text-sm font-medium mb-2">MEV Protection Active</div>
        <SlippageHistogram />
        {showAuditLink && (
          <Button 
            variant="ghost" 
            size="sm" 
            className="w-full mt-3 text-[#0f4c75] hover:bg-[#0f4c75]/10"
            onClick={handleAuditClick}
          >
            <ExternalLink className="w-3 h-3 mr-1" />
            View Execution Proofs
          </Button>
        )}
      </div>
    );
  }

  if (compact) {
    return (
      <Card className="bg-[#0f1419] border-[#0f4c75]/20">
        <CardContent className="p-4">
          <SlippageHistogram />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-[#0f1419] border-[#0f4c75]/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Shield className="w-5 h-5 text-[#3282b8]" />
            MEV Protection Analytics
          </CardTitle>
          {variant === 'swap-confirmation' && (
            <Badge variant="outline" className="text-[#3282b8] border-[#3282b8]/30">
              {tokenPair}
            </Badge>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            variant={activeTab === 'slippage' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('slippage')}
            className={activeTab === 'slippage' ? 'bg-[#0f4c75] text-white' : 'text-muted-foreground'}
          >
            <TrendingUp className="w-3 h-3 mr-1" />
            Slippage
          </Button>
          <Button
            variant={activeTab === 'attacks' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('attacks')}
            className={activeTab === 'attacks' ? 'bg-[#0f4c75] text-white' : 'text-muted-foreground'}
          >
            <Shield className="w-3 h-3 mr-1" />
            Attacks
          </Button>
          <Button
            variant={activeTab === 'timing' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('timing')}
            className={activeTab === 'timing' ? 'bg-[#0f4c75] text-white' : 'text-muted-foreground'}
          >
            <Clock className="w-3 h-3 mr-1" />
            Timing
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {activeTab === 'slippage' && <SlippageHistogram />}
        {activeTab === 'attacks' && <AttacksPrevented />}
        {activeTab === 'timing' && <TimingAnalysis />}
        
        {showAuditLink && (
          <div className="pt-4 border-t border-[#0f4c75]/20">
            <Dialog>
              <DialogTrigger asChild>
                <Button 
                  variant="outline" 
                  className="w-full border-[#0f4c75]/30 text-[#3282b8] hover:bg-[#0f4c75]/10"
                  onClick={handleAuditClick}
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  View ZK-Proof Execution Trail
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl bg-[#0f1419] border-[#0f4c75]/20">
                <DialogHeader>
                  <DialogTitle className="text-[#3282b8]">Execution Audit Trail</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="p-4 rounded-lg bg-[#0f4c75]/10 border border-[#0f4c75]/20">
                    <div className="text-sm font-medium mb-2">ZK-Proof Verification</div>
                    <div className="font-mono text-xs text-muted-foreground">
                      Proof Hash: 0x4a7b...9c3d<br/>
                      Commitment: 0x8f2e...1a5c<br/>
                      Reveal Block: 18,542,891<br/>
                      Status: ✅ Verified
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                      <div className="text-sm text-green-400">MEV Protection</div>
                      <div className="text-lg font-bold">Active</div>
                      <div className="text-xs text-muted-foreground">Commit-reveal successful</div>
                    </div>
                    <div className="p-3 rounded-lg bg-[#3282b8]/10 border border-[#3282b8]/20">
                      <div className="text-sm text-[#3282b8]">Execution Price</div>
                      <div className="text-lg font-bold">Protected</div>
                      <div className="text-xs text-muted-foreground">0.12% slippage</div>
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </CardContent>
    </Card>
  );
};