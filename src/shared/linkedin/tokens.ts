/**
 * LinkedIn token management utilities
 * Platform-agnostic - works with any Supabase client (Node.js or Deno)
 */

import type { LinkedInToken } from "./types";

export interface LinkedInTokenResponse {
  access_token: string;
  expires_in: number;
  refresh_token?: string;
}

/**
 * Get a valid LinkedIn token with automatic refresh
 * Unified function for both personal and community tokens
 * 
 * @param supabaseClient - Supabase client instance (works in both Node.js and Deno)
 * @param userId - User ID
 * @param type - Token type: "personal" or "community"
 * @param getEnvVar - Function to get environment variable (platform-specific)
 * @returns LinkedIn token or null if not found/expired
 */
export async function getLinkedInToken(
  supabaseClient: any,
  userId: string,
  type: "personal" | "community",
  getEnvVar: (key: string) => string | undefined
): Promise<LinkedInToken | null> {
  const { data: token, error } = await supabaseClient
    .from("linkedin_tokens")
    .select("*")
    .eq("user_id", userId)
    .eq("type", type)
    .eq("is_active", true)
    .single();

  if (error || !token) {
    return null;
  }

  // If token has no expiry, return as-is
  if (!token.token_expires_at) {
    return token;
  }

  // Check if token is expired (with 5 minute buffer)
  const now = new Date();
  const expiresAt = new Date(token.token_expires_at);
  const bufferTime = 5 * 60 * 1000; // 5 minutes

  if (now.getTime() >= expiresAt.getTime() - bufferTime) {
    if (!token.refresh_token) {
      // Mark token as inactive - user needs to reconnect
      await supabaseClient
        .from("linkedin_tokens")
        .update({ is_active: false })
        .eq("id", token.id);
      return null;
    }

    try {
      // Use appropriate refresh function based on token type
      const newTokenData = await refreshToken(
        token.refresh_token,
        type,
        getEnvVar
      );

      const newExpiresAt = new Date();
      newExpiresAt.setSeconds(
        newExpiresAt.getSeconds() + newTokenData.expires_in
      );

      const { error: updateError } = await supabaseClient
        .from("linkedin_tokens")
        .update({
          access_token: newTokenData.access_token,
          refresh_token: newTokenData.refresh_token || token.refresh_token,
          token_expires_at: newExpiresAt.toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", token.id);

      if (updateError) {
        console.error("Error updating LinkedIn tokens:", updateError);
        return null;
      }

      return {
        ...token,
        access_token: newTokenData.access_token,
        refresh_token: newTokenData.refresh_token || token.refresh_token,
        token_expires_at: newExpiresAt.toISOString(),
        updated_at: newExpiresAt.toISOString(),
      };
    } catch (refreshError) {
      console.error("Error refreshing LinkedIn token:", refreshError);
      await supabaseClient
        .from("linkedin_tokens")
        .update({ is_active: false })
        .eq("id", token.id);
      return null;
    }
  }

  return token;
}

/**
 * Refresh access token using refresh token
 */
async function refreshToken(
  refreshToken: string,
  type: "personal" | "community",
  getEnvVar: (key: string) => string | undefined
): Promise<LinkedInTokenResponse> {
  const clientId =
    type === "personal"
      ? getEnvVar("LINKEDIN_CLIENT_ID")
      : getEnvVar("LINKEDIN_COMMUNITY_CLIENT_ID");

  const clientSecret =
    type === "personal"
      ? getEnvVar("LINKEDIN_CLIENT_SECRET")
      : getEnvVar("LINKEDIN_COMMUNITY_CLIENT_SECRET");

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
        grant_type: "refresh_token",
        refresh_token: refreshToken,
      }),
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      `LinkedIn refresh token error: ${response.status} ${
        response.statusText
      }. ${errorData.error_description || "Failed to refresh access token"}`
    );
  }

  return response.json();
}

