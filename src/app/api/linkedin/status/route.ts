import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";
import { getLinkedInToken } from "@/lib/linkedin";

export const dynamic = 'force-dynamic';

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

    // Get user's LinkedIn personal token status with automatic token refresh
    const personalToken = await getLinkedInToken(user.id, "personal");

    if (!personalToken) {
      return NextResponse.json({
        connected: false,
        profile: null,
      });
    }

    return NextResponse.json({
      connected: true,
      profile: personalToken.profile_data,
      expiresAt: personalToken.token_expires_at,
    });
  } catch (error) {
    console.error("LinkedIn status error:", error);
    return NextResponse.json(
      { error: "Failed to check LinkedIn status" },
      { status: 500 }
    );
  }
}
