import { createServerClient } from "./supabase-server";
import { extractVoiceProfile } from "./openai";
import { VoiceProfile } from "./openai";

export interface VoiceProfileRecord {
  id: number;
  user_id: string;
  profile_type: "personal" | "organization";
  organization_id: string | null;
  voice_data: any;
  voice_description: string;
  source_posts: string[];
  created_at: string;
  updated_at: string;
}

/**
 * Get all voice profiles for a user (personal + organizations)
 */
export async function getVoiceProfiles(
  userId: string
): Promise<VoiceProfileRecord[]> {
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from("voice_profiles")
    .select("*")
    .eq("user_id", userId)
    .order("profile_type", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching voice profiles:", error);
    return [];
  }

  return data || [];
}

/**
 * Get a specific voice profile
 */
export async function getVoiceProfile(
  userId: string,
  profileType: "personal" | "organization",
  organizationId?: string | null
): Promise<VoiceProfileRecord | null> {
  const supabase = createServerClient();

  let query = supabase
    .from("voice_profiles")
    .select("*")
    .eq("user_id", userId)
    .eq("profile_type", profileType);

  if (organizationId) {
    query = query.eq("organization_id", organizationId);
  } else {
    query = query.is("organization_id", null);
  }

  const { data, error } = await query.single();

  if (error) {
    if (error.code === "PGRST116") {
      // No rows returned - profile doesn't exist
      return null;
    }
    console.error("Error fetching voice profile:", error);
    return null;
  }

  return data;
}

/**
 * Check if a voice profile is available
 */
export async function isVoiceProfileAvailable(
  userId: string,
  profileType: "personal" | "organization",
  organizationId?: string | null
): Promise<boolean> {
  const profile = await getVoiceProfile(userId, profileType, organizationId);
  return profile !== null;
}

/**
 * Create or update a voice profile from posts
 */
export async function createOrUpdateVoiceProfile(
  userId: string,
  profileType: "personal" | "organization",
  posts: string[],
  organizationId?: string | null,
  sourcePostIds: string[] = []
): Promise<VoiceProfileRecord | null> {
  if (!posts || posts.length < 1) {
    throw new Error("At least 1 post is required for voice profile extraction");
  }

  // Extract voice profile using AI
  const voiceProfile = await extractVoiceProfile(posts);

  const supabase = createServerClient();

  // Check if profile exists
  const existingProfile = await getVoiceProfile(
    userId,
    profileType,
    organizationId
  );

  if (existingProfile) {
    // Update existing profile - combine source posts
    // If we have new post IDs, add them; otherwise keep existing ones
    const updatedSourcePosts = sourcePostIds.length > 0
      ? Array.from(new Set([...existingProfile.source_posts, ...sourcePostIds]))
      : existingProfile.source_posts; // Keep existing if no new IDs

    const { data, error } = await supabase
      .from("voice_profiles")
      .update({
        voice_data: voiceProfile.voice_data,
        voice_description: voiceProfile.voice_description,
        source_posts: updatedSourcePosts,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existingProfile.id)
      .select()
      .single();

    if (error) {
      console.error("Error updating voice profile:", error);
      throw new Error("Failed to update voice profile");
    }

    return data;
  } else {
    // Create new profile
    // For onboarding/settings posts (no IDs), we'll store a marker indicating count
    // For published posts (with IDs), we'll store the IDs
    let sourcePostsToStore: string[] = [];

    if (sourcePostIds.length > 0) {
      // We have actual post IDs (from published posts)
      sourcePostsToStore = sourcePostIds;
    } else {
      // No IDs provided - this is from onboarding/settings posts
      // Store a marker indicating the number of posts used
      sourcePostsToStore = [`onboarding_${posts.length}`];
    }

    const { data, error } = await supabase
      .from("voice_profiles")
      .insert({
        user_id: userId,
        profile_type: profileType,
        organization_id: organizationId || null,
        voice_data: voiceProfile.voice_data,
        voice_description: voiceProfile.voice_description,
        source_posts: sourcePostsToStore,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating voice profile:", error);
      throw new Error("Failed to create voice profile");
    }

    return data;
  }
}

/**
 * Enhance voice profile by adding a newly published post
 */
export async function enhanceVoiceProfile(
  userId: string,
  profileType: "personal" | "organization",
  publishedPostId: number,
  postContent: string,
  organizationId?: string | null
): Promise<void> {
  try {
    const supabase = createServerClient();

    // Get existing profile
    const existingProfile = await getVoiceProfile(
      userId,
      profileType,
      organizationId
    );

    // Get all published posts for this profile
    let publishedPosts: string[] = [];

    if (existingProfile && existingProfile.source_posts.length > 0) {
      // Fetch existing source posts from database
      // Filter out onboarding markers (they start with "onboarding_")
      const postIds = existingProfile.source_posts
        .filter((id) => !id.startsWith("onboarding_"))
        .map((id) => parseInt(id))
        .filter((id) => !isNaN(id) && id !== publishedPostId);

      if (postIds.length > 0) {
        const { data: existingPosts } = await supabase
          .from("posts")
          .select("content")
          .in("id", postIds)
          .eq("user_id", userId)
          .eq("status", "PUBLISHED");

        if (existingPosts) {
          publishedPosts = existingPosts
            .map((p) => p.content)
            .filter((c) => c && c.trim().length > 0);
        }
      }
    }

    // Add the new post
    publishedPosts.push(postContent);

    // Only enhance if we have at least 2 posts total
    if (publishedPosts.length < 2) {
      console.log(
        "Not enough posts for voice enhancement. Need at least 2 posts."
      );
      return;
    }

    // Prepare source posts array: keep onboarding markers, add new post ID
    const existingSourcePosts = existingProfile?.source_posts || [];
    const onboardingMarkers = existingSourcePosts.filter((id) => id.startsWith("onboarding_"));
    const existingPostIds = existingSourcePosts
      .filter((id) => !id.startsWith("onboarding_"))
      .map((id) => {
        const num = parseInt(id);
        return !isNaN(num) && num !== publishedPostId ? num : null;
      })
      .filter((id): id is number => id !== null);

    // Create or update voice profile with all source post IDs
    // Combine: new post ID + existing post IDs + onboarding markers
    const allSourcePosts = [
      publishedPostId.toString(),
      ...existingPostIds.map((id) => id.toString()),
      ...onboardingMarkers, // Keep onboarding markers
    ];

    await createOrUpdateVoiceProfile(
      userId,
      profileType,
      publishedPosts,
      organizationId,
      allSourcePosts
    );

    console.log(
      `Voice profile enhanced for user ${userId}, ${profileType}${
        organizationId ? `, org ${organizationId}` : ""
      }`
    );
  } catch (error) {
    // Don't throw - voice enhancement should not block post publishing
    console.error("Error enhancing voice profile:", error);
  }
}

/**
 * Delete a voice profile
 */
export async function deleteVoiceProfile(
  userId: string,
  profileType: "personal" | "organization",
  organizationId?: string | null
): Promise<boolean> {
  const supabase = createServerClient();

  const query = supabase
    .from("voice_profiles")
    .delete()
    .eq("user_id", userId)
    .eq("profile_type", profileType);

  if (organizationId) {
    query.eq("organization_id", organizationId);
  } else {
    query.is("organization_id", null);
  }

  const { error } = await query;

  if (error) {
    console.error("Error deleting voice profile:", error);
    return false;
  }

  return true;
}

