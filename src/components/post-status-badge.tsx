"use client";

import { Badge } from "@/components/ui/badge";
import { formatCompactDateTime } from "@/lib/utils";
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
    return formatCompactDateTime(dateString);
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
        const actualPublishedAt =
          linkedinPosts?.find(
            (post) => post.status === "PUBLISHED" && post.published_at
          )?.published_at || publishedAt;
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
