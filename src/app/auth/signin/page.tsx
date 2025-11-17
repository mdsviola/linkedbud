"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClientClient } from "@/lib/supabase-client";
import { AuthLayout } from "@/components/auth/auth-layout";
import { AuthForm, AuthField } from "@/components/auth/auth-form";
import { Button } from "@/components/ui/button";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClientClient();

  // Get invitation token and email from URL
  const inviteToken = searchParams.get("invite_token");
  const inviteEmail = searchParams.get("email");

  // Check for OAuth error messages from callback
  useEffect(() => {
    const oauthError = searchParams.get("error");
    const errorMessage = searchParams.get("message");

    if (oauthError && errorMessage) {
      setError(decodeURIComponent(errorMessage));
      // Clean up URL
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete("error");
      newUrl.searchParams.delete("message");
      window.history.replaceState({}, "", newUrl.toString());
    }
  }, [searchParams]);

  // Check if user is already authenticated and redirect if so
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          // If user is authenticated and has invite token, redirect to accept invitation
          if (inviteToken) {
            window.location.href = `/invite/accept/${inviteToken}`;
            return;
          }
          // User is already authenticated, redirect to appropriate dashboard
          window.location.href = "/";
          return;
        }
      } catch (error) {
        console.error("Error checking auth status:", error);
      } finally {
        setIsCheckingAuth(false);
      }
    };

    checkAuth();
  }, [supabase, inviteToken]);

  // Pre-fill email if provided via invitation
  useEffect(() => {
    if (inviteEmail && !email) {
      setEmail(inviteEmail);
    }
  }, [inviteEmail, email]);

  const handleLinkedInSignIn = async () => {
    setLoading(true);
    setError("");

    try {
      // Use server-side API route to generate OAuth URL (works around client-side issues)
      const apiUrl = new URL("/api/auth/linkedin", window.location.origin);
      apiUrl.searchParams.set("redirect_to", `${window.location.origin}/auth/callback`);
      if (inviteToken) {
        apiUrl.searchParams.set("invite_token", inviteToken);
      }

      // Fetch the OAuth URL from the server
      const response = await fetch(apiUrl.toString());
      const data = await response.json();

      if (!response.ok || !data.url) {
        setError(data.error || "Failed to initiate LinkedIn sign in.");
        setLoading(false);
        return;
      }

      // Redirect to the OAuth URL
      window.location.href = data.url;
      // Don't set loading to false as we're redirecting
    } catch (err) {
      console.error("LinkedIn OAuth exception:", err);
      setError("An unexpected error occurred. Please try again.");
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setError(error.message);
      } else if (data.user) {
        // Wait a moment for the session to be properly set
        await new Promise((resolve) => setTimeout(resolve, 100));

        // If there's an invite token, redirect to accept invitation after sign in
        if (inviteToken) {
          window.location.href = `/invite/accept/${inviteToken}`;
          return;
        }

        // Check if user has completed onboarding
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          // Check if user has completed onboarding
          // The trigger creates user_prefs on signup, but we consider onboarding complete
          // only if the user has updated their preferences (either filled or skipped)
          const { data: prefs } = await supabase
            .from("user_prefs")
            .select("created_at, updated_at")
            .eq("user_id", user.id)
            .single();

          // If no prefs, or prefs exist but haven't been updated, redirect to onboarding
          if (!prefs || prefs.created_at === prefs.updated_at) {
            router.push("/onboarding");
          } else {
            // User has completed onboarding, go to dashboard
            window.location.href = "/";
          }
        } else {
          window.location.href = "/";
        }
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  // Show loading state while checking authentication
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-slate-600 dark:text-slate-400">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // Build signup link with invite token if present
  const signUpHref = inviteToken
    ? `/auth/signup?invite_token=${encodeURIComponent(inviteToken)}${inviteEmail ? `&email=${encodeURIComponent(inviteEmail)}` : ""}`
    : "/auth/signup";

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to your linkedbud account"
      footerText="Don't have an account?"
      footerLinkText="Create one here"
      footerLinkHref={signUpHref}
    >
      {/* LinkedIn OAuth Button */}
      <div className="mb-6">
        <Button
          type="button"
          onClick={handleLinkedInSignIn}
          disabled={loading}
          className="w-full h-11 bg-[#0077b5] hover:bg-[#006399] text-white font-medium rounded-md transition-colors flex items-center justify-center gap-2"
        >
          <svg
            className="w-5 h-5"
            fill="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .771 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .771 23.2 0 22.222 0h.003z" />
          </svg>
          Continue with LinkedIn
        </Button>
      </div>

      {/* Divider */}
      <div className="relative mb-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-slate-300 dark:border-slate-600"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400">
            Or continue with email
          </span>
        </div>
      </div>

      <AuthForm onSubmit={handleSignIn} loading={loading} error={error}>
        <AuthField
          id="email"
          label="Email address"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          placeholder="Enter your email"
        />

        <AuthField
          id="password"
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          placeholder="Enter your password"
        />

        <div className="flex justify-end">
          <Link
            href="/auth/forgot-password"
            className="text-sm font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
          >
            Forgot password?
          </Link>
        </div>
      </AuthForm>
    </AuthLayout>
  );
}
