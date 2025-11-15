"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClientClient } from "@/lib/supabase-client";
import { AuthLayout } from "@/components/auth/auth-layout";
import { AuthForm, AuthField } from "@/components/auth/auth-form";
import { toast } from "@/hooks/use-toast";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isProcessingToken, setIsProcessingToken] = useState(true);
  const router = useRouter();
  const supabase = createClientClient();

  // Handle password reset tokens from URL
  useEffect(() => {
    const processResetToken = async () => {
      try {
        if (typeof window !== "undefined") {
          const currentUrl = window.location.href;
          
          // Case 1: code flow (PKCE flow)
          if (currentUrl.includes("code=")) {
            const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(currentUrl);
            if (!exchangeError && data?.session) {
              const cleanUrl = window.location.origin + window.location.pathname;
              window.history.replaceState({}, document.title, cleanUrl);
              setIsProcessingToken(false);
              return;
            } else {
              // Even if there's an error, check if user is authenticated
              const { data: { user } } = await supabase.auth.getUser();
              if (user) {
                setIsProcessingToken(false);
                return;
              }
              setError(exchangeError?.message || "Invalid or expired reset link. Please request a new one.");
              setIsProcessingToken(false);
              return;
            }
          }
          
          // Case 2: hash with access_token/refresh_token (implicit flow)
          // This includes type=recovery for password reset
          if (window.location.hash) {
            const hashParams = new URLSearchParams(window.location.hash.substring(1));
            const access_token = hashParams.get("access_token");
            const refresh_token = hashParams.get("refresh_token");
            const type = hashParams.get("type");
            
            // Check if it's a recovery token or any valid token
            if (access_token && refresh_token) {
              const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
                access_token,
                refresh_token,
              });
              
              if (!sessionError && sessionData?.session) {
                // Clean up the URL
                const cleanUrl = window.location.origin + window.location.pathname;
                window.history.replaceState({}, document.title, cleanUrl);
                setIsProcessingToken(false);
                return;
              } else {
                // Check if user is authenticated despite error
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                  setIsProcessingToken(false);
                  return;
                }
                setError(sessionError?.message || "Invalid or expired reset link. Please request a new one.");
                setIsProcessingToken(false);
                return;
              }
            }
          }

          // Case 3: Check if user is already authenticated (they might have already processed the token)
          const {
            data: { user },
            error: userError,
          } = await supabase.auth.getUser();
          
          if (user && !userError) {
            // User is authenticated, allow them to reset password
            setIsProcessingToken(false);
            return;
          }

          // No valid token found in URL and user is not authenticated
          // Only show error if we're not in the middle of processing a token
          if (!currentUrl.includes("code=") && !window.location.hash) {
            setError("No valid reset token found. Please check your email and use the reset link.");
          } else {
            setError("Invalid or expired reset link. Please request a new one.");
          }
          setIsProcessingToken(false);
        }
      } catch (err) {
        // Check if user is authenticated despite error
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            setIsProcessingToken(false);
            return;
          }
        } catch (checkError) {
          // Ignore check error
        }
        setError(err instanceof Error ? err.message : "An error occurred while processing the reset link.");
        setIsProcessingToken(false);
      }
    };

    processResetToken();
  }, [supabase]);

  const handleResetPassword = async (e: React.FormEvent) => {
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
      const { error: updateError } = await supabase.auth.updateUser({
        password: password,
      });

      if (updateError) {
        setError(updateError.message);
      } else {
        setSuccess(true);
        toast({
          title: "Password Reset Successful",
          description: "Your password has been successfully reset. Redirecting to sign in...",
          variant: "success",
        });
        // Redirect to sign in after a brief delay
        setTimeout(() => {
          router.push("/auth/signin");
        }, 2000);
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  // Show loading state while processing token
  if (isProcessingToken) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-slate-600 dark:text-slate-400">Processing reset link...</p>
        </div>
      </div>
    );
  }

  return (
    <AuthLayout
      title="Set new password"
      subtitle="Enter your new password below"
      footerText="Remember your password?"
      footerLinkText="Sign in"
      footerLinkHref="/auth/signin"
    >
      {success ? (
        <div className="space-y-6">
          <div className="text-center">
            <Link
              href="/auth/signin"
              className="text-sm font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
            >
              Go to sign in
            </Link>
          </div>
        </div>
      ) : (
        <AuthForm onSubmit={handleResetPassword} loading={loading} error={error}>
          <AuthField
            id="password"
            label="New password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="Enter your new password"
          />

          <AuthField
            id="confirmPassword"
            label="Confirm password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            placeholder="Confirm your new password"
          />
        </AuthForm>
      )}
    </AuthLayout>
  );
}

