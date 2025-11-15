/**
 * Shared LinkedIn utility functions
 * Works in both Node.js (Next.js) and Deno (Edge Functions) environments
 */

/**
 * Generate LinkedIn post URL for viewing the post on LinkedIn
 * @param linkedinPostId - The LinkedIn post ID (e.g., "urn:li:share:123456789" or "urn:li:ugcPost:123456789")
 * @param organizationId - Optional organization ID for organization posts
 * @returns The LinkedIn post URL
 */
export function generateLinkedInPostURL(
  linkedinPostId: string,
  organizationId?: string | null
): string {
  // Extract the numeric ID from the URN format
  // Handle both urn:li:share: and urn:li:ugcPost: formats
  const shareMatch = linkedinPostId.match(/urn:li:share:(\d+)/);
  const ugcMatch = linkedinPostId.match(/urn:li:ugcPost:(\d+)/);

  let postId: string;

  if (shareMatch) {
    postId = shareMatch[1];
  } else if (ugcMatch) {
    postId = ugcMatch[1];
  } else {
    throw new Error(`Invalid LinkedIn post ID format: ${linkedinPostId}`);
  }

  // Both personal and organization posts use the same URL format
  return `https://www.linkedin.com/feed/update/urn:li:share:${postId}/`;
}

/**
 * Check if a LinkedIn token is about to expire (within 5 days)
 * @param tokenExpiresAt - ISO string of when the token expires
 * @returns true if token expires within 5 days and is not already expired
 */
export function isTokenExpiringSoon(tokenExpiresAt: string | null): boolean {
  if (!tokenExpiresAt) {
    return false;
  }

  const now = new Date();
  const expiresAt = new Date(tokenExpiresAt);
  const timeDiff = expiresAt.getTime() - now.getTime();
  const daysDiff = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));

  return daysDiff <= 5 && daysDiff > 0;
}

/**
 * Get the number of days until token expiration
 * @param tokenExpiresAt - ISO string of when the token expires
 * @returns number of days until expiration (0 if expired or invalid)
 */
export function getDaysUntilExpiration(tokenExpiresAt: string | null): number {
  if (!tokenExpiresAt) {
    return 0;
  }

  const now = new Date();
  const expiresAt = new Date(tokenExpiresAt);
  const timeDiff = expiresAt.getTime() - now.getTime();
  const daysDiff = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));

  return Math.max(0, daysDiff);
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

/**
 * Convert a file buffer to Uint8Array (works in both Node.js and Deno)
 * Handles Buffer (Node.js) and Uint8Array (Deno) inputs
 */
export function toUint8Array(
  buffer: Buffer | Uint8Array | ArrayBuffer
): Uint8Array {
  if (buffer instanceof Uint8Array) {
    return buffer;
  }

  if (buffer instanceof ArrayBuffer) {
    return new Uint8Array(buffer);
  }

  // Handle Node.js Buffer
  // @ts-ignore - Buffer exists in Node.js but not in Deno types
  if (typeof Buffer !== "undefined" && Buffer.isBuffer(buffer)) {
    // @ts-ignore
    return new Uint8Array(buffer);
  }

  // Fallback: try to convert
  return new Uint8Array(buffer as any);
}

