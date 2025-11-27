"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DeleteConfirmationModal } from "@/components/delete-confirmation-modal";
import { Badge } from "@/components/ui/badge";
import { BackButton } from "@/components/ui/back-button";
import { getVariantName } from "@/lib/variant-mapping";
import { formatDateOnly } from "@/lib/utils";
import {
  getTierFromPriceId,
  getTierDisplayName,
  getAllTiers,
  getPriceIdFromTier,
  tierRequiresPriceId,
  type PricingTier,
} from "@/lib/tier-utils";
import {
  Loader2,
  User,
  Calendar,
  CreditCard,
  Settings,
  Trash2,
  Edit,
  Crown,
} from "lucide-react";

interface UserData {
  id: string;
  email: string | null;
  role: string;
  created_at: string;
  subscriptions: Array<{
    id: number;
    provider: string;
    status: string;
    current_period_end: string | null;
    external_subscription_id: string | null;
    price_id: string | null;
    created_at: string;
    updated_at: string;
  }>;
  usage_counters: {
    total_generations: number;
    generation_counts: { [key: string]: number } | null;
  } | null;
}

interface UserDetailClientProps {
  userId: string;
}

export function UserDetailClient({ userId }: UserDetailClientProps) {
  const router = useRouter();
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [subscriptionDialogOpen, setSubscriptionDialogOpen] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState("");
  const [subscriptionEndDate, setSubscriptionEndDate] = useState("");
  const [externalSubscriptionId, setExternalSubscriptionId] = useState("");
  const [subscriptionTier, setSubscriptionTier] = useState<PricingTier>("FREE");
  const [updatingSubscription, setUpdatingSubscription] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  useEffect(() => {
    fetchUser();
  }, [userId]);

  const fetchUser = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/users/${userId}`);

      if (!response.ok) {
        throw new Error("Failed to fetch user");
      }

      const data = await response.json();
      setUser(data.user);
    } catch (error) {
      console.error("Error fetching user:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubscriptionOverride = () => {
    const subscription = user?.subscriptions[0];
    if (subscription) {
      setSubscriptionStatus(subscription.status);
      setSubscriptionEndDate(
        subscription.current_period_end
          ? subscription.current_period_end.split("T")[0]
          : ""
      );
      setExternalSubscriptionId(subscription.external_subscription_id || "");
      // Determine tier from price_id
      const tier = getTierFromPriceId(subscription.price_id);
      setSubscriptionTier(tier);
    } else {
      setSubscriptionStatus("");
      setSubscriptionEndDate("");
      setExternalSubscriptionId("");
      setSubscriptionTier("FREE");
    }
    setSubscriptionDialogOpen(true);
  };

  const handleUpdateSubscription = async () => {
    if (!user) return;

    try {
      setUpdatingSubscription(true);

      // Get price_id from tier selection
      const priceId =
        subscriptionTier === "FREE"
          ? null
          : getPriceIdFromTier(subscriptionTier);

      const response = await fetch(`/api/admin/users/${user.id}/subscription`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: subscriptionStatus,
          current_period_end: subscriptionEndDate || null,
          external_subscription_id: externalSubscriptionId || null,
          price_id: priceId,
          tier: subscriptionTier,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update subscription");
      }

      // Refresh user data
      await fetchUser();
      setSubscriptionDialogOpen(false);
    } catch (error) {
      console.error("Error updating subscription:", error);
      alert(
        error instanceof Error ? error.message : "Failed to update subscription"
      );
    } finally {
      setUpdatingSubscription(false);
    }
  };

  const handleDeleteSubscription = () => {
    setDeleteModalOpen(true);
  };

  const confirmDeleteSubscription = async () => {
    if (!user) return;

    try {
      const response = await fetch(`/api/admin/users/${user.id}/subscription`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete subscription");
      }

      // Refresh user data
      await fetchUser();
    } catch (error) {
      console.error("Error deleting subscription:", error);
    } finally {
      setDeleteModalOpen(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "canceled":
      case "cancelled":
        return "bg-amber-100 text-amber-800";
      case "past_due":
        return "bg-yellow-100 text-yellow-800";
      case "trialing":
        return "bg-blue-100 text-blue-800";
      case "paused":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatDate = (dateString: string) => {
    return formatDateOnly(dateString);
  };

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
        <div className="space-y-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-48 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center">
        <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
        <p className="text-gray-600 mb-4">User not found</p>
        <Button onClick={() => router.push("/admin/users")}>
          Back to Users
        </Button>
      </div>
    );
  }

  const subscription = user.subscriptions[0];
  const usageCount = user.usage_counters?.total_generations || 0;
  const generationCounts = user.usage_counters?.generation_counts || {};
  const currentTier = subscription
    ? getTierFromPriceId(subscription.price_id)
    : "FREE";

  return (
    <div className="space-y-6">
      {/* Back button positioned above the title */}
      <div>
        <BackButton href="/admin/users">Back to Users</BackButton>
      </div>

      {/* Title and actions section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {user.email || `User ${user.id.slice(0, 8)}`}
          </h1>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSubscriptionOverride}
          >
            <Edit className="h-4 w-4 mr-1" />
            Manage Subscription
          </Button>
          {subscription && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleDeleteSubscription}
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* User Information */}
      <Card>
        <CardHeader>
          <CardTitle>User Information</CardTitle>
          <CardDescription>
            Basic account details
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <div className="flex items-center gap-3">
                <User className="h-5 w-5 text-gray-400" />
                <p className="text-sm text-gray-500">User ID</p>
              </div>
              <p className="text-sm text-gray-900 break-all mt-2">{user.id}</p>
            </div>
            <div>
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-gray-400" />
                <p className="text-sm text-gray-500">Joined</p>
              </div>
              <p className="text-sm text-gray-900 mt-2">
                {formatDate(user.created_at)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Subscription Card */}
      <Card>
        <CardHeader>
          <CardTitle>Subscription Details</CardTitle>
          <CardDescription>
            Current subscription information and billing details
          </CardDescription>
        </CardHeader>
        <CardContent>
          {subscription ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <div className="flex items-center gap-3">
                  <Crown className="h-5 w-5 text-gray-400" />
                  <p className="text-sm text-gray-500">Tier</p>
                </div>
                <div className="mt-2">
                  <Badge className="bg-purple-100 text-purple-800 font-semibold">
                    {getTierDisplayName(currentTier)}
                  </Badge>
                </div>
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <CreditCard className="h-5 w-5 text-gray-400" />
                  <p className="text-sm text-gray-500">Status</p>
                </div>
                <div className="mt-2">
                  <Badge className={getStatusColor(subscription.status)}>
                    {subscription.status}
                  </Badge>
                </div>
              </div>
              {subscription.current_period_end && (
                <div>
                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-gray-400" />
                    <p className="text-sm text-gray-500">Period End</p>
                  </div>
                  <p className="text-sm text-gray-900 mt-2">
                    {formatDate(subscription.current_period_end)}
                  </p>
                </div>
              )}
              {subscription.external_subscription_id && (
                <div>
                  <div className="flex items-center gap-3">
                    <Settings className="h-5 w-5 text-gray-400" />
                    <p className="text-sm text-gray-500">
                      LemonSqueezy Subscription ID
                    </p>
                  </div>
                  <p className="text-sm text-gray-900 font-mono break-all mt-2">
                    {subscription.external_subscription_id}
                  </p>
                </div>
              )}
              <div>
                <div className="flex items-center gap-3">
                  <User className="h-5 w-5 text-gray-400" />
                  <p className="text-sm text-gray-500">Provider</p>
                </div>
                <p className="text-sm text-gray-900 capitalize mt-2">
                  {subscription.provider}
                </p>
              </div>
              {subscription.price_id && (
                <div>
                  <div className="flex items-center gap-3">
                    <Settings className="h-5 w-5 text-gray-400" />
                    <p className="text-sm text-gray-500">Price ID</p>
                  </div>
                  <p className="text-sm text-gray-900 font-mono mt-2">
                    {subscription.price_id}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No active subscription
            </div>
          )}
        </CardContent>
      </Card>

      {/* User Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>Statistics</CardTitle>
          <CardDescription>
            Total generation count: {usageCount}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {(() => {
              // Format type names for display
              const formatLabel = (type: string): string => {
                const labelMap: Record<string, string> = {
                  draft: "Draft Generations",
                  polish: "Polish Generations",
                  for_you: "For You Generations",
                  rewrite_with_ai: "Rewrite with AI",
                  ai_insights: "AI Insights",
                };
                return (
                  labelMap[type] ||
                  type
                    .split("_")
                    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                    .join(" ")
                );
              };

              // Get all generation types from the data, sorted for consistency
              const allTypes = Object.keys(generationCounts).sort();

              // If no counters exist, show all known types with 0
              const typesToShow =
                allTypes.length > 0
                  ? allTypes
                  : ["draft", "polish", "for_you", "rewrite_with_ai", "ai_insights"];

              return typesToShow.map((type) => (
                <div key={type}>
                  <div className="flex items-center gap-3">
                    <Settings className="h-5 w-5 text-gray-400" />
                    <p className="text-sm text-gray-500">{formatLabel(type)}</p>
                  </div>
                  <p className="text-sm text-gray-900 mt-2">
                    {generationCounts[type] || 0}
                  </p>
                </div>
              ));
            })()}
          </div>
        </CardContent>
      </Card>

      {/* Subscription Override Dialog */}
      <Dialog
        open={subscriptionDialogOpen}
        onOpenChange={setSubscriptionDialogOpen}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Manage Subscription</DialogTitle>
            <DialogDescription>
              Manage subscription for {user.email || user.id}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-6">
            <div>
              <Label htmlFor="tier">Subscription Tier</Label>
              <select
                id="tier"
                value={subscriptionTier}
                onChange={(e) => {
                  const newTier = e.target.value as PricingTier;
                  setSubscriptionTier(newTier);
                  // If setting to FREE, clear status and external ID
                  if (newTier === "FREE") {
                    setSubscriptionStatus("");
                    setExternalSubscriptionId("");
                  } else if (!subscriptionStatus) {
                    // Auto-set status to active if not set and tier is not FREE
                    setSubscriptionStatus("active");
                  }
                }}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {getAllTiers().map((tier) => (
                  <option key={tier} value={tier}>
                    {getTierDisplayName(tier)}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Select the subscription tier for this user
              </p>
            </div>

            {subscriptionTier !== "FREE" && (
              <div>
                <Label htmlFor="status">Status</Label>
                <select
                  id="status"
                  value={subscriptionStatus}
                  onChange={(e) => setSubscriptionStatus(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="">Select status</option>
                  <option value="active">Active</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="past_due">Past Due</option>
                  <option value="trialing">Trialing</option>
                  <option value="paused">Paused</option>
                </select>
              </div>
            )}

            {subscriptionTier !== "FREE" && (
              <div>
                <Label htmlFor="endDate">End Date (Optional)</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={subscriptionEndDate}
                  onChange={(e) => setSubscriptionEndDate(e.target.value)}
                  className="mt-1"
                />
              </div>
            )}

            {subscriptionStatus === "active" && subscriptionTier !== "FREE" && (
              <div>
                <Label htmlFor="externalId">
                  LemonSqueezy Subscription ID (Optional)
                </Label>
                <Input
                  id="externalId"
                  type="text"
                  placeholder="sub_xxxxxxxxxx"
                  value={externalSubscriptionId}
                  onChange={(e) => setExternalSubscriptionId(e.target.value)}
                  className="mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Required for active subscriptions to enable cancellation via
                  LemonSqueezy
                </p>
              </div>
            )}
          </div>

          <DialogFooter className="mt-6 gap-3">
            <Button
              variant="outline"
              onClick={() => setSubscriptionDialogOpen(false)}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdateSubscription}
              disabled={
                (subscriptionTier !== "FREE" && !subscriptionStatus) ||
                updatingSubscription
              }
              className="w-full sm:w-auto"
            >
              {updatingSubscription ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update Subscription"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <DeleteConfirmationModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={confirmDeleteSubscription}
        title="Delete Subscription"
        description="Are you sure you want to delete this user's subscription? This action cannot be undone."
        confirmText="Delete Subscription"
        cancelText="Cancel"
        isLoading={false}
      />
    </div>
  );
}
