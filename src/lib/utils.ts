import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Detects if the user's locale prefers 12h or 24h format
 * @returns true for 12h format (AM/PM), false for 24h format
 */
export function getLocaleHourCycle(): boolean {
  if (typeof window === "undefined") {
    // Server-side: default to 12h format
    return true;
  }

  try {
    const locale = getBrowserLocale();
    const formatter = new Intl.DateTimeFormat(locale, { hour: "numeric" });
    const options = formatter.resolvedOptions();

    // Check hourCycle if available (may not be in TypeScript types but exists at runtime)
    if ('hourCycle' in options && options.hourCycle) {
      const hourCycle = (options as any).hourCycle;
      return hourCycle === "h11" || hourCycle === "h12";
    }

    // Fallback: format a sample time and check for AM/PM
    const parts = formatter.formatToParts(new Date(2020, 0, 1, 13));
    return parts.some((part) => part.type === "dayPeriod");
  } catch {
    // Fallback to 12h format if detection fails
    return true;
  }
}

export function formatDate(date: string | Date) {
  const locale = getBrowserLocale();
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(date));
}

/**
 * Formats a date only (no time) using the user's locale preferences
 * @param date - Date string or Date object
 * @param monthStyle - 'short', 'long', or 'numeric' (default: 'short')
 * @returns Formatted date string (e.g., "Jan 15, 2024" or "15/01/2024" depending on locale)
 */
export function formatDateOnly(
  date: string | Date,
  monthStyle: "short" | "long" | "numeric" = "short"
): string {
  const dateObj = new Date(date);
  const locale = getBrowserLocale();
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: monthStyle,
    day: "numeric",
  }).format(dateObj);
}

/**
 * Formats a date and time using the user's locale preferences
 * @param date - Date string or Date object
 * @param options - Optional Intl.DateTimeFormatOptions to customize formatting
 * @returns Formatted date/time string
 */
export function formatDateTime(
  date: string | Date,
  options?: Intl.DateTimeFormatOptions
): string {
  const dateObj = new Date(date);
  const locale = getBrowserLocale();
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    ...options,
  };

  // Use browser locale to auto-detect user preferences
  return new Intl.DateTimeFormat(locale, defaultOptions).format(dateObj);
}

/**
 * Maps timezone to locale when language doesn't specify region
 * This helps users in specific regions get proper formatting even if browser language is generic
 */
const TIMEZONE_TO_LOCALE_MAP: Record<string, string> = {
  "Europe/Lisbon": "pt-PT",
  "Europe/London": "en-GB",
  "Europe/Paris": "fr-FR",
  "Europe/Berlin": "de-DE",
  "Europe/Madrid": "es-ES",
  "Europe/Rome": "it-IT",
  "Europe/Amsterdam": "nl-NL",
  "Europe/Brussels": "nl-BE",
  "Europe/Vienna": "de-AT",
  "Europe/Zurich": "de-CH",
  "America/Sao_Paulo": "pt-BR",
  "America/Mexico_City": "es-MX",
  "America/Argentina/Buenos_Aires": "es-AR",
  "America/Los_Angeles": "en-US",
  "America/New_York": "en-US",
  "America/Chicago": "en-US",
  "America/Denver": "en-US",
  "Asia/Tokyo": "ja-JP",
  "Asia/Shanghai": "zh-CN",
  "Asia/Hong_Kong": "zh-HK",
  "Asia/Singapore": "en-SG",
  "Australia/Sydney": "en-AU",
  "Australia/Melbourne": "en-AU",
  "Pacific/Auckland": "en-NZ",
};

/**
 * Gets the user's browser locale, with fallback to timezone-based detection
 * @returns The browser locale string (e.g., "pt-PT", "en-US")
 */
export function getBrowserLocale(): string | undefined {
  if (typeof window === "undefined") {
    return undefined; // Server-side: use default
  }

  // Try to get locale from browser
  // navigator.language is the primary language preference
  // navigator.languages[0] is the most preferred language
  let locale = navigator.language || navigator.languages?.[0] || undefined;

  // If locale doesn't have a region (e.g., "en" instead of "en-US"), try to infer from timezone
  if (locale && !locale.includes("-")) {
    try {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

      // Check if we have a mapping for this timezone
      const timezoneLocale = TIMEZONE_TO_LOCALE_MAP[timezone];
      if (timezoneLocale) {
        locale = timezoneLocale;
      }
    } catch {
      // Ignore timezone detection errors
    }
  }

  return locale;
}

/**
 * Formats a date and time with full details using the user's locale preferences
 * Useful for detailed timestamps (e.g., "Updated: 20/11/2025, 00:00" for Portuguese locale)
 * @param date - Date string or Date object
 * @returns Formatted date/time string with year, month, day, hour, and minute
 */
export function formatDateTimeFull(date: string | Date): string {
  const dateObj = new Date(date);
  const locale = getBrowserLocale();

  // Use toLocaleString with explicit locale detection for better locale-aware formatting
  return dateObj.toLocaleString(locale, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Formats a date and time with month name using the user's locale preferences
 * Useful for displaying scheduled dates (e.g., "November 20, 2025, 12:00 AM" or "20 de novembro de 2025, 00:00")
 * @param date - Date string or Date object
 * @returns Formatted date/time string with long month name
 */
export function formatDateTimeLong(date: string | Date): string {
  const dateObj = new Date(date);
  const locale = getBrowserLocale();
  return dateObj.toLocaleString(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Formats a short date (month and day only, no year) using the user's locale preferences
 * @param date - Date string or Date object
 * @returns Formatted short date string (e.g., "Jan 15" or "15/01" depending on locale)
 */
export function formatShortDate(date: string | Date): string {
  const dateObj = new Date(date);
  const locale = getBrowserLocale();
  return new Intl.DateTimeFormat(locale, {
    month: "short",
    day: "numeric",
  }).format(dateObj);
}

/**
 * Formats a compact date with time (compact format) using the user's locale preferences
 * Useful for badges and compact displays
 * @param date - Date string or Date object
 * @returns Formatted compact date/time string
 */
export function formatCompactDateTime(date: string | Date): string {
  const dateObj = new Date(date);
  const locale = getBrowserLocale();
  return dateObj.toLocaleString(locale, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short",
  });
}

export function formatRelativeTime(date: string | Date) {
  const now = new Date();
  const targetDate = new Date(date);
  const diffInSeconds = Math.floor(
    (now.getTime() - targetDate.getTime()) / 1000
  );

  if (diffInSeconds < 60) return "Just now";
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 2592000)
    return `${Math.floor(diffInSeconds / 86400)}d ago`;

  return formatDate(date);
}

export function generateTopicKey(title: string, url: string): string {
  // Simple hash function for topic clustering
  const normalizedTitle = title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .trim();
  const normalizedUrl = url.replace(/[?#].*$/, "").toLowerCase();

  // Create a simple hash
  let hash = 0;
  const str = normalizedTitle + normalizedUrl;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }

  return Math.abs(hash).toString(36);
}

export function normalizeUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    // Remove UTM parameters and other tracking params
    const paramsToRemove = [
      "utm_source",
      "utm_medium",
      "utm_campaign",
      "utm_term",
      "utm_content",
      "fbclid",
      "gclid",
    ];
    paramsToRemove.forEach((param) => urlObj.searchParams.delete(param));

    return urlObj.toString();
  } catch {
    return url;
  }
}

export function extractToneFromCorpus(corpus: string[]): string {
  if (!corpus || corpus.length === 0) return "expert";

  // Simple tone analysis based on common patterns
  const text = corpus.join(" ").toLowerCase();

  if (text.includes("!") && text.includes("?")) return "witty";
  if (
    text.includes("however") ||
    text.includes("but") ||
    text.includes("challenge")
  )
    return "challenger";
  if (
    text.includes("please") ||
    text.includes("thank you") ||
    text.includes("kindly")
  )
    return "formal";

  return "expert";
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + "...";
}

/**
 * Truncates post content for display in lists.
 * Normalizes newlines and whitespace, then truncates to maxLength.
 * @param content - The post content to truncate
 * @param maxLength - Maximum length (default: 150)
 * @returns Truncated content with ellipsis if needed
 */
export function truncateContent(
  content: string,
  maxLength: number = 150
): string {
  if (!content || content.trim().length === 0) return "";
  // Replace newlines with spaces to make it a single line
  const singleLine = content.replace(/\n/g, " ").replace(/\s+/g, " ").trim();
  if (singleLine.length <= maxLength) return singleLine;
  return singleLine.substring(0, maxLength).trim() + "...";
}

export function copyToClipboard(text: string): Promise<void> {
  if (navigator.clipboard && window.isSecureContext) {
    return navigator.clipboard.writeText(text);
  } else {
    // Fallback for older browsers
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";
    textArea.style.left = "-999999px";
    textArea.style.top = "-999999px";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    return new Promise((resolve, reject) => {
      document.execCommand("copy") ? resolve() : reject();
      textArea.remove();
    });
  }
}

/**
 * Post-like interface for organization name lookup
 */
interface PostLike {
  publish_target?: string | null;
  linkedin_posts?: Array<{
    organization_id?: string | null;
  }> | null;
}

/**
 * Organization mapping can be either:
 * - Record<string, string> (organization ID -> name)
 * - Array of objects with linkedin_org_id and org_name
 */
type OrganizationMapping =
  | Record<string, string>
  | Array<{ linkedin_org_id: string; org_name: string | null }>
  | null
  | undefined;

/**
 * Gets the organization name for a post.
 * Handles both Record<string, string> and Array-based organization mappings.
 *
 * @param post - Post-like object with publish_target and linkedin_posts
 * @param organizations - Organization mapping (Record or Array)
 * @returns Organization name, "Personal", or "Organization" as fallback
 */
export function getOrganizationName(
  post: PostLike,
  organizations?: OrganizationMapping
): string {
  // Handle personal posts
  if (post.publish_target === "personal") {
    return "Personal";
  }

  // Find organization ID from linkedin_posts or publish_target
  let organizationId: string | null | undefined = post.linkedin_posts?.find(
    (lp) => lp.organization_id
  )?.organization_id;

  // If no organization_id in linkedin_posts, use publish_target
  if (
    !organizationId &&
    post.publish_target &&
    post.publish_target !== "personal"
  ) {
    organizationId = post.publish_target;
  }

  // If still no organization info, default to "Personal"
  if (!organizationId) {
    return "Personal";
  }

  // Look up organization name from mapping
  if (!organizations) {
    return organizationId || "Organization";
  }

  // Handle Record<string, string> mapping
  if (!Array.isArray(organizations)) {
    const organizationName = organizations[organizationId];
    return organizationName || organizationId || "Organization";
  }

  // Handle Array-based mapping
  const org = organizations.find((o) => o.linkedin_org_id === organizationId);
  return org?.org_name || organizationId || "Organization";
}
