import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";
import OpenAI from "openai";
import {
  extractCategoriesFromRssFeeds,
  extractKeywordsFromRssFeeds,
} from "@/lib/rss-utils";
import { fetchCustomRSSFeeds, RSSArticle } from "@/lib/rss";
import { Idea } from "@/components/ideas-showcase";
import { getUserSubscription } from "@/lib/auth";

export const dynamic = "force-dynamic";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Get cooldown duration in milliseconds based on user's tier
 * Can be configured via environment variables:
 * - TIER_{TIER}_CONTENT_IDEAS_COOLDOWN_HOURS (in hours)
 * Defaults:
 * - FREE: 30 days (720 hours)
 * - LITE: 7 days (168 hours)
 * - PRO: 1 day (24 hours)
 * - GROWTH/ENTERPRISE: 12 hours
 */
async function getCooldownDurationMs(userId: string): Promise<number> {
  const subscription = await getUserSubscription(userId);

  // Map price_id to tier
  const TIER_MAPPING: Record<string, string> = {
    [process.env.LEMONSQUEEZY_VARIANT_ID_PRO || ""]: "PRO",
    [process.env.LEMONSQUEEZY_VARIANT_ID_GROWTH || ""]: "GROWTH",
    [process.env.LEMONSQUEEZY_VARIANT_ID_LITE || ""]: "LITE",
  };

  let tier: string;
  if (!subscription) {
    tier = "FREE";
  } else {
    tier = subscription.price_id && TIER_MAPPING[subscription.price_id]
      ? TIER_MAPPING[subscription.price_id]
      : "PRO"; // Default to PRO for unknown subscriptions
  }

  // Check for environment variable override
  const envKey = `TIER_${tier}_CONTENT_IDEAS_COOLDOWN_HOURS`;
  const envValue = process.env[envKey];

  if (envValue) {
    const hours = parseInt(envValue, 10);
    if (!isNaN(hours) && hours > 0) {
      return hours * 60 * 60 * 1000; // Convert hours to milliseconds
    }
  }

  // Default values if no env var is set
  const defaults: Record<string, number> = {
    FREE: 30 * 24,      // 30 days in hours
    LITE: 7 * 24,       // 7 days in hours
    PRO: 24,            // 1 day in hours
    GROWTH: 12,         // 12 hours
    ENTERPRISE: 12,     // 12 hours
  };

  const hours = defaults[tier] || defaults.PRO;
  return hours * 60 * 60 * 1000; // Convert hours to milliseconds
}

/**
 * Check if user can generate ideas based on expires_at from content_ideas table
 */
async function checkCooldown(
  supabase: any,
  userId: string
): Promise<{ canGenerate: boolean; remainingMs: number }> {
  const { data: contentIdeas, error } = await supabase
    .from("content_ideas")
    .select("expires_at")
    .eq("user_id", userId)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      // Not found - that's okay, means no ideas exist yet, user can generate
      return { canGenerate: true, remainingMs: 0 };
    }
    console.error("Error checking cooldown:", error);
    // On error, allow generation (fail open)
    return { canGenerate: true, remainingMs: 0 };
  }

  if (!contentIdeas || !contentIdeas.expires_at) {
    // No expiration date, user can generate
    return { canGenerate: true, remainingMs: 0 };
  }

  const expiresAt = new Date(contentIdeas.expires_at).getTime();
  const now = Date.now();
  const remaining = expiresAt - now;

  if (remaining > 0) {
    return { canGenerate: false, remainingMs: remaining };
  }

  return { canGenerate: true, remainingMs: 0 };
}

/**
 * Save ideas to database with expires_at timestamp
 */
async function saveIdeasToDatabase(
  supabase: any,
  userId: string,
  ideas: Idea[]
): Promise<void> {
  const now = new Date();
  const cooldownDuration = await getCooldownDurationMs(userId);
  const expiresAt = new Date(now.getTime() + cooldownDuration);

  const { error } = await supabase.from("content_ideas").upsert(
    {
      user_id: userId,
      ideas: ideas,
      generated_at: now.toISOString(),
      expires_at: expiresAt.toISOString(),
    },
    {
      onConflict: "user_id",
    }
  );

  if (error) {
    console.error("Error saving ideas to database:", error);
    // Don't throw - this is not critical for the response
  }
}

/**
 * Get existing ideas from database with metadata
 */
async function getIdeasFromDatabase(
  supabase: any,
  userId: string
): Promise<{ ideas: Idea[]; generated_at: string; expires_at: string } | null> {
  const { data, error } = await supabase
    .from("content_ideas")
    .select("ideas, generated_at, expires_at")
    .eq("user_id", userId)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      // Not found - that's okay, means no ideas exist yet
      return null;
    }
    console.error("Error fetching ideas from database:", error);
    return null;
  }

  if (!data || !data.ideas) {
    return null;
  }

  // Validate that ideas is an array
  if (!Array.isArray(data.ideas)) {
    console.error("Invalid ideas format in database");
    return null;
  }

  return {
    ideas: data.ideas as Idea[],
    generated_at: data.generated_at,
    expires_at: data.expires_at,
  };
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if we should force refresh (query parameter)
    const { searchParams } = new URL(request.url);
    const forceRefresh = searchParams.get("refresh") === "true";

    // Check database for existing ideas
    const existingData = await getIdeasFromDatabase(supabase, user.id);

    // If we have existing ideas, check if they should be refreshed
    if (existingData && existingData.ideas && existingData.ideas.length > 0) {
      const expiresAt = new Date(existingData.expires_at).getTime();
      const now = Date.now();
      const isExpired = expiresAt <= now;

      // If not forcing refresh and ideas haven't expired, return cached ideas
      if (!forceRefresh && !isExpired) {
        return NextResponse.json({
          ideas: existingData.ideas,
          generated_at: existingData.generated_at,
          expires_at: existingData.expires_at,
        });
      }

      // If forcing refresh or expired, check cooldown before generating new ones
      if (forceRefresh || isExpired) {
        // Check if we can generate new ones
        const { canGenerate, remainingMs } = await checkCooldown(supabase, user.id);
        if (!canGenerate) {
          // Still in cooldown, return existing ideas with metadata
          const remainingMinutes = Math.ceil(remainingMs / (60 * 1000));
          const remainingHours = Math.floor(remainingMinutes / 60);
          const remainingDays = Math.floor(remainingHours / 24);

          let message: string;
          if (remainingDays > 0) {
            message = `Please wait ${remainingDays} day${remainingDays !== 1 ? "s" : ""} before generating new ideas.`;
          } else if (remainingHours > 0) {
            message = `Please wait ${remainingHours} hour${remainingHours !== 1 ? "s" : ""} before generating new ideas.`;
          } else {
            message = `Please wait ${remainingMinutes} minute${
              remainingMinutes !== 1 ? "s" : ""
            } before generating new ideas.`;
          }

          return NextResponse.json({
            ideas: existingData.ideas,
            generated_at: existingData.generated_at,
            expires_at: existingData.expires_at,
            expired: isExpired,
            error: "cooldown",
            remainingMs,
            remainingMinutes,
            message,
          });
        }
        // Cooldown passed, will generate new ideas below
      }
    }

    // No ideas exist or need refresh, check if we can generate new ones
    const { canGenerate, remainingMs } = await checkCooldown(supabase, user.id);

    if (!canGenerate) {
      const remainingMinutes = Math.ceil(remainingMs / (60 * 1000));
      const remainingHours = Math.floor(remainingMinutes / 60);
      const remainingDays = Math.floor(remainingHours / 24);

      let message: string;
      if (remainingDays > 0) {
        message = `Please wait ${remainingDays} day${remainingDays !== 1 ? "s" : ""} before generating new ideas.`;
      } else if (remainingHours > 0) {
        message = `Please wait ${remainingHours} hour${remainingHours !== 1 ? "s" : ""} before generating new ideas.`;
      } else {
        message = `Please wait ${remainingMinutes} minute${
          remainingMinutes !== 1 ? "s" : ""
        } before generating new ideas.`;
      }

      // If we have existing ideas, return them even if in cooldown
      if (existingData && existingData.ideas && existingData.ideas.length > 0) {
        return NextResponse.json({
          ideas: existingData.ideas,
          generated_at: existingData.generated_at,
          expires_at: existingData.expires_at,
          error: "cooldown",
          remainingMs,
          remainingMinutes,
          message,
        });
      }

      return NextResponse.json({
        error: "cooldown",
        remainingMs,
        remainingMinutes,
        message,
      });
    }

    // Get user preferences
    const { data: prefs, error: prefsError } = await supabase
      .from("user_prefs")
      .select("topics, custom_rss_feeds")
      .eq("user_id", user.id)
      .single();

    if (prefsError) {
      console.error("Error fetching user preferences:", prefsError);
      return NextResponse.json(
        { error: "Failed to fetch user preferences" },
        { status: 500 }
      );
    }

    if (!prefs) {
      // Return empty ideas if no preferences found
      return NextResponse.json({ ideas: [] });
    }

    const userTopics = prefs.topics || [];
    const customRssFeeds = prefs.custom_rss_feeds || [];

    // Extract categories from custom RSS feeds
    const categories = extractCategoriesFromRssFeeds(customRssFeeds);

    // Fetch articles from RSS feeds and get recent article titles
    let articleTitles: string[] = [];
    let selectedArticles: RSSArticle[] = [];
    if (customRssFeeds && customRssFeeds.length > 0) {
      try {
        const articles = await fetchCustomRSSFeeds(customRssFeeds);

        // Sort all articles by publish date (most recent first)
        const sortedArticles = [...articles].sort((a, b) => {
          const dateA = a.pubDate ? new Date(a.pubDate).getTime() : 0;
          const dateB = b.pubDate ? new Date(b.pubDate).getTime() : 0;
          return dateB - dateA; // Most recent first
        });

        // Group articles by source/feed
        const articlesBySource = sortedArticles.reduce((groups, article) => {
          const source = article.source;
          if (!groups[source]) {
            groups[source] = [];
          }
          groups[source].push(article);
          return groups;
        }, {} as Record<string, RSSArticle[]>);

        // Select max 3 most recent titles from each source
        for (const [source, sourceArticles] of Object.entries(
          articlesBySource
        )) {
          // Sort articles within this source by date (most recent first)
          // This ensures we get the most recent articles from each source
          const sortedSourceArticles = [...sourceArticles].sort((a, b) => {
            const dateA = a.pubDate ? new Date(a.pubDate).getTime() : 0;
            const dateB = b.pubDate ? new Date(b.pubDate).getTime() : 0;
            return dateB - dateA; // Most recent first
          });

          // Take the first 3 (most recent) from this source
          const selected = sortedSourceArticles.slice(0, 3);
          articleTitles.push(...selected.map((article) => article.title));
          selectedArticles.push(...selected);
        }

        // Re-sort selectedArticles by date to maintain chronological order in the final list
        selectedArticles.sort((a, b) => {
          const dateA = a.pubDate ? new Date(a.pubDate).getTime() : 0;
          const dateB = b.pubDate ? new Date(b.pubDate).getTime() : 0;
          return dateB - dateA; // Most recent first
        });

        // Update articleTitles to match the re-sorted order
        articleTitles = selectedArticles.map((article) => article.title);
      } catch (error) {
        console.error("Error fetching articles from RSS feeds:", error);
        // Continue without article titles if there's an error
      }
    }

    // Extract keywords from RSS feed titles (as fallback)
    const keywords = extractKeywordsFromRssFeeds(customRssFeeds);

    // Combine user topics with extracted categories as "topics"
    const allTopics = [...userTopics, ...categories];

    // Use article titles as primary keywords, fallback to RSS feed keywords
    const allKeywords = articleTitles.length > 0 ? articleTitles : keywords;

    // If no topics or keywords, return empty ideas
    if (allTopics.length === 0 && allKeywords.length === 0) {
      return NextResponse.json({ ideas: [] });
    }

    // Generate ideas using OpenAI with article context
    const ideas = await generateIdeas(
      allTopics,
      allKeywords,
      articleTitles,
      selectedArticles
    );

    // Save ideas to database (includes expires_at for cooldown)
    await saveIdeasToDatabase(supabase, user.id, ideas);

    // Get the saved data to return generated_at and expires_at
    const savedData = await getIdeasFromDatabase(supabase, user.id);

    return NextResponse.json({
      ideas,
      generated_at: savedData?.generated_at || new Date().toISOString(),
      expires_at: savedData?.expires_at || new Date(Date.now() + await getCooldownDurationMs(user.id)).toISOString(),
    });
  } catch (error) {
    console.error("Error in ideas API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

async function generateIdeas(
  topics: string[],
  keywords: string[],
  articleTitles: string[] = [],
  articles: RSSArticle[] = []
): Promise<Idea[]> {
  const topicsText = topics.length > 0 ? topics.join(", ") : "general";
  const keywordsText =
    keywords.length > 0 ? keywords.join(", ") : "content creation";

  // Format article titles for context with numbering for reference
  // Articles are sorted by publish date (most recent first)
  const articleContext =
    articleTitles.length > 0
      ? `\n\n### Recent Articles Context\nHere are recent article titles from your RSS feeds, sorted by publish date (most recent first). **Prioritize ideas based on the most recent articles** (lower article numbers are more recent). When creating ideas inspired by these articles, reference the article number:\n${articleTitles
          .map((title, i) => `Article ${i + 1}: "${title}"`)
          .join("\n")}`
      : "";

  const prompt = `You are an AI idea generator.

Your task is to generate **15 diverse ideas** in JSON format, each following this structure:

// Idea interface matches the one in components/ideas-showcase.tsx
interface Idea {
  title: string;
  description: string;
  topic?: string; // Optional topic for color coding
  source?: string; // Optional source article title if idea was inspired by a specific article
  sourceArticleNumber?: number; // Optional article number reference (1-indexed)
  articleUrl?: string; // Optional article URL for loading the article in the modal
}

### Context
The user will provide:
- Topics → broad areas of interest (e.g., "AI", "productivity", "leadership", "remote work")
- Keywords → specific terms, tools, or concepts they care about (e.g., "automation", "LinkedIn", "content strategy", "founder life")
${
  articleTitles.length > 0
    ? "- Recent Article Titles → current headlines from their RSS feeds that reflect trending topics and emerging themes"
    : ""
}

### Instructions
- Create 15 creative and varied ideas.
${
  articleTitles.length > 0
    ? '- **At least 8-10 ideas should be directly inspired by the article titles** provided, with **strong preference for the most recent articles** (Article 1, 2, 3, etc. are the most recent). Articles are sorted by publish date, so prioritize lower article numbers. For these ideas, you MUST include the "sourceArticleNumber" field (the number from the article list above, e.g., 1, 2, 3, etc.) and the "source" field with the exact article title. This shows the user which article inspired the idea.'
    : "- You can mix and match topics and keywords to make the ideas feel fresh and original."
}
- Each idea must include:
  - **title** → short, catchy, max 10 words
  - **description** → concise, 1–2 sentences that reference or build upon the source article when applicable
  - **topic** → include only if it clearly belongs to a single topic
  ${
    articleTitles.length > 0
      ? "- **source** → the exact article title (only if idea is inspired by an article)"
      : ""
  }
  ${
    articleTitles.length > 0
      ? "- **sourceArticleNumber** → the article number from the list above (only if idea is inspired by an article)"
      : ""
  }
- Keep ideas balanced: some should stick to one topic, others should combine multiple interests.
${
  articleTitles.length > 0
    ? '- When referencing articles, create original angles or connections - don\'t just summarize. For example, if an article is about "AI in Healthcare", you might create an idea about "How AI is changing patient communication" or "The ethical questions healthcare AI raises".'
    : ""
}
- Avoid repetition and generic phrasing.
- Output must be a **valid JSON array** of Idea objects — no extra text, markdown, or explanations.

### Example input
Topics: AI, productivity, personal branding
Keywords: automation, LinkedIn, storytelling, startup life
${
  articleTitles.length > 0
    ? `
Article 1: "How AI is Transforming Remote Work"
Article 2: "5 Productivity Hacks Every Founder Needs"
Article 3: "The Future of Personal Branding on LinkedIn"`
    : ""
}

### Example output
[
  {
    "title": "The Founder's AI Co-Pilot",
    "description": "How AI assistants are redefining startup efficiency and freeing founders from busywork.",
    "topic": "AI"
  },
  {
    "title": "LinkedIn Storytelling Formula",
    "description": "Break down the perfect LinkedIn post structure for authentic engagement.",
    "topic": "personal branding"
  },
  {
    "title": "Automate Your Mornings",
    "description": "Five small automation habits that can save hours every week.",
    "topic": "productivity"
  },
  ${
    articleTitles.length > 0
      ? `{
    "title": "Remote Work's AI Revolution",
    "description": "Exploring how AI tools are reshaping how we work remotely, building on current trends in workplace technology.",
    "topic": "AI",
    "source": "How AI is Transforming Remote Work",
    "sourceArticleNumber": 1
  },
  {
    "title": "Beyond the Productivity Hacks",
    "description": "What founders really need to know about productivity beyond the standard tips - a deeper dive into effective time management.",
    "topic": "productivity",
    "source": "5 Productivity Hacks Every Founder Needs",
    "sourceArticleNumber": 2
  },`
      : ""
  }
  {
    "title": "The Startup That Branded Itself Overnight",
    "description": "A case study on storytelling and automation to build a founder's brand fast."
  }
]

### User input
Topics: ${topicsText}
Keywords: ${keywordsText}${articleContext}

### Output
Return only a valid JSON array of 15 Idea objects.`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are an AI idea generator that creates creative content ideas for LinkedIn posts. Always return valid JSON arrays only, with no markdown formatting or extra text. The output must start with [ and end with ].",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.8,
      max_tokens: 2000,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No content generated");
    }

    // Parse the JSON response
    let parsed;
    try {
      // Try parsing as direct JSON first
      parsed = JSON.parse(content);
    } catch (parseError) {
      // If parsing fails, try to extract JSON from markdown code blocks
      const jsonMatch = content.match(/```(?:json)?\s*(\[[\s\S]*?\])\s*```/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[1]);
      } else {
        // Try to find JSON array in the content
        const arrayMatch = content.match(/\[[\s\S]*?\]/);
        if (arrayMatch) {
          parsed = JSON.parse(arrayMatch[0]);
        } else {
          throw new Error("Failed to parse JSON response");
        }
      }
    }

    // Handle both { ideas: [...] } and direct array formats
    const ideasArray = Array.isArray(parsed) ? parsed : parsed.ideas || [];
    if (!Array.isArray(ideasArray)) {
      throw new Error("Response is not an array");
    }

    // Validate and return ideas
    const validatedIdeas = ideasArray
      .slice(0, 15)
      .filter(
        (idea: any): idea is Idea =>
          idea &&
          typeof idea.title === "string" &&
          typeof idea.description === "string" &&
          (!idea.topic || typeof idea.topic === "string") &&
          (!idea.source || typeof idea.source === "string") &&
          (!idea.sourceArticleNumber ||
            typeof idea.sourceArticleNumber === "number") &&
          (!idea.articleUrl || typeof idea.articleUrl === "string")
      )
      .map((idea: any) => {
        const mapped: Idea = {
          title: idea.title.trim(),
          description: idea.description.trim(),
          topic: idea.topic?.trim() || undefined,
        };

        // Map source article number to actual article title and URL if available
        if (idea.sourceArticleNumber && articleTitles.length > 0) {
          const articleIndex = idea.sourceArticleNumber - 1; // Convert to 0-indexed
          if (articleIndex >= 0 && articleIndex < articleTitles.length) {
            mapped.source = articleTitles[articleIndex];
            // Find the corresponding article URL from selectedArticles
            if (articles.length > articleIndex) {
              mapped.articleUrl = articles[articleIndex]?.link;
            }
          } else if (idea.source) {
            // Fallback to provided source if number is invalid
            mapped.source = idea.source.trim();
            // Try to find article URL by title match
            const matchingArticle = articles.find(
              (a) => a.title === idea.source.trim()
            );
            if (matchingArticle) {
              mapped.articleUrl = matchingArticle.link;
            }
          }
        } else if (idea.source) {
          mapped.source = idea.source.trim();
          // Try to find article URL by title match
          const matchingArticle = articles.find(
            (a) => a.title === idea.source.trim()
          );
          if (matchingArticle) {
            mapped.articleUrl = matchingArticle.link;
          }
        }

        return mapped;
      });

    return validatedIdeas;
  } catch (error) {
    console.error("Error generating ideas:", error);
    // Return empty array on error instead of throwing
    return [];
  }
}
