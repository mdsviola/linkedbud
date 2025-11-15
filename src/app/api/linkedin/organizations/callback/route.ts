import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";
import { exchangeCodeForCommunityToken, LinkedInAPI } from "@/lib/linkedin";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.redirect(new URL("/auth/signin", request.url));
    }

    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const error = searchParams.get("error");

    if (error) {
      console.error("LinkedIn Community OAuth error:", error);
      return NextResponse.redirect(
        new URL("/settings?linkedin_error=1#integrations", request.url)
      );
    }

    if (!code) {
      return NextResponse.redirect(
        new URL("/settings?linkedin_error=2#integrations", request.url)
      );
    }

    // Exchange code for access token (Community app)
    const tokenData = await exchangeCodeForCommunityToken(code);

    // Calculate token expiration
    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + tokenData.expires_in);

    // Fetch accessible organizations with the community token
    let organizations: { id: string; name: string; vanityName?: string }[] = [];
    try {
      const linkedinAPI = new LinkedInAPI(tokenData.access_token);
      organizations = await linkedinAPI.getAccessibleOrganizations();
    } catch (orgError) {
      console.error("Community: Failed to fetch organizations:", orgError);
    }

    // Store community token in linkedin_tokens table
    const tokenDataForDB = {
      user_id: user.id,
      type: "community" as const,
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      token_expires_at: expiresAt.toISOString(),
      is_active: true,
      updated_at: new Date().toISOString(),
    };

    // Upsert community token (replace existing community token)
    const { error: tokenError } = await supabase
      .from("linkedin_tokens")
      .upsert(tokenDataForDB, {
        onConflict: "user_id,type",
        ignoreDuplicates: false,
      });

    if (tokenError) {
      console.error("Community: Error storing LinkedIn token:", tokenError);
      return NextResponse.redirect(
        new URL("/settings?linkedin_error=3#integrations", request.url)
      );
    }

    if (organizations.length === 0) {
      // Still redirect with success; user may not have admin orgs
      return NextResponse.redirect(
        new URL("/settings?linkedin_success=1#integrations", request.url)
      );
    }

    // Store organizations without token fields (metadata only)
    const orgRows = organizations.map((org) => ({
      user_id: user.id,
      linkedin_org_id: org.id,
      org_name: org.name,
      org_vanity_name: org.vanityName,
      updated_at: new Date().toISOString(),
    }));

    const { error: upsertError } = await supabase
      .from("linkedin_organizations")
      .upsert(orgRows, {
        onConflict: "user_id,linkedin_org_id",
        ignoreDuplicates: false,
      });

    if (upsertError) {
      console.error("Community: Error upserting organizations:", upsertError);
    }

    return NextResponse.redirect(
      new URL("/settings?linkedin_success=1#integrations", request.url)
    );
  } catch (error) {
    console.error("LinkedIn organizations callback error:", error);
    return NextResponse.redirect(
      new URL("/settings?linkedin_error=4#integrations", request.url)
    );
  }
}
