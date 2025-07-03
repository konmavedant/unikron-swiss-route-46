// utils/sessionUtils.ts - Simplified Session Storage Utilities

import { logger } from './logger';
import { TradeIntent } from '../types/TradeIntent';

interface SessionData {
  intent: TradeIntent;
  hash: string;
  route: any;
  timestamp: number;
  expiresAt: number;
}

// In-memory storage for session data
const sessionStore: Map<string, SessionData> = new Map();

// Session expiry time (1 hour)
const SESSION_EXPIRY_MS = 60 * 60 * 1000;

// Clean up expired sessions every 15 minutes
const CLEANUP_INTERVAL = 15 * 60 * 1000;

let cleanupInterval: NodeJS.Timeout | null = null;

/**
 * Start automatic cleanup of expired sessions
 */
function startCleanup() {
  if (cleanupInterval) return;
  
  cleanupInterval = setInterval(() => {
    cleanupExpiredSessions();
  }, CLEANUP_INTERVAL);
}

/**
 * Clean up expired sessions
 */
function cleanupExpiredSessions() {
  const now = Date.now();
  let cleaned = 0;
  
  for (const [sessionId, sessionData] of sessionStore.entries()) {
    if (now > sessionData.expiresAt) {
      sessionStore.delete(sessionId);
      cleaned++;
    }
  }
  
  if (cleaned > 0) {
    logger.info('Cleaned up expired sessions', { count: cleaned });
  }
}

/**
 * Save intent data to session for frontend recovery
 */
export async function saveIntentToSession(
  sessionId: string,
  data: { intent: TradeIntent; hash: string; route: any }
): Promise<boolean> {
  try {
    if (!sessionId || !data.intent || !data.hash) {
      throw new Error('Session ID, intent, and hash are required');
    }

    const now = Date.now();
    const sessionData: SessionData = {
      intent: data.intent,
      hash: data.hash,
      route: data.route,
      timestamp: now,
      expiresAt: now + SESSION_EXPIRY_MS
    };

    sessionStore.set(sessionId, sessionData);

    // Start cleanup if not already running
    if (!cleanupInterval) {
      startCleanup();
    }

    logger.info('Intent saved to session', {
      sessionId,
      intentHash: data.hash,
      expiresAt: new Date(sessionData.expiresAt).toISOString()
    });

    return true;
  } catch (error) {
    logger.error('Failed to save intent to session', {
      error: error instanceof Error ? error.message : 'Unknown error',
      sessionId
    });
    return false;
  }
}

/**
 * Retrieve intent data from session
 */
export async function getIntentFromSession(sessionId: string): Promise<SessionData | null> {
  try {
    const sessionData = sessionStore.get(sessionId);
    
    if (!sessionData) {
      logger.warn('Session not found', { sessionId });
      return null;
    }

    // Check if session has expired
    if (Date.now() > sessionData.expiresAt) {
      logger.warn('Session expired', { 
        sessionId, 
        expiredAt: new Date(sessionData.expiresAt).toISOString() 
      });
      sessionStore.delete(sessionId);
      return null;
    }

    logger.info('Intent retrieved from session', {
      sessionId,
      intentHash: sessionData.hash
    });

    return sessionData;
  } catch (error) {
    logger.error('Failed to retrieve intent from session', {
      error: error instanceof Error ? error.message : 'Unknown error',
      sessionId
    });
    return null;
  }
}

/**
 * Remove intent from session
 */
export async function removeIntentFromSession(sessionId: string): Promise<boolean> {
  try {
    const existed = sessionStore.has(sessionId);
    if (existed) {
      sessionStore.delete(sessionId);
      logger.info('Intent removed from session', { sessionId });
    }
    return existed;
  } catch (error) {
    logger.error('Failed to remove intent from session', {
      error: error instanceof Error ? error.message : 'Unknown error',
      sessionId
    });
    return false;
  }
}

/**
 * Update session data
 */
export async function updateSessionData(
  sessionId: string,
  updates: Partial<Pick<SessionData, 'intent' | 'hash' | 'route'>>
): Promise<boolean> {
  try {
    const existingSession = sessionStore.get(sessionId);
    
    if (!existingSession) {
      logger.warn('Cannot update non-existent session', { sessionId });
      return false;
    }

    // Check if session has expired
    if (Date.now() > existingSession.expiresAt) {
      logger.warn('Cannot update expired session', { sessionId });
      sessionStore.delete(sessionId);
      return false;
    }

    // Update session data
    const updatedSession: SessionData = {
      ...existingSession,
      ...updates,
      timestamp: Date.now() // Update timestamp
    };
    
    sessionStore.set(sessionId, updatedSession);

    logger.info('Session updated', { sessionId });
    return true;
  } catch (error) {
    logger.error('Failed to update session', {
      error: error instanceof Error ? error.message : 'Unknown error',
      sessionId
    });
    return false;
  }
}

/**
 * Get all active sessions for a user
 */
export async function getUserSessions(userWallet: string): Promise<{ sessionId: string; data: SessionData }[]> {
  try {
    const userSessions: { sessionId: string; data: SessionData }[] = [];
    
    for (const [sessionId, sessionData] of sessionStore.entries()) {
      // Check if session hasn't expired and belongs to the user
      if (Date.now() <= sessionData.expiresAt && sessionData.intent.user === userWallet) {
        userSessions.push({ sessionId, data: sessionData });
      }
    }

    logger.info('Retrieved user sessions', { 
      userWallet, 
      sessionCount: userSessions.length 
    });

    return userSessions;
  } catch (error) {
    logger.error('Failed to get user sessions', {
      error: error instanceof Error ? error.message : 'Unknown error',
      userWallet
    });
    return [];
  }
}

/**
 * Get session statistics
 */
export async function getSessionStats() {
  try {
    const now = Date.now();
    let active = 0;
    let expired = 0;
    
    for (const sessionData of sessionStore.values()) {
      if (now <= sessionData.expiresAt) {
        active++;
      } else {
        expired++;
      }
    }
    
    return {
      total: sessionStore.size,
      active,
      expired
    };
  } catch (error) {
    logger.error('Failed to get session stats', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    return { total: 0, active: 0, expired: 0 };
  }
}

/**
 * Clear all sessions
 */
export async function clearAllSessions(): Promise<void> {
  try {
    const count = sessionStore.size;
    sessionStore.clear();
    logger.info('All sessions cleared', { count });
  } catch (error) {
    logger.error('Failed to clear sessions', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

// Graceful shutdown
process.on('SIGTERM', () => {
  if (cleanupInterval) {
    clearInterval(cleanupInterval);
    cleanupInterval = null;
  }
});

process.on('SIGINT', () => {
  if (cleanupInterval) {
    clearInterval(cleanupInterval);
    cleanupInterval = null;
  }
});