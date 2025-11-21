import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

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

    // Calculate date range for next 7 days
    const now = new Date();
    const startOfToday = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
    );
    const endOfSevenDays = new Date(
      startOfToday.getTime() + 7 * 24 * 60 * 60 * 1000
    );

    // Query scheduled posts within the next 7 days
    const { data: scheduledPosts, error: scheduledError } = await supabase
      .from("posts")
      .select(
        `
        id,
        content,
        two_para_summary,
        scheduled_publish_date,
        published_at,
        status,
        publish_target,
        linkedin_posts(
          linkedin_post_id,
          status,
          published_at,
          organization_id
        )
      `
      )
      .eq("user_id", user.id)
      .eq("status", "SCHEDULED")
      .not("scheduled_publish_date", "is", null)
      .gte("scheduled_publish_date", startOfToday.toISOString())
      .lt("scheduled_publish_date", endOfSevenDays.toISOString());

    if (scheduledError) {
      console.error("Error fetching scheduled posts:", scheduledError);
      return NextResponse.json(
        { error: "Failed to fetch scheduled posts" },
        { status: 500 }
      );
    }

    // Query published posts that were scheduled within the next 7 days or published within the next 7 days
    // We'll fetch all published posts and filter in memory to handle the OR condition
    const { data: allPublishedPosts, error: publishedError } = await supabase
      .from("posts")
      .select(
        `
        id,
        content,
        two_para_summary,
        scheduled_publish_date,
        published_at,
        status,
        publish_target,
        linkedin_posts(
          linkedin_post_id,
          status,
          published_at,
          organization_id
        )
      `
      )
      .eq("user_id", user.id)
      .eq("status", "PUBLISHED");

    if (publishedError) {
      console.error("Error fetching published posts:", publishedError);
      return NextResponse.json(
        { error: "Failed to fetch published posts" },
        { status: 500 }
      );
    }

    // Filter published posts to those within the date range
    const publishedPosts = (allPublishedPosts || []).filter((post) => {
      const scheduledDate = post.scheduled_publish_date
        ? new Date(post.scheduled_publish_date)
        : null;
      const publishedDate = post.published_at
        ? new Date(post.published_at)
        : null;

      // Include if scheduled date is in range OR published date is in range
      const scheduledInRange =
        scheduledDate &&
        scheduledDate >= startOfToday &&
        scheduledDate < endOfSevenDays;
      const publishedInRange =
        publishedDate &&
        publishedDate >= startOfToday &&
        publishedDate < endOfSevenDays;

      return scheduledInRange || publishedInRange;
    });

    // Combine and sort posts
    // For scheduled posts, use scheduled_publish_date
    // For published posts, use published_at if available, otherwise scheduled_publish_date
    // Sort in descending order (most recent first)
    const allPosts = [...(scheduledPosts || []), ...publishedPosts].sort(
      (a, b) => {
        const getSortDate = (post: any): number => {
          // For published posts, prioritize published_at
          if (post.status === "PUBLISHED" && post.published_at) {
            const date = new Date(post.published_at);
            return isNaN(date.getTime()) ? 0 : date.getTime();
          }
          // For scheduled posts or published posts without published_at, use scheduled_publish_date
          if (post.scheduled_publish_date) {
            const date = new Date(post.scheduled_publish_date);
            return isNaN(date.getTime()) ? 0 : date.getTime();
          }
          // Fallback to 0 for posts without dates (shouldn't happen, but handle gracefully)
          return 0;
        };

        const dateA = getSortDate(a);
        const dateB = getSortDate(b);

        // Sort in descending order: newer dates (larger timestamps) come first
        return dateB - dateA;
      }
    );

    const posts = allPosts;

    // Fetch organization names for organization posts
    const organizationIds = new Set<string>();
    posts?.forEach((post) => {
      // Check linkedin_posts for organization_id
      post.linkedin_posts?.forEach((lp: any) => {
        if (lp.organization_id) {
          organizationIds.add(lp.organization_id);
        }
      });

      // Also check publish_target for organization info
      if (post.publish_target && post.publish_target !== "personal") {
        organizationIds.add(post.publish_target);
      }
    });

    let organizations: Record<string, string> = {};
    if (organizationIds.size > 0) {
      const { data: orgData } = await supabase
        .from("linkedin_organizations")
        .select("linkedin_org_id, org_name")
        .eq("user_id", user.id)
        .in("linkedin_org_id", Array.from(organizationIds));

      organizations =
        orgData?.reduce((acc, org) => {
          acc[org.linkedin_org_id] = org.org_name || org.linkedin_org_id;
          return acc;
        }, {} as Record<string, string>) || {};
    }

    return NextResponse.json({
      posts: posts || [],
      organizations,
      dateRange: {
        start: startOfToday.toISOString(),
        end: endOfSevenDays.toISOString(),
      },
    });
  } catch (error) {
    console.error("Error in scheduled posts API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
