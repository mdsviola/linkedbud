import { NextRequest, NextResponse } from "next/server";
import { createServerClient, supabaseAdmin } from "@/lib/supabase-server";
import {
  generateFeedbackScreenshotPath,
  uploadFileToStorage,
  downloadFileFromStorage,
} from "@/lib/storage";
import { sendFeedbackSubmissionEmail } from "@/lib/email";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

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

    // Get user profile to get email
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("email")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: "User profile not found" },
        { status: 404 }
      );
    }

    // Parse FormData
    const formData = await request.formData();

    // Extract form fields
    const type = (formData.get("type") as string | null)?.trim();
    const message = (formData.get("message") as string | null)?.trim();
    const deviceInfoStr = (formData.get("device_info") as string | null)?.trim();

    // Validate required fields
    if (!type || !["issue", "idea", "other"].includes(type)) {
      return NextResponse.json(
        { error: "Invalid feedback type" },
        { status: 400 }
      );
    }

    if (!message) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    // Parse device info
    let deviceInfo: Record<string, any> | null = null;
    if (deviceInfoStr) {
      try {
        deviceInfo = JSON.parse(deviceInfoStr);
      } catch (e) {
        console.error("Failed to parse device_info:", e);
      }
    }

    // Extract screenshot file
    const screenshotFileValue = formData.get("screenshot");
    const screenshotFile =
      screenshotFileValue instanceof File && screenshotFileValue.size > 0
        ? screenshotFileValue
        : null;

    // Step 1: Insert feedback record first to get feedback_id
    const { data: feedback, error: insertError } = await supabase
      .from("feedback_submissions")
      .insert({
        user_id: user.id,
        email: profile.email,
        type,
        message,
        device_info: deviceInfo,
        status: "new",
      })
      .select("id")
      .single();

    if (insertError || !feedback) {
      console.error("Error inserting feedback:", insertError);
      return NextResponse.json(
        { error: "Failed to save feedback" },
        { status: 500 }
      );
    }

    const feedbackId = feedback.id;

    // Step 2: Upload screenshot if provided
    let screenshotUrl: string | null = null;
    let screenshotFilename: string | null = null;
    if (screenshotFile) {
      try {
        const timestamp = Date.now();
        const extension = screenshotFile.name.split(".").pop() || "png";
        screenshotFilename = screenshotFile.name || `screenshot-${feedbackId}.${extension}`;
        const storagePath = generateFeedbackScreenshotPath(
          user.id,
          feedbackId,
          timestamp,
          extension
        );

        const uploadedPath = await uploadFileToStorage(
          supabase,
          screenshotFile,
          storagePath
        );

        if (uploadedPath) {
          screenshotUrl = uploadedPath;

          // Step 3: Update feedback record with screenshot_url
          // Use admin client to bypass RLS for the update since we need to update
          // the record we just created (RLS might block user updates)
          const { error: updateError } = await supabaseAdmin
            .from("feedback_submissions")
            .update({ screenshot_url: screenshotUrl })
            .eq("id", feedbackId);

          if (updateError) {
            console.error("Error updating feedback with screenshot:", updateError);
            console.error("Update error details:", JSON.stringify(updateError, null, 2));
            // Don't fail the request, but log the error for debugging
            // The file is uploaded but the URL isn't saved to the database
          } else {
            console.log(`Successfully updated feedback ${feedbackId} with screenshot URL: ${screenshotUrl}`);
          }
        } else {
          console.error("Failed to upload screenshot - uploadedPath is null");
        }
      } catch (error) {
        console.error("Error uploading screenshot:", error);
        // Don't fail the request if screenshot upload fails
        // The feedback is already saved without the screenshot
      }
    }

    // Step 4: Send notification email to support
    // Download screenshot if it was uploaded, to attach to email
    let screenshotBuffer: Buffer | null = null;
    if (screenshotUrl) {
      try {
        screenshotBuffer = await downloadFileFromStorage(supabase, screenshotUrl);
        if (!screenshotBuffer) {
          console.warn("Could not download screenshot for email attachment, continuing without it");
        }
      } catch (error) {
        console.error("Error downloading screenshot for email:", error);
        // Continue without screenshot attachment
      }
    }

    // Send email (don't await - send asynchronously to not block the response)
    sendFeedbackSubmissionEmail(
      type as "issue" | "idea" | "other",
      message,
      profile.email,
      feedbackId.toString(),
      screenshotBuffer,
      screenshotFilename
    ).catch((error) => {
      // Log error but don't fail the request
      console.error("Error sending feedback notification email:", error);
    });

    return NextResponse.json(
      {
        success: true,
        feedbackId,
        message: "Feedback submitted successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error submitting feedback:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

