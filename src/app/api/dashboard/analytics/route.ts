import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";

export const dynamic = 'force-dynamic';

interface MetricGroup {
  name: string;
  impressions: number;
  likes: number;
  comments: number;
  shares: number;
  clicks: number;
  engagement_rate: number;
  post_count: number;
}

interface AnalyticsData {
  total: MetricGroup;
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

    // Calculate date range for past 7 days (for metrics filtering)
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Fetch ALL published posts (regardless of when they were published)
    const { data: posts, error: postsError } = await supabase
      .from("posts")
      .select(
        `
        id,
        published_at,
        linkedin_posts(
          linkedin_post_id,
          organization_id,
          published_at
        )
      `
      )
      .eq("user_id", user.id)
      .eq("status", "PUBLISHED")
      .not("published_at", "is", null)
      .order("published_at", { ascending: false });

    if (postsError) {
      console.error("Error fetching published posts:", postsError);
      return NextResponse.json(
        { error: "Failed to fetch published posts" },
        { status: 500 }
      );
    }

    // Get unique LinkedIn post IDs from published posts
    const linkedinPostIds = new Set<string>();

    posts?.forEach((post) => {
      post.linkedin_posts?.forEach((lp: any) => {
        if (lp.linkedin_post_id) {
          linkedinPostIds.add(lp.linkedin_post_id);
        }
      });
    });

    // Fetch metrics for all LinkedIn posts, but only those fetched in the last 7 days
    let metricsData: any[] = [];
    if (linkedinPostIds.size > 0) {
      const { data: metrics, error: metricsError } = await supabase
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
        .eq("user_id", user.id)
        .in("linkedin_post_id", Array.from(linkedinPostIds))
        .gte("fetched_at", sevenDaysAgo.toISOString()) // Only metrics fetched in last 7 days
        .order("fetched_at", { ascending: false });

      if (metricsError) {
        console.error("Error fetching metrics:", metricsError);
        return NextResponse.json(
          { error: "Failed to fetch metrics" },
          { status: 500 }
        );
      }

      // Get the latest metrics for each post (since we ordered by fetched_at desc)
      const latestMetrics = new Map<string, any>();
      metrics?.forEach((metric) => {
        if (!latestMetrics.has(metric.linkedin_post_id)) {
          latestMetrics.set(metric.linkedin_post_id, metric);
        }
      });

      metricsData = Array.from(latestMetrics.values());
    }

    // Create metrics lookup map
    const metricsMap = new Map<string, any>();
    metricsData.forEach((metric) => {
      metricsMap.set(metric.linkedin_post_id, metric);
    });

    // Initialize total metrics group
    const total: MetricGroup = {
      name: "Total",
      impressions: 0,
      likes: 0,
      comments: 0,
      shares: 0,
      clicks: 0,
      engagement_rate: 0,
      post_count: 0,
    };

    // Aggregate all metrics into total
    metricsData.forEach((metric) => {
      total.impressions += metric.impressions || 0;
      total.likes += metric.likes || 0;
      total.comments += metric.comments || 0;
      total.shares += metric.shares || 0;
      total.clicks += metric.clicks || 0;
    });

    // Count total posts (including those without recent metrics)
    total.post_count = posts?.length || 0;

    // Calculate engagement rate
    if (total.impressions > 0) {
      const totalEngagement = total.likes + total.comments + total.shares;
      total.engagement_rate = Number(
        (totalEngagement / total.impressions).toFixed(4)
      );
    }

    const analyticsData: AnalyticsData = {
      total,
    };

    return NextResponse.json({
      success: true,
      data: analyticsData,
      dateRange: {
        start: sevenDaysAgo.toISOString(),
        end: now.toISOString(),
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
