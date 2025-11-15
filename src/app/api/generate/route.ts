import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";
import { summarizeAndGenerateDrafts, generateKeywords } from "@/lib/openai";
import {
  checkSubscriptionLimit,
  incrementUsageByType,
  handleSubscriptionLimitError,
} from "@/lib/auth";
import { scrapeArticleContent } from "@/lib/scrapingbee";

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check subscription limit for draft generation
    try {
      await checkSubscriptionLimit(user.id, "draft");
    } catch (error) {
      const limitError = handleSubscriptionLimitError(error);
      if (limitError) return limitError;
      throw error;
    }

    const {
      articleData,
      tone = "Professional",
      postType = "Industry News",
      customPrompt = "",
      targetAudience = "Industry Professionals",
      keyPoints = "",
      callToAction = "",
      includeHashtags = false,
      includeSourceArticle = true,
      maxLength = 1200,
      language = "English",
    } = await request.json();

    if (!articleData || !articleData.title || !articleData.url) {
      return NextResponse.json(
        { error: "Article data is required (title and url)" },
        { status: 400 }
      );
    }

    // Get user preferences
    const { data: prefs, error: prefsError } = await supabase
      .from("user_prefs")
      .select("topics, user_corpus")
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
      return NextResponse.json(
        {
          error:
            "User preferences not found. Please complete onboarding first.",
        },
        { status: 404 }
      );
    }

    // Parse the article content using ScrapingBee
    let scrapedContent: string;
    try {
      const { content } = await scrapeArticleContent(articleData.url);
      scrapedContent = content;
    } catch (error) {
      console.error("Error parsing article:", error);

      return NextResponse.json(
        {
          error: "Failed to scrape article content",
        },
        { status: 400 }
      );
    }

    // Use both the article title and parsed content for better context
    const articleSnippets = [articleData.title, scrapedContent];

    // Include source information for attribution
    const sourceInfo = {
      url: articleData.url,
      title: articleData.title,
    };

    if (articleSnippets.length === 0) {
      return NextResponse.json(
        {
          error: "No article content found",
          details: "The article data is missing required content.",
        },
        { status: 404 }
      );
    }

    // Extract tone from user corpus
    const userTone = prefs.user_corpus?.tone_descriptor || "expert";

    // Generate drafts using OpenAI
    let result;
    try {
      result = await summarizeAndGenerateDrafts({
        industryKeywords: prefs.topics || [],
        userTone: tone, // Use the tone from the form instead of user corpus
        articleSnippets,
        sourceInfo,
        postType,
        customPrompt,
        targetAudience,
        keyPoints,
        callToAction,
        includeHashtags,
        includeSourceArticle,
        maxLength,
        language,
      });
    } catch (error) {
      console.error("Error generating drafts:", error);
      return NextResponse.json(
        {
          error: "Failed to generate post content",
          details:
            error instanceof Error
              ? error.message
              : "The AI was unable to generate valid content. Please try again.",
        },
        { status: 500 }
      );
    }

    // Increment usage counter by type
    await incrementUsageByType(user.id, "draft");

    // Return variants for user selection (don't save to DB yet)
    // User will select one variant and call /api/posts/create with the selected content
    return NextResponse.json({
      variants: result.draftVariants,
      twoParaSummary: result.twoParaSummary,
      sourceInfo: {
        url: articleData.url,
        title: articleData.title,
        content: scrapedContent,
      },
    });
  } catch (error) {
    console.error("Error generating drafts:", error);
    const limitError = handleSubscriptionLimitError(error);
    if (limitError) return limitError;
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
