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
