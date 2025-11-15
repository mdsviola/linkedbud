import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const supabase = createServerClient();

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // Find the user by email
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, email, role")
      .eq("email", email)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        {
          error: "User not found with that email",
          details: profileError?.message,
        },
        { status: 404 }
      );
    }

    // Update the profile to set admin role
    const { data: updatedProfile, error: updateError } = await supabase
      .from("profiles")
      .update({ role: "admin" })
      .eq("id", profile.id)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json(
        {
          error: "Failed to update profile",
          details: updateError.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Admin role set successfully",
      profile: updatedProfile,
    });
  } catch (error) {
    console.error("Error in set admin API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

