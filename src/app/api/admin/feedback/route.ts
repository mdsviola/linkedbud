import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";
import { getSignedStorageUrl } from "@/lib/storage";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient();

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user has admin role
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profileError || !profile || profile.role !== "admin") {
      return NextResponse.json({ error: "Not admin" }, { status: 403 });
    }

    // Get pagination parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = (page - 1) * limit;
    const status = searchParams.get("status") || null;
    const type = searchParams.get("type") || null;
    const search = searchParams.get("search") || null;

    // Build query
    let query = supabase
      .from("feedback_submissions")
      .select("*")
      .order("created_at", { ascending: false });

    // Apply filters
    if (status) {
      query = query.eq("status", status);
    }
    if (type) {
      query = query.eq("type", type);
    }

    // Apply search filter (search in email, message, or user_id)
    if (search) {
      query = query.or(
        `email.ilike.%${search}%,message.ilike.%${search}%,user_id.ilike.%${search}%`
      );
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data: feedback, error: feedbackError } = await query;

    if (feedbackError) {
      console.error("Error fetching feedback:", feedbackError);
      return NextResponse.json(
        { error: "Failed to fetch feedback" },
        { status: 500 }
      );
    }

    // Generate signed URLs for screenshots
    const feedbackWithUrls = await Promise.all(
      (feedback || []).map(async (item) => {
        let screenshotUrl: string | null = null;
        if (item.screenshot_url) {
          // Check if it's already a full URL
          if (
            item.screenshot_url.startsWith("http://") ||
            item.screenshot_url.startsWith("https://")
          ) {
            screenshotUrl = item.screenshot_url;
          } else {
            // Generate signed URL for screenshot (valid for 1 hour)
            screenshotUrl = await getSignedStorageUrl(
              supabase,
              item.screenshot_url,
              3600
            );
            if (!screenshotUrl) {
              console.warn(
                `Failed to generate signed URL for screenshot: ${item.screenshot_url}`
              );
            }
          }
        }
        return {
          ...item,
          screenshot_url: screenshotUrl,
        };
      })
    );

    // Get total count for pagination
    let countQuery = supabase
      .from("feedback_submissions")
      .select("*", { count: "exact", head: true });

    if (status) {
      countQuery = countQuery.eq("status", status);
    }
    if (type) {
      countQuery = countQuery.eq("type", type);
    }
    if (search) {
      countQuery = countQuery.or(
        `email.ilike.%${search}%,message.ilike.%${search}%,user_id.ilike.%${search}%`
      );
    }

    const { count, error: countError } = await countQuery;

    if (countError) {
      console.error("Error fetching feedback count:", countError);
      return NextResponse.json(
        { error: "Failed to fetch feedback count" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      feedback: feedbackWithUrls,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    console.error("Error in feedback API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

