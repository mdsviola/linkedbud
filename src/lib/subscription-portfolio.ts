/**
 * Subscription and portfolio integration
 * Handles portfolio creation on upgrade and member tier management on downgrade/upgrade
 */

import { createServerClient } from "./supabase-server";
import { createPortfolioForOwner, getPortfolioCollaborators, getPortfolioOwner } from "./portfolio";
import { getTierFromPriceId } from "./tier-utils";
import { getUserSubscription } from "./auth";

/**
 * Handle portfolio creation when user upgrades to Growth plan
 */
export async function handlePortfolioOnUpgrade(userId: string): Promise<void> {
  const supabase = createServerClient();

  // Create portfolio for owner
  await createPortfolioForOwner(userId);

  // Get portfolio to sync member tiers
  const portfolio = await createPortfolioForOwner(userId);
  if (portfolio) {
    // Sync all portfolio members to Growth tier
    await syncPortfolioMemberTiers(portfolio.id, "GROWTH");
  }
}

/**
 * Handle portfolio on downgrade: keep structure but downgrade all members to FREE
 */
export async function handlePortfolioOnDowngrade(userId: string): Promise<void> {
  const supabase = createServerClient();

  // Get user's portfolio
  const { data: portfolio } = await supabase
    .from("portfolios")
    .select("id")
    .eq("owner_id", userId)
    .single();

  if (!portfolio) {
    return; // User doesn't have a portfolio
  }

  // Get all collaborators
  const collaborators = await getPortfolioCollaborators(portfolio.id);
  const collaboratorUserIds = collaborators.map((c) => c.user_id);

  // Downgrade all collaborators to FREE by removing their growth_member subscriptions
  if (collaboratorUserIds.length > 0) {
    await supabase
      .from("subscriptions")
      .delete()
      .in("user_id", collaboratorUserIds)
      .eq("membership_type", "growth_member");
  }

  // Note: Portfolio structure is kept, but members lose Growth tier access
  // When owner resubscribes, members will be upgraded again
}

/**
 * Handle portfolio on resubscribe: upgrade all members back to Growth tier
 */
export async function handlePortfolioOnResubscribe(userId: string): Promise<void> {
  const supabase = createServerClient();

  // Get user's portfolio
  const { data: portfolio } = await supabase
    .from("portfolios")
    .select("id")
    .eq("owner_id", userId)
    .single();

  if (!portfolio) {
    return; // User doesn't have a portfolio
  }

  // Get owner's subscription to get price_id
  const ownerSubscription = await getUserSubscription(userId);
  if (!ownerSubscription || !ownerSubscription.price_id) {
    return;
  }

  // Sync all portfolio members to Growth tier
  await syncPortfolioMemberTiers(portfolio.id, "GROWTH");
}

/**
 * Sync all portfolio members to the same tier
 */
export async function syncPortfolioMemberTiers(
  portfolioId: string,
  tier: "GROWTH" | "FREE"
): Promise<void> {
  const supabase = createServerClient();

  // Get portfolio owner's main membership subscription to get price_id
  const ownerId = await getPortfolioOwner(portfolioId);
  if (!ownerId) {
    return;
  }

  // Get owner's main membership subscription (not addons)
  const ownerSubscription = await getUserSubscription(ownerId);
  if (!ownerSubscription || !ownerSubscription.price_id) {
    return;
  }

  // Get all collaborators
  const collaborators = await getPortfolioCollaborators(portfolioId);
  const collaboratorUserIds = collaborators.map((c) => c.user_id);

  if (tier === "GROWTH") {
    // Upgrade all collaborators to growth_member
    for (const collaboratorUserId of collaboratorUserIds) {
      // Check if growth_member subscription already exists
      const { data: existing } = await supabase
        .from("subscriptions")
        .select("id")
        .eq("user_id", collaboratorUserId)
        .eq("membership_type", "growth_member")
        .single();

      if (!existing) {
        // Create growth_member subscription
        await supabase.from("subscriptions").insert({
          user_id: collaboratorUserId,
          provider: "lemonsqueezy",
          status: "active",
          price_id: ownerSubscription.price_id,
          membership_type: "growth_member",
          // Note: growth_member subscriptions don't have external IDs
          // They're managed by the portfolio owner's subscription
        });
      } else {
        // Update existing growth_member subscription
        await supabase
          .from("subscriptions")
          .update({
            status: "active",
            price_id: ownerSubscription.price_id,
          })
          .eq("id", existing.id);
      }
    }
  } else {
    // Downgrade all collaborators to FREE by removing growth_member subscriptions
    if (collaboratorUserIds.length > 0) {
      await supabase
        .from("subscriptions")
        .delete()
        .in("user_id", collaboratorUserIds)
        .eq("membership_type", "growth_member");
    }
  }
}

