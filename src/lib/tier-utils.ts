/**
 * Utility functions for managing subscription tiers
 * Supports the new subscription model with multiple tiers: FREE, LITE, STARTER, GROWTH, ENTERPRISE
 */

import type { PricingTier } from "./pricing-config";

// Re-export PricingTier for convenience
export type { PricingTier };

// Tier mapping: maps price_id to tier name
// This allows different price_ids to share the same tier limits
// Supports new pricing structure: LITE, STARTER, GROWTH, ENTERPRISE
// Note: These env vars are replaced at build time by Next.js
const TIER_MAPPING: Record<string, PricingTier> = {
  // Map Creator Pro tier variant to STARTER tier
  ...(process.env.LEMONSQUEEZY_VARIANT_ID_PRO
    ? { [process.env.LEMONSQUEEZY_VARIANT_ID_PRO]: "STARTER" }
    : {}),
  // Map Growth tier variant
  ...(process.env.LEMONSQUEEZY_VARIANT_ID_GROWTH
    ? { [process.env.LEMONSQUEEZY_VARIANT_ID_GROWTH]: "GROWTH" }
    : {}),
  // Map Lite tier variant
  ...(process.env.LEMONSQUEEZY_VARIANT_ID_LITE
    ? { [process.env.LEMONSQUEEZY_VARIANT_ID_LITE]: "LITE" }
    : {}),
  // Add more mappings as needed:
  // ...(process.env.LEMONSQUEEZY_VARIANT_ID_ENTERPRISE
  //   ? { [process.env.LEMONSQUEEZY_VARIANT_ID_ENTERPRISE]: "ENTERPRISE" }
  //   : {}),
};

// Reverse mapping: tier to price_id (for admin panel tier selection)
// This allows admins to select a tier and we can find the corresponding price_id
const TIER_TO_PRICE_ID: Record<PricingTier, string | null> = {
  FREE: null, // Free tier doesn't have a price_id
  LITE: process.env.LEMONSQUEEZY_VARIANT_ID_LITE || null,
  STARTER: process.env.LEMONSQUEEZY_VARIANT_ID_PRO || null,
  GROWTH: process.env.LEMONSQUEEZY_VARIANT_ID_GROWTH || null,
  ENTERPRISE: process.env.LEMONSQUEEZY_VARIANT_ID_ENTERPRISE || null,
};

const DEFAULT_TIER: PricingTier = "STARTER";

/**
 * Get tier name from price_id
 * @param priceId - The LemonSqueezy price_id/variant_id
 * @returns The tier name (FREE, LITE, STARTER, GROWTH, ENTERPRISE) or null if not found
 */
export function getTierFromPriceId(
  priceId: string | null | undefined
): PricingTier {
  if (!priceId) {
    return "FREE";
  }

  // Check if we have a tier mapping for this price_id
  if (TIER_MAPPING[priceId]) {
    return TIER_MAPPING[priceId];
  }

  // Default to STARTER tier for active subscriptions without specific mapping
  return DEFAULT_TIER;
}

/**
 * Get price_id for a given tier
 * @param tier - The tier name
 * @returns The price_id for the tier, or null if not configured
 */
export function getPriceIdFromTier(tier: PricingTier): string | null {
  return TIER_TO_PRICE_ID[tier];
}

/**
 * Get all available tiers
 * @returns Array of tier names
 */
export function getAllTiers(): PricingTier[] {
  return ["FREE", "LITE", "STARTER", "GROWTH", "ENTERPRISE"];
}

/**
 * Get tier display name
 * @param tier - The tier name
 * @returns Human-readable tier name
 */
export function getTierDisplayName(tier: PricingTier): string {
  const displayNames: Record<PricingTier, string> = {
    FREE: "Free",
    LITE: "Creator Lite",
    STARTER: "Creator Pro",
    GROWTH: "Growth",
    ENTERPRISE: "Enterprise",
  };
  return displayNames[tier];
}

/**
 * Check if a tier requires a price_id
 * @param tier - The tier name
 * @returns True if the tier requires a price_id (i.e., not FREE)
 */
export function tierRequiresPriceId(tier: PricingTier): boolean {
  return tier !== "FREE";
}
