// Type-safe competitor comparison data structure
// Single source of truth for all competitor comparisons

export type FeatureComparison = {
  feature: string;
  linkedbud: boolean | string; // true/false or specific value
  competitor: boolean | string; // true/false or specific value
};

export type PricingInfo = {
  startingPrice: string;
  popularPlan?: string;
  popularPlanPrice?: string;
  notes?: string;
};

export type ValueProp = {
  icon: string; // emoji or icon name
  title: string;
  description: string;
};

export type CompetitorData = {
  id: string;
  name: string;
  displayName: string;
  tagline: string;
  description: string;
  heroTitle: string;
  heroDescription: string;
  features: FeatureComparison[];
  pricing: PricingInfo;
  valueProps: ValueProp[];
  seoTitle: string;
  seoDescription: string;
};

// linkedbud's features for comparison
const LINKEDBUD_FEATURES: FeatureComparison[] = [
  {
    feature: "AI-generated post ideas",
    linkedbud: "Unlimited*",
    competitor: "",
  },
  {
    feature: "AI drafting capabilities",
    linkedbud: true,
    competitor: false,
  },
  {
    feature: "Scheduling & auto-publish",
    linkedbud: true,
    competitor: false,
  },
  {
    feature: "Advanced analytics & insights",
    linkedbud: true,
    competitor: false,
  },
  {
    feature: "Collaborative workspace",
    linkedbud: true,
    competitor: false,
  },
  {
    feature: "Voice library/profiles",
    linkedbud: true,
    competitor: false,
  },
  {
    feature: "Company page support",
    linkedbud: true,
    competitor: false,
  },
  {
    feature: "RSS feed integration",
    linkedbud: true,
    competitor: false,
  },
  {
    feature: "Performance insights & recommendations",
    linkedbud: true,
    competitor: false,
  },
];

export const COMPETITORS: Record<string, CompetitorData> = {
  magicpost: {
    id: "magicpost",
    name: "MagicPost",
    displayName: "MagicPost",
    tagline: "Maybe MagicPost isn't so magical after all...",
    description:
      "MagicPost is a LinkedIn-verified application that offers AI-driven post generation, scheduling, and analytics. While it provides content creation features, linkedbud goes further with AI-led performance insights, personalized scheduling intelligence, and transparent API compliance documentation.",
    heroTitle: "linkedbud vs MagicPost",
    heroDescription:
      "Both tools are LinkedIn-verified, but linkedbud provides AI-led performance insights, personalized scheduling that learns from your history, and transparent API compliance documentation that MagicPost doesn't emphasize.",
    features: [
      {
        feature: "LinkedIn API compliance transparency",
        linkedbud: true,
        competitor: "LinkedIn-verified, but no public compliance page",
      },
      {
        feature: "Personalized scheduling intelligence",
        linkedbud: true,
        competitor: false,
      },
      {
        feature: "AI-led performance insights",
        linkedbud: true,
        competitor: false,
      },
      {
        feature: "Company page support",
        linkedbud: true,
        competitor: "Likely, but not explicitly stated",
      },
      {
        feature: "End-to-end LinkedIn-native workflow",
        linkedbud: true,
        competitor: true,
      },
      {
        feature: "AI-generated post ideas",
        linkedbud: "Unlimited*",
        competitor: "Unlimited",
      },
      {
        feature: "AI drafting capabilities",
        linkedbud: true,
        competitor: true,
      },
      {
        feature: "Collaborative workspace",
        linkedbud: true,
        competitor: false,
      },
      {
        feature: "RSS feed integration",
        linkedbud: true,
        competitor: false,
      },
    ],
    pricing: {
      startingPrice: "$39/month",
      popularPlan: "Creator",
      popularPlanPrice: "$29/month",
      notes: "MagicPost's cheapest option starts at $39/month. The Creator plan at $29/month includes comprehensive content creation features, but lacks linkedbud's AI-led insights and personalized scheduling intelligence.",
    },
    valueProps: [
      {
        icon: "📊",
        title: "Analytics that explain themselves",
        description:
          "linkedbud's AI highlights what outperformed and why, so you can double down without exporting data. MagicPost offers analytics dashboards but doesn't emphasize AI-led explanations of performance patterns.",
      },
      {
        icon: "⏰",
        title: "Timing that learns your audience",
        description:
          "linkedbud's scheduler adapts to what worked for you before, not generic best-time guesses. MagicPost discusses generic scheduling guidance rather than learning from your historical performance.",
      },
      {
        icon: "🔒",
        title: "Transparent API compliance",
        description:
          "linkedbud publishes via LinkedIn Community Management API with a public compliance page for reviewers and security teams. MagicPost is LinkedIn-verified but doesn't emphasize transparent compliance documentation.",
      },
    ],
    seoTitle: "linkedbud vs MagicPost - Compare LinkedIn Content Tools",
    seoDescription:
      "Compare linkedbud and MagicPost for LinkedIn content creation. linkedbud offers AI-led performance insights, personalized scheduling intelligence, and transparent API compliance that MagicPost doesn't emphasize.",
  },
  taplio: {
    id: "taplio",
    name: "Taplio",
    displayName: "Taplio",
    tagline: "Maybe Taplio isn't so inspiring after all...",
    description:
      "Taplio is a LinkedIn automation and content creation tool that combines content scheduling with lead generation features and a Chrome extension. While versatile, it lacks personalized scheduling intelligence, AI-led performance insights, and transparent API compliance documentation that linkedbud provides.",
    heroTitle: "linkedbud vs Taplio",
    heroDescription:
      "linkedbud focuses exclusively on content creation and analytics, delivering personalized scheduling intelligence, AI-led performance insights, and transparent API compliance that Taplio's broad suite approach doesn't emphasize.",
    features: [
      {
        feature: "LinkedIn API compliance transparency",
        linkedbud: true,
        competitor: false,
      },
      {
        feature: "Personalized scheduling intelligence",
        linkedbud: true,
        competitor: false,
      },
      {
        feature: "AI-led performance insights",
        linkedbud: true,
        competitor: false,
      },
      {
        feature: "Company page support",
        linkedbud: true,
        competitor: "Not explicitly stated",
      },
      {
        feature: "End-to-end LinkedIn-native workflow",
        linkedbud: true,
        competitor: "Partial (broad suite + extension)",
      },
      {
        feature: "AI-generated post ideas",
        linkedbud: "Unlimited*",
        competitor: "Limited (requires upgrade)",
      },
      {
        feature: "AI drafting capabilities",
        linkedbud: true,
        competitor: "Premium feature ($65/month)",
      },
      {
        feature: "Scheduling & auto-publish",
        linkedbud: true,
        competitor: true,
      },
      {
        feature: "Collaborative workspace",
        linkedbud: true,
        competitor: false,
      },
    ],
    pricing: {
      startingPrice: "$39/month",
      popularPlan: "Pro",
      popularPlanPrice: "$65/month",
      notes: "Taplio starts at $39/month with limited features. To access AI-generated posts, you need to upgrade to the $65/month plan. linkedbud includes all features including AI-led insights and personalized scheduling in the Starter plan.",
    },
    valueProps: [
      {
        icon: "📊",
        title: "Analytics that explain themselves",
        description:
          "linkedbud's AI highlights what outperformed and why, so you can double down without exporting data. Taplio offers analytics dashboards but doesn't emphasize AI-led explanations of performance patterns.",
      },
      {
        icon: "⏰",
        title: "Timing that learns your audience",
        description:
          "linkedbud's scheduler adapts to what worked for you before, not generic best-time guesses. Taplio markets scheduling features but doesn't claim to learn from your historical performance.",
      },
      {
        icon: "🔒",
        title: "Built on the official LinkedIn API",
        description:
          "linkedbud publishes safely to profiles and pages with a public compliance page your reviewers will love. Taplio markets Chrome extension features but doesn't explicitly claim Community Management API use or provide transparent compliance documentation.",
      },
    ],
    seoTitle: "linkedbud vs Taplio - Compare LinkedIn Content Creation Tools",
    seoDescription:
      "Compare linkedbud and Taplio for LinkedIn content creation. linkedbud offers personalized scheduling intelligence, AI-led performance insights, and transparent API compliance that Taplio doesn't emphasize.",
  },
  authoredup: {
    id: "authoredup",
    name: "AuthoredUp",
    displayName: "AuthoredUp",
    tagline: "Maybe AuthoredUp isn't so comprehensive after all...",
    description:
      "AuthoredUp provides LinkedIn content creation with a strong editor, formatting tools, and analytics. While it offers a comprehensive editing experience, linkedbud provides AI-led performance insights, personalized scheduling intelligence, and transparent API compliance that AuthoredUp doesn't emphasize.",
    heroTitle: "linkedbud vs AuthoredUp",
    heroDescription:
      "linkedbud combines AI-powered ideation, AI-led performance insights, and personalized scheduling with transparent API compliance. AuthoredUp focuses on manual editing with formatting tools, lacking AI-led insights and personalized scheduling intelligence.",
    features: [
      {
        feature: "LinkedIn API compliance transparency",
        linkedbud: true,
        competitor: false,
      },
      {
        feature: "Personalized scheduling intelligence",
        linkedbud: true,
        competitor: false,
      },
      {
        feature: "AI-led performance insights",
        linkedbud: true,
        competitor: false,
      },
      {
        feature: "Company page support",
        linkedbud: true,
        competitor: "Not explicitly stated",
      },
      {
        feature: "End-to-end LinkedIn-native workflow",
        linkedbud: true,
        competitor: "Partial (editor + drafts + analytics)",
      },
      {
        feature: "AI-generated post ideas",
        linkedbud: "Unlimited*",
        competitor: false,
      },
      {
        feature: "AI drafting capabilities",
        linkedbud: true,
        competitor: false,
      },
      {
        feature: "Scheduling & auto-publish",
        linkedbud: true,
        competitor: true,
      },
      {
        feature: "Collaborative workspace",
        linkedbud: true,
        competitor: false,
      },
    ],
    pricing: {
      startingPrice: "$19.95/month",
      popularPlan: "Business",
      popularPlanPrice: "$14.95/month per profile",
      notes: "AuthoredUp's pricing scales per profile, which can become expensive for teams. linkedbud offers unlimited profiles, AI-led insights, and personalized scheduling in one plan.",
    },
    valueProps: [
      {
        icon: "📊",
        title: "Analytics that explain themselves",
        description:
          "linkedbud's AI highlights what outperformed and why, so you can double down without exporting data. AuthoredUp focuses on formatting and preview first, not AI-led insights into performance patterns.",
      },
      {
        icon: "⏰",
        title: "Timing that learns your audience",
        description:
          "linkedbud's scheduler adapts to what worked for you before, not generic best-time guesses. AuthoredUp offers scheduling but doesn't claim personalized timing based on your historical performance.",
      },
      {
        icon: "🔒",
        title: "Built on the official LinkedIn API",
        description:
          "linkedbud publishes safely to profiles and pages with a public compliance page your reviewers will love. AuthoredUp positions as GDPR-compliant extension but doesn't explicitly claim Community Management API use or provide transparent compliance documentation.",
      },
    ],
    seoTitle: "linkedbud vs AuthoredUp - Compare LinkedIn Content Tools",
    seoDescription:
      "Compare linkedbud and AuthoredUp for LinkedIn content creation. linkedbud offers AI-led performance insights, personalized scheduling intelligence, and transparent API compliance that AuthoredUp doesn't emphasize.",
  },
  easygen: {
    id: "easygen",
    name: "EasyGen",
    displayName: "EasyGen",
    tagline: "Maybe EasyGen isn't so easy after all...",
    description:
      "EasyGen offers AI-driven LinkedIn post generation via Chrome extension with a focus on creating engaging content. However, it explicitly states it never connects to the LinkedIn API, lacks native scheduling and analytics, and doesn't provide an end-to-end workflow like linkedbud.",
    heroTitle: "linkedbud vs EasyGen",
    heroDescription:
      "linkedbud provides a complete LinkedIn-native workflow with API compliance, personalized scheduling, and AI-led analytics. EasyGen is a writer-focused extension that doesn't connect to LinkedIn's API and lacks scheduling and analytics features.",
    features: [
      {
        feature: "LinkedIn API compliance transparency",
        linkedbud: true,
        competitor: "Explicitly no API connection",
      },
      {
        feature: "Personalized scheduling intelligence",
        linkedbud: true,
        competitor: false,
      },
      {
        feature: "AI-led performance insights",
        linkedbud: true,
        competitor: false,
      },
      {
        feature: "Company page support",
        linkedbud: true,
        competitor: "N/A (not a publisher)",
      },
      {
        feature: "End-to-end LinkedIn-native workflow",
        linkedbud: true,
        competitor: false,
      },
      {
        feature: "AI-generated post ideas",
        linkedbud: "Unlimited*",
        competitor: false,
      },
      {
        feature: "AI drafting capabilities",
        linkedbud: true,
        competitor: true,
      },
      {
        feature: "Scheduling & auto-publish",
        linkedbud: true,
        competitor: false,
      },
      {
        feature: "Analytics & insights",
        linkedbud: true,
        competitor: false,
      },
    ],
    pricing: {
      startingPrice: "Pricing not publicly available",
      notes: "EasyGen focuses solely on post generation via Chrome extension. linkedbud provides a complete LinkedIn-native platform with API compliance, scheduling, analytics, and collaboration.",
    },
    valueProps: [
      {
        icon: "🔒",
        title: "Built on the official LinkedIn API",
        description:
          "linkedbud publishes safely to profiles and pages with a public compliance page your reviewers will love. EasyGen's Chrome listing explicitly states it never connects to the LinkedIn API, limiting its capabilities.",
      },
      {
        icon: "🔄",
        title: "One LinkedIn-native flow",
        description:
          "linkedbud provides an end-to-end workflow from idea to publish to insight, all in one focused workspace with compliance clarity. EasyGen is writer-first and extension-focused, not providing a complete publishing workflow.",
      },
      {
        icon: "📊",
        title: "Analytics that explain themselves",
        description:
          "linkedbud's AI highlights what outperformed and why, so you can double down without exporting data. EasyGen doesn't provide analytics or performance tracking.",
      },
    ],
    seoTitle: "linkedbud vs EasyGen - Compare LinkedIn AI Content Tools",
    seoDescription:
      "Compare linkedbud and EasyGen for LinkedIn content creation. linkedbud offers a complete LinkedIn-native platform with API compliance, scheduling, and AI-led analytics that EasyGen's extension-based approach can't match.",
  },
  redactai: {
    id: "redactai",
    name: "RedactAI",
    displayName: "RedactAI",
    tagline: "Maybe RedactAI isn't so polished after all...",
    description:
      "RedactAI provides AI-generated LinkedIn content with formatting and styling options, plus profile review features. However, it lacks LinkedIn API compliance transparency, personalized scheduling, AI-led performance insights, and doesn't provide a complete publishing workflow like linkedbud.",
    heroTitle: "linkedbud vs RedactAI",
    heroDescription:
      "linkedbud provides a complete LinkedIn-native workflow with API compliance, personalized scheduling, and AI-led analytics. RedactAI focuses on content generation and profile review, lacking scheduling intelligence and performance insights.",
    features: [
      {
        feature: "LinkedIn API compliance transparency",
        linkedbud: true,
        competitor: false,
      },
      {
        feature: "Personalized scheduling intelligence",
        linkedbud: true,
        competitor: false,
      },
      {
        feature: "AI-led performance insights",
        linkedbud: true,
        competitor: false,
      },
      {
        feature: "Company page support",
        linkedbud: true,
        competitor: "Not explicitly stated",
      },
      {
        feature: "End-to-end LinkedIn-native workflow",
        linkedbud: true,
        competitor: false,
      },
      {
        feature: "AI-generated post ideas",
        linkedbud: "Unlimited*",
        competitor: false,
      },
      {
        feature: "AI drafting capabilities",
        linkedbud: true,
        competitor: true,
      },
      {
        feature: "Scheduling & auto-publish",
        linkedbud: true,
        competitor: false,
      },
      {
        feature: "Analytics & insights",
        linkedbud: true,
        competitor: false,
      },
    ],
    pricing: {
      startingPrice: "$11.90/month",
      notes: "RedactAI starts at $11.90/month with post limits. linkedbud provides a complete LinkedIn-native platform with API compliance, scheduling, and AI-led analytics without post limits.",
    },
    valueProps: [
      {
        icon: "🔒",
        title: "Built on the official LinkedIn API",
        description:
          "linkedbud publishes safely to profiles and pages with a public compliance page your reviewers will love. RedactAI focuses on generator and profile review but doesn't explicitly claim Community Management API use or provide transparent compliance documentation.",
      },
      {
        icon: "🔄",
        title: "One LinkedIn-native flow",
        description:
          "linkedbud provides an end-to-end workflow from idea to publish to insight, all in one focused workspace with compliance clarity. RedactAI doesn't provide a full publishing workflow with scheduling and analytics.",
      },
      {
        icon: "📊",
        title: "Analytics that explain themselves",
        description:
          "linkedbud's AI highlights what outperformed and why, so you can double down without exporting data. RedactAI is a profile review tool and doesn't provide publishing analytics.",
      },
    ],
    seoTitle: "linkedbud vs RedactAI - Compare LinkedIn Content Creation Tools",
    seoDescription:
      "Compare linkedbud and RedactAI for LinkedIn content creation. linkedbud offers a complete LinkedIn-native platform with API compliance, scheduling, and AI-led analytics that RedactAI's generator-focused approach can't match.",
  },
  perfectpost: {
    id: "perfectpost",
    name: "PerfectPost",
    displayName: "PerfectPost",
    tagline: "Maybe PerfectPost isn't so perfect after all...",
    description:
      "PerfectPost offers LinkedIn scheduling, analytics, and utilities like unreplied tracker and exports. However, it lacks LinkedIn API compliance transparency, personalized scheduling intelligence, AI-led performance insights, and doesn't explicitly state company page support.",
    heroTitle: "linkedbud vs PerfectPost",
    heroDescription:
      "linkedbud offers transparent API compliance, personalized scheduling intelligence, and AI-led performance insights. PerfectPost provides scheduling and analytics but doesn't emphasize AI-led explanations or personalized timing based on your history.",
    features: [
      {
        feature: "LinkedIn API compliance transparency",
        linkedbud: true,
        competitor: false,
      },
      {
        feature: "Personalized scheduling intelligence",
        linkedbud: true,
        competitor: false,
      },
      {
        feature: "AI-led performance insights",
        linkedbud: true,
        competitor: false,
      },
      {
        feature: "Company page support",
        linkedbud: true,
        competitor: "Not explicitly stated",
      },
      {
        feature: "End-to-end LinkedIn-native workflow",
        linkedbud: true,
        competitor: "Partial (scheduler + analytics + utilities)",
      },
      {
        feature: "AI-generated post ideas",
        linkedbud: "Unlimited*",
        competitor: "Unknown",
      },
      {
        feature: "AI drafting capabilities",
        linkedbud: true,
        competitor: "Unknown",
      },
      {
        feature: "Scheduling & auto-publish",
        linkedbud: true,
        competitor: true,
      },
      {
        feature: "Analytics with AI explanations",
        linkedbud: true,
        competitor: "Analytics with exports, not AI-led",
      },
    ],
    pricing: {
      startingPrice: "$19/month",
      notes: "PerfectPost starts at $19/month but doesn't emphasize AI-led performance explanations. linkedbud offers transparent pricing with a free tier and clear feature sets including AI-led insights.",
    },
    valueProps: [
      {
        icon: "📊",
        title: "Analytics that explain themselves",
        description:
          "linkedbud's AI highlights what outperformed and why, so you can double down without exporting data. PerfectPost offers analytics with exports and commenter insights but doesn't frame them as AI-led explanations of performance patterns.",
      },
      {
        icon: "⏰",
        title: "Timing that learns your audience",
        description:
          "linkedbud's scheduler adapts to what worked for you before, not generic best-time guesses. PerfectPost has scheduling features but doesn't claim history-based personalized timing.",
      },
      {
        icon: "🔒",
        title: "Built on the official LinkedIn API",
        description:
          "linkedbud publishes safely to profiles and pages with a public compliance page your reviewers will love. PerfectPost provides scheduling and analytics but doesn't explicitly claim Community Management API use or provide transparent compliance documentation.",
      },
    ],
    seoTitle: "linkedbud vs PerfectPost - Compare LinkedIn Content Tools",
    seoDescription:
      "Compare linkedbud and PerfectPost for LinkedIn content creation. linkedbud offers transparent API compliance, personalized scheduling intelligence, and AI-led performance insights that PerfectPost doesn't emphasize.",
  },
  postdrips: {
    id: "postdrips",
    name: "Postdrips",
    displayName: "Postdrips",
    tagline: "Maybe Postdrips isn't so comprehensive after all...",
    description:
      "Postdrips offers AI-powered LinkedIn tools for content planning, creation, scheduling, and optimization at an affordable price. However, it lacks LinkedIn API compliance transparency, personalized scheduling intelligence, and AI-led performance insights that linkedbud provides.",
    heroTitle: "linkedbud vs Postdrips",
    heroDescription:
      "linkedbud combines affordable pricing with personalized scheduling intelligence, AI-led performance insights, and transparent API compliance. Postdrips offers good writing and scheduling but doesn't emphasize AI-led insights or personalized timing.",
    features: [
      {
        feature: "LinkedIn API compliance transparency",
        linkedbud: true,
        competitor: false,
      },
      {
        feature: "Personalized scheduling intelligence",
        linkedbud: true,
        competitor: false,
      },
      {
        feature: "AI-led performance insights",
        linkedbud: true,
        competitor: false,
      },
      {
        feature: "Company page support",
        linkedbud: true,
        competitor: "Not explicitly stated",
      },
      {
        feature: "End-to-end LinkedIn-native workflow",
        linkedbud: true,
        competitor: "Partial (ideas + writer + scheduler)",
      },
      {
        feature: "AI-generated post ideas",
        linkedbud: "Unlimited*",
        competitor: true,
      },
      {
        feature: "AI drafting capabilities",
        linkedbud: true,
        competitor: true,
      },
      {
        feature: "Scheduling & auto-publish",
        linkedbud: true,
        competitor: true,
      },
      {
        feature: "Analytics with AI explanations",
        linkedbud: true,
        competitor: "Basic analytics, no AI-led insights",
      },
    ],
    pricing: {
      startingPrice: "$20/month",
      popularPlan: "Premium",
      popularPlanPrice: "$20/month",
      notes: "Postdrips offers affordable pricing at $20/month, but linkedbud provides better value with AI-led insights, personalized scheduling, and transparent API compliance included.",
    },
    valueProps: [
      {
        icon: "📊",
        title: "Analytics that explain themselves",
        description:
          "linkedbud's AI highlights what outperformed and why, so you can double down without exporting data. Postdrips offers previews and ideas but doesn't provide AI-led campaign insights messaging.",
      },
      {
        icon: "⏰",
        title: "Timing that learns your audience",
        description:
          "linkedbud's scheduler adapts to what worked for you before, not generic best-time guesses. Postdrips has scheduling features but doesn't claim history-based personalized timing.",
      },
      {
        icon: "🔒",
        title: "Built on the official LinkedIn API",
        description:
          "linkedbud publishes safely to profiles and pages with a public compliance page your reviewers will love. Postdrips highlights tone mimic and scheduling but doesn't explicitly claim Community Management API use or provide transparent compliance documentation.",
      },
    ],
    seoTitle: "linkedbud vs Postdrips - Compare LinkedIn Content Creation Tools",
    seoDescription:
      "Compare linkedbud and Postdrips for LinkedIn content creation. linkedbud offers personalized scheduling intelligence, AI-led performance insights, and transparent API compliance that Postdrips doesn't emphasize.",
  },
};

// Helper function to get competitor data by ID
export function getCompetitorData(id: string): CompetitorData | null {
  return COMPETITORS[id] || null;
}

// Get all competitor IDs
export function getAllCompetitorIds(): string[] {
  return Object.keys(COMPETITORS);
}

