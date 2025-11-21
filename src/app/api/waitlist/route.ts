import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import { formatDateTimeLong } from "@/lib/utils";
import {
  sendWaitlistConfirmationEmail,
  sendWaitlistSupportNotificationEmail,
} from "@/lib/email";

export const dynamic = "force-dynamic";

/**
 * POST /api/waitlist
 * Register email for waitlist interest
 * Validates email, checks for duplicates, inserts into waitlist, and sends confirmation email
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = body.email?.trim().toLowerCase();

    // Validate email format
    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    // Check if email already exists in waitlist
    const { data: existing, error: checkError } = await supabaseAdmin
      .from("waitlist")
      .select("id")
      .eq("email", email)
      .single();

    if (checkError && checkError.code !== "PGRST116") {
      // PGRST116 is "not found" error
      console.error("Error checking waitlist:", checkError);
      return NextResponse.json(
        { error: "Failed to check waitlist" },
        { status: 500 }
      );
    }

    // If email already exists, return success (don't reveal that it exists)
    if (existing) {
      // Still send confirmation email in case they didn't receive it
      try {
        const emailSent = await sendWaitlistConfirmationEmail(email);
        if (!emailSent) {
          console.error(
            `Failed to resend waitlist confirmation email to ${email}`
          );
        } else {
          console.log(
            `Waitlist confirmation email resent successfully to ${email}`
          );
        }
      } catch (emailError) {
        console.error("Error resending confirmation email:", emailError);
      }
      return NextResponse.json({
        success: true,
        message: "Thank you for your interest!",
      });
    }

    // Insert into waitlist
    const { data, error: insertError } = await supabaseAdmin
      .from("waitlist")
      .insert({ email })
      .select()
      .single();

    if (insertError) {
      console.error("Error inserting into waitlist:", insertError);
      return NextResponse.json(
        { error: "Failed to register interest" },
        { status: 500 }
      );
    }

    // Get waitlist statistics for support notification
    let waitlistPosition: number | null = null;
    let totalWaitlistCount: number | null = null;
    try {
      // Get total count
      const { count } = await supabaseAdmin
        .from("waitlist")
        .select("*", { count: "exact", head: true });
      totalWaitlistCount = count || null;

      // Get position (count of entries created before this one + 1)
      if (data?.created_at) {
        const { count: positionCount } = await supabaseAdmin
          .from("waitlist")
          .select("*", { count: "exact", head: true })
          .lt("created_at", data.created_at);
        waitlistPosition = positionCount ? positionCount + 1 : null;
      }
    } catch (statsError) {
      console.error("Error getting waitlist statistics:", statsError);
      // Continue without stats - not critical
    }

    // Format signup date
    const signupDate = data?.created_at
      ? formatDateTimeLong(data.created_at)
      : null;

    // Generate admin URL if available
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const adminUrl = `${appUrl}/admin/waitlist`;

    // Send confirmation email to user (fire and forget - don't fail if email fails)
    try {
      const emailSent = await sendWaitlistConfirmationEmail(email);
      if (!emailSent) {
        console.error(
          "Failed to send waitlist confirmation email - email function returned false"
        );
      } else {
        console.log(
          `Waitlist confirmation email sent successfully to ${email}`
        );
      }
    } catch (emailError) {
      console.error("Error sending confirmation email:", emailError);
      // Don't fail the request if email fails
    }

    // Send support notification email (fire and forget - don't fail if email fails)
    try {
      const supportEmailSent = await sendWaitlistSupportNotificationEmail(
        email,
        signupDate,
        waitlistPosition,
        totalWaitlistCount,
        adminUrl
      );
      if (!supportEmailSent) {
        console.error(
          "Failed to send waitlist support notification email - email function returned false"
        );
      } else {
        console.log(
          `Waitlist support notification email sent successfully to support@linkedbud.com`
        );
      }
    } catch (supportEmailError) {
      console.error(
        "Error sending support notification email:",
        supportEmailError
      );
      // Don't fail the request if email fails
    }

    return NextResponse.json({
      success: true,
      message: "Thank you for your interest! We'll be in touch soon.",
    });
  } catch (error) {
    console.error("Error in waitlist registration:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
