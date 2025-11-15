import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";
import { getTierFromPriceId } from "@/lib/tier-utils";

export const dynamic = "force-dynamic";

/**
 * GET - Check tier from price_id
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

    const { searchParams } = new URL(request.url);
    const priceId = searchParams.get("price_id");

    if (!priceId) {
      return NextResponse.json(
        { error: "price_id is required" },
        { status: 400 }
      );
    }

    const tier = getTierFromPriceId(priceId);

    return NextResponse.json({ tier });
  } catch (error) {
    console.error("Error checking tier:", error);
    return NextResponse.json(
      { error: "Failed to check tier" },
      { status: 500 }
    );
  }
}

