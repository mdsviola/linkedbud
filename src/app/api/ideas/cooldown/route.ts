import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

/**
 * Check cooldown status for ideas generation based on expires_at from content_ideas table
 */
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

    // Check cooldown from content_ideas table
    const { data: contentIdeas, error } = await supabase
      .from("content_ideas")
      .select("expires_at")
      .eq("user_id", user.id)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        // Not found - that's okay, means no ideas exist yet, user can generate
        return NextResponse.json({
          canGenerate: true,
          remainingMs: 0,
          remainingMinutes: 0,
        });
      }
      console.error("Error checking cooldown:", error);
      return NextResponse.json({
        canGenerate: true,
        remainingMs: 0,
        remainingMinutes: 0,
      });
    }

    if (!contentIdeas || !contentIdeas.expires_at) {
      // No expiration date, user can generate
      return NextResponse.json({
        canGenerate: true,
        remainingMs: 0,
        remainingMinutes: 0,
      });
    }

    const expiresAt = new Date(contentIdeas.expires_at).getTime();
    const now = Date.now();
    const remaining = expiresAt - now;

    if (remaining > 0) {
      const remainingMinutes = Math.ceil(remaining / (60 * 1000));
      return NextResponse.json({
        canGenerate: false,
        remainingMs: remaining,
        remainingMinutes,
      });
    }

    return NextResponse.json({
      canGenerate: true,
      remainingMs: 0,
      remainingMinutes: 0,
    });
  } catch (error) {
    console.error("Error checking cooldown:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
