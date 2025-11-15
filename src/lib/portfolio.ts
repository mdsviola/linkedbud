/**
 * Portfolio management functions
 * Handles portfolio creation, retrieval, and ownership checks
 */

import { createServerClient, supabaseAdmin } from "./supabase-server";
import { getTierFromPriceId } from "./tier-utils";
import { getUserSubscription } from "./auth";

export interface Portfolio {
  id: string;
  owner_id: string;
  created_at: string;
  updated_at: string;
}

export interface PortfolioCollaborator {
  id: number;
  portfolio_id: string;
  user_id: string;
  invited_by: string;
  status: "pending" | "accepted" | "declined";
  invited_at: string;
  accepted_at: string | null;
}

/**
 * Create a portfolio for a user when they upgrade to Growth plan
 *
 * SECURITY: Uses admin client to bypass RLS because:
 * 1. The INSERT policy itself is simple (auth.uid() = owner_id) and wouldn't cause recursion
 * 2. BUT when we do .select() after .insert(), PostgreSQL evaluates the SELECT policy
 * 3. The SELECT policy has circular dependency (queries portfolio_collaborators which queries portfolios)
 * 4. This causes infinite recursion, so we must bypass RLS for the entire operation
 *
 * The caller must verify userId matches the authenticated user before calling this.
 */
export async function createPortfolioForOwner(
  userId: string
): Promise<Portfolio | null> {
  // Use admin client to bypass RLS - needed because .select() after .insert() triggers SELECT policy
  const adminSupabase = supabaseAdmin;

  // Check if portfolio already exists (uses admin client to avoid SELECT policy recursion)
  const existing = await getUserPortfolio(userId);
  if (existing) {
    return existing;
  }

  // Verify user has Growth tier
  const subscription = await getUserSubscription(userId);
  if (!subscription) {
    throw new Error(
      "User must have an active subscription to create a portfolio"
    );
  }

  const tier = getTierFromPriceId(subscription.price_id);
  if (tier !== "GROWTH") {
    throw new Error("Portfolio creation requires Growth plan");
  }

  const { data: portfolio, error } = await adminSupabase
    .from("portfolios")
    .insert({
      owner_id: userId,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating portfolio:", error);
    return null;
  }

  // Update user's profile using admin client (to avoid RLS recursion)
  await adminSupabase
    .from("profiles")
    .update({ portfolio_id: portfolio.id })
    .eq("id", userId);

  // Update user's posts to link to portfolio using admin client
  await adminSupabase
    .from("posts")
    .update({ portfolio_id: portfolio.id })
    .eq("user_id", userId);

  // Set membership_type to 'membership' in subscription using admin client (main subscription, not addon)
  await adminSupabase
    .from("subscriptions")
    .update({ membership_type: "membership" })
    .eq("user_id", userId)
    .eq("status", "active")
    .neq("membership_type", "addon"); // Don't update addons

  // Add owner to portfolio_collaborators table for consistency
  // This allows the owner to appear in collaborator lists and simplifies queries
  // Check if owner already exists first (in case portfolio was created before this change)
  const { data: existingOwner } = await adminSupabase
    .from("portfolio_collaborators")
    .select("id")
    .eq("portfolio_id", portfolio.id)
    .eq("user_id", userId)
    .maybeSingle();

  if (!existingOwner) {
    const { error: collabError } = await adminSupabase
      .from("portfolio_collaborators")
      .insert({
        portfolio_id: portfolio.id,
        user_id: userId,
        invited_by: userId, // Owner invites themselves
        status: "accepted",
        accepted_at: new Date().toISOString(),
      });

    if (collabError) {
      // Log error but don't fail portfolio creation if this fails
      console.error(
        "Error adding owner to portfolio_collaborators:",
        collabError
      );
    }
  }

  return portfolio;
}

/**
 * Get user's portfolio (as owner or collaborator)
 *
 * SECURITY NOTE: This function uses admin client to bypass RLS.
 * It filters by userId parameter, so it only returns portfolios
 * for that specific user. The caller must ensure userId matches
 * the authenticated user to prevent unauthorized access.
 */
export async function getUserPortfolio(
  userId: string
): Promise<Portfolio | null> {
  // Use admin client to bypass RLS and ensure we can find the portfolio
  // SECURITY: We filter by userId, but caller must verify userId matches authenticated user
  const supabase = supabaseAdmin;

  // First check if user is an owner
  const { data: ownedPortfolio, error: ownerError } = await supabase
    .from("portfolios")
    .select("*")
    .eq("owner_id", userId)
    .single();

  if (ownerError && ownerError.code !== "PGRST116") {
    // PGRST116 is "not found" which is expected if user doesn't own a portfolio
    console.error("Error checking portfolio ownership:", ownerError);
  }

  if (ownedPortfolio) {
    return ownedPortfolio;
  }

  // Check if user is a collaborator
  const { data: collaborator, error: collabError } = await supabase
    .from("portfolio_collaborators")
    .select("portfolio_id")
    .eq("user_id", userId)
    .eq("status", "accepted")
    .single();

  if (collabError && collabError.code !== "PGRST116") {
    // PGRST116 is "not found" which is expected if user isn't a collaborator
    console.error("Error checking portfolio collaboration:", collabError);
  }

  if (collaborator) {
    const { data: portfolio, error: portfolioError } = await supabase
      .from("portfolios")
      .select("*")
      .eq("id", collaborator.portfolio_id)
      .single();

    if (portfolioError) {
      console.error("Error fetching collaborator portfolio:", portfolioError);
      return null;
    }

    return portfolio;
  }

  return null;
}

/**
 * Check if user is the owner of a portfolio
 *
 * SECURITY NOTE: This function uses admin client to bypass RLS.
 * It verifies ownership by checking both userId and portfolioId.
 * The caller should verify userId matches the authenticated user.
 */
export async function isPortfolioOwner(
  userId: string,
  portfolioId: string
): Promise<boolean> {
  // Use admin client to bypass RLS and ensure accurate ownership check
  // SECURITY: This function itself is a security check, but caller should verify userId
  const supabase = supabaseAdmin;

  const { data, error } = await supabase
    .from("portfolios")
    .select("owner_id")
    .eq("id", portfolioId)
    .eq("owner_id", userId)
    .single();

  if (error && error.code !== "PGRST116") {
    // PGRST116 is "not found" which means user is not the owner
    console.error("Error checking portfolio ownership:", error);
  }

  return !!data;
}

/**
 * Get all accepted collaborators for a portfolio
 *
 * SECURITY NOTE: Uses admin client to bypass RLS recursion in portfolio_collaborators SELECT policy
 */
export async function getPortfolioCollaborators(
  portfolioId: string
): Promise<PortfolioCollaborator[]> {
  // Use admin client to bypass RLS - portfolio_collaborators SELECT policy has circular dependency
  const supabase = supabaseAdmin;

  const { data, error } = await supabase
    .from("portfolio_collaborators")
    .select("*")
    .eq("portfolio_id", portfolioId)
    .eq("status", "accepted")
    .order("invited_at", { ascending: false });

  if (error) {
    console.error("Error fetching collaborators:", {
      error,
      code: error.code,
      message: error.message,
      portfolio_id: portfolioId,
    });
    return [];
  }

  return data || [];
}

/**
 * Get portfolio owner
 */
export async function getPortfolioOwner(
  portfolioId: string
): Promise<string | null> {
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from("portfolios")
    .select("owner_id")
    .eq("id", portfolioId)
    .single();

  if (error || !data) {
    return null;
  }

  return data.owner_id;
}

/**
 * Check if user is a member of a portfolio (owner or collaborator)
 *
 * SECURITY NOTE: Uses admin client to bypass RLS recursion in portfolio_collaborators SELECT policy
 */
export async function isPortfolioMember(
  userId: string,
  portfolioId: string
): Promise<boolean> {
  const isOwner = await isPortfolioOwner(userId, portfolioId);
  if (isOwner) {
    return true;
  }

  // Use admin client to bypass RLS - portfolio_collaborators SELECT policy has circular dependency
  const supabase = supabaseAdmin;
  const { data } = await supabase
    .from("portfolio_collaborators")
    .select("id")
    .eq("portfolio_id", portfolioId)
    .eq("user_id", userId)
    .eq("status", "accepted")
    .single();

  return !!data;
}

/**
 * Remove a collaborator from a portfolio
 *
 * SECURITY NOTE: Uses admin client to bypass RLS because:
 * 1. The DELETE policy on portfolio_collaborators has circular dependency
 * 2. We need to update profiles and posts which may also have RLS restrictions
 * 3. The caller (API route) verifies ownership before calling this function
 */
export async function removeCollaborator(
  portfolioId: string,
  collaboratorUserId: string,
  ownerUserId: string
): Promise<boolean> {
  // Verify the requester is the owner
  const isOwner = await isPortfolioOwner(ownerUserId, portfolioId);
  if (!isOwner) {
    throw new Error("Only portfolio owner can remove collaborators");
  }

  // Use admin client to bypass RLS (prevents recursion in portfolio_collaborators DELETE policy)
  const supabase = supabaseAdmin;

  // Remove collaborator
  const { error: removeError } = await supabase
    .from("portfolio_collaborators")
    .delete()
    .eq("portfolio_id", portfolioId)
    .eq("user_id", collaboratorUserId);

  if (removeError) {
    console.error("Error removing collaborator:", removeError);
    return false;
  }

  // Update user's profile to remove portfolio_id
  await supabase
    .from("profiles")
    .update({ portfolio_id: null })
    .eq("id", collaboratorUserId);

  // Remove portfolio_id from user's posts
  await supabase
    .from("posts")
    .update({ portfolio_id: null })
    .eq("user_id", collaboratorUserId);

  // Remove growth_member subscription
  await supabase
    .from("subscriptions")
    .delete()
    .eq("user_id", collaboratorUserId)
    .eq("membership_type", "growth_member");

  return true;
}
