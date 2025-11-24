import { NextRequest, NextResponse } from "next/server";
import { createServerClient, supabaseAdmin } from "@/lib/supabase-server";
import { getUserPortfolio } from "@/lib/portfolio";

export const dynamic = "force-dynamic";

/**
 * GET - Get seat information for the portfolio
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

    // Get user's portfolio
    const portfolio = await getUserPortfolio(user.id);
    if (!portfolio) {
      return NextResponse.json(
        { error: "You are not a member of any portfolio" },
        { status: 404 }
      );
    }

    // Base seats: 3 (1 owner + 2 collaborators)
    const BASE_SEATS = 3;
    const GROWTH_SEAT_PRICE_ID = process.env.LEMONSQUEEZY_VARIANT_ID_GROWTH_SEAT;

    if (!GROWTH_SEAT_PRICE_ID) {
      return NextResponse.json(
        { error: "Growth seat price ID not configured" },
        { status: 500 }
      );
    }

    // Count accepted collaborators (excluding owner)
    // The owner is also in portfolio_collaborators table, so we need to exclude them
    const { data: collaborators } = await supabaseAdmin
      .from("portfolio_collaborators")
      .select("user_id")
      .eq("portfolio_id", portfolio.id)
      .eq("status", "accepted")
      .neq("user_id", portfolio.owner_id); // Exclude owner from count

    const acceptedCollaborators = collaborators?.length || 0;
    const seatsUsed = 1 + acceptedCollaborators; // Owner (1) + collaborators

    // Count additional seat subscriptions for the portfolio owner
    // Include both active and cancelled subscriptions (cancelled ones are valid until current_period_end)
    // Use admin client to bypass RLS
    const { data: additionalSeatSubscriptions } = await supabaseAdmin
      .from("subscriptions")
      .select("id, status, current_period_end")
      .eq("user_id", portfolio.owner_id)
      .eq("price_id", GROWTH_SEAT_PRICE_ID)
      .in("status", ["active", "canceled"]);

    // Filter to only include valid subscriptions (active or cancelled but not expired)
    // Handle both "canceled" (US spelling) and "cancelled" (UK spelling)
    const validSeatSubscriptions = additionalSeatSubscriptions?.filter((sub) => {
      if (sub.status === "active") return true;
      if ((sub.status === "canceled" || sub.status === "cancelled") && sub.current_period_end) {
        return new Date(sub.current_period_end) > new Date();
      }
      return false;
    }) || [];

    const additionalSeats = validSeatSubscriptions.length;
    const totalSeats = BASE_SEATS + additionalSeats;
    const seatsRemaining = Math.max(0, totalSeats - seatsUsed);

    return NextResponse.json({
      baseSeats: BASE_SEATS,
      additionalSeats,
      totalSeats,
      seatsUsed,
      seatsRemaining,
      canInviteMore: seatsRemaining > 0,
    });
  } catch (error) {
    console.error("Error fetching seat information:", error);
    return NextResponse.json(
      { error: "Failed to fetch seat information" },
      { status: 500 }
    );
  }
}

