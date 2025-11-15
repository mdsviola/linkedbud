import { NextRequest, NextResponse } from "next/server";
import { createServerClient, supabaseAdmin } from "@/lib/supabase-server";
import { getUserPortfolio } from "@/lib/portfolio";
import { filterPostsByPortfolioAccess } from "@/lib/portfolio-posts";

export const dynamic = 'force-dynamic';

interface TopPost {
  postId: number;
  linkedinPostId: string;
  excerpt: string;
  publishedAt: string;
  impressions: number;
  likes: number;
  comments: number;
  shares: number;
  engagementRate: number;
  organizationId: string | null;
  organizationName: string | null;
}

interface PeriodData {
  impressions: number;
  engagement: number;
  engagementRate: number;
  postCount: number;
  topPostsByImpressions: TopPost[];
  previousPeriod?: {
    impressions: number;
    engagement: number;
    engagementRate: number;
    postCount: number;
  };
}

interface AnalyticsResponse {
  currentPeriod: PeriodData;
  timeSeriesData: {
    date: string;
    impressions: number;
    likes: number;
    comments: number;
    shares: number;
  }[];
  publishingPatterns: {
    dayOfWeek: number;
    count: number;
  }[];
  postsByStatus: {
    published: number;
    scheduled: number;
    draft: number;
    archived: number;
  };
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

    // Get user's portfolio to determine which posts/metrics to include
    const portfolio = await getUserPortfolio(user.id);
    let userIdsToQuery = [user.id];
    let portfolioIdFilter: string | null = null;

    if (portfolio) {
      // Get all portfolio member user IDs (owner + collaborators)
      // Use admin client to bypass RLS (prevents recursion in portfolio_collaborators SELECT policy)
      const { data: collaborators } = await supabaseAdmin
        .from("portfolio_collaborators")
        .select("user_id")
        .eq("portfolio_id", portfolio.id)
        .eq("status", "accepted");

      userIdsToQuery = [
        portfolio.owner_id,
        ...(collaborators?.map((c) => c.user_id) || []),
      ];

      portfolioIdFilter = portfolio.id;
    }

    const searchParams = request.nextUrl.searchParams;
    const period = searchParams.get("period") || "30d"; // Default to 30 days
    const context = searchParams.get("context") || "all"; // Default to "all": "all" | "personal" | "organization"
    const startDateParam = searchParams.get("startDate");
    const endDateParam = searchParams.get("endDate");
    const sortColumn = searchParams.get("sortColumn") || "impressions"; // Default to impressions
    const sortDirection = searchParams.get("sortDirection") || "desc"; // Default to descending

    // Calculate date ranges
    let startDate: Date;
    let endDate: Date;
    let previousPeriodStartDate: Date;
    const now = new Date();

    if (period === "custom" && startDateParam && endDateParam) {
      // Custom date range
      // Parse dates as UTC to avoid timezone issues
      // Date strings in format "YYYY-MM-DD" are interpreted as UTC midnight
      startDate = new Date(startDateParam + "T00:00:00.000Z");
      endDate = new Date(endDateParam + "T23:59:59.999Z");

      // Calculate previous period (same duration before start date)
      const customDuration = endDate.getTime() - startDate.getTime();
      previousPeriodStartDate = new Date(startDate.getTime() - customDuration);

      // Validate dates
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
      // Preset periods
      switch (period) {
        case "7d":
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          endDate = now;
          previousPeriodStartDate = new Date(
            now.getTime() - 14 * 24 * 60 * 60 * 1000
          );
          break;
        case "30d":
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          endDate = now;
          previousPeriodStartDate = new Date(
            now.getTime() - 60 * 24 * 60 * 60 * 1000
          );
          break;
        case "90d":
          startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          endDate = now;
          previousPeriodStartDate = new Date(
            now.getTime() - 180 * 24 * 60 * 60 * 1000
          );
          break;
        case "all":
          startDate = new Date(0); // Unix epoch
          endDate = now;
          previousPeriodStartDate = new Date(0);
          break;
        default:
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          endDate = now;
          previousPeriodStartDate = new Date(
            now.getTime() - 60 * 24 * 60 * 60 * 1000
          );
      }
    }

    // Fetch current period metrics FIRST - filter by fetched_at (when metrics were collected)
    // This is the key: time period is ALWAYS related to when metrics were fetched, not when posts were published
    // Include metrics from all portfolio members if user is in a portfolio
    // Use admin client to bypass RLS (metrics are stored per user_id, but portfolio members need to see them)
    const { data: metrics, error: metricsError } = await supabaseAdmin
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
      .in("user_id", userIdsToQuery)
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

    // Get unique LinkedIn post IDs from metrics that have data in the time period
    const linkedinPostIds = new Set<string>();
    let currentMetrics: any[] = [];
    let allMetricsForTimeSeries: any[] = [];

    if (metrics && metrics.length > 0) {
      // Store all metrics for time series
      allMetricsForTimeSeries = metrics;

      // Get the latest metrics for each post (for aggregations)
      const latestMetrics = new Map<string, any>();
      metrics.forEach((metric) => {
        linkedinPostIds.add(metric.linkedin_post_id);
        if (!latestMetrics.has(metric.linkedin_post_id)) {
          latestMetrics.set(metric.linkedin_post_id, metric);
        }
      });
      currentMetrics = Array.from(latestMetrics.values());
    }

    // Now fetch posts that have these LinkedIn post IDs (regardless of publication date)
    // Only fetch published posts since we're only looking at metrics for published posts
    // Include posts from all portfolio members if user is in a portfolio
    // Use admin client when in portfolio context to bypass RLS for nested linkedin_posts
    let filteredPosts: any[] = [];
    let filteredLinkedinPostIds = new Set<string>(linkedinPostIds);

    if (linkedinPostIds.size > 0) {
      const postsSupabase = portfolioIdFilter ? supabaseAdmin : supabase;
      let postsQuery = postsSupabase
        .from("posts")
        .select(
          `
          id,
          content,
          published_at,
          status,
          created_at,
          publish_target,
          keywords,
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

      // If user has a portfolio, include posts from all portfolio members with that portfolio_id
      if (portfolioIdFilter) {
        postsQuery = postsQuery
          .in("user_id", userIdsToQuery)
          .eq("portfolio_id", portfolioIdFilter);
      } else {
        // If no portfolio, only show user's own posts (no portfolio_id filter)
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

      // Filter posts to only include those with linkedin_post_ids that have metrics in the period
      const postsWithMetricsInPeriod = (posts || []).filter((post) => {
        return post.linkedin_posts?.some((lp: any) =>
          linkedinPostIds.has(lp.linkedin_post_id)
        );
      });

      // Apply portfolio access rules (personal posts only visible to creator, org posts visible to users with LinkedIn access)
      const accessiblePosts = await filterPostsByPortfolioAccess(
        user.id,
        postsWithMetricsInPeriod
      );

      // Filter posts by context (personal vs organization)
      // Only include posts where publish_target matches OR all linkedin_posts match the context
      // Note: We only include posts that have metrics in the period (since we're calculating metrics)
      let allPostsForMetrics = accessiblePosts;
      if (context === "personal") {
        allPostsForMetrics = allPostsForMetrics.filter((post) => {
          // Post must have at least one linkedin_post with metrics
          const hasMetrics = post.linkedin_posts?.some(
            (lp: any) => linkedinPostIds.has(lp.linkedin_post_id)
          );
          if (!hasMetrics) return false;

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
        // Context is a specific organization ID
        allPostsForMetrics = allPostsForMetrics.filter((post) => {
          // Post must have at least one linkedin_post with metrics
          const hasMetrics = post.linkedin_posts?.some(
            (lp: any) => linkedinPostIds.has(lp.linkedin_post_id)
          );
          if (!hasMetrics) return false;

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

      // Update linkedinPostIds to only include those from filtered posts (for context filtering)
      // Only include linkedin_post_ids that:
      // 1. Have metrics in the period (from original linkedinPostIds)
      // 2. Match the context filter (from allPostsForMetrics)
      filteredLinkedinPostIds = new Set<string>();
      allPostsForMetrics.forEach((post) => {
        post.linkedin_posts?.forEach((lp: any) => {
          // Only include if it has metrics AND matches context
          if (linkedinPostIds.has(lp.linkedin_post_id)) {
            // For personal context, only include personal linkedin_posts
            if (context === "personal") {
              if (lp.organization_id === null) {
                filteredLinkedinPostIds.add(lp.linkedin_post_id);
              }
            }
            // For organization context, only include matching organization linkedin_posts
            else if (context && context !== "all") {
              if (lp.organization_id === context) {
                filteredLinkedinPostIds.add(lp.linkedin_post_id);
              }
            }
            // For "all" context, include all
            else {
              filteredLinkedinPostIds.add(lp.linkedin_post_id);
            }
          }
        });
      });

      // Re-filter currentMetrics to only include posts that match context
      currentMetrics = currentMetrics.filter((m) =>
        filteredLinkedinPostIds.has(m.linkedin_post_id)
      );

      // Re-filter allMetricsForTimeSeries for context
      allMetricsForTimeSeries = allMetricsForTimeSeries.filter((m) =>
        filteredLinkedinPostIds.has(m.linkedin_post_id)
      );

      // Use allPostsForMetrics as filteredPosts (they already have metrics in the period)
      filteredPosts = allPostsForMetrics;
    }

    // Fetch previous period metrics for comparison (if not all time)
    // Use the same filteredLinkedinPostIds to ensure context filtering applies
    // Include metrics from all portfolio members if user is in a portfolio
    // Use admin client to bypass RLS (metrics are stored per user_id, but portfolio members need to see them)
    let previousPeriodMetrics: any[] = [];
    if (period !== "all" && filteredLinkedinPostIds.size > 0) {
      const { data: prevMetrics, error: prevMetricsError } = await supabaseAdmin
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
          fetched_at
        `
        )
        .in("user_id", userIdsToQuery)
        .in("linkedin_post_id", Array.from(filteredLinkedinPostIds))
        .gte("fetched_at", previousPeriodStartDate.toISOString())
        .lt("fetched_at", startDate.toISOString())
        .order("fetched_at", { ascending: false });

      if (!prevMetricsError && prevMetrics) {
        const prevLatestMetrics = new Map<string, any>();
        prevMetrics.forEach((metric) => {
          if (!prevLatestMetrics.has(metric.linkedin_post_id)) {
            prevLatestMetrics.set(metric.linkedin_post_id, metric);
          }
        });
        previousPeriodMetrics = Array.from(prevLatestMetrics.values());
      }
    }

    // Aggregate current period metrics
    const totalImpressions = currentMetrics.reduce(
      (sum, m) => sum + (m.impressions || 0),
      0
    );
    const totalLikes = currentMetrics.reduce(
      (sum, m) => sum + (m.likes || 0),
      0
    );
    const totalComments = currentMetrics.reduce(
      (sum, m) => sum + (m.comments || 0),
      0
    );
    const totalShares = currentMetrics.reduce(
      (sum, m) => sum + (m.shares || 0),
      0
    );
    const totalEngagement = totalLikes + totalComments + totalShares;
    const avgEngagementRate =
      totalImpressions > 0 ? totalEngagement / totalImpressions : 0;

    // Aggregate previous period metrics
    const prevImpressions = previousPeriodMetrics.reduce(
      (sum, m) => sum + (m.impressions || 0),
      0
    );
    const prevLikes = previousPeriodMetrics.reduce(
      (sum, m) => sum + (m.likes || 0),
      0
    );
    const prevComments = previousPeriodMetrics.reduce(
      (sum, m) => sum + (m.comments || 0),
      0
    );
    const prevShares = previousPeriodMetrics.reduce(
      (sum, m) => sum + (m.shares || 0),
      0
    );
    const prevEngagement = prevLikes + prevComments + prevShares;
    const prevEngagementRate =
      prevImpressions > 0 ? prevEngagement / prevImpressions : 0;

    // Fetch organization names for all organization IDs in the posts
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
      // Include organizations from all portfolio members if user is in a portfolio
      // Use admin client to bypass RLS (organizations are stored per user_id, but portfolio members need to see them for display)
      const { data: organizations } = await supabaseAdmin
        .from("linkedin_organizations")
        .select("linkedin_org_id, org_name")
        .in("user_id", userIdsToQuery)
        .in("linkedin_org_id", Array.from(organizationIds));

      if (organizations) {
        organizations.forEach((org: any) => {
          organizationMap.set(org.linkedin_org_id, org.org_name || org.linkedin_org_id);
        });
      }
    }

    // Build top posts with metrics (using filtered posts)
    // Calculate delta metrics: difference between start and end of period
    const topPostsWithMetrics: TopPost[] = [];

    // Get all LinkedIn post IDs we need metrics for
    const allLinkedinPostIds = new Set<string>();
    filteredPosts.forEach((post) => {
      post.linkedin_posts?.forEach((lp: any) => {
        if (lp.linkedin_post_id) {
          allLinkedinPostIds.add(lp.linkedin_post_id);
        }
      });
    });

    // Fetch ALL metrics for all posts (before period, during period, and after period for baseline)
    // We need metrics before startDate for baseline, and metrics during period for latest
    let allPostMetrics: any[] = [];
    if (allLinkedinPostIds.size > 0) {
      // Fetch metrics from before period start to end of period
      // This gives us baseline (before/at start) and latest (at end)
      // Include metrics from all portfolio members if user is in a portfolio
      // Use admin client to bypass RLS (metrics are stored per user_id, but portfolio members need to see them)
      const { data: metrics } = await supabaseAdmin
        .from("linkedin_post_metrics")
        .select("*")
        .in("user_id", userIdsToQuery)
        .in("linkedin_post_id", Array.from(allLinkedinPostIds))
        .lte("fetched_at", endDate.toISOString())
        .order("fetched_at", { ascending: true });

      if (metrics) {
        allPostMetrics = metrics;
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

    // For each post, calculate delta metrics
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
            .sort((a: any, b: any) => new Date(b.fetched_at).getTime() - new Date(a.fetched_at).getTime())[0];

          if (!latestMetric) continue; // No metrics in period, skip

          // Determine baseline logic:
          // 1. "all time" period -> use 0 as baseline (show total metrics)
          // 2. Post published after period start -> use 0 as baseline (post didn't exist at start)
          // 3. Otherwise -> use baseline metric (latest on or before startDate)
          let baseline: any;
          const postPublishedAt = post.published_at ? new Date(post.published_at) : null;
          const postPublishedAfterPeriodStart = postPublishedAt && postPublishedAt > startDate;

          if (period === "all" || postPublishedAfterPeriodStart) {
            // For all time or posts newer than the period, use 0 as baseline to show total current metrics
            baseline = {
              impressions: 0,
              likes: 0,
              comments: 0,
              shares: 0,
              clicks: 0,
            };
          } else {
            // Post existed at start of period - find baseline metric (latest on or before startDate)
            let baselineMetric = postMetrics
              .filter((m: any) => new Date(m.fetched_at) <= startDate)
              .sort((a: any, b: any) => new Date(b.fetched_at).getTime() - new Date(a.fetched_at).getTime())[0];

            // If no metric before startDate, use earliest in period as baseline
            if (!baselineMetric) {
              baselineMetric = postMetrics
                .filter((m: any) => {
                  const fetchedAt = new Date(m.fetched_at);
                  return fetchedAt >= startDate && fetchedAt <= endDate;
                })
                .sort((a: any, b: any) => new Date(a.fetched_at).getTime() - new Date(b.fetched_at).getTime())[0];
            }

            baseline = baselineMetric || {
              impressions: 0,
              likes: 0,
              comments: 0,
              shares: 0,
              clicks: 0,
            };
          }

          const deltaImpressions = Math.max(0, (latestMetric.impressions || 0) - (baseline.impressions || 0));
          const deltaLikes = Math.max(0, (latestMetric.likes || 0) - (baseline.likes || 0));
          const deltaComments = Math.max(0, (latestMetric.comments || 0) - (baseline.comments || 0));
          const deltaShares = Math.max(0, (latestMetric.shares || 0) - (baseline.shares || 0));
          const deltaEngagement = deltaLikes + deltaComments + deltaShares;
          const deltaEngagementRate = deltaImpressions > 0 ? deltaEngagement / deltaImpressions : 0;

          // Create a snippet from the post content (first 150 characters, trimmed to word boundary)
          let contentSnippet = "";
          if (post.content) {
            if (post.content.length > 150) {
              const truncated = post.content.substring(0, 150);
              const lastSpace = truncated.lastIndexOf(" ");
              contentSnippet = lastSpace > 0
                ? truncated.substring(0, lastSpace).trim() + "..."
                : truncated.trim() + "...";
            } else {
              contentSnippet = post.content;
            }
          }

          topPostsWithMetrics.push({
            postId: post.id,
            linkedinPostId: lp.linkedin_post_id,
            excerpt: contentSnippet,
            publishedAt: post.published_at,
            impressions: deltaImpressions,
            likes: deltaLikes,
            comments: deltaComments,
            shares: deltaShares,
            engagementRate: deltaEngagementRate,
            organizationId: lp.organization_id || null,
            organizationName: lp.organization_id ? organizationMap.get(lp.organization_id) || null : null,
          });
        }
      }
    }

    // Sort posts based on sortColumn and sortDirection
    const sortPosts = (posts: TopPost[]): TopPost[] => {
      const sorted = [...posts].sort((a, b) => {
        let aValue: number;
        let bValue: number;

        switch (sortColumn) {
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

        if (sortDirection === "asc") {
          return aValue - bValue;
        } else {
          return bValue - aValue;
        }
      });

      return sorted;
    };

    // Sort and limit to top 10 posts
    const topPostsByImpressions = sortPosts(topPostsWithMetrics).slice(0, 10);

    // Build time series data (daily aggregation) using ALL metrics
    // For each day, we need to track the maximum values per post to avoid double counting
    // when the same post has multiple metric entries on the same day
    const timeSeriesMap = new Map<string, Map<string, any>>(); // date -> linkedin_post_id -> metric

    allMetricsForTimeSeries.forEach((metric) => {
      const date = new Date(metric.fetched_at).toISOString().split("T")[0];

      if (!timeSeriesMap.has(date)) {
        timeSeriesMap.set(date, new Map());
      }

      const dayPostMap = timeSeriesMap.get(date)!;
      const postId = metric.linkedin_post_id;

      // For each post per day, keep only the latest metric (to avoid double counting)
      if (!dayPostMap.has(postId)) {
        dayPostMap.set(postId, metric);
      } else {
        const existingMetric = dayPostMap.get(postId);
        const existingDate = new Date(existingMetric.fetched_at);
        const currentDate = new Date(metric.fetched_at);
        // Keep the latest one if there are multiple entries on the same day
        if (currentDate > existingDate) {
          dayPostMap.set(postId, metric);
        }
      }
    });

    // Aggregate daily data by summing across all posts for each day
    const timeSeriesData = Array.from(timeSeriesMap.entries())
      .map(([date, postMap]) => {
        let dayData = {
          date,
          impressions: 0,
          likes: 0,
          comments: 0,
          shares: 0,
        };

        postMap.forEach((metric) => {
          dayData.impressions += metric.impressions || 0;
          dayData.likes += metric.likes || 0;
          dayData.comments += metric.comments || 0;
          dayData.shares += metric.shares || 0;
        });

        return dayData;
      })
      .sort((a, b) => a.date.localeCompare(b.date));

    // Publishing patterns by day of week (using filtered posts)
    const dayCount = new Map<number, number>();
    filteredPosts.forEach((post) => {
      if (post.published_at) {
        const day = new Date(post.published_at).getDay();
        dayCount.set(day, (dayCount.get(day) || 0) + 1);
      }
    });
    const publishingPatterns = Array.from(dayCount.entries()).map(
      ([day, count]) => ({
        dayOfWeek: day,
        count,
      })
    );

    // Posts by status - count only posts within the time period
    // For PUBLISHED posts, we need to fetch ALL published posts in the period (not just those with metrics)
    // and filter them by context and portfolio access
    // For SCHEDULED posts, use scheduled_publish_date
    // For DRAFT and ARCHIVED posts, use created_at
    // Fetch ALL published posts in the period (not just those with metrics) to get accurate count
    const publishedSupabase = portfolioIdFilter ? supabaseAdmin : supabase;
    let publishedQuery = publishedSupabase
      .from("posts")
      .select("id, publish_target, user_id, portfolio_id, published_at, linkedin_posts(organization_id)")
      .eq("status", "PUBLISHED")
      .gte("published_at", startDate.toISOString())
      .lte("published_at", endDate.toISOString());

    if (portfolioIdFilter) {
      publishedQuery = publishedQuery
        .in("user_id", userIdsToQuery)
        .eq("portfolio_id", portfolioIdFilter);
    } else {
      publishedQuery = publishedQuery.eq("user_id", user.id).is("portfolio_id", null);
    }

    const { data: allPublishedPosts } = await publishedQuery;

    // Apply portfolio access rules to published posts
    const accessiblePublishedPosts = await filterPostsByPortfolioAccess(
      user.id,
      allPublishedPosts || []
    );

    // Filter published posts by context
    // Only include posts where publish_target matches OR all linkedin_posts match the context
    let filteredPublishedForStatus = accessiblePublishedPosts;
    if (context === "personal") {
      filteredPublishedForStatus = filteredPublishedForStatus.filter((post: any) => {
        // If publish_target is explicitly "personal", include it
        if (post.publish_target === "personal") {
          return true;
        }
        // If no publish_target and no linkedin_posts, include it (defaults to personal)
        if (!post.publish_target && (!post.linkedin_posts || post.linkedin_posts.length === 0)) {
          return true;
        }
        // If all linkedin_posts are personal (organization_id === null), include it
        if (post.linkedin_posts && post.linkedin_posts.length > 0) {
          const allPersonal = post.linkedin_posts.every(
            (lp: any) => lp.organization_id === null
          );
          return allPersonal;
        }
        return false;
      });
    } else if (context && context !== "all") {
      // Context is a specific organization ID
      filteredPublishedForStatus = filteredPublishedForStatus.filter((post: any) => {
        // If publish_target matches the context, include it
        if (post.publish_target === context) {
          return true;
        }
        // If all linkedin_posts are for this organization, include it
        if (post.linkedin_posts && post.linkedin_posts.length > 0) {
          const allMatchingOrg = post.linkedin_posts.every(
            (lp: any) => lp.organization_id === context
          );
          return allMatchingOrg;
        }
        return false;
      });
    }

    const postsByStatus = {
      published: filteredPublishedForStatus.length || 0,
      scheduled: 0, // Will fetch separately for scheduled posts
      draft: 0,
      archived: 0,
    };

    // Fetch scheduled posts published in this period
    // Include posts from all portfolio members if user is in a portfolio
    // Use admin client when in portfolio context to bypass RLS for nested linkedin_posts
    const scheduledSupabase = portfolioIdFilter ? supabaseAdmin : supabase;
    let scheduledQuery = scheduledSupabase
      .from("posts")
      .select("id, publish_target, user_id, portfolio_id, linkedin_posts(organization_id)")
      .eq("status", "SCHEDULED")
      .gte("scheduled_publish_date", startDate.toISOString())
      .lte("scheduled_publish_date", endDate.toISOString());

    if (portfolioIdFilter) {
      scheduledQuery = scheduledQuery
        .in("user_id", userIdsToQuery)
        .eq("portfolio_id", portfolioIdFilter);
    } else {
      scheduledQuery = scheduledQuery.eq("user_id", user.id).is("portfolio_id", null);
    }

    const { data: scheduledPosts } = await scheduledQuery;

    // Apply portfolio access rules to scheduled posts
    const accessibleScheduledPosts = await filterPostsByPortfolioAccess(
      user.id,
      scheduledPosts || []
    );

    // Filter scheduled posts by context
    // Only include posts where publish_target matches OR all linkedin_posts match the context
    let filteredScheduled = accessibleScheduledPosts;
    if (context === "personal") {
      filteredScheduled = filteredScheduled.filter((post: any) => {
        // If publish_target is explicitly "personal", include it
        if (post.publish_target === "personal") {
          return true;
        }
        // If no publish_target and no linkedin_posts, include it (defaults to personal)
        if (!post.publish_target && (!post.linkedin_posts || post.linkedin_posts.length === 0)) {
          return true;
        }
        // If all linkedin_posts are personal (organization_id === null), include it
        if (post.linkedin_posts && post.linkedin_posts.length > 0) {
          const allPersonal = post.linkedin_posts.every(
            (lp: any) => lp.organization_id === null
          );
          return allPersonal;
        }
        return false;
      });
    } else if (context && context !== "all") {
      // Context is a specific organization ID
      filteredScheduled = filteredScheduled.filter((post: any) => {
        // If publish_target matches the context, include it
        if (post.publish_target === context) {
          return true;
        }
        // If all linkedin_posts are for this organization, include it
        if (post.linkedin_posts && post.linkedin_posts.length > 0) {
          const allMatchingOrg = post.linkedin_posts.every(
            (lp: any) => lp.organization_id === context
          );
          return allMatchingOrg;
        }
        return false;
      });
    }

    postsByStatus.scheduled = filteredScheduled.length || 0;

    // Fetch drafts and archived posts created in this period
    // Include posts from all portfolio members if user is in a portfolio
    // Use admin client when in portfolio context to bypass RLS for nested linkedin_posts
    const draftSupabase = portfolioIdFilter ? supabaseAdmin : supabase;
    let draftQuery = draftSupabase
      .from("posts")
      .select("id, publish_target, user_id, portfolio_id, linkedin_posts(organization_id)")
      .eq("status", "DRAFT")
      .gte("created_at", startDate.toISOString())
      .lte("created_at", endDate.toISOString());

    if (portfolioIdFilter) {
      draftQuery = draftQuery
        .in("user_id", userIdsToQuery)
        .eq("portfolio_id", portfolioIdFilter);
    } else {
      draftQuery = draftQuery.eq("user_id", user.id).is("portfolio_id", null);
    }

    const { data: draftPosts } = await draftQuery;

    // Apply portfolio access rules to draft posts
    const accessibleDraftPosts = await filterPostsByPortfolioAccess(
      user.id,
      draftPosts || []
    );

    // Filter draft posts by context
    // Only include posts where publish_target matches OR all linkedin_posts match the context
    let filteredDrafts = accessibleDraftPosts;
    if (context === "personal") {
      filteredDrafts = filteredDrafts.filter((post: any) => {
        // If publish_target is explicitly "personal", include it
        if (post.publish_target === "personal") {
          return true;
        }
        // If no publish_target and no linkedin_posts, include it (defaults to personal)
        if (!post.publish_target && (!post.linkedin_posts || post.linkedin_posts.length === 0)) {
          return true;
        }
        // If all linkedin_posts are personal (organization_id === null), include it
        if (post.linkedin_posts && post.linkedin_posts.length > 0) {
          const allPersonal = post.linkedin_posts.every(
            (lp: any) => lp.organization_id === null
          );
          return allPersonal;
        }
        return false;
      });
    } else if (context && context !== "all") {
      // Context is a specific organization ID
      filteredDrafts = filteredDrafts.filter((post: any) => {
        // If publish_target matches the context, include it
        if (post.publish_target === context) {
          return true;
        }
        // If all linkedin_posts are for this organization, include it
        if (post.linkedin_posts && post.linkedin_posts.length > 0) {
          const allMatchingOrg = post.linkedin_posts.every(
            (lp: any) => lp.organization_id === context
          );
          return allMatchingOrg;
        }
        return false;
      });
    }

    // Include posts from all portfolio members if user is in a portfolio
    // Use admin client when in portfolio context to bypass RLS for nested linkedin_posts
    const archivedSupabase = portfolioIdFilter ? supabaseAdmin : supabase;
    let archivedQuery = archivedSupabase
      .from("posts")
      .select("id, publish_target, user_id, portfolio_id, linkedin_posts(organization_id)")
      .eq("status", "ARCHIVED")
      .gte("created_at", startDate.toISOString())
      .lte("created_at", endDate.toISOString());

    if (portfolioIdFilter) {
      archivedQuery = archivedQuery
        .in("user_id", userIdsToQuery)
        .eq("portfolio_id", portfolioIdFilter);
    } else {
      archivedQuery = archivedQuery.eq("user_id", user.id).is("portfolio_id", null);
    }

    const { data: archivedPosts } = await archivedQuery;

    // Apply portfolio access rules to archived posts
    const accessibleArchivedPosts = await filterPostsByPortfolioAccess(
      user.id,
      archivedPosts || []
    );

    // Filter archived posts by context
    // Only include posts where publish_target matches OR all linkedin_posts match the context
    let filteredArchived = accessibleArchivedPosts;
    if (context === "personal") {
      filteredArchived = filteredArchived.filter((post: any) => {
        // If publish_target is explicitly "personal", include it
        if (post.publish_target === "personal") {
          return true;
        }
        // If no publish_target and no linkedin_posts, include it (defaults to personal)
        if (!post.publish_target && (!post.linkedin_posts || post.linkedin_posts.length === 0)) {
          return true;
        }
        // If all linkedin_posts are personal (organization_id === null), include it
        if (post.linkedin_posts && post.linkedin_posts.length > 0) {
          const allPersonal = post.linkedin_posts.every(
            (lp: any) => lp.organization_id === null
          );
          return allPersonal;
        }
        return false;
      });
    } else if (context && context !== "all") {
      // Context is a specific organization ID
      filteredArchived = filteredArchived.filter((post: any) => {
        // If publish_target matches the context, include it
        if (post.publish_target === context) {
          return true;
        }
        // If all linkedin_posts are for this organization, include it
        if (post.linkedin_posts && post.linkedin_posts.length > 0) {
          const allMatchingOrg = post.linkedin_posts.every(
            (lp: any) => lp.organization_id === context
          );
          return allMatchingOrg;
        }
        return false;
      });
    }

    postsByStatus.draft = filteredDrafts.length || 0;
    postsByStatus.archived = filteredArchived.length || 0;

    const response: AnalyticsResponse = {
      currentPeriod: {
        impressions: totalImpressions,
        engagement: totalEngagement,
        engagementRate: avgEngagementRate,
        postCount: filteredPosts.length || 0,
        topPostsByImpressions,
        previousPeriod:
          period !== "all"
            ? {
                impressions: prevImpressions,
                engagement: prevEngagement,
                engagementRate: prevEngagementRate,
                postCount: previousPeriodMetrics.length,
              }
            : undefined,
      },
      timeSeriesData,
      publishingPatterns,
      postsByStatus,
    };

    return NextResponse.json({
      success: true,
      data: response,
      period,
      dateRange: {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
      },
    });
  } catch (error) {
    console.error("Error in analytics API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
