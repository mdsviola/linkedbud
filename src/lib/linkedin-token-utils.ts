/**
 * Utility functions for LinkedIn token management
 */

/**
 * Normalize date string to ISO format for reliable parsing
 * Handles PostgreSQL timestamp format (2025-11-11 13:07:48+00) and converts to ISO
 */
function normalizeDateString(dateString: string): string {
  // If already in ISO format (contains 'T'), return as-is
  if (dateString.includes('T')) {
    return dateString;
  }

  // Convert PostgreSQL format (2025-11-11 13:07:48+00) to ISO format
  // Replace space with 'T'
  let normalized = dateString.replace(' ', 'T');

  // Handle timezone formats: +00 -> +00:00, -05 -> -05:00
  // Match timezone at the end: +00, -05, etc.
  const timezoneMatch = normalized.match(/([+-])(\d{2})$/);
  if (timezoneMatch) {
    normalized = normalized.replace(/([+-]\d{2})$/, `${timezoneMatch[1]}${timezoneMatch[2]}:00`);
  }

  // If no timezone indicator, assume UTC
  if (!normalized.includes('+') && !normalized.includes('-') && !normalized.endsWith('Z')) {
    // Check if there's already a timezone by looking for the pattern
    if (!normalized.match(/[+-]\d{2}:\d{2}$/)) {
      normalized += 'Z';
    }
  }

  return normalized;
}

/**
 * Check if a LinkedIn token is about to expire (within 5 days)
 * @param tokenExpiresAt - ISO string of when the token expires
 * @returns true if token expires within 5 days (including today) or is already expired
 */
export function isTokenExpiringSoon(tokenExpiresAt: string | null): boolean {
  if (!tokenExpiresAt) {
    return false;
  }

  try {
    const normalizedDate = normalizeDateString(tokenExpiresAt);
    const now = new Date();
    const expiresAt = new Date(normalizedDate);

    // Check if date parsing was successful
    if (isNaN(expiresAt.getTime())) {
      console.error("[LinkedIn Token] Invalid date format:", tokenExpiresAt);
      return false;
    }

    const timeDiff = expiresAt.getTime() - now.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));

    // Show modal if token expires within 5 days (including today) or is already expired
    // daysDiff <= 5 covers: expired (negative), today (0), and 1-5 days in future
    const isExpiringSoon = daysDiff <= 5;

    return isExpiringSoon;
  } catch (error) {
    console.error("[LinkedIn Token] Error checking expiration:", error, tokenExpiresAt);
    return false;
  }
}

/**
 * Get the number of days until token expiration
 * @param tokenExpiresAt - ISO string of when the token expires
 * @returns number of days until expiration (negative if expired, 0 if expires today, positive if in future)
 */
export function getDaysUntilExpiration(tokenExpiresAt: string | null): number {
  if (!tokenExpiresAt) {
    return 0;
  }

  try {
    const normalizedDate = normalizeDateString(tokenExpiresAt);
    const now = new Date();
    const expiresAt = new Date(normalizedDate);

    // Check if date parsing was successful
    if (isNaN(expiresAt.getTime())) {
      console.error("[LinkedIn Token] Invalid date format:", tokenExpiresAt);
      return 0;
    }

    const timeDiff = expiresAt.getTime() - now.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));

    // Return the actual days difference (can be negative for expired tokens)
    // This allows the UI to distinguish between expired, expires today, and expires in future
    return daysDiff;
  } catch (error) {
    console.error("[LinkedIn Token] Error calculating days until expiration:", error, tokenExpiresAt);
    return 0;
  }
}

/**
 * Check if a token is already expired
 * @param tokenExpiresAt - ISO string of when the token expires
 * @returns true if token is expired or invalid
 */
export function isTokenExpired(tokenExpiresAt: string | null): boolean {
  if (!tokenExpiresAt) {
    return true;
  }

  const now = new Date();
  const expiresAt = new Date(tokenExpiresAt);

  return now.getTime() >= expiresAt.getTime();
}
