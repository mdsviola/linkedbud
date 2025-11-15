/**
 * Shared LinkedIn types and interfaces
 * Works in both Node.js (Next.js) and Deno (Edge Functions) environments
 */

export interface LinkedInProfile {
  id: string;
  firstName: string;
  lastName: string;
  profilePicture?: string;
}

export interface LinkedInPostResponse {
  id: string;
  activity: string;
  created: {
    time: number;
  };
}

export interface LinkedInOrganization {
  id: string;
  name: string;
  vanityName?: string;
  logoUrl?: string;
}

export interface LinkedInOrganizationDB {
  id: number;
  user_id: string;
  linkedin_org_id: string;
  org_name: string | null;
  org_vanity_name: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface LinkedInPostMetrics {
  impressions: number;
  likes: number;
  comments: number;
  shares: number;
  clicks: number;
  engagementRate?: number;
}

export interface LinkedInAccount {
  id?: number;
  user_id: string;
  linkedin_user_id?: string | null;
  access_token?: string;
  refresh_token?: string | null;
  token_expires_at?: string | null;
  profile_data?: any;
  account_type?: "personal" | "organization";
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface LinkedInToken {
  id?: number;
  user_id: string;
  type?: "personal" | "community";
  access_token: string;
  refresh_token?: string;
  token_expires_at?: string | null;
  linkedin_user_id?: string | null;
  profile_data?: any;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface LinkedInPostMetricsDB {
  id?: number;
  linkedin_post_id: string;
  user_id: string;
  impressions?: number;
  likes?: number;
  comments?: number;
  shares?: number;
  clicks?: number;
  engagement_rate?: number;
  fetched_at?: string;
  created_at?: string;
}

