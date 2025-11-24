"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { AlertTriangle } from "lucide-react";
import { formatDateOnly } from "@/lib/utils";

export type MessageType = "error" | "success" | "warning" | "info" | "default";

interface DowngradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading?: boolean;
  message?: string;
  messageType?: MessageType;
  currentPeriodEnd?: string | null;
}

export function DowngradeModal({
  isOpen,
  onClose,
  onConfirm,
  isLoading = false,
  message,
  messageType = "default",
  currentPeriodEnd,
}: DowngradeModalProps) {
  // Show toast when message changes
  useEffect(() => {
    if (!message) return;

    switch (messageType) {
      case "error":
        toast({
          title: "Cancellation Failed",
          description: message,
          variant: "destructive",
        });
        break;
      case "success":
        toast({
          title: "Success",
          description: message,
          variant: "success",
        });
        break;
      case "warning":
        toast({
          title: "Warning",
          description: message,
          variant: "default",
        });
        break;
      case "info":
        toast({
          title: "Information",
          description: message,
          variant: "default",
        });
        break;
      default:
        toast({
          title: "Notice",
          description: message,
          variant: "default",
        });
    }
  }, [message, messageType]);

  const isError = messageType === "error";
  const isSuccess = messageType === "success";

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            Cancel Subscription
          </DialogTitle>
          <DialogDescription>
            {!message &&
              "Are you sure you want to cancel your subscription? You'll continue to have access to Starter features until the end of your current billing period."}
          </DialogDescription>
        </DialogHeader>

        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mt-4">
          <h3 className="font-semibold text-orange-900 mb-3">
            What happens when you cancel?
          </h3>
          <ul className="space-y-2 text-sm text-orange-800">
            <li>
              • You&apos;ll keep access to your current plan until{" "}
              {currentPeriodEnd
                ? formatDateOnly(currentPeriodEnd)
                : "the end of your current billing period"}
            </li>
            <li>• You&apos;ll be moved to the free plan after that</li>
            <li>• You can resubscribe anytime</li>
            <li>• No refunds for unused time</li>
          </ul>
        </div>

        <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 sm:gap-3 mt-6">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
            className="w-full sm:w-auto"
          >
            {isSuccess ? "Close" : "Keep Subscription"}
          </Button>
          {!isSuccess && (
            <Button
              onClick={onConfirm}
              disabled={isLoading}
              className="w-full sm:w-auto bg-orange-600 hover:bg-orange-700"
            >
              {isLoading ? "Cancelling..." : "Yes, Cancel"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
