import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { verifyLemonSqueezySignature } from "./verifySignature.ts";

interface WebhookEvent {
  data: {
    id: string;
    type: string;
    attributes: {
      status: string;
      user_email?: string;
      renews_at?: string;
      customer_id?: string;
      variant_id?: string;
      [key: string]: any;
    };
    relationships: {
      customer?: {
        links?: {
          related?: string;
          self?: string;
        };
      };
      variant?: {
        links?: {
          related?: string;
          self?: string;
        };
      };
    };
  };
  meta: {
    event_name: string;
    custom_data?: {
      user_id?: string;
    };
  };
}

interface SubscriptionData {
  user_id: string;
  provider: string;
  status: string;
  external_customer_id?: string;
  external_subscription_id: string;
  price_id?: string;
  current_period_end?: string;
  updated_at: string;
}

serve(async (req) => {
  // Handle GET requests for testing
  if (req.method === "GET") {
    // Test database connection
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({
          message: "LemonSqueezy webhook handler is running",
          timestamp: new Date().toISOString(),
          auth_disabled: true,
          database_config: "Missing environment variables",
        }),
        {
          headers: { "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Test database connection
    const { data, error } = await supabase
      .from("subscriptions")
      .select("count")
      .limit(1);

    return new Response(
      JSON.stringify({
        message: "LemonSqueezy webhook handler is running",
        timestamp: new Date().toISOString(),
        auth_disabled: true,
        database_connection: error ? `Error: ${error.message}` : "Connected",
        webhook_secret_configured: !!Deno.env.get(
          "LEMONSQUEEZY_WEBHOOK_SECRET"
        ),
      }),
      {
        headers: { "Content-Type": "application/json" },
        status: 200,
      }
    );
  }

  // Only allow POST requests for webhooks
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    // Get the raw body for signature verification
    const body = await req.text();
    const signature = req.headers.get("x-signature");

    if (!signature) {
      console.error("Missing webhook signature");
      return new Response("Missing signature", { status: 400 });
    }

    // Verify webhook signature
    const webhookSecret = Deno.env.get("LEMONSQUEEZY_WEBHOOK_SECRET");
    if (!webhookSecret) {
      console.error("LEMONSQUEEZY_WEBHOOK_SECRET not configured");
      return new Response("Webhook secret not configured", { status: 500 });
    }

    const isValidSignature = await verifyLemonSqueezySignature(
      body,
      signature,
      webhookSecret
    );

    if (!isValidSignature) {
      console.error("Invalid webhook signature");
      return new Response("Invalid signature", { status: 401 });
    }

    // Parse the webhook event
    const event: WebhookEvent = JSON.parse(body);
    const { data, meta } = event;

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("Supabase configuration missing");
      return new Response("Server configuration error", { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Handle different event types
    switch (meta.event_name) {
      case "subscription_created":
      case "subscription_updated":
        await handleSubscriptionUpdate(supabase, data, meta);
        break;

      case "subscription_cancelled":
        await handleSubscriptionCancellation(supabase, data);
        break;

      case "subscription_expired":
        await handleSubscriptionExpiration(supabase, data);
        break;

      case "subscription_resumed":
        await handleSubscriptionResumption(supabase, data);
        break;

      case "subscription_paused":
        await handleSubscriptionPause(supabase, data);
        break;

      case "subscription_unpaused":
        await handleSubscriptionUnpause(supabase, data);
        break;

      case "subscription_payment_success":
        await handlePaymentSuccess(supabase, data);
        break;

      case "subscription_payment_failed":
        await handlePaymentFailure(supabase, data);
        break;

      case "subscription_payment_recovered":
        await handlePaymentRecovery(supabase, data);
        break;

      default:
        // Unhandled webhook event
        break;
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Webhook processing error:", error);
    return new Response(
      JSON.stringify({ error: "Webhook processing failed" }),
      {
        headers: { "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});

// Helper function to get user ID from webhook data
async function getUserIdFromWebhookData(
  supabase: any,
  attributes: any,
  meta: any
): Promise<string | null> {
  // Try to extract user ID from meta.custom_data first (LemonSqueezy format)
  let userId = meta?.custom_data?.user_id;

  // Fallback: try attributes.checkout_data?.custom?.user_id (alternative format)
  if (!userId) {
    userId = attributes.checkout_data?.custom?.user_id;
  }

  // If no user ID in custom data, try to find user by email
  if (!userId && attributes.user_email) {
    const { data: user, error: userError } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", attributes.user_email)
      .single();

    if (userError) {
      console.error("Error looking up user by email:", userError);
    } else if (user) {
      userId = user.id;
    }
  }

  if (!userId) {
    console.error("No user ID found in subscription data");
  }

  return userId;
}

async function fetchSubscriptionDetails(
  subscriptionId: string
): Promise<{ customerId?: string; variantId?: string }> {
  const apiKey = Deno.env.get("LEMONSQUEEZY_API_KEY");
  if (!apiKey) {
    console.error("LEMONSQUEEZY_API_KEY not configured");
    return {};
  }

  try {
    const response = await fetch(
      `https://api.lemonsqueezy.com/v1/subscriptions/${subscriptionId}`,
      {
        headers: {
          Accept: "application/vnd.api+json",
          "Content-Type": "application/vnd.api+json",
          Authorization: `Bearer ${apiKey}`,
        },
      }
    );

    if (!response.ok) {
      console.error(`Failed to fetch subscription details: ${response.status}`);
      return {};
    }

    const result = await response.json();
    const subscriptionData = result.data;

    return {
      customerId:
        subscriptionData?.attributes?.customer_id ||
        subscriptionData?.relationships?.customer?.data?.id,
      variantId:
        subscriptionData?.attributes?.variant_id ||
        subscriptionData?.relationships?.variant?.data?.id,
    };
  } catch (error) {
    console.error("Error fetching subscription details:", error);
    return {};
  }
}

async function handleSubscriptionUpdate(supabase: any, data: any, meta: any) {
  const { attributes, relationships } = data;

  // Get user ID from webhook data
  const userId = await getUserIdFromWebhookData(supabase, attributes, meta);

  if (!userId) {
    return;
  }

  // Extract customer_id from attributes
  // Note: LemonSqueezy webhooks don't include inline relationship data,
  // they only provide links. We must check attributes or fetch from API.
  let customerId = attributes.customer_id;

  // Extract variant_id/price_id from attributes
  let variantId = attributes.variant_id;

  // If missing customer_id or variant_id, fetch from API
  // This is necessary because webhook payloads are lightweight and don't
  // always include all relationship data inline
  if (!customerId || !variantId) {
    console.log("Missing customer_id or variant_id, fetching from API...");
    const details = await fetchSubscriptionDetails(data.id);
    customerId = customerId || details.customerId;
    variantId = variantId || details.variantId;
  }

  // Log the webhook payload for debugging
  console.log(
    "Webhook payload:",
    JSON.stringify({
      subscription_id: data.id,
      customer_id: customerId,
      variant_id: variantId,
      attributes_customer_id: attributes.customer_id,
      attributes_variant_id: attributes.variant_id,
    })
  );

  // Check if this is an extra seat subscription
  const GROWTH_SEAT_PRICE_ID = Deno.env.get(
    "LEMONSQUEEZY_VARIANT_ID_GROWTH_SEAT"
  );
  const isExtraSeat = GROWTH_SEAT_PRICE_ID
    ? variantId === GROWTH_SEAT_PRICE_ID
    : false;

  // Get previous subscription to check for tier changes
  // For extra seats, we don't need to check tier changes
  // For main subscriptions, find the main membership subscription
  let previousSub = null;
  if (!isExtraSeat) {
    // Find subscription with membership_type = "membership" (main subscription)
    const { data: mainSub } = await supabase
      .from("subscriptions")
      .select("price_id, status, membership_type")
      .eq("user_id", userId)
      .eq("provider", "lemonsqueezy")
      .eq("membership_type", "membership")
      .maybeSingle();

    previousSub = mainSub;
  }

  const previousTier = getTierFromPriceId(previousSub?.price_id);
  const newTier = getTierFromPriceId(variantId);
  const wasGrowth = previousTier === "GROWTH";
  const isGrowth = newTier === "GROWTH";
  const isActive = attributes.status === "active";

  const subscriptionData: SubscriptionData = {
    user_id: userId,
    provider: "lemonsqueezy",
    status: attributes.status,
    external_customer_id: customerId,
    external_subscription_id: data.id,
    price_id: variantId,
    current_period_end: attributes.renews_at,
    updated_at: new Date().toISOString(),
  };

  // Set membership_type: 'membership' for main subscriptions, 'addon' for extra seats
  if (isExtraSeat) {
    (subscriptionData as any).membership_type = "addon";
  } else {
    // Main subscription (Growth, Starter, Lite, etc.)
    (subscriptionData as any).membership_type = "membership";
  }

  // Check if a subscription with this external_subscription_id already exists
  // This ensures each subscription (main or extra seat) has its own row
  const { data: existingSub, error: lookupError } = await supabase
    .from("subscriptions")
    .select("id")
    .eq("external_subscription_id", data.id)
    .maybeSingle();

  if (lookupError) {
    console.error("Error looking up subscription:", lookupError);
    throw new Error(`Failed to lookup subscription: ${lookupError.message}`);
  }

  if (existingSub) {
    // Update existing subscription by external_subscription_id
    const { error: updateError } = await supabase
      .from("subscriptions")
      .update(subscriptionData)
      .eq("external_subscription_id", data.id);

    if (updateError) {
      console.error("Error updating subscription:", updateError);
      throw new Error(`Failed to update subscription: ${updateError.message}`);
    }
  } else {
    // Insert new subscription
    const { error: insertError } = await supabase
      .from("subscriptions")
      .insert(subscriptionData);

    if (insertError) {
      console.error("Error inserting subscription:", insertError);
      throw new Error(`Failed to insert subscription: ${insertError.message}`);
    }
  }

  // Handle portfolio creation/management
  // Only process portfolio changes for main Growth subscriptions, not extra seats
  if (!isExtraSeat) {
    if (isGrowth && isActive) {
      // User upgraded to or has Growth tier - create portfolio if needed
      await handlePortfolioOnUpgrade(supabase, userId);
    } else if (wasGrowth && !isGrowth) {
      // User downgraded from Growth - downgrade portfolio members
      await handlePortfolioOnDowngrade(supabase, userId);
    } else if (wasGrowth && !isActive && isGrowth && isActive) {
      // User resubscribed to Growth - upgrade portfolio members
      await handlePortfolioOnResubscribe(supabase, userId);
    }
  }
}

async function handleSubscriptionCancellation(supabase: any, data: any) {
  const subscriptionId = data.id;

  const { error } = await supabase
    .from("subscriptions")
    .update({
      status: "canceled",
      updated_at: new Date().toISOString(),
    })
    .eq("external_subscription_id", subscriptionId);

  if (error) {
    console.error("Error canceling subscription:", error);
    throw new Error(`Failed to cancel subscription: ${error.message}`);
  }
}

async function handleSubscriptionExpiration(supabase: any, data: any) {
  const subscriptionId = data.id;

  const { error } = await supabase
    .from("subscriptions")
    .update({
      status: "expired",
      updated_at: new Date().toISOString(),
    })
    .eq("external_subscription_id", subscriptionId);

  if (error) {
    console.error("Error expiring subscription:", error);
    throw new Error(`Failed to expire subscription: ${error.message}`);
  }
}

async function handleSubscriptionResumption(supabase: any, data: any) {
  const subscriptionId = data.id;

  // Get subscription to check tier
  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("user_id, price_id")
    .eq("external_subscription_id", subscriptionId)
    .single();

  const { error } = await supabase
    .from("subscriptions")
    .update({
      status: "active",
      updated_at: new Date().toISOString(),
    })
    .eq("external_subscription_id", subscriptionId);

  if (error) {
    console.error("Error resuming subscription:", error);
    throw new Error(`Failed to resume subscription: ${error.message}`);
  }

  // If Growth tier, handle portfolio resubscribe
  if (subscription) {
    const tier = getTierFromPriceId(subscription.price_id);
    if (tier === "GROWTH") {
      await handlePortfolioOnResubscribe(supabase, subscription.user_id);
    }
  }
}

async function handleSubscriptionPause(supabase: any, data: any) {
  const subscriptionId = data.id;

  const { error } = await supabase
    .from("subscriptions")
    .update({
      status: "paused",
      updated_at: new Date().toISOString(),
    })
    .eq("external_subscription_id", subscriptionId);

  if (error) {
    console.error("Error pausing subscription:", error);
    throw new Error(`Failed to pause subscription: ${error.message}`);
  }
}

async function handleSubscriptionUnpause(supabase: any, data: any) {
  const subscriptionId = data.id;

  const { error } = await supabase
    .from("subscriptions")
    .update({
      status: "active",
      updated_at: new Date().toISOString(),
    })
    .eq("external_subscription_id", subscriptionId);

  if (error) {
    console.error("Error unpausing subscription:", error);
    throw new Error(`Failed to unpause subscription: ${error.message}`);
  }
}

async function handlePaymentSuccess(supabase: any, data: any) {
  const subscriptionId = data.id;

  // Get subscription to check tier
  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("user_id, price_id")
    .eq("external_subscription_id", subscriptionId)
    .single();

  const { error } = await supabase
    .from("subscriptions")
    .update({
      status: "active",
      updated_at: new Date().toISOString(),
    })
    .eq("external_subscription_id", subscriptionId);

  if (error) {
    console.error("Error updating subscription after payment success:", error);
    throw new Error(`Failed to update subscription: ${error.message}`);
  }

  // If Growth tier, handle portfolio resubscribe
  if (subscription) {
    const tier = getTierFromPriceId(subscription.price_id);
    if (tier === "GROWTH") {
      await handlePortfolioOnResubscribe(supabase, subscription.user_id);
    }
  }
}

async function handlePaymentFailure(supabase: any, data: any) {
  const subscriptionId = data.id;

  const { error } = await supabase
    .from("subscriptions")
    .update({
      status: "past_due",
      updated_at: new Date().toISOString(),
    })
    .eq("external_subscription_id", subscriptionId);

  if (error) {
    console.error("Error updating subscription after payment failure:", error);
    throw new Error(`Failed to update subscription: ${error.message}`);
  }
}

async function handlePaymentRecovery(supabase: any, data: any) {
  const subscriptionId = data.id;

  // Get subscription to check tier
  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("user_id, price_id")
    .eq("external_subscription_id", subscriptionId)
    .single();

  const { error } = await supabase
    .from("subscriptions")
    .update({
      status: "active",
      updated_at: new Date().toISOString(),
    })
    .eq("external_subscription_id", subscriptionId);

  if (error) {
    console.error("Error updating subscription after payment recovery:", error);
    throw new Error(`Failed to update subscription: ${error.message}`);
  }

  // If Growth tier, handle portfolio resubscribe
  if (subscription) {
    const tier = getTierFromPriceId(subscription.price_id);
    if (tier === "GROWTH") {
      await handlePortfolioOnResubscribe(supabase, subscription.user_id);
    }
  }
}

// Helper function to get tier from price_id
function getTierFromPriceId(priceId: string | null | undefined): string {
  if (!priceId) {
    return "FREE";
  }

  // Get tier price_ids from environment
  const growthPriceId = Deno.env.get("LEMONSQUEEZY_VARIANT_ID_GROWTH");
  if (priceId === growthPriceId) {
    return "GROWTH";
  }

  const litePriceId = Deno.env.get("LEMONSQUEEZY_VARIANT_ID_LITE");
  if (priceId === litePriceId) {
    return "LITE";
  }

  const proPriceId = Deno.env.get("LEMONSQUEEZY_VARIANT_ID_PRO");
  if (priceId === proPriceId) {
    return "STARTER";
  }

  // Default to STARTER for other active subscriptions
  return "STARTER";
}

// Handle portfolio creation on Growth upgrade
async function handlePortfolioOnUpgrade(supabase: any, userId: string) {
  // Check if portfolio already exists
  const { data: existingPortfolio } = await supabase
    .from("portfolios")
    .select("id")
    .eq("owner_id", userId)
    .single();

  if (existingPortfolio) {
    return; // Portfolio already exists
  }

  // Create portfolio
  const { data: portfolio, error: portfolioError } = await supabase
    .from("portfolios")
    .insert({ owner_id: userId })
    .select()
    .single();

  if (portfolioError) {
    console.error("Error creating portfolio:", portfolioError);
    return;
  }

  // Update user's profile
  await supabase
    .from("profiles")
    .update({ portfolio_id: portfolio.id })
    .eq("id", userId);

  // Update user's posts
  await supabase
    .from("posts")
    .update({ portfolio_id: portfolio.id })
    .eq("user_id", userId);

  // Set membership_type to 'membership' in subscription (main subscription, not addon)
  await supabase
    .from("subscriptions")
    .update({ membership_type: "membership" })
    .eq("user_id", userId)
    .eq("status", "active")
    .neq("membership_type", "addon"); // Don't update addons

  // Sync portfolio members to Growth tier
  await syncPortfolioMemberTiers(supabase, portfolio.id, "GROWTH");
}

// Handle portfolio on downgrade
async function handlePortfolioOnDowngrade(supabase: any, userId: string) {
  // Get user's portfolio
  const { data: portfolio } = await supabase
    .from("portfolios")
    .select("id")
    .eq("owner_id", userId)
    .single();

  if (!portfolio) {
    return; // User doesn't have a portfolio
  }

  // Get all collaborators
  const { data: collaborators } = await supabase
    .from("portfolio_collaborators")
    .select("user_id")
    .eq("portfolio_id", portfolio.id)
    .eq("status", "accepted");

  const collaboratorUserIds = (collaborators || []).map((c: any) => c.user_id);

  // Downgrade all collaborators to FREE by removing their growth_member subscriptions
  if (collaboratorUserIds.length > 0) {
    await supabase
      .from("subscriptions")
      .delete()
      .in("user_id", collaboratorUserIds)
      .eq("membership_type", "growth_member");
  }
}

// Handle portfolio on resubscribe
async function handlePortfolioOnResubscribe(supabase: any, userId: string) {
  // Get user's portfolio
  const { data: portfolio } = await supabase
    .from("portfolios")
    .select("id")
    .eq("owner_id", userId)
    .single();

  if (!portfolio) {
    return; // User doesn't have a portfolio
  }

  // Sync all portfolio members to Growth tier
  await syncPortfolioMemberTiers(supabase, portfolio.id, "GROWTH");
}

// Sync all portfolio members to the same tier
async function syncPortfolioMemberTiers(
  supabase: any,
  portfolioId: string,
  tier: "GROWTH" | "FREE"
) {
  // Get portfolio owner's subscription to get price_id
  const { data: portfolio } = await supabase
    .from("portfolios")
    .select("owner_id")
    .eq("id", portfolioId)
    .single();

  if (!portfolio) {
    return;
  }

  const { data: ownerSubscription } = await supabase
    .from("subscriptions")
    .select("price_id")
    .eq("user_id", portfolio.owner_id)
    .eq("status", "active")
    .eq("membership_type", "owner")
    .single();

  if (!ownerSubscription || !ownerSubscription.price_id) {
    return;
  }

  // Get all collaborators
  const { data: collaborators } = await supabase
    .from("portfolio_collaborators")
    .select("user_id")
    .eq("portfolio_id", portfolioId)
    .eq("status", "accepted");

  const collaboratorUserIds = (collaborators || []).map((c: any) => c.user_id);

  if (tier === "GROWTH") {
    // Upgrade all collaborators to growth_member
    for (const collaboratorUserId of collaboratorUserIds) {
      // Check if growth_member subscription already exists
      const { data: existing } = await supabase
        .from("subscriptions")
        .select("id")
        .eq("user_id", collaboratorUserId)
        .eq("membership_type", "growth_member")
        .single();

      if (!existing) {
        // Create growth_member subscription
        await supabase.from("subscriptions").insert({
          user_id: collaboratorUserId,
          provider: "lemonsqueezy",
          status: "active",
          price_id: ownerSubscription.price_id,
          membership_type: "growth_member",
        });
      } else {
        // Update existing growth_member subscription
        await supabase
          .from("subscriptions")
          .update({
            status: "active",
            price_id: ownerSubscription.price_id,
          })
          .eq("id", existing.id);
      }
    }
  } else {
    // Downgrade all collaborators to FREE by removing growth_member subscriptions
    if (collaboratorUserIds.length > 0) {
      await supabase
        .from("subscriptions")
        .delete()
        .in("user_id", collaboratorUserIds)
        .eq("membership_type", "growth_member");
    }
  }
}
