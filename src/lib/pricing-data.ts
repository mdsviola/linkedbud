/**
 * Pricing data configuration
 * This file contains all pricing information that can be adjusted based on market conditions
 * Prices are read from environment variables, all other data (features, descriptions) is hardcoded
 */

import type { PricingTier } from "./pricing-config";

// Helper to get env var with fallback
function getEnvNumber(
  key: string,
  fallback: number | "Custom"
): number | "Custom" {
  const value = process.env[key];
  if (!value || value === "Custom") return fallback;
  const num = parseInt(value, 10);
  return isNaN(num) ? fallback : num;
}

export interface FeatureSection {
  title: string;
  items: string[];
}

export interface TierPricingData {
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

export interface PricingData {
  version: string;
  globalRules: {
    allTiersInclude: string[];
    annualDiscountPolicy: string;
    extraTeamMemberPolicy: string;
  };
  tiers: Record<PricingTier, TierPricingData>;
}

export const PRICING_DATA: PricingData = {
  version: "v1.2",
  globalRules: {
    allTiersInclude: [
      "Publish to personal LinkedIn profiles and organization pages (official API)",
      "AI ideation and post drafting",
      "Scheduling and queue management",
      "Access to templates and trending topic ideas",
      "LinkedIn-native mobile post preview",
    ],
    annualDiscountPolicy: "2 months free on annual billing",
    extraTeamMemberPolicy: `Additional seats billed at {PRICE}/mo each after included limit`,
  },
  tiers: {
    FREE: {
      name: "Free",
      tagline: "For users testing linkedbud with real LinkedIn posting",
      targetUser: "Users testing linkedbud with real LinkedIn posting",
      monthlyPrice: 0,
      yearlyPrice: 0,
      teamMembersIncluded: 1,
      extraSeatPrice: null,
      limits: {
        aiGenerationsPerMonth: 3,
        scheduledPostsPerMonth: 2,
        analyticsDepth: "basic (30d timeframe only)",
        collaborationFeatures: false,
      },
      keyFeatures: [
        "Publish to personal and organization pages",
        "Industry news ingestion",
        "AI summarization",
        "AI polishing",
        "AI analytics",
        "Basic analytics",
        "Personal tone matching",
        "3 Rewrite with AI function calls per month",
        "10 Polish with AI actions per month",
        "1 ideas bubble board generation per month (up to 15 AI generated ideas)",
        "1 AI analytics report per month (30d timeframe only)",
        "Limit of 2 published posts per month",
        "Single user",
        "No collaboration",
      ],
      featureSections: [
        {
          title: "Features",
          items: [
            "Publish to personal and organization pages",
            "Industry news ingestion",
            "AI summarization",
            "AI polishing",
            "AI analytics",
            "Basic analytics",
            "Personal tone matching",
          ],
        },
        {
          title: "AI Limits",
          items: [
            "3 Rewrite with AI function calls per month",
            "10 Polish with AI actions per month",
            "1 ideas bubble board generation per month (up to 15 AI generated ideas)",
            "1 AI analytics report per month (30d timeframe only)",
          ],
        },
        {
          title: "Notes",
          items: [
            "Limit of 2 published posts per month",
            "Single user",
            "No collaboration",
          ],
        },
      ],
      idealFor: "Users testing linkedbud with real LinkedIn posting",
      description: "For users testing linkedbud with real LinkedIn posting",
      cta: "Start for free",
      href: "/auth/signup",
      highlighted: false,
      badge: null,
    },
    LITE: {
      name: "Creator Lite",
      tagline: "Low price. Low commitment. Low usage. Unlimited* posting and scheduling.",
      targetUser: "Creators who want unlimited* posting with limited AI usage",
      monthlyPrice: getEnvNumber("PRICING_LITE_MONTHLY", 9),
      yearlyPrice: getEnvNumber("PRICING_LITE_YEARLY", 7),
      teamMembersIncluded: getEnvNumber("PRICING_LITE_TEAM_MEMBERS", 1),
      extraSeatPrice: null,
      limits: {
        aiGenerationsPerMonth: 20,
        scheduledPostsPerMonth: "unlimited",
        analyticsDepth: "advanced (reach and engagement highlights)",
        collaborationFeatures: false,
      },
      keyFeatures: [
        "Publish to personal and organization pages",
        "Unlimited* post creation",
        "Unlimited* scheduling",
        "Templates and trending topic ideas",
        "Desktop and mobile preview",
        "Advanced analytics (reach and engagement highlights)",
        "20 Rewrite with AI function calls per month",
        "80 Polish with AI actions per month",
        "1 ideas bubble board generation per day (up to 15 AI generated ideas)",
        "1 AI analytics report per week (includes default timeframes 7d, 30d, All time plus custom ranges)",
        "Single user",
        "No collaboration",
      ],
      featureSections: [
        {
          title: "Core Features",
          items: [
            "Publish to personal and organization pages",
            "Unlimited* post creation",
            "Unlimited* scheduling",
            "Templates and trending topic ideas",
            "Desktop and mobile preview",
            "Advanced analytics (reach and engagement highlights)",
          ],
        },
        {
          title: "AI Limits",
          items: [
            "20 Rewrite with AI function calls per month",
            "80 Polish with AI actions per month",
            "1 ideas bubble board generation per day (up to 15 AI generated ideas)",
            "1 AI analytics report per week (includes default timeframes 7d, 30d, All time plus custom ranges)",
          ],
        },
        {
          title: "Notes",
          items: [
            "Single user",
            "No collaboration",
          ],
        },
      ],
      idealFor: "Creators who want unlimited* posting with limited AI usage",
      description: "Low price. Low commitment. Low usage. Unlimited* posting and scheduling.",
      cta: "Start for free",
      href: "/auth/signup",
      highlighted: false,
      badge: null,
    },
    STARTER: {
      name: "Creator Pro",
      tagline: "Unlimited* usage for serious creators",
      targetUser: "Serious creators who need unlimited* AI features",
      monthlyPrice: getEnvNumber("PRICING_STARTER_MONTHLY", 19),
      yearlyPrice: getEnvNumber("PRICING_STARTER_YEARLY", 15),
      teamMembersIncluded: getEnvNumber("PRICING_STARTER_TEAM_MEMBERS", 1),
      extraSeatPrice: null,
      limits: {
        aiGenerationsPerMonth: "unlimited",
        scheduledPostsPerMonth: "unlimited",
        analyticsDepth: "full (performance summaries, all timeframes)",
        collaborationFeatures: false,
      },
      keyFeatures: [
        "Everything in Creator Lite",
        "Unlimited* Rewrite with AI function calls",
        "Unlimited* Polish with AI",
        "Unlimited* ideas bubble board generations and drafts",
        "Full analytics with performance summaries",
        "Post timing recommendations based on engagement history",
        "Full template and tone library",
        "Single user",
        "No collaboration",
      ],
      featureSections: [
        {
          title: "Everything in Lite, plus",
          items: [
            "Unlimited* Rewrite with AI function calls",
            "Unlimited* Polish with AI",
            "Unlimited* ideas bubble board generations and drafts",
            "Full analytics with performance summaries",
            "Post timing recommendations based on engagement history",
            "Full template and tone library",
          ],
        },
        {
          title: "Notes",
          items: [
            "Single user",
            "No collaboration",
          ],
        },
      ],
      idealFor: "Serious creators who need unlimited* AI features",
      description: "Unlimited* usage for serious creators",
      cta: "Join Early Access",
      href: "/auth/signup",
      highlighted: true,
      badge: "Most popular",
    },
    GROWTH: {
      name: "Growth",
      tagline: "For teams and agencies that need shared access",
      targetUser:
        "Teams and agencies that need shared access",
      monthlyPrice: getEnvNumber("PRICING_GROWTH_MONTHLY", 39),
      yearlyPrice: getEnvNumber("PRICING_GROWTH_YEARLY", 32),
      teamMembersIncluded: getEnvNumber("PRICING_GROWTH_TEAM_MEMBERS", 3),
      extraSeatPrice: (() => {
        const value = process.env.PRICING_GROWTH_EXTRA_SEAT;
        if (!value) return 10;
        if (value === "Negotiated") return "Negotiated";
        const num = parseInt(value, 10);
        return isNaN(num) ? 10 : num;
      })(),
      limits: {
        aiGenerationsPerMonth: "unlimited",
        scheduledPostsPerMonth: "unlimited",
        analyticsDepth: "full (workspace-wide performance intelligence)",
        collaborationFeatures: true,
      },
      keyFeatures: [
        "Everything in Creator Pro",
        "3 seats included (additional seats available)",
        "Shared workspace for teams",
        "Shared calendars, assets, posts, and analytics",
        "AI driven performance intelligence for the whole workspace",
        "Priority support",
      ],
      featureSections: [
        {
          title: "Everything in Creator Pro, plus",
          items: [
            "3 seats included (additional seats available)",
            "Shared workspace for teams",
            "Shared calendars, assets, posts, and analytics",
            "AI driven performance intelligence for the whole workspace",
            "Priority support",
          ],
        },
      ],
      idealFor: "Teams and agencies that need shared access",
      description: "For teams and agencies that need shared access",
      cta: "Join Early Access",
      href: "/auth/signup",
      highlighted: false,
      badge: null,
    },
    ENTERPRISE: {
      name: "Enterprise",
      tagline: "For agencies and organizations with custom workflows",
      targetUser:
        "Large agencies or enterprises needing full analytics, API access, or white-label features",
      monthlyPrice: getEnvNumber("PRICING_ENTERPRISE_MONTHLY", "Custom"),
      yearlyPrice: getEnvNumber("PRICING_ENTERPRISE_YEARLY", "Custom"),
      teamMembersIncluded: getEnvNumber(
        "PRICING_ENTERPRISE_TEAM_MEMBERS",
        "Custom"
      ),
      extraSeatPrice: (() => {
        const value = process.env.PRICING_ENTERPRISE_EXTRA_SEAT;
        if (!value || value === "Negotiated") return "Negotiated";
        const num = parseInt(value, 10);
        return isNaN(num) ? "Negotiated" : num;
      })(),
      limits: {
        aiGenerationsPerMonth: "unlimited",
        scheduledPostsPerMonth: "unlimited",
        analyticsDepth: "enterprise (campaign & team performance, exports)",
        collaborationFeatures: "advanced (roles, permissions, audit logs)",
      },
      keyFeatures: [
        "Everything in Growth",
        "Unlimited* team members under SLA-backed contract",
        "Dedicated success manager and onboarding",
        "White-label dashboards and client workspaces",
        "Full API access and data exports",
        "Custom compliance reporting",
      ],
      idealFor:
        "Enterprise marketing teams and large agencies managing 10+ profiles",
      description: "For agencies and organizations with custom workflows",
      cta: "Book a walkthrough",
      href: "mailto:hello@linkedbud.com",
      highlighted: false,
      badge: null,
    },
  },
};
