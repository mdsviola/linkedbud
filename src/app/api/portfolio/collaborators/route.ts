import { NextRequest, NextResponse } from "next/server";
import { createServerClient, supabaseAdmin } from "@/lib/supabase-server";
import {
  getPortfolioCollaborators,
  removeCollaborator,
  getUserPortfolio,
  isPortfolioOwner,
} from "@/lib/portfolio";

export const dynamic = "force-dynamic";

/**
 * GET - List collaborators for a portfolio
 */
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

    // Get user's portfolio
    const portfolio = await getUserPortfolio(user.id);
    if (!portfolio) {
      return NextResponse.json(
        { error: "You are not a member of any portfolio" },
        { status: 404 }
      );
    }

    // Get collaborators
    const collaborators = await getPortfolioCollaborators(portfolio.id);

    // Enrich with user profile data
    // Use admin client to bypass RLS (profiles are only viewable by owner, but portfolio members need to see each other's basic info)
    const collaboratorIds = collaborators.map((c) => c.user_id);
    const { data: profiles } = await supabaseAdmin
      .from("profiles")
      .select("id, email, first_name, last_name")
      .in("id", collaboratorIds);

    const collaboratorsWithProfiles = collaborators.map((collab) => {
      const profile = profiles?.find((p) => p.id === collab.user_id);
      return {
        ...collab,
        email: profile?.email,
        first_name: profile?.first_name,
        last_name: profile?.last_name,
      };
    });

    return NextResponse.json({ collaborators: collaboratorsWithProfiles });
  } catch (error) {
    console.error("Error fetching collaborators:", error);
    return NextResponse.json(
      { error: "Failed to fetch collaborators" },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Remove a collaborator from portfolio
 */
export async function DELETE(request: NextRequest) {
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
    const collaboratorUserId = searchParams.get("userId");

    if (!collaboratorUserId) {
      return NextResponse.json(
        { error: "Collaborator user ID is required" },
        { status: 400 }
      );
    }

    // Get user's portfolio
    const portfolio = await getUserPortfolio(user.id);
    if (!portfolio) {
      return NextResponse.json(
        { error: "You are not a member of any portfolio" },
        { status: 404 }
      );
    }

    // Verify user is the owner
    const isOwner = await isPortfolioOwner(user.id, portfolio.id);
    if (!isOwner) {
      return NextResponse.json(
        { error: "Only portfolio owner can remove collaborators" },
        { status: 403 }
      );
    }

    // Cannot remove yourself
    if (collaboratorUserId === user.id) {
      return NextResponse.json(
        { error: "Cannot remove portfolio owner" },
        { status: 400 }
      );
    }

    const success = await removeCollaborator(
      portfolio.id,
      collaboratorUserId,
      user.id
    );

    if (!success) {
      return NextResponse.json(
        { error: "Failed to remove collaborator" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error removing collaborator:", error);
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Failed to remove collaborator" },
      { status: 500 }
    );
  }
}

