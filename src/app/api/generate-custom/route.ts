import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";
import { summarizeAndGenerateDrafts, generateKeywords } from "@/lib/openai";
import {
  checkSubscriptionLimit,
  incrementUsageByType,
  handleSubscriptionLimitError,
} from "@/lib/auth";

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

    // Check subscription limit for rewrite with AI
    try {
      await checkSubscriptionLimit(user.id, "rewrite_with_ai");
    } catch (error) {
      const limitError = handleSubscriptionLimitError(error);
      if (limitError) return limitError;
      throw error;
    }

    const {
      topicTitle,
      tone = "Professional",
      postType = "Thought Leadership",
      customPrompt = "",
      targetAudience = "Industry Professionals",
      keyPoints = "",
      callToAction = "",
      includeHashtags = false,
      includeSourceArticle = false,
      includeEmojis = false,
      maxLength = 1200,
      language = "English",
      articleUrl,
      articleTitle,
      articleContent,
    } = await request.json();

    if (!topicTitle || !topicTitle.trim()) {
      return NextResponse.json(
        { error: "Topic title is required" },
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

    // Use the topic title as the content for generation
    let articleSnippets = [topicTitle];

    // If article content is provided, include it for better context
    if (articleContent) {
      articleSnippets = [topicTitle, articleContent];
    }

    // Create source info if article data is present
    const sourceInfo =
      articleUrl && articleTitle
        ? {
            url: articleUrl,
            title: articleTitle,
          }
        : undefined;

    // Generate drafts using OpenAI
    let result;
    try {
      result = await summarizeAndGenerateDrafts({
        industryKeywords: prefs.topics || [],
        userTone: tone,
        articleSnippets,
        sourceInfo,
        postType,
        customPrompt,
        targetAudience,
        keyPoints,
        callToAction,
        includeHashtags,
        includeSourceArticle,
        includeEmojis,
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
    await incrementUsageByType(user.id, "rewrite_with_ai");

    // Return variants for user selection (don't save to DB yet)
    // User will select one variant and call /api/posts/create with the selected content
    return NextResponse.json({
      variants: result.draftVariants,
      twoParaSummary: result.twoParaSummary,
      sourceInfo: {
        url: articleUrl || null,
        title: articleTitle || null,
        content: articleContent || null,
      },
    });
  } catch (error) {
    console.error("Error generating custom post:", error);
    const limitError = handleSubscriptionLimitError(error);
    if (limitError) return limitError;
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
