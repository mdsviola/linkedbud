import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";
import { LinkedInAPI, getLinkedInToken } from "@/lib/linkedin";
import { downloadFileFromStorage, extractFilePathFromUrl } from "@/lib/storage";

export const dynamic = 'force-dynamic';

async function logLinkedInPost(
  userId: string,
  postId: number,
  linkedinPostId: string,
  content: string,
  status: "PUBLISHED" | "FAILED",
  organizationId?: string,
  errorMessage?: string
): Promise<void> {
  const supabase = createServerClient();

  // Log the LinkedIn post
  const linkedinPostRecord: any = {
    user_id: userId,
    post_id: postId,
    content: content,
    status: status,
    organization_id: organizationId,
  };

  if (status === "PUBLISHED") {
    linkedinPostRecord.linkedin_post_id = linkedinPostId;
    linkedinPostRecord.published_at = new Date().toISOString();
  } else {
    linkedinPostRecord.error_message = errorMessage;
  }

  const { error: logError } = await supabase
    .from("linkedin_posts")
    .insert(linkedinPostRecord);

  if (logError) {
    console.error(`Error logging LinkedIn post (${status}):`, logError);
    // Don't fail the request if logging fails
  }

  // Update the original post status if it was published successfully
  if (status === "PUBLISHED") {
    // Determine publish_target based on organizationId
    // This ensures the post appears in the correct tab (personal vs organization)
    const publishTarget = organizationId || "personal";

    const { error: updateError } = await supabase
      .from("posts")
      .update({
        status: "PUBLISHED",
        published_at: new Date().toISOString(),
        publish_target: publishTarget, // Set publish target for tab filtering
      })
      .eq("id", postId)
      .eq("user_id", userId);

    if (updateError) {
      console.error("Error updating post status:", updateError);
      // Don't fail the request if status update fails
    }
  }
}

export async function POST(request: NextRequest) {
  let postId: number | undefined;
  let content: string | undefined;
  let organizationId: string | undefined;

  try {
    const supabase = createServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const requestData = await request.json();
    postId = requestData.postId;
    content = requestData.content;
    const publishTo = requestData.publishTo || "personal"; // "personal" or organization ID

    if (!postId || !content) {
      return NextResponse.json(
        { error: "Post ID and content are required" },
        { status: 400 }
      );
    }

    // Validate publishTo value
    if (publishTo !== "personal" && typeof publishTo !== "string") {
      return NextResponse.json(
        { error: "Invalid publishTo value. Must be 'personal' or an organization ID." },
        { status: 400 }
      );
    }

    // Fetch post data including attachments
    const { data: post, error: postError } = await supabase
      .from("posts")
      .select("image_url, document_url, video_url")
      .eq("id", postId)
      .eq("user_id", user.id)
      .single();

    if (postError || !post) {
      return NextResponse.json(
        { error: "Post not found" },
        { status: 404 }
      );
    }

    // Get LinkedIn token for publishing
    // IMPORTANT: Strictly check for "personal" - must be exact string match
    const isPersonal = publishTo === "personal";
    const tokenType = isPersonal ? "personal" : "community";

    console.log(`[Publish] Publishing to: ${publishTo}, Token type: ${tokenType}, Is personal: ${isPersonal}`);

    const token = await getLinkedInToken(user.id, tokenType);

    if (!token) {
      const errorMessage =
        tokenType === "personal"
          ? "LinkedIn account not connected or token expired. Please reconnect your LinkedIn account in Settings."
          : "Community management token missing or expired. Please connect community management in Settings.";
      return NextResponse.json({ error: errorMessage }, { status: 400 });
    }

    // Verify token type matches what we requested
    if (token.type && token.type !== tokenType) {
      console.error(`[Publish] Token type mismatch! Requested: ${tokenType}, Got: ${token.type}`);
      return NextResponse.json(
        { error: `Token type mismatch. Expected ${tokenType} token but got ${token.type}.` },
        { status: 500 }
      );
    }

    const accessToken = token.access_token;

    // Determine authorUrn based on publish target
    // CRITICAL: For personal posts, authorUrn MUST be undefined
    // For organization posts, authorUrn must be the organization URN
    let authorUrn: string | undefined;

    if (isPersonal) {
      // For personal posts: authorUrn must be undefined so LinkedInClient uses personal profile
      authorUrn = undefined;
      organizationId = undefined; // Personal posts don't have an organization ID
      console.log(`[Publish] Publishing to personal profile - authorUrn: ${authorUrn}, organizationId: ${organizationId}`);
    } else {
      // For organization posts: use the publishTo value as organization ID
      // Validate that publishTo is a valid organization ID (numeric string)
      if (!/^\d+$/.test(publishTo)) {
        return NextResponse.json(
          { error: `Invalid organization ID: ${publishTo}. Organization ID must be numeric.` },
          { status: 400 }
        );
      }
      authorUrn = `urn:li:organization:${publishTo}`;
      organizationId = publishTo; // Store the organization ID for tracking
      console.log(`[Publish] Publishing to organization - authorUrn: ${authorUrn}, organizationId: ${organizationId}`);
    }

    // Create LinkedIn API instance with the correct token
    const linkedinAPI = new LinkedInAPI(accessToken);

    // Handle attachments: download and upload to LinkedIn
    let imageAssetUrn: string | undefined;
    let documentAssetUrn: string | undefined;
    let videoAssetUrn: string | undefined;

    // Helper function to extract filename from storage path
    const getFilenameFromPath = (path: string | null): string => {
      if (!path) return "file";
      // Extract filename from path (e.g., "posts/user/post/images/image.jpg" -> "image.jpg")
      const parts = path.split("/");
      return parts[parts.length - 1] || "file";
    };

    // Handle image upload
    if (post.image_url) {
      try {
        // Extract storage path (handle both full URLs and paths)
        let imagePath = post.image_url;
        if (post.image_url.startsWith("http://") || post.image_url.startsWith("https://")) {
          const extracted = extractFilePathFromUrl(post.image_url);
          if (extracted) {
            imagePath = extracted;
          } else {
            console.warn("Could not extract path from image URL, skipping image upload");
            imagePath = null;
          }
        }

        if (imagePath) {
          const imageBuffer = await downloadFileFromStorage(supabase, imagePath);
          if (imageBuffer) {
            const filename = getFilenameFromPath(imagePath);
            imageAssetUrn = await linkedinAPI.uploadImageAsset(
              imageBuffer,
              filename,
              authorUrn
            );
          } else {
            console.warn("Failed to download image from storage, publishing without image");
          }
        }
      } catch (error) {
        console.error("Error uploading image to LinkedIn:", error);
        // Continue without image - publish text-only post
        console.warn("Publishing post without image due to upload error");
      }
    }

    // Handle document upload
    if (post.document_url) {
      try {
        // Extract storage path (handle both full URLs and paths)
        let documentPath = post.document_url;
        if (post.document_url.startsWith("http://") || post.document_url.startsWith("https://")) {
          const extracted = extractFilePathFromUrl(post.document_url);
          if (extracted) {
            documentPath = extracted;
          } else {
            console.warn("Could not extract path from document URL, skipping document upload");
            documentPath = null;
          }
        }

        if (documentPath) {
          const documentBuffer = await downloadFileFromStorage(supabase, documentPath);
          if (documentBuffer) {
            const filename = getFilenameFromPath(documentPath);
            documentAssetUrn = await linkedinAPI.uploadDocumentAsset(
              documentBuffer,
              filename,
              authorUrn
            );
          } else {
            console.warn("Failed to download document from storage, publishing without document");
          }
        }
      } catch (error) {
        console.error("Error uploading document to LinkedIn:", error);
        // Continue without document - publish text-only post
        console.warn("Publishing post without document due to upload error");
      }
    }

    // Handle video upload
    if (post.video_url) {
      try {
        // Extract storage path (handle both full URLs and paths)
        let videoPath = post.video_url;
        if (post.video_url.startsWith("http://") || post.video_url.startsWith("https://")) {
          const extracted = extractFilePathFromUrl(post.video_url);
          if (extracted) {
            videoPath = extracted;
          } else {
            console.warn("Could not extract path from video URL, skipping video upload");
            videoPath = null;
          }
        }

        if (videoPath) {
          const videoBuffer = await downloadFileFromStorage(supabase, videoPath);
          if (videoBuffer) {
            const filename = getFilenameFromPath(videoPath);
            videoAssetUrn = await linkedinAPI.uploadVideoAsset(
              videoBuffer,
              filename,
              authorUrn
            );
          } else {
            console.warn("Failed to download video from storage, publishing without video");
          }
        }
      } catch (error) {
        console.error("Error uploading video to LinkedIn:", error);
        // Continue without video - publish text-only post
        console.warn("Publishing post without video due to upload error");
      }
    }

    // Publish to LinkedIn with optional media
    // Final safety check: ensure authorUrn is undefined for personal posts
    const finalAuthorUrn = isPersonal ? undefined : authorUrn;

    console.log(`[Publish] Final publish call - isPersonal: ${isPersonal}, finalAuthorUrn: ${finalAuthorUrn}`);

    const linkedinResponse = await linkedinAPI.publishPost(
      content,
      finalAuthorUrn,
      imageAssetUrn,
      documentAssetUrn,
      videoAssetUrn
    );

    // Log the LinkedIn post and update post status
    await logLinkedInPost(
      user.id,
      postId,
      linkedinResponse.id,
      content,
      "PUBLISHED",
      organizationId
    );

    // Note: Metrics will be fetched by the cron job (fetch-linkedin-metrics)
    // No need to fetch immediately as LinkedIn metrics aren't available right after publishing

    return NextResponse.json({
      success: true,
      linkedinPostId: linkedinResponse.id,
      message: "Post published to LinkedIn successfully",
      publishTo: publishTo,
    });
  } catch (error) {
    console.error("LinkedIn publish error:", error);

    // Log failed attempt (we already have the data from earlier)
    try {
      const supabase = createServerClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user && postId && content) {
        await logLinkedInPost(
          user.id,
          postId,
          "", // No LinkedIn post ID for failed posts
          content,
          "FAILED",
          organizationId,
          error instanceof Error ? error.message : "Unknown error"
        );
      }
    } catch (logError) {
      console.error("Error logging failed LinkedIn post:", logError);
    }

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to publish to LinkedIn",
      },
      { status: 500 }
    );
  }
}
