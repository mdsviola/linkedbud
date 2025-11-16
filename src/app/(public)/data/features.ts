import { CalendarClock, Newspaper, LineChart, Sparkles } from "lucide-react";

import type {
  DeepDiveFeature,
  FeatureItem,
  InsightCard,
} from "@/marketing/types/marketing";

export const FEATURE_GRID_ITEMS: FeatureItem[] = [
  {
    icon: Newspaper,
    title: "Article discovery",
    description:
      "Discover relevant articles from RSS feeds and Google News based on your topics, with AI-powered recommendations for the best content to turn into posts.",
  },
  {
    icon: Sparkles,
    title: "AI content generation",
    description:
      "Generate multiple LinkedIn-ready draft variants from articles or custom topics, with customizable tone, post type, and formatting options.",
  },
  {
    icon: CalendarClock,
    title: "Post scheduling",
    description:
      "Schedule posts for future publication to your personal profile or LinkedIn organization pages, with automatic publishing at your chosen time.",
  },
  {
    icon: LineChart,
    title: "Performance analytics",
    description:
      "Track post performance with LinkedIn metrics including impressions, engagement, and AI-powered insights to understand what resonates with your audience.",
  },
];

export const FEATURE_DEEP_DIVE_SECTIONS: DeepDiveFeature[] = [
  {
    name: "Discover",
    headline: "Find relevant content from RSS feeds and articles",
    body: "Stay on top of industry news and trends. linkedbud fetches articles from your custom RSS feeds and Google News based on your topics, then uses AI to recommend the most relevant content for your LinkedIn posts.",
    highlights: [
      "Custom RSS feed integration for your favorite sources",
      "Google News search based on your topics and keywords",
      "AI-powered 'For You' recommendations highlighting the best articles",
    ],
    illustration: "Article feed · RSS sources · AI recommendations",
  },
  {
    name: "Create",
    headline: "Generate LinkedIn posts with AI assistance",
    body: "Transform articles or custom topics into polished LinkedIn drafts. Generate multiple variants, customize tone and style, and refine your content with full editing control before publishing.",
    highlights: [
      "Generate multiple draft variants from articles or custom topics",
      "Customizable tone, post type, target audience, and formatting",
      "Edit and refine drafts with full control over content",
    ],
    illustration: "Draft editor · Multiple variants · Customization options",
  },
  {
    name: "Publish & Analyze",
    headline: "Schedule posts and track performance",
    body: "Publish directly to LinkedIn or schedule posts for later. Track performance with detailed analytics including impressions, engagement rates, and AI-powered insights to understand what works.",
    highlights: [
      "Publish to personal profiles or LinkedIn organization pages",
      "Schedule posts for future publication with automatic posting",
      "Track metrics and get AI insights on post performance",
    ],
    illustration: "Scheduler · Analytics dashboard · Performance metrics",
  },
];

export const INSIGHT_CARDS: InsightCard[] = [
  {
    title: "Multiple variants",
    metric: "3",
    metricLabel: "Draft options",
    description:
      "Generate three different draft variants for each post, giving you options to choose the best angle and approach for your audience.",
  },
  {
    title: "Content sources",
    metric: "∞",
    metricLabel: "RSS feeds",
    description:
      "Connect unlimited custom RSS feeds and use Google News to discover articles, ensuring you never run out of content ideas.",
  },
  {
    title: "Performance tracking",
    metric: "6",
    metricLabel: "Key metrics",
    description:
      "Track impressions, likes, comments, shares, clicks, and engagement rates with automatic metric fetching from LinkedIn.",
  },
];
