/**
 * Shared email types and interfaces
 * Works in both Node.js (Next.js) and Deno (Edge Functions) environments
 */

export interface EmailRecipient {
  email: string;
  name?: string | null;
}

/**
 * Get recipient name from email or provided name
 */
export function getRecipientName(email: string, name?: string | null): string {
  return name || email.split("@")[0] || "there";
}



