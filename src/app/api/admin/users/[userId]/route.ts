import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const supabase = createServerClient();

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user has admin role
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profileError || !profile || profile.role !== "admin") {
      return NextResponse.json({ error: "Not admin" }, { status: 403 });
    }

    const { userId } = params;

    // Get user with their subscription and usage data
    const { data: userData, error: userError } = await supabase
      .from("profiles")
      .select(
        `
        id,
        email,
        role,
        created_at,
        subscriptions (
          id,
          provider,
          status,
          current_period_end,
          external_subscription_id,
          price_id,
          created_at,
          updated_at
        ),
        usage_counters (
          total_generations,
          generation_counts
        )
      `
      )
      .eq("id", userId)
      .single();

    if (userError || !userData) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ user: userData });
  } catch (error) {
    console.error("Error in user GET API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
