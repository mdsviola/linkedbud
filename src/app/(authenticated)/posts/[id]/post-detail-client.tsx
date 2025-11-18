"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PageWrapper } from "@/components/ui/page-wrapper";
import { PageTitle } from "@/components/ui/page-title";
import { BackButton } from "@/components/ui/back-button";
import { AnimatedIconButton } from "@/components/ui/animated-icon-button";
import { DeleteConfirmationModal } from "@/components/delete-confirmation-modal";
import {
  Copy,
  ExternalLink,
  Edit,
  Trash2,
  Loader2,
  Linkedin,
  Calendar,
  Wand2,
  Check,
  CheckCheck,
  AlertCircle,
  ThumbsUp,
  MessageCircle,
  Repeat2,
  Send,
  Globe,
  Heart,
  FileEdit,
} from "lucide-react";
import { copyToClipboard, getOrganizationName } from "@/lib/utils";
import { useFormSubmission } from "@/hooks/useFormSubmission";
import { useToast } from "@/hooks/use-toast";
import { confetti } from "@tsparticles/confetti";
import { PostMetricsDisplay } from "@/components/post-metrics-display";
import { LinkedInOrganizationDB } from "@/lib/linkedin";
import { SchedulePostModal } from "@/components/schedule-post-modal";
import { PostStatusBadge } from "@/components/post-status-badge";
import { PublishToLinkedInButton } from "@/components/publish-to-linkedin-button";
import { PolishModal } from "@/components/polish-modal";
import { generateLinkedInPostURL } from "@/lib/linkedin-urls";
import { CreatePostModal } from "@/components/create-post-modal";
import type { CreatePostFormData } from "@/components/create-post-modal";
import { FileText, Download, Image as ImageIcon } from "lucide-react";

// The API now returns signed URLs directly, so we can use them as-is
// This function is kept for backward compatibility if we receive a path instead of a URL
function getStorageUrl(urlOrPath: string | null): string | null {
  if (!urlOrPath) return null;

  // If it's already a full URL (signed URL from API), return as is
  if (urlOrPath.startsWith("http://") || urlOrPath.startsWith("https://")) {
    return urlOrPath;
  }

  // If it's a path, construct public URL (fallback for edge cases)
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) {
    console.error("NEXT_PUBLIC_SUPABASE_URL is not set");
    return null;
  }

  const cleanPath = urlOrPath.startsWith("/") ? urlOrPath.slice(1) : urlOrPath;
  return `${supabaseUrl}/storage/v1/object/public/storage/${cleanPath}`;
}

// Extract filename from storage path or URL
function getFilenameFromPath(pathOrUrl: string | null): string | null {
  if (!pathOrUrl) return null;

  // Extract from URL (remove query params first)
  const withoutParams = pathOrUrl.split("?")[0];

  // Get the last segment after splitting by /
  const parts = withoutParams.split("/");
  const filename = parts[parts.length - 1];

  // Decode URL encoding if present
  try {
    return decodeURIComponent(filename);
  } catch {
    return filename;
  }
}

interface Post {
  id: number;
  two_para_summary: string;
  content: string;
  status: "DRAFT" | "SCHEDULED" | "PUBLISHED" | "ARCHIVED";
  scheduled_publish_date: string | null;
  publish_target: string | null;
  published_at: string | null;
  source_url: string | null;
  source_title: string | null;
  source_content: string | null;
  image_url: string | null;
  document_url: string | null;
  video_url: string | null;
  created_at: string;
  topics?: {
    title: string;
  };
  linkedin_posts?: {
    linkedin_post_id: string;
    status: string;
    published_at: string;
    organization_id: string | null;
  }[];
}

interface PostDetailClientProps {
  postId: number;
}

export function PostDetailClient({ postId }: PostDetailClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState("");
  const [postErrors, setPostErrors] = useState<{ [key: number]: string }>({});
  const [updatingPost, setUpdatingPost] = useState<number | null>(null);
  const [markingAsPublished, setMarkingAsPublished] = useState<number | null>(
    null
  );
  const [linkedinConnected, setLinkedinConnected] = useState(false);
  const [organizations, setOrganizations] = useState<LinkedInOrganizationDB[]>(
    []
  );
  const [publishingToLinkedin, setPublishingToLinkedin] = useState<
    number | null
  >(null);
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [scheduleError, setScheduleError] = useState("");
  const [isScheduling, setIsScheduling] = useState(false);
  const [currentPost, setCurrentPost] = useState<Post | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [polishModalOpen, setPolishModalOpen] = useState(false);
  const [isPolishing, setIsPolishing] = useState(false);
  const [copiedContent, setCopiedContent] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [isUpdatingPost, setIsUpdatingPost] = useState(false);
  const [postContentVersion, setPostContentVersion] = useState(0);
  const [userName, setUserName] = useState<string>("You");
  const [userInitials, setUserInitials] = useState<string>("U");
  const [engagementMetrics, setEngagementMetrics] = useState<{
    likes: number;
    comments: number;
    shares: number;
  } | null>(null);

  // Check if the current post has any published LinkedIn posts
  const hasLinkedInPosts =
    currentPost?.linkedin_posts?.some(
      (linkedinPost) =>
        linkedinPost.status === "PUBLISHED" && linkedinPost.linkedin_post_id
    ) ?? false;

  const [deletingPost, setDeletingPost] = useState<number | null>(null);
  const [modalPostStatus, setModalPostStatus] = useState<
    "DRAFT" | "PUBLISHED" | "SCHEDULED" | "ARCHIVED" | null
  >(null);
  const [modalIsLoading, setModalIsLoading] = useState(false);

  const linkedinPublishForm = useFormSubmission();
  const { toast } = useToast();

  useEffect(() => {
    checkLinkedInStatus();
    fetchOrganizations();
    fetchUserPreferences();
    // Always fetch fresh post data on component mount
    refreshPost();
  }, []);

  // Fetch engagement metrics for published posts
  useEffect(() => {
    if (
      currentPost?.status === "PUBLISHED" &&
      currentPost?.linkedin_posts &&
      currentPost.linkedin_posts.length > 0
    ) {
      fetchEngagementMetrics();
    } else {
      setEngagementMetrics(null);
    }
  }, [currentPost]);

  const fetchUserPreferences = async () => {
    try {
      const response = await fetch("/api/preferences");
      if (response.ok) {
        // User preferences might not have userName/userInitials, so we'll use defaults
        // For now, we'll use defaults or try to get from user profile
        setUserName("You");
        setUserInitials("U");
      }
    } catch (err) {
      console.error("Failed to fetch user preferences:", err);
    }
  };

  const fetchEngagementMetrics = async () => {
    if (!currentPost?.linkedin_posts || currentPost.linkedin_posts.length === 0)
      return;

    try {
      const linkedinPost = currentPost.linkedin_posts[0];
      const response = await fetch(
        `/api/linkedin/metrics?linkedinPostId=${linkedinPost.linkedin_post_id}`
      );

      if (response.ok) {
        const data = await response.json();
        if (data.latest) {
          setEngagementMetrics({
            likes: data.latest.likes || 0,
            comments: data.latest.comments || 0,
            shares: data.latest.shares || 0,
          });
        }
      }
    } catch (err) {
      console.error("Failed to fetch engagement metrics:", err);
    }
  };

  // Check for published query parameter and show confetti/toast
  useEffect(() => {
    const published = searchParams.get("published");
    const publishedTo = searchParams.get("publishedTo"); // "linkedin" or undefined (manual)

    if (published === "true") {
      // First, refresh the post data to ensure we have the latest status
      const refreshAndCelebrate = async () => {
        await refreshPost();
        // Wait a bit for the page to fully load and render with updated data
        setTimeout(() => {
          confetti({
            count: 100,
            spread: 120,
            origin: { x: 0.5, y: 0.6 },
          });

          // Show different message based on how it was published
          const description =
            publishedTo === "linkedin"
              ? "Your post has been successfully published to LinkedIn"
              : "Your post has been marked as published";

          toast({
            title: (
              <div className="flex items-center gap-2">
                <CheckCheck className="h-4 w-4" />
                <span>Post Published!</span>
              </div>
            ) as any,
            description,
            variant: "success",
          });

          // Clean up the query parameters
          const url = new URL(window.location.href);
          url.searchParams.delete("published");
          url.searchParams.delete("publishedTo");
          router.replace(url.pathname + url.search, { scroll: false });
        }, 500);
      };
      refreshAndCelebrate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const checkLinkedInStatus = async () => {
    try {
      const response = await fetch("/api/linkedin/status");
      const data = await response.json();
      setLinkedinConnected(data.connected);
    } catch (err) {
      console.error("Failed to check LinkedIn status:", err);
    }
  };

  const fetchOrganizations = async () => {
    try {
      const response = await fetch("/api/linkedin/organizations");
      const data = await response.json();
      setOrganizations(data.organizations || []);
    } catch (err) {
      console.error("Error fetching organizations:", err);
    }
  };

  // Color palette for organizations
  const organizationColors = [
    "hsl(142 76% 36%)",
    "hsl(262 83% 58%)",
    "hsl(24 95% 53%)",
    "hsl(201 96% 32%)",
    "hsl(330 81% 60%)",
    "hsl(47 96% 53%)",
    "hsl(0 84% 60%)",
    "hsl(280 100% 70%)",
    "hsl(160 84% 39%)",
    "hsl(38 92% 50%)",
  ];

  const getOrganizationColor = (organizationId: string) => {
    const orgIds = organizations.map((org) => org.linkedin_org_id);
    const index = orgIds.indexOf(organizationId);
    return organizationColors[index % organizationColors.length];
  };

  // Helper function to get organization info for any post status
  const getOrganizationInfo = (post: Post) => {
    // Check if there's a linkedin_post with organization_id
    let organizationId =
      post.linkedin_posts?.find((lp) => lp.organization_id)?.organization_id ||
      null;

    // If no organization_id in linkedin_posts, use publish_target
    if (
      !organizationId &&
      post.publish_target &&
      post.publish_target !== "personal"
    ) {
      organizationId = post.publish_target;
    }

    const isPersonal =
      post.publish_target === "personal" ||
      (!organizationId && !post.publish_target) ||
      post.linkedin_posts?.some((lp) => lp.organization_id === null);

    // Use utility function to get organization name
    const organizationName = getOrganizationName(post, organizations);

    const color = isPersonal
      ? "hsl(var(--primary))"
      : organizationId
      ? getOrganizationColor(organizationId)
      : "hsl(142 76% 36%)";

    return { organizationName, color, organizationId, isPersonal };
  };

  // Helper function to get initials from organization name
  const getOrganizationInitials = (organizationName: string): string => {
    if (!organizationName) return "U";

    // Special cases
    if (organizationName === "Personal") return "U";

    // For other names, take the first letter (uppercase)
    return organizationName.charAt(0).toUpperCase();
  };

  const refreshPost = async () => {
    try {
      const response = await fetch(`/api/posts/${postId}?v=${Date.now()}`, {
        cache: "no-store",
        headers: {
          "Cache-Control": "no-store",
          Pragma: "no-cache",
        },
      });
      const data = await response.json();
      if (response.ok && data.post) {
        setCurrentPost(data.post);
        // Increment version to force modal remount with new content
        setPostContentVersion((prev) => prev + 1);
      }
    } catch (err) {
      console.error("Error refreshing post:", err);
    }
  };

  const handleCopyPost = async () => {
    if (!currentPost) return;
    try {
      await copyToClipboard(currentPost.content);
      setCopiedContent(true);
      setTimeout(() => setCopiedContent(false), 2000);
    } catch (err) {
      console.error("Failed to copy to clipboard:", err);
    }
  };

  const handleStatusChange = async (postId: number, newStatus: string) => {
    try {
      // Use different loading states based on the action
      if (newStatus === "PUBLISHED") {
        setMarkingAsPublished(postId);
      } else {
        setUpdatingPost(postId);
      }

      // Use FormData to match API expectations
      const formData = new FormData();
      formData.append("status", newStatus);

      const response = await fetch(`/api/posts/${postId}`, {
        method: "PATCH",
        body: formData, // Don't set Content-Type header - browser sets it with boundary
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Failed to update post status");
      }

      // For marking as published, redirect to the post detail page with success celebration
      if (newStatus === "PUBLISHED") {
        router.push(`/posts/${postId}?published=true`);
      } else {
        // For other status changes, navigate to the appropriate list
        const targetStatus = newStatus.toLowerCase();
        router.push(`/posts/${targetStatus}`);
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "An error occurred";
      toast({
        title: (
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            <span>Error</span>
          </div>
        ) as any,
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      // Clear the appropriate loading state
      if (newStatus === "PUBLISHED") {
        setMarkingAsPublished(null);
      } else {
        setUpdatingPost(null);
      }
    }
  };

  const handleDeletePost = async (postId: number) => {
    setModalPostStatus(currentPost?.status || null);
    setModalIsLoading(deletingPost === currentPost?.id);
    setDeleteModalOpen(true);
  };

  const confirmDeletePost = async () => {
    if (!currentPost) return;

    setDeletingPost(currentPost.id);

    try {
      const response = await fetch(`/api/posts/${currentPost.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete post");
      }

      // Navigate back to the appropriate list
      router.push(`/posts/${String(currentPost.status).toLowerCase()}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setDeletingPost(null);
      setDeleteModalOpen(false);
    }
  };

  const handleOpenScheduleModal = () => {
    setScheduleModalOpen(true);
    setScheduleError("");
  };

  const handleCloseScheduleModal = () => {
    setScheduleModalOpen(false);
    setScheduleError("");
  };

  const handleSchedulePost = async (
    scheduledDate: string,
    publishTarget: string
  ) => {
    if (!currentPost) return;

    setIsScheduling(true);
    setScheduleError("");

    try {
      const formData = new FormData();
      if (scheduledDate) {
        formData.append("scheduled_publish_date", scheduledDate);
        formData.append("publish_target", publishTarget);
      } else {
        // To clear the scheduled date, send empty strings for both
        formData.append("scheduled_publish_date", "");
        formData.append("publish_target", "");
      }

      const response = await fetch(`/api/posts/${currentPost.id}`, {
        method: "PATCH",
        body: formData, // Don't set Content-Type header - browser sets it with boundary
      });

      const data = await response.json();

      if (!response.ok) {
        console.error("Schedule post error:", data);
        throw new Error(data.error || "Failed to schedule post");
      }

      // Success - close modal and navigate to scheduled posts
      setScheduleModalOpen(false);
      router.push(`/posts/scheduled`);
    } catch (err) {
      setScheduleError(
        err instanceof Error ? err.message : "Failed to schedule post"
      );
    } finally {
      setIsScheduling(false);
    }
  };

  const handlePublishToLinkedIn = async (
    postId: number,
    publishTo: string = "personal"
  ) => {
    if (!currentPost) return;

    setPublishingToLinkedin(postId);

    await linkedinPublishForm.submit(async () => {
      const response = await fetch("/api/linkedin/publish", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          postId,
          content: currentPost.content,
          publishTo,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to publish to LinkedIn");
      }

      // Refresh the page to show the updated published status
      // The post status will be updated to PUBLISHED in the database
      // Use router.refresh() to force a server-side refresh, then navigate
      router.refresh();
      // Redirect to the same page with a timestamp to force fresh data load
      // The published=true parameter will trigger confetti/toast after page loads
      router.push(
        `/posts/${postId}?refreshed=${Date.now()}&published=true&publishedTo=linkedin`
      );
    }, "Post published to LinkedIn successfully!");

    setPublishingToLinkedin(null);
  };

  const handleOpenEditModal = () => {
    if (!currentPost) return;
    setEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setEditModalOpen(false);
  };

  const handleUpdatePost = async (
    postId: number,
    content: string,
    files?: {
      imageFile?: File;
      documentFile?: File;
      videoFile?: File;
      removeImage?: boolean;
      removeDocument?: boolean;
      removeVideo?: boolean;
    },
    publishTarget?: string, // Optional publish target to update
    articleData?: {
      articleUrl?: string;
      articleTitle?: string;
      articleContent?: string;
      twoParaSummary?: string;
    }
  ) => {
    try {
      setIsUpdatingPost(true);

      // Use FormData for consistency
      const formData = new FormData();
      formData.append("content", content.trim());

      // Include publish target if provided
      if (publishTarget !== undefined) {
        formData.append("publish_target", publishTarget);
      }

      // Include article source data if provided
      // Always append these fields when articleData is provided so API knows to update them
      if (articleData) {
        formData.append("source_url", articleData.articleUrl || "");
        formData.append("source_title", articleData.articleTitle || "");
        formData.append("source_content", articleData.articleContent || "");
        if (articleData.twoParaSummary !== undefined) {
          formData.append("two_para_summary", articleData.twoParaSummary || "");
        }
      }

      // Handle image removal
      if (files?.removeImage) {
        formData.append("removeImage", "true");
      } else if (files?.imageFile) {
        formData.append("imageFile", files.imageFile);
      }

      // Handle document removal
      if (files?.removeDocument) {
        formData.append("removeDocument", "true");
      } else if (files?.documentFile) {
        formData.append("documentFile", files.documentFile);
      }

      // Handle video removal
      if (files?.removeVideo) {
        formData.append("removeVideo", "true");
      } else if (files?.videoFile) {
        formData.append("videoFile", files.videoFile);
      }

      const response = await fetch(`/api/posts/${postId}`, {
        method: "PATCH",
        body: formData, // Don't set Content-Type - browser sets it with boundary
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update post");
      }

      // Update currentPost immediately with new content
      if (currentPost) {
        setCurrentPost({
          ...currentPost,
          content: content.trim(),
        });
      }

      // Increment version immediately to ensure next edit shows fresh data
      setPostContentVersion((prev) => prev + 1);

      // Close the modal after updating state
      setEditModalOpen(false);

      // Refresh the post data to get any server-side updates
      await refreshPost();

      // Show success toast
      toast({
        title: (
          <div className="flex items-center gap-2">
            <Check className="h-4 w-4" />
            <span>Post saved successfully!</span>
          </div>
        ) as any,
        variant: "success",
      });
    } catch (err) {
      console.error("Error updating post:", err);
      const errorMessage =
        err instanceof Error ? err.message : "Failed to update post";

      // Show more user-friendly error messages for video size issues
      if (errorMessage.includes("too large") || errorMessage.includes("size")) {
        setError(
          "Video file is too large. Maximum size is 100MB. Please compress your video or use a smaller file."
        );
      } else {
        setError(errorMessage);
      }

      // Clear error message after 5 seconds
      setTimeout(() => setError(""), 5000);
      throw err; // Re-throw so modal can handle it
    } finally {
      setIsUpdatingPost(false);
    }
  };

  const handleOpenPolishModal = () => {
    setPolishModalOpen(true);
  };

  const handleClosePolishModal = () => {
    setPolishModalOpen(false);
  };

  const handlePolish = async (prompt: string) => {
    if (!currentPost) return;

    try {
      setIsPolishing(true);

      const response = await fetch(`/api/posts/${currentPost.id}/polish`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to polish post");
      }

      // Update the current post with the polished content
      setCurrentPost({
        ...currentPost,
        content: data.polishedContent,
      });

      // Show success toast
      toast({
        title: (
          <div className="flex items-center gap-2">
            <Wand2 className="h-4 w-4" />
            <span>Post polished successfully!</span>
          </div>
        ) as any,
        variant: "success",
      });

      handleClosePolishModal();
    } catch (err) {
      console.error("Error polishing post:", err);
      setError(err instanceof Error ? err.message : "Failed to polish post");

      // Clear error message after 5 seconds
      setTimeout(() => setError(""), 5000);
    } finally {
      setIsPolishing(false);
    }
  };

  const getStatusInfo = () => {
    if (!currentPost) return "Loading...";
    switch (currentPost.status) {
      case "PUBLISHED":
        return "Published Posts";
      case "SCHEDULED":
        return "Scheduled Posts";
      case "DRAFT":
      default:
        return "Draft Posts";
    }
  };

  // Check if there are any actions to show in the floating panel
  const hasActionsToShow = () => {
    if (!currentPost) return false;

    // Always show if there are error messages
    if (error) return true;

    // Check based on status
    switch (currentPost.status) {
      case "DRAFT":
        // Draft posts always have actions
        return true;
      case "SCHEDULED":
        // Scheduled posts always have actions
        return true;
      case "PUBLISHED":
        // Published posts only have actions if they have LinkedIn posts
        return (
          currentPost.linkedin_posts && currentPost.linkedin_posts.length > 0
        );
      default:
        return false;
    }
  };

  // Loading guard
  if (!currentPost) {
    return (
      <PageWrapper>
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
          <div className="flex flex-col gap-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </PageWrapper>
    );
  }

  // Determine which tab to navigate back to
  const getBackUrl = () => {
    const baseUrl = `/posts/${String(currentPost.status).toLowerCase()}`;
    const orgInfo = getOrganizationInfo(currentPost);

    if (orgInfo.isPersonal) {
      return `${baseUrl}?tab=personal`;
    } else if (orgInfo.organizationId) {
      return `${baseUrl}?tab=${orgInfo.organizationId}`;
    }

    // Default to personal if we can't determine
    return `${baseUrl}?tab=personal`;
  };

  return (
    <PageWrapper>
      {/* Back button positioned above the title */}
      <div className="mb-6">
        <BackButton href={getBackUrl()}>Back to {getStatusInfo()}</BackButton>
      </div>

      {/* Title and action buttons section */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <PageTitle>
            {currentPost.topics?.title || `Post #${currentPost.id}`}
          </PageTitle>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {/* Action buttons */}
          <div className="flex gap-2">
            {currentPost.status === "DRAFT" && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleStatusChange(currentPost.id, "PUBLISHED")}
                disabled={
                  markingAsPublished === currentPost.id ||
                  deletingPost === currentPost.id
                }
                className="flex items-center gap-2"
              >
                {markingAsPublished === currentPost.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCheck className="h-4 w-4" />
                )}
                Mark as Published
              </Button>
            )}

            {currentPost.status === "PUBLISHED" && (
              <div
                title={
                  hasLinkedInPosts
                    ? "Cannot move to drafts: This post is connected to a LinkedIn post"
                    : "Move to drafts (no LinkedIn posts)"
                }
                className="inline-block"
              >
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleStatusChange(currentPost.id, "DRAFT")}
                  disabled={updatingPost === currentPost.id || hasLinkedInPosts}
                  className="flex items-center gap-2"
                >
                  {updatingPost === currentPost.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <FileEdit className="h-4 w-4" />
                  )}
                  Move to Drafts
                </Button>
              </div>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={() => handleDeletePost(currentPost.id)}
              disabled={
                markingAsPublished === currentPost.id ||
                publishingToLinkedin === currentPost.id ||
                deletingPost === currentPost.id
              }
              className="flex items-center gap-2 text-red-600 hover:text-red-700"
            >
              {deletingPost === currentPost.id ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              Delete
            </Button>
          </div>
        </div>
      </div>

      {/* Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4 items-stretch">
        {/* Left Column - LinkedIn Preview */}
        <div className="relative flex flex-col h-full">
          <Card className="flex-1 flex flex-col">
            <CardContent className="p-0 flex-1 flex flex-col">
              {/* LinkedIn Feed Preview */}
              <div
                className={`bg-white dark:bg-slate-900 overflow-hidden rounded-lg flex-1 flex flex-col ${
                  currentPost.status === "DRAFT" ||
                  currentPost.status === "SCHEDULED" ||
                  currentPost.status === "PUBLISHED"
                    ? "group"
                    : ""
                }`}
              >
                {/* Post Header - LinkedIn Style */}
                <div className="px-4 py-3 pb-2 flex-shrink-0">
                  <div className="flex items-start gap-3">
                    {/* Profile Picture */}
                    {(() => {
                      const orgInfo = getOrganizationInfo(currentPost);
                      const orgInitials = getOrganizationInitials(
                        orgInfo.organizationName
                      );
                      const backgroundColor = orgInfo.isPersonal
                        ? "hsl(217 91% 60%)" // Blue for personal
                        : "hsl(142 76% 36%)"; // Green for organizations
                      return (
                        <div
                          className="flex h-12 w-12 items-center justify-center rounded-full text-base font-semibold text-white flex-shrink-0"
                          style={{ backgroundColor }}
                        >
                          {orgInitials}
                        </div>
                      );
                    })()}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                          {userName}
                        </span>
                        {/* Verification Badge */}
                        <div className="h-4 w-4 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                          <Check className="h-2.5 w-2.5 text-white" />
                        </div>
                        <span className="text-sm text-slate-500 dark:text-slate-400">
                          • 1st
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {(() => {
                          const orgInfo = getOrganizationInfo(currentPost);
                          return orgInfo.organizationName;
                        })()}
                      </div>
                      <div className="flex items-center gap-1 mt-1">
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          {currentPost.published_at
                            ? (() => {
                                const publishedDate = new Date(
                                  currentPost.published_at
                                );
                                const now = new Date();
                                const diffTime = Math.abs(
                                  now.getTime() - publishedDate.getTime()
                                );
                                const diffDays = Math.ceil(
                                  diffTime / (1000 * 60 * 60 * 24)
                                );
                                if (diffDays === 1) return "1d";
                                if (diffDays < 7) return `${diffDays}d`;
                                if (diffDays < 30)
                                  return `${Math.floor(diffDays / 7)}w`;
                                return `${Math.floor(diffDays / 30)}mo`;
                              })()
                            : "1w"}{" "}
                          •
                        </span>
                        <Globe className="h-3 w-3 text-slate-500 dark:text-slate-400" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Content Area - Grows to fill space */}
                <div className="flex-1 flex flex-col min-h-0">
                  {/* Post Content */}
                  <div
                    className={`px-4 pb-3 relative ${
                      currentPost.status === "DRAFT" ||
                      currentPost.status === "SCHEDULED"
                        ? "cursor-pointer"
                        : ""
                    }`}
                    onClick={
                      currentPost.status === "DRAFT" ||
                      currentPost.status === "SCHEDULED"
                        ? handleOpenEditModal
                        : undefined
                    }
                  >
                    <div className="text-sm text-slate-900 dark:text-slate-100 leading-[1.5] whitespace-pre-wrap">
                      {currentPost.content}
                    </div>
                    {(currentPost.status === "DRAFT" ||
                      currentPost.status === "SCHEDULED") && (
                      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <div className="flex items-center gap-2">
                          <Edit className="h-3 w-3" />
                          <span>Click to edit</span>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopyPost();
                          }}
                          className={`flex items-center gap-2 ${
                            copiedContent
                              ? "text-green-600"
                              : "text-slate-500 dark:text-slate-400"
                          }`}
                        >
                          {copiedContent ? (
                            <Check className="h-3 w-3" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                          <span>Copy</span>
                        </button>
                      </div>
                    )}
                    {currentPost.status === "PUBLISHED" && (
                      <div className="flex items-center justify-end text-xs text-slate-500 dark:text-slate-400 mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopyPost();
                          }}
                          className={`flex items-center gap-2 ${
                            copiedContent
                              ? "text-green-600"
                              : "text-slate-500 dark:text-slate-400"
                          }`}
                        >
                          {copiedContent ? (
                            <Check className="h-3 w-3" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                          <span>Copy</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Image Preview - LinkedIn Style */}
                  {currentPost.image_url &&
                    (() => {
                      const imageUrl = getStorageUrl(currentPost.image_url);
                      if (!imageUrl) return null;
                      return (
                        <div className="px-4 pb-3">
                          <div
                            className="relative w-full"
                            style={{ height: "600px" }}
                          >
                            <Image
                              src={imageUrl}
                              alt="Post image"
                              fill
                              className="rounded-md object-contain"
                              unoptimized
                              onError={(e) => {
                                e.currentTarget.style.display = "none";
                              }}
                            />
                          </div>
                        </div>
                      );
                    })()}

                  {/* Document Preview */}
                  {currentPost.document_url &&
                    (() => {
                      const documentUrl = getStorageUrl(
                        currentPost.document_url
                      );
                      const documentName = getFilenameFromPath(
                        currentPost.document_url
                      );
                      return documentUrl ? (
                        <div className="px-4 pb-3">
                          <a
                            href={documentUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-3 px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700"
                          >
                            <FileText className="h-8 w-8 text-slate-600 dark:text-slate-400 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                                {documentName || "Document"}
                              </p>
                              <p className="text-xs text-slate-500 dark:text-slate-400">
                                Click to download
                              </p>
                            </div>
                            <Download className="h-5 w-5 text-slate-600 dark:text-slate-400 flex-shrink-0" />
                          </a>
                        </div>
                      ) : null;
                    })()}

                  {/* Video Preview */}
                  {currentPost.video_url &&
                    (() => {
                      const videoUrl = getStorageUrl(currentPost.video_url);
                      if (!videoUrl) return null;
                      return (
                        <div className="px-4 pb-3">
                          <video
                            src={videoUrl}
                            controls
                            className="w-full rounded-md"
                            style={{ maxHeight: "600px" }}
                          />
                        </div>
                      );
                    })()}
                </div>

                {/* Engagement Section - Stays at bottom */}
                <div className="px-4 pb-2 pt-2 border-t border-slate-200 dark:border-slate-800 flex-shrink-0">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1">
                      <div className="flex items-center -space-x-1">
                        <div className="h-5 w-5 rounded-full bg-blue-600 border-2 border-white dark:border-slate-900 flex items-center justify-center">
                          <ThumbsUp className="h-3 w-3 text-white" />
                        </div>
                        <div className="h-5 w-5 rounded-full bg-red-500 border-2 border-white dark:border-slate-900 flex items-center justify-center">
                          <Heart className="h-3 w-3 text-white" />
                        </div>
                        <div className="h-5 w-5 rounded-full bg-green-500 border-2 border-white dark:border-slate-900 flex items-center justify-center">
                          <span className="text-xs">👏</span>
                        </div>
                      </div>
                      <span className="text-xs text-slate-600 dark:text-slate-400 ml-1">
                        {engagementMetrics
                          ? `You and ${engagementMetrics.likes} others`
                          : "You and X others"}
                      </span>
                    </div>
                    <div className="text-xs text-slate-600 dark:text-slate-400">
                      {engagementMetrics
                        ? `${engagementMetrics.comments} comments`
                        : "X comments"}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Floating Action Buttons */}
          {hasActionsToShow() && (
            <div className="mt-4">
              <Card className="shadow-none">
                <CardHeader>
                  <CardTitle className="text-lg">Actions</CardTitle>
                </CardHeader>
                <CardContent>
                  {error && (
                    <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded-lg">
                      <div className="text-red-600 font-medium text-xs">
                        {error}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2 flex-wrap">
                    {currentPost.status === "DRAFT" ? (
                      <>
                        <PublishToLinkedInButton
                          postId={currentPost.id}
                          linkedinProfileConnected={linkedinConnected}
                          linkedinOrganizations={organizations}
                          onPublish={(publishTarget) =>
                            handlePublishToLinkedIn(
                              currentPost.id,
                              publishTarget
                            )
                          }
                          isPublishing={publishingToLinkedin === currentPost.id}
                        />

                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleOpenScheduleModal}
                          disabled={updatingPost === currentPost.id}
                          className="flex items-center gap-2 text-blue-600 hover:text-blue-700"
                        >
                          <Calendar className="h-4 w-4" />
                          Schedule
                        </Button>
                      </>
                    ) : currentPost.status === "PUBLISHED" ? (
                      <>
                        {currentPost.linkedin_posts &&
                          currentPost.linkedin_posts.length > 0 && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                const linkedinPost =
                                  currentPost.linkedin_posts![0];
                                try {
                                  const linkedinURL = generateLinkedInPostURL(
                                    linkedinPost.linkedin_post_id,
                                    linkedinPost.organization_id
                                  );
                                  window.open(
                                    linkedinURL,
                                    "_blank",
                                    "noopener,noreferrer"
                                  );
                                } catch (error) {
                                  console.error(
                                    "Error generating LinkedIn URL:",
                                    error
                                  );
                                }
                              }}
                              className="flex items-center gap-2 text-blue-600 hover:text-blue-700"
                            >
                              <Linkedin className="h-4 w-4" />
                              View on LinkedIn
                            </Button>
                          )}
                      </>
                    ) : (
                      // SCHEDULED posts
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleOpenScheduleModal}
                          disabled={updatingPost === currentPost.id}
                          className="flex items-center gap-2 text-blue-600 hover:text-blue-700"
                        >
                          <Calendar className="h-4 w-4" />
                          Reschedule
                        </Button>

                        <PublishToLinkedInButton
                          postId={currentPost.id}
                          linkedinProfileConnected={linkedinConnected}
                          linkedinOrganizations={organizations}
                          onPublish={(publishTarget) =>
                            handlePublishToLinkedIn(
                              currentPost.id,
                              publishTarget
                            )
                          }
                          isPublishing={publishingToLinkedin === currentPost.id}
                        />
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {/* Right Column - Post Information */}
        <div className="flex flex-col h-full space-y-4">
          {currentPost.two_para_summary && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-sm leading-relaxed">
                  {currentPost.two_para_summary}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Post Information Section */}
          <Card className="flex-1 flex flex-col">
            <CardHeader>
              <CardTitle className="text-lg">Post Information</CardTitle>
            </CardHeader>
            <CardContent className="flex-1">
              <dl className="grid grid-cols-1 gap-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500 mb-1">
                    Status
                  </dt>
                  <dd>
                    <PostStatusBadge
                      status={currentPost.status}
                      scheduledPublishDate={currentPost.scheduled_publish_date}
                      scheduledPublishTarget={currentPost.publish_target}
                      publishedAt={currentPost.published_at}
                      linkedinPosts={currentPost.linkedin_posts}
                      hideDate={true}
                    />
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500 mb-1">
                    Type
                  </dt>
                  <dd>
                    {(() => {
                      const orgInfo = getOrganizationInfo(currentPost);
                      return (
                        <div className="flex items-center gap-2">
                          <div
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: orgInfo.color }}
                          />
                          <span className="text-sm text-gray-900">
                            {orgInfo.organizationName}
                          </span>
                        </div>
                      );
                    })()}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500 mb-1">
                    Created
                  </dt>
                  <dd className="text-sm text-gray-900">
                    {new Date(currentPost.created_at).toLocaleDateString(
                      "en-US",
                      {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      }
                    )}
                  </dd>
                </div>
                {currentPost.scheduled_publish_date && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500 mb-1">
                      Scheduled
                    </dt>
                    <dd className="text-sm text-gray-900">
                      {new Date(
                        currentPost.scheduled_publish_date
                      ).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </dd>
                  </div>
                )}
                {currentPost.published_at && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500 mb-1">
                      Published
                    </dt>
                    <dd className="text-sm text-gray-900">
                      {new Date(currentPost.published_at).toLocaleDateString(
                        "en-US",
                        {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        }
                      )}
                    </dd>
                  </div>
                )}
                {currentPost.source_url && currentPost.source_title && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500 mb-1">
                      Source Article
                    </dt>
                    <dd className="text-sm">
                      <a
                        href={currentPost.source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-2"
                      >
                        <ExternalLink className="h-4 w-4" />
                        {currentPost.source_title}
                      </a>
                    </dd>
                  </div>
                )}
              </dl>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Post Performance Metrics - Separate Block */}
      {currentPost.status === "PUBLISHED" &&
        currentPost.linkedin_posts &&
        currentPost.linkedin_posts.length > 0 && (
          <div className="mt-8">
            {currentPost.linkedin_posts
              .filter(
                (linkedinPost) =>
                  linkedinPost.status === "PUBLISHED" &&
                  linkedinPost.linkedin_post_id
              )
              .map((linkedinPost) => (
                <PostMetricsDisplay
                  key={linkedinPost.linkedin_post_id}
                  linkedinPostId={linkedinPost.linkedin_post_id}
                />
              ))}
          </div>
        )}

      <SchedulePostModal
        isOpen={scheduleModalOpen}
        onClose={handleCloseScheduleModal}
        onSchedule={handleSchedulePost}
        currentScheduledDate={currentPost.scheduled_publish_date || null}
        currentPublishTarget={currentPost.publish_target || null}
        organizations={organizations}
        isSubmitting={isScheduling}
        error={scheduleError}
      />

      <DeleteConfirmationModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={confirmDeletePost}
        title="Delete Post"
        description={
          modalPostStatus === "PUBLISHED"
            ? "This will remove the post from your linkedbud dashboard."
            : "Are you sure you want to delete this post?"
        }
        confirmText="Delete Post"
        cancelText="Cancel"
        isLoading={modalIsLoading}
        isPublishedPost={modalPostStatus === "PUBLISHED"}
      />

      <PolishModal
        isOpen={polishModalOpen}
        onClose={handleClosePolishModal}
        onPolish={handlePolish}
        isLoading={isPolishing}
        currentContent={currentPost?.content}
      />

      <CreatePostModal
        key={
          currentPost?.id
            ? `post-${currentPost.id}-v${postContentVersion}`
            : undefined
        }
        isOpen={editModalOpen}
        onClose={handleCloseEditModal}
        onGenerate={async () => {
          // This won't be called when editing, but required by interface
        }}
        isGenerating={false}
        postId={currentPost?.id}
        publishTarget={currentPost?.publish_target || "personal"}
        onUpdate={handleUpdatePost}
        initialFormData={
          currentPost
            ? {
                topicTitle: currentPost.content,
                articleUrl: currentPost.source_url || undefined,
                articleTitle: currentPost.source_title || undefined,
                articleContent: currentPost.source_content || undefined,
                imagePreview: currentPost.image_url
                  ? getStorageUrl(currentPost.image_url) || undefined
                  : undefined,
                documentPreview: currentPost.document_url
                  ? getStorageUrl(currentPost.document_url) || undefined
                  : undefined,
                videoPreview: currentPost.video_url
                  ? getStorageUrl(currentPost.video_url) || undefined
                  : undefined,
              }
            : undefined
        }
      />
    </PageWrapper>
  );
}
