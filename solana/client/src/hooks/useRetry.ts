import { useState, useCallback } from 'react';
import { AppError, ErrorType, ErrorSeverity, isRetryableError } from '@/types/errors';
import { RETRY_CONFIG } from '@/constants/app';
import { useToast } from '@/hooks/use-toast';

interface RetryState {
  isRetrying: boolean;
  retryCount: number;
  lastError: AppError | null;
}

interface UseRetryOptions {
  maxRetries?: number;
  baseDelay?: number;
  maxDelay?: number;
  backoffMultiplier?: number;
  onRetry?: (retryCount: number) => void;
  onMaxRetriesReached?: (error: AppError) => void;
}

export const useRetry = (options: UseRetryOptions = {}) => {
  const { toast } = useToast();
  const [retryState, setRetryState] = useState<RetryState>({
    isRetrying: false,
    retryCount: 0,
    lastError: null,
  });

  const config = {
    maxRetries: options.maxRetries ?? RETRY_CONFIG.maxRetries,
    baseDelay: options.baseDelay ?? RETRY_CONFIG.baseDelay,
    maxDelay: options.maxDelay ?? RETRY_CONFIG.maxDelay,
    backoffMultiplier: options.backoffMultiplier ?? RETRY_CONFIG.backoffMultiplier,
  };

  const calculateDelay = (retryCount: number): number => {
    const delay = config.baseDelay * Math.pow(config.backoffMultiplier, retryCount);
    return Math.min(delay, config.maxDelay);
  };

  const executeWithRetry = useCallback(async <T>(
    operation: () => Promise<T>,
    operationName: string = 'Operation'
  ): Promise<T> => {
    let lastError: AppError;
    
    for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
      try {
        if (attempt > 0) {
          setRetryState(prev => ({ ...prev, isRetrying: true, retryCount: attempt }));
          
          const delay = calculateDelay(attempt - 1);
          await new Promise(resolve => setTimeout(resolve, delay));
          
          options.onRetry?.(attempt);
          
          toast({
            title: `Retrying ${operationName}`,
            description: `Attempt ${attempt} of ${config.maxRetries}`,
          });
        }

        const result = await operation();
        
        // Success - reset retry state
        setRetryState({ isRetrying: false, retryCount: 0, lastError: null });
        
        if (attempt > 0) {
          toast({
            title: `${operationName} Successful`,
            description: `Succeeded after ${attempt} retries`,
          });
        }
        
        return result;
      } catch (error) {
        const appError = error instanceof AppError 
          ? error 
          : new AppError({
              type: ErrorType.UNKNOWN_ERROR,
              severity: ErrorSeverity.MEDIUM,
              message: error instanceof Error ? error.message : 'Unknown error occurred',
            });

        lastError = appError;
        setRetryState(prev => ({ ...prev, lastError: appError }));

        // Don't retry if error is not retryable or we've reached max retries
        if (!isRetryableError(appError) || attempt === config.maxRetries) {
          setRetryState(prev => ({ ...prev, isRetrying: false }));
          
          if (attempt === config.maxRetries) {
            options.onMaxRetriesReached?.(appError);
            
            toast({
              variant: 'destructive',
              title: `${operationName} Failed`,
              description: `Failed after ${config.maxRetries} retries: ${appError.message}`,
            });
          }
          
          throw appError;
        }
      }
    }

    throw lastError!;
  }, [config, options, toast]);

  const reset = useCallback(() => {
    setRetryState({ isRetrying: false, retryCount: 0, lastError: null });
  }, []);

  return {
    executeWithRetry,
    retryState,
    reset,
  };
};