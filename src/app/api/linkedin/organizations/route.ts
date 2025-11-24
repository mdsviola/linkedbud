import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";

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

    // Get user's accessible organizations (metadata only, no token fields)
    const { data: organizations, error } = await supabase
      .from("linkedin_organizations")
      .select("*")
      .eq("user_id", user.id)
      .order("org_name", { ascending: true });

    if (error) {
      console.error("Error fetching organizations:", error);
      // Check if it's a table doesn't exist error
      if (
        error.message.includes("relation") &&
        error.message.includes("does not exist")
      ) {
        console.log(
          "linkedin_organizations table doesn't exist yet - migration needs to be applied"
        );
        return NextResponse.json({
          organizations: [],
        });
      }
      return NextResponse.json(
        { error: "Failed to fetch organizations" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      organizations: organizations || [],
    });
  } catch (error) {
    console.error("Error fetching LinkedIn organizations:", error);
    return NextResponse.json(
      { error: "Failed to fetch organizations" },
      { status: 500 }
    );
  }
}
