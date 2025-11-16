"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClientClient } from "@/lib/supabase-client";
import { AuthLayout } from "@/components/auth/auth-layout";
import { AuthForm, AuthField } from "@/components/auth/auth-form";
import { Button } from "@/components/ui/button";

export default function SignUpPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isWaitlistMode, setIsWaitlistMode] = useState(false);
  const [isCheckingWaitlist, setIsCheckingWaitlist] = useState(true);
  const [waitlistSuccess, setWaitlistSuccess] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClientClient();

  // Get invitation token and email from URL
  const inviteToken = searchParams.get("invite_token");
  const inviteEmail = searchParams.get("email");

  // Check waitlist status and auth status
  useEffect(() => {
    const checkStatus = async () => {
      try {
        // Check if waitlist mode is active
        const waitlistResponse = await fetch("/api/waitlist/check");
        if (waitlistResponse.ok) {
          const data = await waitlistResponse.json();
          setIsWaitlistMode(data.waitlistMode || false);
        }
      } catch (error) {
        console.error("Error checking waitlist status:", error);
        // Default to normal signup if check fails
        setIsWaitlistMode(false);
      } finally {
        setIsCheckingWaitlist(false);
      }

      // Check if user is already authenticated and redirect if so
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

    checkStatus();
  }, [supabase, inviteToken]);

  // Pre-fill email if provided via invitation
  useEffect(() => {
    if (inviteEmail && !email) {
      setEmail(inviteEmail);
    }
  }, [inviteEmail, email]);

  const handleWaitlistSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!email) {
      setError("Email is required");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/waitlist", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to register interest");
      } else {
        setWaitlistSuccess(true);
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/onboarding`,
        },
      });

      if (error) {
        setError(error.message);
      } else if (data.user) {
        // Wait a moment for the session to be properly set
        await new Promise((resolve) => setTimeout(resolve, 100));
        // Build onboarding URL with email and invite token if present
        const onboardingParams = new URLSearchParams();
        onboardingParams.set("email", email);
        if (inviteToken) {
          onboardingParams.set("invite_token", inviteToken);
        }
        window.location.href = `/onboarding?${onboardingParams.toString()}`;
      } else {
        // If no user returned, still try to redirect and include email and token
        const onboardingParams = new URLSearchParams();
        onboardingParams.set("email", email);
        if (inviteToken) {
          onboardingParams.set("invite_token", inviteToken);
        }
        router.push(`/onboarding?${onboardingParams.toString()}`);
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  // Show loading state while checking authentication and waitlist status
  if (isCheckingAuth || isCheckingWaitlist) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-slate-600 dark:text-slate-400">
            Loading...
          </p>
        </div>
      </div>
    );
  }

  // Waitlist mode
  if (isWaitlistMode) {
    if (waitlistSuccess) {
      return (
        <AuthLayout
          title="Thank you!"
          subtitle="You're on the list"
          footerText=""
          footerLinkText=""
          footerLinkHref=""
        >
          <div className="mb-6 p-6 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
            <p className="text-sm text-green-800 dark:text-green-200 text-center">
              <strong>Success!</strong> We&apos;ve received your interest. Check your email for confirmation and details about your <strong>20% discount</strong> when we launch.
            </p>
          </div>
          <div className="mt-6 flex justify-center">
            <Button asChild size="lg" className="w-full sm:w-auto">
              <Link href="/">Back to Home</Link>
            </Button>
          </div>
        </AuthLayout>
      );
    }

    return (
      <AuthLayout
        title="Join the waitlist"
        subtitle="Be among the first to access linkedbud"
        footerText=""
        footerLinkText=""
        footerLinkHref=""
      >
        <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            <strong>Early access:</strong> We&apos;re putting the finishing touches on linkedbud. Join our waitlist and get <strong>20% off</strong> your first month&apos;s subscription when we launch!
          </p>
        </div>

        <AuthForm onSubmit={handleWaitlistSubmit} loading={loading} error={error}>
          <AuthField
            id="email"
            label="Email address"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="Enter your email"
          />
        </AuthForm>
      </AuthLayout>
    );
  }

  // Build signin link with invite token if present
  const signInHref = inviteToken
    ? `/auth/signin?invite_token=${encodeURIComponent(inviteToken)}${inviteEmail ? `&email=${encodeURIComponent(inviteEmail)}` : ""}`
    : "/auth/signin";

  // Normal signup mode
  return (
    <AuthLayout
      title="Create your account"
      subtitle="Get started with linkedbud for free"
      footerText="Already have an account?"
      footerLinkText="Sign in here"
      footerLinkHref={signInHref}
    >
      <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <p className="text-sm text-blue-800 dark:text-blue-200">
          <strong>No credit card required:</strong> Get 3 free draft generations
          per month, forever. Upgrade anytime for unlimited* generations after.
        </p>
      </div>

      <AuthForm onSubmit={handleSignUp} loading={loading} error={error}>
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
          placeholder="Create a password (min. 6 characters)"
        />

        <AuthField
          id="confirmPassword"
          label="Confirm password"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          placeholder="Confirm your password"
        />
      </AuthForm>
    </AuthLayout>
  );
}
