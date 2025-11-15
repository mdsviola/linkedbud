import { NextRequest, NextResponse } from "next/server";
import { createServerClient, supabaseAdmin } from "@/lib/supabase-server";
import { getSignedStorageUrl } from "@/lib/storage";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const feedbackId = parseInt(params.id);
    if (isNaN(feedbackId)) {
      return NextResponse.json({ error: "Invalid feedback ID" }, { status: 400 });
    }

    // Fetch feedback submission
    const { data: feedback, error: feedbackError } = await supabase
      .from("feedback_submissions")
      .select("*")
      .eq("id", feedbackId)
      .single();

    if (feedbackError || !feedback) {
      return NextResponse.json(
        { error: "Feedback not found" },
        { status: 404 }
      );
    }

    // Generate signed URL for screenshot if available
    let screenshotUrl: string | null = null;
    if (feedback.screenshot_url) {
      // Check if it's already a full URL
      if (
        feedback.screenshot_url.startsWith("http://") ||
        feedback.screenshot_url.startsWith("https://")
      ) {
        screenshotUrl = feedback.screenshot_url;
      } else {
        // Generate signed URL for screenshot (valid for 1 hour)
        screenshotUrl = await getSignedStorageUrl(
          supabase,
          feedback.screenshot_url,
          3600
        );
        if (!screenshotUrl) {
          console.warn(
            `Failed to generate signed URL for screenshot: ${feedback.screenshot_url}`
          );
        }
      }
    }

    return NextResponse.json({
      feedback: {
        ...feedback,
        screenshot_url: screenshotUrl,
      },
    });
  } catch (error) {
    console.error("Error in feedback detail API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const feedbackId = parseInt(params.id);
    if (isNaN(feedbackId)) {
      return NextResponse.json({ error: "Invalid feedback ID" }, { status: 400 });
    }

    // Parse request body
    const body = await request.json();
    const { status } = body;

    // Validate status
    if (!status || !["new", "reviewed", "resolved"].includes(status)) {
      return NextResponse.json(
        { error: "Invalid status. Must be 'new', 'reviewed', or 'resolved'" },
        { status: 400 }
      );
    }

    // Update feedback status using admin client to bypass RLS
    const { data: updatedFeedback, error: updateError } = await supabaseAdmin
      .from("feedback_submissions")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", feedbackId)
      .select()
      .single();

    if (updateError || !updatedFeedback) {
      console.error("Error updating feedback status:", updateError);
      return NextResponse.json(
        { error: "Failed to update feedback status" },
        { status: 500 }
      );
    }

    // Generate signed URL for screenshot if available
    let screenshotUrl: string | null = null;
    if (updatedFeedback.screenshot_url) {
      if (
        updatedFeedback.screenshot_url.startsWith("http://") ||
        updatedFeedback.screenshot_url.startsWith("https://")
      ) {
        screenshotUrl = updatedFeedback.screenshot_url;
      } else {
        screenshotUrl = await getSignedStorageUrl(
          supabase,
          updatedFeedback.screenshot_url,
          3600
        );
      }
    }

    return NextResponse.json({
      feedback: {
        ...updatedFeedback,
        screenshot_url: screenshotUrl,
      },
    });
  } catch (error) {
    console.error("Error in feedback update API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

