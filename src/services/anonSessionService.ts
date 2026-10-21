/**
 * Anonymous Session Service
 * Manages anonymous user sessions for accessing Flash AI without login
 */

const ANON_SESSION_KEY = 'flash_anon_session';
const ANON_SESSION_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours

export interface AnonSession {
  id: string;
  createdAt: number;
  expiresAt: number;
  dailyCreditsUsed: number;
  lastResetDate: string;
}

/**
 * Get or create an anonymous session
 */
export function getOrCreateAnonSession(): AnonSession {
  try {
    const stored = localStorage.getItem(ANON_SESSION_KEY);
    if (stored) {
      const session: AnonSession = JSON.parse(stored);
      // Check if expired
      if (Date.now() < session.expiresAt) {
        // Check if we need to reset daily credits
        const today = new Date().toISOString().split('T')[0];
        if (session.lastResetDate !== today) {
          session.dailyCreditsUsed = 0;
          session.lastResetDate = today;
          localStorage.setItem(ANON_SESSION_KEY, JSON.stringify(session));
        }
        return session;
      }
    }
  } catch {
    // Continue if localStorage is unavailable
  }

  // Create new session
  const now = Date.now();
  const session: AnonSession = {
    id: `anon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    createdAt: now,
    expiresAt: now + ANON_SESSION_EXPIRY,
    dailyCreditsUsed: 0,
    lastResetDate: new Date().toISOString().split('T')[0],
  };

  try {
    localStorage.setItem(ANON_SESSION_KEY, JSON.stringify(session));
  } catch {
    // Continue if localStorage is unavailable
  }

  return session;
}

/**
 * Get the current anonymous session (or null if not available)
 */
export function getCurrentAnonSession(): AnonSession | null {
  try {
    const stored = localStorage.getItem(ANON_SESSION_KEY);
    if (stored) {
      const session: AnonSession = JSON.parse(stored);
      if (Date.now() < session.expiresAt) {
        return session;
      }
    }
  } catch {
    // Continue if localStorage is unavailable
  }
  return null;
}

/**
 * Track credit usage for anonymous user
 */
export function trackAnonCredits(creditsUsed: number): void {
  try {
    const session = getCurrentAnonSession();
    if (session) {
      session.dailyCreditsUsed += creditsUsed;
      localStorage.setItem(ANON_SESSION_KEY, JSON.stringify(session));
    }
  } catch {
    // Continue if localStorage is unavailable
  }
}

/**
 * Get remaining daily credits for anonymous user
 * Default: 5 credits per day for anonymous users
 */
export function getAnonRemainingCredits(): number {
  const ANON_DAILY_LIMIT = 5;
  const session = getCurrentAnonSession();
  if (!session) return ANON_DAILY_LIMIT;
  return Math.max(0, ANON_DAILY_LIMIT - session.dailyCreditsUsed);
}

/**
 * Check if anonymous user has enough credits
 */
export function hasAnonCredits(required: number = 1): boolean {
  return getAnonRemainingCredits() >= required;
}

/**
 * Clear anonymous session
 */
export function clearAnonSession(): void {
  try {
    localStorage.removeItem(ANON_SESSION_KEY);
  } catch {
    // Continue if localStorage is unavailable
  }
}
