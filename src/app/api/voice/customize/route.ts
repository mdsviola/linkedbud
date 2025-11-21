import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";
import { createOrUpdateVoiceProfile, deleteVoiceProfile } from "@/lib/voice-utils";

export const dynamic = "force-dynamic";

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

    const { profile_type, organization_id, posts, delete_profile } = await request.json();

    // Handle profile deletion
    if (delete_profile) {
      if (!profile_type || !["personal", "organization"].includes(profile_type)) {
        return NextResponse.json(
          { error: "Valid profile_type (personal or organization) is required for deletion" },
          { status: 400 }
        );
      }

      const deleted = await deleteVoiceProfile(
        user.id,
        profile_type,
        organization_id || null
      );

      if (deleted) {
        return NextResponse.json({
          success: true,
          message: "Voice profile deleted successfully",
        });
      } else {
        return NextResponse.json(
          { error: "Failed to delete voice profile" },
          { status: 500 }
        );
      }
    }

    if (!profile_type || !["personal", "organization"].includes(profile_type)) {
      return NextResponse.json(
        { error: "Valid profile_type (personal or organization) is required" },
        { status: 400 }
      );
    }

    // If organization profile, verify user has access to the organization first
    if (profile_type === "organization" && organization_id) {
      const { data: org, error: orgError } = await supabase
        .from("linkedin_organizations")
        .select("id")
        .eq("user_id", user.id)
        .eq("linkedin_org_id", organization_id)
        .single();

      if (orgError || !org) {
        return NextResponse.json(
          {
            error:
              "Organization not found or you don't have access to it",
          },
          { status: 403 }
        );
      }
    }

    // Filter out empty posts from user-submitted posts
    const userSubmittedPosts = posts && Array.isArray(posts)
      ? posts
          .map((p: string) => (typeof p === "string" ? p.trim() : ""))
          .filter((p: string) => p.length > 0)
      : [];

    // Fetch existing published posts for this profile (last 10 max)
    let existingPublishedPosts: string[] = [];
    let existingPostIds: number[] = [];

    const publishTargetFilter = profile_type === "personal"
      ? "personal"
      : organization_id || null;

    // Fetch last 10 published posts for this profile
    let postsQuery = supabase
      .from("posts")
      .select("id, content")
      .eq("user_id", user.id)
      .eq("status", "PUBLISHED")
      .order("published_at", { ascending: false })
      .limit(10);

    if (profile_type === "personal") {
      postsQuery = postsQuery.or("publish_target.eq.personal,publish_target.is.null");
    } else if (organization_id) {
      postsQuery = postsQuery.eq("publish_target", organization_id);
    }

    const { data: publishedPosts, error: postsError } = await postsQuery;

    if (!postsError && publishedPosts) {
      // Filter posts by actual publish target (check linkedin_posts for organization)
      if (profile_type === "organization" && organization_id) {
        const { data: linkedinPosts } = await supabase
          .from("linkedin_posts")
          .select("post_id, organization_id")
          .in("post_id", publishedPosts.map((p) => p.id))
          .eq("organization_id", organization_id);

        const validPostIds = new Set(
          linkedinPosts?.map((lp) => lp.post_id) || []
        );

        const validPosts = publishedPosts.filter((p) => validPostIds.has(p.id));
        existingPublishedPosts = validPosts.map((p) => p.content).filter((c) => c && c.trim().length > 0);
        existingPostIds = validPosts.map((p) => p.id);
      } else {
        // Personal posts (already filtered by query above)
        existingPublishedPosts = publishedPosts
          .map((p) => p.content)
          .filter((c) => c && c.trim().length > 0);
        existingPostIds = publishedPosts.map((p) => p.id);
      }
    }

    // Combine existing published posts with user-submitted posts
    // Remove duplicates and limit to last 10 posts total
    const combinedPosts = Array.from(
      new Set([...existingPublishedPosts, ...userSubmittedPosts])
    ).slice(0, 10);

    if (combinedPosts.length < 1) {
      return NextResponse.json(
        {
          error: "At least 1 post is required for voice extraction. Please provide posts or publish some posts first.",
        },
        { status: 400 }
      );
    }

    // Create or update voice profile
    try {
      // Prepare source post IDs (existing published posts + any new ones)
      const sourcePostIds = existingPostIds.map((id) => id.toString());

      const voiceProfile = await createOrUpdateVoiceProfile(
        user.id,
        profile_type,
        combinedPosts,
        organization_id || null,
        sourcePostIds
      );

      return NextResponse.json({
        success: true,
        voice_profile: voiceProfile,
      });
    } catch (error) {
      console.error("Error customizing voice profile:", error);

      // Provide user-friendly error messages
      let errorMessage = "Failed to customize voice profile. Please try again.";

      if (error instanceof Error) {
        if (error.message.includes("At least 1 post") || error.message.includes("At least 2 posts")) {
          errorMessage = "At least 1 post is required for voice extraction. Please provide posts or publish some posts first.";
        } else if (error.message.includes("Failed to extract voice profile")) {
          errorMessage = "We couldn't extract your writing voice from these posts. Please try with different posts.";
        } else if (error.message.includes("Failed to parse")) {
          errorMessage = "We had trouble analyzing your posts. Please try again.";
        }
      }

      return NextResponse.json(
        {
          error: errorMessage,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error in voice customization API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

