"use client";

import { useState, useEffect } from "react";
import {
  isTokenExpiringSoon,
  getDaysUntilExpiration,
} from "@/lib/linkedin-token-utils";

interface ExpiringToken {
  type: "personal" | "community";
  tokenExpiresAt: string;
  daysUntilExpiration: number;
}

interface UseLinkedInTokenExpirationReturn {
  shouldShowModal: boolean;
  daysUntilExpiration: number;
  expiringTokens: ExpiringToken[];
  isLoading: boolean;
  error: string | null;
  dismissModal: () => void;
  resetModal: () => void;
}

/**
 * Hook to manage LinkedIn token expiration warnings
 * Checks if the user's LinkedIn token is about to expire and shows a modal
 * @returns Object with modal state and control functions
 */
export function useLinkedInTokenExpiration(): UseLinkedInTokenExpirationReturn {
  const [shouldShowModal, setShouldShowModal] = useState(false);
  const [daysUntilExpiration, setDaysUntilExpiration] = useState(0);
  const [expiringTokens, setExpiringTokens] = useState<ExpiringToken[]>([]);
  const [isLoading, setIsLoading] = useState(false); // Start with false to prevent hydration mismatch
  const [error, setError] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Only run on client side to prevent hydration issues
    if (typeof window === "undefined") return;

    const checkTokenExpiration = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch("/api/linkedin/expiration-status");

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(
            `Failed to check LinkedIn token status: ${response.status} ${errorText}`
          );
        }

        const data = await response.json();

        if (data.hasLinkedInAccount && data.hasExpiringTokens && data.expiringTokens.length > 0) {
          // Find the most urgent expiring token (lowest daysUntilExpiration)
          const mostUrgentToken = data.expiringTokens.reduce((mostUrgent: ExpiringToken, current: ExpiringToken) => {
            return current.daysUntilExpiration < mostUrgent.daysUntilExpiration ? current : mostUrgent;
          }, data.expiringTokens[0]);

          setExpiringTokens(data.expiringTokens);
          setDaysUntilExpiration(mostUrgentToken.daysUntilExpiration);

          // Show modal if there are expiring tokens and not dismissed
          if (!dismissed) {
            setShouldShowModal(true);
          } else {
            setShouldShowModal(false);
          }
        } else {
          setExpiringTokens([]);
          setDaysUntilExpiration(0);
          setShouldShowModal(false);
        }
      } catch (err) {
        console.error("Error checking LinkedIn token expiration:", err);
        setError(
          err instanceof Error
            ? err.message
            : "Failed to check token expiration"
        );
        setShouldShowModal(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkTokenExpiration();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dismissed]);

  const dismissModal = () => {
    setDismissed(true);
    setShouldShowModal(false);
  };

  const resetModal = () => {
    setDismissed(false);
  };

  return {
    shouldShowModal,
    daysUntilExpiration,
    expiringTokens,
    isLoading,
    error,
    dismissModal,
    resetModal,
  };
}
