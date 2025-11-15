"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClientClient } from "@/lib/supabase-client";
import { AuthLayout } from "@/components/auth/auth-layout";
import { AuthForm, AuthField } from "@/components/auth/auth-form";

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
      subtitle="Sign in to your Linkedbud account"
      footerText="Don't have an account?"
      footerLinkText="Create one here"
      footerLinkHref={signUpHref}
    >
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
