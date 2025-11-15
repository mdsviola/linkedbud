import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";
import { fetchIndustryNews, fetchCustomRSSFeeds, RSSArticle } from "@/lib/rss";

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { industry_keywords, topics, custom_rss_feeds, source } =
      await request.json();

    // Use topics if provided, otherwise fall back to industry_keywords for backward compatibility
    const searchKeywords = topics || industry_keywords;

    if (
      !searchKeywords ||
      !Array.isArray(searchKeywords) ||
      searchKeywords.length === 0
    ) {
      return NextResponse.json(
        {
          error: "Topics are required",
        },
        { status: 400 }
      );
    }

    // If source is specified, fetch only that source
    if (source) {
      if (source === "google_news") {
        try {
          const googleNewsArticles = await fetchIndustryNews(searchKeywords);
          return NextResponse.json({
            articles: googleNewsArticles,
            source: "google_news",
            total: googleNewsArticles.length,
          });
        } catch (error) {
          return NextResponse.json(
            {
              error: "Failed to fetch Google News",
              source: "google_news",
              articles: [],
            },
            { status: 500 }
          );
        }
      } else if (source === "custom_feeds") {
        if (
          custom_rss_feeds &&
          Array.isArray(custom_rss_feeds) &&
          custom_rss_feeds.length > 0
        ) {
          try {
            const customArticles = await fetchCustomRSSFeeds(custom_rss_feeds);
            return NextResponse.json({
              articles: customArticles,
              source: "custom_feeds",
              total: customArticles.length,
            });
          } catch (error) {
            return NextResponse.json(
              {
                error: "Failed to fetch custom RSS feeds",
                source: "custom_feeds",
                articles: [],
              },
              { status: 500 }
            );
          }
        } else {
          return NextResponse.json({
            articles: [],
            source: "custom_feeds",
            total: 0,
          });
        }
      }
    }

    // Original behavior for backward compatibility - fetch all sources
    const allArticles: RSSArticle[] = [];

    // Fetch from Google News using topics
    try {
      const googleNewsArticles = await fetchIndustryNews(searchKeywords);
      allArticles.push(...googleNewsArticles);
    } catch (error) {
      // Silently continue without Google News if there's an error
    }

    // Fetch from custom RSS feeds if provided
    if (
      custom_rss_feeds &&
      Array.isArray(custom_rss_feeds) &&
      custom_rss_feeds.length > 0
    ) {
      try {
        const customArticles = await fetchCustomRSSFeeds(custom_rss_feeds);
        allArticles.push(...customArticles);
      } catch (error) {
        // Continue without custom RSS feeds if there's an error
      }
    }

    // Deduplicate articles by link before processing
    const seenLinks = new Set<string>();
    const uniqueArticles = allArticles.filter((article) => {
      if (!article.link || seenLinks.has(article.link)) {
        return false;
      }
      seenLinks.add(article.link);
      return true;
    });

    // Sort articles by publication date (most recent first)
    uniqueArticles.sort((a, b) => {
      const dateA = a.pubDate ? new Date(a.pubDate).getTime() : 0;
      const dateB = b.pubDate ? new Date(b.pubDate).getTime() : 0;
      return dateB - dateA;
    });

    // Group articles by source to ensure we get a good mix
    const articlesBySource = uniqueArticles.reduce((groups, article) => {
      const source = article.source;
      if (!groups[source]) {
        groups[source] = [];
      }
      groups[source].push(article);
      return groups;
    }, {} as Record<string, typeof uniqueArticles>);

    // Take all articles from each source (no limit)
    const finalArticles: typeof uniqueArticles = [];

    for (const [source, articles] of Object.entries(articlesBySource)) {
      finalArticles.push(...articles);
    }

    // Sort all articles by date (most recent first)
    finalArticles.sort((a, b) => {
      const dateA = a.pubDate ? new Date(a.pubDate).getTime() : 0;
      const dateB = b.pubDate ? new Date(b.pubDate).getTime() : 0;
      return dateB - dateA;
    });

    return NextResponse.json({
      articles: finalArticles,
      total: finalArticles.length,
      sources: {
        google_news: searchKeywords,
        custom_feeds: custom_rss_feeds || [],
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Internal server error",
      },
      { status: 500 }
    );
  }
}

