import { createServerClient } from "@/lib/supabase-server";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const error = requestUrl.searchParams.get("error");
  const errorDescription = requestUrl.searchParams.get("error_description");
  const next = requestUrl.searchParams.get("next") || "/";
  const inviteToken = requestUrl.searchParams.get("invite_token");

  // Handle OAuth errors from provider
  if (error) {
    console.error("OAuth error:", error, errorDescription);
    // Check if it's an account linking issue
    if (error === "email_already_exists" || errorDescription?.includes("email")) {
      return NextResponse.redirect(
        new URL(
          "/auth/signin?error=linkedin_email_exists&message=" +
            encodeURIComponent(
              "An account with this email already exists. Please sign in with your password first, then you can link your LinkedIn account in settings."
            ),
          request.url
        )
      );
    }
    return NextResponse.redirect(
      new URL(
        `/auth/signin?error=oauth_error&message=${encodeURIComponent(errorDescription || error)}`,
        request.url
      )
    );
  }

  if (code) {
    const supabase = createServerClient();
    const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

    if (exchangeError) {
      console.error("Error exchanging code for session:", exchangeError);

      // Check for specific error types
      if (exchangeError.message?.includes("email") || exchangeError.message?.includes("already exists")) {
        return NextResponse.redirect(
          new URL(
            "/auth/signin?error=linkedin_email_exists&message=" +
              encodeURIComponent(
                "An account with this email already exists. Please sign in with your password first, then you can link your LinkedIn account in settings."
              ),
            request.url
          )
        );
      }

      return NextResponse.redirect(
        new URL(
          `/auth/signin?error=oauth_error&message=${encodeURIComponent(exchangeError.message)}`,
          request.url
        )
      );
    }

    // Get the authenticated user
    // Supabase automatically links accounts if the email matches
    // So if a user signed up with email/password and then signs in with LinkedIn using the same email,
    // Supabase will link the LinkedIn identity to the existing account
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      console.error("Error getting user after OAuth:", userError);
      return NextResponse.redirect(
        new URL("/auth/signin?error=oauth_error", request.url)
      );
    }

    // Check if user has completed onboarding
    const { data: prefs } = await supabase
      .from("user_prefs")
      .select("created_at, updated_at")
      .eq("user_id", user.id)
      .single();

    // If there's an invite token, redirect to accept invitation
    if (inviteToken) {
      return NextResponse.redirect(
        new URL(`/invite/accept/${inviteToken}`, request.url)
      );
    }

    // If no prefs, or prefs exist but haven't been updated, redirect to onboarding
    if (!prefs || prefs.created_at === prefs.updated_at) {
      return NextResponse.redirect(new URL("/onboarding", request.url));
    }

    // User has completed onboarding, redirect to dashboard or next URL
    return NextResponse.redirect(new URL(next, request.url));
  }

  // No code provided, redirect to signin
  return NextResponse.redirect(new URL("/auth/signin", request.url));
}

