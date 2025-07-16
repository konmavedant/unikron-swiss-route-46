import { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { 
  CheckCircle, 
  Circle, 
  Clock, 
  AlertCircle, 
  ArrowRight,
  Shield,
  Zap,
  Eye,
  Timer
} from "lucide-react";
import { SwapIntent } from "@/types";
import { cn } from "@/lib/utils";

interface SwapStepProps {
  title: string;
  description: string;
  status: 'pending' | 'active' | 'completed' | 'failed';
  icon?: React.ReactNode;
  duration?: number;
}

const SwapStep = ({ title, description, status, icon, duration }: SwapStepProps) => {
  const getStatusIcon = () => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'active':
        return <Clock className="w-5 h-5 text-blue-500 animate-pulse" />;
      case 'failed':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Circle className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'completed': return 'text-green-500';
      case 'active': return 'text-blue-500';
      case 'failed': return 'text-red-500';
      default: return 'text-muted-foreground';
    }
  };

  return (
    <div className="flex items-start gap-3 p-3 rounded-lg border border-border/50">
      <div className="flex-shrink-0 mt-0.5">
        {icon || getStatusIcon()}
      </div>
      <div className="flex-1 min-w-0">
        <h4 className={cn("font-medium text-sm", getStatusColor())}>
          {title}
        </h4>
        <p className="text-xs text-muted-foreground mt-1">
          {description}
        </p>
        {duration && status === 'active' && (
          <div className="mt-2">
            <div className="flex justify-between text-xs text-muted-foreground mb-1">
              <span>Estimated time</span>
              <span>{duration}s</span>
            </div>
            <Progress value={75} className="h-1" />
          </div>
        )}
      </div>
    </div>
  );
};

interface SwapProgressTrackerProps {
  swapIntent: SwapIntent;
  currentPhase: 'commit' | 'reveal' | 'execute' | 'complete';
  mevProtection?: boolean;
}

export const SwapProgressTracker = ({ 
  swapIntent, 
  currentPhase, 
  mevProtection = true 
}: SwapProgressTrackerProps) => {
  const [timeElapsed, setTimeElapsed] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeElapsed(Date.now() - swapIntent.createdAt);
    }, 1000);

    return () => clearInterval(timer);
  }, [swapIntent.createdAt]);

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    }
    return `${seconds}s`;
  };

  const getStepStatus = (step: string) => {
    const stepOrder = mevProtection 
      ? ['commit', 'reveal', 'execute', 'complete']
      : ['execute', 'complete'];
    
    const currentIndex = stepOrder.indexOf(currentPhase);
    const stepIndex = stepOrder.indexOf(step);
    
    if (stepIndex < currentIndex) return 'completed';
    if (stepIndex === currentIndex) return 'active';
    if (swapIntent.status === 'failed') return 'failed';
    return 'pending';
  };

  const steps = mevProtection ? [
    {
      key: 'commit',
      title: 'Commit Phase',
      description: 'Securing your swap intent with MEV protection',
      icon: <Shield className="w-5 h-5 text-shield-cyan" />,
      duration: 30,
    },
    {
      key: 'reveal',
      title: 'Reveal Phase',
      description: 'Ready to reveal and execute your protected swap',
      icon: <Eye className="w-5 h-5 text-blue-500" />,
      duration: 15,
    },
    {
      key: 'execute',
      title: 'Execution',
      description: 'Processing your swap on the blockchain',
      icon: <Zap className="w-5 h-5 text-yellow-500" />,
      duration: 45,
    },
    {
      key: 'complete',
      title: 'Complete',
      description: 'Your swap has been successfully executed',
      icon: <CheckCircle className="w-5 h-5 text-green-500" />,
    },
  ] : [
    {
      key: 'execute',
      title: 'Execution',
      description: 'Processing your instant swap',
      icon: <Zap className="w-5 h-5 text-yellow-500" />,
      duration: 30,
    },
    {
      key: 'complete',
      title: 'Complete',
      description: 'Your swap has been successfully executed',
      icon: <CheckCircle className="w-5 h-5 text-green-500" />,
    },
  ];

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Swap Progress</CardTitle>
          {mevProtection && (
            <Badge variant="secondary" className="flex items-center gap-1">
              <Shield className="w-3 h-3" />
              Protected
            </Badge>
          )}
        </div>
        
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>Time elapsed: {formatTime(timeElapsed)}</span>
          <span className="flex items-center gap-1">
            <Timer className="w-3 h-3" />
            {swapIntent.intentId.slice(0, 8)}...
          </span>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Progress Overview */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Overall Progress</span>
            <span className="font-medium">
              {Math.round((steps.findIndex(s => s.key === currentPhase) + 1) / steps.length * 100)}%
            </span>
          </div>
          <Progress 
            value={(steps.findIndex(s => s.key === currentPhase) + 1) / steps.length * 100} 
            className="h-2" 
          />
        </div>

        <Separator />

        {/* Step by Step Progress */}
        <div className="space-y-3">
          {steps.map((step, index) => (
            <div key={step.key}>
              <SwapStep
                title={step.title}
                description={step.description}
                status={getStepStatus(step.key)}
                icon={step.icon}
                duration={step.duration}
              />
              {index < steps.length - 1 && (
                <div className="flex justify-center py-2">
                  <ArrowRight className="w-4 h-4 text-muted-foreground" />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Swap Details */}
        <Separator />
        
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">From</span>
            <span className="font-medium">
              {swapIntent.inputAmount} {swapIntent.inputToken.symbol}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">To (Expected)</span>
            <span className="font-medium">
              {swapIntent.outputAmount} {swapIntent.outputToken.symbol}
            </span>
          </div>
          {swapIntent.actualOutputAmount && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Actual Received</span>
              <span className="font-medium text-green-600">
                {swapIntent.actualOutputAmount} {swapIntent.outputToken.symbol}
              </span>
            </div>
          )}
        </div>

        {/* Status Messages */}
        {currentPhase === 'commit' && mevProtection && (
          <div className="p-3 rounded-lg bg-shield-cyan/5 border border-shield-cyan/20">
            <p className="text-xs text-muted-foreground">
              💡 Your swap is protected from MEV attacks. You can reveal anytime within the next 5 minutes.
            </p>
          </div>
        )}

        {currentPhase === 'reveal' && mevProtection && (
          <div className="p-3 rounded-lg bg-blue-500/5 border border-blue-500/20">
            <p className="text-xs text-muted-foreground">
              🔍 Ready to execute! Click reveal to complete your protected swap.
            </p>
          </div>
        )}

        {currentPhase === 'execute' && (
          <div className="p-3 rounded-lg bg-yellow-500/5 border border-yellow-500/20">
            <p className="text-xs text-muted-foreground">
              ⚡ Your swap is being processed on the blockchain. This usually takes 15-60 seconds.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};