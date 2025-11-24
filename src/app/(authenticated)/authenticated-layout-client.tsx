"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { LinkedInTokenExpirationModal } from "@/components/linkedin-token-expiration-modal";
import { useLinkedInTokenExpiration } from "@/hooks/useLinkedInTokenExpiration";
import { createClientClient } from "@/lib/supabase-client";
import type { User } from "@supabase/supabase-js";
import {
  LayoutDashboard,
  FileText,
  CreditCard,
  Newspaper,
  BarChart3,
} from "lucide-react";
import { SharedNav } from "@/components/shared-nav";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface Subscription {
  id: number;
  user_id: string;
  provider: string;
  status: string;
  external_customer_id: string | null;
  external_subscription_id: string | null;
  price_id: string | null;
  current_period_end: string | null;
  created_at: string;
  updated_at: string;
}

interface AuthenticatedLayoutClientProps {
  children: React.ReactNode;
}

export function AuthenticatedLayoutClient({
  children,
}: AuthenticatedLayoutClientProps) {
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // LinkedIn token expiration check
  const {
    shouldShowModal,
    daysUntilExpiration,
    expiringTokens,
    isLoading: tokenLoading,
    dismissModal,
  } = useLinkedInTokenExpiration();

  // Ensure authenticated pages always use light mode
  useEffect(() => {
    // Remove dark class from document element to ensure light mode
    const ensureLightMode = () => {
      document.documentElement.classList.remove("dark");
    };

    // Remove immediately
    ensureLightMode();

    // Also remove on any DOM mutations (in case ThemeToggle from other pages tries to add it)
    const observer = new MutationObserver(() => {
      if (document.documentElement.classList.contains("dark")) {
        document.documentElement.classList.remove("dark");
      }
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => {
      observer.disconnect();
    };
  }, []);

  // Fetch user and subscription data
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const supabase = createClientClient();
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
          router.push("/auth/signin");
          return;
        }

        setUser(user);

        // Fetch subscription data
        const response = await fetch("/api/billing/portal");
        if (response.ok) {
          const subscriptionData = await response.json();
          setSubscription(subscriptionData.subscription);
        } else if (response.status === 404) {
          // No active subscription found - this is normal for free users
          setSubscription(null);
        }
      } catch (error) {
        // Only log unexpected errors (not expected auth errors like missing refresh tokens)
        if (error && typeof error === 'object' && '__isAuthError' in error) {
          // Suppress expected auth errors like refresh_token_not_found
          const authError = error as { code?: string; message?: string };
          if (authError.code !== 'refresh_token_not_found') {
            console.error("Error fetching user data:", error);
          }
        } else {
          console.error("Error fetching user data:", error);
        }
        router.push("/auth/signin");
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, [router]);

  // Check if user is on free plan (no valid subscription)
  // A subscription is valid if it's active OR if it's cancelled but hasn't reached current_period_end
  // Only consider free plan after loading is complete to prevent flicker
  const isSubscriptionValid = subscription && (
    subscription.status === "active" ||
    ((subscription.status === "canceled" || subscription.status === "cancelled") && subscription.current_period_end && new Date(subscription.current_period_end) > new Date())
  );
  const isFreePlan = !isLoading && !isSubscriptionValid;
  const shouldShowUpgrade = isFreePlan;

  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Articles", href: "/articles", icon: Newspaper },
    {
      name: "Posts",
      href: "/posts",
      icon: FileText,
      hasDropdown: true,
      submenu: [
        { name: "Published", href: "/posts/published" },
        { name: "Scheduled", href: "/posts/scheduled" },
        { name: "Drafts", href: "/posts/draft" },
      ],
    },
    { name: "Analytics", href: "/analytics", icon: BarChart3 },
  ];

  const rightActions = (
    <>
      <AnimatePresence>
        {shouldShowUpgrade && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Button variant="outline" size="sm" asChild>
              <Link href="/subscription">
                <CreditCard className="mr-2 h-4 w-4" />
                Upgrade
              </Link>
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation */}
      <SharedNav
        logoText="linkedbud"
        logoHref="/dashboard"
        navigation={navigation}
        rightActions={rightActions}
      />

      {/* Main content */}
      <main className="min-h-screen pt-24">{children}</main>

      {/* LinkedIn Token Expiration Modal */}
      <LinkedInTokenExpirationModal
        isOpen={shouldShowModal && !isLoading && !tokenLoading}
        onClose={dismissModal}
        daysUntilExpiration={daysUntilExpiration}
        expiringTokens={expiringTokens}
      />
    </div>
  );
}
