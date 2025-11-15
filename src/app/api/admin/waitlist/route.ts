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
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = (page - 1) * limit;

    // Get waitlist entries ordered by created_at (oldest first to show position correctly)
    const { data: waitlistEntries, error: waitlistError } = await supabase
      .from("waitlist")
      .select("id, email, created_at, notified_at")
      .order("created_at", { ascending: true })
      .range(offset, offset + limit - 1);

    if (waitlistError) {
      console.error("Error fetching waitlist:", waitlistError);
      return NextResponse.json(
        { error: "Failed to fetch waitlist" },
        { status: 500 }
      );
    }

    // Get total count for pagination
    const { count, error: countError } = await supabase
      .from("waitlist")
      .select("*", { count: "exact", head: true });

    if (countError) {
      console.error("Error fetching waitlist count:", countError);
      return NextResponse.json(
        { error: "Failed to fetch waitlist count" },
        { status: 500 }
      );
    }

    // Calculate position for each entry
    // Position is based on the order in the full list (1-indexed)
    const entriesWithPosition = (waitlistEntries || []).map((entry, index) => ({
      ...entry,
      position: offset + index + 1,
    }));

    return NextResponse.json({
      entries: entriesWithPosition,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    console.error("Error in waitlist API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

