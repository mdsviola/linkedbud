import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";

export const dynamic = 'force-dynamic';

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

    // Get user preferences
    const { data: prefs, error: prefsError } = await supabase
      .from("user_prefs")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (prefsError) {
      console.error("Error fetching preferences:", prefsError);

      // If the error is about missing column, try to handle gracefully
      if (
        prefsError.message.includes("column") &&
        prefsError.message.includes("does not exist")
      ) {
        return NextResponse.json({
          topics: [],
          custom_rss_feeds: [],
          schemaError: "Database schema needs to be updated",
        });
      }

      return NextResponse.json(
        { error: "Failed to fetch preferences" },
        { status: 500 }
      );
    }

    if (!prefs) {
      return NextResponse.json(
        { error: "Preferences not found" },
        { status: 404 }
      );
    }

    // Handle both old and new schema
    const topics = prefs.topics || prefs.industry_keywords || [];
    const custom_rss_feeds = prefs.custom_rss_feeds || [];

    return NextResponse.json({
      topics,
      custom_rss_feeds,
    });
  } catch (error) {
    console.error("Error in preferences GET:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = createServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { topics, custom_rss_feeds } = await request.json();

    // Validate input
    if (!Array.isArray(topics) || !Array.isArray(custom_rss_feeds)) {
      return NextResponse.json(
        {
          error: "Invalid input: topics and custom_rss_feeds must be arrays",
        },
        { status: 400 }
      );
    }

    // Update user preferences
    const { data, error } = await supabase
      .from("user_prefs")
      .upsert({
        user_id: user.id,
        topics: topics,
        custom_rss_feeds: custom_rss_feeds,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error("Error updating preferences:", error);
      return NextResponse.json(
        { error: "Failed to update preferences" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      preferences: {
        topics: data.topics || [],
        custom_rss_feeds: data.custom_rss_feeds || [],
      },
    });
  } catch (error) {
    console.error("Error in preferences PUT:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
