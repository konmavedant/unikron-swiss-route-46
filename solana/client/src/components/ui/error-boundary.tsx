import React, { ReactNode, useEffect, useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, RefreshCw, Wifi, WifiOff, Activity } from "lucide-react";
import { useAppStore } from '@/store/app';
import { cn } from '@/lib/utils';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: any) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: any;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error, errorInfo: null };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    this.setState({ error, errorInfo });
    this.props.onError?.(error, errorInfo);
    
    // Log to external service in production
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <Card className="w-full max-w-md mx-auto mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-5 h-5" />
              Something went wrong
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <AlertDescription>
              The application encountered an unexpected error. Please try refreshing the page.
            </AlertDescription>
            
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="text-xs text-muted-foreground">
                <summary className="cursor-pointer">Error Details</summary>
                <pre className="mt-2 p-2 bg-secondary rounded text-xs overflow-auto">
                  {this.state.error.toString()}
                </pre>
              </details>
            )}
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => window.location.reload()}
                className="flex-1"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh Page
              </Button>
              <Button
                variant="outline"
                onClick={() => this.setState({ hasError: false, error: null, errorInfo: null })}
                className="flex-1"
              >
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      );
    }

    return this.props.children;
  }
}

interface NetworkStatusProps {
  className?: string;
}

export const NetworkStatus = ({ className }: NetworkStatusProps) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const { network } = useAppStore();

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline && network.apiHealth === 'healthy') {
    return null; // Don't show anything when everything is working
  }

  return (
    <Alert className={cn("mb-4", className)} variant={isOnline ? "default" : "destructive"}>
      <div className="flex items-center gap-2">
        {isOnline ? (
          <>
            <Activity className="w-4 h-4" />
            <AlertTitle>API Issues Detected</AlertTitle>
          </>
        ) : (
          <>
            <WifiOff className="w-4 h-4" />
            <AlertTitle>No Internet Connection</AlertTitle>
          </>
        )}
      </div>
      <AlertDescription className="mt-2">
        {isOnline 
          ? "Some features may be unavailable due to API connectivity issues. Using cached data where possible."
          : "Please check your internet connection. The app will work with limited functionality."
        }
      </AlertDescription>
    </Alert>
  );
};

interface ApiErrorProps {
  error: Error | null;
  onRetry?: () => void;
  className?: string;
}

export const ApiError = ({ error, onRetry, className }: ApiErrorProps) => {
  if (!error) return null;

  return (
    <Alert variant="destructive" className={className}>
      <AlertTriangle className="w-4 h-4" />
      <AlertTitle>API Error</AlertTitle>
      <AlertDescription className="mt-2">
        {error.message || 'An unexpected error occurred while fetching data.'}
        {onRetry && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onRetry}
            className="mt-2 w-full"
          >
            <RefreshCw className="w-4 h-4" />
            Retry
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
};

interface LoadingOverlayProps {
  isLoading: boolean;
  message?: string;
  className?: string;
}

export const LoadingOverlay = ({ isLoading, message, className }: LoadingOverlayProps) => {
  if (!isLoading) return null;

  return (
    <div className={cn(
      "fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center",
      className
    )}>
      <Card className="w-full max-w-sm mx-4">
        <CardContent className="flex flex-col items-center justify-center p-6">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4" />
          <p className="text-center text-muted-foreground">
            {message || 'Loading...'}
          </p>
        </CardContent>
      </Card>
    </div>
  );
};