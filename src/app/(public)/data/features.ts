import {
  CalendarClock,
  Lightbulb,
  LineChart,
  Sparkles,
} from "lucide-react";

import type { DeepDiveFeature, FeatureItem, InsightCard } from "@/marketing/types/marketing";

export const FEATURE_GRID_ITEMS: FeatureItem[] = [
  {
    icon: Lightbulb,
    title: "Idea engine",
    description:
      "Generate fresh, on-brand prompts based on your niche, saved voice, and trending stories in your space.",
  },
  {
    icon: Sparkles,
    title: "AI drafting",
    description:
      "Compose thoughtful LinkedIn-ready drafts with magnetic hooks, storytelling frameworks, and calls to action that convert.",
  },
  {
    icon: CalendarClock,
    title: "Scheduling intelligence",
    description:
      "Auto-publish across personal profiles and company pages with timing cues personalized from your historical performance.",
  },
  {
    icon: LineChart,
    title: "Performance insights",
    description:
      "Spot breakout posts, compare campaigns, and get AI-led insights secured to LinkedIn metrics that matter.",
  },
];

export const FEATURE_DEEP_DIVE_SECTIONS: DeepDiveFeature[] = [
  {
    name: "Ideate",
    headline: "Ideas informed by your voice and what’s trending",
    body:
      "Stop chasing prompts. Linkedbud tracks the narratives taking off in your space and combines them with your voice guidelines to propose hooks, story angles, and commentary that sound like you.",
    highlights: [
      "Topic radar scanning newsletters, LinkedIn, and RSS feeds",
      "Voice profiles ensure every suggestion matches tone and POV",
      "Idea library with tags, collaborators, and approval states",
    ],
    illustration: "Audience heatmap · Trending story clusters · Saved hooks",
  },
  {
    name: "Create",
    headline: "Craft polished drafts with layered AI support",
    body:
      "Compose fast without losing nuance. Layer AI-generated outlines, context snippets, and storytelling frameworks. Inject your own insights while Linkedbud handles formatting, structure, and hashtags.",
    highlights: [
      "Draft side-by-side with news snippets and research",
      "Frameworks for single posts, carousels, and leadership updates",
      "Human-in-the-loop editing with frictionless revisions",
    ],
    illustration: "Draft canvas · Voice controls · Tone toggles",
  },
  {
    name: "Grow",
    headline: "Schedule with precision and learn from every post",
    body:
      "Move from sporadic to strategic. Linkedbud auto-schedules posts for the best times, syncs across profiles, and feeds back actionable insights so you know what to double down on next week.",
    highlights: [
      "Auto-publish across personal and company pages",
      "Audience graph pinpoints optimal posting windows",
      "Performance loops recommend follow-up angles instantly",
    ],
    illustration: "Smart scheduler · Engagement forecast · Follow-up prompts",
  },
];

export const INSIGHT_CARDS: InsightCard[] = [
  {
    title: "Voice consistency",
    metric: "98%",
    metricLabel: "On-brand draft match",
    description:
      "Keep every contributor aligned with your tone. Maintain style guides, sentiment settings, and vocabulary in one place.",
  },
  {
    title: "Content velocity",
    metric: "4.5x",
    metricLabel: "Faster pipeline",
    description:
      "Draft a week of posts in a single working session. Linkedbud suggests angles, hooks, and outlines that spark creativity instantly.",
  },
  {
    title: "Insight engine",
    metric: "32%",
    metricLabel: "Engagement lift",
    description:
      "Audience heatmaps and topic insights reveal what resonates so you can double down with confidence.",
  },
];

