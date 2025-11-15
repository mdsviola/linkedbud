import { createServerClient } from "@/lib/supabase-server";
import { LinkedInClient, getLinkedInToken } from "@/lib/linkedin";
import type { LinkedInPostMetrics } from "@/lib/linkedin";

/**
 * Fetch and store metrics for a specific LinkedIn post
 */
export async function fetchAndStoreMetrics(
  linkedinPostId: string,
  userId: string,
  accessToken: string,
  organizationId?: string
): Promise<LinkedInPostMetrics | null> {
  try {
    const linkedinAPI = new LinkedInClient(accessToken);
    const metrics = await linkedinAPI.getPostMetrics(
      linkedinPostId,
      organizationId
    );

    const supabase = createServerClient();

    // Calculate today's date at midnight UTC for consistent daily records
    const todayMidnightUTC = new Date();
    todayMidnightUTC.setUTCHours(0, 0, 0, 0);
    const fetchedAt = todayMidnightUTC.toISOString();

    // Check if a record already exists for this post and user for today
    // Use a date range to find records for the same day (more robust than exact timestamp match)
    const startOfDay = new Date(fetchedAt);
    const endOfDay = new Date(fetchedAt);
    endOfDay.setUTCDate(endOfDay.getUTCDate() + 1);

    const { data: existingRecord } = await supabase
      .from("linkedin_post_metrics")
      .select("*")
      .eq("linkedin_post_id", linkedinPostId)
      .eq("user_id", userId)
      .gte("fetched_at", startOfDay.toISOString())
      .lt("fetched_at", endOfDay.toISOString())
      .maybeSingle();

    let data, error;

    if (existingRecord) {
      // Update existing record
      const updateResult = await supabase
        .from("linkedin_post_metrics")
        .update({
          impressions: metrics.impressions,
          likes: metrics.likes,
          comments: metrics.comments,
          shares: metrics.shares,
          clicks: metrics.clicks,
          engagement_rate: metrics.engagementRate,
        })
        .eq("id", existingRecord.id)
        .select()
        .single();

      data = updateResult.data;
      error = updateResult.error;
    } else {
      // Insert new record
      const insertResult = await supabase
        .from("linkedin_post_metrics")
        .insert({
          linkedin_post_id: linkedinPostId,
          user_id: userId,
          impressions: metrics.impressions,
          likes: metrics.likes,
          comments: metrics.comments,
          shares: metrics.shares,
          clicks: metrics.clicks,
          engagement_rate: metrics.engagementRate,
          fetched_at: fetchedAt,
        })
        .select()
        .single();

      data = insertResult.data;
      error = insertResult.error;
    }

    if (error) {
      console.error("Error storing LinkedIn post metrics:", error);
      return null;
    }

    return data;
  } catch (error) {
    console.error("Error fetching LinkedIn post metrics:", error);
    return null;
  }
}

/**
 * Get metrics history for a specific post
 */
export async function getMetricsHistory(
  linkedinPostId: string,
  userId: string,
  days?: number
): Promise<LinkedInPostMetrics[]> {
  try {
    const supabase = createServerClient();

    let query = supabase
      .from("linkedin_post_metrics")
      .select("*")
      .eq("linkedin_post_id", linkedinPostId)
      .eq("user_id", userId);

    // If days is specified, filter by date range
    if (days) {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);
      const now = new Date();
      query = query
        .gte("fetched_at", cutoffDate.toISOString())
        .lte("fetched_at", now.toISOString());
    }

    const { data, error } = await query.order("fetched_at", {
      ascending: true,
    });

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
 * Get latest metrics for a specific post
 */
export async function getLatestMetrics(
  linkedinPostId: string,
  userId: string
): Promise<LinkedInPostMetrics | null> {
  try {
    const supabase = createServerClient();

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

/**
 * Update metrics for all recent posts (background job)
 */
export async function updateMetricsForRecentPosts(): Promise<void> {
  try {
    const supabase = createServerClient();

    // Get all published LinkedIn posts from the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: posts, error: postsError } = await supabase
      .from("linkedin_posts")
      .select(
        `
        linkedin_post_id,
        user_id,
        organization_id
      `
      )
      .eq("status", "PUBLISHED")
      .not("linkedin_post_id", "is", null)
      .gte("published_at", thirtyDaysAgo.toISOString());

    if (postsError) {
      console.error("Error fetching recent posts:", postsError);
      return;
    }

    if (!posts || posts.length === 0) {
      console.log("No recent posts to update metrics for");
      return;
    }

    console.log(`Updating metrics for ${posts.length} recent posts`);

    // Update metrics for each post
    const updatePromises = posts.map(async (post) => {
      if (!post.linkedin_post_id) {
        return;
      }

      try {
        // Get community token for this user
        const communityToken = await getLinkedInToken(
          post.user_id,
          "community"
        );
        if (!communityToken?.access_token) {
          console.warn(`No community token available for user ${post.user_id}`);
          return;
        }

        await fetchAndStoreMetrics(
          post.linkedin_post_id,
          post.user_id,
          communityToken.access_token,
          post.organization_id
        );
      } catch (error) {
        console.error(
          `Error updating metrics for post ${post.linkedin_post_id}:`,
          error
        );
      }
    });

    await Promise.all(updatePromises);
    console.log("Completed metrics update for recent posts");
  } catch (error) {
    console.error("Error in updateMetricsForRecentPosts:", error);
  }
}
