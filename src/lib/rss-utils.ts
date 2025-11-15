import { RSS_FEEDS, RSSFeedCategory } from "./rss-feeds-data";

/**
 * Extract categories from custom RSS feed URLs by matching them against
 * the predefined RSS feeds in rss-feeds-data.ts
 */
export function extractCategoriesFromRssFeeds(
  customRssFeeds: string[]
): string[] {
  if (!customRssFeeds || customRssFeeds.length === 0) {
    return [];
  }

  const categories = new Set<string>();

  // Normalize URLs for comparison (remove trailing slashes, convert to lowercase)
  const normalizeUrl = (url: string): string => {
    return url.trim().toLowerCase().replace(/\/+$/, "");
  };

  // Create a map of normalized URLs to their categories
  const urlToCategoryMap = new Map<string, string>();
  RSS_FEEDS.forEach((category: RSSFeedCategory) => {
    category.feeds.forEach((feed) => {
      const normalizedUrl = normalizeUrl(feed.url);
      urlToCategoryMap.set(normalizedUrl, category.name);
    });
  });

  // Match custom RSS feeds to categories
  customRssFeeds.forEach((feedUrl) => {
    const normalizedUrl = normalizeUrl(feedUrl);
    const category = urlToCategoryMap.get(normalizedUrl);
    if (category) {
      categories.add(category);
    }
  });

  return Array.from(categories);
}

/**
 * Extract keywords from RSS feed titles in the user's custom RSS feeds
 */
export function extractKeywordsFromRssFeeds(
  customRssFeeds: string[]
): string[] {
  if (!customRssFeeds || customRssFeeds.length === 0) {
    return [];
  }

  const keywords = new Set<string>();

  // Normalize URLs for comparison
  const normalizeUrl = (url: string): string => {
    return url.trim().toLowerCase().replace(/\/+$/, "");
  };

  // Create a map of normalized URLs to their feed titles
  const urlToFeedMap = new Map<string, string>();
  RSS_FEEDS.forEach((category: RSSFeedCategory) => {
    category.feeds.forEach((feed) => {
      const normalizedUrl = normalizeUrl(feed.url);
      urlToFeedMap.set(normalizedUrl, feed.title);
    });
  });

  // Extract keywords from matched feed titles
  customRssFeeds.forEach((feedUrl) => {
    const normalizedUrl = normalizeUrl(feedUrl);
    const feedTitle = urlToFeedMap.get(normalizedUrl);
    if (feedTitle) {
      // Extract meaningful words from the title
      // Remove common words and extract key terms
      const words = feedTitle
        .toLowerCase()
        .split(/[\s\-&,]+/)
        .filter((word) => {
          // Filter out common words
          const stopWords = [
            "the",
            "a",
            "an",
            "and",
            "or",
            "but",
            "in",
            "on",
            "at",
            "to",
            "for",
            "of",
            "with",
            "by",
            "from",
            "news",
            "feed",
            "rss",
            "top",
            "stories",
          ];
          return (
            word.length > 2 && !stopWords.includes(word) && /^[a-z]+$/.test(word)
          );
        });
      words.forEach((word) => keywords.add(word));
    }
  });

  return Array.from(keywords);
}

