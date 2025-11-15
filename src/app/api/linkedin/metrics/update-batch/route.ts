import { NextRequest, NextResponse } from "next/server";
import { updateMetricsForRecentPosts } from "@/lib/linkedin-metrics-server";

export async function POST(request: NextRequest) {
  try {
    // This endpoint is designed to be called by a cron job
    // You might want to add authentication/authorization here
    // For example, check for a secret token in headers

    const authHeader = request.headers.get("authorization");
    const expectedToken = process.env.CRON_SECRET;

    if (expectedToken && authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("Starting batch metrics update...");

    await updateMetricsForRecentPosts();

    console.log("Batch metrics update completed");

    return NextResponse.json({
      success: true,
      message: "Batch metrics update completed successfully",
    });
  } catch (error) {
    console.error("Error in batch metrics update:", error);
    return NextResponse.json(
      { error: "Batch metrics update failed" },
      { status: 500 }
    );
  }
}
