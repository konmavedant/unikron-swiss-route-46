import { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Loader2, 
  CheckCircle, 
  AlertCircle, 
  Clock,
  Zap,
  Shield,
  ArrowUpDown
} from "lucide-react";
import { cn } from '@/lib/utils';

interface LoadingStage {
  id: string;
  label: string;
  description?: string;
  icon: React.ReactNode;
  estimatedTime?: number;
}

interface EnhancedLoadingProps {
  isLoading: boolean;
  currentStage?: string;
  stages?: LoadingStage[];
  progress?: number;
  className?: string;
  showProgress?: boolean;
  showStages?: boolean;
}

const defaultStages: LoadingStage[] = [
  {
    id: 'connecting',
    label: 'Connecting to Network',
    description: 'Establishing secure connection',
    icon: <Zap className="w-5 h-5" />,
    estimatedTime: 2000,
  },
  {
    id: 'fetching',
    label: 'Fetching Token Data',
    description: 'Loading available tokens and rates',
    icon: <ArrowUpDown className="w-5 h-5" />,
    estimatedTime: 3000,
  },
  {
    id: 'securing',
    label: 'Securing Transaction',
    description: 'Applying MEV protection',
    icon: <Shield className="w-5 h-5" />,
    estimatedTime: 1500,
  },
  {
    id: 'completing',
    label: 'Finalizing',
    description: 'Completing setup',
    icon: <CheckCircle className="w-5 h-5" />,
    estimatedTime: 1000,
  },
];

export const EnhancedLoading = ({
  isLoading,
  currentStage = 'connecting',
  stages = defaultStages,
  progress,
  className,
  showProgress = true,
  showStages = true,
}: EnhancedLoadingProps) => {
  const [internalProgress, setInternalProgress] = useState(0);
  const [completedStages, setCompletedStages] = useState<string[]>([]);

  const currentStageIndex = stages.findIndex(stage => stage.id === currentStage);
  const currentStageData = stages[currentStageIndex];

  useEffect(() => {
    if (!isLoading) {
      setInternalProgress(0);
      setCompletedStages([]);
      return;
    }

    if (progress !== undefined) {
      setInternalProgress(progress);
      return;
    }

    // Auto-progress simulation
    const targetProgress = ((currentStageIndex + 1) / stages.length) * 100;
    const progressInterval = setInterval(() => {
      setInternalProgress(prev => {
        if (prev >= targetProgress) {
          clearInterval(progressInterval);
          return targetProgress;
        }
        return Math.min(prev + 2, targetProgress);
      });
    }, 100);

    return () => clearInterval(progressInterval);
  }, [isLoading, currentStage, currentStageIndex, stages.length, progress]);

  useEffect(() => {
    if (currentStageIndex > 0) {
      const newCompleted = stages.slice(0, currentStageIndex).map(stage => stage.id);
      setCompletedStages(newCompleted);
    }
  }, [currentStageIndex, stages]);

  if (!isLoading) return null;

  return (
    <div className={cn(
      "fixed inset-0 bg-background/95 backdrop-blur-sm z-50 flex items-center justify-center p-4",
      className
    )}>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="w-full max-w-md"
      >
        <Card className="border-primary/20 shadow-2xl">
          <CardContent className="p-8">
            <div className="text-center space-y-6">
              {/* Main Loading Icon */}
              <div className="relative">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="w-16 h-16 mx-auto"
                >
                  <div className="w-full h-full border-4 border-primary/20 border-t-primary rounded-full" />
                </motion.div>
                
                {currentStageData && (
                  <motion.div
                    key={currentStage}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute inset-0 flex items-center justify-center text-primary"
                  >
                    {currentStageData.icon}
                  </motion.div>
                )}
              </div>

              {/* Current Stage Info */}
              {currentStageData && (
                <motion.div
                  key={currentStage}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-2"
                >
                  <h3 className="text-lg font-semibold">{currentStageData.label}</h3>
                  {currentStageData.description && (
                    <p className="text-sm text-muted-foreground">
                      {currentStageData.description}
                    </p>
                  )}
                </motion.div>
              )}

              {/* Progress Bar */}
              {showProgress && (
                <div className="space-y-2">
                  <Progress value={internalProgress} className="h-2" />
                  <p className="text-xs text-muted-foreground">
                    {Math.round(internalProgress)}% Complete
                  </p>
                </div>
              )}

              {/* Stage List */}
              {showStages && (
                <div className="space-y-2">
                  <AnimatePresence>
                    {stages.map((stage, index) => {
                      const isCompleted = completedStages.includes(stage.id);
                      const isCurrent = stage.id === currentStage;
                      const isPending = index > currentStageIndex;

                      return (
                        <motion.div
                          key={stage.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className={cn(
                            "flex items-center gap-3 p-2 rounded-lg text-sm",
                            isCurrent && "bg-primary/10 border border-primary/20",
                            isCompleted && "text-green-600",
                            isPending && "text-muted-foreground"
                          )}
                        >
                          <div className={cn(
                            "w-5 h-5 flex items-center justify-center",
                            isCompleted && "text-green-500",
                            isCurrent && "text-primary animate-pulse",
                            isPending && "text-muted-foreground"
                          )}>
                            {isCompleted ? (
                              <CheckCircle className="w-4 h-4" />
                            ) : isCurrent ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Clock className="w-4 h-4" />
                            )}
                          </div>
                          <span className={cn(
                            "flex-1 text-left",
                            isCurrent && "font-medium"
                          )}>
                            {stage.label}
                          </span>
                          {stage.estimatedTime && isPending && (
                            <span className="text-xs text-muted-foreground">
                              ~{Math.round(stage.estimatedTime / 1000)}s
                            </span>
                          )}
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

interface QuickLoadingProps {
  isLoading: boolean;
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'inline' | 'overlay' | 'card';
  className?: string;
}

export const QuickLoading = ({
  isLoading,
  message = 'Loading...',
  size = 'md',
  variant = 'inline',
  className,
}: QuickLoadingProps) => {
  if (!isLoading) return null;

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  const iconSize = sizeClasses[size];

  const content = (
    <div className={cn(
      "flex items-center gap-2",
      variant === 'card' && "justify-center p-4",
      className
    )}>
      <Loader2 className={cn("animate-spin text-primary", iconSize)} />
      {message && (
        <span className={cn(
          "text-muted-foreground",
          size === 'sm' && "text-xs",
          size === 'md' && "text-sm",
          size === 'lg' && "text-base"
        )}>
          {message}
        </span>
      )}
    </div>
  );

  if (variant === 'overlay') {
    return (
      <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 flex items-center justify-center">
        {content}
      </div>
    );
  }

  if (variant === 'card') {
    return (
      <Card className="w-full">
        <CardContent className="p-6">
          {content}
        </CardContent>
      </Card>
    );
  }

  return content;
};

interface LoadingButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading: boolean;
  loadingText?: string;
  children: React.ReactNode;
  className?: string;
}

export const LoadingButton = ({
  isLoading,
  loadingText,
  children,
  className,
  disabled,
  ...props
}: LoadingButtonProps) => {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity",
        className
      )}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
      {isLoading ? loadingText || 'Loading...' : children}
    </button>
  );
};