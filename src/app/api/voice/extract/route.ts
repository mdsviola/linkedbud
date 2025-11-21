import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";
import { createOrUpdateVoiceProfile } from "@/lib/voice-utils";

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

    const { posts, profile_type, organization_id } = await request.json();

    // Validate input
    if (!posts || !Array.isArray(posts) || posts.length === 0) {
      return NextResponse.json(
        { error: "Posts array is required and must not be empty" },
        { status: 400 }
      );
    }

    if (!profile_type || !["personal", "organization"].includes(profile_type)) {
      return NextResponse.json(
        { error: "Valid profile_type (personal or organization) is required" },
        { status: 400 }
      );
    }

    // Filter out empty posts
    const validPosts = posts
      .map((p: string) => (typeof p === "string" ? p.trim() : ""))
      .filter((p: string) => p.length > 0);

    if (validPosts.length < 1) {
      return NextResponse.json(
        {
          error: "Please provide at least 1 post to extract your writing voice.",
        },
        { status: 400 }
      );
    }

    // If organization profile, verify user has access to the organization
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

    // Create or update voice profile
    try {
      const voiceProfile = await createOrUpdateVoiceProfile(
        user.id,
        profile_type,
        validPosts,
        organization_id || null,
        [] // Source post IDs - empty for initial extraction from onboarding/settings
      );

      return NextResponse.json({
        success: true,
        voice_profile: voiceProfile,
      });
    } catch (error) {
      console.error("Error extracting voice profile:", error);

      // Provide user-friendly error messages
      let errorMessage = "Failed to extract voice profile. Please try again.";

      if (error instanceof Error) {
        if (error.message.includes("At least 1 post") || error.message.includes("At least 2 posts")) {
          errorMessage = "Please provide at least 1 post to extract your writing voice.";
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
    console.error("Error in voice extraction API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

