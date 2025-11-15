import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";
import {
  checkSubscriptionLimit,
  incrementUsageByType,
  handleSubscriptionLimitError,
} from "@/lib/auth";
import OpenAI from "openai";

export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const { prompt } = await request.json();
    const postId = parseInt(params.id);

    if (!postId || !prompt) {
      return NextResponse.json(
        { error: "Please provide all required information" },
        { status: 400 }
      );
    }

    // Fetch the post to get current content
    const { data: post, error: fetchError } = await supabase
      .from("posts")
      .select("*")
      .eq("id", postId)
      .eq("user_id", user.id)
      .single();

    if (fetchError || !post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    if (!post.content || post.content.trim().length === 0) {
      return NextResponse.json(
        { error: "Post content is empty" },
        { status: 404 }
      );
    }

    const currentContent = post.content;

    // Create OpenAI instance
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // Create the polish prompt for OpenAI
    const polishSystemPrompt = `You are an expert LinkedIn content writer. Polish and improve the LinkedIn post based on user feedback.

CRITICAL RULES:
- Keep natural LinkedIn post flow
- ALWAYS preserve any source URLs or attribution links exactly as they appear
- NEVER remove or modify "Source:", "Read more:", or similar attribution text

When user asks for "call-to-action" → integrate naturally into content
When user asks for "emojis" → use sparingly

Original content:
${currentContent}

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

    // Update the post with the polished content
    const { error: updateError } = await supabase
      .from("posts")
      .update({ content: polishedContent.trim() })
      .eq("id", postId)
      .eq("user_id", user.id);

    if (updateError) {
      return NextResponse.json(
        { error: "Unable to save the polished content" },
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
