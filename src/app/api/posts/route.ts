import { NextRequest, NextResponse } from "next/server";
import { createServerClient, supabaseAdmin } from "@/lib/supabase-server";
import { getUserPortfolio } from "@/lib/portfolio";
import { filterPostsByPortfolioAccess } from "@/lib/portfolio-posts";

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

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const offset = (page - 1) * limit;
    const type = searchParams.get("type"); // "personal" or "organization"
    const year = searchParams.get("year");
    const month = searchParams.get("month");
    const startDateParam = searchParams.get("startDate");
    const endDateParam = searchParams.get("endDate");
    const includePublished = searchParams.get("includePublished") === "true";

    // Get user's portfolio to determine which posts to include
    const portfolio = await getUserPortfolio(user.id);
    let userIdsToQuery = [user.id];
    let portfolioIdFilter: string | null = null;

    if (portfolio) {
      // Get all portfolio member user IDs (owner + collaborators)
      // Use admin client to bypass RLS (prevents recursion in portfolio_collaborators SELECT policy)
      const { data: collaborators } = await supabaseAdmin
        .from("portfolio_collaborators")
        .select("user_id")
        .eq("portfolio_id", portfolio.id)
        .eq("status", "accepted");

      userIdsToQuery = [
        portfolio.owner_id,
        ...(collaborators?.map((c) => c.user_id) || []),
      ];

      portfolioIdFilter = portfolio.id;
    }

    // First, get the total count for pagination metadata
    // Use admin client when in portfolio context to bypass RLS
    const countSupabase = portfolioIdFilter ? supabaseAdmin : supabase;
    let countQuery = countSupabase
      .from("posts")
      .select("*", { count: "exact", head: true });

    // If user has a portfolio, include posts from all portfolio members with that portfolio_id
    if (portfolioIdFilter) {
      countQuery = countQuery
        .in("user_id", userIdsToQuery)
        .eq("portfolio_id", portfolioIdFilter);
    } else {
      // If no portfolio, only show user's own posts (no portfolio_id filter)
      countQuery = countQuery.eq("user_id", user.id).is("portfolio_id", null);
    }

    // Handle status filtering: if includePublished is true with month, fetch both SCHEDULED and PUBLISHED
    if (status && !(includePublished && (year && month || startDateParam && endDateParam))) {
      countQuery = countQuery.eq("status", status);
    } else if (includePublished && (year && month || startDateParam && endDateParam) && status === "SCHEDULED") {
      // Include both SCHEDULED and PUBLISHED when fetching scheduled posts with month filter
      countQuery = countQuery.in("status", ["SCHEDULED", "PUBLISHED"]);
    } else if (status) {
      countQuery = countQuery.eq("status", status);
    }

    // Calculate date range for filtering
    let startDate: Date | null = null;
    let endDate: Date | null = null;

    // If startDate and endDate are provided (for calendar view with extended range), use them
    if (startDateParam && endDateParam) {
      try {
        startDate = new Date(startDateParam);
        endDate = new Date(endDateParam);
        // Set endDate to end of day
        endDate.setHours(23, 59, 59, 999);
      } catch (error) {
        console.error("Error parsing date parameters:", error);
        return NextResponse.json(
          { error: "Invalid date parameters" },
          { status: 400 }
        );
      }
    } else if (year && month) {
      try {
        startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
        endDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59);
      } catch (error) {
        console.error("Error in count query date filtering:", error);
        return NextResponse.json(
          { error: "Invalid date parameters" },
          { status: 400 }
        );
      }
    }

    // Apply date filtering to count query if we have a date range
    if (startDate && endDate) {
      if (!(includePublished && status === "SCHEDULED")) {
        // For normal queries, apply date filter on scheduled_publish_date
        countQuery = countQuery
          .gte("scheduled_publish_date", startDate.toISOString())
          .lte("scheduled_publish_date", endDate.toISOString());
      }
      // For includePublished + SCHEDULED case, we'll filter after fetching
    }

    const { count: rawCount, error: countError } = await countQuery;

    if (countError) {
      console.error("Error counting posts:", {
        error: countError,
        code: countError.code,
        message: countError.message,
        details: countError.details,
        hint: countError.hint,
        user_id: user.id,
        portfolio_id: portfolioIdFilter,
        userIdsToQuery,
      });
      // Don't return error - continue with count = 0 to avoid breaking the UI
      // The actual query will still work and filter posts correctly
    }

    // For includePublished case, we need to filter posts and get accurate count
    let count = rawCount || 0;

    // Then, get the paginated posts
    // Use admin client when in portfolio context to bypass RLS for nested linkedin_posts
    const postsSupabase = portfolioIdFilter ? supabaseAdmin : supabase;
    let query = postsSupabase
      .from("posts")
      .select(
        `
        *,
        linkedin_posts(
          linkedin_post_id,
          status,
          published_at,
          organization_id
        )
      `
      )
      .in("user_id", userIdsToQuery)
      .range(offset, offset + limit - 1);

    // If user has a portfolio, only include posts from that portfolio
    if (portfolioIdFilter) {
      query = query.eq("portfolio_id", portfolioIdFilter);
    } else {
      // If no portfolio, only show user's own posts
      query = query.eq("user_id", user.id);
    }

    // Handle status filtering: if includePublished is true with month, fetch both SCHEDULED and PUBLISHED
    if (status && !(includePublished && (year && month || startDateParam && endDateParam))) {
      query = query.eq("status", status);
    } else if (includePublished && (year && month || startDateParam && endDateParam) && status === "SCHEDULED") {
      // Include both SCHEDULED and PUBLISHED when fetching scheduled posts with month filter
      query = query.in("status", ["SCHEDULED", "PUBLISHED"]);
    } else if (status) {
      query = query.eq("status", status);
    }

    // Add date filtering for year/month or date range if provided
    if (startDate && endDate) {
      if (!(includePublished && status === "SCHEDULED")) {
        // Default: use scheduled_publish_date
        query = query
          .gte("scheduled_publish_date", startDate.toISOString())
          .lte("scheduled_publish_date", endDate.toISOString());
      }
      // For includePublished + SCHEDULED case, we'll filter after fetching
    }

    // Apply appropriate sorting based on status
    if (includePublished && status === "SCHEDULED" && (year && month || startDateParam && endDateParam)) {
      // When fetching both SCHEDULED and PUBLISHED, sort by the relevant date field
      // Note: Supabase doesn't support conditional sorting easily, so we'll sort by created_at
      // and handle proper sorting on client side, or use a computed field
      // For now, sort SCHEDULED by scheduled_publish_date and PUBLISHED by published_at
      // We'll use created_at as a fallback and do final sorting client-side if needed
      query = query.order("created_at", { ascending: false });
    } else if (status === "PUBLISHED") {
      query = query.order("published_at", { ascending: false });
    } else if (status === "SCHEDULED") {
      query = query.order("scheduled_publish_date", { ascending: false });
    } else {
      // For DRAFT and other statuses, sort by created_at
      query = query.order("created_at", { ascending: false });
    }

    const { data: rawPosts, error } = await query;

    if (error) {
      console.error("Error fetching posts:", error);
      return NextResponse.json(
        { error: "Failed to fetch posts" },
        { status: 500 }
      );
    }

    // Apply portfolio access filtering
    let posts = await filterPostsByPortfolioAccess(user.id, rawPosts || []);

    // Filter posts by date when includePublished is true and we have date range
    if (
      includePublished &&
      status === "SCHEDULED" &&
      startDate &&
      endDate &&
      rawPosts
    ) {
      posts = rawPosts.filter((post: any) => {
        if (post.status === "SCHEDULED") {
          // For SCHEDULED posts, check scheduled_publish_date
          if (!post.scheduled_publish_date) return false;
          const postDate = new Date(post.scheduled_publish_date);
          return postDate >= startDate && postDate <= endDate;
        } else if (post.status === "PUBLISHED") {
          // For PUBLISHED posts, check published_at
          if (!post.published_at) return false;
          const postDate = new Date(post.published_at);
          return postDate >= startDate && postDate <= endDate;
        }
        return false;
      });

      // Update count to reflect filtered posts
      // For accurate count, we'd need to refetch, but for pagination we'll use the filtered array length
      // In a real scenario, you might want to make separate count queries
      count = posts.length;

      // Sort posts by the appropriate date field (newest first)
      // For scheduled posts, use scheduled_publish_date
      // For published posts, use published_at
      posts = posts.sort((a: any, b: any) => {
        const getSortDate = (post: any): number => {
          // For published posts, prioritize published_at
          if (post.status === "PUBLISHED" && post.published_at) {
            const date = new Date(post.published_at);
            return isNaN(date.getTime()) ? 0 : date.getTime();
          }
          // For scheduled posts, use scheduled_publish_date
          if (post.scheduled_publish_date) {
            const date = new Date(post.scheduled_publish_date);
            return isNaN(date.getTime()) ? 0 : date.getTime();
          }
          return 0;
        };

        const dateA = getSortDate(a);
        const dateB = getSortDate(b);

        // Sort in descending order: newer dates (larger timestamps) come first
        return dateB - dateA;
      });
    }

    // Fetch organization names for organization posts
    const organizationIds = new Set<string>();
    posts?.forEach((post) => {
      // Check linkedin_posts for organization_id
      post.linkedin_posts?.forEach((lp: any) => {
        if (lp.organization_id) {
          organizationIds.add(lp.organization_id);
        }
      });

      // Also check publish_target for organization info
      if (
        post.publish_target &&
        post.publish_target !== "personal"
      ) {
        organizationIds.add(post.publish_target);
      }
    });

    // Get organization names from all portfolio members (not just current user)
    // Use admin client to bypass RLS (organizations are stored per user_id, but portfolio members need to see them)
    let organizations: Record<string, string> = {};
    if (organizationIds.size > 0) {
      const { data: orgData } = await supabaseAdmin
        .from("linkedin_organizations")
        .select("linkedin_org_id, org_name")
        .in("user_id", userIdsToQuery)
        .in("linkedin_org_id", Array.from(organizationIds));

      organizations =
        orgData?.reduce((acc, org) => {
          acc[org.linkedin_org_id] = org.org_name || org.linkedin_org_id;
          return acc;
        }, {} as Record<string, string>) || {};
    }

    // Filter posts by type on the client side
    let filteredPosts = posts || [];
    let filteredCount = count || 0;

    if (type === "personal") {
      // Filter posts for personal (organization_id is null or publish_target is "personal" or both are null/empty)
      // Only include posts where publish_target matches OR all linkedin_posts are personal
      filteredPosts = filteredPosts.filter((post) => {
        // If publish_target is explicitly "personal", include it
        if (post.publish_target === "personal") {
          return true;
        }
        // If no publish_target and no linkedin_posts, include it (defaults to personal)
        if (!post.publish_target && (!post.linkedin_posts || post.linkedin_posts.length === 0)) {
          return true;
        }
        // If all linkedin_posts are personal (organization_id === null), include it
        if (post.linkedin_posts && post.linkedin_posts.length > 0) {
          const allPersonal = post.linkedin_posts.every(
            (lp: any) => lp.organization_id === null
          );
          return allPersonal;
        }
        return false;
      });

      // Count only personal posts by fetching all posts and filtering
      // Use admin client when in portfolio context to bypass RLS for nested linkedin_posts
      const countSupabase = portfolioIdFilter ? supabaseAdmin : supabase;
      const allPostsQuery = countSupabase
        .from("posts")
        .select(
          `
          *,
          linkedin_posts(
            organization_id
          )
        `
        );

      if (portfolioIdFilter) {
        allPostsQuery.in("user_id", userIdsToQuery).eq("portfolio_id", portfolioIdFilter);
      } else {
        allPostsQuery.eq("user_id", user.id).is("portfolio_id", null);
      }

      if (status) {
        allPostsQuery.eq("status", status);
      }

      const { data: allPosts } = await allPostsQuery;
      // Apply portfolio access rules before filtering by type
      const accessibleAllPosts = await filterPostsByPortfolioAccess(user.id, allPosts || []);
      const personalPostsCount =
        accessibleAllPosts.filter((post) => {
          // If publish_target is explicitly "personal", include it
          if (post.publish_target === "personal") {
            return true;
          }
          // If no publish_target and no linkedin_posts, include it (defaults to personal)
          if (!post.publish_target && (!post.linkedin_posts || post.linkedin_posts.length === 0)) {
            return true;
          }
          // If all linkedin_posts are personal (organization_id === null), include it
          if (post.linkedin_posts && post.linkedin_posts.length > 0) {
            const allPersonal = post.linkedin_posts.every(
              (lp: any) => lp.organization_id === null
            );
            return allPersonal;
          }
          return false;
        }).length || 0;

      filteredCount = personalPostsCount;
    } else if (type === "organization") {
      // Get user's accessible organization IDs for additional filtering
      const { data: userOrgs } = await supabase
        .from("linkedin_organizations")
        .select("linkedin_org_id")
        .eq("user_id", user.id);
      const userOrgIds = new Set(userOrgs?.map((org) => org.linkedin_org_id) || []);

      // Filter posts for organization
      // Only include posts where publish_target is an organization OR all linkedin_posts are for organizations
      // AND the user has access to those organizations (filterPostsByPortfolioAccess already checks this, but we double-check here)
      filteredPosts = filteredPosts.filter((post) => {
        // If publish_target is an organization (not "personal"), check if user has access
        if (post.publish_target && post.publish_target !== "personal") {
          // filterPostsByPortfolioAccess already ensures user has access, but verify
          return userOrgIds.has(post.publish_target) || post.user_id === user.id;
        }
        // If all linkedin_posts are for organizations, check if user has access to at least one
        if (post.linkedin_posts && post.linkedin_posts.length > 0) {
          const allOrg = post.linkedin_posts.every(
            (lp: any) => lp.organization_id !== null
          );
          if (allOrg) {
            // Check if user has access to at least one of the organizations
            const hasAccess = post.linkedin_posts.some(
              (lp: any) => userOrgIds.has(lp.organization_id) || post.user_id === user.id
            );
            return hasAccess;
          }
        }
        return false;
      });

      // Count only organization posts by fetching all posts and filtering
      // Use admin client when in portfolio context to bypass RLS for nested linkedin_posts
      const countSupabase = portfolioIdFilter ? supabaseAdmin : supabase;
      const allPostsQuery = countSupabase
        .from("posts")
        .select(
          `
          *,
          linkedin_posts(
            organization_id
          )
        `
        );

      if (portfolioIdFilter) {
        allPostsQuery.in("user_id", userIdsToQuery).eq("portfolio_id", portfolioIdFilter);
      } else {
        allPostsQuery.eq("user_id", user.id).is("portfolio_id", null);
      }

      if (status) {
        allPostsQuery.eq("status", status);
      }

      const { data: allPosts } = await allPostsQuery;
      // Apply portfolio access rules before filtering by type
      const accessibleAllPosts = await filterPostsByPortfolioAccess(user.id, allPosts || []);
      const organizationPostsCount =
        accessibleAllPosts.filter((post) => {
          // If publish_target is an organization (not "personal"), include it
          if (post.publish_target && post.publish_target !== "personal") {
            return true;
          }
          // If all linkedin_posts are for organizations, include it
          if (post.linkedin_posts && post.linkedin_posts.length > 0) {
            const allOrg = post.linkedin_posts.every(
              (lp: any) => lp.organization_id !== null
            );
            return allOrg;
          }
          return false;
        }).length || 0;

      filteredCount = organizationPostsCount;
    }

    const totalPages = Math.ceil(filteredCount / limit);

    // For organization posts, also return organization-specific counts
    let organizationCounts = {};
    if (type === "organization") {
      // Get all organization posts to calculate counts per organization
      // Use admin client when in portfolio context to bypass RLS for nested linkedin_posts
      const orgCountSupabase = portfolioIdFilter ? supabaseAdmin : supabase;
      const allOrgPostsQuery = orgCountSupabase
        .from("posts")
        .select(
          `
          *,
          linkedin_posts(
            organization_id
          )
        `
        );

      if (portfolioIdFilter) {
        allOrgPostsQuery.in("user_id", userIdsToQuery).eq("portfolio_id", portfolioIdFilter);
      } else {
        allOrgPostsQuery.eq("user_id", user.id).is("portfolio_id", null);
      }

      if (status) {
        allOrgPostsQuery.eq("status", status);
      }

      const { data: allOrgPosts } = await allOrgPostsQuery;
      // Apply portfolio access rules before filtering by type
      const accessibleOrgPosts = await filterPostsByPortfolioAccess(user.id, allOrgPosts || []);
      const orgPosts =
        accessibleOrgPosts.filter((post) => {
          // If publish_target is an organization (not "personal"), include it
          if (post.publish_target && post.publish_target !== "personal") {
            return true;
          }
          // If all linkedin_posts are for organizations, include it
          if (post.linkedin_posts && post.linkedin_posts.length > 0) {
            const allOrg = post.linkedin_posts.every(
              (lp: any) => lp.organization_id !== null
            );
            return allOrg;
          }
          return false;
        }) || [];

      // Group by organization and count
      organizationCounts = orgPosts.reduce((acc, post) => {
        const orgId =
          post.linkedin_posts?.[0]?.organization_id ||
          post.publish_target;
        if (orgId && orgId !== "personal") {
          acc[orgId] = (acc[orgId] || 0) + 1;
        }
        return acc;
      }, {});
    }

    return NextResponse.json({
      posts: filteredPosts,
      pagination: {
        page,
        limit,
        total: filteredCount,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
      organizationCounts:
        type === "organization" ? organizationCounts : undefined,
      organizations,
    });
  } catch (error) {
    console.error("Error in posts API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
