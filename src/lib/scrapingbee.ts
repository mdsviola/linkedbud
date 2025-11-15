/**
 * ScrapingBee utility functions for scraping article content
 */

interface ScrapingBeeResponse {
  success: boolean;
  content?: string;
  error?: string;
}

/**
 * Strips HTML tags and extracts text content from HTML string
 */
function stripHtmlTags(html: string): string {
  // Remove script and style elements completely
  let text = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "");
  text = text.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "");

  // Remove HTML tags
  text = text.replace(/<[^>]*>/g, "");

  // Decode HTML entities
  text = text.replace(/&amp;/g, "&");
  text = text.replace(/&lt;/g, "<");
  text = text.replace(/&gt;/g, ">");
  text = text.replace(/&quot;/g, '"');
  text = text.replace(/&#39;/g, "'");
  text = text.replace(/&nbsp;/g, " ");

  // Clean up whitespace
  text = text.replace(/\s+/g, " ").trim();

  return text;
}

/**
 * Extracts main article content from scraped HTML
 * This is a simple implementation that looks for common article content patterns
 */
function extractArticleContent(html: string): string {
  // Try to find article content in common containers
  const articlePatterns = [
    /<article[^>]*>([\s\S]*?)<\/article>/i,
    /<div[^>]*class="[^"]*article[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
    /<div[^>]*class="[^"]*content[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
    /<div[^>]*class="[^"]*post[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
    /<main[^>]*>([\s\S]*?)<\/main>/i,
  ];

  for (const pattern of articlePatterns) {
    const match = html.match(pattern);
    if (match && match[1]) {
      return stripHtmlTags(match[1]);
    }
  }

  // If no specific article container found, strip all HTML and return
  return stripHtmlTags(html);
}

/**
 * Helper function to sleep for a specified number of milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Performs a single scraping attempt using ScrapingBee API
 */
async function attemptScraping(
  url: string
): Promise<{ content: string; title: string }> {
  const apiKey = process.env.SCRAPINGBEE_API_KEY;

  if (!apiKey) {
    throw new Error("ScrapingBee API key not configured");
  }

  if (!url || !url.startsWith("http")) {
    throw new Error("Invalid URL provided");
  }

  // Check if this is a Google News URL and add the custom_google parameter
  // Google News requires special handling and costs 20 credits per request
  const isGoogleNews =
    url.includes("news.google.com") || url.includes("google.com/news");
  const baseParams = `api_key=${apiKey}&url=${encodeURIComponent(url)}`;
  const googleParam = isGoogleNews ? "&custom_google=True" : "";
  const extractRules = `&ai_extract_rules=${encodeURIComponent(
    JSON.stringify({
      title: "the article headline",
      content: "the main article text only, without navigation, footer, or ads",
    })
  )}`;

  const apiUrl = `https://app.scrapingbee.com/api/v1/?${baseParams}${googleParam}${extractRules}`;

  const response = await fetch(apiUrl, {
    method: "GET",
    headers: {
      "User-Agent": "Linkedbud/1.0",
    },
    // Add timeout to prevent hanging requests
    signal: AbortSignal.timeout(60000), // 60 second timeout
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("ScrapingBee API error:", response.status, errorText);
    throw new Error("Failed to scrape article content");
  }

  const responseText = await response.text();

  if (!responseText || responseText.trim().length === 0) {
    throw new Error("Failed to scrape article content");
  }

  // Check if the response is JSON (structured response) or HTML (fallback)
  let title = "";
  let content = "";

  try {
    const jsonResponse = JSON.parse(responseText);
    if (jsonResponse.error) {
      throw new Error("Failed to scrape article content");
    }

    // Extract title and content from AI extraction
    title = jsonResponse.title || "";
    content = jsonResponse.content || "";

    // If we got structured data, use it directly
    if (title && content) {
      return {
        title: title.trim(),
        content: content,
      };
    }

    // If structured data is incomplete, fall back to HTML processing
    const html = jsonResponse.html || responseText;
    if (html) {
      const articleContent = extractArticleContent(html);
      if (articleContent && articleContent.trim().length >= 100) {
        return {
          title: title || "Article",
          content: articleContent,
        };
      }
    }
  } catch (jsonError) {
    // If JSON parsing fails, treat as HTML response
    const html = responseText;
    const articleContent = extractArticleContent(html);

    if (!articleContent || articleContent.trim().length < 100) {
      throw new Error("Failed to scrape article content");
    }

    return {
      title: "Article",
      content: articleContent,
    };
  }

  throw new Error("Failed to scrape article content");
}

/**
 * Scrapes article content and title from a URL using ScrapingBee API
 * Tries up to 3 times with 1 second delay between attempts
 * @param url The URL of the article to scrape
 * @returns Promise<{content: string, title: string}> The scraped article content and title
 * @throws Error if scraping fails after all attempts
 */
export async function scrapeArticleContent(
  url: string
): Promise<{ content: string; title: string }> {
  const maxAttempts = 3;
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await attemptScraping(url);
    } catch (error) {
      lastError = error as Error;
      console.error(`Scraping attempt ${attempt} failed:`, error);

      // Don't wait after the last attempt
      if (attempt < maxAttempts) {
        console.log(
          `Retrying scraping in 1 second... (attempt ${
            attempt + 1
          }/${maxAttempts})`
        );
        await sleep(1000);
      }
    }
  }

  // All attempts failed, throw a simple error message
  throw new Error("Failed to scrape article content");
}
