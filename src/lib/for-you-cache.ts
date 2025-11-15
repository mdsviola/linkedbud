// Define Article interface locally to avoid import issues
interface Article {
  title: string;
  link: string;
  pubDate?: string;
  contentSnippet?: string;
  source: string;
  aiReason?: string;
}

interface ForYouCache {
  articles: Article[];
  timestamp: number;
}

const CACHE_KEY = "for-you-articles";
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour in milliseconds

/**
 * Save articles to localStorage with current timestamp
 */
export function saveForYouCache(articles: Article[]): void {
  // Only run on client side
  if (typeof window === "undefined") return;

  try {
    const cache: ForYouCache = {
      articles,
      timestamp: Date.now(),
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch (error) {
    console.error("Failed to save For You articles to localStorage:", error);
  }
}

/**
 * Load articles from localStorage
 */
export function loadForYouCache(): Article[] | null {
  // Only run on client side
  if (typeof window === "undefined") return null;

  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return null;

    const cache: ForYouCache = JSON.parse(cached);
    return cache.articles || null;
  } catch (error) {
    console.error("Failed to load For You articles from localStorage:", error);
    return null;
  }
}

/**
 * Check if cache is expired (older than 1 hour)
 */
export function isForYouCacheExpired(): boolean {
  // Only run on client side
  if (typeof window === "undefined") return true;

  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return true;

    const cache: ForYouCache = JSON.parse(cached);
    const now = Date.now();
    const cacheAge = now - cache.timestamp;

    return cacheAge > CACHE_DURATION;
  } catch (error) {
    console.error("Failed to check For You cache expiration:", error);
    return true;
  }
}

/**
 * Check if cache exists and is valid (not expired)
 */
export function hasValidForYouCache(): boolean {
  // Only run on client side
  if (typeof window === "undefined") return false;

  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return false;

    const cache: ForYouCache = JSON.parse(cached);
    const now = Date.now();
    const cacheAge = now - cache.timestamp;

    return (
      cacheAge <= CACHE_DURATION && cache.articles && cache.articles.length > 0
    );
  } catch (error) {
    console.error("Failed to validate For You cache:", error);
    return false;
  }
}
