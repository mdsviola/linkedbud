"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { ModalWrapper } from "@/components/ui/modal-wrapper";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useFormSubmission } from "@/hooks/useFormSubmission";
import { toast } from "@/hooks/use-toast";
import {
  X,
  Camera,
  XCircle,
  Loader2,
  AlertCircle,
  Lightbulb,
  MessageSquare,
} from "lucide-react";
import { createClientClient } from "@/lib/supabase-client";

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapturingChange?: (isCapturing: boolean) => void;
}

type FeedbackType = "issue" | "idea" | "other";

export function FeedbackModal({
  isOpen,
  onClose,
  onCapturingChange,
}: FeedbackModalProps) {
  const [type, setType] = useState<FeedbackType>("issue");
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState<string>("");
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(
    null
  );
  const [isCapturing, setIsCapturing] = useState(false);
  const [shouldCloseForCapture, setShouldCloseForCapture] = useState(false);
  const { status, message: formMessage, submit, reset } = useFormSubmission();

  // Load user email on mount
  useEffect(() => {
    if (isOpen) {
      const loadUserEmail = async () => {
        try {
          const supabase = createClientClient();
          const {
            data: { user },
          } = await supabase.auth.getUser();
          if (user) {
            const { data: profile } = await supabase
              .from("profiles")
              .select("email")
              .eq("id", user.id)
              .single();
            if (profile) {
              setEmail(profile.email);
            }
          }
        } catch (error) {
          console.error("Error loading user email:", error);
        }
      };
      loadUserEmail();
    }
  }, [isOpen]);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setType("issue");
      setMessage("");
      setScreenshot(null);
      setScreenshotPreview(null);
      setShouldCloseForCapture(false);
      reset();
    }
  }, [isOpen, reset]);

  const captureScreenshot = async () => {
    setIsCapturing(true);
    onCapturingChange?.(true);
    setShouldCloseForCapture(true);
    await new Promise((resolve) => setTimeout(resolve, 200));

    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
        const stream = await navigator.mediaDevices.getDisplayMedia({
          video: {
            displaySurface: "window" as const,
          },
          audio: false,
        });

        const video = document.createElement("video");
        video.srcObject = stream;
        video.autoplay = true;
        video.playsInline = true;

        await new Promise<void>((resolve, reject) => {
          video.onloadedmetadata = () => {
            video
              .play()
              .then(() => {
                setTimeout(() => resolve(), 300);
              })
              .catch(reject);
          };
          video.onerror = reject;
        });

        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(video, 0, 0);
        }

        video.srcObject = null;
        video.remove();
        stream.getTracks().forEach((track) => track.stop());

        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], "screenshot.png", {
              type: "image/png",
            });
            setScreenshot(file);
            setScreenshotPreview(URL.createObjectURL(blob));
          }
          setIsCapturing(false);
          onCapturingChange?.(false);
          setShouldCloseForCapture(false);
        }, "image/png");
      } else {
        throw new Error("Screen capture API is not available in this browser");
      }
    } catch (error) {
      setIsCapturing(false);
      onCapturingChange?.(false);
      setShouldCloseForCapture(false);
      if (
        error instanceof Error &&
        error.name !== "NotAllowedError" &&
        error.name !== "AbortError"
      ) {
        toast({
          title: "Screenshot Capture Failed",
          description: "Failed to capture screenshot. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  const removeScreenshot = () => {
    if (screenshotPreview) {
      URL.revokeObjectURL(screenshotPreview);
    }
    setScreenshot(null);
    setScreenshotPreview(null);
  };

  const collectDeviceInfo = () => {
    return {
      userAgent: navigator.userAgent,
      screenWidth: window.screen.width,
      screenHeight: window.screen.height,
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
      url: window.location.href,
      language: navigator.language,
    };
  };

  const handleSubmit = async () => {
    if (!message.trim()) {
      return;
    }

    await submit(async () => {
      const formData = new FormData();
      formData.append("type", type);
      formData.append("message", message);
      formData.append("device_info", JSON.stringify(collectDeviceInfo()));
      if (screenshot) {
        formData.append("screenshot", screenshot);
      }

      const response = await fetch("/api/feedback/submit", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to submit feedback");
      }

      // Clear form and close modal after short delay
      setTimeout(() => {
        setMessage("");
        setScreenshot(null);
        setScreenshotPreview(null);
        if (screenshotPreview) {
          URL.revokeObjectURL(screenshotPreview);
        }
        onClose();
      }, 1500);
    }, "Feedback submitted successfully!");
  };

  // Control modal open state - close temporarily during capture
  const effectiveIsOpen = isOpen && !shouldCloseForCapture;

  return (
    <ModalWrapper
      isOpen={effectiveIsOpen}
      onOpenChange={(open) => !open && onClose()}
      position="bottom-right"
      maxHeight="calc(100vh - 3rem - 56px)"
    >
      <div className="flex flex-col space-y-1.5 text-left mb-4">
        <DialogPrimitive.Title className="text-lg font-semibold leading-none tracking-tight">
          What&apos;s on your mind?
        </DialogPrimitive.Title>
        <DialogPrimitive.Description className="text-sm text-muted-foreground">
          Share your feedback, ideas, or report issues. We&apos;d love to hear
          from you!
        </DialogPrimitive.Description>
      </div>

      <div className="space-y-4">
        <Tabs value={type} onValueChange={(v) => setType(v as FeedbackType)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger
              value="issue"
              className="flex items-center gap-2 data-[state=active]:bg-red-50 data-[state=active]:text-red-700 dark:data-[state=active]:bg-red-950 dark:data-[state=active]:text-red-300"
            >
              <AlertCircle
                className={`h-4 w-4 ${
                  type === "issue"
                    ? "text-red-600 dark:text-red-400"
                    : "text-muted-foreground"
                }`}
              />
              Issue
            </TabsTrigger>
            <TabsTrigger
              value="idea"
              className="flex items-center gap-2 data-[state=active]:bg-yellow-50 data-[state=active]:text-yellow-700 dark:data-[state=active]:bg-yellow-950 dark:data-[state=active]:text-yellow-300"
            >
              <Lightbulb
                className={`h-4 w-4 ${
                  type === "idea"
                    ? "text-yellow-600 dark:text-yellow-400"
                    : "text-muted-foreground"
                }`}
              />
              Idea
            </TabsTrigger>
            <TabsTrigger
              value="other"
              className="flex items-center gap-2 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 dark:data-[state=active]:bg-blue-950 dark:data-[state=active]:text-blue-300"
            >
              <MessageSquare
                className={`h-4 w-4 ${
                  type === "other"
                    ? "text-blue-600 dark:text-blue-400"
                    : "text-muted-foreground"
                }`}
              />
              Other
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={email}
            readOnly
            className="bg-muted cursor-not-allowed"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="message">
            Message <span className="text-destructive">*</span>
          </Label>
          <Textarea
            id="message"
            placeholder="Tell us what you think..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={5}
            required
          />
        </div>

        <div className="space-y-2">
          <Label>Screenshot (optional)</Label>
          {screenshotPreview ? (
            <div className="relative w-full" style={{ height: "300px" }}>
              <Image
                src={screenshotPreview}
                alt="Screenshot preview"
                fill
                className="rounded-md border object-contain"
                unoptimized
              />
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2"
                onClick={removeScreenshot}
              >
                <XCircle className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              <Button
                type="button"
                variant="outline"
                onClick={captureScreenshot}
                disabled={isCapturing}
                className="w-full"
              >
                {isCapturing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Capturing...
                  </>
                ) : (
                  <>
                    <Camera className="mr-2 h-4 w-4" />
                    Capture Screenshot
                  </>
                )}
              </Button>
              <p className="text-xs text-muted-foreground">
                Opens browser screen capture. Select your browser window from
                the Window tab.
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-end gap-2 mt-6">
        <Button
          variant="outline"
          onClick={onClose}
          disabled={status === "submitting"}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={!message.trim() || status === "submitting"}
        >
          {status === "submitting" ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Submitting...
            </>
          ) : (
            "Submit Feedback"
          )}
        </Button>
      </div>
    </ModalWrapper>
  );
}
