"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
import { createClientClient } from "@/lib/supabase-client";
import { Plus, X, Check, Mail, CheckCircle2, LogOut, Linkedin } from "lucide-react";
import { RssFeedSelector } from "@/components/rss-feed-selector";
import { LinkedInIntegrationBlocks } from "@/components/linkedin-integration-blocks";
import { DeleteConfirmationModal } from "@/components/delete-confirmation-modal";
import { useFormSubmission } from "@/hooks/useFormSubmission";
import { LinkedInOrganizationDB } from "@/lib/linkedin";

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

export default function OnboardingPage() {
  const [step, setStep] = useState<"verification" | "preferences" | "integrations">(
    "verification"
  );
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [keywords, setKeywords] = useState<string[]>([]);
  const [keywordInput, setKeywordInput] = useState("");
  const [linkedinPosts, setLinkedinPosts] = useState([""]);
  const [selectedRssFeeds, setSelectedRssFeeds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [user, setUser] = useState<any>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [linkedinAccount, setLinkedinAccount] = useState<LinkedInAccount | null>(null);
  const [communityToken, setCommunityToken] = useState<LinkedInAccount | null>(null);
  const [organizations, setOrganizations] = useState<LinkedInOrganizationDB[]>([]);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingType, setDeletingType] = useState<"personal" | "organizations" | null>(null);
  const linkedinForm = useFormSubmission();
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClientClient();

  // Get invitation token from URL
  const inviteToken = searchParams.get("invite_token");

  // Helper function to get redirect URL (invitation acceptance or home)
  const getRedirectUrl = () => {
    if (inviteToken) {
      return `/invite/accept/${inviteToken}`;
    }
    return "/";
  };

  // Fetch LinkedIn token status
  const fetchLinkedInStatus = async (userId: string) => {
    try {
      // Fetch LinkedIn personal token status
      const { data: personalToken, error: personalTokenError } = await supabase
        .from("linkedin_tokens")
        .select(
          "id, linkedin_user_id, profile_data, is_active, created_at, token_expires_at"
        )
        .eq("user_id", userId)
        .eq("type", "personal")
        .eq("is_active", true)
        .maybeSingle();

      if (!personalTokenError && personalToken) {
        setLinkedinAccount(personalToken);
      } else {
        setLinkedinAccount(null);
      }

      // Fetch LinkedIn community token status
      const { data: communityTokenData, error: communityTokenError } = await supabase
        .from("linkedin_tokens")
        .select(
          "id, linkedin_user_id, profile_data, is_active, created_at, token_expires_at"
        )
        .eq("user_id", userId)
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
      if (hasCommunityToken) {
        const { data: orgData, error: orgError } = await supabase
          .from("linkedin_organizations")
          .select("*")
          .eq("user_id", userId);

        if (!orgError && orgData) {
          setOrganizations(orgData);
        } else {
          setOrganizations([]);
        }
      } else {
        setOrganizations([]);
      }
    } catch (err) {
      console.error("Failed to fetch LinkedIn status:", err);
    }
  };

  // Check for LinkedIn connection success/error from callback
  useEffect(() => {
    const checkLinkedInCallback = async () => {
      if (typeof window === "undefined" || !user) return;

      const urlParams = new URLSearchParams(window.location.search);
      const linkedinSuccess = urlParams.get("linkedin_success");
      const linkedinError = urlParams.get("linkedin_error");

      if (linkedinSuccess || linkedinError) {
        // Set step to integrations if not already there
        if (step !== "integrations") {
          setStep("integrations");
        }

        // Refresh LinkedIn status
        if (user.id) {
          await fetchLinkedInStatus(user.id);
        }

        // Clean up URL
        const cleanUrl = window.location.origin + window.location.pathname +
          (inviteToken ? `?invite_token=${inviteToken}` : "");
        window.history.replaceState({}, document.title, cleanUrl);
      }
    };

    checkLinkedInCallback();
  }, [user, inviteToken, supabase, step]);

  // Check authentication status on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // If arriving from an email link (signup/verify), exchange code OR hash tokens for a session
        try {
          if (typeof window !== "undefined") {
            const currentUrl = window.location.href;
            // Case 1: code flow
            if (currentUrl.includes("code=")) {
              const { error: exchangeError } =
                await supabase.auth.exchangeCodeForSession(currentUrl);
              if (!exchangeError) {
                const cleanUrl =
                  window.location.origin +
                  window.location.pathname +
                  (window.location.search
                    ? window.location.search.split("&code=")[0]
                    : "");
                window.history.replaceState({}, document.title, cleanUrl);
              }
            }
            // Case 2: hash with access_token/refresh_token
            if (
              window.location.hash.includes("access_token") &&
              window.location.hash.includes("refresh_token")
            ) {
              const hashParams = new URLSearchParams(
                window.location.hash.substring(1)
              );
              const access_token = hashParams.get("access_token");
              const refresh_token = hashParams.get("refresh_token");
              if (access_token && refresh_token) {
                await supabase.auth.setSession({ access_token, refresh_token });
                const cleanUrl =
                  window.location.origin +
                  window.location.pathname +
                  window.location.search;
                window.history.replaceState({}, document.title, cleanUrl);
              }
            }
          }
        } catch (e) {
          // Ignore if no code present or parsing fails
        }

        // Determine if the user is allowed to be on onboarding without a session
        // This is true if they came from signup (email param), or from an auth link (code/hash)
        let allowedWithoutSession = false;
        if (typeof window !== "undefined") {
          const url = new URL(window.location.href);
          const hasEmailParam = Boolean(url.searchParams.get("email"));
          const hasCodeParam = Boolean(url.searchParams.get("code"));
          const hasHashTokens =
            window.location.hash.includes("access_token") &&
            window.location.hash.includes("refresh_token");
          allowedWithoutSession =
            hasEmailParam || hasCodeParam || hasHashTokens;
        }

        // Check session and user
        const {
          data: { session },
        } = await supabase.auth.getSession();

        const {
          data: { user: currentUser },
          error: userError,
        } = await supabase.auth.getUser();

        // Check if user has a valid session (email confirmation is now disabled)
        if (currentUser && session) {
          // User has a valid session
          setUser(currentUser);

          // Check if they have already completed onboarding
          // The trigger creates user_prefs on signup, but we consider onboarding complete
          // only if the user has updated their preferences (either filled or skipped)
          const { data: prefs } = await supabase
            .from("user_prefs")
            .select("created_at, updated_at, topics, custom_rss_feeds, user_corpus")
            .eq("user_id", currentUser.id)
            .single();

          // Onboarding is only complete after integrations step is finished
          // We check if updated_at was updated very recently (within last 10 seconds)
          // which indicates they just completed integrations
          // Otherwise, if updated_at was updated but not recently, they're in the middle of onboarding
          let onboardingComplete = false;
          if (prefs && prefs.created_at !== prefs.updated_at) {
            const updatedAt = new Date(prefs.updated_at);
            const now = new Date();
            const secondsSinceUpdate = (now.getTime() - updatedAt.getTime()) / 1000;
            // If updated within last 10 seconds, they likely just completed integrations
            // Otherwise, they completed preferences but not integrations yet
            onboardingComplete = secondsSinceUpdate < 10;
          }

          if (onboardingComplete) {
            // Check if they're accessing via direct URL (not from a signup/auth flow)
            let fromDirectAccess = false;
            if (typeof window !== "undefined") {
              const urlParams = new URLSearchParams(window.location.search);
              fromDirectAccess =
                !urlParams.has("email") &&
                !urlParams.has("code") &&
                !window.location.hash.includes("access_token");
            }

            // Only redirect if they came from a signup/auth flow, not direct URL access
            // This allows users to access onboarding via URL even if they've completed it
            if (!fromDirectAccess) {
              router.push(getRedirectUrl());
              return;
            }
          }

          // Fetch LinkedIn status when user is authenticated
          await fetchLinkedInStatus(currentUser.id);

          // Determine which step to show
          // If preferences have been saved (updated_at changed), show integrations step
          // This ensures users always see the integrations step after preferences
          // Otherwise, show preferences step
          if (prefs && prefs.created_at !== prefs.updated_at) {
            // User has already saved preferences (filled or skipped), show integrations step
            // This ensures the integrations step is always presented
            setStep("integrations");
          } else {
            // User hasn't saved preferences yet, show preferences step
            setStep("preferences");
          }
        } else if (!currentUser && !session) {
          // Allow authenticated users who haven't completed onboarding to access via URL
          // Only redirect unauthenticated users who aren't in a signup flow
          if (!allowedWithoutSession) {
            router.replace("/auth/signup");
            return;
          }
          // No session yet — keep the user on verification step and poll for session
          setStep("verification");
          const pollInterval = setInterval(async () => {
            const {
              data: { session: polled },
            } = await supabase.auth.getSession();
            if (polled) {
              clearInterval(pollInterval);
              const {
                data: { user: refreshed },
              } = await supabase.auth.getUser();
              if (refreshed) {
                setUser(refreshed);
                setStep("preferences");
                await fetchLinkedInStatus(refreshed.id);
              }
            }
          }, 1500);
          setTimeout(() => clearInterval(pollInterval), 120000); // stop after 2 minutes
        } else {
          // Fallback: stay on verification rather than forcing sign-in
          setStep("verification");
        }
      } catch (err) {
        setError("An unexpected error occurred");
      } finally {
        setIsCheckingAuth(false);
      }
    };

    checkAuth();
  }, [supabase, router]);

  const addPostField = () => {
    setLinkedinPosts([...linkedinPosts, ""]);
  };

  const removePostField = (index: number) => {
    if (linkedinPosts.length > 1) {
      setLinkedinPosts(linkedinPosts.filter((_, i) => i !== index));
    }
  };

  const updatePost = (index: number, value: string) => {
    const updatedPosts = [...linkedinPosts];
    updatedPosts[index] = value;
    setLinkedinPosts(updatedPosts);
  };

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("Error during logout:", error);
      }
      // Redirect to home page after logout
      window.location.href = "/";
    } catch (err) {
      console.error("Error during logout:", err);
      // Still redirect even if there's an error
      window.location.href = "/";
    }
  };

  const handleResendEmail = async () => {
    // Prefer email from state; fall back to URL param
    let targetEmail = user?.email as string | undefined;
    if (!targetEmail) {
      const urlParams = new URLSearchParams(window.location.search);
      const emailFromUrl = urlParams.get("email") || undefined;
      targetEmail = emailFromUrl;
    }

    if (!targetEmail) {
      setError("Email not found. Please sign in again.");
      return;
    }

    setResendLoading(true);
    setResendSuccess(false);
    setError("");

    try {
      const response = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: targetEmail }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to resend email");
      } else {
        setResendSuccess(true);
        // Auto-hide success message after 5 seconds
        setTimeout(() => {
          setResendSuccess(false);
        }, 5000);
      }
    } catch (err) {
      setError("Failed to resend email. Please try again.");
    } finally {
      setResendLoading(false);
    }
  };

  const handleSkip = async () => {
    setLoading(true);
    setError("");

    try {
      const {
        data: { user: currentUser },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        setError(`Authentication error: ${userError.message}`);
        setLoading(false);
        return;
      }

      if (!currentUser) {
        setError("Please sign in to continue");
        router.push("/auth/signin");
        setLoading(false);
        return;
      }

      // First, ensure the profile exists with first and last name
      const { error: profileError } = await supabase.from("profiles").upsert({
        id: currentUser.id,
        email: currentUser.email,
        first_name: firstName.trim() || null,
        last_name: lastName.trim() || null,
        created_at: new Date().toISOString(),
      });

      if (profileError) {
        setError(`Profile error: ${profileError.message}`);
        setLoading(false);
        return;
      }

      // Create empty preferences record
      // Note: We update updated_at here, but onboarding is only complete after integrations step
      const { error } = await supabase.from("user_prefs").upsert({
        user_id: currentUser.id,
        topics: [],
        custom_rss_feeds: [],
        user_corpus: null,
        updated_at: new Date().toISOString(),
      });

      if (error) {
        setError(`Database error: ${error.message}`);
        setLoading(false);
      } else {
        // Move to integrations step instead of completing onboarding
        setStep("integrations");
        setLoading(false);
      }
    } catch (err) {
      setError(
        `An unexpected error occurred: ${
          err instanceof Error ? err.message : "Unknown error"
        }`
      );
      setLoading(false);
    }
  };

  const handleLinkedInConnect = async () => {
    try {
      setError("");
      // Add onboarding parameter to redirect back to onboarding after connection
      const params = new URLSearchParams();
      params.set("onboarding", "true");
      if (inviteToken) {
        params.set("invite_token", inviteToken);
      }
      const redirectUrl = `/api/linkedin/auth?${params.toString()}`;
      window.location.href = redirectUrl;
    } catch (err) {
      console.error("Failed to initiate LinkedIn connection:", err);
      setError("Failed to connect LinkedIn. Please try again.");
    }
  };

  const handleLinkedInOrganizationsConnect = async () => {
    try {
      setError("");
      // Add onboarding parameter to redirect back to onboarding after connection
      const params = new URLSearchParams();
      params.set("onboarding", "true");
      if (inviteToken) {
        params.set("invite_token", inviteToken);
      }
      const redirectUrl = `/api/linkedin/organizations/auth?${params.toString()}`;
      window.location.href = redirectUrl;
    } catch (err) {
      console.error("Failed to initiate LinkedIn organizations connection:", err);
      setError("Failed to connect LinkedIn organizations. Please try again.");
    }
  };

  const handleLinkedInDisconnect = async () => {
    if (!linkedinAccount) return;
    setDeletingType("personal");
    setDeleteModalOpen(true);
  };

  const handleLinkedInOrganizationsDisconnect = async () => {
    setDeletingType("organizations");
    setDeleteModalOpen(true);
  };

  const confirmLinkedInDisconnect = async () => {
    if (!user) return;

    await linkedinForm.submit(async () => {
      // Revoke token with LinkedIn first
      try {
        const revokeResponse = await fetch("/api/linkedin/revoke", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ type: "personal" }),
        });

        if (!revokeResponse.ok) {
          console.warn("Failed to revoke LinkedIn token, continuing with local deletion");
        }
      } catch (revokeError) {
        console.warn("Error revoking LinkedIn token:", revokeError);
      }

      // Delete the personal token
      const { error: tokenError } = await supabase
        .from("linkedin_tokens")
        .delete()
        .eq("user_id", user.id)
        .eq("type", "personal");

      if (tokenError) {
        throw new Error("Failed to disconnect LinkedIn account. Please try again.");
      }

      // Also clean up linkedin_accounts if it exists
      const { error: accountError } = await supabase
        .from("linkedin_accounts")
        .delete()
        .eq("user_id", user.id)
        .eq("account_type", "personal");

      if (accountError) {
        console.warn("Failed to clean up linkedin_accounts:", accountError);
      }

      setLinkedinAccount(null);
      // Refresh LinkedIn status
      await fetchLinkedInStatus(user.id);
    }, "LinkedIn profile disconnected successfully");

    setDeletingType(null);
    setDeleteModalOpen(false);
  };

  const confirmLinkedInOrganizationsDisconnect = async () => {
    if (!user) return;

    await linkedinForm.submit(async () => {
      // Revoke token with LinkedIn first
      try {
        const revokeResponse = await fetch("/api/linkedin/revoke", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ type: "community" }),
        });

        if (!revokeResponse.ok) {
          console.warn("Failed to revoke LinkedIn token, continuing with local deletion");
        }
      } catch (revokeError) {
        console.warn("Error revoking LinkedIn token:", revokeError);
      }

      // Delete organizations first
      const { error: orgError } = await supabase
        .from("linkedin_organizations")
        .delete()
        .eq("user_id", user.id);

      if (orgError) {
        throw new Error("Failed to disconnect LinkedIn organizations. Please try again.");
      }

      // Delete the community token
      const { error: tokenError } = await supabase
        .from("linkedin_tokens")
        .delete()
        .eq("user_id", user.id)
        .eq("type", "community");

      if (tokenError) {
        throw new Error("Failed to delete community management token. Please try again.");
      }

      // Also clean up linkedin_accounts if it exists for organization type
      const { error: accountError } = await supabase
        .from("linkedin_accounts")
        .delete()
        .eq("user_id", user.id)
        .eq("account_type", "organization");

      if (accountError) {
        console.warn("Failed to clean up linkedin_accounts:", accountError);
      }

      setOrganizations([]);
      setCommunityToken(null);
      // Refresh LinkedIn status
      await fetchLinkedInStatus(user.id);
    }, "LinkedIn community management disconnected successfully");

    setDeletingType(null);
    setDeleteModalOpen(false);
  };

  const handleIntegrationsComplete = async () => {
    setLoading(true);
    setError("");

    try {
      const {
        data: { user: currentUser },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !currentUser) {
        setError("Please sign in to continue");
        router.push("/auth/signin");
        setLoading(false);
        return;
      }

      // Mark onboarding as complete by updating user_prefs
      const { error } = await supabase
        .from("user_prefs")
        .update({
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", currentUser.id);

      if (error) {
        setError(`Database error: ${error.message}`);
        setLoading(false);
      } else {
        // Redirect to invitation acceptance if token exists, otherwise home
        router.push(getRedirectUrl());
      }
    } catch (err) {
      setError(
        `An unexpected error occurred: ${
          err instanceof Error ? err.message : "Unknown error"
        }`
      );
      setLoading(false);
    }
  };

  const handleAddKeyword = () => {
    const trimmedKeyword = keywordInput.trim();
    if (trimmedKeyword && !keywords.includes(trimmedKeyword)) {
      setKeywords([...keywords, trimmedKeyword]);
      setKeywordInput("");
    }
  };

  const handleRemoveKeyword = (keywordToRemove: string) => {
    setKeywords(keywords.filter((k) => k !== keywordToRemove));
  };

  const handleKeywordKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddKeyword();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Add any remaining keyword in the input field before submitting
    let finalKeywords = [...keywords];
    const trimmedInput = keywordInput.trim();
    if (trimmedInput && !finalKeywords.includes(trimmedInput)) {
      finalKeywords = [...finalKeywords, trimmedInput];
      setKeywordInput("");
    }

    if (finalKeywords.length === 0) {
      setError("Please enter at least one topic");
      setLoading(false);
      return;
    }

    const postsArray = linkedinPosts
      .map((p) => p.trim())
      .filter((p) => p.length > 0);

    try {
      const {
        data: { user: currentUser },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        setError(`Authentication error: ${userError.message}`);
        return;
      }

      if (!currentUser) {
        setError("Please sign in to continue");
        router.push("/auth/signin");
        return;
      }

      // Only create user_corpus if posts were provided
      const userCorpus =
        postsArray.length > 0
          ? {
              posts: postsArray,
              tone_descriptor: "expert", // Will be extracted from posts
            }
          : null;

      // First, ensure the profile exists with first and last name
      const { error: profileError } = await supabase.from("profiles").upsert({
        id: currentUser.id,
        email: currentUser.email,
        first_name: firstName.trim() || null,
        last_name: lastName.trim() || null,
        created_at: new Date().toISOString(),
      });

      if (profileError) {
        setError(`Profile error: ${profileError.message}`);
        return;
      }

      // Update keywords state if we added a new one
      if (finalKeywords.length > keywords.length) {
        setKeywords(finalKeywords);
      }

      // Update preferences
      // Note: We update updated_at here, but onboarding is only complete after integrations step
      const { data, error } = await supabase
        .from("user_prefs")
        .upsert({
          user_id: currentUser.id,
          topics: finalKeywords,
          custom_rss_feeds: selectedRssFeeds,
          user_corpus: userCorpus,
          updated_at: new Date().toISOString(),
        })
        .select();

      if (error) {
        setError(`Database error: ${error.message}`);
      } else {
        // Move to integrations step instead of completing onboarding
        setStep("integrations");
        setLoading(false);
      }
    } catch (err) {
      setError(
        `An unexpected error occurred: ${
          err instanceof Error ? err.message : "Unknown error"
        }`
      );
      setLoading(false);
    }
  };

  // Show loading state while checking authentication
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-semibold text-slate-900 dark:text-white mb-4">
            Welcome to linkedbud! 🎉
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400">
            Let&apos;s get you set up
          </p>
        </div>

        {/* Stepper */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center space-x-2 sm:space-x-4">
            {/* Step 1: Verification */}
            <div className="flex flex-col items-center">
              <div
                className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center ${
                  step === "verification"
                    ? "bg-blue-600 text-white"
                    : step === "preferences" || step === "integrations"
                    ? "bg-green-600 text-white"
                    : "bg-slate-300 dark:bg-slate-600 text-white"
                }`}
              >
                {step === "preferences" || step === "integrations" ? (
                  <Check className="w-5 h-5 sm:w-6 sm:h-6" />
                ) : (
                  <Mail className="w-5 h-5 sm:w-6 sm:h-6" />
                )}
              </div>
              <p className="text-xs sm:text-sm font-medium mt-2 text-slate-700 dark:text-slate-300">
                Verify Email
              </p>
            </div>

            <div className="flex-1 w-12 sm:w-24 h-1 bg-slate-300 dark:bg-slate-600">
              <div
                className={`h-full transition-all duration-500 ${
                  step === "preferences" || step === "integrations" ? "bg-green-600" : ""
                }`}
              />
            </div>

            {/* Step 2: Preferences */}
            <div className="flex flex-col items-center">
              <div
                className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center ${
                  step === "preferences"
                    ? "bg-blue-600 text-white"
                    : step === "integrations"
                    ? "bg-green-600 text-white"
                    : "bg-slate-300 dark:bg-slate-600 text-white"
                }`}
              >
                {step === "integrations" ? (
                  <Check className="w-5 h-5 sm:w-6 sm:h-6" />
                ) : (
                  <Check className="w-5 h-5 sm:w-6 sm:h-6" />
                )}
              </div>
              <p className="text-xs sm:text-sm font-medium mt-2 text-slate-700 dark:text-slate-300">
                Preferences
              </p>
            </div>

            <div className="flex-1 w-12 sm:w-24 h-1 bg-slate-300 dark:bg-slate-600">
              <div
                className={`h-full transition-all duration-500 ${
                  step === "integrations" ? "bg-green-600" : ""
                }`}
              />
            </div>

            {/* Step 3: Integrations */}
            <div className="flex flex-col items-center">
              <div
                className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center ${
                  step === "integrations"
                    ? "bg-blue-600 text-white"
                    : "bg-slate-300 dark:bg-slate-600 text-white"
                }`}
              >
                <Linkedin className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <p className="text-xs sm:text-sm font-medium mt-2 text-slate-700 dark:text-slate-300">
                Integrations
              </p>
            </div>
          </div>
        </div>

        {/* Step Content */}
        {step === "verification" ? (
          <div className="bg-white dark:bg-slate-900 py-8 px-6 shadow-sm border border-slate-200 dark:border-slate-800 rounded-lg">
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">
                  Verify your email address
                </h2>
                <p className="mt-2 text-slate-600 dark:text-slate-400">
                  We need to verify your email before you can continue
                </p>
              </div>

              <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  We&apos;ve sent a verification link to{" "}
                  <strong>{user?.email}</strong>
                </p>
                <p className="text-sm text-blue-700 dark:text-blue-300 mt-2">
                  Please check your email and click the link to verify your
                  account.
                </p>
              </div>

              <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-4">
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Don&apos;t see the email?
                </p>
                <ul className="text-sm text-slate-600 dark:text-slate-400 space-y-1">
                  <li>• Check your spam or junk folder</li>
                  <li>• Make sure you entered the correct email address</li>
                  <li>• Wait a few minutes and refresh this page</li>
                </ul>
              </div>

              {error && (
                <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                  <p className="text-sm text-red-800 dark:text-red-200">
                    {error}
                  </p>
                </div>
              )}

              {resendSuccess && (
                <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-3 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
                  <p className="text-sm text-green-800 dark:text-green-200">
                    Verification email sent!
                  </p>
                </div>
              )}

              <Button
                type="button"
                onClick={handleResendEmail}
                className="w-full h-11 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                variant="outline"
                disabled={resendLoading}
              >
                {resendLoading ? "Sending..." : "Resend verification email"}
              </Button>

              <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                <Button
                  type="button"
                  onClick={handleLogout}
                  variant="ghost"
                  className="w-full text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Log out
                </Button>
              </div>
            </div>
          </div>
        ) : step === "preferences" ? (
          <div className="bg-white dark:bg-slate-900 py-8 px-6 shadow-sm border border-slate-200 dark:border-slate-800 rounded-lg">
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">
                  Set up your preferences
                </h2>
                <p className="mt-2 text-slate-600 dark:text-slate-400">
                  This helps us find relevant news and match your writing tone
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label
                      htmlFor="firstName"
                      className="text-sm font-medium text-slate-700 dark:text-slate-300"
                    >
                      First Name
                    </Label>
                    <Input
                      id="firstName"
                      placeholder="John"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      onKeyDown={(e) => {
                        // Prevent form submission on Enter key in this input
                        if (e.key === "Enter") {
                          e.preventDefault();
                        }
                      }}
                      className="h-11 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400"
                    />
                  </div>
                  <div>
                    <Label
                      htmlFor="lastName"
                      className="text-sm font-medium text-slate-700 dark:text-slate-300"
                    >
                      Last Name
                    </Label>
                    <Input
                      id="lastName"
                      placeholder="Doe"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      onKeyDown={(e) => {
                        // Prevent form submission on Enter key in this input
                        if (e.key === "Enter") {
                          e.preventDefault();
                        }
                      }}
                      className="h-11 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400"
                    />
                  </div>
                </div>

                <div>
                  <Label
                    htmlFor="keywords"
                    className="text-sm font-medium text-slate-700 dark:text-slate-300"
                  >
                    Topics
                  </Label>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                    Type a topic and press Enter to add it
                  </p>

                  {/* Display tags/chips */}
                  {keywords.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-2">
                      {keywords.map((keyword, index) => (
                        <div
                          key={index}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-full text-sm text-blue-900 dark:text-blue-100"
                        >
                          <span>{keyword}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveKeyword(keyword)}
                            className="hover:bg-blue-100 dark:hover:bg-blue-900/40 rounded-full p-0.5 transition-colors"
                            aria-label={`Remove ${keyword}`}
                          >
                            <X className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <Input
                    id="keywords"
                    placeholder="e.g., technology (press Enter to add)"
                    value={keywordInput}
                    onChange={(e) => setKeywordInput(e.target.value)}
                    onKeyDown={handleKeywordKeyDown}
                    className="h-11 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400"
                  />
                  {keywords.length === 0 && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">
                      At least one topic is required
                    </p>
                  )}
                </div>

                <div>
                  <Label
                    htmlFor="posts"
                    className="text-sm font-medium text-slate-700 dark:text-slate-300"
                  >
                    Past LinkedIn Posts (Optional)
                  </Label>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                    Paste the last of your previous LinkedIn posts (one per
                    textarea)
                  </p>

                  {linkedinPosts.map((post, index) => (
                    <div key={index} className="mb-3">
                      <div className="flex items-center justify-between mb-1">
                        <Label
                          htmlFor={`post-${index}`}
                          className="text-sm font-medium text-slate-700 dark:text-slate-300"
                        >
                          Post {index + 1}
                        </Label>
                        {linkedinPosts.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removePostField(index)}
                            className="h-6 w-6 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                      <Textarea
                        id={`post-${index}`}
                        placeholder="Paste your LinkedIn post here... (optional)"
                        value={post}
                        onChange={(e) => updatePost(index, e.target.value)}
                        rows={4}
                        className="border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400"
                      />
                    </div>
                  ))}

                  {linkedinPosts.length < 5 && (
                    <>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addPostField}
                        className="mt-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Another Post
                      </Button>
                    </>
                  )}

                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                    This helps us understand your writing style and tone.
                    We&apos;ll use this to personalize your generated drafts.
                    You can skip this if you prefer.
                  </p>
                </div>

                <div>
                  <Label
                    htmlFor="rss-feeds"
                    className="text-sm font-medium text-slate-700 dark:text-slate-300"
                  >
                    RSS Feed Sources (Optional)
                  </Label>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                    Select RSS feeds from popular sources to customize your news
                    feed
                  </p>
                  <RssFeedSelector
                    selectedFeeds={selectedRssFeeds}
                    onSelectedFeedsChange={setSelectedRssFeeds}
                    showPersonalFeeds={true}
                    className="mt-2"
                  />
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                    Choose RSS feeds to stay updated with industry news. You can
                    skip this and add feeds later in settings.
                  </p>
                </div>

                {error && (
                  <div className="text-red-600 dark:text-red-400 text-sm bg-red-50 dark:bg-red-950/20 p-3 rounded-lg border border-red-200 dark:border-red-800">
                    {error}
                  </div>
                )}

                <div className="flex flex-col gap-3">
                  <Button
                    type="submit"
                    className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors"
                    disabled={loading}
                  >
                    {loading ? "Setting up your account..." : "Next"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full h-11 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                    onClick={handleSkip}
                    disabled={loading}
                  >
                    {loading ? "Skipping..." : "Skip for now"}
                  </Button>
                </div>
              </form>

              <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                <Button
                  type="button"
                  onClick={handleLogout}
                  variant="ghost"
                  className="w-full text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Log out
                </Button>
              </div>
            </div>
          </div>
        ) : step === "integrations" ? (
          <div className="bg-white dark:bg-slate-900 py-8 px-6 shadow-sm border border-slate-200 dark:border-slate-800 rounded-lg">
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">
                  Connect LinkedIn
                </h2>
                <p className="mt-2 text-slate-600 dark:text-slate-400">
                  Link your LinkedIn account to publish posts and fetch analytics
                </p>
              </div>

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

              {error && (
                <div className="text-red-600 dark:text-red-400 text-sm bg-red-50 dark:bg-red-950/20 p-3 rounded-lg border border-red-200 dark:border-red-800">
                  {error}
                </div>
              )}

              <div className="flex flex-col gap-3">
                <Button
                  type="button"
                  onClick={handleIntegrationsComplete}
                  className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors"
                  disabled={loading}
                >
                  {loading ? "Completing setup..." : "Complete Setup"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-11 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                  onClick={handleIntegrationsComplete}
                  disabled={loading}
                >
                  {loading ? "Skipping..." : "Skip for now"}
                </Button>
              </div>

              <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                <Button
                  type="button"
                  onClick={handleLogout}
                  variant="ghost"
                  className="w-full text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Log out
                </Button>
              </div>
            </div>
          </div>
        ) : null}

        {step === "preferences" && (
          <div className="mt-8 text-center text-sm text-slate-600 dark:text-slate-400">
            <p>
              Don&apos;t worry - you can always update these preferences later
              in your settings.
            </p>
          </div>
        )}

        {step === "integrations" && (
          <div className="mt-8 text-center text-sm text-slate-600 dark:text-slate-400">
            <p>
              You can connect your LinkedIn accounts later in settings if you prefer to skip this step.
            </p>
          </div>
        )}
      </div>

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
    </div>
  );
}
