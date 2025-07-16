import { useEffect, useRef, useCallback } from 'react';
import { APP_CONFIG } from '@/constants/app';

interface PerformanceMetric {
  name: string;
  duration: number;
  timestamp: number;
  metadata?: Record<string, any>;
}

interface UsePerformanceMonitorOptions {
  sampleRate?: number;
  onMetric?: (metric: PerformanceMetric) => void;
}

class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: PerformanceMetric[] = [];
  private observers: ((metric: PerformanceMetric) => void)[] = [];

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  addObserver(callback: (metric: PerformanceMetric) => void): void {
    this.observers.push(callback);
  }

  removeObserver(callback: (metric: PerformanceMetric) => void): void {
    const index = this.observers.indexOf(callback);
    if (index > -1) {
      this.observers.splice(index, 1);
    }
  }

  recordMetric(metric: PerformanceMetric): void {
    this.metrics.push(metric);
    this.observers.forEach(observer => observer(metric));
    
    // Keep only last 100 metrics to prevent memory leaks
    if (this.metrics.length > 100) {
      this.metrics = this.metrics.slice(-100);
    }
  }

  getMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }

  getAverageTime(name: string): number {
    const relevantMetrics = this.metrics.filter(m => m.name === name);
    if (relevantMetrics.length === 0) return 0;
    
    const total = relevantMetrics.reduce((sum, m) => sum + m.duration, 0);
    return total / relevantMetrics.length;
  }
}

export const usePerformanceMonitor = (options: UsePerformanceMonitorOptions = {}) => {
  const monitor = PerformanceMonitor.getInstance();
  const sampleRate = options.sampleRate ?? APP_CONFIG.PERFORMANCE_SAMPLE_RATE;
  const onMetricRef = useRef(options.onMetric);
  
  useEffect(() => {
    onMetricRef.current = options.onMetric;
  }, [options.onMetric]);

  useEffect(() => {
    const handleMetric = (metric: PerformanceMetric) => {
      if (Math.random() <= sampleRate) {
        onMetricRef.current?.(metric);
        
        // Log slow operations
        if (metric.duration > 1000) {
          console.warn(`Slow operation detected: ${metric.name} took ${metric.duration}ms`);
        }
      }
    };

    monitor.addObserver(handleMetric);
    
    return () => {
      monitor.removeObserver(handleMetric);
    };
  }, [monitor, sampleRate]);

  const measureAsync = useCallback(async <T>(
    name: string,
    operation: () => Promise<T>,
    metadata?: Record<string, any>
  ): Promise<T> => {
    const startTime = performance.now();
    
    try {
      const result = await operation();
      const duration = performance.now() - startTime;
      
      monitor.recordMetric({
        name,
        duration,
        timestamp: Date.now(),
        metadata,
      });
      
      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      
      monitor.recordMetric({
        name: `${name}_error`,
        duration,
        timestamp: Date.now(),
        metadata: { 
          ...metadata, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        },
      });
      
      throw error;
    }
  }, [monitor]);

  const measure = useCallback(<T>(
    name: string,
    operation: () => T,
    metadata?: Record<string, any>
  ): T => {
    const startTime = performance.now();
    
    try {
      const result = operation();
      const duration = performance.now() - startTime;
      
      monitor.recordMetric({
        name,
        duration,
        timestamp: Date.now(),
        metadata,
      });
      
      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      
      monitor.recordMetric({
        name: `${name}_error`,
        duration,
        timestamp: Date.now(),
        metadata: { 
          ...metadata, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        },
      });
      
      throw error;
    }
  }, [monitor]);

  const getMetrics = useCallback(() => monitor.getMetrics(), [monitor]);
  const getAverageTime = useCallback((name: string) => monitor.getAverageTime(name), [monitor]);

  return {
    measureAsync,
    measure,
    getMetrics,
    getAverageTime,
  };
};
