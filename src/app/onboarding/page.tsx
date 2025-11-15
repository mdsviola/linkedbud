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
import { Plus, X, Check, Mail, CheckCircle2 } from "lucide-react";
import { RssFeedSelector } from "@/components/rss-feed-selector";

export default function OnboardingPage() {
  const [step, setStep] = useState<"verification" | "preferences">(
    "verification"
  );
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [keywords, setKeywords] = useState("");
  const [linkedinPosts, setLinkedinPosts] = useState([""]);
  const [selectedRssFeeds, setSelectedRssFeeds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [user, setUser] = useState<any>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
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
            .select("created_at, updated_at")
            .eq("user_id", currentUser.id)
            .single();

          // If prefs exist and updated_at is different from created_at, onboarding is complete
          if (prefs && prefs.created_at !== prefs.updated_at) {
            router.push(getRedirectUrl());
            return;
          }

          // User has a session but hasn't set preferences, show preferences step
          setStep("preferences");
        } else if (!currentUser && !session) {
          // If unauthenticated and not coming from a valid signup/auth flow, redirect out
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

      // Create empty preferences record to mark onboarding as complete
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const keywordArray = keywords
      .split(",")
      .map((k) => k.trim())
      .filter((k) => k.length > 0);

    if (keywordArray.length === 0) {
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

      const { data, error } = await supabase
        .from("user_prefs")
        .upsert({
          user_id: currentUser.id,
          topics: keywordArray,
          custom_rss_feeds: selectedRssFeeds,
          user_corpus: userCorpus,
          updated_at: new Date().toISOString(),
        })
        .select();

      if (error) {
        setError(`Database error: ${error.message}`);
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
    } finally {
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
            Welcome to Linkedbud! 🎉
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400">Let&apos;s get you set up</p>
        </div>

        {/* Stepper */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center space-x-4">
            {/* Step 1: Verification */}
            <div className="flex flex-col items-center">
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  step === "verification"
                    ? "bg-blue-600 text-white"
                    : step === "preferences"
                    ? "bg-green-600 text-white"
                    : "bg-slate-300 dark:bg-slate-600 text-white"
                }`}
              >
                {step === "preferences" ? (
                  <Check className="w-6 h-6" />
                ) : (
                  <Mail className="w-6 h-6" />
                )}
              </div>
              <p className="text-sm font-medium mt-2 text-slate-700 dark:text-slate-300">Verify Email</p>
            </div>

            <div className="flex-1 w-24 h-1 bg-slate-300 dark:bg-slate-600">
              <div
                className={`h-full transition-all duration-500 ${
                  step === "preferences" ? "bg-green-600" : ""
                }`}
              />
            </div>

            {/* Step 2: Preferences */}
            <div className="flex flex-col items-center">
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  step === "preferences"
                    ? "bg-blue-600 text-white"
                    : "bg-slate-300 dark:bg-slate-600 text-white"
                }`}
              >
                <Check className="w-6 h-6" />
              </div>
              <p className="text-sm font-medium mt-2 text-slate-700 dark:text-slate-300">Your Preferences</p>
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
                  <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
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
                onClick={handleResendEmail}
                className="w-full h-11 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                variant="outline"
                disabled={resendLoading}
              >
                {resendLoading ? "Sending..." : "Resend verification email"}
              </Button>
            </div>
          </div>
        ) : (
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
                    <Label htmlFor="firstName" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      First Name
                    </Label>
                    <Input
                      id="firstName"
                      placeholder="John"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="h-11 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400"
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      Last Name
                    </Label>
                    <Input
                      id="lastName"
                      placeholder="Doe"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="h-11 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="keywords" className="text-sm font-medium text-slate-700 dark:text-slate-300">Topics</Label>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                    Enter topics related to your industry (comma-separated)
                  </p>
                  <Input
                    id="keywords"
                    placeholder="e.g., technology, business, healthcare, marketing, finance"
                    value={keywords}
                    onChange={(e) => setKeywords(e.target.value)}
                    required
                    className="h-11 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400"
                  />
                </div>

                <div>
                  <Label htmlFor="posts" className="text-sm font-medium text-slate-700 dark:text-slate-300">Past LinkedIn Posts (Optional)</Label>
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
                    This helps us understand your writing style and tone. We&apos;ll
                    use this to personalize your generated drafts. You can skip
                    this if you prefer.
                  </p>
                </div>

                <div>
                  <Label htmlFor="rss-feeds" className="text-sm font-medium text-slate-700 dark:text-slate-300">RSS Feed Sources (Optional)</Label>
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
                    {loading ? "Setting up your account..." : "Complete Setup"}
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
            </div>
          </div>
        )}

        {step === "preferences" && (
          <div className="mt-8 text-center text-sm text-slate-600 dark:text-slate-400">
            <p>
              Don&apos;t worry - you can always update these preferences later in
              your settings.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
