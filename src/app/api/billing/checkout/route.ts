import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    // Parse request body to get plan name
    const body = await request.json().catch(() => ({}));
    const planName = body.planName as string | undefined;

    // Map plan name to tier and variant ID
    // Plan names: "Free", "Creator Lite", "Creator Pro", "Growth" (legacy: "Lite", "Starter" also supported)
    // Tier names: "FREE", "LITE", "PRO", "GROWTH"
    const planToTierMap: Record<
      string,
      { tier: string; variantEnvKey: string; displayName: string }
    > = {
      Free: { tier: "FREE", variantEnvKey: "", displayName: "linkedbud Free" },
      "Creator Lite": {
        tier: "LITE",
        variantEnvKey: "LEMONSQUEEZY_VARIANT_ID_LITE",
        displayName: "linkedbud Creator Lite",
      },
      "Creator Pro": {
        tier: "PRO",
        variantEnvKey: "LEMONSQUEEZY_VARIANT_ID_PRO",
        displayName: "linkedbud Creator Pro",
      },
      Growth: {
        tier: "GROWTH",
        variantEnvKey: "LEMONSQUEEZY_VARIANT_ID_GROWTH",
        displayName: "linkedbud Growth",
      },
      // Legacy plan names for backward compatibility
      Lite: {
        tier: "LITE",
        variantEnvKey: "LEMONSQUEEZY_VARIANT_ID_LITE",
        displayName: "linkedbud Creator Lite",
      },
      Starter: {
        tier: "PRO",
        variantEnvKey: "LEMONSQUEEZY_VARIANT_ID_PRO",
        displayName: "linkedbud Creator Pro",
      },
    };

    // Default to Creator Pro if no plan specified
    const selectedPlan = planName || "Creator Pro";

    // Prevent subscribing to Free plan
    if (selectedPlan === "Free") {
      return NextResponse.json(
        { error: "Cannot subscribe to Free plan" },
        { status: 400 }
      );
    }

    const planConfig =
      planToTierMap[selectedPlan] || planToTierMap["Creator Pro"];

    // Validate required environment variables
    const requiredEnvVars: Record<string, string | undefined> = {
      LEMONSQUEEZY_API_KEY: process.env.LEMONSQUEEZY_API_KEY,
      LEMONSQUEEZY_STORE_ID: process.env.LEMONSQUEEZY_STORE_ID,
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    };

    // Add variant ID requirement based on selected plan
    if (planConfig.variantEnvKey) {
      requiredEnvVars[planConfig.variantEnvKey] =
        process.env[planConfig.variantEnvKey];
    } else {
      // If Free tier, we still need a variant (fallback to Creator Pro)
      requiredEnvVars.LEMONSQUEEZY_VARIANT_ID_PRO =
        process.env.LEMONSQUEEZY_VARIANT_ID_PRO;
    }

    const missingVars = Object.entries(requiredEnvVars)
      .filter(([_, value]) => !value)
      .map(([key]) => key);

    if (missingVars.length > 0) {
      console.error("Missing required environment variables:", missingVars);
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    const supabase = createServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user profile for checkout
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

    // Get the variant ID for the selected plan
    const variantId = planConfig.variantEnvKey
      ? process.env[planConfig.variantEnvKey]
      : process.env.LEMONSQUEEZY_VARIANT_ID_PRO; // Fallback to Creator Pro

    if (!variantId) {
      return NextResponse.json(
        { error: `Variant ID not configured for ${selectedPlan} plan` },
        { status: 500 }
      );
    }

    // Create checkout session using LemonSqueezy API directly
    const checkoutData = {
      type: "checkouts",
      attributes: {
        checkout_data: {
          email: profile.email,
          custom: {
            user_id: user.id,
          },
        },
        product_options: {
          name: planConfig.displayName,
          description: `Upgrade to ${planConfig.displayName}`,
          media: [],
          enabled_variants: [variantId],
          redirect_url: `${process.env.NEXT_PUBLIC_APP_URL}/subscription?success=true`,
          receipt_button_text: "Manage Subscription",
          receipt_link_url: `${process.env.NEXT_PUBLIC_APP_URL}/subscription`,
          receipt_thank_you_note: `Thank you for upgrading to ${planConfig.displayName}!`,
        },
        checkout_options: {
          embed: false,
          media: false,
          logo: true,
        },
        preview: false,
        test_mode: process.env.NODE_ENV === "development",
      },
      relationships: {
        store: {
          data: {
            type: "stores",
            id: process.env.LEMONSQUEEZY_STORE_ID,
          },
        },
        variant: {
          data: {
            type: "variants",
            id: variantId,
          },
        },
      },
    };

    const response = await fetch("https://api.lemonsqueezy.com/v1/checkouts", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.LEMONSQUEEZY_API_KEY}`,
        "Content-Type": "application/vnd.api+json",
        Accept: "application/vnd.api+json",
      },
      body: JSON.stringify({ data: checkoutData }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("LemonSqueezy API error details:", {
        status: response.status,
        statusText: response.statusText,
        error: errorData,
      });
      throw new Error(
        `LemonSqueezy API error: ${response.status} ${
          response.statusText
        } - ${JSON.stringify(errorData)}`
      );
    }

    const result = await response.json();

    if (!result.data?.attributes?.url) {
      throw new Error("Failed to create checkout session");
    }

    return NextResponse.json({
      checkoutUrl: result.data.attributes.url,
    });
  } catch (error) {
    console.error("Error creating checkout session:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
