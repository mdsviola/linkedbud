import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
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

    // Get pagination parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = (page - 1) * limit;

    // Get users with their subscription and usage data (excluding admin users)
    const { data: users, error: usersError } = await supabase
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
      .neq("role", "admin")
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (usersError) {
      console.error("Error fetching users:", usersError);
      return NextResponse.json(
        { error: "Failed to fetch users" },
        { status: 500 }
      );
    }

    // Get total count for pagination (excluding admin users)
    const { count, error: countError } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .neq("role", "admin");

    if (countError) {
      console.error("Error fetching user count:", countError);
      return NextResponse.json(
        { error: "Failed to fetch user count" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      users: users || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    console.error("Error in users API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
