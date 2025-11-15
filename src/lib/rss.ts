import Parser from "rss-parser";
import { normalizeUrl, generateTopicKey } from "./utils";

const parser = new Parser({
  customFields: {
    feed: [],
    item: [],
  },
});

export interface RSSArticle {
  title: string;
  link: string;
  pubDate?: string;
  contentSnippet?: string;
  content?: string;
  source: string;
}

export async function fetchRSSFeed(url: string): Promise<RSSArticle[]> {
  try {
    // Validate URL
    if (!url || !url.startsWith("http")) {
      throw new Error(`Invalid RSS feed URL: ${url}`);
    }

    const feed = await parser.parseURL(url);

    if (!feed || !feed.items || feed.items.length === 0) {
      return [];
    }

    // Decode HTML entities using a simple server-side approach
    const decodeHtml = (text: string) => {
      return text
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&nbsp;/g, " ")
        .replace(/&apos;/g, "'")
        .replace(/&hellip;/g, "...")
        .replace(/&mdash;/g, "—")
        .replace(/&ndash;/g, "–")
        .replace(/&copy;/g, "©")
        .replace(/&reg;/g, "®")
        .replace(/&trade;/g, "™");
    };

    // Extract source name from feed title or URL (ONCE per feed, not per item)
    let source = decodeHtml(feed.title || "Unknown Source");

    // If feed title is empty or generic, try to extract from URL
    if (!source || source === "Unknown Source" || source.trim() === "") {
      try {
        const urlObj = new URL(url);
        source = urlObj.hostname.replace("www.", "").replace("rss.", "");
        // Capitalize first letter
        source = source.charAt(0).toUpperCase() + source.slice(1);
      } catch (e) {
        source = "Unknown Source";
      }
    }

    // Special handling for Google News
    if (url.includes("news.google.com/rss/search")) {
      source = "Google News";
    }

    return feed.items.map((item) => {
      return {
        title: decodeHtml(item.title || "Untitled"),
        link: item.link || "",
        pubDate: item.pubDate,
        contentSnippet: item.contentSnippet || item.content || "",
        content: item.content || "",
        source: source,
      };
    });
  } catch (error) {
    throw new Error(
      `Failed to fetch RSS feed from ${url}: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

export function buildGoogleNewsRSSUrl(keywords: string[]): string {
  const query = keywords.join(" OR ");
  const encodedQuery = encodeURIComponent(query);
  return `https://news.google.com/rss/search?q=${encodedQuery}&hl=en-US&gl=US&ceid=US:en`;
}

export async function fetchIndustryNews(
  keywords: string[]
): Promise<RSSArticle[]> {
  const rssUrl = buildGoogleNewsRSSUrl(keywords);
  return await fetchRSSFeed(rssUrl);
}

export async function fetchCustomRSSFeeds(
  feedUrls: string[]
): Promise<RSSArticle[]> {
  const allArticles: RSSArticle[] = [];
  const errors: string[] = [];

  // Fetch from all custom feeds in parallel
  const feedPromises = feedUrls.map((url) => fetchRSSFeed(url));
  const feedResults = await Promise.allSettled(feedPromises);

  feedResults.forEach((result, index) => {
    if (result.status === "fulfilled") {
      allArticles.push(...result.value);
    } else {
      const errorMsg = `Failed to fetch feed ${feedUrls[index]}: ${result.reason}`;
      errors.push(errorMsg);
    }
  });

  return allArticles;
}

export function normalizeArticle(article: RSSArticle) {
  return {
    ...article,
    link: normalizeUrl(article.link),
    title: article.title.trim(),
    published_at: article.pubDate
      ? new Date(article.pubDate).toISOString()
      : null,
    raw_summary: article.contentSnippet || article.content || "",
  };
}

export function clusterArticles(
  articles: RSSArticle[]
): Map<string, RSSArticle[]> {
  const clusters = new Map<string, RSSArticle[]>();

  // Group articles by source first, then by similar titles
  const sourceGroups = new Map<string, RSSArticle[]>();

  articles.forEach((article) => {
    const normalizedArticle = normalizeArticle(article);
    const source = normalizedArticle.source || "Unknown";

    if (!sourceGroups.has(source)) {
      sourceGroups.set(source, []);
    }

    sourceGroups.get(source)!.push(normalizedArticle);
  });

  // Create clusters from source groups
  sourceGroups.forEach((sourceArticles, source) => {
    // Sort by published date to get the most recent first
    sourceArticles.sort((a, b) => {
      const dateA = a.pubDate ? new Date(a.pubDate).getTime() : 0;
      const dateB = b.pubDate ? new Date(b.pubDate).getTime() : 0;
      return dateB - dateA;
    });

    // Create a cluster for each article (for now, we can improve this later)
    sourceArticles.forEach((article, index) => {
      const topicKey = generateTopicKey(article.title, article.link);
      const clusterTitle = `${source} - ${article.title.substring(0, 50)}${
        article.title.length > 50 ? "..." : ""
      }`;

      if (!clusters.has(topicKey)) {
        clusters.set(topicKey, []);
      }

      clusters.get(topicKey)!.push(article);
    });
  });

  return clusters;
}
