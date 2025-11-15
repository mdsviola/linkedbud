/**
 * Portfolio invitation management
 * Handles creating, accepting, and managing portfolio invitations
 */

import { createServerClient, supabaseAdmin } from "./supabase-server";
import { randomBytes } from "crypto";
import {
  getUserPortfolio,
  isPortfolioOwner,
  getPortfolioOwner,
} from "./portfolio";
import { getTierFromPriceId } from "./tier-utils";
import { getUserSubscription, getUserProfile } from "./auth";
import { sendPortfolioInvitationEmail } from "./email";

export interface PortfolioInvitation {
  id: number;
  portfolio_id: string;
  email: string;
  token: string;
  invited_by: string;
  status: "pending" | "accepted" | "expired" | "declined";
  expires_at: string;
  created_at: string;
}

const INVITATION_EXPIRY_DAYS = 7;

/**
 * Generate a secure invitation token
 */
function generateInvitationToken(): string {
  return randomBytes(32).toString("hex");
}

/**
 * Create an invitation to join a portfolio
 */
export async function createInvitation(
  portfolioId: string,
  email: string,
  invitedBy: string
): Promise<PortfolioInvitation | null> {
  // Verify the inviter is the portfolio owner
  const isOwner = await isPortfolioOwner(invitedBy, portfolioId);
  if (!isOwner) {
    throw new Error("Only portfolio owner can create invitations");
  }

  // Verify owner has Growth plan
  const subscription = await getUserSubscription(invitedBy);
  if (!subscription) {
    throw new Error("Portfolio owner must have an active subscription");
  }

  const tier = getTierFromPriceId(subscription.price_id);
  if (tier !== "GROWTH") {
    throw new Error("Portfolio invitations require Growth plan");
  }

  // Note: We don't need to check if inviter is a collaborator - they're the owner

  // Use admin client to bypass RLS recursion in portfolio_invitations and portfolio_collaborators
  const supabase = supabaseAdmin;

  // Check if there's already a pending invitation for this email
  const { data: existingInvitation } = await supabase
    .from("portfolio_invitations")
    .select("id")
    .eq("portfolio_id", portfolioId)
    .eq("email", email.toLowerCase())
    .eq("status", "pending")
    .gt("expires_at", new Date().toISOString())
    .single();

  if (existingInvitation) {
    throw new Error("An invitation already exists for this email");
  }

  // Check if user already exists and is already a collaborator
  const { data: existingUser } = await supabase
    .from("profiles")
    .select("id")
    .eq("email", email.toLowerCase())
    .single();

  if (existingUser) {
    const { data: existingCollab } = await supabase
      .from("portfolio_collaborators")
      .select("id")
      .eq("portfolio_id", portfolioId)
      .eq("user_id", existingUser.id)
      .eq("status", "accepted")
      .single();

    if (existingCollab) {
      throw new Error("User is already a collaborator");
    }
  }

  // Create invitation
  const token = generateInvitationToken();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + INVITATION_EXPIRY_DAYS);

  const { data: invitation, error } = await supabase
    .from("portfolio_invitations")
    .insert({
      portfolio_id: portfolioId,
      email: email.toLowerCase(),
      token,
      invited_by: invitedBy,
      status: "pending",
      expires_at: expiresAt.toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating invitation:", error);
    return null;
  }

  // Send invitation email
  try {
    const ownerProfile = await getUserProfile(invitedBy);
    const ownerName =
      ownerProfile?.first_name && ownerProfile?.last_name
        ? `${ownerProfile.first_name} ${ownerProfile.last_name}`
        : ownerProfile?.email || "A team member";

    await sendPortfolioInvitationEmail(email.toLowerCase(), token, ownerName);
  } catch (emailError) {
    console.error("Error sending invitation email:", emailError);
    // Don't fail the invitation creation if email fails
  }

  return invitation;
}

/**
 * Get invitation by token
 * Uses admin client to bypass RLS recursion in portfolio_invitations SELECT policy
 */
export async function getInvitationByToken(
  token: string
): Promise<PortfolioInvitation | null> {
  const supabase = supabaseAdmin;

  const { data: invitation, error } = await supabase
    .from("portfolio_invitations")
    .select("*")
    .eq("token", token)
    .single();

  if (error || !invitation) {
    return null;
  }

  // Check if invitation is expired
  if (new Date(invitation.expires_at) < new Date()) {
    // Mark as expired
    await supabase
      .from("portfolio_invitations")
      .update({ status: "expired" })
      .eq("id", invitation.id);

    return null;
  }

  // Check if already accepted
  if (invitation.status !== "pending") {
    return null;
  }

  return invitation;
}

/**
 * Accept an invitation (for existing users)
 * Uses admin client to bypass RLS recursion in portfolio_invitations and portfolio_collaborators
 */
export async function acceptInvitation(
  token: string,
  userId: string
): Promise<boolean> {
  const supabase = supabaseAdmin;

  // Get invitation
  const invitation = await getInvitationByToken(token);
  if (!invitation) {
    throw new Error("Invalid or expired invitation");
  }

  // Verify email matches user's email
  const { data: profile } = await supabase
    .from("profiles")
    .select("email")
    .eq("id", userId)
    .single();

  if (!profile || profile.email?.toLowerCase() !== invitation.email) {
    throw new Error("Invitation email does not match your account");
  }

  // Check if user is already in a portfolio
  const existingPortfolio = await getUserPortfolio(userId);
  if (existingPortfolio) {
    throw new Error("You are already a member of a portfolio");
  }

  // Check if user is already a collaborator anywhere (due to UNIQUE constraint on user_id)
  // The user_id column has a UNIQUE constraint, so a user can only be in one collaborator record
  const { data: existingCollabAnywhere, error: existingCollabError } =
    await supabase
      .from("portfolio_collaborators")
      .select("id, portfolio_id, status")
      .eq("user_id", userId)
      .maybeSingle();

  if (existingCollabError && existingCollabError.code !== "PGRST116") {
    // PGRST116 is "not found" which is expected if user isn't a collaborator
    console.error("Error checking existing collaborator:", existingCollabError);
    throw new Error("Failed to check existing collaboration status");
  }

  if (existingCollabAnywhere) {
    if (existingCollabAnywhere.portfolio_id === invitation.portfolio_id) {
      throw new Error("You are already a collaborator in this portfolio");
    } else {
      throw new Error(
        "You are already a collaborator in another portfolio. You can only be a collaborator in one portfolio at a time."
      );
    }
  }

  // Create collaborator record
  const { data: collaboratorData, error: collabError } = await supabase
    .from("portfolio_collaborators")
    .insert({
      portfolio_id: invitation.portfolio_id,
      user_id: userId,
      invited_by: invitation.invited_by,
      status: "accepted",
      accepted_at: new Date().toISOString(),
    })
    .select();

  if (collabError) {
    console.error("Error creating collaborator:", {
      error: collabError,
      code: collabError.code,
      message: collabError.message,
      details: collabError.details,
      hint: collabError.hint,
      portfolio_id: invitation.portfolio_id,
      user_id: userId,
    });
    return false;
  }

  if (!collaboratorData || collaboratorData.length === 0) {
    console.error("Collaborator record was not created - no data returned");
    return false;
  }

  // Update invitation status
  const { error: invitationUpdateError } = await supabase
    .from("portfolio_invitations")
    .update({ status: "accepted" })
    .eq("id", invitation.id);

  if (invitationUpdateError) {
    console.error("Error updating invitation status:", invitationUpdateError);
    // Don't return false here - collaborator was already created
  }

  // Update user's profile
  const { error: profileUpdateError } = await supabase
    .from("profiles")
    .update({ portfolio_id: invitation.portfolio_id })
    .eq("id", userId);

  if (profileUpdateError) {
    console.error("Error updating user profile:", profileUpdateError);
    // Don't return false here - collaborator was already created
  }

  // Merge user's posts into portfolio
  try {
    await mergeUserPostsIntoPortfolio(userId, invitation.portfolio_id);
  } catch (mergeError) {
    console.error("Error merging user posts into portfolio:", mergeError);
    // Don't return false here - collaborator was already created
  }

  // Create growth_member subscription for collaborator
  // Get the portfolio owner's main membership subscription
  const { data: ownerSubscription } = await supabase
    .from("subscriptions")
    .select("price_id, external_customer_id, external_subscription_id")
    .eq("user_id", invitation.invited_by)
    .eq("status", "active")
    .eq("membership_type", "membership")
    .single();

  if (ownerSubscription) {
    // Create a growth_member subscription entry
    const { error: subscriptionError } = await supabase
      .from("subscriptions")
      .insert({
        user_id: userId,
        provider: "lemonsqueezy",
        status: "active",
        price_id: ownerSubscription.price_id,
        membership_type: "growth_member",
        // Note: growth_member subscriptions don't have external IDs
        // They're managed by the portfolio owner's subscription
      });

    if (subscriptionError) {
      console.error(
        "Error creating growth_member subscription:",
        subscriptionError
      );
      // Don't return false here - collaborator was already created
    }
  }

  return true;
}

/**
 * Merge user's existing posts into portfolio
 */
export async function mergeUserPostsIntoPortfolio(
  userId: string,
  portfolioId: string
): Promise<void> {
  // Use admin client to bypass RLS for bulk updates
  const supabase = supabaseAdmin;

  // Update all user's posts to link to portfolio
  // Personal posts remain private to creator (enforced by access control)
  await supabase
    .from("posts")
    .update({ portfolio_id: portfolioId })
    .eq("user_id", userId);
}

/**
 * Get pending invitations for a portfolio
 */
export async function getPendingInvitations(
  portfolioId: string
): Promise<PortfolioInvitation[]> {
  // Use admin client to bypass RLS - portfolio_invitations SELECT policy queries portfolios which causes recursion
  const supabase = supabaseAdmin;

  const { data, error } = await supabase
    .from("portfolio_invitations")
    .select("*")
    .eq("portfolio_id", portfolioId)
    .eq("status", "pending")
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching invitations:", error);
    return [];
  }

  return data || [];
}

/**
 * Cancel/decline an invitation
 */
export async function cancelInvitation(
  invitationId: number,
  portfolioId: string,
  userId: string
): Promise<boolean> {
  // Verify user is the portfolio owner
  const isOwner = await isPortfolioOwner(userId, portfolioId);
  if (!isOwner) {
    throw new Error("Only portfolio owner can cancel invitations");
  }

  // Use admin client to bypass RLS recursion
  const supabase = supabaseAdmin;

  const { error } = await supabase
    .from("portfolio_invitations")
    .update({ status: "declined" })
    .eq("id", invitationId)
    .eq("portfolio_id", portfolioId);

  if (error) {
    console.error("Error canceling invitation:", error);
    return false;
  }

  return true;
}
