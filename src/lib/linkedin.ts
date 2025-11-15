/**
 * LinkedIn API utilities for Next.js
 *
 * This file provides Next.js-specific wrappers and OAuth functions,
 * while re-exporting shared LinkedIn functionality from @/shared/linkedin
 */

// Re-export types from shared
export type {
  LinkedInProfile,
  LinkedInPostResponse,
  LinkedInOrganization,
  LinkedInOrganizationDB,
  LinkedInPostMetrics,
  LinkedInAccount,
  LinkedInToken,
  LinkedInPostMetricsDB,
} from "@/shared/linkedin/types";

// Re-export shared client as LinkedInAPI for backward compatibility
import { LinkedInClient } from "@/shared/linkedin/client";
export { LinkedInClient };
export { LinkedInClient as LinkedInAPI };

// Re-export utility functions
export {
  generateLinkedInPostURL,
  isTokenExpiringSoon,
  getDaysUntilExpiration,
  isTokenExpired,
} from "@/shared/linkedin/utils";

// Re-export token management (will be wrapped below)
import { getLinkedInToken as getLinkedInTokenShared } from "@/shared/linkedin/tokens";
import type { LinkedInToken } from "@/shared/linkedin/types";

/**
 * LinkedIn token response interface
 */
export interface LinkedInTokenResponse {
  access_token: string;
  expires_in: number;
  refresh_token?: string;
}

/**
 * Generate LinkedIn OAuth authorization URL
 * Updated scopes for Community Management API (Marketing September 2025)
 */
export function getLinkedInAuthURL(): string {
  const clientId = process.env.LINKEDIN_CLIENT_ID;
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/linkedin/callback`;

  if (!clientId) {
    throw new Error("LinkedIn Client ID not configured");
  }

  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    redirect_uri: redirectUri,
    state: "linkedin_auth",
    // Personal account scopes
    scope: "openid profile w_member_social email",
  });

  return `https://www.linkedin.com/oauth/v2/authorization?${params.toString()}`;
}

/**
 * Generate LinkedIn OAuth authorization URL for Community Management API (organizations)
 */
export function getLinkedInCommunityAuthURL(): string {
  const clientId = process.env.LINKEDIN_COMMUNITY_CLIENT_ID;
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/linkedin/organizations/callback`;

  if (!clientId) {
    throw new Error("LinkedIn Community Client ID not configured");
  }

  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    redirect_uri: redirectUri,
    state: "linkedin_org_auth",
    // Organization management scopes
    scope:
      "r_member_postAnalytics r_organization_followers r_organization_social rw_organization_admin r_organization_social_feed w_member_social r_member_profileAnalytics w_organization_social r_basicprofile w_organization_social_feed w_member_social_feed r_1st_connections_size",
  });

  return `https://www.linkedin.com/oauth/v2/authorization?${params.toString()}`;
}

/**
 * Make a request to LinkedIn's token endpoint
 */
async function requestLinkedInToken(
  params: Record<string, string>,
  credsOverride?: { clientId: string; clientSecret: string }
): Promise<LinkedInTokenResponse> {
  const clientId = credsOverride?.clientId || process.env.LINKEDIN_CLIENT_ID;
  const clientSecret =
    credsOverride?.clientSecret || process.env.LINKEDIN_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("LinkedIn credentials not configured");
  }

  const response = await fetch(
    "https://www.linkedin.com/oauth/v2/accessToken",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        ...params,
      }),
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorType =
      params.grant_type === "refresh_token" ? "refresh token" : "OAuth";
    throw new Error(
      `LinkedIn ${errorType} error: ${response.status} ${
        response.statusText
      }. ${
        errorData.error_description ||
        `Failed to ${
          params.grant_type === "refresh_token"
            ? "refresh access token"
            : "exchange code for token"
        }`
      }`
    );
  }

  return response.json();
}

/**
 * Exchange authorization code for access token
 */
export async function exchangeCodeForToken(
  code: string
): Promise<LinkedInTokenResponse> {
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/linkedin/callback`;

  return requestLinkedInToken({
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUri,
  });
}

/**
 * Exchange authorization code for access token (Community app)
 */
export async function exchangeCodeForCommunityToken(
  code: string
): Promise<LinkedInTokenResponse> {
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/linkedin/organizations/callback`;

  return requestLinkedInToken(
    {
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
    },
    {
      clientId: process.env.LINKEDIN_COMMUNITY_CLIENT_ID as string,
      clientSecret: process.env.LINKEDIN_COMMUNITY_CLIENT_SECRET as string,
    }
  );
}

/**
 * Refresh access token using refresh token
 */
export async function refreshAccessToken(
  refreshToken: string
): Promise<LinkedInTokenResponse> {
  return requestLinkedInToken({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
  });
}

/**
 * Refresh access token using refresh token (Community app)
 */
export async function refreshCommunityAccessToken(
  refreshToken: string
): Promise<LinkedInTokenResponse> {
  return requestLinkedInToken(
    {
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    },
    {
      clientId: process.env.LINKEDIN_COMMUNITY_CLIENT_ID as string,
      clientSecret: process.env.LINKEDIN_COMMUNITY_CLIENT_SECRET as string,
    }
  );
}

/**
 * Get a valid LinkedIn token with automatic refresh
 * Unified function for both personal and community tokens
 *
 * This is a Next.js-specific wrapper that uses Next.js Supabase client
 * and calls the shared token management function.
 */
export async function getLinkedInToken(
  userId: string,
  type: "personal" | "community"
): Promise<LinkedInToken | null> {
  const { createServerClient } = await import("@/lib/supabase-server");
  const supabase = createServerClient();

  // Use shared token management with Next.js env var getter
  const token = await getLinkedInTokenShared(
    supabase,
    userId,
    type,
    (key: string) => process.env[key]
  );

  // For personal tokens, also fetch and update profile data if token was refreshed
  if (token && type === "personal") {
    try {
      const { LinkedInClient } = await import("@/shared/linkedin/client");
      const linkedinAPI = new LinkedInClient(token.access_token);
      const isValidToken = await linkedinAPI.validateToken();
      if (isValidToken) {
        const profile = await linkedinAPI.getProfile();
        const updatedProfileData = {
          firstName: profile.firstName,
          lastName: profile.lastName,
          profilePicture: profile.profilePicture,
        };

        // Update profile data if it changed
        if (
          JSON.stringify(token.profile_data) !==
          JSON.stringify(updatedProfileData)
        ) {
          await supabase
            .from("linkedin_tokens")
            .update({
              profile_data: updatedProfileData,
              updated_at: new Date().toISOString(),
            })
            .eq("id", token.id);

          return {
            ...token,
            profile_data: updatedProfileData,
            updated_at: new Date().toISOString(),
          };
        }
      }
    } catch (profileError) {
      console.warn(
        "Failed to update profile data during token refresh:",
        profileError
      );
      // Continue with existing token even if profile update fails
    }
  }

  return token;
}

/**
 * Revoke a LinkedIn access token
 * This removes the app from the user's LinkedIn "Permitted services" list
 */
export async function revokeLinkedInToken(
  accessToken: string,
  type: "personal" | "community" = "personal"
): Promise<void> {
  const clientId =
    type === "personal"
      ? process.env.LINKEDIN_CLIENT_ID
      : process.env.LINKEDIN_COMMUNITY_CLIENT_ID;
  const clientSecret =
    type === "personal"
      ? process.env.LINKEDIN_CLIENT_SECRET
      : process.env.LINKEDIN_COMMUNITY_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("LinkedIn credentials not configured");
  }

  const response = await fetch(
    "https://www.linkedin.com/oauth/v2/revoke",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        token: accessToken,
        client_id: clientId,
        client_secret: clientSecret,
      }),
    }
  );

  // LinkedIn returns 200 even if token is already revoked or invalid
  // So we only throw if it's a different error
  if (!response.ok && response.status !== 200) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      `LinkedIn token revocation error: ${response.status} ${
        response.statusText
      }. ${errorData.error_description || "Failed to revoke token"}`
    );
  }
}

/**
 * Get LinkedIn account profile data for display purposes
 * Fetches from linkedin_tokens where type='personal'
 */
export async function getLinkedInAccountProfile(
  userId: string
): Promise<{ profile_data: any; linkedin_user_id: string } | null> {
  const { createServerClient } = await import("@/lib/supabase-server");
  const supabase = createServerClient();

  const { data: token, error } = await supabase
    .from("linkedin_tokens")
    .select("profile_data, linkedin_user_id")
    .eq("user_id", userId)
    .eq("type", "personal")
    .eq("is_active", true)
    .single();

  if (error || !token) {
    return null;
  }

  return {
    profile_data: token.profile_data,
    linkedin_user_id: token.linkedin_user_id || "",
  };
}
