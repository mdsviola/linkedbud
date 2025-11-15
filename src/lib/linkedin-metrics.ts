import { createClientClient } from "@/lib/supabase-client";
import type { LinkedInPostMetrics } from "@/lib/linkedin";

/**
 * Calculate metrics trend between two data points
 */
export function calculateMetricsTrend(
  current: LinkedInPostMetrics,
  previous: LinkedInPostMetrics
): {
  impressions: number;
  likes: number;
  comments: number;
  shares: number;
  clicks: number;
  engagementRate: number;
} {
  return {
    impressions: current.impressions - previous.impressions,
    likes: current.likes - previous.likes,
    comments: current.comments - previous.comments,
    shares: current.shares - previous.shares,
    clicks: current.clicks - previous.clicks,
    engagementRate:
      (current.engagementRate || 0) - (previous.engagementRate || 0),
  };
}

/**
 * Format metrics for display
 */
export function formatMetrics(metrics: LinkedInPostMetrics): {
  impressions: string;
  likes: string;
  comments: string;
  shares: string;
  clicks: string;
  engagementRate: string;
} {
  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + "M";
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + "K";
    }
    return num.toString();
  };

  return {
    impressions: formatNumber(metrics.impressions),
    likes: formatNumber(metrics.likes),
    comments: formatNumber(metrics.comments),
    shares: formatNumber(metrics.shares),
    clicks: formatNumber(metrics.clicks),
    engagementRate: metrics.engagementRate
      ? `${(metrics.engagementRate * 100).toFixed(2)}%`
      : "0%",
  };
}

/**
 * Get metrics history for a specific post (client-side)
 */
export async function getMetricsHistoryClient(
  linkedinPostId: string,
  userId: string
): Promise<LinkedInPostMetrics[]> {
  try {
    const supabase = createClientClient();

    const { data, error } = await supabase
      .from("linkedin_post_metrics")
      .select("*")
      .eq("linkedin_post_id", linkedinPostId)
      .eq("user_id", userId)
      .order("fetched_at", { ascending: true });

    if (error) {
      console.error("Error fetching metrics history:", error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error("Error fetching metrics history:", error);
    return [];
  }
}

/**
 * Get latest metrics for a specific post (client-side)
 */
export async function getLatestMetricsClient(
  linkedinPostId: string,
  userId: string
): Promise<LinkedInPostMetrics | null> {
  try {
    const supabase = createClientClient();

    const { data, error } = await supabase
      .from("linkedin_post_metrics")
      .select("*")
      .eq("linkedin_post_id", linkedinPostId)
      .eq("user_id", userId)
      .order("fetched_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error("Error fetching latest metrics:", error);
      return null;
    }

    return data;
  } catch (error) {
    console.error("Error fetching latest metrics:", error);
    return null;
  }
}
