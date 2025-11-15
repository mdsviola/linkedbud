"use client";

import { useState, useEffect } from "react";

const COOKIE_CONSENT_KEY = "cookie-consent";

export type CookieConsentStatus = "accepted" | "rejected" | null;

/**
 * Safely get consent from localStorage
 * Handles cases where localStorage might be blocked or unavailable
 */
function getStoredConsent(): CookieConsentStatus {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const stored = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (stored === "accepted" || stored === "rejected") {
      return stored;
    }
  } catch (error) {
    // localStorage might be blocked (e.g., in private browsing)
    console.warn("Could not access localStorage for cookie consent:", error);
  }

  return null;
}

/**
 * Safely set consent in localStorage
 */
function setStoredConsent(status: "accepted" | "rejected"): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    localStorage.setItem(COOKIE_CONSENT_KEY, status);
  } catch (error) {
    console.warn("Could not save cookie consent to localStorage:", error);
  }
}

export function useCookieConsent() {
  // Initialize state with stored consent immediately to prevent flash
  const [consentStatus, setConsentStatus] = useState<CookieConsentStatus>(() =>
    getStoredConsent()
  );
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Double-check on mount to ensure we have the latest value
    // This handles cases where localStorage might be cleared between renders
    const stored = getStoredConsent();
    if (stored) {
      setConsentStatus(stored);
    }
    setIsLoading(false);
  }, []);

  const acceptCookies = () => {
    const status: CookieConsentStatus = "accepted";
    setStoredConsent(status);
    setConsentStatus(status);
  };

  const rejectCookies = () => {
    const status: CookieConsentStatus = "rejected";
    setStoredConsent(status);
    setConsentStatus(status);
  };

  const shouldShowBanner = !isLoading && consentStatus === null;

  return {
    consentStatus,
    isLoading,
    shouldShowBanner,
    acceptCookies,
    rejectCookies,
  };
}

