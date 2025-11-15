import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";
import {
  getLatestMetrics,
  getMetricsHistory,
  fetchAndStoreMetrics,
} from "@/lib/linkedin-metrics-server";
import { getLinkedInToken } from "@/lib/linkedin";
import { getUserPortfolio } from "@/lib/portfolio";
import { canUserAccessPost } from "@/lib/portfolio-posts";
import { supabaseAdmin } from "@/lib/supabase-server";

export const dynamic = 'force-dynamic';

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

    const { searchParams } = new URL(request.url);
    const linkedinPostId = searchParams.get("linkedinPostId");
    const includeHistory = searchParams.get("includeHistory") === "true";
    const daysParam = searchParams.get("days");
    const days = daysParam ? parseInt(daysParam, 10) : undefined;

    if (!linkedinPostId) {
      return NextResponse.json(
        { error: "LinkedIn post ID is required" },
        { status: 400 }
      );
    }

    // Find the post that has this linkedin_post_id and check if user can access it
    const { data: linkedinPost } = await supabaseAdmin
      .from("linkedin_posts")
      .select("post_id, user_id")
      .eq("linkedin_post_id", linkedinPostId)
      .maybeSingle();

    if (!linkedinPost) {
      return NextResponse.json({
        latest: null,
        history: includeHistory ? [] : undefined,
      });
    }

    // Check if user can access this post (handles portfolio access rules)
    const canAccess = await canUserAccessPost(user.id, linkedinPost.post_id);
    if (!canAccess) {
      return NextResponse.json(
        { error: "Post not found" },
        { status: 404 }
      );
    }

    // Get user's portfolio to determine which user IDs to query metrics from
    const portfolio = await getUserPortfolio(user.id);
    let userIdsToQuery = [user.id];

    if (portfolio) {
      // Get all portfolio member user IDs (owner + collaborators)
      const { data: collaborators } = await supabaseAdmin
        .from("portfolio_collaborators")
        .select("user_id")
        .eq("portfolio_id", portfolio.id)
        .eq("status", "accepted");

      userIdsToQuery = [
        portfolio.owner_id,
        linkedinPost.user_id, // Include post creator's user_id (metrics are stored with creator's user_id)
        ...(collaborators?.map((c) => c.user_id) || []),
      ];

      // Remove duplicates
      userIdsToQuery = Array.from(new Set(userIdsToQuery));
    } else {
      // If no portfolio, only query from the post creator's user_id
      userIdsToQuery = [linkedinPost.user_id];
    }

    // Get latest metrics from any portfolio member (metrics are the same for same linkedin_post_id)
    const latestMetrics = await getLatestMetricsForPortfolio(
      linkedinPostId,
      userIdsToQuery
    );

    if (!latestMetrics) {
      return NextResponse.json({
        latest: null,
        history: includeHistory ? [] : undefined,
      });
    }

    const response: any = {
      latest: latestMetrics,
    };

    // Include history if requested
    if (includeHistory) {
      const history = await getMetricsHistoryForPortfolio(
        linkedinPostId,
        userIdsToQuery,
        days
      );
      response.history = history;
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching LinkedIn metrics:", error);
    return NextResponse.json(
      { error: "Failed to fetch metrics" },
      { status: 500 }
    );
  }
}

/**
 * Get latest metrics for a LinkedIn post from any portfolio member
 * Uses admin client to bypass RLS (metrics are stored per user_id, but portfolio members need to see them)
 */
async function getLatestMetricsForPortfolio(
  linkedinPostId: string,
  userIds: string[]
): Promise<any | null> {
  try {
    // Use admin client to bypass RLS - metrics are stored with creator's user_id
    // but portfolio members need to see them
    const supabase = supabaseAdmin;

    const { data, error } = await supabase
      .from("linkedin_post_metrics")
      .select("*")
      .eq("linkedin_post_id", linkedinPostId)
      .in("user_id", userIds)
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
 * Get metrics history for a LinkedIn post from any portfolio member
 * Uses admin client to bypass RLS (metrics are stored per user_id, but portfolio members need to see them)
 */
async function getMetricsHistoryForPortfolio(
  linkedinPostId: string,
  userIds: string[],
  days?: number
): Promise<any[]> {
  try {
    // Use admin client to bypass RLS - metrics are stored with creator's user_id
    // but portfolio members need to see them
    const supabase = supabaseAdmin;

    let query = supabase
      .from("linkedin_post_metrics")
      .select("*")
      .eq("linkedin_post_id", linkedinPostId)
      .in("user_id", userIds);

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

    const { linkedinPostId } = await request.json();

    if (!linkedinPostId) {
      return NextResponse.json(
        { error: "LinkedIn post ID is required" },
        { status: 400 }
      );
    }

    // Get organization info for metrics API selection
    const { data: postRow } = await supabase
      .from("linkedin_posts")
      .select("organization_id")
      .eq("user_id", user.id)
      .eq("linkedin_post_id", linkedinPostId)
      .maybeSingle();

    // Always use community token for metrics fetching
    const communityToken = await getLinkedInToken(user.id, "community");
    const accessToken = communityToken?.access_token || null;

    if (!accessToken) {
      return NextResponse.json(
        {
          error:
            "LinkedIn community token not available. Please reconnect in Settings.",
        },
        { status: 400 }
      );
    }

    // Fetch and store fresh metrics
    const metrics = await fetchAndStoreMetrics(
      linkedinPostId,
      user.id,
      accessToken,
      postRow?.organization_id
    );

    if (!metrics) {
      return NextResponse.json(
        { error: "Failed to fetch metrics" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      metrics,
      message: "Metrics updated successfully",
    });
  } catch (error) {
    console.error("Error updating LinkedIn metrics:", error);
    return NextResponse.json(
      { error: "Failed to update metrics" },
      { status: 500 }
    );
  }
}
