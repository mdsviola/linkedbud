import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";
import { revokeLinkedInToken } from "@/lib/linkedin";

export const dynamic = 'force-dynamic';

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

    const body = await request.json();
    const { type } = body; // "personal" or "community"

    if (!type || (type !== "personal" && type !== "community")) {
      return NextResponse.json(
        { error: "Invalid token type" },
        { status: 400 }
      );
    }

    // Fetch the access token from database
    const { data: token, error: tokenError } = await supabase
      .from("linkedin_tokens")
      .select("access_token")
      .eq("user_id", user.id)
      .eq("type", type)
      .eq("is_active", true)
      .maybeSingle();

    if (tokenError) {
      console.error("Error fetching token for revocation:", tokenError);
      return NextResponse.json(
        { error: "Failed to fetch token" },
        { status: 500 }
      );
    }

    // If token exists, revoke it with LinkedIn
    if (token && token.access_token) {
      try {
        await revokeLinkedInToken(token.access_token, type);
      } catch (revokeError) {
        // Log but don't fail - token might already be revoked or expired
        console.warn("Failed to revoke LinkedIn token:", revokeError);
        // Continue with deletion even if revocation fails
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("LinkedIn revocation error:", error);
    return NextResponse.json(
      { error: "Failed to revoke LinkedIn token" },
      { status: 500 }
    );
  }
}

