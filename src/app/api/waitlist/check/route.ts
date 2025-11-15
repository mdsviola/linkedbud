import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * GET /api/waitlist/check
 * Returns whether waitlist mode is active (READY_FOR_FINAL_LAUNCH=true)
 * This endpoint is public and allows clients to check waitlist status
 */
export async function GET(request: NextRequest) {
  try {
    const isWaitlistMode = process.env.READY_FOR_FINAL_LAUNCH === "false";

    return NextResponse.json({
      waitlistMode: isWaitlistMode,
    });
  } catch (error) {
    console.error("Error checking waitlist status:", error);
    return NextResponse.json(
      { error: "Failed to check waitlist status" },
      { status: 500 }
    );
  }
}
