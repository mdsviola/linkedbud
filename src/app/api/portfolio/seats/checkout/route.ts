import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";
import { getUserPortfolio } from "@/lib/portfolio";

export const dynamic = "force-dynamic";

/**
 * POST - Create checkout session for additional Growth Seat
 */
export async function POST(request: NextRequest) {
  try {
    // Validate required environment variables
    const requiredEnvVars = {
      LEMONSQUEEZY_API_KEY: process.env.LEMONSQUEEZY_API_KEY,
      LEMONSQUEEZY_STORE_ID: process.env.LEMONSQUEEZY_STORE_ID,
      LEMONSQUEEZY_VARIANT_ID_GROWTH_SEAT: process.env.LEMONSQUEEZY_VARIANT_ID_GROWTH_SEAT,
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    };

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

    // Verify user is a portfolio owner
    const portfolio = await getUserPortfolio(user.id);
    if (!portfolio || portfolio.owner_id !== user.id) {
      return NextResponse.json(
        { error: "Only portfolio owners can purchase additional seats" },
        { status: 403 }
      );
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

    const GROWTH_SEAT_PRICE_ID = process.env.LEMONSQUEEZY_VARIANT_ID_GROWTH_SEAT!;

    // Create checkout session using LemonSqueezy API directly
    const checkoutData = {
      type: "checkouts",
      attributes: {
        checkout_data: {
          email: profile.email,
          custom: {
            user_id: user.id,
            portfolio_id: portfolio.id,
            seat_type: "growth_seat",
          },
        },
        product_options: {
          name: "Growth Seat",
          description: "Additional seat for Growth plan collaboration",
          media: [],
          redirect_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings?tab=collaboration&success=true`,
          receipt_button_text: "Manage Subscription",
          receipt_link_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings?tab=collaboration`,
          receipt_thank_you_note: "Thank you for purchasing an additional Growth seat!",
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
            id: GROWTH_SEAT_PRICE_ID,
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

