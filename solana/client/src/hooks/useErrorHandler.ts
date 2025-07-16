import { useState, useCallback } from 'react';
import { toast } from '@/hooks/use-toast';
import { ApiException } from '@/types/api';
import { AppError, ErrorType, ErrorSeverity, isRetryableError } from '@/types/errors';
import { ERROR_MESSAGES } from '@/constants/app';
import { useRetry } from '@/hooks/useRetry';
import { usePerformanceMonitor } from '@/hooks/usePerformanceMonitor';

interface ErrorState {
  hasError: boolean;
  error: string | null;
  errorCode?: string;
  errorDetails?: any;
  severity?: ErrorSeverity;
  retry?: boolean;
}

interface UseErrorHandlerReturn {
  error: ErrorState;
  handleError: (error: unknown) => void;
  clearError: () => void;
  retryWithHandler: <T>(fn: () => Promise<T>) => Promise<T | null>;
  isRetrying: boolean;
}

export const useErrorHandler = (): UseErrorHandlerReturn => {
  const [error, setError] = useState<ErrorState>({
    hasError: false,
    error: null,
  });

  const { executeWithRetry, retryState } = useRetry({
    onRetry: (retryCount) => {
      toast({
        title: 'Retrying...',
        description: `Attempt ${retryCount} of 3`,
      });
    },
    onMaxRetriesReached: (error) => {
      toast({
        variant: 'destructive',
        title: 'Operation Failed',
        description: `${error.message} (Maximum retries reached)`,
      });
    },
  });

  const { measureAsync } = usePerformanceMonitor();

  const handleError = useCallback((error: unknown) => {
    console.error('Error caught by handler:', error);

    let errorMessage = 'An unexpected error occurred';
    let errorCode: string | undefined;
    let errorDetails: any;
    let severity = ErrorSeverity.MEDIUM;
    let retry = true;

    if (error instanceof AppError) {
      errorMessage = error.message;
      errorCode = error.code;
      errorDetails = error.metadata;
      severity = error.severity;
      retry = error.retry;
    } else if (error instanceof ApiException) {
      errorMessage = error.message;
      errorCode = error.code;
      errorDetails = error.details;
      severity = ErrorSeverity.HIGH;
    } else if (error instanceof Error) {
      errorMessage = error.message;
      // Determine error type and severity based on message
      if (error.message.toLowerCase().includes('network')) {
        severity = ErrorSeverity.HIGH;
      } else if (error.message.toLowerCase().includes('validation')) {
        severity = ErrorSeverity.MEDIUM;
        retry = false;
      }
    } else if (typeof error === 'string') {
      errorMessage = error;
    }

    // Set error state
    setError({
      hasError: true,
      error: errorMessage,
      errorCode,
      errorDetails,
      severity,
      retry,
    });

    // Show toast notification with appropriate variant
    const variant = severity === ErrorSeverity.CRITICAL || severity === ErrorSeverity.HIGH 
      ? 'destructive' 
      : 'default';

    toast({
      variant,
      title: 'Error',
      description: errorMessage,
    });
  }, []);

  const clearError = useCallback(() => {
    setError({
      hasError: false,
      error: null,
    });
  }, []);

  const retryWithHandler = useCallback(async <T>(fn: () => Promise<T>): Promise<T | null> => {
    try {
      clearError();
      return await measureAsync('retryOperation', fn);
    } catch (error) {
      handleError(error);
      return null;
    }
  }, [handleError, clearError, measureAsync]);

  return {
    error,
    handleError,
    clearError,
    retryWithHandler,
    isRetrying: retryState.isRetrying,
  };
};