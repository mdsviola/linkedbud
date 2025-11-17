import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

/**
 * Server-side API route to initiate LinkedIn OAuth
 * Uses signInWithOAuth method which works correctly with Supabase
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient();
    const { searchParams } = new URL(request.url);

    // Get redirect URL from query params or use default
    const redirectTo =
      searchParams.get("redirect_to") ||
      `${
        process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
      }/auth/callback`;
    const inviteToken = searchParams.get("invite_token");

    // Build final redirect URL with invite token if present
    const finalRedirectUrl = new URL(redirectTo);
    if (inviteToken) {
      finalRedirectUrl.searchParams.set("invite_token", inviteToken);
    }

    // Use signInWithOAuth method to generate the OAuth URL
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "linkedin_oidc",
      options: {
        scopes: "openid profile email",
        redirectTo: finalRedirectUrl.toString(),
      },
    });

    if (error) {
      console.error("LinkedIn OAuth error:", error);
      return NextResponse.json(
        { error: error.message, details: error },
        { status: 400 }
      );
    }

    if (!data?.url) {
      return NextResponse.json(
        { error: "No OAuth URL generated" },
        { status: 500 }
      );
    }

    // Return the OAuth URL as JSON so client can redirect
    // This avoids potential issues with server-side redirects
    return NextResponse.json({
      url: data.url,
      success: true,
    });
  } catch (err: any) {
    console.error("LinkedIn OAuth exception:", err);
    return NextResponse.json(
      { error: err.message || "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
