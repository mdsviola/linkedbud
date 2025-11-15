/**
 * Portfolio post access control
 * Handles determining which posts a user can access based on portfolio membership
 */

import { createServerClient } from "./supabase-server";
import { supabaseAdmin } from "./supabase-server";
import { getUserPortfolio, isPortfolioMember } from "./portfolio";

/**
 * Get all posts accessible to a user in their portfolio
 * Personal posts are only visible to creator
 * Organization posts are visible to any collaborator with LinkedIn access to that org
 */
export async function getAccessiblePosts(
  userId: string,
  portfolioId: string
): Promise<any[]> {
  const supabase = createServerClient();

  // Verify user is a member of the portfolio
  const isMember = await isPortfolioMember(userId, portfolioId);
  if (!isMember) {
    return [];
  }

  // Get user's accessible organization IDs
  const { data: userOrgs } = await supabase
    .from("linkedin_organizations")
    .select("linkedin_org_id")
    .eq("user_id", userId);

  const userOrgIds = new Set(userOrgs?.map((org) => org.linkedin_org_id) || []);

  // Get all posts in the portfolio
  const { data: portfolioPosts, error } = await supabase
    .from("posts")
    .select(
      `
      *,
      linkedin_posts(
        organization_id
      )
    `
    )
    .eq("portfolio_id", portfolioId)
    .order("created_at", { ascending: false });

  if (error || !portfolioPosts) {
    return [];
  }

  // Filter posts based on access rules
  const accessiblePosts = portfolioPosts.filter((post) => {
    // Creator can always see their own posts
    if (post.user_id === userId) {
      return true;
    }

    // Personal posts are only visible to creator
    // Check both publish_target and linkedin_posts to determine if it's personal
    const isPersonalTarget = post.publish_target === "personal" || !post.publish_target;
    const hasOnlyPersonalLinkedInPosts = post.linkedin_posts && post.linkedin_posts.length > 0 &&
      post.linkedin_posts.every((lp: any) => lp.organization_id === null);

    if (isPersonalTarget && (!post.linkedin_posts || hasOnlyPersonalLinkedInPosts)) {
      return false;
    }

    // Organization posts: check if user has access to the organization
    // Check both publish_target and linkedin_posts.organization_id
    if (post.publish_target && post.publish_target !== "personal") {
      // If publish_target is set to an organization, check if user has access
      if (userOrgIds.has(post.publish_target)) {
        return true;
      }
    }

    // Also check linkedin_posts.organization_id
    // If any linkedin_post is for an organization the user has access to, allow access
    if (post.linkedin_posts && post.linkedin_posts.length > 0) {
      const hasAccessibleOrgPost = post.linkedin_posts.some(
        (lp: any) => lp.organization_id && userOrgIds.has(lp.organization_id)
      );
      if (hasAccessibleOrgPost) {
        return true;
      }
    }

    return false;
  });

  return accessiblePosts;
}

/**
 * Check if user can access a specific post
 *
 * SECURITY NOTE: Uses admin client to bypass RLS for initial post fetch.
 * Access rules are then enforced in the function logic.
 */
export async function canUserAccessPost(
  userId: string,
  postId: number
): Promise<boolean> {
  // Use admin client to bypass RLS for initial post fetch
  // (RLS might block reading posts that don't belong to the user)
  const supabase = supabaseAdmin;

  // Get post details including linkedin_posts
  const { data: post, error } = await supabase
    .from("posts")
    .select("user_id, portfolio_id, publish_target, linkedin_posts(organization_id)")
    .eq("id", postId)
    .single();

  if (error || !post) {
    return false;
  }

  // Creator can always access their own posts
  if (post.user_id === userId) {
    return true;
  }

  // If post has no portfolio, only creator can access
  if (!post.portfolio_id) {
    return false;
  }

  // Check if user is a member of the portfolio
  const isMember = await isPortfolioMember(userId, post.portfolio_id);
  if (!isMember) {
    return false;
  }

  // Personal posts are only visible to creator
  // Check both publish_target and linkedin_posts to determine if it's personal
  const isPersonalTarget = post.publish_target === "personal" || !post.publish_target;
  const hasOnlyPersonalLinkedInPosts = post.linkedin_posts && post.linkedin_posts.length > 0 &&
    post.linkedin_posts.every((lp: any) => lp.organization_id === null);

  if (isPersonalTarget && (!post.linkedin_posts || hasOnlyPersonalLinkedInPosts)) {
    return false;
  }

  // Get user's accessible organization IDs
  const { data: userOrgs } = await supabase
    .from("linkedin_organizations")
    .select("linkedin_org_id")
    .eq("user_id", userId);

  const userOrgIds = new Set(userOrgs?.map((org) => org.linkedin_org_id) || []);

  // For organization posts, check if user has access to the organization
  // Check both publish_target and linkedin_posts.organization_id
  if (post.publish_target && post.publish_target !== "personal") {
    // If publish_target is set to an organization, check if user has access
    if (userOrgIds.has(post.publish_target)) {
      return true;
    }
  }

  // Also check linkedin_posts.organization_id
  // If any linkedin_post is for an organization the user has access to, allow access
  if (post.linkedin_posts && post.linkedin_posts.length > 0) {
    const hasAccessibleOrgPost = post.linkedin_posts.some(
      (lp: any) => lp.organization_id && userOrgIds.has(lp.organization_id)
    );
    if (hasAccessibleOrgPost) {
      return true;
    }
  }

  return false;
}

/**
 * Get organization IDs that a user can see posts for in a portfolio
 */
export async function getUserAccessibleOrganizations(
  userId: string,
  portfolioId: string
): Promise<string[]> {
  const supabase = createServerClient();

  // Verify user is a member of the portfolio
  const isMember = await isPortfolioMember(userId, portfolioId);
  if (!isMember) {
    return [];
  }

  // Get user's LinkedIn organizations
  const { data: userOrgs } = await supabase
    .from("linkedin_organizations")
    .select("linkedin_org_id")
    .eq("user_id", userId);

  return userOrgs?.map((org) => org.linkedin_org_id) || [];
}

/**
 * Get posts filtered by portfolio access rules
 * This is a helper for API endpoints
 */
export async function filterPostsByPortfolioAccess(
  userId: string,
  posts: any[]
): Promise<any[]> {
  const supabase = createServerClient();

  // Get user's portfolio
  const portfolio = await getUserPortfolio(userId);
  if (!portfolio) {
    // User has no portfolio, only return their own posts
    return posts.filter((post) => post.user_id === userId);
  }

  // Get user's accessible organization IDs
  const { data: userOrgs } = await supabase
    .from("linkedin_organizations")
    .select("linkedin_org_id")
    .eq("user_id", userId);

  const userOrgIds = new Set(userOrgs?.map((org) => org.linkedin_org_id) || []);

  // Filter posts
  return posts.filter((post) => {
    // Creator can always see their own posts
    if (post.user_id === userId) {
      return true;
    }

    // If post is not in the same portfolio, deny access
    if (post.portfolio_id !== portfolio.id) {
      return false;
    }

    // Personal posts are only visible to creator
    // Check both publish_target and linkedin_posts to determine if it's personal
    const isPersonalTarget = post.publish_target === "personal" || !post.publish_target;
    const hasOnlyPersonalLinkedInPosts = post.linkedin_posts && post.linkedin_posts.length > 0 &&
      post.linkedin_posts.every((lp: any) => lp.organization_id === null);

    if (isPersonalTarget && (!post.linkedin_posts || hasOnlyPersonalLinkedInPosts)) {
      return false;
    }

    // Organization posts: check if user has access to the organization
    // Check both publish_target and linkedin_posts.organization_id
    if (post.publish_target && post.publish_target !== "personal") {
      // If publish_target is set to an organization, check if user has access
      if (userOrgIds.has(post.publish_target)) {
        return true;
      }
    }

    // Also check linkedin_posts.organization_id
    // If any linkedin_post is for an organization the user has access to, allow access
    if (post.linkedin_posts && post.linkedin_posts.length > 0) {
      const hasAccessibleOrgPost = post.linkedin_posts.some(
        (lp: any) => lp.organization_id && userOrgIds.has(lp.organization_id)
      );
      if (hasAccessibleOrgPost) {
        return true;
      }
    }

    return false;
  });
}

