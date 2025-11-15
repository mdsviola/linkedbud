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

export type MessageType = "error" | "success" | "warning" | "info" | "default";

interface DowngradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading?: boolean;
  message?: string;
  messageType?: MessageType;
}

export function DowngradeModal({
  isOpen,
  onClose,
  onConfirm,
  isLoading = false,
  message,
  messageType = "default",
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

        <div className="bg-orange-50 p-4 rounded-lg">
          <h3 className="font-semibold text-orange-900 mb-2">
            What happens when you cancel?
          </h3>
          <ul className="space-y-1 text-sm text-orange-800">
            <li>• You&apos;ll keep Starter access until your current period ends</li>
            <li>• You&apos;ll be moved to the free plan after that</li>
            <li>• You can resubscribe anytime</li>
            <li>• No refunds for unused time</li>
          </ul>
        </div>

        <DialogFooter className="flex gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
            className="flex-1"
          >
            {isSuccess ? "Close" : "Keep Subscription"}
          </Button>
          {!isSuccess && (
            <Button
              onClick={onConfirm}
              disabled={isLoading}
              className="flex-1 bg-orange-600 hover:bg-orange-700"
            >
              {isLoading ? "Cancelling..." : "Yes, Cancel"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
