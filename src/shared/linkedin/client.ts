/**
 * Unified LinkedIn API Client
 * Works in both Node.js (Next.js) and Deno (Edge Functions) environments
 *
 * This client handles all LinkedIn API operations including:
 * - Profile information
 * - Post publishing (text, images, documents, videos)
 * - Metrics fetching
 * - Organization management
 */

import type {
  LinkedInProfile,
  LinkedInPostResponse,
  LinkedInPostMetrics,
  LinkedInOrganization,
} from "./types";
import { toUint8Array } from "./utils";

export class LinkedInClient {
  private accessToken: string;
  private baseURL = "https://api.linkedin.com/v2";

  constructor(accessToken: string) {
    this.accessToken = accessToken;
  }

  /**
   * Get user's LinkedIn profile information
   * Uses OpenID Connect /userinfo endpoint
   */
  async getProfile(): Promise<LinkedInProfile> {
    try {
      const response = await fetch(`${this.baseURL}/userinfo`, {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`LinkedIn API error: ${response.status}`, errorText);
        throw new Error(`LinkedIn API error: ${response.status}`);
      }

      const data = await response.json();

      // Handle OpenID Connect response format
      let id = data.sub || data.id;
      let firstName = data.given_name || data.firstName || data.first_name;
      let lastName = data.family_name || data.lastName || data.last_name;
      let profilePicture = data.picture || data.profilePicture;

      // Fallback values if data is missing
      if (!firstName) {
        firstName = "LinkedIn";
      }
      if (!lastName) {
        lastName = "User";
      }
      if (!id) {
        id = "unknown";
      }

      return {
        id,
        firstName,
        lastName,
        profilePicture,
      };
    } catch (error) {
      console.error("Could not fetch LinkedIn profile:", error);
      throw new Error("Failed to get LinkedIn profile information");
    }
  }

  /**
   * Get user's LinkedIn ID (needed for posting)
   */
  async getLinkedInId(): Promise<string> {
    const profile = await this.getProfile();
    return profile.id;
  }

  /**
   * Check if the access token is valid
   */
  async validateToken(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseURL}/userinfo`, {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
        },
      });
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  /**
   * Upload an image asset to LinkedIn
   * @param fileBuffer File buffer to upload (Buffer or Uint8Array)
   * @param filename Original filename
   * @param authorUrn Optional author URN (for organization posting)
   * @returns Asset URN (e.g., urn:li:digitalmediaAsset:...)
   */
  async uploadImageAsset(
    fileBuffer: Buffer | Uint8Array | ArrayBuffer,
    filename: string,
    authorUrn?: string
  ): Promise<string> {
    let author: string;

    if (authorUrn) {
      author = authorUrn;
    } else {
      const linkedinId = await this.getLinkedInId();
      author = `urn:li:person:${linkedinId}`;
    }

    // Convert to Uint8Array (works in both Node.js and Deno)
    const buffer = toUint8Array(fileBuffer);

    // Step 1: Register the upload
    const registerResponse = await fetch(
      `${this.baseURL}/assets?action=registerUpload`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          "Content-Type": "application/json",
          "X-Restli-Protocol-Version": "2.0.0",
        },
        body: JSON.stringify({
          registerUploadRequest: {
            recipes: ["urn:li:digitalmediaRecipe:feedshare-image"],
            owner: author,
            serviceRelationships: [
              {
                relationshipType: "OWNER",
                identifier: "urn:li:userGeneratedContent",
              },
            ],
          },
        }),
      }
    );

    if (!registerResponse.ok) {
      const errorData = await registerResponse.json().catch(() => ({}));
      throw new Error(
        `LinkedIn API error: ${registerResponse.status} ${
          registerResponse.statusText
        }. ${errorData.message || "Failed to register image upload"}`
      );
    }

    const registerData = await registerResponse.json();
    const uploadUrl =
      registerData.value.uploadMechanism[
        "com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest"
      ].uploadUrl;
    const assetUrn = registerData.value.asset;

    // Determine content type from filename
    const extension = filename.split(".").pop()?.toLowerCase() || "";
    let contentType = "image/jpeg";
    if (extension === "png") {
      contentType = "image/png";
    } else if (extension === "gif") {
      contentType = "image/gif";
    } else if (extension === "webp") {
      contentType = "image/webp";
    }

    // Step 2: Upload the file to the provided URL
    const uploadResponse = await fetch(uploadUrl, {
      method: "PUT",
      headers: {
        "Content-Type": contentType,
      },
      body: buffer as BodyInit,
    });

    if (!uploadResponse.ok) {
      throw new Error(
        `LinkedIn upload error: ${uploadResponse.status} ${uploadResponse.statusText}. Failed to upload image file.`
      );
    }

    return assetUrn;
  }

  /**
   * Upload a document asset to LinkedIn (PDF, DOCX, PPTX)
   * @param fileBuffer File buffer to upload (Buffer or Uint8Array)
   * @param filename Original filename
   * @param authorUrn Optional author URN (for organization posting)
   * @returns Asset URN (e.g., urn:li:digitalmediaAsset:...)
   */
  async uploadDocumentAsset(
    fileBuffer: Buffer | Uint8Array | ArrayBuffer,
    filename: string,
    authorUrn?: string
  ): Promise<string> {
    let author: string;

    if (authorUrn) {
      author = authorUrn;
    } else {
      const linkedinId = await this.getLinkedInId();
      author = `urn:li:person:${linkedinId}`;
    }

    // Convert to Uint8Array
    const buffer = toUint8Array(fileBuffer);

    // Determine file type from extension
    const extension = filename.split(".").pop()?.toLowerCase() || "";
    let contentType = "application/pdf";
    let recipe = "urn:li:digitalmediaRecipe:feedshare-document";

    if (extension === "doc" || extension === "docx") {
      contentType =
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    } else if (extension === "ppt" || extension === "pptx") {
      contentType =
        "application/vnd.openxmlformats-officedocument.presentationml.presentation";
    }

    // Step 1: Register the upload
    const registerResponse = await fetch(
      `${this.baseURL}/assets?action=registerUpload`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          "Content-Type": "application/json",
          "X-Restli-Protocol-Version": "2.0.0",
        },
        body: JSON.stringify({
          registerUploadRequest: {
            recipes: [recipe],
            owner: author,
            serviceRelationships: [
              {
                relationshipType: "OWNER",
                identifier: "urn:li:userGeneratedContent",
              },
            ],
          },
        }),
      }
    );

    if (!registerResponse.ok) {
      const errorData = await registerResponse.json().catch(() => ({}));
      throw new Error(
        `LinkedIn API error: ${registerResponse.status} ${
          registerResponse.statusText
        }. ${errorData.message || "Failed to register document upload"}`
      );
    }

    const registerData = await registerResponse.json();
    const uploadUrl =
      registerData.value.uploadMechanism[
        "com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest"
      ].uploadUrl;
    const assetUrn = registerData.value.asset;

    // Step 2: Upload the file to the provided URL
    const uploadResponse = await fetch(uploadUrl, {
      method: "PUT",
      headers: {
        "Content-Type": contentType,
      },
      body: buffer as BodyInit,
    });

    if (!uploadResponse.ok) {
      throw new Error(
        `LinkedIn upload error: ${uploadResponse.status} ${uploadResponse.statusText}. Failed to upload document file.`
      );
    }

    return assetUrn;
  }

  /**
   * Upload a video asset to LinkedIn
   * @param fileBuffer File buffer to upload (Buffer or Uint8Array)
   * @param filename Original filename
   * @param authorUrn Optional author URN (for organization posting)
   * @returns Asset URN (e.g., urn:li:digitalmediaAsset:...)
   */
  async uploadVideoAsset(
    fileBuffer: Buffer | Uint8Array | ArrayBuffer,
    filename: string,
    authorUrn?: string
  ): Promise<string> {
    let author: string;

    if (authorUrn) {
      author = authorUrn;
    } else {
      const linkedinId = await this.getLinkedInId();
      author = `urn:li:person:${linkedinId}`;
    }

    // Convert to Uint8Array
    const buffer = toUint8Array(fileBuffer);

    // Determine content type from extension
    const extension = filename.split(".").pop()?.toLowerCase() || "";
    let contentType = "video/mp4";

    if (extension === "mov") {
      contentType = "video/quicktime";
    } else if (extension === "avi") {
      contentType = "video/x-msvideo";
    } else if (extension === "webm") {
      contentType = "video/webm";
    } else if (extension === "mkv") {
      contentType = "video/x-matroska";
    } else if (extension === "wmv") {
      contentType = "video/x-ms-wmv";
    }

    // Use the video recipe for LinkedIn
    const recipe = "urn:li:digitalmediaRecipe:feedshare-video";

    // Step 1: Register the upload
    const registerResponse = await fetch(
      `${this.baseURL}/assets?action=registerUpload`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          "Content-Type": "application/json",
          "X-Restli-Protocol-Version": "2.0.0",
        },
        body: JSON.stringify({
          registerUploadRequest: {
            recipes: [recipe],
            owner: author,
            serviceRelationships: [
              {
                relationshipType: "OWNER",
                identifier: "urn:li:userGeneratedContent",
              },
            ],
          },
        }),
      }
    );

    if (!registerResponse.ok) {
      const errorData = await registerResponse.json().catch(() => ({}));
      throw new Error(
        `Failed to register video upload: ${registerResponse.status} ${
          registerResponse.statusText
        }. ${errorData.message || JSON.stringify(errorData)}`
      );
    }

    const registerData = await registerResponse.json();
    const uploadUrl =
      registerData.value.uploadMechanism[
        "com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest"
      ].uploadUrl;
    const assetUrn = registerData.value.asset;

    // Step 2: Upload the video file
    const uploadResponse = await fetch(uploadUrl, {
      method: "PUT",
      headers: {
        "Content-Type": contentType,
      },
      body: buffer as BodyInit,
    });

    if (!uploadResponse.ok) {
      throw new Error(
        `Failed to upload video file: ${uploadResponse.status} ${uploadResponse.statusText}`
      );
    }

    return assetUrn;
  }

  /**
   * Publish a post to LinkedIn (personal profile or organization)
   * Based on Community Management API for organization posting
   */
  async publishPost(
    content: string,
    authorUrn?: string,
    imageAssetUrn?: string,
    documentAssetUrn?: string,
    videoAssetUrn?: string
  ): Promise<LinkedInPostResponse> {
    let author: string;

    if (authorUrn) {
      // Use provided URN (for organization posting)
      author = authorUrn;
    } else {
      // Get the user's LinkedIn ID for personal posting
      const linkedinId = await this.getLinkedInId();
      author = `urn:li:person:${linkedinId}`;
    }

    // Determine shareMediaCategory and media array
    // Priority: Video > Document > Image
    let shareMediaCategory: "NONE" | "IMAGE" | "ARTICLE" | "VIDEO" = "NONE";
    const media: any[] = [];

    if (videoAssetUrn) {
      // Videos use VIDEO category
      shareMediaCategory = "VIDEO";
      media.push({
        status: "READY",
        media: videoAssetUrn,
      });
    } else if (documentAssetUrn) {
      // Documents take priority (ARTICLE category)
      shareMediaCategory = "ARTICLE";
      media.push({
        status: "READY",
        media: documentAssetUrn,
      });
    } else if (imageAssetUrn) {
      // Images use IMAGE category
      shareMediaCategory = "IMAGE";
      media.push({
        status: "READY",
        media: imageAssetUrn,
      });
    }

    const postData: any = {
      author: author,
      lifecycleState: "PUBLISHED",
      specificContent: {
        "com.linkedin.ugc.ShareContent": {
          shareCommentary: {
            text: content,
          },
          shareMediaCategory: shareMediaCategory,
        },
      },
      visibility: {
        "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC",
      },
    };

    // Add media array if we have assets
    if (media.length > 0) {
      postData.specificContent["com.linkedin.ugc.ShareContent"].media = media;
    }

    const response = await fetch(`${this.baseURL}/ugcPosts`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        "Content-Type": "application/json",
        "X-Restli-Protocol-Version": "2.0.0",
      },
      body: JSON.stringify(postData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        `LinkedIn API error: ${response.status} ${response.statusText}. ${
          errorData.message || "Failed to publish post"
        }`
      );
    }

    return response.json();
  }

  /**
   * Get accessible organizations for the authenticated user
   * Based on Community Management API organization access
   */
  async getAccessibleOrganizations(): Promise<LinkedInOrganization[]> {
    try {
      const response = await fetch(
        `${this.baseURL}/organizationAcls?q=roleAssignee&role=ADMINISTRATOR&state=APPROVED`,
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
          },
        }
      );

      if (!response.ok) {
        if (response.status === 403 || response.status === 401) {
          return [];
        }
        throw new Error(`LinkedIn API error: ${response.status}`);
      }

      const data = await response.json();
      if (!data.elements || data.elements.length === 0) {
        return [];
      }

      // Extract organization IDs from URNs
      const orgIds = data.elements.map((element: any) => {
        const orgUrn = element.organization;
        const match = orgUrn.match(/urn:li:organization:(\d+)/);
        return match ? match[1] : orgUrn;
      });

      // Fetch organization details
      const orgDetails = await Promise.all(
        orgIds.map(async (orgId: string) => {
          try {
            const orgResponse = await fetch(
              `${this.baseURL}/organizations/${orgId}`,
              {
                headers: {
                  Authorization: `Bearer ${this.accessToken}`,
                },
              }
            );

            if (orgResponse.ok) {
              const orgData = await orgResponse.json();
              return {
                id: orgData.id,
                name:
                  orgData.localizedName ||
                  orgData.name ||
                  `Organization ${orgId}`,
                vanityName: orgData.vanityName,
                logoUrl:
                  orgData.logoV2?.original || orgData.logoUrl || undefined,
              };
            }
            return null;
          } catch (error) {
            console.error(`Error fetching org ${orgId}:`, error);
            return null;
          }
        })
      );

      return orgDetails.filter(
        (org): org is LinkedInOrganization => org !== null
      );
    } catch (error) {
      console.error("Could not fetch accessible organizations:", error);
      return [];
    }
  }

  /**
   * Get post performance metrics for personal page posts
   * Uses memberCreatorPostAnalytics endpoint
   */
  async getPostMetricsPersonal(postId: string): Promise<LinkedInPostMetrics> {
    try {
      const queryTypes = [
        "IMPRESSION",
        "MEMBERS_REACHED",
        "RESHARE",
        "REACTION",
        "COMMENT",
      ];
      const metricsData: Record<string, number> = {};

      // Query each metric type separately
      for (const queryType of queryTypes) {
        try {
          const response = await fetch(
            `https://api.linkedin.com/rest/memberCreatorPostAnalytics?q=entity&entity=(share:${encodeURIComponent(
              postId
            )})&queryType=${queryType}`,
            {
              headers: {
                "X-Restli-Protocol-Version": "2.0.0",
                Authorization: `Bearer ${this.accessToken}`,
                "Linkedin-Version": "202509",
                "Content-Type": "application/json",
              },
            }
          );

          if (response.ok) {
            const data = await response.json();
            // Extract count from the response elements
            if (data.elements && data.elements.length > 0) {
              metricsData[queryType] = data.elements[0].count || 0;
            } else {
              metricsData[queryType] = 0;
            }
          } else {
            console.warn(
              `Failed to fetch ${queryType} metrics: ${response.status}`
            );
            metricsData[queryType] = 0;
          }
        } catch (error) {
          console.warn(`Error fetching ${queryType} metrics:`, error);
          metricsData[queryType] = 0;
        }
      }

      // Map the metrics to our interface
      const metrics: LinkedInPostMetrics = {
        impressions: metricsData.IMPRESSION || 0,
        likes: metricsData.REACTION || 0, // REACTION includes likes
        comments: metricsData.COMMENT || 0,
        shares: metricsData.RESHARE || 0, // RESHARE is shares
        clicks: metricsData.MEMBERS_REACHED || 0, // MEMBERS_REACHED is closest to clicks
      };

      // Calculate engagement rate
      if (metrics.impressions > 0) {
        const totalEngagement =
          metrics.likes + metrics.comments + metrics.shares;
        metrics.engagementRate = totalEngagement / metrics.impressions;
      }

      return metrics;
    } catch (error) {
      console.error("Could not fetch personal post metrics:", error);
      throw new Error("Failed to get personal post metrics");
    }
  }

  /**
   * Get post performance metrics for organization page posts
   * Uses organizationalEntityShareStatistics endpoint
   */
  async getPostMetricsOrganization(
    postId: string,
    organizationId: string
  ): Promise<LinkedInPostMetrics> {
    try {
      const response = await fetch(
        `https://api.linkedin.com/rest/organizationalEntityShareStatistics?q=organizationalEntity&organizationalEntity=urn%3Ali%3Aorganization%3A${organizationId}&shares=List(${encodeURIComponent(
          postId
        )})`,
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            "LinkedIn-Version": "202509",
            "X-Restli-Protocol-Version": "2.0.0",
          },
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = `LinkedIn organization metrics API error: ${response.status}`;

        // Parse error details for better debugging
        try {
          const errorData = JSON.parse(errorText);
          if (errorData.message) {
            errorMessage += ` - ${errorData.message}`;
          }
        } catch {
          // If we can't parse the error, just use the status
        }

        throw new Error(errorMessage);
      }

      const data = await response.json();

      // Extract metrics from the response - access first element of elements array
      let metrics: LinkedInPostMetrics = {
        impressions: 0,
        likes: 0,
        comments: 0,
        shares: 0,
        clicks: 0,
      };

      if (data.elements && data.elements.length > 0) {
        const shareStats = data.elements[0].totalShareStatistics;
        if (shareStats) {
          metrics = {
            impressions: shareStats.impressionCount || 0,
            likes: shareStats.likeCount || 0,
            comments: shareStats.commentCount || 0,
            shares: shareStats.shareCount || 0,
            clicks: shareStats.clickCount || 0,
          };
        }
      }

      // Calculate engagement rate
      if (metrics.impressions > 0) {
        const totalEngagement =
          metrics.likes + metrics.comments + metrics.shares;
        metrics.engagementRate = totalEngagement / metrics.impressions;
      }

      return metrics;
    } catch (error) {
      // Re-throw with more context if it's already a LinkedIn API error
      if (
        error instanceof Error &&
        error.message.includes("LinkedIn organization metrics API error")
      ) {
        throw error;
      }
      throw new Error(
        `Failed to get organization post metrics: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  /**
   * Get post performance metrics
   * Determines whether to use personal or organization API based on organizationId
   */
  async getPostMetrics(
    postId: string,
    organizationId?: string
  ): Promise<LinkedInPostMetrics> {
    if (organizationId) {
      return this.getPostMetricsOrganization(postId, organizationId);
    } else {
      return this.getPostMetricsPersonal(postId);
    }
  }
}
