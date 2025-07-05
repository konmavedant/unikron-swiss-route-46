import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import swapRoutes from './routes/swap';
import { errorHandler } from './middleware/errorHandler';
import { validateEnvironment, config } from './config/env';
import { logger } from './utils/logger';
import { createRateLimiter } from './middleware/rateLimiter';
import { healthCheck } from './services/solanaService';

// Validate environment before starting
try {
  validateEnvironment();
} catch (error) {
  logger.error('Environment validation failed', error as Error);
  process.exit(1);
}

const app = express();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

// Compression
app.use(compression());

// CORS configuration
app.use(cors({
  origin: config.frontendUrl,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Global rate limiting
app.use(createRateLimiter());

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info(`${req.method} ${req.path}`, {
      status: res.statusCode,
      duration: `${duration}ms`,
      userAgent: req.get('User-Agent'),
      ip: req.ip
    });
  });
  
  next();
});

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    const isHealthy = await healthCheck();
    res.json({
      status: isHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      environment: config.nodeEnv,
      uptime: process.uptime()
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Health check failed'
    });
  }
});

// API info endpoint
app.get('/api/info', (req, res) => {
  res.json({
    name: 'UNIKRON Backend API',
    version: '1.0.0',
    description: 'Off-chain API for swap route discovery and intent management',
    endpoints: {
      '/health': 'Health check',
      '/api/info': 'API information',
      '/swap/quote': 'Get swap quotes from Jupiter',
      '/swap/intent': 'Generate trade intent',
      '/swap/commit': 'Commit trade intent',
      '/swap/reveal': 'Reveal and execute trade',
      '/swap/status/[hash]': 'Get intent status',
      '/swap/recover/[sessionId]': 'Recover session'
    }
  });
});

// Main API routes - FIXED: Use proper route mounting
app.use('/swap', swapRoutes);

// 404 handler for unmatched routes
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Route not found',
    path: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString()
  });
});

// Global error handler (must be last)
app.use(errorHandler as any);

// Graceful shutdown handling
const gracefulShutdown = (signal: string) => {
  logger.info(`Received ${signal}, starting graceful shutdown...`);
  
  server.close((error) => {
    if (error) {
      logger.error('Error during server shutdown', error);
      process.exit(1);
    }
    
    logger.info('Server closed successfully');
    process.exit(0);
  });
  
  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 30000);
};

const server = app.listen(config.port, () => {
  logger.info(`🚀 UNIKRON backend listening on port ${config.port}`);
  logger.info(`📊 Health check available at http://localhost:${config.port}/health`);
  logger.info(`📚 API info available at http://localhost:${config.port}/api/info`);
  logger.info(`🌍 Environment: ${config.nodeEnv}`);
});

// Handle graceful shutdown
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

export default app;