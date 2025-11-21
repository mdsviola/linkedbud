"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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
import { PageDescription } from "@/components/ui/page-description";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Calendar,
  Edit,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  List,
  CheckCircle2,
} from "lucide-react";
import {
  CreatePostModal,
  CreatePostFormData,
} from "@/components/create-post-modal";
import { PostStatusBadge } from "@/components/post-status-badge";
import { Pagination, PaginationInfo } from "@/components/ui/pagination";
import { ScheduledPostsCalendar } from "@/components/scheduled-posts-calendar";
import { WarningMessage } from "@/components/ui/message";
import { LabelWithCount } from "@/components/ui/label-with-count";
import { isTokenExpired } from "@/lib/linkedin-token-utils";
import {
  truncateContent,
  getOrganizationName,
  formatDateTimeFull,
} from "@/lib/utils";

interface PostVariant {
  hook: string;
  body: string;
}

interface Post {
  id: number;
  two_para_summary: string;
  content: string;
  draft_variants: PostVariant[];
  status: "DRAFT" | "SCHEDULED" | "PUBLISHED" | "ARCHIVED";
  scheduled_publish_date: string | null;
  published_at: string | null;
  published_variant_index: number | null;
  created_at: string;
  publish_target: string | null;
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

export function ScheduledPostsClient() {
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>([]);
  const [organizations, setOrganizations] = useState<Record<string, string>>(
    {}
  );
  const [linkedInStatus, setLinkedInStatus] = useState<{
    connected: boolean;
    expiresAt: string | null;
  } | null>(null);

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
    const orgIds = Object.keys(organizations);
    const index = orgIds.indexOf(organizationId);
    return organizationColors[index % organizationColors.length];
  };
  // Initialize currentMonth with current date
  const now = new Date();
  const [currentMonth, setCurrentMonth] = useState<string | null>(
    `${now.getFullYear()}-${now.getMonth() + 1}`
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [createError, setCreateError] = useState("");
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPrevPage: false,
  });
  const [paginationLoading, setPaginationLoading] = useState(false);
  const [calendarLoading, setCalendarLoading] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Calculate the visible calendar date range (including days from previous/next month)
  const getCalendarDateRange = useCallback((year: number, month: number) => {
    // First day of the month
    const firstDay = new Date(year, month - 1, 1);
    // Last day of the month
    const lastDay = new Date(year, month, 0);

    // Get the day of the week for the first day (0 = Sunday, 6 = Saturday)
    const firstDayOfWeek = firstDay.getDay();

    // Calculate the first visible day (start of the calendar week containing the first day)
    // Subtract the weekday offset to get to the Sunday of that week
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDayOfWeek);
    startDate.setHours(0, 0, 0, 0);

    // Get the day of the week for the last day
    const lastDayOfWeek = lastDay.getDay();

    // Calculate the last visible day (end of the calendar week containing the last day)
    // Add days to complete the week (to Saturday)
    const daysToAdd = 6 - lastDayOfWeek;
    const endDate = new Date(lastDay);
    endDate.setDate(endDate.getDate() + daysToAdd);
    endDate.setHours(23, 59, 59, 999);

    return { startDate, endDate };
  }, []);

  const fetchPosts = useCallback(
    async (page: number = 1, year?: number, month?: number) => {
      try {
        // Clear all loading states first
        setLoading(false);
        setPaginationLoading(false);
        setCalendarLoading(false);

        // Then set the appropriate loading state
        if (page === 1 && year && month) {
          // Month navigation - use calendar loading ONLY
          setCalendarLoading(true);
          // NEVER set main loading to true during navigation
        } else if (page === 1 && isInitialLoad) {
          // Initial load - use main loading
          setLoading(true);
        } else {
          // Pagination - use pagination loading
          setPaginationLoading(true);
        }

        // If no year/month provided, use current month for initial load
        let fetchYear = year;
        let fetchMonth = month;
        if (!fetchYear || !fetchMonth) {
          const now = new Date();
          fetchYear = now.getFullYear();
          fetchMonth = now.getMonth() + 1;
        }

        let url = `/api/posts?status=SCHEDULED&page=${page}&limit=10`;

        // For calendar view (page 1), use extended date range to include adjacent month days
        // For pagination (page > 1), use regular month range
        if (page === 1) {
          // Calculate the visible calendar date range
          const { startDate, endDate } = getCalendarDateRange(
            fetchYear,
            fetchMonth
          );
          url += `&startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}&includePublished=true`;
        } else {
          // For pagination, use the month range
          url += `&year=${fetchYear}&month=${fetchMonth}&includePublished=true`;
        }

        const response = await fetch(url);
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || "Failed to fetch posts");
        }

        // Always update posts to reflect the current month, even if empty
        setPosts(result.posts || []);
        setOrganizations(result.organizations || {});
        setPagination(
          result.pagination || {
            page: 1,
            limit: 10,
            total: 0,
            totalPages: 0,
            hasNextPage: false,
            hasPrevPage: false,
          }
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
        setPaginationLoading(false);
        setCalendarLoading(false);
        setIsInitialLoad(false); // Mark that initial load is complete
      }
    },
    [getCalendarDateRange]
  );

  useEffect(() => {
    // On initial load, fetch posts for current month
    const now = new Date();
    fetchPosts(1, now.getFullYear(), now.getMonth() + 1);
  }, [fetchPosts]);

  useEffect(() => {
    // Check LinkedIn integration status
    const checkLinkedInStatus = async () => {
      try {
        const response = await fetch("/api/linkedin/status");
        const data = await response.json();
        setLinkedInStatus({
          connected: data.connected || false,
          expiresAt: data.expiresAt || null,
        });
      } catch (err) {
        console.error("Error checking LinkedIn status:", err);
      }
    };

    checkLinkedInStatus();
  }, []);

  const handleMonthChange = useCallback(
    (year: number, month: number) => {
      const monthKey = `${year}-${month}`;
      setCurrentMonth(monthKey);
      fetchPosts(1, year, month);
    },
    [fetchPosts]
  );

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      // Use current month when paginating
      if (currentMonth) {
        const [yearStr, monthStr] = currentMonth.split("-");
        fetchPosts(newPage, parseInt(yearStr), parseInt(monthStr));
      } else {
        // Fallback to current month if currentMonth is not set
        const now = new Date();
        fetchPosts(newPage, now.getFullYear(), now.getMonth() + 1);
      }
    }
  };

  const handleCustomGenerate = async (formData: CreatePostFormData) => {
    setIsGenerating(true);
    setCreateError("");

    try {
      const response = await fetch("/api/generate-custom", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      let data;
      try {
        data = await response.json();
      } catch (jsonError) {
        console.error("Error parsing response JSON:", jsonError);
        setCreateError(
          "Received an invalid response from the server. Please try again."
        );
        return;
      }

      if (!response.ok) {
        if (data.requiresUpgrade) {
          setCreateError(data.error || "Upgrade required to generate posts");
        } else {
          setCreateError(data.error || "Failed to generate post");
        }
        return;
      }

      // Success - close modal and redirect to post details
      setShowCustomModal(false);

      // Redirect to the post details page
      if (data.post && data.post.id) {
        router.push(`/posts/${data.post.id}`);
      } else {
        // Fallback: refresh posts if redirect fails
        await fetchPosts(1);
      }
    } catch (err) {
      setCreateError(
        err instanceof Error ? err.message : "Failed to generate post"
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePostClick = (post: Post) => {
    router.push(`/posts/${post.id}`);
  };

  if (loading) {
    return (
      <PageWrapper>
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </PageWrapper>
    );
  }

  if (error) {
    return (
      <PageWrapper>
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={() => fetchPosts(1)}>Try Again</Button>
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <PageTitle>Scheduled Posts</PageTitle>
          <PageDescription>
            Your posts scheduled for future publishing
          </PageDescription>
        </div>
        <Button
          onClick={() => setShowCustomModal(true)}
          size="lg"
          className="w-full sm:w-auto"
        >
          Create Post
        </Button>
      </div>

      {linkedInStatus &&
        (!linkedInStatus.connected ||
          isTokenExpired(linkedInStatus.expiresAt)) && (
          <div className="mb-6">
            <WarningMessage>
              LinkedIn integration is not complete. Automated publishing and
              metric fetching will not work until you connect your LinkedIn
              account.{" "}
              <Link href="/settings" className="underline font-medium">
                Go to Settings
              </Link>
            </WarningMessage>
          </div>
        )}

      <Tabs defaultValue="calendar" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="calendar" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Calendar View
          </TabsTrigger>
          <TabsTrigger value="list" className="flex items-center gap-2">
            <List className="h-4 w-4" />
            List View
          </TabsTrigger>
        </TabsList>

        <TabsContent value="calendar" className="mt-6">
          <ScheduledPostsCalendar
            posts={posts}
            loading={calendarLoading}
            onPostClick={handlePostClick}
            organizations={organizations}
            onMonthChange={handleMonthChange}
            currentMonth={currentMonth || undefined}
          />
        </TabsContent>

        <TabsContent value="list" className="mt-6">
          {posts.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <Calendar className="h-12 w-12 mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No scheduled posts yet
              </h3>
              <p className="text-gray-600 mb-4">
                Schedule some drafts to see them here
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              {paginationLoading && (
                <div className="text-center py-4">
                  <div className="inline-flex items-center px-4 py-2 text-sm text-gray-600">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
                    Loading posts...
                  </div>
                </div>
              )}
              {(() => {
                // Don't separate posts - render them in the order from API (already sorted by date)
                // The API returns posts sorted by: published_at for published, scheduled_publish_date for scheduled (newest first)

                const renderPost = (post: Post) => {
                  // Get organization name using utility function
                  const organizationName = getOrganizationName(
                    post,
                    organizations
                  );

                  // Determine organization ID
                  let orgId: string | null = null;
                  if (
                    post.publish_target &&
                    post.publish_target !== "personal"
                  ) {
                    orgId = post.publish_target;
                  } else if (post.linkedin_posts?.length) {
                    // Check if any linkedin post has an organization_id
                    const orgPost = post.linkedin_posts.find(
                      (lp) => lp.organization_id !== null
                    );
                    if (orgPost) {
                      orgId = orgPost.organization_id;
                    }
                  }

                  // Determine if this is a personal post
                  const isPersonal =
                    post.publish_target === "personal" ||
                    (!orgId && !post.publish_target) ||
                    post.linkedin_posts?.some(
                      (lp) => lp.organization_id === null
                    );

                  // Get actual published date (from LinkedIn post if available)
                  const actualPublishedAt =
                    post.linkedin_posts?.find(
                      (lp) => lp.status === "PUBLISHED" && lp.published_at
                    )?.published_at || post.published_at;

                  return (
                    <Link key={post.id} href={`/posts/${post.id}`}>
                      <Card className="hover:shadow-md transition-shadow cursor-pointer bg-background">
                        <CardContent className="p-4">
                          <div className="space-y-3">
                            {/* Header with title */}
                            <div className="flex items-center gap-3">
                              <h3 className="text-lg font-semibold text-gray-900">
                                Post #{post.id}
                              </h3>
                              <div className="flex items-center gap-1.5">
                                <div
                                  className="w-2 h-2 rounded-full flex-shrink-0"
                                  style={{
                                    backgroundColor: isPersonal
                                      ? "hsl(var(--primary))"
                                      : orgId
                                      ? getOrganizationColor(orgId)
                                      : "hsl(142 76% 36%)",
                                  }}
                                />
                                <span className="text-xs text-gray-500">
                                  {organizationName}
                                </span>
                              </div>
                            </div>

                            {/* Content snippet */}
                            <p className="text-gray-600 text-sm break-words line-clamp-2">
                              {truncateContent(post.content)}
                            </p>

                            {/* Date text */}
                            <p className="text-xs text-gray-500">
                              {post.status === "PUBLISHED"
                                ? `Published at ${
                                    actualPublishedAt
                                      ? formatDateTimeFull(actualPublishedAt)
                                      : "Unknown date"
                                  }`
                                : `Scheduled for ${
                                    post.scheduled_publish_date
                                      ? formatDateTimeFull(
                                          post.scheduled_publish_date
                                        )
                                      : "Not scheduled"
                                  }`}
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  );
                };

                // Count scheduled and published for display
                const scheduledCount = posts.filter(
                  (p) => p.status === "SCHEDULED"
                ).length;
                const publishedCount = posts.filter(
                  (p) => p.status === "PUBLISHED"
                ).length;

                return (
                  <>
                    {posts.length > 0 && (
                      <div className="space-y-4">
                        <div className="flex items-center gap-4">
                          {scheduledCount > 0 && (
                            <h2 className="flex items-center gap-2">
                              <Calendar className="h-5 w-5 text-blue-600" />
                              <LabelWithCount
                                label="Scheduled"
                                count={scheduledCount}
                              />
                            </h2>
                          )}
                          {publishedCount > 0 && (
                            <h2 className="flex items-center gap-2">
                              <CheckCircle2 className="h-5 w-5 text-green-600" />
                              <LabelWithCount
                                label="Published"
                                count={publishedCount}
                              />
                            </h2>
                          )}
                        </div>
                        <div className="flex flex-col gap-2">
                          {posts.map((post) => renderPost(post))}
                        </div>
                      </div>
                    )}
                    {posts.length === 0 && (
                      <div className="text-center py-8">
                        <p className="text-gray-500">No posts found</p>
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          )}

          <Pagination
            pagination={pagination}
            onPageChange={handlePageChange}
            loading={paginationLoading}
          />
        </TabsContent>
      </Tabs>

      <CreatePostModal
        isOpen={showCustomModal}
        onClose={() => setShowCustomModal(false)}
        onGenerate={handleCustomGenerate}
        isGenerating={isGenerating}
        error={createError}
      />
    </PageWrapper>
  );
}
