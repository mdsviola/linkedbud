"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageWrapper } from "@/components/ui/page-wrapper";
import { createClientClient } from "@/lib/supabase-client";
import { formatDateOnly } from "@/lib/utils";
import { Crown, Mail, User, Linkedin, Users, Sparkles } from "lucide-react";
import { useFormSubmission } from "@/hooks/useFormSubmission";
import { DeleteConfirmationModal } from "@/components/delete-confirmation-modal";
import { LinkedInOrganizationDB } from "@/lib/linkedin";
import { CommaSeparatedInput } from "@/components/ui/comma-separated-input";
import {
  getTierPricing,
  formatPrice,
  getPricingConfig,
} from "@/lib/pricing-config";
import {
  getTierFromPriceId,
  getTierDisplayName,
  type PricingTier,
} from "@/lib/tier-utils";
import { CollaborationTabContent } from "./collaboration-tab-content";
import { LinkedInIntegrationBlocks } from "@/components/linkedin-integration-blocks";
import { VoiceCustomizationTabContent } from "./voice-customization-tab-content";

interface User {
  id: string;
  email?: string;
}

interface UserPrefs {
  topics: string[];
  tone: string;
  email_reminders: boolean;
  user_corpus: any;
}

interface Subscription {
  status: string;
  current_period_end: string;
  external_subscription_id?: string;
  price_id?: string;
}

interface LinkedInAccount {
  id: number;
  linkedin_user_id: string;
  profile_data: {
    firstName: string;
    lastName: string;
    profilePicture?: string;
  };
  is_active: boolean;
  created_at: string;
  token_expires_at: string | null;
}

interface SettingsClientProps {
  user: User;
}

export function SettingsClient({ user }: SettingsClientProps) {
  const router = useRouter();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [subscriptionTier, setSubscriptionTier] = useState<PricingTier | null>(
    null
  );
  const [tierLoading, setTierLoading] = useState(false);
  const [linkedinAccount, setLinkedinAccount] =
    useState<LinkedInAccount | null>(null);
  const [communityToken, setCommunityToken] = useState<LinkedInAccount | null>(
    null
  );
  const [organizations, setOrganizations] = useState<LinkedInOrganizationDB[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("account");
  const supabase = createClientClient();

  const linkedinForm = useFormSubmission();
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingType, setDeletingType] = useState<
    "personal" | "organizations" | null
  >(null);
  const [topics, setTopics] = useState<string[]>([]);
  const [customRssFeeds, setCustomRssFeeds] = useState<string[]>([]);
  const [topicsForm, setTopicsForm] = useState({
    status: "idle" as "idle" | "submitting" | "success" | "error",
    message: "",
  });

  useEffect(() => {
    fetchSettings();
    fetchTopics();
  }, []);

  const fetchTopics = async () => {
    try {
      const response = await fetch("/api/preferences");
      if (response.ok) {
        const data = await response.json();
        setTopics(data.topics || []);
        setCustomRssFeeds(data.custom_rss_feeds || []);
      }
    } catch (error) {
      console.error("Failed to fetch topics:", error);
    }
  };

  const handleSaveTopics = async () => {
    setTopicsForm({ status: "submitting", message: "" });

    try {
      const response = await fetch("/api/preferences", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          topics: topics,
          custom_rss_feeds: customRssFeeds, // Preserve existing RSS feeds
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update topics");
      }

      setTopicsForm({
        status: "success",
        message: "Topics updated successfully",
      });

      // Clear success message after 3 seconds
      setTimeout(() => {
        setTopicsForm({ status: "idle", message: "" });
      }, 3000);
    } catch (error) {
      setTopicsForm({
        status: "error",
        message:
          error instanceof Error ? error.message : "Failed to update topics",
      });
    }
  };

  // Handle URL hash and query parameters to set active tab
  useEffect(() => {
    // Only run on client side to prevent hydration issues
    if (typeof window === "undefined") return;

    const handleHashChange = () => {
      const hash = window.location.hash.slice(1); // Remove the # symbol
      if (
        hash &&
        ["account", "integrations", "billing", "collaboration"].includes(hash)
      ) {
        setActiveTab(hash);
      }
    };

    const handleLocationChange = () => {
      // Check for hash first
      const hash = window.location.hash.slice(1);
      if (
        hash &&
        ["account", "integrations", "billing", "collaboration"].includes(hash)
      ) {
        setActiveTab(hash);
      } else {
        // Check for query parameters that might indicate integrations tab
        const urlParams = new URLSearchParams(window.location.search);
        if (
          urlParams.has("linkedin_success") ||
          urlParams.has("linkedin_error")
        ) {
          setActiveTab("integrations");
        }
      }
    };

    // Check on mount
    handleLocationChange();

    // Listen for hash changes and popstate events
    window.addEventListener("hashchange", handleHashChange);
    window.addEventListener("popstate", handleLocationChange);
    return () => {
      window.removeEventListener("hashchange", handleHashChange);
      window.removeEventListener("popstate", handleLocationChange);
    };
  }, []);

  const fetchSettings = async () => {
    try {
      // Use the same API endpoint as subscription page for consistency
      // This uses getUserSubscription which handles NULL membership_type and excludes addons
      const response = await fetch("/api/billing/portal");

      if (response.ok) {
        const data = await response.json();
        const subData = data.subscription;

        if (subData) {
          setSubscription({
            status: subData.status,
            current_period_end: subData.current_period_end,
            external_subscription_id: subData.external_subscription_id,
            price_id: subData.price_id,
          });

          // Fetch tier from server-side API (uses server env vars)
          if (subData.price_id) {
            setTierLoading(true);
            try {
              const tierResponse = await fetch(
                `/api/portfolio/check-tier?price_id=${subData.price_id}`
              );
              if (tierResponse.ok) {
                const tierData = await tierResponse.json();
                setSubscriptionTier(tierData.tier);
              } else {
                // Fallback to client-side detection
                const tier = getTierFromPriceId(subData.price_id);
                setSubscriptionTier(tier);
              }
            } catch (error) {
              console.error("Error fetching tier:", error);
              // Fallback to client-side detection
              const tier = getTierFromPriceId(subData.price_id);
              setSubscriptionTier(tier);
            } finally {
              setTierLoading(false);
            }
          } else {
            // No price_id means free tier
            setSubscriptionTier("FREE");
            setTierLoading(false);
          }
        } else {
          // No subscription found
          setSubscription(null);
          setSubscriptionTier("FREE");
          setTierLoading(false);
        }
      } else if (response.status === 404) {
        // No active subscription found - this is normal for free users
        setSubscription(null);
        setSubscriptionTier("FREE");
        setTierLoading(false);
      } else {
        // Handle other errors
        console.error(
          "Failed to fetch subscription:",
          response.status,
          response.statusText
        );
        setSubscription(null);
        setSubscriptionTier("FREE");
        setTierLoading(false);
      }

      // Fetch LinkedIn personal token status
      const { data: personalToken, error: personalTokenError } = await supabase
        .from("linkedin_tokens")
        .select(
          "id, linkedin_user_id, profile_data, is_active, created_at, token_expires_at"
        )
        .eq("user_id", user.id)
        .eq("type", "personal")
        .eq("is_active", true)
        .maybeSingle();

      if (!personalTokenError && personalToken) {
        setLinkedinAccount(personalToken);
      } else {
        // Clear state if token was deleted/revoked
        setLinkedinAccount(null);
      }

      // Fetch LinkedIn community token status
      const { data: communityTokenData, error: communityTokenError } =
        await supabase
          .from("linkedin_tokens")
          .select(
            "id, linkedin_user_id, profile_data, is_active, created_at, token_expires_at"
          )
          .eq("user_id", user.id)
          .eq("type", "community")
          .eq("is_active", true)
          .maybeSingle();

      const hasCommunityToken = !communityTokenError && communityTokenData;

      if (hasCommunityToken) {
        setCommunityToken(communityTokenData);
      } else {
        setCommunityToken(null);
      }

      // Fetch LinkedIn organizations
      // Only show organizations if community token exists (organizations require active token)
      const { data: orgData, error: orgError } = await supabase
        .from("linkedin_organizations")
        .select("*")
        .eq("user_id", user.id);

      if (!orgError && orgData) {
        // Only set organizations if community token exists
        // If token was deleted/revoked, organizations should be cleared too
        if (hasCommunityToken) {
          setOrganizations(orgData);
        } else {
          // If no community token, clear organizations (they require active token)
          setOrganizations([]);
        }
      } else if (orgError) {
        console.error("Settings: Error fetching organizations:", orgError);
        // Check if it's a table doesn't exist error
        if (
          orgError.message.includes("relation") &&
          orgError.message.includes("does not exist")
        ) {
          console.log(
            "Settings: linkedin_organizations table doesn't exist yet - migration needs to be applied"
          );
          setOrganizations([]);
        } else {
          setOrganizations([]);
        }
      } else {
        // No organizations found
        setOrganizations([]);
      }
    } catch (err) {
      console.error("Failed to load settings:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleLinkedInConnect = async () => {
    try {
      window.location.href = "/api/linkedin/auth";
    } catch (err) {
      console.error("Failed to initiate LinkedIn connection:", err);
    }
  };

  const handleLinkedInOrganizationsConnect = async () => {
    try {
      window.location.href = "/api/linkedin/organizations/auth";
    } catch (err) {
      console.error(
        "Failed to initiate LinkedIn organizations connection:",
        err
      );
    }
  };

  const handleLinkedInOrganizationsDisconnect = async () => {
    setDeletingType("organizations");
    setDeleteModalOpen(true);
  };

  const confirmLinkedInOrganizationsDisconnect = async () => {
    await linkedinForm.submit(async () => {
      // Revoke token with LinkedIn first (removes app from user's permitted services)
      try {
        const revokeResponse = await fetch("/api/linkedin/revoke", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ type: "community" }),
        });

        if (!revokeResponse.ok) {
          // Log but don't fail - continue with local deletion
          console.warn(
            "Failed to revoke LinkedIn token, continuing with local deletion"
          );
        }
      } catch (revokeError) {
        // Log but don't fail - continue with local deletion
        console.warn("Error revoking LinkedIn token:", revokeError);
      }

      // Delete organizations first
      const { error: orgError } = await supabase
        .from("linkedin_organizations")
        .delete()
        .eq("user_id", user.id);

      if (orgError) {
        throw new Error(
          "Failed to disconnect LinkedIn organizations. Please try again."
        );
      }

      // Delete the community token
      const { error: tokenError } = await supabase
        .from("linkedin_tokens")
        .delete()
        .eq("user_id", user.id)
        .eq("type", "community");

      if (tokenError) {
        throw new Error(
          "Failed to delete community management token. Please try again."
        );
      }

      // Also clean up linkedin_accounts if it exists for organization type
      const { error: accountError } = await supabase
        .from("linkedin_accounts")
        .delete()
        .eq("user_id", user.id)
        .eq("account_type", "organization");

      if (accountError) {
        // Log but don't fail - account cleanup is secondary to token deletion
        console.warn("Failed to clean up linkedin_accounts:", accountError);
      }

      setOrganizations([]);
      setCommunityToken(null);
      // Refresh settings to update UI
      await fetchSettings();
    }, "LinkedIn community management disconnected successfully");

    setDeletingType(null);
    setDeleteModalOpen(false);
  };

  const handleLinkedInDisconnect = async () => {
    if (!linkedinAccount) return;

    setDeletingType("personal");
    setDeleteModalOpen(true);
  };

  const confirmLinkedInDisconnect = async () => {
    await linkedinForm.submit(async () => {
      // Revoke token with LinkedIn first (removes app from user's permitted services)
      try {
        const revokeResponse = await fetch("/api/linkedin/revoke", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ type: "personal" }),
        });

        if (!revokeResponse.ok) {
          // Log but don't fail - continue with local deletion
          console.warn(
            "Failed to revoke LinkedIn token, continuing with local deletion"
          );
        }
      } catch (revokeError) {
        // Log but don't fail - continue with local deletion
        console.warn("Error revoking LinkedIn token:", revokeError);
      }

      // Delete the personal token
      const { error: tokenError } = await supabase
        .from("linkedin_tokens")
        .delete()
        .eq("user_id", user.id)
        .eq("type", "personal");

      if (tokenError) {
        throw new Error(
          "Failed to disconnect LinkedIn account. Please try again."
        );
      }

      // Also clean up linkedin_accounts if it exists
      const { error: accountError } = await supabase
        .from("linkedin_accounts")
        .delete()
        .eq("user_id", user.id)
        .eq("account_type", "personal");

      if (accountError) {
        // Log but don't fail - account cleanup is secondary to token deletion
        console.warn("Failed to clean up linkedin_accounts:", accountError);
      }

      setLinkedinAccount(null);
      // Refresh settings to update UI
      await fetchSettings();
    }, "LinkedIn profile disconnected successfully");

    setDeletingType(null);
    setDeleteModalOpen(false);
  };

  if (loading) {
    return (
      <PageWrapper maxWidth="4xl">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
          <div className="space-y-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper maxWidth="4xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600">Manage your account and preferences</p>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-6"
      >
        <TabsList>
          <TabsTrigger value="account">
            <User className="h-4 w-4 mr-2" />
            Account
          </TabsTrigger>
          <TabsTrigger value="integrations">
            <Linkedin className="h-4 w-4 mr-2" />
            Integrations
          </TabsTrigger>
          <TabsTrigger value="collaboration">
            <Users className="h-4 w-4 mr-2" />
            Collaboration
          </TabsTrigger>
          <TabsTrigger value="voice">
            <Sparkles className="h-4 w-4 mr-2" />
            Voice Customization
          </TabsTrigger>
          <TabsTrigger value="billing">
            <Crown className="h-4 w-4 mr-2" />
            Billing
          </TabsTrigger>
        </TabsList>

        <TabsContent value="account" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Account Information</CardTitle>
              <CardDescription>
                Manage your topics and preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <CommaSeparatedInput
                id="topics"
                label="Topics"
                placeholder="e.g., technology, business, healthcare, marketing, finance"
                value={topics}
                onChange={setTopics}
                description="Enter topics related to your industry (comma-separated). These help us find relevant news and personalize your content."
              />

              <div className="pt-2">
                <Button
                  onClick={handleSaveTopics}
                  disabled={topicsForm.status === "submitting"}
                >
                  {topicsForm.status === "submitting"
                    ? "Saving..."
                    : "Save Topics"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integrations" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>LinkedIn Integration</CardTitle>
              <CardDescription>
                Complete both steps to enable full LinkedIn functionality
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <LinkedInIntegrationBlocks
                linkedinAccount={linkedinAccount}
                communityToken={communityToken}
                organizations={organizations}
                onPersonalConnect={handleLinkedInConnect}
                onCommunityConnect={handleLinkedInOrganizationsConnect}
                onPersonalDisconnect={handleLinkedInDisconnect}
                onCommunityDisconnect={handleLinkedInOrganizationsDisconnect}
                isDisconnecting={linkedinForm.status === "submitting"}
                showRevokeButtons={true}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="collaboration" className="space-y-6">
          <CollaborationTabContent />
        </TabsContent>

        <TabsContent value="voice" className="space-y-6">
          <VoiceCustomizationTabContent organizations={organizations} />
        </TabsContent>

        <TabsContent value="billing" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Billing & Subscription</CardTitle>
              <CardDescription>
                Manage your subscription and billing information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {subscription ? (
                (() => {
                  // Use tier from API if available, otherwise fallback
                  const tier =
                    subscriptionTier ||
                    getTierFromPriceId(subscription.price_id) ||
                    "PRO";
                  const tierPricing = getTierPricing(tier);
                  const tierDisplayName = getTierDisplayName(tier);
                  const isCanceled = subscription.status === "canceled" || subscription.status === "cancelled";

                  // Use orange/amber colors for cancelled subscriptions, green for active
                  const bgColor = isCanceled ? "bg-amber-50" : "bg-green-50";
                  const borderColor = isCanceled ? "border-amber-200" : "border-green-200";
                  const iconColor = isCanceled ? "text-amber-600" : "text-green-600";
                  const textColor = isCanceled ? "text-amber-900" : "text-green-900";
                  const labelColor = isCanceled ? "text-amber-700" : "text-green-700";

                  return (
                    <>
                      <div className={`${bgColor} p-6 rounded-lg border ${borderColor}`}>
                        <div className="flex items-center gap-2 mb-4">
                          <Crown className={`h-6 w-6 ${iconColor}`} />
                          <span className={`text-lg font-semibold ${textColor}`}>
                            {tierLoading
                              ? "Loading..."
                              : `${tierDisplayName} Plan${!isCanceled ? " Active" : ""}`}
                          </span>
                        </div>

                        {!tierLoading && (
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <span className={`text-sm ${labelColor}`}>
                                Plan:
                              </span>
                              <p className={`font-medium ${textColor}`}>
                                {tierDisplayName} Plan
                              </p>
                            </div>
                            <div>
                              <span className={`text-sm ${labelColor}`}>
                                Status:
                              </span>
                              <p className={`font-medium ${textColor} capitalize`}>
                                {subscription.status}
                              </p>
                            </div>
                            {!isCanceled && (
                              <div>
                                <span className={`text-sm ${labelColor}`}>
                                  Next Billing:
                                </span>
                                <p className={`font-medium ${textColor}`}>
                                  {formatDateOnly(
                                    subscription.current_period_end
                                  )}
                                </p>
                              </div>
                            )}
                            {isCanceled && subscription.current_period_end && (
                              <div>
                                <span className={`text-sm ${labelColor}`}>
                                  Access Until:
                                </span>
                                <p className={`font-medium ${textColor}`}>
                                  {formatDateOnly(
                                    subscription.current_period_end
                                  )}
                                </p>
                              </div>
                            )}
                            <div>
                              <span className={`text-sm ${labelColor}`}>
                                Price:
                              </span>
                              <p className={`font-medium ${textColor}`}>
                                {typeof tierPricing.monthlyPrice === "number"
                                  ? `${formatPrice(
                                      tierPricing.monthlyPrice,
                                      getPricingConfig().currency
                                    )}/month`
                                  : "Custom"}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="mt-4">
                        <Button variant="outline" asChild>
                          <a href="/subscription">Manage Subscription</a>
                        </Button>
                      </div>
                    </>
                  );
                })()
              ) : (
                <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                  <div className="flex items-center gap-2 mb-4">
                    <Mail className="h-6 w-6 text-gray-600" />
                    <span className="text-lg font-semibold text-gray-900">
                      Free Plan
                    </span>
                  </div>
                  <p className="text-gray-700 mb-4">
                    You&apos;re currently on the free plan with limited draft
                    generations
                  </p>
                  <Button asChild>
                    <Link href="/subscription">Upgrade to Starter</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <DeleteConfirmationModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setDeletingType(null);
        }}
        onConfirm={
          deletingType === "personal"
            ? confirmLinkedInDisconnect
            : deletingType === "organizations"
            ? confirmLinkedInOrganizationsDisconnect
            : () => {}
        }
        title={
          deletingType === "personal"
            ? "Disconnect LinkedIn Profile"
            : deletingType === "organizations"
            ? "Disconnect Community Management"
            : "Confirm Action"
        }
        description={
          deletingType === "personal"
            ? "Are you sure you want to disconnect your LinkedIn profile? You'll need to reconnect to publish posts."
            : deletingType === "organizations"
            ? "Are you sure you want to disconnect your community management connection? You'll need to reconnect to fetch metrics and publish to organization pages."
            : "Are you sure you want to proceed?"
        }
        confirmText={
          deletingType === "personal"
            ? "Disconnect Profile"
            : deletingType === "organizations"
            ? "Disconnect Community Management"
            : "Confirm"
        }
        cancelText="Cancel"
        isLoading={linkedinForm.status === "submitting"}
      />
    </PageWrapper>
  );
}
