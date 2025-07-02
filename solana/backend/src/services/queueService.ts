// services/queueService.ts - Webhook relay queue implementation

import Bull, { Queue, Job } from 'bull';
import axios from 'axios';
import { logger } from '../utils/logger';
import { config } from '../config/env';
import prisma from '../db/prisma';

// Job data interfaces
interface RevealJobData {
  intentHash: string;
  webhookUrl?: string;
  maxRetries?: number;
  delaySeconds?: number;
}

interface WebhookPayload {
  intentHash: string;
  status: string;
  timestamp: string;
  action: 'reveal_ready';
}

// Initialize Redis connection and queue
const redisConfig = {
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD,
    db: parseInt(process.env.REDIS_DB || '0'),
  },
  defaultJobOptions: {
    removeOnComplete: 100, // Keep last 100 completed jobs
    removeOnFail: 50,      // Keep last 50 failed jobs
    attempts: 3,           // Retry failed jobs 3 times
    backoff: {
      type: 'exponential',
      delay: 2000,         // Start with 2 second delay
    },
  },
};

// Create queues
export const revealQueue: Queue<RevealJobData> = new Bull('reveal-queue', redisConfig);
export const webhookQueue: Queue<WebhookPayload> = new Bull('webhook-queue', redisConfig);

// Process reveal jobs
revealQueue.process('reveal-intent', async (job: Job<RevealJobData>) => {
  const { intentHash, webhookUrl, delaySeconds = 0 } = job.data;
  
  logger.info('Processing reveal job', { intentHash, jobId: job.id });

  try {
    // Wait for specified delay (useful for timing reveals)
    if (delaySeconds > 0) {
      logger.info('Delaying reveal execution', { intentHash, delaySeconds });
      await new Promise(resolve => setTimeout(resolve, delaySeconds * 1000));
    }

    // Check if intent is still in committed state
    const intent = await prisma.tradeIntent.findUnique({
      where: { intentHash },
      include: { 
        swapCommit: true, 
        swapReveal: true 
      }
    });

    if (!intent) {
      throw new Error(`Intent not found: ${intentHash}`);
    }

    if (!intent.swapCommit) {
      throw new Error(`Intent not committed yet: ${intentHash}`);
    }

    if (intent.swapReveal) {
      logger.warn('Intent already revealed, skipping', { 
        intentHash, 
        revealTx: intent.swapReveal.revealTx 
      });
      return { status: 'already_revealed', tx: intent.swapReveal.revealTx };
    }

    // Check if intent has expired
    const now = new Date();
    if (intent.expiry < now) {
      logger.warn('Intent expired, cannot reveal', { 
        intentHash, 
        expiry: intent.expiry,
        now 
      });
      
      // Update status to expired
      await prisma.tradeIntent.update({
        where: { intentHash },
        data: { status: 'expired' }
      });
      
      throw new Error(`Intent expired: ${intentHash}`);
    }

    // Trigger webhook if URL provided
    if (webhookUrl) {
      await webhookQueue.add('notify-reveal-ready', {
        intentHash,
        status: 'reveal_ready',
        timestamp: new Date().toISOString(),
        action: 'reveal_ready'
      }, {
        attempts: 2,
        delay: 1000
      });
    }

    // Note: Actual reveal execution would be handled by external relayer
    // This queue just prepares and notifies that reveal is ready
    
    logger.info('Reveal job processed successfully', { intentHash });
    
    return { 
      status: 'reveal_ready',
      intentHash,
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    logger.error('Reveal job failed', { 
      intentHash, 
      error: error instanceof Error ? error.message : 'Unknown error',
      jobId: job.id 
    });
    throw error;
  }
});

// Process webhook notifications
webhookQueue.process('notify-reveal-ready', async (job: Job<WebhookPayload>) => {
  const { intentHash, webhookUrl } = job.data as any;
  
  if (!webhookUrl) {
    logger.warn('No webhook URL provided, skipping notification', { intentHash });
    return;
  }

  try {
    logger.info('Sending webhook notification', { intentHash, webhookUrl });

    const response = await axios.post(webhookUrl, job.data, {
      timeout: 10000, // 10 second timeout
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'UNIKRON-Queue/1.0.0',
        'X-Intent-Hash': intentHash
      }
    });

    logger.info('Webhook notification sent successfully', { 
      intentHash, 
      webhookUrl, 
      status: response.status 
    });

    return { status: 'sent', response: response.status };

  } catch (error: any) {
    logger.error('Webhook notification failed', { 
      intentHash, 
      webhookUrl,
      error: error.message,
      status: error.response?.status
    });
    throw error;
  }
});

// Queue management functions
export class QueueService {
  /**
   * Add reveal job to queue
   */
  static async queueReveal(
    intentHash: string, 
    options: {
      webhookUrl?: string;
      delaySeconds?: number;
      maxRetries?: number;
    } = {}
  ): Promise<Job<RevealJobData>> {
    try {
      const job = await revealQueue.add('reveal-intent', {
        intentHash,
        ...options
      }, {
        delay: (options.delaySeconds || 0) * 1000,
        attempts: options.maxRetries || 3,
        removeOnComplete: true,
        removeOnFail: false
      });

      logger.info('Reveal job queued', { 
        intentHash, 
        jobId: job.id,
        delay: options.delaySeconds 
      });

      return job;
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
      const jobs = await revealQueue.getJobs(['waiting', 'delayed', 'active']);
      const targetJobs = jobs.filter(job => job.data.intentHash === intentHash);

      for (const job of targetJobs) {
        await job.remove();
        logger.info('Reveal job cancelled', { intentHash, jobId: job.id });
      }

      return targetJobs.length > 0;
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
      const [revealStats, webhookStats] = await Promise.all([
        {
          waiting: await revealQueue.getWaiting(),
          active: await revealQueue.getActive(),
          completed: await revealQueue.getCompleted(),
          failed: await revealQueue.getFailed(),
          delayed: await revealQueue.getDelayed()
        },
        {
          waiting: await webhookQueue.getWaiting(),
          active: await webhookQueue.getActive(),
          completed: await webhookQueue.getCompleted(),
          failed: await webhookQueue.getFailed()
        }
      ]);

      return {
        reveal: {
          waiting: revealStats.waiting.length,
          active: revealStats.active.length,
          completed: revealStats.completed.length,
          failed: revealStats.failed.length,
          delayed: revealStats.delayed.length
        },
        webhook: {
          waiting: webhookStats.waiting.length,
          active: webhookStats.active.length,
          completed: webhookStats.completed.length,
          failed: webhookStats.failed.length
        }
      };
    } catch (error) {
      logger.error('Failed to get queue stats', { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      throw error;
    }
  }

  /**
   * Clear all jobs from queues
   */
  static async clearQueues(): Promise<void> {
    try {
      await Promise.all([
        revealQueue.clean(0, 'completed'),
        revealQueue.clean(0, 'failed'),
        webhookQueue.clean(0, 'completed'),
        webhookQueue.clean(0, 'failed')
      ]);

      logger.info('Queues cleared successfully');
    } catch (error) {
      logger.error('Failed to clear queues', { 
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
      await Promise.all([
        revealQueue.isReady(),
        webhookQueue.isReady()
      ]);
      return true;
    } catch (error) {
      logger.error('Queue health check failed', { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      return false;
    }
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('Shutting down queues...');
  await Promise.all([
    revealQueue.close(),
    webhookQueue.close()
  ]);
  logger.info('Queues shut down successfully');
});

export default QueueService;