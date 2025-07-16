import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  Info,
  Loader2,
  RefreshCw,
  ExternalLink,
  Copy,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface StatusStep {
  id: string;
  label: string;
  description?: string;
  status: 'pending' | 'active' | 'completed' | 'failed' | 'skipped';
  timestamp?: Date;
  metadata?: Record<string, any>;
  estimatedDuration?: number;
}

interface EnhancedStatusProps {
  title: string;
  steps: StatusStep[];
  currentStep?: string;
  overallStatus: 'pending' | 'active' | 'completed' | 'failed';
  showProgress?: boolean;
  showTimestamps?: boolean;
  showMetadata?: boolean;
  onRetry?: () => void;
  onCancel?: () => void;
  className?: string;
}

const statusIcons = {
  pending: Clock,
  active: Loader2,
  completed: CheckCircle,
  failed: AlertTriangle,
  skipped: Info,
};

const statusColors = {
  pending: 'text-muted-foreground',
  active: 'text-blue-500',
  completed: 'text-green-500',
  failed: 'text-red-500',
  skipped: 'text-yellow-500',
};

export const EnhancedStatus = ({
  title,
  steps,
  currentStep,
  overallStatus,
  showProgress = true,
  showTimestamps = false,
  showMetadata = false,
  onRetry,
  onCancel,
  className,
}: EnhancedStatusProps) => {
  const [expandedSteps, setExpandedSteps] = useState<Set<string>>(new Set());
  const [showDetails, setShowDetails] = useState(false);
  const { toast } = useToast();

  const completedSteps = steps.filter(step => step.status === 'completed').length;
  const totalSteps = steps.length;
  const progress = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0;

  const currentStepData = steps.find(step => step.id === currentStep);
  const activeStep = steps.find(step => step.status === 'active') || currentStepData;

  const toggleStepExpansion = (stepId: string) => {
    const newExpanded = new Set(expandedSteps);
    if (newExpanded.has(stepId)) {
      newExpanded.delete(stepId);
    } else {
      newExpanded.add(stepId);
    }
    setExpandedSteps(newExpanded);
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to clipboard",
      description: `${label} copied successfully`,
      duration: 2000,
    });
  };

  const getOverallStatusColor = () => {
    switch (overallStatus) {
      case 'completed': return 'border-green-200 bg-green-50 dark:bg-green-950';
      case 'failed': return 'border-red-200 bg-red-50 dark:bg-red-950';
      case 'active': return 'border-blue-200 bg-blue-50 dark:bg-blue-950';
      default: return 'border-muted';
    }
  };

  return (
    <Card className={cn("w-full", getOverallStatusColor(), className)}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            {overallStatus === 'active' && (
              <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
            )}
            {overallStatus === 'completed' && (
              <CheckCircle className="w-5 h-5 text-green-500" />
            )}
            {overallStatus === 'failed' && (
              <AlertTriangle className="w-5 h-5 text-red-500" />
            )}
            {overallStatus === 'pending' && (
              <Clock className="w-5 h-5 text-muted-foreground" />
            )}
            {title}
          </CardTitle>
          
          <div className="flex items-center gap-2">
            <Badge variant={overallStatus === 'completed' ? 'default' : 
                           overallStatus === 'failed' ? 'destructive' : 
                           overallStatus === 'active' ? 'default' : 'secondary'}
                   className={cn(
                     overallStatus === 'completed' && 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                   )}>
              {overallStatus.charAt(0).toUpperCase() + overallStatus.slice(1)}
            </Badge>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowDetails(!showDetails)}
            >
              {showDetails ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        {showProgress && (
          <div className="space-y-2">
            <Progress value={progress} className="h-2" />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>{completedSteps} of {totalSteps} steps completed</span>
              <span>{Math.round(progress)}%</span>
            </div>
          </div>
        )}

        {activeStep && (
          <div className="mt-4 p-3 bg-background/50 rounded-lg border">
            <div className="flex items-center gap-2 text-sm">
              <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
              <span className="font-medium">Current: {activeStep.label}</span>
            </div>
            {activeStep.description && (
              <p className="text-xs text-muted-foreground mt-1">
                {activeStep.description}
              </p>
            )}
          </div>
        )}
      </CardHeader>

      <AnimatePresence>
        {showDetails && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <CardContent className="pt-0">
              <div className="space-y-3">
                {steps.map((step, index) => (
                  <StatusStepItem
                    key={step.id}
                    step={step}
                    index={index}
                    isExpanded={expandedSteps.has(step.id)}
                    onToggle={() => toggleStepExpansion(step.id)}
                    showTimestamps={showTimestamps}
                    showMetadata={showMetadata}
                    onCopy={copyToClipboard}
                  />
                ))}
              </div>

              {(onRetry || onCancel) && (
                <div className="flex gap-2 mt-6 pt-4 border-t">
                  {onCancel && (
                    <Button variant="outline" onClick={onCancel} className="flex-1">
                      Cancel
                    </Button>
                  )}
                  {onRetry && overallStatus === 'failed' && (
                    <Button onClick={onRetry} className="flex-1">
                      <RefreshCw className="w-4 h-4" />
                      Retry
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
};

interface StatusStepItemProps {
  step: StatusStep;
  index: number;
  isExpanded: boolean;
  onToggle: () => void;
  showTimestamps: boolean;
  showMetadata: boolean;
  onCopy: (text: string, label: string) => void;
}

const StatusStepItem = ({
  step,
  index,
  isExpanded,
  onToggle,
  showTimestamps,
  showMetadata,
  onCopy,
}: StatusStepItemProps) => {
  const Icon = statusIcons[step.status];
  const hasExpandableContent = step.metadata || step.description;

  return (
    <div className={cn(
      "p-3 rounded-lg border transition-all",
      step.status === 'active' && "border-blue-200 bg-blue-50 dark:bg-blue-950",
      step.status === 'completed' && "border-green-200 bg-green-50 dark:bg-green-950",
      step.status === 'failed' && "border-red-200 bg-red-50 dark:bg-red-950",
    )}>
      <div className="flex items-start gap-3">
        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-background border-2">
          <div className="w-3 h-3 flex items-center justify-center">
            {step.status === 'active' ? (
              <Loader2 className="w-3 h-3 animate-spin text-blue-500" />
            ) : (
              <Icon className={cn("w-3 h-3", statusColors[step.status])} />
            )}
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h4 className="font-medium text-sm">{step.label}</h4>
              {step.status === 'skipped' && (
                <Badge variant="outline" className="text-xs">
                  Skipped
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-1">
              {showTimestamps && step.timestamp && (
                <span className="text-xs text-muted-foreground">
                  {step.timestamp.toLocaleTimeString()}
                </span>
              )}
              {hasExpandableContent && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-6 h-6"
                  onClick={onToggle}
                >
                  {isExpanded ? (
                    <ChevronUp className="w-3 h-3" />
                  ) : (
                    <ChevronDown className="w-3 h-3" />
                  )}
                </Button>
              )}
            </div>
          </div>

          {step.description && !isExpanded && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
              {step.description}
            </p>
          )}

          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="mt-3 space-y-3">
                  {step.description && (
                    <p className="text-sm text-muted-foreground">
                      {step.description}
                    </p>
                  )}

                  {showMetadata && step.metadata && (
                    <div className="space-y-2">
                      <h5 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        Details
                      </h5>
                      <div className="grid gap-2">
                        {Object.entries(step.metadata).map(([key, value]) => (
                          <div key={key} className="flex justify-between items-center text-xs">
                            <span className="text-muted-foreground capitalize">
                              {key.replace(/([A-Z])/g, ' $1').trim()}:
                            </span>
                            <div className="flex items-center gap-1">
                              <span className="font-mono bg-muted px-1 py-0.5 rounded">
                                {String(value)}
                              </span>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="w-4 h-4"
                                onClick={() => onCopy(String(value), key)}
                              >
                                <Copy className="w-2 h-2" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

// Specialized status component for swap operations
interface SwapStatusProps {
  swapId?: string;
  fromToken: string;
  toToken: string;
  fromAmount: string;
  toAmount?: string;
  currentStep: string;
  transactionHash?: string;
  onViewTransaction?: (hash: string) => void;
  className?: string;
}

export const SwapStatus = ({
  swapId,
  fromToken,
  toToken,
  fromAmount,
  toAmount,
  currentStep,
  transactionHash,
  onViewTransaction,
  className,
}: SwapStatusProps) => {
  const steps: StatusStep[] = [
    {
      id: 'commit',
      label: 'Creating Commitment',
      description: 'Generating secure commitment with MEV protection',
      status: currentStep === 'commit' ? 'active' : 
              ['reveal', 'execute', 'complete'].includes(currentStep) ? 'completed' : 'pending',
    },
    {
      id: 'reveal',
      label: 'Revealing Intent',
      description: 'Broadcasting swap intention to the network',
      status: currentStep === 'reveal' ? 'active' : 
              ['execute', 'complete'].includes(currentStep) ? 'completed' : 'pending',
    },
    {
      id: 'execute',
      label: 'Executing Swap',
      description: 'Processing the token exchange',
      status: currentStep === 'execute' ? 'active' : 
              currentStep === 'complete' ? 'completed' : 'pending',
    },
    {
      id: 'complete',
      label: 'Swap Complete',
      description: 'Tokens successfully exchanged',
      status: currentStep === 'complete' ? 'completed' : 'pending',
    },
  ];

  const overallStatus = currentStep === 'complete' ? 'completed' : 
                       currentStep === 'failed' ? 'failed' : 'active';

  return (
    <EnhancedStatus
      title={`Swap ${fromAmount} ${fromToken} → ${toAmount || '...'} ${toToken}`}
      steps={steps}
      currentStep={currentStep}
      overallStatus={overallStatus}
      showProgress={true}
      showTimestamps={true}
      showMetadata={true}
      className={className}
    />
  );
};