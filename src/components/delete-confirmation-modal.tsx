"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Trash2 } from "lucide-react";

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  isLoading?: boolean;
  isPublishedPost?: boolean;
}

export function DeleteConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = "Delete",
  cancelText = "Cancel",
  isLoading = false,
  isPublishedPost = false,
}: DeleteConfirmationModalProps) {
  const [frozenContent, setFrozenContent] = useState<{
    title: string;
    description: string;
    confirmText: string;
    cancelText: string;
    isLoading: boolean;
    isPublishedPost: boolean;
  } | null>(null);

  // Freeze content when modal opens, keep it frozen during close
  useEffect(() => {
    if (isOpen) {
      setFrozenContent({
        title,
        description,
        confirmText,
        cancelText,
        isLoading,
        isPublishedPost,
      });
    } else {
      // Clear frozen content after close animation
      const timer = setTimeout(() => setFrozenContent(null), 300);
      return () => clearTimeout(timer);
    }
  }, [
    isOpen,
    title,
    description,
    confirmText,
    cancelText,
    isLoading,
    isPublishedPost,
  ]);

  const handleConfirm = () => {
    onConfirm();
  };

  // Use frozen content if available, otherwise use current props
  const content = frozenContent || {
    title,
    description,
    confirmText,
    cancelText,
    isLoading,
    isPublishedPost,
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 mt-1">
              {content.isPublishedPost ? (
                <AlertTriangle className="h-6 w-6 text-amber-500" />
              ) : (
                <Trash2 className="h-6 w-6 text-red-500" />
              )}
            </div>
            <div className="flex-1">
              <DialogTitle className="text-left text-lg font-semibold">
                {content.title}
              </DialogTitle>
              <DialogDescription className="text-left mt-2 text-gray-600">
                {content.description}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {content.isPublishedPost && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mt-4">
            <div className="text-sm">
              <p className="font-medium text-amber-800 mb-2">
                This post is published on LinkedIn
              </p>
              <p className="text-amber-700">
                Deleting from linkedbud only removes it from your dashboard. The
                post will remain live on LinkedIn and visible to your network.
              </p>
            </div>
          </div>
        )}

        <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 sm:gap-3 mt-6">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={content.isLoading}
            className="w-full sm:w-auto"
          >
            {content.cancelText}
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={content.isLoading}
            className="w-full sm:w-auto"
          >
            {content.isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Deleting...
              </>
            ) : (
              content.confirmText
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
