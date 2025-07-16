import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  CheckCircle, 
  AlertTriangle, 
  Info, 
  X, 
  Clock,
  TrendingUp,
  TrendingDown,
  Shield,
  Zap,
  Copy,
  ExternalLink
} from "lucide-react";
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface FeedbackMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  autoHide?: boolean;
  duration?: number;
  progress?: number;
  metadata?: Record<string, any>;
}

interface EnhancedFeedbackProps {
  messages: FeedbackMessage[];
  onDismiss: (id: string) => void;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  maxMessages?: number;
  className?: string;
}

const feedbackIcons = {
  success: CheckCircle,
  error: AlertTriangle,
  warning: AlertTriangle,
  info: Info,
};

const feedbackColors = {
  success: 'text-green-600 border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800',
  error: 'text-red-600 border-red-200 bg-red-50 dark:bg-red-950 dark:border-red-800',
  warning: 'text-yellow-600 border-yellow-200 bg-yellow-50 dark:bg-yellow-950 dark:border-yellow-800',
  info: 'text-blue-600 border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800',
};

export const EnhancedFeedback = ({
  messages,
  onDismiss,
  position = 'top-right',
  maxMessages = 5,
  className,
}: EnhancedFeedbackProps) => {
  const [visibleMessages, setVisibleMessages] = useState<FeedbackMessage[]>([]);

  useEffect(() => {
    setVisibleMessages(messages.slice(-maxMessages));
  }, [messages, maxMessages]);

  const positionClasses = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
  };

  return (
    <div className={cn(
      "fixed z-50 w-96 max-w-[calc(100vw-2rem)] space-y-2",
      positionClasses[position],
      className
    )}>
      <AnimatePresence>
        {visibleMessages.map((message, index) => (
          <FeedbackItem
            key={message.id}
            message={message}
            onDismiss={onDismiss}
            index={index}
          />
        ))}
      </AnimatePresence>
    </div>
  );
};

interface FeedbackItemProps {
  message: FeedbackMessage;
  onDismiss: (id: string) => void;
  index: number;
}

const FeedbackItem = ({ message, onDismiss, index }: FeedbackItemProps) => {
  const [progress, setProgress] = useState(100);
  const Icon = feedbackIcons[message.type];

  useEffect(() => {
    if (message.autoHide && message.duration) {
      const interval = setInterval(() => {
        setProgress(prev => {
          if (prev <= 0) {
            clearInterval(interval);
            onDismiss(message.id);
            return 0;
          }
          return prev - (100 / (message.duration! / 100));
        });
      }, 100);

      return () => clearInterval(interval);
    }
  }, [message.autoHide, message.duration, message.id, onDismiss]);

  return (
    <motion.div
      initial={{ opacity: 0, x: 100, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 100, scale: 0.95 }}
      transition={{ delay: index * 0.1 }}
      className="relative"
    >
      <Card className={cn(
        "border shadow-lg",
        feedbackColors[message.type]
      )}>
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Icon className={cn("w-5 h-5 mt-0.5 flex-shrink-0")} />
            
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <h4 className="font-semibold text-sm leading-tight">
                  {message.title}
                </h4>
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-6 h-6 -mt-1 -mr-1 flex-shrink-0"
                  onClick={() => onDismiss(message.id)}
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
              
              {message.description && (
                <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                  {message.description}
                </p>
              )}

              {message.progress !== undefined && (
                <div className="mt-3">
                  <Progress value={message.progress} className="h-1" />
                  <p className="text-xs text-muted-foreground mt-1">
                    {Math.round(message.progress)}% complete
                  </p>
                </div>
              )}

              {message.metadata && (
                <div className="mt-3 space-y-1">
                  {Object.entries(message.metadata).map(([key, value]) => (
                    <div key={key} className="flex justify-between text-xs">
                      <span className="text-muted-foreground capitalize">
                        {key.replace(/([A-Z])/g, ' $1').trim()}:
                      </span>
                      <span className="font-mono">{String(value)}</span>
                    </div>
                  ))}
                </div>
              )}
              
              {message.action && (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3 w-full"
                  onClick={message.action.onClick}
                >
                  {message.action.label}
                </Button>
              )}
            </div>
          </div>
          
          {message.autoHide && message.duration && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-current/20 rounded-b">
              <div 
                className="h-full bg-current rounded-b transition-all duration-100 ease-linear"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

// Specialized feedback components for common use cases

interface SwapFeedbackProps {
  status: 'pending' | 'success' | 'failed';
  transactionHash?: string;
  fromToken?: string;
  toToken?: string;
  fromAmount?: string;
  toAmount?: string;
  gasUsed?: string;
  executionTime?: number;
  onViewTransaction?: (hash: string) => void;
  onRetry?: () => void;
}

export const SwapFeedback = ({
  status,
  transactionHash,
  fromToken,
  toToken,
  fromAmount,
  toAmount,
  gasUsed,
  executionTime,
  onViewTransaction,
  onRetry,
}: SwapFeedbackProps) => {
  const { toast } = useToast();

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to clipboard",
      description: "Transaction hash copied successfully",
      duration: 2000,
    });
  };

  const getStatusConfig = () => {
    switch (status) {
      case 'pending':
        return {
          type: 'info' as const,
          title: 'Swap in Progress',
          description: 'Your transaction is being processed with MEV protection',
          icon: <Clock className="w-5 h-5 animate-pulse" />,
        };
      case 'success':
        return {
          type: 'success' as const,
          title: 'Swap Successful!',
          description: 'Your tokens have been swapped successfully',
          icon: <CheckCircle className="w-5 h-5" />,
        };
      case 'failed':
        return {
          type: 'error' as const,
          title: 'Swap Failed',
          description: 'Transaction failed. Please try again.',
          icon: <AlertTriangle className="w-5 h-5" />,
        };
    }
  };

  const config = getStatusConfig();

  return (
    <Alert className={cn(feedbackColors[config.type])}>
      <div className="flex items-start gap-3">
        {config.icon}
        <div className="flex-1">
          <AlertTitle>{config.title}</AlertTitle>
          <AlertDescription className="mt-2 space-y-3">
            <p>{config.description}</p>
            
            {(fromToken || toToken) && (
              <div className="flex items-center gap-2 text-sm">
                {fromAmount && fromToken && (
                  <Badge variant="outline">{fromAmount} {fromToken}</Badge>
                )}
                {fromToken && toToken && <span>→</span>}
                {toAmount && toToken && (
                  <Badge variant="outline">{toAmount} {toToken}</Badge>
                )}
              </div>
            )}

            {(gasUsed || executionTime) && (
              <div className="grid grid-cols-2 gap-4 text-xs">
                {gasUsed && (
                  <div>
                    <span className="text-muted-foreground">Gas Used:</span>
                    <div className="font-mono">{gasUsed}</div>
                  </div>
                )}
                {executionTime && (
                  <div>
                    <span className="text-muted-foreground">Time:</span>
                    <div className="font-mono">{executionTime}s</div>
                  </div>
                )}
              </div>
            )}

            {transactionHash && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(transactionHash)}
                  className="flex-1"
                >
                  <Copy className="w-3 h-3" />
                  Copy Hash
                </Button>
                {onViewTransaction && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onViewTransaction(transactionHash)}
                    className="flex-1"
                  >
                    <ExternalLink className="w-3 h-3" />
                    View
                  </Button>
                )}
              </div>
            )}

            {status === 'failed' && onRetry && (
              <Button
                variant="outline"
                size="sm"
                onClick={onRetry}
                className="w-full"
              >
                Try Again
              </Button>
            )}
          </AlertDescription>
        </div>
      </div>
    </Alert>
  );
};

interface PriceFeedbackProps {
  currentPrice: number;
  previousPrice?: number;
  change24h?: number;
  volume24h?: number;
  symbol: string;
  className?: string;
}

export const PriceFeedback = ({
  currentPrice,
  previousPrice,
  change24h,
  volume24h,
  symbol,
  className,
}: PriceFeedbackProps) => {
  const isPositive = change24h ? change24h > 0 : false;
  const isPriceUp = previousPrice ? currentPrice > previousPrice : false;

  return (
    <Card className={cn("border", className)}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold">{symbol}</h3>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold">
                ${currentPrice.toFixed(4)}
              </span>
              {isPriceUp ? (
                <TrendingUp className="w-4 h-4 text-green-500" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-500" />
              )}
            </div>
          </div>
          
          {change24h !== undefined && (
            <div className="text-right">
              <div className={cn(
                "text-sm font-medium",
                isPositive ? "text-green-600" : "text-red-600"
              )}>
                {isPositive ? '+' : ''}{change24h.toFixed(2)}%
              </div>
              <div className="text-xs text-muted-foreground">24h</div>
            </div>
          )}
        </div>
        
        {volume24h && (
          <div className="mt-2 pt-2 border-t">
            <div className="text-xs text-muted-foreground">
              24h Volume: ${volume24h.toLocaleString()}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};