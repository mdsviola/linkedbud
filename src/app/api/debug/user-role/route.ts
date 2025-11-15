import { NextResponse } from "next/server";
import { createAPIClientWithCookies } from "@/lib/supabase-server";

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const supabase = createAPIClientWithCookies(request);

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return NextResponse.json(
        {
          error: "Not authenticated",
          message: "Debug API is working but user is not authenticated",
          timestamp: new Date().toISOString(),
          env: {
            hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
            hasSupabaseKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
            hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
          },
          authError: error?.message,
        },
        { status: 401 }
      );
    }

    // Get user profile with role
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, email, role, created_at")
      .eq("id", user.id)
      .single();

    if (profileError) {
      return NextResponse.json(
        {
          error: "Profile not found",
          message: "User is authenticated but profile not found",
          details: profileError.message,
          user: {
            id: user.id,
            email: user.email,
          },
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
      },
      profile: {
        id: profile.id,
        email: profile.email,
        role: profile.role,
        created_at: profile.created_at,
      },
      isAdmin: profile.role === "admin",
      message: "Authentication successful",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error in debug user role API:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        message: "Debug API encountered an error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
