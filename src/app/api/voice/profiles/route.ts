import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";
import { getVoiceProfiles } from "@/lib/voice-utils";

export const dynamic = "force-dynamic";

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

    // Get all voice profiles for the user
    const voiceProfiles = await getVoiceProfiles(user.id);

    return NextResponse.json({
      voice_profiles: voiceProfiles,
    });
  } catch (error) {
    console.error("Error fetching voice profiles:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

