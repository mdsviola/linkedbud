import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";
import { selectRelevantArticles } from "@/lib/openai";
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

    // Check subscription limit for for-you recommendations
    try {
      await checkSubscriptionLimit(user.id, "for_you");
    } catch (error) {
      const limitError = handleSubscriptionLimitError(error);
      if (limitError) return limitError;
      throw error;
    }

    const { articles, topics } = await request.json();

    // Validate input
    if (!Array.isArray(articles) || !Array.isArray(topics)) {
      return NextResponse.json(
        {
          error: "Invalid input: articles and topics must be arrays",
        },
        { status: 400 }
      );
    }

    if (articles.length === 0) {
      return NextResponse.json({
        recommendedArticles: [],
        total: 0,
      });
    }

    // Use OpenAI to select the most relevant articles
    const recommendations = await selectRelevantArticles(articles, topics);

    // Get the recommended articles with their reasons
    const recommendedArticles = recommendations
      .map(({ index, reason }) => ({
        ...articles[index],
        aiReason: reason,
      }))
      .filter((article) => article.title); // Ensure article exists

    // Increment usage counter by type
    await incrementUsageByType(user.id, "for_you");

    return NextResponse.json({
      recommendedArticles,
      total: recommendedArticles.length,
    });
  } catch (error) {
    console.error("Error in articles recommend:", error);
    const limitError = handleSubscriptionLimitError(error);
    if (limitError) return limitError;
    return NextResponse.json(
      {
        error: "Failed to get recommendations",
      },
      { status: 500 }
    );
  }
}

