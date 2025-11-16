import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date) {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(date))
}

export function formatRelativeTime(date: string | Date) {
  const now = new Date()
  const targetDate = new Date(date)
  const diffInSeconds = Math.floor((now.getTime() - targetDate.getTime()) / 1000)

  if (diffInSeconds < 60) return 'Just now'
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`

  return formatDate(date)
}

export function generateTopicKey(title: string, url: string): string {
  // Simple hash function for topic clustering
  const normalizedTitle = title.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim()
  const normalizedUrl = url.replace(/[?#].*$/, '').toLowerCase()

  // Create a simple hash
  let hash = 0
  const str = normalizedTitle + normalizedUrl
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32-bit integer
  }

  return Math.abs(hash).toString(36)
}

export function normalizeUrl(url: string): string {
  try {
    const urlObj = new URL(url)
    // Remove UTM parameters and other tracking params
    const paramsToRemove = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'fbclid', 'gclid']
    paramsToRemove.forEach(param => urlObj.searchParams.delete(param))

    return urlObj.toString()
  } catch {
    return url
  }
}

export function extractToneFromCorpus(corpus: string[]): string {
  if (!corpus || corpus.length === 0) return 'expert'

  // Simple tone analysis based on common patterns
  const text = corpus.join(' ').toLowerCase()

  if (text.includes('!') && text.includes('?')) return 'witty'
  if (text.includes('however') || text.includes('but') || text.includes('challenge')) return 'challenger'
  if (text.includes('please') || text.includes('thank you') || text.includes('kindly')) return 'formal'

  return 'expert'
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength).trim() + '...'
}

/**
 * Truncates post content for display in lists.
 * Normalizes newlines and whitespace, then truncates to maxLength.
 * @param content - The post content to truncate
 * @param maxLength - Maximum length (default: 150)
 * @returns Truncated content with ellipsis if needed
 */
export function truncateContent(content: string, maxLength: number = 150): string {
  if (!content || content.trim().length === 0) return "";
  // Replace newlines with spaces to make it a single line
  const singleLine = content.replace(/\n/g, " ").replace(/\s+/g, " ").trim();
  if (singleLine.length <= maxLength) return singleLine;
  return singleLine.substring(0, maxLength).trim() + "...";
}

export function copyToClipboard(text: string): Promise<void> {
  if (navigator.clipboard && window.isSecureContext) {
    return navigator.clipboard.writeText(text)
  } else {
    // Fallback for older browsers
    const textArea = document.createElement('textarea')
    textArea.value = text
    textArea.style.position = 'fixed'
    textArea.style.left = '-999999px'
    textArea.style.top = '-999999px'
    document.body.appendChild(textArea)
    textArea.focus()
    textArea.select()
    return new Promise((resolve, reject) => {
      document.execCommand('copy') ? resolve() : reject()
      textArea.remove()
    })
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
  let organizationId: string | null | undefined =
    post.linkedin_posts?.find((lp) => lp.organization_id)?.organization_id;

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
  const org = organizations.find(
    (o) => o.linkedin_org_id === organizationId
  );
  return org?.org_name || organizationId || "Organization";
}
