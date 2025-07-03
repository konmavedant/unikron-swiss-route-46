// services/queueService.ts - Simplified in-memory queue implementation

import { logger } from '../utils/logger';
import prisma from '../db/prisma';

// Job data interfaces
interface RevealJobData {
  intentHash: string;
  delaySeconds?: number;
  maxRetries?: number;
  createdAt: number;
  scheduledFor: number;
  retryCount: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
}

// In-memory job storage
const jobQueue: Map<string, RevealJobData> = new Map();
const processingJobs: Set<string> = new Set();

// Process jobs every 5 seconds
const PROCESS_INTERVAL = 5000;
let processingInterval: NodeJS.Timeout | null = null;

/**
 * Simple in-memory queue service for reveal jobs
 */
export class QueueService {
  /**
   * Add reveal job to queue
   */
  static async queueReveal(
    intentHash: string, 
    options: {
      delaySeconds?: number;
      maxRetries?: number;
    } = {}
  ): Promise<string> {
    try {
      const now = Date.now();
      const jobId = `${intentHash}-${now}`;
      
      const job: RevealJobData = {
        intentHash,
        delaySeconds: options.delaySeconds || 0,
        maxRetries: options.maxRetries || 3,
        createdAt: now,
        scheduledFor: now + ((options.delaySeconds || 0) * 1000),
        retryCount: 0,
        status: 'pending'
      };

      jobQueue.set(jobId, job);

      // Start processing if not already running
      if (!processingInterval) {
        this.startProcessing();
      }

      logger.info('Reveal job queued', { 
        intentHash, 
        jobId,
        scheduledFor: new Date(job.scheduledFor).toISOString()
      });

      return jobId;
    } catch (error) {
      logger.error('Failed to queue reveal job', { 
        intentHash, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      throw error;
    }
  }

  /**
   * Cancel reveal job
   */
  static async cancelReveal(intentHash: string): Promise<boolean> {
    try {
      let cancelled = false;
      
      for (const [jobId, job] of jobQueue.entries()) {
        if (job.intentHash === intentHash && job.status === 'pending') {
          jobQueue.delete(jobId);
          cancelled = true;
          logger.info('Reveal job cancelled', { intentHash, jobId });
        }
      }

      return cancelled;
    } catch (error) {
      logger.error('Failed to cancel reveal job', { 
        intentHash, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      return false;
    }
  }

  /**
   * Get queue statistics
   */
  static async getQueueStats() {
    try {
      const stats = {
        total: jobQueue.size,
        pending: 0,
        processing: processingJobs.size,
        completed: 0,
        failed: 0
      };

      for (const job of jobQueue.values()) {
        if (job.status === 'pending') stats.pending++;
        else if (job.status === 'completed') stats.completed++;
        else if (job.status === 'failed') stats.failed++;
      }

      return stats;
    } catch (error) {
      logger.error('Failed to get queue stats', { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      throw error;
    }
  }

  /**
   * Start processing jobs
   */
  private static startProcessing() {
    if (processingInterval) return;

    processingInterval = setInterval(async () => {
      await this.processJobs();
    }, PROCESS_INTERVAL);

    logger.info('Queue processing started');
  }

  /**
   * Stop processing jobs
   */
  static stopProcessing() {
    if (processingInterval) {
      clearInterval(processingInterval);
      processingInterval = null;
      logger.info('Queue processing stopped');
    }
  }

  /**
   * Process pending jobs
   */
  private static async processJobs() {
    const now = Date.now();
    
    for (const [jobId, job] of jobQueue.entries()) {
      // Skip if not ready or already processing
      if (job.status !== 'pending' || 
          job.scheduledFor > now || 
          processingJobs.has(jobId)) {
        continue;
      }

      // Process job
      processingJobs.add(jobId);
      job.status = 'processing';

      try {
        await this.processRevealJob(job);
        job.status = 'completed';
        
        // Remove completed jobs after 1 hour
        setTimeout(() => {
          jobQueue.delete(jobId);
        }, 60 * 60 * 1000);
        
      } catch (error) {
        job.retryCount++;
        
        if (job.retryCount >= (job.maxRetries ?? 3)) {
          job.status = 'failed';
          logger.error('Job failed after max retries', { 
            jobId, 
            intentHash: job.intentHash,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        } else {
          job.status = 'pending';
          job.scheduledFor = now + (job.retryCount * 30000); // Exponential backoff
          logger.warn('Job failed, scheduling retry', { 
            jobId, 
            intentHash: job.intentHash,
            retryCount: job.retryCount,
            nextRetry: new Date(job.scheduledFor).toISOString()
          });
        }
      } finally {
        processingJobs.delete(jobId);
      }
    }
  }

  /**
   * Process a single reveal job
   */
  private static async processRevealJob(job: RevealJobData) {
    logger.info('Processing reveal job', { 
      intentHash: job.intentHash, 
      delaySeconds: job.delaySeconds 
    });

    try {
      // Check if intent is still in committed state
      const intent = await prisma.tradeIntent.findUnique({
        where: { intentHash: job.intentHash },
        include: { 
          swapCommit: true, 
          swapReveal: true 
        }
      });

      if (!intent) {
        throw new Error(`Intent not found: ${job.intentHash}`);
      }

      if (!intent.swapCommit) {
        throw new Error(`Intent not committed yet: ${job.intentHash}`);
      }

      if (intent.swapReveal) {
        logger.info('Intent already revealed, skipping', { 
          intentHash: job.intentHash, 
          revealTx: intent.swapReveal.revealTx 
        });
        return;
      }

      // Check if intent has expired
      const now = new Date();
      if (intent.expiry < now) {
        logger.warn('Intent expired, cannot reveal', { 
          intentHash: job.intentHash, 
          expiry: intent.expiry,
          now 
        });
        
        // Update status to expired
        await prisma.tradeIntent.update({
          where: { intentHash: job.intentHash },
          data: { status: 'expired' }
        });
        
        throw new Error(`Intent expired: ${job.intentHash}`);
      }

      // In a real implementation, this would trigger the actual reveal
      // For now, we just log that the intent is ready for reveal
      logger.info('Intent ready for reveal', { 
        intentHash: job.intentHash,
        expiry: intent.expiry.toISOString()
      });

      // Update status to indicate ready for reveal
      await prisma.tradeIntent.update({
        where: { intentHash: job.intentHash },
        data: { status: 'ready_for_reveal' }
      });

    } catch (error) {
      logger.error('Reveal job processing failed', { 
        intentHash: job.intentHash, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      throw error;
    }
  }

  /**
   * Clear all completed and failed jobs
   */
  static async clearJobs(): Promise<void> {
    try {
      let cleared = 0;
      
      for (const [jobId, job] of jobQueue.entries()) {
        if (job.status === 'completed' || job.status === 'failed') {
          jobQueue.delete(jobId);
          cleared++;
        }
      }

      logger.info('Jobs cleared', { count: cleared });
    } catch (error) {
      logger.error('Failed to clear jobs', { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      throw error;
    }
  }

  /**
   * Health check for queue system
   */
  static async healthCheck(): Promise<boolean> {
    try {
      const stats = await this.getQueueStats();
      return stats.total < 10000; // Healthy if less than 10k jobs
    } catch (error) {
      logger.error('Queue health check failed', { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      return false;
    }
  }
}

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('Shutting down queue service...');
  QueueService.stopProcessing();
  logger.info('Queue service shut down');
});

process.on('SIGINT', () => {
  logger.info('Shutting down queue service...');
  QueueService.stopProcessing();
  logger.info('Queue service shut down');
});

export default QueueService;