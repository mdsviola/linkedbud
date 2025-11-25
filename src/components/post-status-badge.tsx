"use client";

import { Badge } from "@/components/ui/badge";
import { formatDateTime } from "@/lib/utils";
import { Calendar, Clock, CheckCircle, Archive, Edit } from "lucide-react";

interface PostStatusBadgeProps {
  status: "DRAFT" | "SCHEDULED" | "PUBLISHED" | "ARCHIVED";
  scheduledPublishDate?: string | null;
  scheduledPublishTarget?: string | null;
  publishedAt?: string | null;
  linkedinPosts?: {
    linkedin_post_id: string;
    status: string;
    published_at: string;
    organization_id: string | null;
  }[];
  className?: string;
  hideDate?: boolean;
}

export function PostStatusBadge({
  status,
  scheduledPublishDate,
  scheduledPublishTarget,
  publishedAt,
  linkedinPosts,
  className = "",
  hideDate = false,
}: PostStatusBadgeProps) {
  const formatDate = (dateString: string) => {
    return formatDateTime(dateString);
  };

  const getStatusConfig = () => {
    switch (status) {
      case "DRAFT":
        return {
          label: "Draft",
          icon: Edit,
          variant: "secondary" as const,
          className:
            "bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200 hover:border-gray-300 transition-colors duration-200",
        };
      case "SCHEDULED":
        const dateText = hideDate
          ? ""
          : scheduledPublishDate
          ? formatDate(scheduledPublishDate)
          : "";

        return {
          label: dateText || "Scheduled",
          icon: Calendar,
          variant: "default" as const,
          className:
            "bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-200 hover:border-blue-300 transition-colors duration-200",
        };
      case "PUBLISHED":
        // Use LinkedIn post's published date if available, otherwise fall back to posts.published_at
        // Filter linkedinPosts based on publish_target:
        // - If publish_target is "personal" or null, find post with organization_id === null
        // - If publish_target is an organization ID, find post with matching organization_id
        // - Otherwise, find any PUBLISHED post
        let actualPublishedAt: string | null = null;

        if (linkedinPosts && linkedinPosts.length > 0) {
          const isPersonal = scheduledPublishTarget === "personal" || !scheduledPublishTarget;

          if (isPersonal) {
            // For personal posts, find the LinkedIn post with organization_id === null
            const personalPost = linkedinPosts.find(
              (post) =>
                post.status === "PUBLISHED" &&
                post.published_at &&
                post.organization_id === null
            );
            actualPublishedAt = personalPost?.published_at || null;
          } else if (scheduledPublishTarget) {
            // For organization posts, find the LinkedIn post with matching organization_id
            const orgPost = linkedinPosts.find(
              (post) =>
                post.status === "PUBLISHED" &&
                post.published_at &&
                post.organization_id === scheduledPublishTarget
            );
            actualPublishedAt = orgPost?.published_at || null;
          }

          // Fallback: if no matching post found, use any PUBLISHED post
          if (!actualPublishedAt) {
            const anyPublishedPost = linkedinPosts.find(
              (post) => post.status === "PUBLISHED" && post.published_at
            );
            actualPublishedAt = anyPublishedPost?.published_at || null;
          }
        }

        // Final fallback to posts.published_at
        if (!actualPublishedAt) {
          actualPublishedAt = publishedAt || null;
        }

        return {
          label: hideDate
            ? "Published"
            : actualPublishedAt
            ? `Published ${formatDate(actualPublishedAt)}`
            : "Published",
          icon: CheckCircle,
          variant: "default" as const,
          className:
            "bg-green-100 text-green-700 border-green-200 hover:bg-green-200 hover:border-green-300 transition-colors duration-200",
        };
      case "ARCHIVED":
        return {
          label: "Archived",
          icon: Archive,
          variant: "outline" as const,
          className:
            "bg-gray-50 text-gray-600 border-gray-300 hover:bg-gray-100 hover:border-gray-400 transition-colors duration-200",
        };
      default:
        return {
          label: status,
          icon: Clock,
          variant: "secondary" as const,
          className:
            "bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200 hover:border-gray-300 transition-colors duration-200",
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <Badge
      variant={config.variant}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium ${config.className} ${className}`}
    >
      <Icon className="h-3 w-3" />
      <span>{config.label}</span>
    </Badge>
  );
}
