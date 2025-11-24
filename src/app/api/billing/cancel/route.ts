import { NextRequest, NextResponse } from "next/server";
import { createServerClient, supabaseAdmin } from "@/lib/supabase-server";
import { getTierFromPriceId } from "@/lib/tier-utils";
import { formatDateOnly } from "@/lib/utils";

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error("Auth error:", authError);
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const requestBody = await request.json();

    const { subscriptionId } = requestBody;

    if (!subscriptionId) {
      console.error("No subscription ID provided");
      return NextResponse.json(
        { error: "Subscription ID is required" },
        { status: 400 }
      );
    }

    if (
      subscriptionId === "null" ||
      subscriptionId === null ||
      subscriptionId === "no-external-id"
    ) {
      return NextResponse.json(
        {
          error:
            "This subscription cannot be cancelled through the app. Please contact support at support@linkedbud.com to cancel your subscription.",
        },
        { status: 400 }
      );
    }

    // Verify the subscription belongs to the user and get price_id to check tier
    // Check for both active and cancelled subscriptions to provide better error messages
    const { data: subscription, error: subError } = await supabase
      .from("subscriptions")
      .select("external_subscription_id, status, provider, price_id, current_period_end")
      .eq("user_id", user.id)
      .eq("external_subscription_id", subscriptionId)
      .single();

    if (subError || !subscription) {
      console.error("Subscription not found:", subError);
      return NextResponse.json(
        { error: "Subscription not found" },
        { status: 404 }
      );
    }

    // If subscription is already cancelled, return a helpful message
    // Handle both "canceled" (US spelling) and "cancelled" (UK spelling)
    if (subscription.status === "canceled" || subscription.status === "cancelled") {
      const periodEnd = subscription.current_period_end
        ? formatDateOnly(subscription.current_period_end)
        : "the end of your billing period";
      return NextResponse.json(
        {
          error: "This subscription is already cancelled",
          message: `Your subscription has already been cancelled. You'll continue to have access until ${periodEnd}.`,
        },
        { status: 400 }
      );
    }

    // Only allow cancelling active subscriptions
    if (subscription.status !== "active") {
      return NextResponse.json(
        {
          error: "Subscription cannot be cancelled",
          message: `This subscription is ${subscription.status} and cannot be cancelled.`,
        },
        { status: 400 }
      );
    }

    // Check if this is a Growth plan subscription
    const tier = getTierFromPriceId(subscription.price_id);
    const isGrowthPlan = tier === "GROWTH";

    // Cancel subscription using LemonSqueezy API
    let response;
    try {
      response = await fetch(
        `https://api.lemonsqueezy.com/v1/subscriptions/${subscriptionId}`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${process.env.LEMONSQUEEZY_API_KEY}`,
            "Content-Type": "application/vnd.api+json",
            Accept: "application/vnd.api+json",
          },
          body: JSON.stringify({
            data: {
              type: "subscriptions",
              id: subscriptionId,
              attributes: {
                cancelled: true,
              },
            },
          }),
        }
      );
    } catch (fetchError) {
      console.error("Network error calling LemonSqueezy API:", fetchError);
      return NextResponse.json(
        { error: "Unable to process cancellation request" },
        { status: 500 }
      );
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("LemonSqueezy cancellation error:", errorData);
      console.error("Full error response:", JSON.stringify(errorData, null, 2));

      // Return generic error message
      return NextResponse.json(
        { error: "Unable to process cancellation request" },
        { status: 500 }
      );
    }

    // Parse the response to verify cancellation was successful
    const responseData = await response.json();
    const isCancelled = responseData?.data?.attributes?.cancelled;

    if (!isCancelled) {
      console.error(
        "LemonSqueezy returned success but subscription was not cancelled"
      );
      return NextResponse.json(
        { error: "Unable to process cancellation request" },
        { status: 500 }
      );
    }

    // Update subscription status in our database only after successful LemonSqueezy cancellation
    // Use "cancelled" (with two L's) to match LemonSqueezy's spelling
    const { data: updateData, error: updateError } = await supabase
      .from("subscriptions")
      .update({
        status: "cancelled",
        updated_at: new Date().toISOString(),
      })
      .eq("external_subscription_id", subscriptionId)
      .select();

    if (updateError) {
      console.error("Error updating subscription status:", updateError);
      return NextResponse.json(
        { error: "Unable to process cancellation request" },
        { status: 500 }
      );
    }

    // If this is a Growth plan, also cancel all extra seat subscriptions
    if (isGrowthPlan) {
      const GROWTH_SEAT_PRICE_ID = process.env.LEMONSQUEEZY_VARIANT_ID_GROWTH_SEAT;

      if (GROWTH_SEAT_PRICE_ID) {
        // Find all active extra seat subscriptions for this user
        const { data: extraSeatSubscriptions, error: extraSeatsError } = await supabaseAdmin
          .from("subscriptions")
          .select("external_subscription_id")
          .eq("user_id", user.id)
          .eq("price_id", GROWTH_SEAT_PRICE_ID)
          .eq("status", "active");

        if (!extraSeatsError && extraSeatSubscriptions && extraSeatSubscriptions.length > 0) {
          // Cancel each extra seat subscription via LemonSqueezy API
          const cancelPromises = extraSeatSubscriptions.map(async (extraSeat) => {
            if (!extraSeat.external_subscription_id) return;

            try {
              const extraSeatResponse = await fetch(
                `https://api.lemonsqueezy.com/v1/subscriptions/${extraSeat.external_subscription_id}`,
                {
                  method: "PATCH",
                  headers: {
                    Authorization: `Bearer ${process.env.LEMONSQUEEZY_API_KEY}`,
                    "Content-Type": "application/vnd.api+json",
                    Accept: "application/vnd.api+json",
                  },
                  body: JSON.stringify({
                    data: {
                      type: "subscriptions",
                      id: extraSeat.external_subscription_id,
                      attributes: {
                        cancelled: true,
                      },
                    },
                  }),
                }
              );

              if (extraSeatResponse.ok) {
                // Update status in database
                // Use "cancelled" (with two L's) to match LemonSqueezy's spelling
                await supabaseAdmin
                  .from("subscriptions")
                  .update({
                    status: "cancelled",
                    updated_at: new Date().toISOString(),
                  })
                  .eq("external_subscription_id", extraSeat.external_subscription_id);
              }
            } catch (error) {
              console.error(`Error canceling extra seat subscription ${extraSeat.external_subscription_id}:`, error);
            }
          });

          await Promise.all(cancelPromises);
        }
      }
    }

    const planName = tier === "GROWTH" ? "Growth" : tier === "PRO" ? "Creator Pro" : tier === "LITE" ? "Creator Lite" : "Creator Pro";

    return NextResponse.json({
      success: true,
      message:
        `Subscription cancelled successfully. You'll continue to have access to ${planName} features until the end of your billing period.${isGrowthPlan ? " All extra seat subscriptions have also been cancelled." : ""}`,
    });
  } catch (error) {
    console.error("Cancellation error:", error);
    return NextResponse.json(
      { error: "Unable to process cancellation request" },
      { status: 500 }
    );
  }
}
