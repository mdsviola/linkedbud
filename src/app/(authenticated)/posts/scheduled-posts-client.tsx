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
  // Separate states for scheduled and published posts
  const [scheduledPosts, setScheduledPosts] = useState<Post[]>([]);
  const [publishedPosts, setPublishedPosts] = useState<Post[]>([]);
  // Combined posts for calendar view
  const [allPosts, setAllPosts] = useState<Post[]>([]);
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
    // Use a hash-based approach to assign stable colors
    // This ensures the same organization always gets the same color
    // regardless of the order in the organizations object
    let hash = 0;
    for (let i = 0; i < organizationId.length; i++) {
      const char = organizationId.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    const index = Math.abs(hash) % organizationColors.length;
    return organizationColors[index];
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

  // Separate pagination states
  const [scheduledPagination, setScheduledPagination] =
    useState<PaginationInfo>({
      page: 1,
      limit: 10,
      total: 0,
      totalPages: 0,
      hasNextPage: false,
      hasPrevPage: false,
    });
  const [publishedPagination, setPublishedPagination] =
    useState<PaginationInfo>({
      page: 1,
      limit: 10,
      total: 0,
      totalPages: 0,
      hasNextPage: false,
      hasPrevPage: false,
    });

  const [scheduledPaginationLoading, setScheduledPaginationLoading] =
    useState(false);
  const [publishedPaginationLoading, setPublishedPaginationLoading] =
    useState(false);
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

  // Fetch scheduled posts
  const fetchScheduledPosts = useCallback(
    async (
      page: number = 1,
      year?: number,
      month?: number,
      isCalendarView: boolean = false
    ) => {
      try {
        // Set loading state
        if (isCalendarView) {
          setCalendarLoading(true);
        } else if (page === 1 && isInitialLoad) {
          setLoading(true);
        } else {
          setScheduledPaginationLoading(true);
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

        if (isCalendarView && page === 1) {
          // For calendar view, use extended date range to include adjacent month days
          const { startDate, endDate } = getCalendarDateRange(
            fetchYear,
            fetchMonth
          );
          url += `&startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`;
        } else if (!isCalendarView) {
          // For list view pagination, use the month range
          url += `&year=${fetchYear}&month=${fetchMonth}`;
        }

        const response = await fetch(url);
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || "Failed to fetch scheduled posts");
        }

        // Update organizations from response (merge to preserve existing ones)
        if (result.organizations) {
          setOrganizations((prevOrgs) => ({
            ...prevOrgs,
            ...result.organizations,
          }));
        }

        if (isCalendarView) {
          // For calendar, we combine with published posts later
          return {
            posts: result.posts || [],
            organizations: result.organizations || {},
          };
        } else {
          // For list view, update scheduled posts state
          setScheduledPosts(result.posts || []);
          setScheduledPagination(
            result.pagination || {
              page: 1,
              limit: 10,
              total: 0,
              totalPages: 0,
              hasNextPage: false,
              hasPrevPage: false,
            }
          );
          return {
            posts: result.posts || [],
            organizations: result.organizations || {},
          };
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
        return { posts: [], organizations: {} };
      } finally {
        if (!isCalendarView) {
          setLoading(false);
          setScheduledPaginationLoading(false);
        } else {
          setCalendarLoading(false);
        }
      }
    },
    [getCalendarDateRange, isInitialLoad]
  );

  // Fetch published posts
  const fetchPublishedPosts = useCallback(
    async (
      page: number = 1,
      year?: number,
      month?: number,
      isCalendarView: boolean = false
    ) => {
      try {
        // Set loading state
        if (!isCalendarView) {
          setPublishedPaginationLoading(true);
        }

        // If no year/month provided, use current month for initial load
        let fetchYear = year;
        let fetchMonth = month;
        if (!fetchYear || !fetchMonth) {
          const now = new Date();
          fetchYear = now.getFullYear();
          fetchMonth = now.getMonth() + 1;
        }

        let url = `/api/posts?status=PUBLISHED&page=${page}&limit=10`;

        if (isCalendarView && page === 1) {
          // For calendar view, use extended date range to include adjacent month days
          const { startDate, endDate } = getCalendarDateRange(
            fetchYear,
            fetchMonth
          );
          // Note: The API filters by scheduled_publish_date by default, but for published posts
          // we need to filter by published_at. For now, we'll fetch and filter client-side if needed.
          url += `&startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`;
        } else if (!isCalendarView) {
          // For list view pagination, calculate month range and use startDate/endDate
          const firstDay = new Date(fetchYear, fetchMonth - 1, 1);
          const lastDay = new Date(fetchYear, fetchMonth, 0, 23, 59, 59, 999);
          url += `&startDate=${firstDay.toISOString()}&endDate=${lastDay.toISOString()}`;
        }

        const response = await fetch(url);
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || "Failed to fetch published posts");
        }

        // Update organizations from response (merge to preserve existing ones)
        if (result.organizations) {
          setOrganizations((prevOrgs) => ({
            ...prevOrgs,
            ...result.organizations,
          }));
        }

        if (isCalendarView) {
          // For calendar, we combine with scheduled posts later
          return {
            posts: result.posts || [],
            organizations: result.organizations || {},
          };
        } else {
          // For list view, update published posts state
          setPublishedPosts(result.posts || []);
          setPublishedPagination(
            result.pagination || {
              page: 1,
              limit: 10,
              total: 0,
              totalPages: 0,
              hasNextPage: false,
              hasPrevPage: false,
            }
          );
          return {
            posts: result.posts || [],
            organizations: result.organizations || {},
          };
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
        return { posts: [], organizations: {} };
      } finally {
        if (!isCalendarView) {
          setPublishedPaginationLoading(false);
        }
      }
    },
    [getCalendarDateRange]
  );

  // Fetch all posts for calendar view (combines scheduled and published)
  const fetchAllPostsForCalendar = useCallback(
    async (year?: number, month?: number) => {
      try {
        setCalendarLoading(true);

        const [scheduledResult, publishedResult] = await Promise.all([
          fetchScheduledPosts(1, year, month, true),
          fetchPublishedPosts(1, year, month, true),
        ]);

        // Combine posts for calendar view
        const combined = [
          ...(scheduledResult.posts || []),
          ...(publishedResult.posts || []),
        ];

        // Update organizations before setting posts to avoid flicker
        // Merge with existing organizations to preserve color stability
        setOrganizations((prevOrgs) => {
          const newOrgs =
            scheduledResult.organizations ||
            publishedResult.organizations ||
            {};
          // Merge to preserve existing organizations and add new ones
          return { ...prevOrgs, ...newOrgs };
        });

        // Set posts after organizations are updated
        setAllPosts(combined);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setCalendarLoading(false);
      }
    },
    [fetchScheduledPosts, fetchPublishedPosts]
  );

  // Fetch posts for list view (separate calls)
  const fetchPostsForListView = useCallback(
    async (
      scheduledPage: number = 1,
      publishedPage: number = 1,
      year?: number,
      month?: number
    ) => {
      try {
        if (scheduledPage === 1 && publishedPage === 1 && isInitialLoad) {
          setLoading(true);
        }

        const [scheduledResult, publishedResult] = await Promise.all([
          fetchScheduledPosts(scheduledPage, year, month, false),
          fetchPublishedPosts(publishedPage, year, month, false),
        ]);

        // Organizations are already set in the individual fetch functions
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
        setIsInitialLoad(false);
      }
    },
    [fetchScheduledPosts, fetchPublishedPosts, isInitialLoad]
  );

  useEffect(() => {
    // On initial load, fetch posts for current month
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    fetchPostsForListView(1, 1, year, month);
    fetchAllPostsForCalendar(year, month);
  }, [fetchPostsForListView, fetchAllPostsForCalendar]);

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
      // Reset pagination and fetch first pages for both sections
      setScheduledPagination((prev) => ({ ...prev, page: 1 }));
      setPublishedPagination((prev) => ({ ...prev, page: 1 }));
      fetchPostsForListView(1, 1, year, month);
      fetchAllPostsForCalendar(year, month);
    },
    [fetchPostsForListView, fetchAllPostsForCalendar]
  );

  const handleScheduledPageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= scheduledPagination.totalPages) {
      // Use current month when paginating
      if (currentMonth) {
        const [yearStr, monthStr] = currentMonth.split("-");
        fetchScheduledPosts(
          newPage,
          parseInt(yearStr),
          parseInt(monthStr),
          false
        );
      } else {
        // Fallback to current month if currentMonth is not set
        const now = new Date();
        fetchScheduledPosts(
          newPage,
          now.getFullYear(),
          now.getMonth() + 1,
          false
        );
      }
    }
  };

  const handlePublishedPageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= publishedPagination.totalPages) {
      // Use current month when paginating
      if (currentMonth) {
        const [yearStr, monthStr] = currentMonth.split("-");
        fetchPublishedPosts(
          newPage,
          parseInt(yearStr),
          parseInt(monthStr),
          false
        );
      } else {
        // Fallback to current month if currentMonth is not set
        const now = new Date();
        fetchPublishedPosts(
          newPage,
          now.getFullYear(),
          now.getMonth() + 1,
          false
        );
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
        const now = new Date();
        await fetchPostsForListView(
          1,
          1,
          now.getFullYear(),
          now.getMonth() + 1
        );
        await fetchAllPostsForCalendar(now.getFullYear(), now.getMonth() + 1);
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

  const renderPost = (post: Post) => {
    // Get organization name using utility function
    const organizationName = getOrganizationName(post, organizations);

    // Determine organization ID
    let orgId: string | null = null;
    if (post.publish_target && post.publish_target !== "personal") {
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
      post.linkedin_posts?.some((lp) => lp.organization_id === null);

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
                        ? formatDateTimeFull(post.scheduled_publish_date)
                        : "Not scheduled"
                    }`}
              </p>
            </div>
          </CardContent>
        </Card>
      </Link>
    );
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
          <Button
            onClick={() => {
              const now = new Date();
              fetchPostsForListView(
                1,
                1,
                now.getFullYear(),
                now.getMonth() + 1
              );
              fetchAllPostsForCalendar(now.getFullYear(), now.getMonth() + 1);
            }}
          >
            Try Again
          </Button>
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
            posts={allPosts}
            loading={calendarLoading}
            onPostClick={handlePostClick}
            organizations={organizations}
            onMonthChange={handleMonthChange}
            currentMonth={currentMonth || undefined}
          />
        </TabsContent>

        <TabsContent value="list" className="mt-6">
          {scheduledPosts.length === 0 &&
            publishedPosts.length === 0 &&
            !loading && (
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
            )}

          <div className="flex flex-col gap-8">
            {/* Scheduled Posts Section */}
            {(scheduledPosts.length > 0 || scheduledPaginationLoading) && (
              <div className="space-y-4">
                <h2 className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-blue-600" />
                  <LabelWithCount
                    label="Scheduled"
                    count={scheduledPagination.total}
                  />
                </h2>
                {scheduledPaginationLoading && (
                  <div className="text-center py-4">
                    <div className="inline-flex items-center px-4 py-2 text-sm text-gray-600">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
                      Loading scheduled posts...
                    </div>
                  </div>
                )}
                {scheduledPosts.length > 0 && (
                  <>
                    <div className="flex flex-col gap-2">
                      {scheduledPosts.map((post) => renderPost(post))}
                    </div>
                    {scheduledPagination.totalPages > 1 && (
                      <Pagination
                        pagination={scheduledPagination}
                        onPageChange={handleScheduledPageChange}
                        loading={scheduledPaginationLoading}
                      />
                    )}
                  </>
                )}
              </div>
            )}

            {/* Published Posts Section */}
            {(publishedPosts.length > 0 || publishedPaginationLoading) && (
              <div className="space-y-4">
                <h2 className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <LabelWithCount
                    label="Published"
                    count={publishedPagination.total}
                  />
                </h2>
                {publishedPaginationLoading && (
                  <div className="text-center py-4">
                    <div className="inline-flex items-center px-4 py-2 text-sm text-gray-600">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
                      Loading published posts...
                    </div>
                  </div>
                )}
                {publishedPosts.length > 0 && (
                  <>
                    <div className="flex flex-col gap-2">
                      {publishedPosts.map((post) => renderPost(post))}
                    </div>
                    {publishedPagination.totalPages > 1 && (
                      <Pagination
                        pagination={publishedPagination}
                        onPageChange={handlePublishedPageChange}
                        loading={publishedPaginationLoading}
                      />
                    )}
                  </>
                )}
              </div>
            )}
          </div>
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
