// utils/sessionUtils.ts - Session Storage Utilities for Intent Recovery

import { logger } from './logger';
import { TradeIntent } from '../types/TradeIntent';

interface SessionData {
  intent: TradeIntent;
  hash: string;
  route: any;
  timestamp: number;
  expiresAt: number;
}

interface SessionStorage {
  [sessionId: string]: SessionData;
}

// In-memory storage for session data
// In production, you'd use Redis or another persistent store
const sessionStore: SessionStorage = {};

// Session expiry time (24 hours)
const SESSION_EXPIRY_MS = 24 * 60 * 60 * 1000;

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

    sessionStore[sessionId] = sessionData;

    logger.info('Intent saved to session', {
      sessionId,
      intentHash: data.hash,
      expiresAt: new Date(sessionData.expiresAt).toISOString()
    });

    // Clean up expired sessions periodically
    // Clean up expired sessions
    Object.entries(sessionStore).forEach(([id, data]) => {
      if (Date.now() > data.expiresAt) {
        delete sessionStore[id];
      }
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
    const sessionData = sessionStore[sessionId];
    
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
      delete sessionStore[sessionId];
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
 * Remove intent from session (e.g., after successful commit)
 */
export async function removeIntentFromSession(sessionId: string): Promise<boolean> {
  try {
    if (sessionStore[sessionId]) {
      delete sessionStore[sessionId];
      logger.info('Intent removed from session', { sessionId });
      return true;
    }
    return false;
  } catch (error) {
    logger.error('Failed to remove intent from session', {
      error: error instanceof Error ? error.message : 'Unknown error',
      sessionId
    });
    return false;
  }
}

/**
 * Update session data (e.g., after signing)
 */
export async function updateSessionData(
  sessionId: string,
  updates: Partial<Pick<SessionData, 'intent' | 'hash' | 'route'>>
): Promise<boolean> {
  try {
    const existingSession = sessionStore[sessionId];
    
    if (!existingSession) {
      logger.warn('Cannot update non-existent session', { sessionId });
      return false;
    }

    // Check if session has expired
    if (Date.now() > existingSession.expiresAt) {
      logger.warn('Cannot update expired session', { sessionId });
      delete sessionStore[sessionId];
      return false;
    }

    // Update session data
    sessionStore[sessionId] = {
      ...existingSession,
      ...updates,
      timestamp: Date.now() // Update timestamp
    };

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
 * Get all active sessions for a user (by wallet address)
 */
export async function getUserSessions(userWallet: string): Promise<{ sessionId: string; data: SessionData }[]> {
  try {
    const userSessions: { sessionId: string; data: SessionData }[] = [];
    
    for (const [sessionId, sessionData] of Object.entries(sessionStore)) {
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
