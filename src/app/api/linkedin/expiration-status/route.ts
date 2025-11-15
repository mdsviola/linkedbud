import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";
import {
  isTokenExpiringSoon,
  getDaysUntilExpiration,
} from "@/lib/linkedin-token-utils";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient();

    // Get the current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get both personal and community tokens
    const { data: tokens, error: tokensError } = await supabase
      .from("linkedin_tokens")
      .select("type, token_expires_at, is_active")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .in("type", ["personal", "community"]);

    if (tokensError || !tokens || tokens.length === 0) {
      return NextResponse.json({
        hasLinkedInAccount: false,
        tokens: [],
        earliestExpiration: null,
      });
    }

    // Find tokens that are expiring soon (within 5 days or already expired)
    const expiringTokens = tokens
      .filter((token) => token.token_expires_at && isTokenExpiringSoon(token.token_expires_at))
      .map((token) => ({
        type: token.type,
        tokenExpiresAt: token.token_expires_at,
        daysUntilExpiration: getDaysUntilExpiration(token.token_expires_at),
      }));

    // Find the earliest expiration date among all tokens
    const allExpirationDates = tokens
      .map((token) => token.token_expires_at)
      .filter((date): date is string => date !== null);

    const earliestExpiration = allExpirationDates.length > 0
      ? allExpirationDates.reduce((earliest, current) => {
          return new Date(current) < new Date(earliest) ? current : earliest;
        })
      : null;

    return NextResponse.json({
      hasLinkedInAccount: true,
      tokens: tokens.map((token) => ({
        type: token.type,
        tokenExpiresAt: token.token_expires_at,
        isActive: token.is_active,
      })),
      expiringTokens,
      earliestExpiration,
      hasExpiringTokens: expiringTokens.length > 0,
    });
  } catch (error) {
    console.error("Error checking LinkedIn token expiration:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
