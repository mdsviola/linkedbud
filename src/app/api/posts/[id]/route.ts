import { NextRequest, NextResponse } from "next/server";
import { createServerClient, supabaseAdmin } from "@/lib/supabase-server";
import { getSignedStorageUrl } from "@/lib/storage";
import {
  generateStoragePath,
  uploadFileToStorage,
  deleteFileFromStorageByUrl,
} from "@/lib/storage";
import { canUserAccessPost } from "@/lib/portfolio-posts";

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;

    // First, check if user can access this post (handles portfolio access rules)
    const canAccess = await canUserAccessPost(user.id, parseInt(id));
    if (!canAccess) {
      return NextResponse.json(
        { error: "Post not found" },
        {
          status: 404,
          headers: {
            "Cache-Control": "no-store, no-cache, must-revalidate",
            Pragma: "no-cache",
          },
        }
      );
    }

    // Fetch the post (without user_id filter since we've already verified access)
    // Use admin client to bypass RLS for posts query
    const { data: post, error } = await supabaseAdmin
      .from("posts")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !post) {
      return NextResponse.json(
        { error: "Post not found" },
        {
          status: 404,
          headers: {
            "Cache-Control": "no-store, no-cache, must-revalidate",
            Pragma: "no-cache",
          },
        }
      );
    }

    // Fetch linkedin_posts separately using admin client
    // (RLS on linkedin_posts blocks portfolio members from seeing other users' linkedin_posts)
    const { data: linkedinPosts } = await supabaseAdmin
      .from("linkedin_posts")
      .select("linkedin_post_id, status, published_at, organization_id")
      .eq("post_id", id);

    // Attach linkedin_posts to the post object
    const postWithLinkedInPosts = {
      ...post,
      linkedin_posts: linkedinPosts || [],
    };

    // Generate signed URLs for image and document if they exist
    const postWithSignedUrls = { ...postWithLinkedInPosts };
    if (postWithSignedUrls.image_url) {
      // Only generate signed URL if it's a path, not already a full URL
      if (!postWithSignedUrls.image_url.startsWith("http://") && !postWithSignedUrls.image_url.startsWith("https://")) {
        const signedImageUrl = await getSignedStorageUrl(supabase, postWithSignedUrls.image_url);
        if (signedImageUrl) {
          postWithSignedUrls.image_url = signedImageUrl;
        } else {
          // If signed URL generation fails, set to null to avoid showing broken images
          postWithSignedUrls.image_url = null;
        }
      }
      // If it's already a full URL, keep it as is
    }
    if (postWithSignedUrls.document_url) {
      // Only generate signed URL if it's a path, not already a full URL
      if (!postWithSignedUrls.document_url.startsWith("http://") && !postWithSignedUrls.document_url.startsWith("https://")) {
        const signedDocumentUrl = await getSignedStorageUrl(supabase, postWithSignedUrls.document_url);
        if (signedDocumentUrl) {
          postWithSignedUrls.document_url = signedDocumentUrl;
        } else {
          // If signed URL generation fails, set to null to avoid showing broken links
          postWithSignedUrls.document_url = null;
        }
      }
      // If it's already a full URL, keep it as is
    }
    if (postWithSignedUrls.video_url) {
      // Only generate signed URL if it's a path, not already a full URL
      if (!postWithSignedUrls.video_url.startsWith("http://") && !postWithSignedUrls.video_url.startsWith("https://")) {
        const signedVideoUrl = await getSignedStorageUrl(supabase, postWithSignedUrls.video_url);
        if (signedVideoUrl) {
          postWithSignedUrls.video_url = signedVideoUrl;
        } else {
          // If signed URL generation fails, set to null to avoid showing broken videos
          postWithSignedUrls.video_url = null;
        }
      }
      // If it's already a full URL, keep it as is
    }

    return NextResponse.json(
      { post: postWithSignedUrls },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
          Pragma: "no-cache",
        },
      }
    );
  } catch (error) {
    console.error("Error in posts GET API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;

    // Parse FormData
    const formData = await request.formData();

    // Extract form fields
    const status = formData.get("status") as string | null;
    const content = formData.get("content") as string | null;
    const scheduled_publish_date = formData.get("scheduled_publish_date") as string | null;
    const publish_target = formData.get("publish_target") as string | null;
    const source_url = formData.get("source_url") as string | null;
    const source_title = formData.get("source_title") as string | null;
    const source_content = formData.get("source_content") as string | null;
    const two_para_summary = formData.get("two_para_summary") as string | null;

    // Extract files - check if they're valid File instances with size > 0
    const imageFileValue = formData.get("imageFile");
    const documentFileValue = formData.get("documentFile");
    const videoFileValue = formData.get("videoFile");
    const imageFile =
      imageFileValue instanceof File && imageFileValue.size > 0
        ? imageFileValue
        : null;
    const documentFile =
      documentFileValue instanceof File && documentFileValue.size > 0
        ? documentFileValue
        : null;
    const videoFile =
      videoFileValue instanceof File && videoFileValue.size > 0
        ? videoFileValue
        : null;

    // Validate video file size (max 100MB)
    if (videoFile && videoFile.size > 100 * 1024 * 1024) {
      return NextResponse.json(
        { error: "Video file size must be less than 100MB. Your file is " + (videoFile.size / (1024 * 1024)).toFixed(2) + "MB" },
        { status: 400 }
      );
    }

    // Check for file removal flags
    const removeImage = formData.get("removeImage") === "true";
    const removeDocument = formData.get("removeDocument") === "true";
    const removeVideo = formData.get("removeVideo") === "true";

    // Validate that at least one field is provided
    if (
      !status &&
      !content &&
      scheduled_publish_date === null &&
      publish_target === null &&
      !imageFile &&
      !documentFile &&
      !videoFile &&
      !removeImage &&
      !removeDocument &&
      !removeVideo &&
      source_url === null &&
      source_title === null &&
      source_content === null &&
      two_para_summary === null
    ) {
      return NextResponse.json(
        {
          error:
            "At least one field (status, content, scheduled_publish_date, publish_target, files, or source info) is required",
        },
        { status: 400 }
      );
    }

    // Validate status if provided
    if (
      status &&
      !["DRAFT", "SCHEDULED", "PUBLISHED", "ARCHIVED"].includes(status)
    ) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    // Validate content if provided
    // FormData.get() returns null if field is not present, string if present
    if (content !== null) {
      if (typeof content !== "string") {
        return NextResponse.json(
          { error: "content must be a string" },
          { status: 400 }
        );
      }
      if (content.trim().length === 0) {
        return NextResponse.json(
          { error: "content cannot be empty" },
          { status: 400 }
        );
      }
    }

    // Validate scheduled_publish_date if provided
    // FormData.get() returns null if field is not present, string if present
    if (scheduled_publish_date !== null && scheduled_publish_date !== "") {
      const scheduledDate = new Date(scheduled_publish_date);
      if (isNaN(scheduledDate.getTime())) {
        return NextResponse.json(
          { error: "Invalid scheduled_publish_date format" },
          { status: 400 }
        );
      }

      // Check if the scheduled date is in the future
      const now = new Date();
      if (scheduledDate <= now) {
        return NextResponse.json(
          { error: "Scheduled date must be in the future" },
          { status: 400 }
        );
      }
    }

    // Validate publish_target if provided
    // FormData.get() returns null if field is not present, string if present
    if (publish_target !== null && publish_target !== "") {
      // Must be either "personal" or a valid organization ID
      if (publish_target !== "personal") {
        // Validate that it's a valid organization ID for this user
        const { data: org, error: orgError } = await supabase
          .from("linkedin_organizations")
          .select("linkedin_org_id")
          .eq("user_id", user.id)
          .eq("linkedin_org_id", publish_target)
          .single();

        if (orgError || !org) {
          return NextResponse.json(
            { error: "Invalid organization ID or organization not found" },
            { status: 400 }
          );
        }
      }
    }

    const { data: post, error: fetchError } = await supabase
      .from("posts")
      .select(
        `
        user_id,
        status,
        image_url,
        document_url,
        video_url,
        linkedin_posts(
          linkedin_post_id,
          status
        )
      `
      )
      .eq("id", id)
      .single();

    if (fetchError || !post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    if (post.user_id !== user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Prevent moving published posts with LinkedIn posts to draft
    if (status === "DRAFT" && post.status === "PUBLISHED") {
      const hasLinkedInPosts = post.linkedin_posts?.some(
        (linkedinPost: any) =>
          linkedinPost.status === "PUBLISHED" && linkedinPost.linkedin_post_id
      );

      if (hasLinkedInPosts) {
        return NextResponse.json(
          {
            error:
              "Cannot move to drafts: This post is connected to a LinkedIn post",
          },
          { status: 400 }
        );
      }
    }

    // Prepare update object
    const updateData: any = {};
    if (status) updateData.status = status;

    // Handle scheduled_publish_date and auto-update status
    // FormData.get() returns null if field is not present, so check !== null
    if (scheduled_publish_date !== null) {
      if (scheduled_publish_date === "") {
        // Clear scheduled date and revert to DRAFT
        updateData.scheduled_publish_date = null;
        updateData.publish_target = null;
        updateData.status = "DRAFT";
      } else if (scheduled_publish_date) {
        // Set scheduled date and update status to SCHEDULED
        updateData.scheduled_publish_date = scheduled_publish_date;
        updateData.status = "SCHEDULED";
      }
    }

    // Handle publish_target
    // FormData.get() returns null if field is not present
    if (publish_target !== null) {
      updateData.publish_target = publish_target || null;
    }

    // Handle content update
    if (content !== null) {
      updateData.content = content.trim();
    }

    // Handle source info updates
    if (source_url !== null) updateData.source_url = source_url || null;
    if (source_title !== null) updateData.source_title = source_title || null;
    if (source_content !== null) updateData.source_content = source_content || null;
    if (two_para_summary !== null) updateData.two_para_summary = two_para_summary || "";

    // Handle file uploads and removals
    let newImagePath: string | null | undefined = undefined;
    let newDocumentPath: string | null | undefined = undefined;
    let newVideoPath: string | null | undefined = undefined;

    // Handle image file
    if (removeImage) {
      // Delete existing image file
      if (post.image_url) {
        await deleteFileFromStorageByUrl(supabase, post.image_url);
      }
      newImagePath = null;
    } else if (imageFile) {
      // Upload new image file
      // Delete old image file if exists
      if (post.image_url) {
        await deleteFileFromStorageByUrl(supabase, post.image_url);
      }
      try {
        const storagePath = generateStoragePath(
          user.id,
          parseInt(id),
          "images",
          imageFile.name
        );
        newImagePath = await uploadFileToStorage(supabase, imageFile, storagePath);
        if (!newImagePath) {
          console.error("Failed to upload image file");
          // Continue without failing update
        }
      } catch (error) {
        console.error("Error uploading image file:", error);
        // Continue without failing update
      }
    }

    // Handle document file
    if (removeDocument) {
      // Delete existing document file
      if (post.document_url) {
        await deleteFileFromStorageByUrl(supabase, post.document_url);
      }
      newDocumentPath = null;
    } else if (documentFile) {
      // Upload new document file
      // Delete old document file if exists
      if (post.document_url) {
        await deleteFileFromStorageByUrl(supabase, post.document_url);
      }
      try {
        const storagePath = generateStoragePath(
          user.id,
          parseInt(id),
          "docs",
          documentFile.name
        );
        newDocumentPath = await uploadFileToStorage(
          supabase,
          documentFile,
          storagePath
        );
        if (!newDocumentPath) {
          console.error("Failed to upload document file");
          // Continue without failing update
        }
      } catch (error) {
        console.error("Error uploading document file:", error);
        // Continue without failing update
      }
    }

    // Handle video file
    if (removeVideo) {
      // Delete existing video file
      if (post.video_url) {
        await deleteFileFromStorageByUrl(supabase, post.video_url);
      }
      newVideoPath = null;
    } else if (videoFile) {
      // Upload new video file
      // Delete old video file if exists
      if (post.video_url) {
        await deleteFileFromStorageByUrl(supabase, post.video_url);
      }
      try {
        const storagePath = generateStoragePath(
          user.id,
          parseInt(id),
          "videos",
          videoFile.name
        );
        newVideoPath = await uploadFileToStorage(supabase, videoFile, storagePath);
        if (!newVideoPath) {
          console.error("Failed to upload video file");
          return NextResponse.json(
            { error: "Failed to upload video file. The file may be too large or there was an upload error. Please try a smaller file or check your connection." },
            { status: 500 }
          );
        }
      } catch (error) {
        console.error("Error uploading video file:", error);
        // Check if it's a size-related error
        if (error instanceof Error && (error.message.includes("size") || error.message.includes("too large") || error.message.includes("limit"))) {
          return NextResponse.json(
            { error: "Video file is too large. Maximum size is 100MB. Please compress your video or use a smaller file." },
            { status: 400 }
          );
        }
        return NextResponse.json(
          { error: "Failed to upload video file: " + (error instanceof Error ? error.message : "Unknown error") },
          { status: 500 }
        );
      }
    }

    // Update file paths in updateData if changed
    if (newImagePath !== undefined) updateData.image_url = newImagePath;
    if (newDocumentPath !== undefined) updateData.document_url = newDocumentPath;
    if (newVideoPath !== undefined) updateData.video_url = newVideoPath;

    const { error: updateError } = await supabase
      .from("posts")
      .update(updateData)
      .eq("id", id)
      .eq("user_id", user.id);

    if (updateError) {
      console.error("Error updating post:", updateError);
      return NextResponse.json(
        { error: "Failed to update post" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in posts update API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;

    const { data: post, error: fetchError } = await supabase
      .from("posts")
      .select("user_id, image_url, document_url, video_url")
      .eq("id", id)
      .single();

    if (fetchError || !post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    if (post.user_id !== user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Delete associated files from storage before deleting post
    if (post.image_url) {
      try {
        await deleteFileFromStorageByUrl(supabase, post.image_url);
      } catch (error) {
        console.error("Error deleting image file:", error);
        // Continue with post deletion even if file deletion fails
      }
    }

    if (post.document_url) {
      try {
        await deleteFileFromStorageByUrl(supabase, post.document_url);
      } catch (error) {
        console.error("Error deleting document file:", error);
        // Continue with post deletion even if file deletion fails
      }
    }

    if (post.video_url) {
      try {
        await deleteFileFromStorageByUrl(supabase, post.video_url);
      } catch (error) {
        console.error("Error deleting video file:", error);
        // Continue with post deletion even if file deletion fails
      }
    }

    const { error: deleteError } = await supabase
      .from("posts")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (deleteError) {
      console.error("Error deleting post:", deleteError);
      return NextResponse.json(
        { error: "Failed to delete post" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in posts delete API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
