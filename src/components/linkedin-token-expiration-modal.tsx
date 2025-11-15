"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AlertTriangle, ExternalLink } from "lucide-react";

interface ExpiringToken {
  type: "personal" | "community";
  tokenExpiresAt: string;
  daysUntilExpiration: number;
}

interface LinkedInTokenExpirationModalProps {
  isOpen: boolean;
  onClose: () => void;
  daysUntilExpiration: number;
  expiringTokens: ExpiringToken[];
}

/**
 * Modal component that warns users when their LinkedIn token is about to expire
 * @param isOpen - Whether the modal is visible
 * @param onClose - Function to call when modal is closed
 * @param daysUntilExpiration - Number of days until token expires
 */
export function LinkedInTokenExpirationModal({
  isOpen,
  onClose,
  daysUntilExpiration,
  expiringTokens,
}: LinkedInTokenExpirationModalProps) {
  const hasPersonalToken = expiringTokens.some((token) => token.type === "personal");
  const hasCommunityToken = expiringTokens.some((token) => token.type === "community");
  const hasBothTokens = hasPersonalToken && hasCommunityToken;

  const handleReconnect = () => {
    try {
      // If both tokens are expiring, redirect to personal auth (user can handle community separately)
      // If only community is expiring, redirect to community management auth
      // Otherwise, redirect to personal auth
      if (hasCommunityToken && !hasPersonalToken) {
        window.location.href = "/api/linkedin/organizations/auth";
      } else {
        window.location.href = "/api/linkedin/auth";
      }
    } catch (error) {
      console.error("Failed to redirect to LinkedIn auth:", error);
    }
  };

  const isExpired = daysUntilExpiration < 0;
  const expiresToday = daysUntilExpiration === 0;

  const getTokenTypeLabel = () => {
    if (hasBothTokens) {
      return "personal and community management";
    }
    if (hasCommunityToken) {
      return "community management";
    }
    return "personal";
  };

  const getExpirationMessage = () => {
    const tokenType = getTokenTypeLabel();
    if (isExpired) {
      return `Your LinkedIn ${tokenType} connection${hasBothTokens ? "s have" : " has"} expired. To continue posting to LinkedIn, you'll need to reconnect ${hasBothTokens ? "them" : "it"}.`;
    }
    if (expiresToday) {
      return `Your LinkedIn ${tokenType} connection${hasBothTokens ? "s expire" : " expires"} today. To continue posting to LinkedIn, you'll need to refresh ${hasBothTokens ? "them" : "it"}.`;
    }
    return `Your LinkedIn ${tokenType} connection${hasBothTokens ? "s will expire" : " will expire"} in ${daysUntilExpiration} day${daysUntilExpiration !== 1 ? "s" : ""}. To continue posting to LinkedIn, you'll need to refresh ${hasBothTokens ? "them" : "it"}.`;
  };

  const getTitle = () => {
    if (isExpired) {
      return hasBothTokens ? "LinkedIn Connections Expired" : "LinkedIn Connection Expired";
    }
    if (expiresToday) {
      return hasBothTokens ? "LinkedIn Connections Expire Today" : "LinkedIn Connection Expires Today";
    }
    return hasBothTokens ? "LinkedIn Connections Expiring Soon" : "LinkedIn Connection Expiring Soon";
  };

  const iconColor = isExpired ? "text-red-500" : "text-amber-500";
  const infoBoxBg = isExpired ? "bg-red-50" : "bg-amber-50";
  const infoBoxBorder = isExpired ? "border-red-200" : "border-amber-200";
  const infoBoxText = isExpired ? "text-red-800" : "text-amber-800";

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className={`h-5 w-5 ${iconColor}`} />
            {getTitle()}
          </DialogTitle>
          <DialogDescription>{getExpirationMessage()}</DialogDescription>
        </DialogHeader>

        <div className={`${infoBoxBg} border ${infoBoxBorder} rounded-lg p-4 mt-4`}>
          <h3 className={`font-semibold ${infoBoxText} mb-2`}>
            What happens when {hasBothTokens ? "they expire" : "it expires"}?
          </h3>
          <p className={`text-sm ${infoBoxText}`}>
            You won&apos;t be able to publish posts to LinkedIn{hasBothTokens ? " (personal or community management)" : hasCommunityToken ? " (community management)" : ""} until you reconnect
            {hasBothTokens ? " your accounts" : " your account"}. Metrics for your LinkedIn posts will also stop being fetched.
          </p>
          {hasBothTokens && (
            <div className={`text-sm ${infoBoxText} mt-2 pt-2 border-t ${infoBoxBorder}`}>
              <p className="font-medium mb-1">Expiring connections:</p>
              <ul className="list-disc list-inside space-y-1">
                {hasPersonalToken && (
                  <li>Personal account connection</li>
                )}
                {hasCommunityToken && (
                  <li>Community management connection</li>
                )}
              </ul>
            </div>
          )}
        </div>

        <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 sm:gap-3 mt-6">
          <Button
            variant="outline"
            onClick={onClose}
            className="w-full sm:w-auto"
          >
            I&apos;ll do this later
          </Button>
          <Button
            onClick={handleReconnect}
            className="w-full sm:w-auto"
          >
            <ExternalLink className="mr-2 h-4 w-4" />
            Reconnect Account
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
