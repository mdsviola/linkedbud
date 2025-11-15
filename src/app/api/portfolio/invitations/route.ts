import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";
import { createInvitation, getPendingInvitations } from "@/lib/portfolio-invitations";
import { getUserPortfolio, isPortfolioOwner } from "@/lib/portfolio";
import { getTierFromPriceId } from "@/lib/tier-utils";
import { getUserSubscription } from "@/lib/auth";

export const dynamic = "force-dynamic";

/**
 * GET - List pending invitations for a portfolio
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

    // Verify user is the owner
    const isOwner = await isPortfolioOwner(user.id, portfolio.id);
    if (!isOwner) {
      return NextResponse.json(
        { error: "Only portfolio owner can view invitations" },
        { status: 403 }
      );
    }

    const invitations = await getPendingInvitations(portfolio.id);

    return NextResponse.json({ invitations });
  } catch (error) {
    console.error("Error fetching invitations:", error);
    return NextResponse.json(
      { error: "Failed to fetch invitations" },
      { status: 500 }
    );
  }
}

/**
 * POST - Create a new invitation
 */
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

    // Verify user has Growth plan
    const subscription = await getUserSubscription(user.id);
    if (!subscription) {
      return NextResponse.json(
        { error: "Growth plan required for collaboration" },
        { status: 403 }
      );
    }

    const tier = getTierFromPriceId(subscription.price_id);
    if (tier !== "GROWTH") {
      return NextResponse.json(
        { error: "Growth plan required for collaboration" },
        { status: 403 }
      );
    }

    // Get user's portfolio
    const portfolio = await getUserPortfolio(user.id);
    if (!portfolio) {
      return NextResponse.json(
        { error: "You must be a portfolio owner to invite collaborators" },
        { status: 404 }
      );
    }

    // Verify user is the owner
    const isOwner = await isPortfolioOwner(user.id, portfolio.id);
    if (!isOwner) {
      return NextResponse.json(
        { error: "Only portfolio owner can invite collaborators" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { email } = body;

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    const invitation = await createInvitation(portfolio.id, email, user.id);

    if (!invitation) {
      return NextResponse.json(
        { error: "Failed to create invitation" },
        { status: 500 }
      );
    }

    return NextResponse.json({ invitation });
  } catch (error) {
    console.error("Error creating invitation:", error);
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Failed to create invitation" },
      { status: 500 }
    );
  }
}

