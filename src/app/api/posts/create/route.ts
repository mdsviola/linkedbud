import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";
import { generateKeywords } from "@/lib/openai";
import {
  generateStoragePath,
  uploadFileToStorage,
} from "@/lib/storage";
import { getUserPortfolio } from "@/lib/portfolio";

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes for large video uploads
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse FormData
    const formData = await request.formData();

    // Extract form fields - FormData.get() returns null if field not present, string otherwise
    const content = (formData.get("content") as string | null)?.trim() || null;
    const source_url = (formData.get("source_url") as string | null)?.trim() || null;
    const source_title = (formData.get("source_title") as string | null)?.trim() || null;
    const source_content = (formData.get("source_content") as string | null)?.trim() || null;
    const two_para_summary = (formData.get("two_para_summary") as string | null)?.trim() || "";
    const publish_target = (formData.get("publish_target") as string | null)?.trim() || "personal";

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

    // Validate content
    if (!content || content.length === 0) {
      return NextResponse.json(
        { error: "content is required and must be a non-empty string" },
        { status: 400 }
      );
    }

    // Validate publish_target if provided
    let publishTarget: string | null = publish_target || "personal";
    if (publishTarget !== "personal") {
      // Validate that it's a valid organization ID (numeric)
      if (!/^\d+$/.test(publishTarget)) {
        return NextResponse.json(
          { error: `Invalid organization ID: ${publishTarget}. Organization ID must be numeric.` },
          { status: 400 }
        );
      }
      // Verify the organization exists and belongs to the user
      const { data: org, error: orgError } = await supabase
        .from("linkedin_organizations")
        .select("id")
        .eq("user_id", user.id)
        .eq("linkedin_org_id", publishTarget)
        .single();

      if (orgError || !org) {
        return NextResponse.json(
          { error: `Organization not found or you don't have access to it.` },
          { status: 400 }
        );
      }
    }

    // Get user's portfolio to link post
    const portfolio = await getUserPortfolio(user.id);

    // Save post to database first (to get post ID for file paths)
    const { data: post, error: postError } = await supabase
      .from("posts")
      .insert({
        user_id: user.id,
        content: content,
        status: "DRAFT",
        source_url: source_url || null,
        source_title: source_title || null,
        source_content: source_content || null,
        two_para_summary: two_para_summary,
        publish_target: publishTarget, // Save publish target for tab filtering
        portfolio_id: portfolio?.id || null, // Link to portfolio if user has one
      })
      .select()
      .single();

    if (postError) {
      console.error("Error saving post:", postError);
      return NextResponse.json(
        { error: "Failed to save post" },
        { status: 500 }
      );
    }

    // Upload files if present
    let imagePath: string | null = null;
    let documentPath: string | null = null;
    let videoPath: string | null = null;

    if (imageFile) {
      try {
        const storagePath = generateStoragePath(
          user.id,
          post.id,
          "images",
          imageFile.name
        );
        imagePath = await uploadFileToStorage(supabase, imageFile, storagePath);
        if (!imagePath) {
          console.error("Failed to upload image file");
          // Continue without failing post creation
        }
      } catch (error) {
        console.error("Error uploading image file:", error);
        // Continue without failing post creation
      }
    }

    if (documentFile) {
      try {
        const storagePath = generateStoragePath(
          user.id,
          post.id,
          "docs",
          documentFile.name
        );
        documentPath = await uploadFileToStorage(
          supabase,
          documentFile,
          storagePath
        );
        if (!documentPath) {
          console.error("Failed to upload document file");
          // Continue without failing post creation
        }
      } catch (error) {
        console.error("Error uploading document file:", error);
        // Continue without failing post creation
      }
    }

    if (videoFile) {
      try {
        const storagePath = generateStoragePath(
          user.id,
          post.id,
          "videos",
          videoFile.name
        );
        videoPath = await uploadFileToStorage(supabase, videoFile, storagePath);
        if (!videoPath) {
          console.error("Failed to upload video file - uploadFileToStorage returned null");
          // Return error to user instead of silently failing
          return NextResponse.json(
            { error: "Failed to upload video file. The file may be too large or there was an upload error. Please try a smaller file or check your connection." },
            { status: 500 }
          );
        }
      } catch (error) {
        console.error("Error uploading video file:", error);
        if (error instanceof Error) {
          // Check if it's a size-related error
          if (error.message.includes("size") || error.message.includes("too large") || error.message.includes("limit")) {
            return NextResponse.json(
              { error: "Video file is too large. Maximum size is 100MB. Please compress your video or use a smaller file." },
              { status: 400 }
            );
          }
        }
        // Return error to user
        return NextResponse.json(
          { error: "Failed to upload video file: " + (error instanceof Error ? error.message : "Unknown error") },
          { status: 500 }
        );
      }
    }

    // Update post with file paths if files were uploaded
    if (imagePath || documentPath || videoPath) {
      const updateData: { image_url?: string | null; document_url?: string | null; video_url?: string | null } = {};
      if (imagePath !== null) updateData.image_url = imagePath;
      if (documentPath !== null) updateData.document_url = documentPath;
      if (videoPath !== null) updateData.video_url = videoPath;

      const { error: updateError } = await supabase
        .from("posts")
        .update(updateData)
        .eq("id", post.id);

      if (updateError) {
        console.error("Error updating post with file paths:", updateError);
        // Continue - files are uploaded, just path update failed
      } else {
        // Update local post object with file paths
        post.image_url = imagePath;
        post.document_url = documentPath;
        post.video_url = videoPath;
      }
    }

    // Generate keywords synchronously - wait for completion but don't fail if it errors
    if (post && content) {
      try {
        const keywords = await generateKeywords(content.trim());

        if (keywords.length > 0) {
          const supabaseForUpdate = createServerClient();
          await supabaseForUpdate
            .from("posts")
            .update({ keywords })
            .eq("id", post.id);
        }
      } catch (error) {
        console.error("Error generating keywords for post:", post.id, error);
        // Silently fail - keywords are optional, continue with post creation success
      }
    }

    return NextResponse.json({ post });
  } catch (error) {
    console.error("Error creating post:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

