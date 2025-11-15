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

    const authURL = getLinkedInAuthURL();
    return NextResponse.redirect(authURL);
  } catch (error) {
    console.error("LinkedIn auth error:", error);
    return NextResponse.json(
      { error: "Failed to initiate LinkedIn authentication" },
      { status: 500 }
    );
  }
}
