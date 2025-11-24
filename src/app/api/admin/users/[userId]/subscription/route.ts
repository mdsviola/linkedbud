import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";
import {
  getPriceIdFromTier,
  getTierFromPriceId,
  type PricingTier,
} from "@/lib/tier-utils";

export const dynamic = 'force-dynamic';

export async function PUT(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const supabase = createServerClient();

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user has admin role
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profileError || !profile || profile.role !== "admin") {
      return NextResponse.json({ error: "Not admin" }, { status: 403 });
    }

    const { userId } = params;
    const body = await request.json();
    const {
      status,
      current_period_end,
      external_subscription_id,
      price_id,
      tier,
    } = body;

    // Handle tier-based subscription management
    let finalPriceId = price_id || null;
    let finalStatus = status;

    // If tier is provided, use it to determine price_id and handle FREE tier
    if (tier) {
      if (tier === "FREE") {
        // For FREE tier, delete the subscription if it exists
        const { error: deleteError } = await supabase
          .from("subscriptions")
          .delete()
          .eq("user_id", userId);

        if (deleteError) {
          console.error("Error deleting subscription:", deleteError);
          return NextResponse.json(
            { error: "Failed to delete subscription" },
            { status: 500 }
          );
        }

        return NextResponse.json({
          success: true,
          message: "Subscription removed (user set to FREE tier)",
        });
      }

      // Get price_id from tier
      finalPriceId = getPriceIdFromTier(tier as PricingTier);
      if (!finalPriceId) {
        return NextResponse.json(
          {
            error: `Price ID not configured for tier ${tier}. Please configure the variant ID in environment variables.`,
          },
          { status: 400 }
        );
      }

      // Auto-set status to active if not provided and tier is not FREE
      if (!finalStatus) {
        finalStatus = "active";
      }
    }

    if (!finalStatus) {
      return NextResponse.json(
        { error: "Status is required" },
        { status: 400 }
      );
    }

    // If setting to active, recommend LemonSqueezy subscription ID but don't require it
    // (admin overrides may not have external subscription IDs)
    if (finalStatus === "active" && !external_subscription_id) {
      console.warn(
        "Setting subscription to active without LemonSqueezy subscription ID"
      );
    }

    // Validate status
    // Use "cancelled" (with two L's) to match LemonSqueezy's spelling
    const validStatuses = [
      "active",
      "cancelled",
      "past_due",
      "trialing",
      "paused",
    ];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        {
          error: `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
        },
        { status: 400 }
      );
    }

    // Check if user exists
    const { data: targetUser, error: userError } = await supabase
      .from("profiles")
      .select("id, email")
      .eq("id", userId)
      .single();

    if (userError || !targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Update or create subscription
    const subscriptionData = {
      user_id: userId,
      provider: external_subscription_id ? "lemonsqueezy" : "admin_override",
      status: finalStatus,
      current_period_end: current_period_end || null,
      external_subscription_id: external_subscription_id || null,
      price_id: finalPriceId,
      updated_at: new Date().toISOString(),
    };

    // First, try to update existing subscription
    const { data: existingSubscription, error: existingError } = await supabase
      .from("subscriptions")
      .select("id")
      .eq("user_id", userId)
      .single();

    let result;
    if (existingSubscription) {
      // Update existing subscription
      const { data, error } = await supabase
        .from("subscriptions")
        .update(subscriptionData)
        .eq("user_id", userId)
        .select()
        .single();

      if (error) {
        console.error("Error updating subscription:", error);
        return NextResponse.json(
          { error: "Failed to update subscription" },
          { status: 500 }
        );
      }
      result = data;
    } else {
      // Create new subscription
      const { data, error } = await supabase
        .from("subscriptions")
        .insert(subscriptionData)
        .select()
        .single();

      if (error) {
        console.error("Error creating subscription:", error);
        return NextResponse.json(
          { error: "Failed to create subscription" },
          { status: 500 }
        );
      }
      result = data;
    }

    return NextResponse.json({
      success: true,
      subscription: result,
      message: `Subscription ${
        existingSubscription ? "updated" : "created"
      } successfully`,
    });
  } catch (error) {
    console.error("Error in subscription override API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const supabase = createServerClient();

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user has admin role
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profileError || !profile || profile.role !== "admin") {
      return NextResponse.json({ error: "Not admin" }, { status: 403 });
    }

    const { userId } = params;

    // Check if user exists
    const { data: targetUser, error: userError } = await supabase
      .from("profiles")
      .select("id, email")
      .eq("id", userId)
      .single();

    if (userError || !targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Delete subscription
    const { error: deleteError } = await supabase
      .from("subscriptions")
      .delete()
      .eq("user_id", userId);

    if (deleteError) {
      console.error("Error deleting subscription:", deleteError);
      return NextResponse.json(
        { error: "Failed to delete subscription" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Subscription deleted successfully",
    });
  } catch (error) {
    console.error("Error in subscription delete API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
