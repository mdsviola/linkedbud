import type {
  PricingPlan,
  PricingValueProp,
} from "@/marketing/types/marketing";
import {
  getPricingConfig,
  formatPrice,
} from "@/lib/pricing-config";

const pricingConfig = getPricingConfig();
const currency = pricingConfig.currency;

// Helper to format monthly/yearly price display
function formatPriceDisplay(
  monthlyPrice: number | "Custom"
): string {
  if (monthlyPrice === "Custom") {
    return "Custom";
  }
  return `${formatPrice(monthlyPrice, currency)}/month`;
}


export const PRICING_PLANS: PricingPlan[] = [
  {
    name: pricingConfig.tiers.FREE.name,
    price: formatPriceDisplay(pricingConfig.tiers.FREE.monthlyPrice),
    monthlyPrice:
      typeof pricingConfig.tiers.FREE.monthlyPrice === "number"
        ? pricingConfig.tiers.FREE.monthlyPrice
        : undefined,
    yearlyPrice:
      typeof pricingConfig.tiers.FREE.yearlyPrice === "number"
        ? pricingConfig.tiers.FREE.yearlyPrice
        : undefined,
    tagline: pricingConfig.tiers.FREE.tagline,
    targetUser: pricingConfig.tiers.FREE.targetUser,
    idealFor: pricingConfig.tiers.FREE.idealFor,
    description: pricingConfig.tiers.FREE.description || pricingConfig.tiers.FREE.tagline,
    features: pricingConfig.tiers.FREE.featureSections || pricingConfig.tiers.FREE.keyFeatures,
    keyFeatures: pricingConfig.tiers.FREE.keyFeatures,
    cta: pricingConfig.tiers.FREE.cta || "Start for free",
    href: pricingConfig.tiers.FREE.href || "/auth/signup",
    highlighted: pricingConfig.tiers.FREE.highlighted || false,
    badge: pricingConfig.tiers.FREE.badge ?? null,
    teamMembersIncluded:
      typeof pricingConfig.tiers.FREE.teamMembersIncluded === "number"
        ? pricingConfig.tiers.FREE.teamMembersIncluded
        : undefined,
    extraSeatPrice:
      pricingConfig.tiers.FREE.extraSeatPrice === null ||
      pricingConfig.tiers.FREE.extraSeatPrice === "Negotiated"
        ? null
        : typeof pricingConfig.tiers.FREE.extraSeatPrice === "number"
          ? pricingConfig.tiers.FREE.extraSeatPrice
          : undefined,
    limits: {
      aiGenerationsPerMonth: pricingConfig.tiers.FREE.limits.aiGenerationsPerMonth,
      scheduledPostsPerMonth: pricingConfig.tiers.FREE.limits.scheduledPostsPerMonth,
      analyticsDepth: pricingConfig.tiers.FREE.limits.analyticsDepth,
      collaborationFeatures: pricingConfig.tiers.FREE.limits.collaborationFeatures,
    },
  },
  {
    name: pricingConfig.tiers.LITE.name,
    price: formatPriceDisplay(pricingConfig.tiers.LITE.monthlyPrice),
    monthlyPrice:
      typeof pricingConfig.tiers.LITE.monthlyPrice === "number"
        ? pricingConfig.tiers.LITE.monthlyPrice
        : undefined,
    yearlyPrice:
      typeof pricingConfig.tiers.LITE.yearlyPrice === "number"
        ? pricingConfig.tiers.LITE.yearlyPrice
        : undefined,
    tagline: pricingConfig.tiers.LITE.tagline,
    targetUser: pricingConfig.tiers.LITE.targetUser,
    idealFor: pricingConfig.tiers.LITE.idealFor,
    description: pricingConfig.tiers.LITE.description || pricingConfig.tiers.LITE.tagline,
    features: pricingConfig.tiers.LITE.featureSections || [
      ...pricingConfig.allTiersInclude,
      ...pricingConfig.tiers.LITE.keyFeatures,
    ],
    keyFeatures: pricingConfig.tiers.LITE.keyFeatures,
    cta: pricingConfig.tiers.LITE.cta || "Start for free",
    href: pricingConfig.tiers.LITE.href || "/auth/signup",
    highlighted: pricingConfig.tiers.LITE.highlighted || false,
    badge: pricingConfig.tiers.LITE.badge ?? null,
    teamMembersIncluded:
      typeof pricingConfig.tiers.LITE.teamMembersIncluded === "number"
        ? pricingConfig.tiers.LITE.teamMembersIncluded
        : undefined,
    extraSeatPrice:
      pricingConfig.tiers.LITE.extraSeatPrice === null ||
      pricingConfig.tiers.LITE.extraSeatPrice === "Negotiated"
        ? null
        : typeof pricingConfig.tiers.LITE.extraSeatPrice === "number"
          ? pricingConfig.tiers.LITE.extraSeatPrice
          : undefined,
    limits: {
      aiGenerationsPerMonth: pricingConfig.tiers.LITE.limits.aiGenerationsPerMonth,
      scheduledPostsPerMonth: pricingConfig.tiers.LITE.limits.scheduledPostsPerMonth,
      analyticsDepth: pricingConfig.tiers.LITE.limits.analyticsDepth,
      collaborationFeatures: pricingConfig.tiers.LITE.limits.collaborationFeatures,
    },
  },
  {
    name: pricingConfig.tiers.PRO.name,
    price: formatPriceDisplay(pricingConfig.tiers.PRO.monthlyPrice),
    monthlyPrice:
      typeof pricingConfig.tiers.PRO.monthlyPrice === "number"
        ? pricingConfig.tiers.PRO.monthlyPrice
        : undefined,
    yearlyPrice:
      typeof pricingConfig.tiers.PRO.yearlyPrice === "number"
        ? pricingConfig.tiers.PRO.yearlyPrice
        : undefined,
    tagline: pricingConfig.tiers.PRO.tagline,
    targetUser: pricingConfig.tiers.PRO.targetUser,
    idealFor: pricingConfig.tiers.PRO.idealFor,
    description: pricingConfig.tiers.PRO.description || pricingConfig.tiers.PRO.tagline,
    features: pricingConfig.tiers.PRO.featureSections || [
      ...pricingConfig.allTiersInclude,
      ...pricingConfig.tiers.PRO.keyFeatures,
    ],
    keyFeatures: pricingConfig.tiers.PRO.keyFeatures,
    cta: pricingConfig.tiers.PRO.cta || "Join Early Access",
    href: pricingConfig.tiers.PRO.href || "/auth/signup",
    highlighted: pricingConfig.tiers.PRO.highlighted || false,
    badge: pricingConfig.tiers.PRO.badge ?? null,
    teamMembersIncluded:
      typeof pricingConfig.tiers.PRO.teamMembersIncluded === "number"
        ? pricingConfig.tiers.PRO.teamMembersIncluded
        : undefined,
    extraSeatPrice:
      pricingConfig.tiers.PRO.extraSeatPrice === null ||
      pricingConfig.tiers.PRO.extraSeatPrice === "Negotiated"
        ? null
        : typeof pricingConfig.tiers.PRO.extraSeatPrice === "number"
          ? pricingConfig.tiers.PRO.extraSeatPrice
          : undefined,
    limits: {
      aiGenerationsPerMonth: pricingConfig.tiers.PRO.limits.aiGenerationsPerMonth,
      scheduledPostsPerMonth: pricingConfig.tiers.PRO.limits.scheduledPostsPerMonth,
      analyticsDepth: pricingConfig.tiers.PRO.limits.analyticsDepth,
      collaborationFeatures: pricingConfig.tiers.PRO.limits.collaborationFeatures,
    },
  },
  {
    name: pricingConfig.tiers.GROWTH.name,
    price: formatPriceDisplay(pricingConfig.tiers.GROWTH.monthlyPrice),
    priceSubtitle: (() => {
      // Add extra seat pricing as subtitle
      if (
        typeof pricingConfig.tiers.GROWTH.extraSeatPrice === "number" &&
        pricingConfig.tiers.GROWTH.extraSeatPrice > 0
      ) {
        return `Additional seats: ${formatPrice(pricingConfig.tiers.GROWTH.extraSeatPrice, currency)}/mo each`;
      }
      return undefined;
    })(),
    monthlyPrice:
      typeof pricingConfig.tiers.GROWTH.monthlyPrice === "number"
        ? pricingConfig.tiers.GROWTH.monthlyPrice
        : undefined,
    yearlyPrice:
      typeof pricingConfig.tiers.GROWTH.yearlyPrice === "number"
        ? pricingConfig.tiers.GROWTH.yearlyPrice
        : undefined,
    tagline: pricingConfig.tiers.GROWTH.tagline,
    targetUser: pricingConfig.tiers.GROWTH.targetUser,
    idealFor: pricingConfig.tiers.GROWTH.idealFor,
    description: pricingConfig.tiers.GROWTH.description || pricingConfig.tiers.GROWTH.tagline,
    features: pricingConfig.tiers.GROWTH.featureSections || [
      ...pricingConfig.allTiersInclude,
      ...pricingConfig.tiers.GROWTH.keyFeatures,
    ],
    keyFeatures: pricingConfig.tiers.GROWTH.keyFeatures,
    cta: pricingConfig.tiers.GROWTH.cta || "Join Early Access",
    href: pricingConfig.tiers.GROWTH.href || "/auth/signup",
    highlighted: pricingConfig.tiers.GROWTH.highlighted || false,
    badge: pricingConfig.tiers.GROWTH.badge ?? null,
    teamMembersIncluded:
      typeof pricingConfig.tiers.GROWTH.teamMembersIncluded === "number"
        ? pricingConfig.tiers.GROWTH.teamMembersIncluded
        : undefined,
    extraSeatPrice:
      pricingConfig.tiers.GROWTH.extraSeatPrice === null ||
      pricingConfig.tiers.GROWTH.extraSeatPrice === "Negotiated"
        ? null
        : typeof pricingConfig.tiers.GROWTH.extraSeatPrice === "number"
          ? pricingConfig.tiers.GROWTH.extraSeatPrice
          : undefined,
    limits: {
      aiGenerationsPerMonth: pricingConfig.tiers.GROWTH.limits.aiGenerationsPerMonth,
      scheduledPostsPerMonth: pricingConfig.tiers.GROWTH.limits.scheduledPostsPerMonth,
      analyticsDepth: pricingConfig.tiers.GROWTH.limits.analyticsDepth,
      collaborationFeatures: pricingConfig.tiers.GROWTH.limits.collaborationFeatures,
    },
  },
];

export const PRICING_VALUE_PROPS: PricingValueProp[] = [
  {
    title: "Cancel anytime",
    description:
      "Manage your plan without contacting support. Downgrade or pause with one click.",
  },
  {
    title: "Security-first",
    description:
      "Encrypted integrations with LinkedIn, Supabase, and Lemonsqueezy.",
  },
  {
    title: "Priority support",
    description:
      "Direct access to product experts and a private founders channel during early access.",
  },
];
