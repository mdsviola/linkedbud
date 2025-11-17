/**
 * Pricing configuration system
 * Reads pricing data from pricing-data.ts and only uses environment variables for currency
 */

import { PRICING_DATA, type PricingData, type FeatureSection } from "./pricing-data";

export type PricingTier = "FREE" | "LITE" | "PRO" | "GROWTH" | "ENTERPRISE";

export interface TierConfig {
  name: string;
  tagline: string;
  targetUser: string;
  monthlyPrice: number | "Custom";
  yearlyPrice: number | "Custom";
  teamMembersIncluded: number | "Custom";
  extraSeatPrice: number | null | "Negotiated";
  limits: {
    aiGenerationsPerMonth: number | "unlimited" | string;
    scheduledPostsPerMonth: number | "unlimited" | string;
    analyticsDepth: string;
    collaborationFeatures: boolean | string;
  };
  keyFeatures: string[];
  featureSections?: FeatureSection[];
  idealFor: string;
  description?: string;
  cta?: string;
  href?: string;
  highlighted?: boolean;
  badge?: string | null;
}

export interface PricingConfig {
  currency: string;
  annualDiscountPolicy: string;
  extraTeamMemberPolicy: string;
  allTiersInclude: string[];
  tiers: Record<PricingTier, TierConfig>;
}

/**
 * Get pricing configuration
 * Only currency is read from environment variables, all other data comes from pricing-data.ts
 */
export function getPricingConfig(): PricingConfig {
  const currency = process.env.PRICING_CURRENCY || "EUR";

  // Format extra team member policy with currency symbol and price
  const currencySymbol =
    currency === "USD" ? "$" : currency === "EUR" ? "€" : currency;
  const extraSeatPrice = process.env.PRICING_EXTRA_SEAT_PRICE || "10";
  const extraTeamMemberPolicy =
    PRICING_DATA.globalRules.extraTeamMemberPolicy.replace(
      "{PRICE}",
      `${currencySymbol}${extraSeatPrice}`
    );

  return {
    currency,
    annualDiscountPolicy: PRICING_DATA.globalRules.annualDiscountPolicy,
    extraTeamMemberPolicy,
    allTiersInclude: PRICING_DATA.globalRules.allTiersInclude,
    tiers: {
      FREE: {
        ...PRICING_DATA.tiers.FREE,
        monthlyPrice: PRICING_DATA.tiers.FREE.monthlyPrice,
        yearlyPrice: PRICING_DATA.tiers.FREE.yearlyPrice,
        featureSections: PRICING_DATA.tiers.FREE.featureSections,
      },
      LITE: {
        ...PRICING_DATA.tiers.LITE,
        monthlyPrice: PRICING_DATA.tiers.LITE.monthlyPrice,
        yearlyPrice: PRICING_DATA.tiers.LITE.yearlyPrice,
        featureSections: PRICING_DATA.tiers.LITE.featureSections,
      },
      PRO: {
        ...PRICING_DATA.tiers.PRO,
        monthlyPrice: PRICING_DATA.tiers.PRO.monthlyPrice,
        yearlyPrice: PRICING_DATA.tiers.PRO.yearlyPrice,
        featureSections: PRICING_DATA.tiers.PRO.featureSections,
      },
      GROWTH: {
        ...PRICING_DATA.tiers.GROWTH,
        monthlyPrice: PRICING_DATA.tiers.GROWTH.monthlyPrice,
        yearlyPrice: PRICING_DATA.tiers.GROWTH.yearlyPrice,
        featureSections: PRICING_DATA.tiers.GROWTH.featureSections,
      },
      ENTERPRISE: {
        ...PRICING_DATA.tiers.ENTERPRISE,
        monthlyPrice: PRICING_DATA.tiers.ENTERPRISE.monthlyPrice,
        yearlyPrice: PRICING_DATA.tiers.ENTERPRISE.yearlyPrice,
      },
    },
  };
}

/**
 * Format price for display
 */
export function formatPrice(
  price: number | "Custom",
  currency: string = "EUR"
): string {
  if (price === "Custom") return "Custom";
  const symbol = currency === "USD" ? "$" : currency === "EUR" ? "€" : currency;
  return `${symbol}${price}`;
}

/**
 * Get pricing data for a specific tier
 */
export function getTierPricing(tier: PricingTier) {
  const config = getPricingConfig();
  return config.tiers[tier];
}

/**
 * Get Pro tier pricing (most common for authenticated pages)
 */
export function getStarterPricing() {
  return getTierPricing("PRO");
}

/**
 * Get annual discount percentage
 */
export function getAnnualDiscountPercentage(): number {
  const discount = process.env.PRICING_ANNUAL_DISCOUNT_PERCENTAGE;
  if (discount) {
    const num = parseInt(discount, 10);
    if (!isNaN(num)) return num;
  }
  // Default: 2 months free = ~16.67% discount
  return 16.67;
}
