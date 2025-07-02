import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  logger.error('Request failed', {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    body: req.body
  });
  
  // Validation errors
  if (err.name === 'ValidationError' || err.message.includes('validation')) {
    return res.status(400).json({ 
      error: 'Validation failed', 
      details: err.message 
    });
  }
  
  // Jupiter API errors
  if (err.message.includes('Jupiter')) {
    return res.status(502).json({ 
      error: 'Quote service unavailable', 
      details: err.message 
    });
  }
  
  // Solana RPC errors
  if (err.message.includes('RPC') || err.message.includes('Connection')) {
    return res.status(503).json({ 
      error: 'Blockchain service unavailable', 
      details: 'Unable to connect to Solana network' 
    });
  }
  
  // Database errors
  if (err.message.includes('Prisma') || err.message.includes('database')) {
    return res.status(500).json({ 
      error: 'Database error', 
      details: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
    });
  }
  
  // Default error
  res.status(500).json({ 
    error: 'Internal server error', 
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong',
    timestamp: new Date().toISOString()
  });
};