import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";

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

    // Calculate date range for next 7 days
    const now = new Date();
    const startOfToday = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
    );
    const endOfSevenDays = new Date(
      startOfToday.getTime() + 7 * 24 * 60 * 60 * 1000
    );

    // Query scheduled posts within the next 7 days
    const { data: posts, error } = await supabase
      .from("posts")
      .select(
        `
        id,
        two_para_summary,
        scheduled_publish_date,
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
      .lt("scheduled_publish_date", endOfSevenDays.toISOString())
      .order("scheduled_publish_date", { ascending: true });

    if (error) {
      console.error("Error fetching scheduled posts:", error);
      return NextResponse.json(
        { error: "Failed to fetch scheduled posts" },
        { status: 500 }
      );
    }

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
      if (
        post.publish_target &&
        post.publish_target !== "personal"
      ) {
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
