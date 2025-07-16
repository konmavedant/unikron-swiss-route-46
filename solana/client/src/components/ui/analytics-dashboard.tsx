import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Activity, 
  Users, 
  Clock,
  Shield,
  AlertTriangle,
  CheckCircle,
  Info,
  RefreshCw,
  Download,
  BarChart3,
  PieChart,
  LineChart
} from "lucide-react";
import { cn } from '@/lib/utils';

interface MetricCard {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  color?: 'green' | 'red' | 'blue' | 'yellow';
}

interface AnalyticsData {
  totalVolume: number;
  totalSwaps: number;
  uniqueUsers: number;
  avgExecutionTime: number;
  mevProtectionRate: number;
  successRate: number;
  topTokens: Array<{ symbol: string; volume: number; count: number }>;
  recentActivity: Array<{
    id: string;
    type: 'swap' | 'error' | 'protection';
    timestamp: Date;
    description: string;
    status: 'success' | 'failed' | 'pending';
  }>;
  performanceMetrics: {
    apiLatency: number;
    uptime: number;
    errorRate: number;
  };
}

interface AnalyticsDashboardProps {
  data: AnalyticsData;
  isLoading?: boolean;
  onRefresh?: () => void;
  className?: string;
}

export const AnalyticsDashboard = ({
  data,
  isLoading = false,
  onRefresh,
  className,
}: AnalyticsDashboardProps) => {
  const [selectedPeriod, setSelectedPeriod] = useState<'24h' | '7d' | '30d'>('24h');

  const metricCards: MetricCard[] = [
    {
      title: 'Total Volume',
      value: `$${(data.totalVolume / 1000000).toFixed(2)}M`,
      change: 12.5,
      changeLabel: '24h',
      icon: <DollarSign className="w-5 h-5" />,
      trend: 'up',
      color: 'green',
    },
    {
      title: 'Total Swaps',
      value: data.totalSwaps.toLocaleString(),
      change: 8.2,
      changeLabel: '24h',
      icon: <Activity className="w-5 h-5" />,
      trend: 'up',
      color: 'blue',
    },
    {
      title: 'Unique Users',
      value: data.uniqueUsers.toLocaleString(),
      change: -2.1,
      changeLabel: '24h',
      icon: <Users className="w-5 h-5" />,
      trend: 'down',
      color: 'yellow',
    },
    {
      title: 'Avg Execution Time',
      value: `${data.avgExecutionTime.toFixed(1)}s`,
      change: -5.3,
      changeLabel: 'improvement',
      icon: <Clock className="w-5 h-5" />,
      trend: 'up',
      color: 'green',
    },
    {
      title: 'MEV Protection Rate',
      value: `${data.mevProtectionRate.toFixed(1)}%`,
      change: 1.8,
      changeLabel: '24h',
      icon: <Shield className="w-5 h-5" />,
      trend: 'up',
      color: 'blue',
    },
    {
      title: 'Success Rate',
      value: `${data.successRate.toFixed(1)}%`,
      change: 0.5,
      changeLabel: '24h',
      icon: <CheckCircle className="w-5 h-5" />,
      trend: 'up',
      color: 'green',
    },
  ];

  const getMetricColor = (color?: string) => {
    switch (color) {
      case 'green': return 'text-green-600 bg-green-50 dark:bg-green-950';
      case 'red': return 'text-red-600 bg-red-50 dark:bg-red-950';
      case 'blue': return 'text-blue-600 bg-blue-50 dark:bg-blue-950';
      case 'yellow': return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-950';
      default: return 'text-muted-foreground bg-muted/50';
    }
  };

  const getTrendIcon = (trend?: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="w-3 h-3 text-green-500" />;
      case 'down': return <TrendingDown className="w-3 h-3 text-red-500" />;
      default: return null;
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'swap': return <Activity className="w-4 h-4 text-blue-500" />;
      case 'error': return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'protection': return <Shield className="w-4 h-4 text-green-500" />;
      default: return <Info className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'text-green-600';
      case 'failed': return 'text-red-600';
      case 'pending': return 'text-yellow-600';
      default: return 'text-muted-foreground';
    }
  };

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Analytics Dashboard</h2>
          <p className="text-muted-foreground">
            Monitor swap performance and user activity
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={onRefresh} disabled={isLoading}>
            <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
            Refresh
          </Button>
          <Button variant="outline">
            <Download className="w-4 h-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Period Selection */}
      <Tabs value={selectedPeriod} onValueChange={(value: any) => setSelectedPeriod(value)}>
        <TabsList>
          <TabsTrigger value="24h">Last 24 Hours</TabsTrigger>
          <TabsTrigger value="7d">Last 7 Days</TabsTrigger>
          <TabsTrigger value="30d">Last 30 Days</TabsTrigger>
        </TabsList>

        <TabsContent value={selectedPeriod} className="space-y-6">
          {/* Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {metricCards.map((metric, index) => (
              <motion.div
                key={metric.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">{metric.title}</p>
                        <p className="text-2xl font-bold">{metric.value}</p>
                        {metric.change !== undefined && (
                          <div className="flex items-center gap-1 text-xs">
                            {getTrendIcon(metric.trend)}
                            <span className={cn(
                              metric.trend === 'up' ? 'text-green-600' : 
                              metric.trend === 'down' ? 'text-red-600' : 'text-muted-foreground'
                            )}>
                              {metric.change > 0 ? '+' : ''}{metric.change.toFixed(1)}%
                            </span>
                            <span className="text-muted-foreground">{metric.changeLabel}</span>
                          </div>
                        )}
                      </div>
                      <div className={cn(
                        "p-3 rounded-lg",
                        getMetricColor(metric.color)
                      )}>
                        {metric.icon}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Charts and Detailed Analytics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Tokens */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="w-5 h-5" />
                  Top Trading Tokens
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data.topTokens.slice(0, 5).map((token, index) => (
                    <div key={token.symbol} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium">{token.symbol.charAt(0)}</span>
                        </div>
                        <div>
                          <p className="font-medium">{token.symbol}</p>
                          <p className="text-xs text-muted-foreground">{token.count} swaps</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">${(token.volume / 1000).toFixed(1)}K</p>
                        <Progress value={(token.volume / data.topTokens[0].volume) * 100} className="w-16 h-1" />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Performance Metrics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  System Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>API Latency</span>
                      <span>{data.performanceMetrics.apiLatency}ms</span>
                    </div>
                    <Progress value={(1000 - data.performanceMetrics.apiLatency) / 10} className="h-2" />
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>System Uptime</span>
                      <span>{data.performanceMetrics.uptime.toFixed(2)}%</span>
                    </div>
                    <Progress value={data.performanceMetrics.uptime} className="h-2" />
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Error Rate</span>
                      <span>{data.performanceMetrics.errorRate.toFixed(2)}%</span>
                    </div>
                    <Progress value={100 - data.performanceMetrics.errorRate} className="h-2" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LineChart className="w-5 h-5" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {data.recentActivity.slice(0, 10).map((activity, index) => (
                  <motion.div
                    key={activity.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center gap-3 p-3 rounded-lg border"
                  >
                    {getActivityIcon(activity.type)}
                    <div className="flex-1">
                      <p className="text-sm">{activity.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {activity.timestamp.toLocaleTimeString()}
                      </p>
                    </div>
                    <Badge 
                      variant="outline" 
                      className={cn("text-xs", getStatusColor(activity.status))}
                    >
                      {activity.status}
                    </Badge>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Mock data generator for testing
export const generateMockAnalyticsData = (): AnalyticsData => {
  return {
    totalVolume: 12500000,
    totalSwaps: 8945,
    uniqueUsers: 2150,
    avgExecutionTime: 2.3,
    mevProtectionRate: 98.7,
    successRate: 99.2,
    topTokens: [
      { symbol: 'ETH', volume: 5000000, count: 2400 },
      { symbol: 'USDC', volume: 3200000, count: 1800 },
      { symbol: 'BTC', volume: 2800000, count: 950 },
      { symbol: 'SOL', volume: 1200000, count: 1200 },
      { symbol: 'MATIC', volume: 800000, count: 800 },
    ],
    recentActivity: Array.from({ length: 20 }, (_, i) => ({
      id: `activity-${i}`,
      type: ['swap', 'error', 'protection'][Math.floor(Math.random() * 3)] as any,
      timestamp: new Date(Date.now() - i * 1000 * 60 * 5),
      description: [
        'Swap executed successfully with MEV protection',
        'Failed to fetch token price from oracle',
        'MEV protection activated for high-value swap',
        'Cross-chain swap completed',
        'Slippage protection triggered',
      ][Math.floor(Math.random() * 5)],
      status: ['success', 'failed', 'pending'][Math.floor(Math.random() * 3)] as any,
    })),
    performanceMetrics: {
      apiLatency: 180,
      uptime: 99.9,
      errorRate: 0.8,
    },
  };
};