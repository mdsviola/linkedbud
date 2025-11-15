/**
 * Generate LinkedIn post URL for viewing the post on LinkedIn
 * @param linkedinPostId - The LinkedIn post ID (e.g., "urn:li:share:123456789" or "urn:li:ugcPost:123456789")
 * @param organizationId - Optional organization ID for organization posts
 * @returns The LinkedIn post URL
 */
export function generateLinkedInPostURL(
  linkedinPostId: string,
  organizationId?: string | null
): string {
  // Extract the numeric ID from the URN format
  // Handle both urn:li:share: and urn:li:ugcPost: formats
  const shareMatch = linkedinPostId.match(/urn:li:share:(\d+)/);
  const ugcMatch = linkedinPostId.match(/urn:li:ugcPost:(\d+)/);

  let postId: string;

  if (shareMatch) {
    postId = shareMatch[1];
  } else if (ugcMatch) {
    postId = ugcMatch[1];
  } else {
    throw new Error(`Invalid LinkedIn post ID format: ${linkedinPostId}`);
  }

  if (organizationId) {
    // For organization posts, use the organization-specific URL format
    return `https://www.linkedin.com/feed/update/urn:li:share:${postId}/`;
  } else {
    // For personal posts, use the standard post URL format
    return `https://www.linkedin.com/feed/update/urn:li:share:${postId}/`;
  }
}
