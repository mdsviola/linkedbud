"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

export interface AvatarProps {
  /**
   * Image URL to display. If provided, will be shown instead of initials.
   */
  imageUrl?: string | null;
  /**
   * Name or organization name used to generate initials.
   * For personal profiles, use the user's name or email.
   * For organizations, use the organization name.
   */
  name?: string | null;
  /**
   * Type of profile: "personal" or "organization".
   * Determines the background color when showing initials.
   * Defaults to "personal".
   */
  type?: "personal" | "organization";
  /**
   * Size variant: "sm" (32px), "md" (40px), "lg" (48px), or custom size in pixels.
   * Defaults to "md".
   */
  size?: "sm" | "md" | "lg" | number;
  /**
   * Custom background color for initials (overrides type-based color).
   */
  backgroundColor?: string;
  /**
   * Additional CSS classes.
   */
  className?: string;
  /**
   * Alt text for the image (only used when imageUrl is provided).
   */
  alt?: string;
  /**
   * Whether the image is currently loading. If true, shows a skeleton instead of initials.
   */
  isLoading?: boolean;
}

const sizeMap = {
  sm: 32,
  md: 40,
  lg: 48,
};

/**
 * Gets initials from a name.
 * For "Personal", returns "U" (User).
 * For other names, returns the first letter (uppercase).
 * For emails, returns the first letter before @.
 */
function getInitials(name: string | null | undefined): string {
  if (!name) return "U";

  // Special case for "Personal"
  if (name === "Personal") return "U";

  // For emails, get the first letter before @
  if (name.includes("@")) {
    return name.charAt(0).toUpperCase();
  }

  // For other names, take the first letter (uppercase)
  return name.charAt(0).toUpperCase();
}

/**
 * Gets the background color based on type.
 * Personal: Blue (hsl(217 91% 60%))
 * Organization: Green (hsl(142 76% 36%))
 */
function getBackgroundColor(
  type: "personal" | "organization",
  customColor?: string
): string {
  if (customColor) return customColor;

  return type === "personal"
    ? "hsl(217 91% 60%)" // Blue for personal
    : "hsl(142 76% 36%)"; // Green for organizations
}

/**
 * Unified Avatar component that displays either an image or initials.
 * Used across post details, menu bar, and create post modal.
 */
export function Avatar({
  imageUrl,
  name,
  type = "personal",
  size = "md",
  backgroundColor,
  className,
  alt = "Avatar",
  isLoading = false,
}: AvatarProps) {
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const sizeInPixels = typeof size === "number" ? size : sizeMap[size];
  const initials = getInitials(name);
  const bgColor = getBackgroundColor(type, backgroundColor);

  // Reset loading state when imageUrl changes
  useEffect(() => {
    if (imageUrl) {
      setImageLoading(true);
      setImageError(false);
    } else {
      setImageLoading(false);
      setImageError(false);
    }
  }, [imageUrl]);

  // Show skeleton if loading (before imageUrl is available or while image is loading)
  if (isLoading) {
    return (
      <div
        className={cn(
          "flex items-center justify-center rounded-full flex-shrink-0 animate-pulse bg-slate-200 dark:bg-slate-700",
          className
        )}
        style={{ width: sizeInPixels, height: sizeInPixels }}
        aria-label="Loading avatar"
      />
    );
  }

  // If image URL is provided and not in error state, show image
  if (imageUrl && !imageError) {
    return (
      <div
        className={cn(
          "flex items-center justify-center rounded-full flex-shrink-0 overflow-hidden relative",
          className
        )}
        style={{ width: sizeInPixels, height: sizeInPixels }}
      >
        {imageLoading && (
          <div
            className="absolute inset-0 rounded-full animate-pulse bg-slate-200 dark:bg-slate-700"
            aria-hidden="true"
          />
        )}
        <Image
          src={imageUrl}
          alt={alt}
          width={sizeInPixels}
          height={sizeInPixels}
          className={cn(
            "rounded-full object-cover w-full h-full transition-opacity duration-200",
            imageLoading ? "opacity-0" : "opacity-100"
          )}
          unoptimized
          onLoad={() => setImageLoading(false)}
          onError={() => {
            setImageError(true);
            setImageLoading(false);
          }}
        />
      </div>
    );
  }

  // Otherwise, show initials with background color
  const fontSize =
    sizeInPixels <= 32
      ? "text-sm"
      : sizeInPixels <= 40
      ? "text-base"
      : "text-lg";

  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-full text-white font-semibold flex-shrink-0",
        fontSize,
        className
      )}
      style={{
        width: sizeInPixels,
        height: sizeInPixels,
        backgroundColor: bgColor,
      }}
    >
      {initials}
    </div>
  );
}
