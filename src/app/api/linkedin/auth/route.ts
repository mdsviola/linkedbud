import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";
import { getLinkedInAuthURL } from "@/lib/linkedin";

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

    const { searchParams } = new URL(request.url);
    const onboarding = searchParams.get("onboarding");
    const inviteToken = searchParams.get("invite_token");

    // Build state parameter with onboarding info
    const stateParams: string[] = ["linkedin_auth"];
    if (onboarding === "true") {
      stateParams.push("onboarding=true");
    }
    if (inviteToken) {
      stateParams.push(`invite_token=${inviteToken}`);
    }
    const state = stateParams.join("|");

    const baseAuthURL = getLinkedInAuthURL();
    // Replace the state parameter in the URL
    const authURL = baseAuthURL.replace(/state=[^&]+/, `state=${encodeURIComponent(state)}`);

    return NextResponse.redirect(authURL);
  } catch (error) {
    console.error("LinkedIn auth error:", error);
    return NextResponse.json(
      { error: "Failed to initiate LinkedIn authentication" },
      { status: 500 }
    );
  }
}
