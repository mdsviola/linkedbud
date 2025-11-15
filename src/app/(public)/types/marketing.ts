import type { LucideIcon } from "lucide-react";

export type HeroStat = {
  label: string;
  value: string;
};

export type LogoCloudItem = string;

export type FeatureItem = {
  icon: LucideIcon;
  title: string;
  description: string;
};

export type DeepDiveFeature = {
  name: string;
  headline: string;
  body: string;
  highlights: string[];
  illustration: string;
};

export type InsightCard = {
  title: string;
  metric: string;
  metricLabel: string;
  description: string;
};

export type WorkflowStep = {
  accent: string;
  title: string;
  description: string;
};

export type Testimonial = {
  quote: string;
  author: string;
  role: string;
};

export type FeatureSection = {
  title: string;
  items: string[];
};

export type PricingPlan = {
  name: string;
  price: string;
  priceSubtitle?: string;
  monthlyPrice?: number;
  yearlyPrice?: number;
  description: string;
  tagline?: string;
  targetUser?: string;
  idealFor?: string;
  features: string[] | FeatureSection[];
  keyFeatures?: string[];
  cta: string;
  href: string;
  highlighted: boolean;
  badge: string | null;
  teamMembersIncluded?: number;
  extraSeatPrice?: number | null;
  limits?: {
    aiGenerationsPerMonth?: number | string;
    scheduledPostsPerMonth?: number | string;
    analyticsDepth?: string;
    collaborationFeatures?: boolean | string;
  };
};

export type PricingValueProp = {
  title: string;
  description: string;
};

export type FAQItemData = {
  question: string;
  answer: string;
};

