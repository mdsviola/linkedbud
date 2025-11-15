import { createReadOnlyServerClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import { Database } from "@/types/database";
import { NextResponse } from "next/server";

// Custom error class for subscription limit violations
export class SubscriptionLimitError extends Error {
  requiresUpgrade: boolean;
  statusCode: number;
  limitType: string;

  constructor(
    message: string,
    limitType: string,
    requiresUpgrade: boolean = true,
    statusCode: number = 402
  ) {
    super(message);
    this.name = "SubscriptionLimitError";
    this.requiresUpgrade = requiresUpgrade;
    this.statusCode = statusCode;
    this.limitType = limitType;
  }
}

// Helper function to convert SubscriptionLimitError to NextResponse
export function handleSubscriptionLimitError(
  error: unknown
): NextResponse | null {
  if (error instanceof SubscriptionLimitError) {
    return NextResponse.json(
      {
        error: error.message,
        requiresUpgrade: error.requiresUpgrade,
      },
      { status: error.statusCode }
    );
  }
  return null;
}

type GenerationCounts = {
  draft?: number;
  polish?: number;
  for_you?: number;
  rewrite_with_ai?: number;
  ai_insights?: number;
};

// Tier mapping: maps price_id to tier name
// This allows different price_ids to share the same tier limits
// Supports pricing structure: LITE (Creator Lite), STARTER (Creator Pro), GROWTH, ENTERPRISE
const TIER_MAPPING: Record<string, string> = {
  // Map Creator Pro tier variant to STARTER tier (display name: "Creator Pro")
  [process.env.LEMONSQUEEZY_VARIANT_ID_PRO || ""]: "STARTER",
  // Map Growth tier variant
  [process.env.LEMONSQUEEZY_VARIANT_ID_GROWTH || ""]: "GROWTH",
  // Map Creator Lite tier variant to LITE tier (display name: "Creator Lite")
  [process.env.LEMONSQUEEZY_VARIANT_ID_LITE || ""]: "LITE",
  // Add more mappings as needed:
  // [process.env.LEMONSQUEEZY_VARIANT_ID_ENTERPRISE || ""]: "ENTERPRISE",
};

// Supported limit types
type LimitType =
  | "draft"
  | "polish"
  | "for_you"
  | "rewrite_with_ai"
  | "ai_insights";

// Get limit for a specific tier and type
function getTierLimit(tier: string, type: LimitType): number {
  const envKey = `TIER_${tier}_${type.toUpperCase()}_LIMIT`;

  // Default values based on tier and type
  let defaultValue: string;

  if (tier === "FREE") {
    switch (type) {
      case "draft":
        defaultValue = "3";
        break;
      case "polish":
        defaultValue = "10";
        break;
      case "for_you":
        defaultValue = "5";
        break;
      case "rewrite_with_ai":
        defaultValue = "5";
        break;
      case "ai_insights":
        defaultValue = "10";
        break;
    }
  } else if (tier === "LITE") {
    // Lite tier has specific limits
    switch (type) {
      case "draft":
        defaultValue = "30";
        break;
      default:
        // Other features are unlimited for Lite
        defaultValue = "-1";
        break;
    }
  } else {
    // Subscription tiers (STARTER, GROWTH, ENTERPRISE) default to unlimited
    defaultValue = "-1";
  }

  return parseInt(process.env[envKey] || defaultValue, 10);
}

// Default tier limits (for backward compatibility and as fallback)
const DEFAULT_TIER = "STARTER";

export async function getUser() {
  const supabase = createReadOnlyServerClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  return user;
}

export async function requireAuth() {
  const user = await getUser();

  if (!user) {
    redirect("/auth/signin");
  }

  return user;
}

export async function getUserProfile(userId: string) {
  const supabase = createReadOnlyServerClient();

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (error) {
    console.error("Error fetching user profile:", error);
    return null;
  }

  return profile;
}

export async function getUserPrefs(userId: string) {
  const supabase = createReadOnlyServerClient();

  const { data: prefs, error } = await supabase
    .from("user_prefs")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (error) {
    console.error("Error fetching user preferences:", error);
    return null;
  }

  return prefs;
}

export async function isUserOnboarded(userId: string): Promise<boolean> {
  const supabase = createReadOnlyServerClient();
  const { data: prefs } = await supabase
    .from("user_prefs")
    .select("created_at, updated_at")
    .eq("user_id", userId)
    .single();

  // The trigger creates user_prefs on signup, but we consider onboarding complete
  // only if the user has updated their preferences (either filled or skipped)
  return !!(prefs && prefs.created_at !== prefs.updated_at);
}

export async function getUserSubscription(userId: string) {
  const supabase = createReadOnlyServerClient();

  // Get the main membership subscription (not addons or growth_member)
  // This prioritizes the main paid subscription over extra seats
  const { data: mainSubscription, error: mainError } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", userId)
    .eq("status", "active")
    .eq("membership_type", "membership")
    .maybeSingle();

  if (!mainError && mainSubscription) {
    return mainSubscription;
  }

  // Fallback: get any active subscription that's not an addon
  // This handles edge cases where membership_type might be NULL (legacy data)
  const GROWTH_SEAT_PRICE_ID = process.env.LEMONSQUEEZY_VARIANT_ID_GROWTH_SEAT;

  let fallbackQuery = supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", userId)
    .eq("status", "active")
    .or("membership_type.is.null,membership_type.neq.addon");

  if (GROWTH_SEAT_PRICE_ID) {
    fallbackQuery = fallbackQuery.neq("price_id", GROWTH_SEAT_PRICE_ID);
  }

  const { data: subscription, error } = await fallbackQuery.maybeSingle();

  if (!error && subscription) {
    return subscription;
  }

  // No active membership subscription found
  return null;
}

// Get user's tier based on their subscription
async function getUserTier(userId: string): Promise<string> {
  const subscription = await getUserSubscription(userId);

  if (!subscription) {
    return "FREE";
  }

  // Check if we have a tier mapping for this price_id
  if (subscription.price_id && TIER_MAPPING[subscription.price_id]) {
    return TIER_MAPPING[subscription.price_id];
  }

  // Default to STARTER tier for active subscriptions without specific mapping
  return DEFAULT_TIER;
}

export async function getUserUsageCount(userId: string): Promise<number> {
  const supabase = createReadOnlyServerClient();

  const { data: usage, error } = await supabase
    .from("usage_counters")
    .select("total_generations")
    .eq("user_id", userId)
    .single();

  if (error || !usage) {
    return 0;
  }

  return usage.total_generations;
}

export async function getUserGenerationCounts(
  userId: string
): Promise<GenerationCounts> {
  const supabase = createReadOnlyServerClient();

  const { data: usage, error } = await supabase
    .from("usage_counters")
    .select("generation_counts")
    .eq("user_id", userId)
    .single();

  if (error || !usage || !usage.generation_counts) {
    return {};
  }

  return usage.generation_counts as GenerationCounts;
}

export async function incrementUsageByType(
  userId: string,
  generationType: string
): Promise<void> {
  const supabase = createReadOnlyServerClient();

  await supabase.rpc("increment_usage_by_type", {
    user_id: userId,
    generation_type: generationType,
  });
}

// Helper function to get human-readable limit name
function getLimitName(type: LimitType): string {
  switch (type) {
    case "draft":
      return "draft generations";
    case "polish":
      return "polish operations";
    case "for_you":
      return "for-you recommendations";
    case "rewrite_with_ai":
      return "AI rewrite operations";
    case "ai_insights":
      return "AI insights generations";
    default:
      return "operations";
  }
}

// Helper function to check limit by type
async function checkLimitByType(
  userId: string,
  type: LimitType
): Promise<{ canGenerate: boolean; reason?: string }> {
  const tier = await getUserTier(userId);
  const counts = await getUserGenerationCounts(userId);

  // Get the limit for this tier and type
  const limit = getTierLimit(tier, type);

  // If limit is -1, it's unlimited
  if (limit === -1) {
    return { canGenerate: true };
  }

  // If limit is 0, feature is disabled
  if (limit === 0) {
    return {
      canGenerate: false,
      reason: `This feature is not available for your tier.`,
    };
  }

  // Check the limit for this type
  const typeCount = counts[type] || 0;

  if (typeCount >= limit) {
    const limitName = getLimitName(type);
    const tierName = tier === "FREE" ? "free" : tier.toLowerCase();

    return {
      canGenerate: false,
      reason: `You have reached your ${tierName} tier limit of ${limit} ${limitName}. Please upgrade to continue.`,
    };
  }

  return { canGenerate: true };
}

// Generic subscription limit check function that throws errors
export async function checkSubscriptionLimit(
  userId: string,
  limitType: LimitType
): Promise<void> {
  const result = await checkLimitByType(userId, limitType);

  if (!result.canGenerate) {
    const tier = await getUserTier(userId);
    const limit = getTierLimit(tier, limitType);
    const limitName = getLimitName(limitType);
    const tierName = tier === "FREE" ? "free" : tier.toLowerCase();

    let message: string;
    if (limit === 0) {
      message = `This feature is not available for your ${tierName} tier. Please upgrade to access this feature.`;
    } else {
      message = `You have reached your ${tierName} tier limit of ${limit} ${limitName}. Please upgrade to continue.`;
    }

    throw new SubscriptionLimitError(message, limitType, true, 402);
  }
}

// Legacy function - now uses draft limits for backward compatibility
export async function canGeneratePosts(
  userId: string
): Promise<{ canGenerate: boolean; reason?: string }> {
  return checkLimitByType(userId, "draft");
}

// Type-specific limit checking functions
export async function canGenerateDraft(
  userId: string
): Promise<{ canGenerate: boolean; reason?: string }> {
  return checkLimitByType(userId, "draft");
}

export async function canGeneratePolish(
  userId: string
): Promise<{ canGenerate: boolean; reason?: string }> {
  return checkLimitByType(userId, "polish");
}

export async function canGenerateForYou(
  userId: string
): Promise<{ canGenerate: boolean; reason?: string }> {
  return checkLimitByType(userId, "for_you");
}

// Keep for backward compatibility during migration
export async function canGenerateDrafts(
  userId: string
): Promise<{ canGenerate: boolean; reason?: string }> {
  return canGeneratePosts(userId);
}

// Export limits for UI display
export function getGenerationLimits() {
  return {
    freeTier: {
      draft: getTierLimit("FREE", "draft"),
      polish: getTierLimit("FREE", "polish"),
      forYou: getTierLimit("FREE", "for_you"),
    },
    subscription: {
      draft: getTierLimit(DEFAULT_TIER, "draft"),
      polish: getTierLimit(DEFAULT_TIER, "polish"),
      forYou: getTierLimit(DEFAULT_TIER, "for_you"),
    },
  };
}
