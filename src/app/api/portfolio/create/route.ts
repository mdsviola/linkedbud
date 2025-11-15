import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";
import { createPortfolioForOwner } from "@/lib/portfolio";

export const dynamic = 'force-dynamic';

/**
 * POST - Create a portfolio for the current user
 * This is called when a user has Growth plan but no portfolio exists
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

    // Create portfolio for owner
    const portfolio = await createPortfolioForOwner(user.id);

    if (!portfolio) {
      return NextResponse.json(
        { error: "Failed to create portfolio. Please ensure you have an active Growth plan subscription." },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      portfolio: {
        id: portfolio.id,
        owner_id: portfolio.owner_id,
      },
    });
  } catch (error: any) {
    console.error("Error creating portfolio:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create portfolio" },
      { status: 500 }
    );
  }
}

