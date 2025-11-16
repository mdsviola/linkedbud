import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";
import {
  checkSubscriptionLimit,
  incrementUsageByType,
  handleSubscriptionLimitError,
} from "@/lib/auth";
import OpenAI from "openai";

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

    // Check subscription limit for polish operations
    try {
      await checkSubscriptionLimit(user.id, "polish");
    } catch (error) {
      const limitError = handleSubscriptionLimitError(error);
      if (limitError) return limitError;
      throw error;
    }

    const { prompt, content } = await request.json();

    if (!prompt || !content) {
      return NextResponse.json(
        { error: "Please provide both content and prompt" },
        { status: 400 }
      );
    }

    if (!content.trim() || content.trim().length === 0) {
      return NextResponse.json(
        { error: "Content is empty" },
        { status: 400 }
      );
    }

    // Create OpenAI instance
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // Create the polish prompt for OpenAI (same logic as existing polish endpoint)
    const polishSystemPrompt = `You are an expert LinkedIn content writer. Polish and improve the LinkedIn post based on user feedback.

CRITICAL RULES:
- Keep natural LinkedIn post flow
- ALWAYS preserve any source URLs or attribution links exactly as they appear
- NEVER remove or modify "Source:", "Read more:", or similar attribution text

When user asks for "call-to-action" → integrate naturally into content
When user asks for "emojis" → use sparingly

Original content:
${content}

User request: ${prompt}

Provide improved content (preserve all source URLs):`;

    // Call OpenAI to polish the content
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: polishSystemPrompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 2000,
    });

    const polishedContent = completion.choices[0]?.message?.content?.trim();

    if (!polishedContent) {
      return NextResponse.json(
        { error: "Unable to polish the content at this time" },
        { status: 500 }
      );
    }

    // Validate that we have polished content
    if (!polishedContent || polishedContent.trim().length === 0) {
      return NextResponse.json(
        { error: "Unable to polish the content at this time" },
        { status: 500 }
      );
    }

    // Increment usage counter by type
    await incrementUsageByType(user.id, "polish");

    return NextResponse.json({
      success: true,
      polishedContent: polishedContent.trim(),
    });
  } catch (error) {
    const limitError = handleSubscriptionLimitError(error);
    if (limitError) return limitError;
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}

