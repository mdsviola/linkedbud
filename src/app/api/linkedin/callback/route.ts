import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";
import {
  exchangeCodeForToken,
  LinkedInAPI,
  LinkedInProfile,
} from "@/lib/linkedin";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const state = searchParams.get("state") || "";

  // Parse state to check if coming from onboarding
  const isOnboarding = state.includes("onboarding=true");
  const inviteTokenMatch = state.match(/invite_token=([^|]+)/);
  const inviteToken = inviteTokenMatch ? inviteTokenMatch[1] : null;

  // Build redirect URL based on context
  const getRedirectUrl = (success: boolean, errorCode?: string) => {
    if (isOnboarding) {
      const baseUrl = "/onboarding";
      const params = new URLSearchParams();
      if (inviteToken) {
        params.set("invite_token", inviteToken);
      }
      if (success) {
        params.set("linkedin_success", "1");
      } else if (errorCode) {
        params.set("linkedin_error", errorCode);
      }
      const queryString = params.toString();
      return `${baseUrl}${queryString ? `?${queryString}` : ""}`;
    } else {
      return `/settings?${success ? "linkedin_success=1" : `linkedin_error=${errorCode || "1"}`}#integrations`;
    }
  };

  try {
    const supabase = createServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.redirect(new URL("/auth/signin", request.url));
    }

    const code = searchParams.get("code");
    const error = searchParams.get("error");

    if (error) {
      console.error("LinkedIn OAuth error:", error);
      return NextResponse.redirect(
        new URL(getRedirectUrl(false, "1"), request.url)
      );
    }

    if (!code) {
      return NextResponse.redirect(
        new URL(getRedirectUrl(false, "2"), request.url)
      );
    }

    // Exchange code for access token
    const tokenData = await exchangeCodeForToken(code);

    // Note: LinkedIn doesn't provide refresh tokens by default
    // Only select partners get refresh tokens

    // Calculate token expiration
    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + tokenData.expires_in);

    // Fetch real LinkedIn profile data using the access token
    let profile: LinkedInProfile | null = null;
    let profileData: any = null;

    try {
      const linkedinAPI = new LinkedInAPI(tokenData.access_token);

      // First validate that the token has the right permissions
      const isValidToken = await linkedinAPI.validateToken();
      if (!isValidToken) {
        console.warn(
          "LinkedIn token validation failed, skipping profile fetch"
        );
      } else {
        profile = await linkedinAPI.getProfile();
        profileData = {
          firstName: profile.firstName,
          lastName: profile.lastName,
          profilePicture: profile.profilePicture,
        };
      }
    } catch (profileError) {
      console.error(
        "Failed to fetch LinkedIn profile, storing NULL profile data:",
        profileError
      );
      // Profile data will be NULL if we can't fetch it
    }

    // Store token in linkedin_tokens table
    const tokenDataForDB = {
      user_id: user.id,
      type: "personal" as const,
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      token_expires_at: expiresAt.toISOString(),
      linkedin_user_id: profile?.id || null,
      profile_data: profileData,
      is_active: true,
      updated_at: new Date().toISOString(),
    };

    // Upsert token (replace existing personal token)
    const { error: tokenError } = await supabase
      .from("linkedin_tokens")
      .upsert(tokenDataForDB, {
        onConflict: "user_id,type",
        ignoreDuplicates: false,
      });

    if (tokenError) {
      console.error("Error storing LinkedIn token:", tokenError);
      return NextResponse.redirect(
        new URL(getRedirectUrl(false, "3"), request.url)
      );
    }

    // Store minimal account info in linkedin_accounts (without tokens)
    // Only insert/update if we have the required fields (linkedin_user_id and access_token)
    // Note: linkedin_accounts table requires access_token and linkedin_user_id to be NOT NULL
    if (profile?.id && tokenData.access_token) {
      const accountData = {
        user_id: user.id,
        linkedin_user_id: profile.id,
        access_token: tokenData.access_token, // Required by schema, but we store tokens in linkedin_tokens
        profile_data: profileData,
        account_type: "personal" as const,
        token_expires_at: expiresAt.toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Check if user already has a LinkedIn account
      const { data: existingAccount, error: checkError } = await supabase
        .from("linkedin_accounts")
        .select("id")
        .eq("user_id", user.id)
        .eq("linkedin_user_id", profile.id)
        .maybeSingle();

      let dbError: any;

      if (existingAccount && !checkError) {
        // Update existing account
        const { error: updateError } = await supabase
          .from("linkedin_accounts")
          .update(accountData)
          .eq("user_id", user.id)
          .eq("linkedin_user_id", profile.id);

        if (updateError) {
          dbError = updateError;
        }
      } else {
        // Insert new account
        const { error: insertError } = await supabase
          .from("linkedin_accounts")
          .insert(accountData);

        if (insertError) {
          dbError = insertError;
        }
      }

      if (dbError) {
        console.error("Error storing LinkedIn account:", dbError);
        // Don't fail the entire flow if linkedin_accounts insert fails
        // The important data (tokens) is already stored in linkedin_tokens
      }
    }

    // Personal app no longer writes organizations; use Community flow instead

    return NextResponse.redirect(
      new URL(getRedirectUrl(true), request.url)
    );
  } catch (error) {
    console.error("LinkedIn callback error:", error);
    return NextResponse.redirect(
      new URL(getRedirectUrl(false, "4"), request.url)
    );
  }
}
