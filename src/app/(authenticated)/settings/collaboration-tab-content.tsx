"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Message } from "@/components/ui/message";
import { Trash2, Mail, UserPlus, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { createClientClient } from "@/lib/supabase-client";

interface Collaborator {
  id: number;
  user_id: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  status: string;
  invited_at: string;
  accepted_at: string | null;
}

interface Invitation {
  id: number;
  email: string;
  status: string;
  created_at: string;
  expires_at: string;
}

export function CollaborationTabContent() {
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [inviting, setInviting] = useState(false);
  const [hasGrowthPlan, setHasGrowthPlan] = useState(false);
  const [portfolioId, setPortfolioId] = useState<string | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [checkingAccess, setCheckingAccess] = useState(true);
  const [seatInfo, setSeatInfo] = useState<{
    baseSeats: number;
    additionalSeats: number;
    totalSeats: number;
    seatsUsed: number;
    seatsRemaining: number;
    canInviteMore: boolean;
  } | null>(null);
  const [purchasingSeat, setPurchasingSeat] = useState(false);
  const { toast } = useToast();
  const supabase = createClientClient();

  useEffect(() => {
    checkAccess();
  }, []);

  const checkAccess = async () => {
    setCheckingAccess(true);
    try {
      // Get user
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setCheckingAccess(false);
        return;
      }

      // Check subscription
      const { data: subscription } = await supabase
        .from("subscriptions")
        .select("price_id, status")
        .eq("user_id", user.id)
        .eq("status", "active")
        .single();

      // Check if price_id matches Growth tier
      let hasGrowth = false;
      if (subscription?.price_id) {
        // Fetch tier info from API
        const tierRes = await fetch(`/api/portfolio/check-tier?price_id=${subscription.price_id}`);
        if (tierRes.ok) {
          const tierData = await tierRes.json();
          hasGrowth = tierData.tier === "GROWTH";
        }
      }
      setHasGrowthPlan(hasGrowth);

      if (hasGrowth) {
        // Get portfolio
        const { data: portfolio } = await supabase
          .from("portfolios")
          .select("id, owner_id")
          .eq("owner_id", user.id)
          .single();

        if (portfolio) {
          setPortfolioId(portfolio.id);
          setIsOwner(true);
          loadData();
        } else {
          // Check if user is a collaborator
          const { data: collab } = await supabase
            .from("portfolio_collaborators")
            .select("portfolio_id")
            .eq("user_id", user.id)
            .eq("status", "accepted")
            .single();

          if (collab) {
            setPortfolioId(collab.portfolio_id);
            setIsOwner(false);
          } else {
            // User has Growth plan but no portfolio - try to create it
            try {
              const createRes = await fetch("/api/portfolio/create", {
                method: "POST",
              });
              if (createRes.ok) {
                const data = await createRes.json();
                setPortfolioId(data.portfolio.id);
                setIsOwner(true);
                loadData();
              }
            } catch (error) {
              console.error("Error creating portfolio:", error);
              // Portfolio creation failed, will show message below
            }
          }
        }
      }
    } catch (error) {
      console.error("Error checking access:", error);
    } finally {
      setCheckingAccess(false);
    }
  };

  const canUseFeature = hasGrowthPlan && portfolioId && isOwner;

  useEffect(() => {
    if (canUseFeature) {
      loadData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canUseFeature]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load collaborators
      const collabRes = await fetch("/api/portfolio/collaborators");
      if (collabRes.ok) {
        const collabData = await collabRes.json();
        setCollaborators(collabData.collaborators || []);
      }

      // Load invitations
      const invRes = await fetch("/api/portfolio/invitations");
      if (invRes.ok) {
        const invData = await invRes.json();
        setInvitations(invData.invitations || []);
      }

      // Load seat information (only for owners)
      if (isOwner && portfolioId) {
        const seatRes = await fetch("/api/portfolio/seats");
        if (seatRes.ok) {
          const seatData = await seatRes.json();
          setSeatInfo(seatData);
        }
      }
    } catch (error) {
      console.error("Error loading data:", error);
      toast({
        title: "Error",
        description: "Failed to load collaboration data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async () => {
    if (!email || !email.includes("@")) {
      toast({
        title: "Invalid email",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return;
    }

    // Check if there are available seats
    if (seatInfo && seatInfo.seatsRemaining === 0) {
      toast({
        title: "No seats available",
        description: "You've used all available seats. Please purchase additional seats to invite more collaborators.",
        variant: "destructive",
      });
      return;
    }

    setInviting(true);
    try {
      const res = await fetch("/api/portfolio/invitations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to send invitation");
      }

      toast({
        title: "Invitation sent",
        description: `Invitation sent to ${email}`,
        variant: "success",
      });

      setEmail("");
      loadData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send invitation",
        variant: "destructive",
      });
    } finally {
      setInviting(false);
    }
  };

  const handleRemove = async (userId: string) => {
    if (
      !confirm(
        "Are you sure you want to remove this collaborator? They will lose access to the portfolio."
      )
    ) {
      return;
    }

    try {
      const res = await fetch(`/api/portfolio/collaborators?userId=${userId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to remove collaborator");
      }

      toast({
        title: "Collaborator removed",
        description: "The collaborator has been removed from your portfolio",
        variant: "success",
      });

      loadData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to remove collaborator",
        variant: "destructive",
      });
    }
  };

  const handlePurchaseSeat = async () => {
    setPurchasingSeat(true);
    try {
      const res = await fetch("/api/portfolio/seats/checkout", {
        method: "POST",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create checkout session");
      }

      const data = await res.json();
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to start checkout",
        variant: "destructive",
      });
      setPurchasingSeat(false);
    }
  };

  if (checkingAccess) {
    return (
      <Card>
        <CardContent className="py-6">
          <p className="text-muted-foreground">Loading...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {!canUseFeature && (
        <Message variant="info" title="Growth Plan Required">
          {!hasGrowthPlan ? (
            <>
              Collaboration features are available on the Growth plan.{" "}
              <Link
                href="/subscription"
                className="font-medium underline underline-offset-4 hover:no-underline"
              >
                Upgrade to Growth
              </Link>{" "}
              to invite team members and collaborate on your portfolio.
            </>
          ) : !portfolioId ? (
            "Unable to create portfolio. Please ensure you have an active Growth plan subscription and try refreshing the page."
          ) : !isOwner ? (
            "Only portfolio owners can manage collaborators."
          ) : null}
        </Message>
      )}

      {isOwner && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Available Seats
            </CardTitle>
            <CardDescription>
              Manage your team seats and purchase additional ones if needed
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading || !seatInfo ? (
              <div className="space-y-4 animate-pulse">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 border rounded-lg">
                    <div className="h-4 bg-gray-200 rounded w-20 mb-2"></div>
                    <div className="h-8 bg-gray-200 rounded w-12 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-32"></div>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <div className="h-4 bg-gray-200 rounded w-20 mb-2"></div>
                    <div className="h-8 bg-gray-200 rounded w-12 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-24"></div>
                  </div>
                </div>
                <div className="h-10 bg-gray-200 rounded w-full"></div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 border rounded-lg">
                    <p className="text-sm text-muted-foreground">Total Seats</p>
                    <p className="text-2xl font-bold">{seatInfo.totalSeats}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {seatInfo.baseSeats} base + {seatInfo.additionalSeats} additional
                    </p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <p className="text-sm text-muted-foreground">Seats Used</p>
                    <p className="text-2xl font-bold">{seatInfo.seatsUsed}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {seatInfo.seatsRemaining} remaining
                    </p>
                  </div>
                </div>

                {seatInfo.seatsRemaining === 0 && (
                  <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                    <p className="text-sm text-orange-800">
                      You&apos;ve used all available seats. Purchase additional seats to invite more collaborators.
                    </p>
                  </div>
                )}

                <Button
                  onClick={handlePurchaseSeat}
                  disabled={purchasingSeat}
                  className="w-full"
                >
                  {purchasingSeat ? "Processing..." : "Purchase Additional Seat"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Invite Collaborator</CardTitle>
          <CardDescription>
            Send an invitation to collaborate on your portfolio
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              type="email"
              placeholder="Enter email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && canUseFeature && seatInfo?.seatsRemaining !== 0) {
                  handleInvite();
                }
              }}
              disabled={!canUseFeature || (seatInfo?.seatsRemaining === 0)}
            />
            <Button
              onClick={handleInvite}
              disabled={!canUseFeature || inviting || (seatInfo?.seatsRemaining === 0)}
            >
              <UserPlus className="mr-2 h-4 w-4" />
              {inviting ? "Sending..." : "Send Invitation"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Pending Invitations</CardTitle>
          <CardDescription>
            Invitations that have been sent but not yet accepted
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2 animate-pulse">
              {[1, 2].map((i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-4 w-4 bg-gray-200 rounded"></div>
                    <div>
                      <div className="h-4 bg-gray-200 rounded w-48 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-32"></div>
                    </div>
                  </div>
                  <div className="h-4 bg-gray-200 rounded w-16"></div>
                </div>
              ))}
            </div>
          ) : invitations.length === 0 ? (
            <p className="text-muted-foreground">No pending invitations</p>
          ) : (
            <div className="space-y-2">
              {invitations.map((invitation) => (
                <div
                  key={invitation.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{invitation.email}</p>
                      <p className="text-sm text-muted-foreground">
                        Expires:{" "}
                        {new Date(invitation.expires_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {invitation.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Collaborators</CardTitle>
          <CardDescription>
            Team members who have access to your portfolio
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2 animate-pulse">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-gray-200"></div>
                    <div>
                      <div className="h-4 bg-gray-200 rounded w-40 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-48"></div>
                    </div>
                  </div>
                  <div className="h-8 w-8 bg-gray-200 rounded"></div>
                </div>
              ))}
            </div>
          ) : collaborators.length === 0 ? (
            <p className="text-muted-foreground">No collaborators yet</p>
          ) : (
            <div className="space-y-2">
              {collaborators.map((collaborator) => (
                <div
                  key={collaborator.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-sm font-medium">
                        {collaborator.first_name?.[0] ||
                          collaborator.email?.[0] ||
                          "?"}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium">
                        {collaborator.first_name && collaborator.last_name
                          ? `${collaborator.first_name} ${collaborator.last_name}`
                          : collaborator.email || "Unknown"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {collaborator.email}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemove(collaborator.user_id)}
                    disabled={!canUseFeature}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

