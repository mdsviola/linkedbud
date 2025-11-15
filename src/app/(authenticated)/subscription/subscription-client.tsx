"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UpgradeButton } from "@/components/upgrade-button";
import { DowngradeModal } from "@/components/downgrade-modal";
import { PageWrapper } from "@/components/ui/page-wrapper";
import { PricingCard } from "@/marketing/components/ui/pricing-card";
import { toast } from "@/hooks/use-toast";
import { Check } from "lucide-react";
import { getPricingConfig, getStarterPricing } from "@/lib/pricing-config";
import { PRICING_PLANS } from "@/marketing/data/pricing";
import { getTierFromPriceId, getTierDisplayName } from "@/lib/tier-utils";

const getLimitText = (limit: number, label: string) => {
  if (limit === -1) return `Unlimited ${label}`;
  if (limit === 0) return `No ${label}`;
  return `${limit} ${label}`;
};

// Get icon(s) for each subscription tier
const getTierIcon = (planName: string): string | string[] => {
  const name = planName.toLowerCase();
  if (name === "free") {
    return ["🐄✋"];
  } else if (name === "creator lite" || name === "lite") {
    return "🪙";
  } else if (name === "creator pro" || name === "starter") {
    return "👑";
  } else if (name === "growth") {
    return "📈";
  }
  // Default fallback
  return "👑";
};

interface Subscription {
  id: string | number;
  status: string;
  current_period_end: string | null;
  external_subscription_id: string | null;
  price_id: string | null;
}

interface SubscriptionClientProps {
  user: {
    id: string;
  };
  limits: {
    freeTier: {
      draft: number;
      polish: number;
      forYou: number;
    };
    subscription: {
      draft: number;
      polish: number;
      forYou: number;
    };
  };
}

export function SubscriptionClient({ user, limits }: SubscriptionClientProps) {
  const searchParams = useSearchParams();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDowngradeModal, setShowDowngradeModal] = useState(false);
  const [isDowngrading, setIsDowngrading] = useState(false);
  const [downgradeMessage, setDowngradeMessage] = useState<string>("");
  const [downgradeMessageType, setDowngradeMessageType] = useState<
    "error" | "success" | "warning" | "info" | "default"
  >("default");
  const [userPlanName, setUserPlanName] = useState<string>("Free");
  const [planNameLoading, setPlanNameLoading] = useState(true);

  // Get pricing config - use same logic as public pricing page
  const pricingConfig = getPricingConfig();

  useEffect(() => {
    fetchSubscription();

    // Check for success parameter from checkout redirect
    if (searchParams.get("success") === "true") {
      const pricing = getStarterPricing();
      toast({
        title: `Welcome to Linkedbud ${pricing.name}!`,
        description: `Your subscription is now active. You have unlimited access to all ${pricing.name} features.`,
        variant: "success",
      });
      // Clear the URL parameter
      const url = new URL(window.location.href);
      url.searchParams.delete("success");
      window.history.replaceState({}, "", url.toString());
    }
  }, [searchParams]);

  const fetchSubscription = async () => {
    try {
      // Use the same API endpoint as the authenticated layout for consistency
      // This ensures both use the same logic (handles NULL membership_type)
      const response = await fetch("/api/billing/portal");
      if (response.ok) {
        const data = await response.json();
        // Map to the expected subscription format
        const subData = data.subscription;
        if (subData) {
          setSubscription({
            id: subData.id,
            status: subData.status,
            current_period_end: subData.current_period_end,
            external_subscription_id: subData.external_subscription_id,
            price_id: subData.price_id,
          });
        } else {
          setSubscription(null);
        }
      } else if (response.status === 404) {
        // No active subscription found - this is normal for free users
        setSubscription(null);
      } else {
        // Handle other errors
        console.error(
          "Failed to fetch subscription:",
          response.status,
          response.statusText
        );
        setSubscription(null);
      }
    } catch (err) {
      console.error("Failed to load subscription:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDowngradeClick = () => {
    if (!subscription) {
      console.error("No subscription found");
      return;
    }

    if (!subscription.external_subscription_id) {
      setDowngradeMessage(
        "This subscription cannot be cancelled through the app. Please contact support at support@linkedbud.com to cancel your subscription."
      );
      setShowDowngradeModal(true);
      return;
    }

    setDowngradeMessage("");
    setShowDowngradeModal(true);
  };

  const handleDowngradeConfirm = async () => {
    if (!subscription) return;

    setIsDowngrading(true);

    try {
      const response = await fetch("/api/billing/cancel", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          subscriptionId:
            subscription.external_subscription_id || "no-external-id",
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("API Error:", errorData);
        throw new Error(
          `Failed to cancel subscription: ${
            errorData.error || response.statusText
          }`
        );
      }

      const data = await response.json();

      // Show success message and close modal
      setDowngradeMessage(data.message);
      setDowngradeMessageType("success");

      // Close modal and refresh subscription data after a short delay
      setTimeout(() => {
        setShowDowngradeModal(false);
        setDowngradeMessage("");
        setDowngradeMessageType("default");
        // Refresh subscription data instead of reloading the page
        fetchSubscription();
      }, 2000);
    } catch (error) {
      console.error("Error cancelling subscription:", error);

      // Show generic error message
      setDowngradeMessage(
        "Unable to cancel your subscription at this time. Please try again later or contact support if the issue persists."
      );
      setDowngradeMessageType("error");
    } finally {
      setIsDowngrading(false);
    }
  };

  const handleCloseModal = () => {
    setShowDowngradeModal(false);
    setDowngradeMessage("");
    setDowngradeMessageType("default");
  };

  // Fetch tier from server-side API (uses server env vars)
  useEffect(() => {
    const fetchUserTier = async () => {
      if (!subscription) {
        // No subscription = Free plan, no need to load
        setUserPlanName("Free");
        setPlanNameLoading(false);
        return;
      }

      if (!subscription.price_id) {
        // Subscription exists but no price_id = Free plan
        setUserPlanName("Free");
        setPlanNameLoading(false);
        return;
      }

      // We have a subscription with price_id, need to fetch tier
      setPlanNameLoading(true);

      try {
        const response = await fetch(
          `/api/portfolio/check-tier?price_id=${subscription.price_id}`
        );
        if (response.ok) {
          const data = await response.json();
          const tier = data.tier;
          const displayName = getTierDisplayName(tier);
          setUserPlanName(displayName);
        } else {
          console.error("Failed to fetch tier from server");
          // Fallback to client-side detection
          const tier = getTierFromPriceId(subscription.price_id);
          setUserPlanName(getTierDisplayName(tier));
        }
      } catch (error) {
        console.error("Error fetching tier:", error);
        // Fallback to client-side detection
        const tier = getTierFromPriceId(subscription.price_id);
        setUserPlanName(getTierDisplayName(tier));
      } finally {
        setPlanNameLoading(false);
      }
    };

    fetchUserTier();
  }, [subscription]);

  const isSubscribed = !!subscription;

  if (loading) {
    return (
      <PageWrapper maxWidth="4xl" padding="xl">
        <div className="text-center mb-12">
          <div className="h-8 bg-gray-200 rounded w-1/3 mx-auto mb-4"></div>
          <div className="h-6 bg-gray-200 rounded w-1/2 mx-auto"></div>
        </div>
        <div className="grid md:grid-cols-2 gap-8">
          {[1, 2].map((i) => (
            <div key={i} className="h-96 bg-gray-200 rounded"></div>
          ))}
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper maxWidth="4xl" padding="xl">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Manage Your Subscription
        </h1>
        <p className="text-xl text-gray-600">
          {isSubscribed
            ? "Manage your subscription and billing"
            : "Start free, upgrade when you're ready for unlimited drafts"}
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        {/* All Plans from PRICING_PLANS (includes Free, Creator Lite, Creator Pro, Growth) */}
        {PRICING_PLANS.map((plan) => {
          // Compare plan names (case-insensitive for safety)
          // Only compare if we're not loading the plan name
          const isUserPlan = planNameLoading
            ? false // Don't show "You're on this plan" while loading
            : (!isSubscribed && plan.name.toLowerCase() === "free") ||
              (isSubscribed &&
                plan.name.toLowerCase() === userPlanName.toLowerCase());
          const Icon = getTierIcon(plan.name);

          // Determine custom button content
          let customButtonContent: React.ReactNode = null;
          if (planNameLoading && isSubscribed) {
            customButtonContent = (
              <div className="w-full text-center py-2 px-4 bg-gray-100 rounded-md h-10 flex items-center justify-center animate-pulse">
                <div className="h-4 w-32 bg-gray-300 rounded"></div>
              </div>
            );
          } else if (isUserPlan) {
            customButtonContent = (
              <div className="w-full text-center py-2 px-4 bg-blue-100 rounded-md text-blue-600 font-medium h-10 flex items-center justify-center">
                You&apos;re on this plan
              </div>
            );
          } else if (plan.name.toLowerCase() === "free" && isSubscribed) {
            customButtonContent = (
              <Button
                onClick={handleDowngradeClick}
                className="w-full"
                variant="outline"
              >
                Downgrade
              </Button>
            );
          } else {
            customButtonContent = (
              <UpgradeButton className="w-full" planName={plan.name}>
                Subscribe
              </UpgradeButton>
            );
          }

          // Determine custom className for border
          const customClassName = isUserPlan
            ? "border-blue-500 border-2"
            : plan.highlighted
            ? "border-blue-300 shadow dark:border-blue-600"
            : "border-gray-200 dark:border-slate-800";

          return (
            <PricingCard
              key={plan.name}
              {...plan}
              icon={Icon}
              badgeIcon={
                plan.badge ? (plan.highlighted ? "👑" : undefined) : undefined
              }
              customButton={customButtonContent}
              customClassName={customClassName}
            />
          );
        })}
      </div>

      {/* FAQ Section */}
      <div className="mt-16">
        <h2 className="text-2xl font-bold text-center text-gray-900 mb-8">
          Frequently Asked Questions
        </h2>

        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">
              How does the free tier work?
            </h3>
            <p className="text-gray-600 text-sm">
              The Free tier includes 3 Rewrite with AI function calls per month,
              10 Polish with AI actions per month, 1 ideas bubble board
              generation per month (up to 15 AI generated ideas), and 1 AI
              analytics report per month (30d timeframe only). You can publish
              up to 2 posts per month. Perfect for testing Linkedbud with real
              LinkedIn posting.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-2">
              Can I cancel anytime?
            </h3>
            <p className="text-gray-600 text-sm">
              Yes! You can cancel your subscription at any time. You&apos;ll
              continue to have access to your plan features until the end of
              your current billing period.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-2">
              What payment methods do you accept?
            </h3>
            <p className="text-gray-600 text-sm">
              We accept all major credit cards, PayPal, and other payment
              methods through our secure payment processor LemonSqueezy.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-2">
              How does the AI work?
            </h3>
            <p className="text-gray-600 text-sm">
              Our AI analyzes industry news, clusters related articles, and
              generates personalized LinkedIn drafts based on your writing style
              and industry keywords.
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-16 text-center text-gray-600">
        <p>Questions? Contact us at support@linkedbud.com</p>
      </div>

      {/* Downgrade Confirmation Modal */}
      <DowngradeModal
        isOpen={showDowngradeModal}
        onClose={handleCloseModal}
        onConfirm={handleDowngradeConfirm}
        isLoading={isDowngrading}
        message={downgradeMessage}
        messageType={downgradeMessageType}
      />
    </PageWrapper>
  );
}
