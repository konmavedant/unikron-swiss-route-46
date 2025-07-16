import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  CheckCircle2, 
  Clock, 
  Shield, 
  Zap, 
  TrendingUp, 
  AlertTriangle,
  Info,
  Sparkles
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AnimatedCounterProps {
  from: number;
  to: number;
  duration?: number;
  decimals?: number;
  suffix?: string;
  prefix?: string;
}

export const AnimatedCounter = ({ 
  from, 
  to, 
  duration = 2000, 
  decimals = 0,
  suffix = '',
  prefix = ''
}: AnimatedCounterProps) => {
  const [count, setCount] = useState(from);

  useEffect(() => {
    const start = Date.now();
    const animate = () => {
      const now = Date.now();
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      
      const easeOutCubic = 1 - Math.pow(1 - progress, 3);
      const current = from + (to - from) * easeOutCubic;
      
      setCount(current);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    
    requestAnimationFrame(animate);
  }, [from, to, duration]);

  return (
    <span>
      {prefix}{count.toFixed(decimals)}{suffix}
    </span>
  );
};

interface PulseCardProps {
  children: React.ReactNode;
  className?: string;
  glowColor?: string;
}

export const PulseCard = ({ children, className, glowColor = 'blue' }: PulseCardProps) => (
  <motion.div
    initial={{ scale: 0.95, opacity: 0 }}
    animate={{ scale: 1, opacity: 1 }}
    transition={{ duration: 0.3 }}
    className={cn("relative", className)}
  >
    <motion.div
      animate={{
        boxShadow: [
          `0 0 0 0 hsl(var(--${glowColor})/0)`,
          `0 0 0 8px hsl(var(--${glowColor})/0.1)`,
          `0 0 0 0 hsl(var(--${glowColor})/0)`
        ]
      }}
      transition={{
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut"
      }}
      className="rounded-lg"
    >
      {children}
    </motion.div>
  </motion.div>
);

interface SwapSuccessAnimationProps {
  fromToken: { symbol: string; amount: string };
  toToken: { symbol: string; amount: string };
  onComplete?: () => void;
}

export const SwapSuccessAnimation = ({ 
  fromToken, 
  toToken, 
  onComplete 
}: SwapSuccessAnimationProps) => {
  const [stage, setStage] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (stage < 3) {
        setStage(stage + 1);
      } else {
        onComplete?.();
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [stage, onComplete]);

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.8, opacity: 0 }}
      className="text-center space-y-6"
    >
      {/* Success Icon */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
        className="flex justify-center"
      >
        <div className="relative">
          <CheckCircle2 className="w-16 h-16 text-green-500" />
          <motion.div
            animate={{ 
              scale: [1, 1.2, 1],
              opacity: [0.5, 0, 0.5]
            }}
            transition={{ 
              duration: 2, 
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="absolute inset-0 w-16 h-16 border-2 border-green-500 rounded-full"
          />
        </div>
      </motion.div>

      {/* Swap Details */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="space-y-4"
      >
        <h3 className="text-xl font-semibold text-green-600">
          Swap Successful!
        </h3>
        
        <div className="flex items-center justify-center gap-4">
          <div className="text-center">
            <div className="font-medium">{fromToken.amount}</div>
            <div className="text-sm text-muted-foreground">{fromToken.symbol}</div>
          </div>
          
          <motion.div
            animate={{ x: [0, 10, 0] }}
            transition={{ duration: 1, repeat: Infinity }}
          >
            →
          </motion.div>
          
          <div className="text-center">
            <div className="font-medium text-green-600">{toToken.amount}</div>
            <div className="text-sm text-muted-foreground">{toToken.symbol}</div>
          </div>
        </div>
      </motion.div>

      {/* Celebration Effect */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="relative"
      >
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ 
              scale: 0,
              x: 0,
              y: 0,
              rotate: 0
            }}
            animate={{ 
              scale: [0, 1, 0],
              x: Math.cos(i * 60) * 50,
              y: Math.sin(i * 60) * 50,
              rotate: 360
            }}
            transition={{ 
              duration: 2,
              delay: 0.8 + i * 0.1,
              ease: "easeOut"
            }}
            className="absolute top-1/2 left-1/2 w-2 h-2 bg-yellow-400 rounded-full"
          />
        ))}
        <Sparkles className="w-8 h-8 text-yellow-400 mx-auto" />
      </motion.div>
    </motion.div>
  );
};

interface StatusIndicatorProps {
  status: 'loading' | 'success' | 'error' | 'warning' | 'info';
  message?: string;
  animate?: boolean;
}

export const StatusIndicator = ({ status, message, animate = true }: StatusIndicatorProps) => {
  const config = {
    loading: {
      icon: Clock,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/20'
    },
    success: {
      icon: CheckCircle2,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
      borderColor: 'border-green-500/20'
    },
    error: {
      icon: AlertTriangle,
      color: 'text-red-500',
      bgColor: 'bg-red-500/10',
      borderColor: 'border-red-500/20'
    },
    warning: {
      icon: AlertTriangle,
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-500/10',
      borderColor: 'border-yellow-500/20'
    },
    info: {
      icon: Info,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/20'
    }
  };

  const { icon: Icon, color, bgColor, borderColor } = config[status];

  return (
    <motion.div
      initial={animate ? { scale: 0.8, opacity: 0 } : {}}
      animate={animate ? { scale: 1, opacity: 1 } : {}}
      className={cn(
        "flex items-center gap-2 p-3 rounded-lg border",
        bgColor,
        borderColor
      )}
    >
      <motion.div
        animate={status === 'loading' ? { rotate: 360 } : {}}
        transition={status === 'loading' ? { duration: 2, repeat: Infinity, ease: 'linear' } : {}}
      >
        <Icon className={cn("w-4 h-4", color)} />
      </motion.div>
      {message && (
        <span className={cn("text-sm font-medium", color)}>
          {message}
        </span>
      )}
    </motion.div>
  );
};

interface ProgressWithStepsProps {
  currentStep: number;
  totalSteps: number;
  steps: string[];
  className?: string;
}

export const ProgressWithSteps = ({ 
  currentStep, 
  totalSteps, 
  steps, 
  className 
}: ProgressWithStepsProps) => {
  const progress = (currentStep / totalSteps) * 100;

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">
          Step {currentStep} of {totalSteps}
        </span>
        <span className="font-medium">{Math.round(progress)}%</span>
      </div>
      
      <Progress value={progress} className="h-2" />
      
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
        {steps.map((step, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0.5 }}
            animate={{ 
              opacity: index < currentStep ? 1 : index === currentStep ? 0.8 : 0.5,
              color: index < currentStep ? 'rgb(34, 197, 94)' : index === currentStep ? 'rgb(59, 130, 246)' : undefined
            }}
            className={cn(
              "text-center p-2 rounded border",
              index < currentStep && "bg-green-500/10 border-green-500/20",
              index === currentStep && "bg-blue-500/10 border-blue-500/20",
              index > currentStep && "bg-muted/50 border-border/50"
            )}
          >
            {step}
          </motion.div>
        ))}
      </div>
    </div>
  );
};