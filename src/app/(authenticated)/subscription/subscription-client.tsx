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
import { formatDateOnly } from "@/lib/utils";

const getLimitText = (limit: number, label: string) => {
  if (limit === -1) return `Unlimited* ${label}`;
  if (limit === 0) return `No ${label}`;
  return `${limit} ${label}`;
};

// Helper function to check if a subscription is still valid (not expired)
// A subscription is valid if it's active OR if it's cancelled but hasn't reached current_period_end
const isSubscriptionValid = (subscription: Subscription | null): boolean => {
  if (!subscription) {
    return false;
  }

  // Active subscriptions are always valid
  if (subscription.status === "active") {
    return true;
  }

  // Cancelled subscriptions are valid until current_period_end
  // Handle both "canceled" (US spelling) and "cancelled" (UK spelling)
  if (
    subscription.status === "canceled" ||
    subscription.status === "cancelled"
  ) {
    if (!subscription.current_period_end) {
      // If cancelled but no current_period_end, consider it invalid
      return false;
    }

    try {
      const periodEnd = new Date(subscription.current_period_end);
      const now = new Date();

      // Check if the date is valid
      if (isNaN(periodEnd.getTime())) {
        return false;
      }

      return periodEnd > now;
    } catch (error) {
      // If date parsing fails, consider it invalid
      return false;
    }
  }

  return false;
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
        title: `Welcome to linkedbud ${pricing.name}!`,
        description: `Your subscription is now active. You have unlimited* access to all ${pricing.name} features.`,
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
          // If no price_id, we don't need to fetch tier, set loading to false immediately
          if (!subData.price_id) {
            setUserPlanName("Free");
            setPlanNameLoading(false);
          }
          // If price_id exists, planNameLoading stays true until useEffect fetches tier
        } else {
          setSubscription(null);
          setUserPlanName("Free");
          setPlanNameLoading(false);
        }
      } else if (response.status === 404) {
        // No active subscription found - this is normal for free users
        setSubscription(null);
        setUserPlanName("Free");
        setPlanNameLoading(false);
      } else {
        // Handle other errors
        console.error(
          "Failed to fetch subscription:",
          response.status,
          response.statusText
        );
        setSubscription(null);
        setUserPlanName("Free");
        setPlanNameLoading(false);
      }
    } catch (err) {
      console.error("Failed to load subscription:", err);
      setSubscription(null);
      setUserPlanName("Free");
      setPlanNameLoading(false);
    } finally {
      setLoading(false);
    }
  };

  const handleDowngradeClick = () => {
    if (!subscription) {
      console.error("No subscription found");
      return;
    }

    // If subscription is already cancelled, don't show the modal
    if (
      subscription.status === "canceled" ||
      subscription.status === "cancelled"
    ) {
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

        // If subscription is already cancelled, show the message from API
        if (errorData.message) {
          setDowngradeMessage(errorData.message);
          setDowngradeMessageType("default");
          setShowDowngradeModal(true);
          setIsDowngrading(false);
          return;
        }

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
      // Set loading state immediately based on whether we need to fetch
      if (!subscription || !subscription.price_id) {
        // No subscription or no price_id = Free plan, no need to load
        setUserPlanName("Free");
        setPlanNameLoading(false);
        return;
      }

      // We have a subscription with price_id, need to fetch tier
      // Keep planNameLoading as true (it starts as true) until fetch completes

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

  // Show skeleton loader while subscription or plan name is loading
  // Only render content when BOTH are ready to prevent flicker
  if (loading || planNameLoading) {
    return (
      <PageWrapper maxWidth="4xl" padding="xl">
        <div className="text-center mb-12">
          <div className="h-8 bg-gray-200 rounded w-1/3 mx-auto mb-4 animate-pulse"></div>
          <div className="h-6 bg-gray-200 rounded w-1/2 mx-auto animate-pulse"></div>
        </div>
        <div className="grid gap-8 md:grid-cols-2">
          {PRICING_PLANS.map((plan, index) => (
            <div
              key={plan.name || index}
              className="h-96 bg-gray-200 rounded animate-pulse"
            ></div>
          ))}
        </div>
      </PageWrapper>
    );
  }

  // Calculate subscription state only after loading is complete
  const isSubscribed = !!subscription;
  const isSubscriptionStillValid = isSubscriptionValid(subscription);

  return (
    <PageWrapper maxWidth="4xl" padding="xl">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Manage Your Subscription
        </h1>
        <p className="text-xl text-gray-600">
          {isSubscriptionStillValid
            ? "Manage your subscription and billing"
            : "Start free, upgrade when you're ready for unlimited* drafts"}
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        {/* All Plans from PRICING_PLANS (includes Free, Creator Lite, Creator Pro, Growth) */}
        {PRICING_PLANS.map((plan) => {
          // Compare plan names (case-insensitive for safety)
          // Only compare if we're not loading the plan name
          // If user has no valid subscription, they're on the Free plan
          const isUserPlan = planNameLoading
            ? false // Don't show "You're on this plan" while loading
            : !isSubscriptionStillValid && plan.name.toLowerCase() === "free"
            ? true // No valid subscription = Free plan
            : isSubscriptionStillValid &&
              plan.name.toLowerCase() === userPlanName.toLowerCase();
          const Icon = getTierIcon(plan.name);
          const isCanceled =
            subscription?.status === "canceled" ||
            subscription?.status === "cancelled";
          const isStillValid = isSubscriptionValid(subscription);
          const accessUntilDate = subscription?.current_period_end
            ? formatDateOnly(subscription.current_period_end)
            : null;

          // Determine custom button content
          // Note: We don't need to check planNameLoading here because the skeleton
          // loader handles all loading states
          let customButtonContent: React.ReactNode = null;
          if (isUserPlan) {
            // User is on this plan
            if (plan.name.toLowerCase() === "free") {
              // User is on Free plan (no valid subscription)
              customButtonContent = (
                <div className="w-full text-center py-2 px-4 bg-blue-100 rounded-md text-blue-600 font-medium h-10 flex items-center justify-center">
                  You&apos;re on this plan
                </div>
              );
            } else if (isCanceled && isStillValid) {
              // Show "On this plan until [date]" and allow resubscription (only if not expired)
              customButtonContent = (
                <div className="space-y-3">
                  <div className="w-full text-center py-2 px-4 bg-amber-50 rounded-md text-amber-700 text-sm h-10 flex items-center justify-center">
                    {accessUntilDate
                      ? `On this plan until ${accessUntilDate}`
                      : "On this plan (cancelled)"}
                  </div>
                  <UpgradeButton className="w-full" planName={plan.name}>
                    Resubscribe
                  </UpgradeButton>
                </div>
              );
            } else if (!isCanceled) {
              // Active subscription
              customButtonContent = (
                <div className="w-full text-center py-2 px-4 bg-blue-100 rounded-md text-blue-600 font-medium h-10 flex items-center justify-center">
                  You&apos;re on this plan
                </div>
              );
            }
          } else if (
            plan.name.toLowerCase() === "free" &&
            isSubscriptionStillValid &&
            isCanceled
          ) {
            // User has cancelled subscription that's still valid, show disabled button on free plan
            customButtonContent = (
              <Button className="w-full" variant="outline" disabled>
                On the {userPlanName} plan until{" "}
                {accessUntilDate || "period end"}
              </Button>
            );
          } else if (
            plan.name.toLowerCase() === "free" &&
            isSubscriptionStillValid &&
            !isCanceled
          ) {
            // User has active subscription, show downgrade button on free plan
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
            // Not user's plan, show subscribe button
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

      {/* Footnote */}
      <p className="mt-6 text-center text-xs text-slate-500 dark:text-slate-400">
        * Under a reasonable use policy. Usage may be capped if the system is
        exploited or abused.
      </p>

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
              The Free tier includes all features from the platform (apart from
              collaboration) with very limited use. It&apos;s perfect for
              hobbyists who want to try what it would be like to have a strong
              LinkedIn presence. You&apos;ll have access to AI-powered content
              creation, scheduling, analytics, and all the tools you need to
              build your professional brand, just with usage limits.
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
        <p>
          Questions? Contact us at support@linkedbud.com or use the feedback
          widget on the right 👉
        </p>
      </div>

      {/* Downgrade Confirmation Modal */}
      <DowngradeModal
        isOpen={showDowngradeModal}
        onClose={handleCloseModal}
        onConfirm={handleDowngradeConfirm}
        isLoading={isDowngrading}
        message={downgradeMessage}
        messageType={downgradeMessageType}
        currentPeriodEnd={subscription?.current_period_end || null}
      />
    </PageWrapper>
  );
}
