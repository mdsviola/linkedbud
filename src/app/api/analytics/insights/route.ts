import { NextRequest, NextResponse } from "next/server";
import { createServerClient, supabaseAdmin } from "@/lib/supabase-server";
import {
  generateAnalyticsInsights,
  summarizeAnalyticsInsights,
  type TopPostWithKeywords,
  type AnalyticsInsight,
} from "@/lib/openai";
import {
  checkSubscriptionLimit,
  incrementUsageByType,
  handleSubscriptionLimitError,
} from "@/lib/auth";
import { getUserPortfolio } from "@/lib/portfolio";
import { filterPostsByPortfolioAccess } from "@/lib/portfolio-posts";

export const dynamic = "force-dynamic";

interface AnalyticsInsightsResponse {
  insights: AnalyticsInsight[];
  generatedAt: string;
  expiresAt: string;
  cached: boolean;
  summary?: string;
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const period = searchParams.get("period") || "30d";
    const context = searchParams.get("context") || "all";
    const startDateParam = searchParams.get("startDate");
    const endDateParam = searchParams.get("endDate");

    // Calculate date ranges (same logic as analytics route)
    let startDate: Date;
    let endDate: Date;
    const now = new Date();

    if (period === "custom" && startDateParam && endDateParam) {
      startDate = new Date(startDateParam + "T00:00:00.000Z");
      endDate = new Date(endDateParam + "T23:59:59.999Z");

      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        return NextResponse.json(
          { error: "Invalid date format" },
          { status: 400 }
        );
      }

      if (startDate > endDate) {
        return NextResponse.json(
          { error: "Start date must be before end date" },
          { status: 400 }
        );
      }
    } else {
      switch (period) {
        case "7d":
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          endDate = now;
          break;
        case "30d":
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          endDate = now;
          break;
        case "90d":
          startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          endDate = now;
          break;
        case "all":
          startDate = new Date(0);
          endDate = now;
          break;
        default:
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          endDate = now;
      }
    }

    // Get user's portfolio to determine if we should check for insights from other members
    const portfolio = await getUserPortfolio(user.id);
    let userIdsToCheck = [user.id];
    let portfolioIdFilter: string | null = null;

    if (portfolio) {
      // Get all portfolio member user IDs (owner + collaborators)
      // Use admin client to bypass RLS (prevents recursion in portfolio_collaborators SELECT policy)
      const { data: collaborators } = await supabaseAdmin
        .from("portfolio_collaborators")
        .select("user_id")
        .eq("portfolio_id", portfolio.id)
        .eq("status", "accepted");

      userIdsToCheck = [
        portfolio.owner_id,
        ...(collaborators?.map((c) => c.user_id) || []),
      ];

      portfolioIdFilter = portfolio.id;
    }

    // Check cache - look for any insights generated within the last 24 hours
    // For organization contexts in a portfolio, check insights from any portfolio member
    // Calculate 24 hours ago
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // For preset periods, match on period and context only (dates are calculated dynamically)
    // For custom periods, match on exact dates
    // Use admin client to bypass RLS when checking insights from portfolio members
    const cacheSupabase = (portfolio && context !== "personal" && context !== "all") ? supabaseAdmin : supabase;
    let cacheQuery = cacheSupabase
      .from("analytics_insights")
      .select("*")
      .in("user_id", userIdsToCheck)
      .eq("period", period)
      .eq("context", context)
      .gte("generated_at", twentyFourHoursAgo.toISOString())
      .order("generated_at", { ascending: false })
      .limit(1);

    if (period === "custom") {
      // For custom periods, require exact date matching
      cacheQuery = cacheQuery
        .eq("start_date", startDate.toISOString())
        .eq("end_date", endDate.toISOString());
    }
    // For preset periods (7d, 30d, 90d, all), we don't match on exact dates
    // because they're calculated dynamically relative to "now" each time
    // The period itself defines the time range, so matching on period + context is sufficient

    const { data: cachedInsight, error: cacheCheckError } = await cacheQuery.maybeSingle();

    if (cachedInsight && !cacheCheckError) {
      // Check if summary exists and was generated today
      let summary = cachedInsight.summary as string | null;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const generatedAt = new Date(cachedInsight.generated_at);
      generatedAt.setHours(0, 0, 0, 0);
      const wasGeneratedToday = generatedAt.getTime() === today.getTime();

      // Only generate summary if it doesn't exist and wasn't generated today
      if (!summary && !wasGeneratedToday && cachedInsight.insights) {
        try {
          const insights = cachedInsight.insights as AnalyticsInsight[];
          if (insights.length > 0) {
            summary = await summarizeAnalyticsInsights(insights);
            // Save the summary - use admin client if this insight is from another portfolio member
            const updateSupabase = (portfolio && context !== "personal" && context !== "all") ? supabaseAdmin : supabase;
            await updateSupabase
              .from("analytics_insights")
              .update({ summary })
              .eq("id", cachedInsight.id);
          }
        } catch (error) {
          console.error("Error generating summary for cached insights:", error);
          // Continue without summary
        }
      }

      return NextResponse.json({
        insights: cachedInsight.insights as AnalyticsInsight[],
        generatedAt: cachedInsight.generated_at,
        expiresAt: cachedInsight.expires_at,
        cached: true,
        summary: summary || undefined,
      } as AnalyticsInsightsResponse);
    }

    // Cache miss or expired - generate new insights
    // Check subscription limit before generating new insights
    try {
      await checkSubscriptionLimit(user.id, "ai_insights");
    } catch (error) {
      const limitError = handleSubscriptionLimitError(error);
      if (limitError) return limitError;
      throw error;
    }

    // Fetch metrics in the period
    // Include metrics from all portfolio members if user is in a portfolio
    // Use admin client to bypass RLS (metrics are stored per user_id, but portfolio members need to see them)
    const metricsSupabase = portfolioIdFilter ? supabaseAdmin : supabase;
    const { data: metrics, error: metricsError } = await metricsSupabase
      .from("linkedin_post_metrics")
      .select(
        `
        linkedin_post_id,
        impressions,
        likes,
        comments,
        shares,
        clicks,
        engagement_rate,
        fetched_at,
        user_id
      `
      )
      .in("user_id", userIdsToCheck)
      .gte("fetched_at", startDate.toISOString())
      .lte("fetched_at", endDate.toISOString())
      .order("fetched_at", { ascending: false });

    if (metricsError) {
      console.error("Error fetching metrics:", metricsError);
      return NextResponse.json(
        { error: "Failed to fetch metrics" },
        { status: 500 }
      );
    }

    if (!metrics || metrics.length === 0) {
      // No data available
      return NextResponse.json({
        insights: [],
        generatedAt: now.toISOString(),
        expiresAt: new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString(),
        cached: false,
      } as AnalyticsInsightsResponse);
    }

    // Get unique LinkedIn post IDs
    const linkedinPostIds = new Set<string>();
    const latestMetrics = new Map<string, any>();
    metrics.forEach((metric) => {
      linkedinPostIds.add(metric.linkedin_post_id);
      if (!latestMetrics.has(metric.linkedin_post_id)) {
        latestMetrics.set(metric.linkedin_post_id, metric);
      }
    });

    if (linkedinPostIds.size === 0) {
      return NextResponse.json({
        insights: [],
        generatedAt: now.toISOString(),
        expiresAt: new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString(),
        cached: false,
      } as AnalyticsInsightsResponse);
    }

    // Fetch posts with keywords
    // Include posts from all portfolio members if user is in a portfolio
    // Use admin client when in portfolio context to bypass RLS for nested linkedin_posts
    const postsSupabase = portfolioIdFilter ? supabaseAdmin : supabase;
    let postsQuery = postsSupabase
      .from("posts")
      .select(
        `
        id,
        content,
        published_at,
        status,
        keywords,
        publish_target,
        user_id,
        portfolio_id,
        linkedin_posts(
          linkedin_post_id,
          published_at,
          organization_id
        )
      `
      )
      .eq("status", "PUBLISHED");

    if (portfolioIdFilter) {
      postsQuery = postsQuery
        .in("user_id", userIdsToCheck)
        .eq("portfolio_id", portfolioIdFilter);
    } else {
      postsQuery = postsQuery.eq("user_id", user.id).is("portfolio_id", null);
    }

    const { data: posts, error: postsError } = await postsQuery;

    if (postsError) {
      console.error("Error fetching posts:", postsError);
      return NextResponse.json(
        { error: "Failed to fetch posts" },
        { status: 500 }
      );
    }

    // Apply portfolio access rules to posts
    const accessiblePosts = await filterPostsByPortfolioAccess(user.id, posts || []);

    // Filter posts by context and metrics availability
    let filteredPosts: any[] = [];
    if (accessiblePosts && accessiblePosts.length > 0) {
      const postsWithMetricsInPeriod = accessiblePosts.filter((post) => {
        return post.linkedin_posts?.some((lp: any) =>
          linkedinPostIds.has(lp.linkedin_post_id)
        );
      });

      let allPostsForMetrics = postsWithMetricsInPeriod;
      if (context === "personal") {
        // Only include posts where publish_target matches OR all linkedin_posts are personal
        allPostsForMetrics = allPostsForMetrics.filter((post) => {
          // If publish_target is explicitly "personal", include it
          if (post.publish_target === "personal") {
            return true;
          }
          // If no publish_target and no linkedin_posts, include it (defaults to personal)
          if (!post.publish_target && (!post.linkedin_posts || post.linkedin_posts.length === 0)) {
            return true;
          }
          // If all linkedin_posts with metrics are personal, include it
          if (post.linkedin_posts && post.linkedin_posts.length > 0) {
            const linkedinPostsWithMetrics = post.linkedin_posts.filter(
              (lp: any) => linkedinPostIds.has(lp.linkedin_post_id)
            );
            if (linkedinPostsWithMetrics.length > 0) {
              const allPersonal = linkedinPostsWithMetrics.every(
                (lp: any) => lp.organization_id === null
              );
              return allPersonal;
            }
          }
          return false;
        });
      } else if (context && context !== "all") {
        // Only include posts where publish_target matches OR all linkedin_posts are for this organization
        allPostsForMetrics = allPostsForMetrics.filter((post) => {
          // If publish_target matches the context, include it
          if (post.publish_target === context) {
            return true;
          }
          // If all linkedin_posts with metrics are for this organization, include it
          if (post.linkedin_posts && post.linkedin_posts.length > 0) {
            const linkedinPostsWithMetrics = post.linkedin_posts.filter(
              (lp: any) => linkedinPostIds.has(lp.linkedin_post_id)
            );
            if (linkedinPostsWithMetrics.length > 0) {
              const allMatchingOrg = linkedinPostsWithMetrics.every(
                (lp: any) => lp.organization_id === context
              );
              return allMatchingOrg;
            }
          }
          return false;
        });
      }

      filteredPosts = allPostsForMetrics;
    }

    if (filteredPosts.length === 0) {
      return NextResponse.json({
        insights: [],
        generatedAt: now.toISOString(),
        expiresAt: new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString(),
        cached: false,
      } as AnalyticsInsightsResponse);
    }

    // Fetch organization names
    const organizationIds = new Set<string>();
    filteredPosts.forEach((post) => {
      post.linkedin_posts?.forEach((lp: any) => {
        if (lp.organization_id) {
          organizationIds.add(lp.organization_id);
        }
      });
    });

    const organizationMap = new Map<string, string>();
    if (organizationIds.size > 0) {
      // Get organization names from all portfolio members (not just current user)
      // Use admin client to bypass RLS (organizations are stored per user_id, but portfolio members need to see them)
      const { data: organizations } = await supabaseAdmin
        .from("linkedin_organizations")
        .select("linkedin_org_id, org_name")
        .in("user_id", userIdsToCheck)
        .in("linkedin_org_id", Array.from(organizationIds));

      if (organizations) {
        organizations.forEach((org: any) => {
          organizationMap.set(
            org.linkedin_org_id,
            org.org_name || org.linkedin_org_id
          );
        });
      }
    }

    // Get all metrics for delta calculation (same logic as analytics route)
    const allLinkedinPostIds = new Set<string>();
    filteredPosts.forEach((post) => {
      post.linkedin_posts?.forEach((lp: any) => {
        if (lp.linkedin_post_id) {
          allLinkedinPostIds.add(lp.linkedin_post_id);
        }
      });
    });

    let allPostMetrics: any[] = [];
    if (allLinkedinPostIds.size > 0) {
      // Include metrics from all portfolio members if user is in a portfolio
      // Use admin client to bypass RLS (metrics are stored per user_id, but portfolio members need to see them)
      const allMetricsSupabase = portfolioIdFilter ? supabaseAdmin : supabase;
      const { data: allMetrics } = await allMetricsSupabase
        .from("linkedin_post_metrics")
        .select("*")
        .in("user_id", userIdsToCheck)
        .in("linkedin_post_id", Array.from(allLinkedinPostIds))
        .lte("fetched_at", endDate.toISOString())
        .order("fetched_at", { ascending: true });

      if (allMetrics) {
        allPostMetrics = allMetrics;
      }
    }

    // Group metrics by linkedin_post_id
    const metricsByPostId = new Map<string, any[]>();
    allPostMetrics.forEach((metric) => {
      if (!metricsByPostId.has(metric.linkedin_post_id)) {
        metricsByPostId.set(metric.linkedin_post_id, []);
      }
      metricsByPostId.get(metric.linkedin_post_id)!.push(metric);
    });

    // Build posts with metrics and keywords
    const postsWithMetrics: TopPostWithKeywords[] = [];

    for (const post of filteredPosts) {
      if (post.status === "PUBLISHED" && post.linkedin_posts?.length > 0) {
        for (const lp of post.linkedin_posts) {
          const postMetrics = metricsByPostId.get(lp.linkedin_post_id) || [];

          if (postMetrics.length === 0) continue;

          // Find latest metric in period
          const latestMetric = postMetrics
            .filter((m: any) => {
              const fetchedAt = new Date(m.fetched_at);
              return fetchedAt >= startDate && fetchedAt <= endDate;
            })
            .sort(
              (a: any, b: any) =>
                new Date(b.fetched_at).getTime() -
                new Date(a.fetched_at).getTime()
            )[0];

          if (!latestMetric) continue;

          // Calculate baseline (same logic as analytics route)
          let baseline: any;
          const postPublishedAt = post.published_at
            ? new Date(post.published_at)
            : null;
          const postPublishedAfterPeriodStart =
            postPublishedAt && postPublishedAt > startDate;

          if (period === "all" || postPublishedAfterPeriodStart) {
            baseline = {
              impressions: 0,
              likes: 0,
              comments: 0,
              shares: 0,
              clicks: 0,
            };
          } else {
            let baselineMetric = postMetrics
              .filter((m: any) => new Date(m.fetched_at) <= startDate)
              .sort(
                (a: any, b: any) =>
                  new Date(b.fetched_at).getTime() -
                  new Date(a.fetched_at).getTime()
              )[0];

            if (!baselineMetric) {
              baselineMetric = postMetrics
                .filter((m: any) => {
                  const fetchedAt = new Date(m.fetched_at);
                  return fetchedAt >= startDate && fetchedAt <= endDate;
                })
                .sort(
                  (a: any, b: any) =>
                    new Date(a.fetched_at).getTime() -
                    new Date(b.fetched_at).getTime()
                )[0];
            }

            baseline = baselineMetric || {
              impressions: 0,
              likes: 0,
              comments: 0,
              shares: 0,
              clicks: 0,
            };
          }

          const deltaImpressions = Math.max(
            0,
            (latestMetric.impressions || 0) - (baseline.impressions || 0)
          );
          const deltaLikes = Math.max(
            0,
            (latestMetric.likes || 0) - (baseline.likes || 0)
          );
          const deltaComments = Math.max(
            0,
            (latestMetric.comments || 0) - (baseline.comments || 0)
          );
          const deltaShares = Math.max(
            0,
            (latestMetric.shares || 0) - (baseline.shares || 0)
          );
          const deltaEngagement = deltaLikes + deltaComments + deltaShares;
          const deltaEngagementRate =
            deltaImpressions > 0 ? deltaEngagement / deltaImpressions : 0;

          // Create excerpt
          let contentSnippet = "";
          if (post.content) {
            if (post.content.length > 150) {
              const truncated = post.content.substring(0, 150);
              const lastSpace = truncated.lastIndexOf(" ");
              contentSnippet =
                lastSpace > 0
                  ? truncated.substring(0, lastSpace).trim() + "..."
                  : truncated.trim() + "...";
            } else {
              contentSnippet = post.content;
            }
          }

          postsWithMetrics.push({
            postId: post.id,
            linkedinPostId: lp.linkedin_post_id,
            excerpt: contentSnippet,
            publishedAt: post.published_at,
            impressions: deltaImpressions,
            likes: deltaLikes,
            comments: deltaComments,
            shares: deltaShares,
            engagementRate: deltaEngagementRate,
            keywords: post.keywords || [],
            organizationId: lp.organization_id || null,
            organizationName: lp.organization_id
              ? organizationMap.get(lp.organization_id) || null
              : null,
          });
        }
      }
    }

    if (postsWithMetrics.length === 0) {
      return NextResponse.json({
        insights: [],
        generatedAt: now.toISOString(),
        expiresAt: new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString(),
        cached: false,
      } as AnalyticsInsightsResponse);
    }

    // Sort posts by different criteria and generate insights
    const sortCriteria = [
      "impressions",
      "likes",
      "comments",
      "shares",
      "engagementRate",
    ];
    const allInsights: AnalyticsInsight[] = [];

    for (const sortBy of sortCriteria) {
      const sorted = [...postsWithMetrics].sort((a, b) => {
        let aValue: number;
        let bValue: number;

        switch (sortBy) {
          case "impressions":
            aValue = a.impressions;
            bValue = b.impressions;
            break;
          case "likes":
            aValue = a.likes;
            bValue = b.likes;
            break;
          case "comments":
            aValue = a.comments;
            bValue = b.comments;
            break;
          case "shares":
            aValue = a.shares;
            bValue = b.shares;
            break;
          case "engagementRate":
            aValue = a.engagementRate;
            bValue = b.engagementRate;
            break;
          default:
            aValue = a.impressions;
            bValue = b.impressions;
        }

        return bValue - aValue; // Descending
      });

      // Get top 10-15 posts for this sort
      const topPosts = sorted.slice(0, 15);

      if (topPosts.length > 0) {
        try {
          const insights = await generateAnalyticsInsights(topPosts, sortBy);
          allInsights.push(...insights);
        } catch (error) {
          console.error(`Error generating insights for ${sortBy}:`, error);
          // Continue with other sorts even if one fails
        }
      }
    }

    // Curate insights: deduplicate, rank, and limit
    const curatedInsights = curateInsights(allInsights);

    // Check if entry exists and has a summary generated today
    // For organization contexts in a portfolio, check across all portfolio members
    const existingEntrySupabase = (portfolio && context !== "personal" && context !== "all") ? supabaseAdmin : supabase;
    const existingEntryQuery = existingEntrySupabase
      .from("analytics_insights")
      .select("id, summary, generated_at")
      .in("user_id", userIdsToCheck)
      .eq("period", period)
      .eq("context", context)
      .eq("start_date", startDate.toISOString())
      .eq("end_date", endDate.toISOString())
      .order("generated_at", { ascending: false })
      .limit(1);

    const { data: existingEntry } = await existingEntryQuery.maybeSingle();

    // Check if summary was already generated today
    let summary: string | null = null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (existingEntry?.summary) {
      const generatedAt = new Date(existingEntry.generated_at);
      generatedAt.setHours(0, 0, 0, 0);

      // If summary exists and was generated today, reuse it
      if (generatedAt.getTime() === today.getTime()) {
        summary = existingEntry.summary as string;
        console.log("Reusing existing summary generated today");
      }
    }

    // Only generate summary if it doesn't exist or wasn't generated today
    if (!summary && curatedInsights.length > 0) {
      try {
        summary = await summarizeAnalyticsInsights(curatedInsights);
      } catch (error) {
        console.error("Error generating summary:", error);
        // Continue without summary
      }
    }

    // Store in cache - use update or insert to prevent duplicates
    const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours

    // Always store start_date and end_date (even for preset periods)
    const cacheData = {
      user_id: user.id,
      period,
      context,
      start_date: startDate.toISOString(),
      end_date: endDate.toISOString(),
      insights: curatedInsights,
      summary: summary,
      generated_at: now.toISOString(),
      expires_at: expiresAt.toISOString(),
    };

    let cacheError = null;

    if (existingEntry) {
      // Update existing entry
      // Only update summary if we generated a new one, otherwise keep existing
      const updateData: any = {
        insights: curatedInsights,
        generated_at: now.toISOString(),
        expires_at: expiresAt.toISOString(),
      };

      // Only update summary if we have a new one (not reused from today)
      if (summary && summary !== existingEntry.summary) {
        updateData.summary = summary;
      }

      const { error: updateError } = await supabase
        .from("analytics_insights")
        .update(updateData)
        .eq("id", existingEntry.id);

      cacheError = updateError;
    } else {
      // Insert new entry
      // Delete any expired entries for this key first to prevent duplicates
      await supabase
        .from("analytics_insights")
        .delete()
        .eq("user_id", user.id)
        .eq("period", period)
        .eq("context", context)
        .eq("start_date", cacheData.start_date)
        .eq("end_date", cacheData.end_date);

      const { error: insertError } = await supabase
        .from("analytics_insights")
        .insert(cacheData);

      cacheError = insertError;
    }

    if (cacheError) {
      console.error("Error caching insights:", cacheError);
      // Continue anyway - return insights even if cache fails
    }

    // Increment generation count
    try {
      await incrementUsageByType(user.id, "ai_insights");
    } catch (error) {
      console.error("Error incrementing usage count:", error);
      // Non-critical error, continue
    }

    return NextResponse.json({
      insights: curatedInsights,
      generatedAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
      cached: false,
      summary: summary || undefined,
    } as AnalyticsInsightsResponse);
  } catch (error) {
    console.error("Error generating analytics insights:", error);
    const limitError = handleSubscriptionLimitError(error);
    if (limitError) return limitError;
    return NextResponse.json(
      { error: "Failed to generate insights" },
      { status: 500 }
    );
  }
}

/**
 * Curate insights: deduplicate, rank by priority, and limit results
 */
function curateInsights(insights: AnalyticsInsight[]): AnalyticsInsight[] {
  if (insights.length === 0) {
    return [];
  }

  // Group by category and deduplicate similar insights
  const insightsByCategory = new Map<string, AnalyticsInsight[]>();

  insights.forEach((insight) => {
    if (!insightsByCategory.has(insight.category)) {
      insightsByCategory.set(insight.category, []);
    }
    insightsByCategory.get(insight.category)!.push(insight);
  });

  // Deduplicate within each category (simple title similarity check)
  const deduplicated: AnalyticsInsight[] = [];

  insightsByCategory.forEach((categoryInsights) => {
    const seen = new Set<string>();

    categoryInsights.forEach((insight) => {
      // Simple deduplication: check if we've seen a similar title
      const titleKey = insight.title.toLowerCase().replace(/[^a-z0-9]/g, "");
      if (!seen.has(titleKey)) {
        seen.add(titleKey);
        deduplicated.push(insight);
      }
    });
  });

  // Sort by priority (descending), then by category
  const categoryOrder = ["topics", "engagement", "themes", "metrics"];
  deduplicated.sort((a, b) => {
    if (b.priority !== a.priority) {
      return b.priority - a.priority;
    }
    const aCategoryIndex = categoryOrder.indexOf(a.category);
    const bCategoryIndex = categoryOrder.indexOf(b.category);
    return aCategoryIndex - bCategoryIndex;
  });

  // Limit to top insights (dynamic based on data quality)
  // Return top 8-12 insights, prioritizing higher priority ones
  const limit = Math.min(
    12,
    Math.max(4, Math.floor(deduplicated.length * 0.6))
  );

  return deduplicated.slice(0, limit);
}
