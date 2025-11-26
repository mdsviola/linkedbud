"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CardTitleWithIcon } from "@/components/ui/card-title-with-icon";
import { PageWrapper } from "@/components/ui/page-wrapper";
import { PageTitle } from "@/components/ui/page-title";
import { PageDescription } from "@/components/ui/page-description";
import { BarChart3, FileText, Calendar, TrendingUp } from "lucide-react";
import { AnalyticsWidget } from "@/components/analytics-widget";
import { IdeasShowcase, Idea } from "@/components/ideas-showcase";
import {
  truncateContent,
  getOrganizationName,
  formatDateTime,
} from "@/lib/utils";

interface Post {
  id: number;
  two_para_summary: string;
  content: string;
  status: "DRAFT" | "SCHEDULED" | "PUBLISHED" | "ARCHIVED";
  created_at: string;
  scheduled_publish_date: string | null;
  published_at: string | null;
  publish_target: string | null;
  linkedin_posts?: {
    linkedin_post_id: string;
    status: string;
    published_at: string;
    organization_id: string | null;
  }[];
}

// Analytics data structure matching the analytics API response
interface AnalyticsData {
  currentPeriod: {
    impressions: number;
    engagement: number;
    engagementRate: number;
    previousPeriod?: {
      impressions: number;
      engagement: number;
      engagementRate: number;
    };
    topPostsByImpressions: Array<{
      likes?: number;
      comments?: number;
      shares?: number;
    }>;
  };
  postsByStatus: {
    published: number;
    scheduled: number;
    draft: number;
    archived: number;
  };
}

export function DashboardClient() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [upcomingScheduledPosts, setUpcomingScheduledPosts] = useState<Post[]>(
    []
  );
  const [organizations, setOrganizations] = useState<Record<string, string>>(
    {}
  );
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(
    null
  );
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [analyticsError, setAnalyticsError] = useState<string | null>(null);
  const [postsLoading, setPostsLoading] = useState(true);
  const [scheduledPostsLoading, setScheduledPostsLoading] = useState(true);
  const [error, setError] = useState("");
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [ideasLoading, setIdeasLoading] = useState(false);
  const [cooldownRemaining, setCooldownRemaining] = useState<number | null>(
    null
  );
  const [ideasGeneratedAt, setIdeasGeneratedAt] = useState<string | null>(
    null
  );
  const [ideasExpiresAt, setIdeasExpiresAt] = useState<string | null>(
    null
  );
  const [insightsSummary, setInsightsSummary] = useState<string | null>(null);
  const [insightsLoading, setInsightsLoading] = useState(false);

  const checkCooldown = async () => {
    try {
      const response = await fetch("/api/ideas/cooldown");
      const result = await response.json();
      if (response.ok) {
        if (!result.canGenerate && result.remainingMs > 0) {
          setCooldownRemaining(result.remainingMs);
        } else {
          setCooldownRemaining(null);
        }
      }
    } catch (err) {
      console.warn("Error checking cooldown:", err);
    }
  };

  useEffect(() => {
    fetchPosts();
    fetchScheduledPosts();
    // Check cooldown status
    checkCooldown();
    // Fetch ideas from database (API will return cached ideas if available)
    fetchIdeas();
    // Fetch 7-day insights summary
    fetchInsightsSummary();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Calculate cooldown from expires_at once - no continuous updates to prevent flickering
  // The value will be recalculated when new data is fetched
  useEffect(() => {
    if (!ideasExpiresAt) {
      setCooldownRemaining(null);
      return;
    }

    const expiresAt = new Date(ideasExpiresAt).getTime();
    const now = Date.now();
    const remaining = expiresAt - now;

    if (remaining <= 0) {
      setCooldownRemaining(null);
    } else {
      setCooldownRemaining(remaining);
    }
  }, [ideasExpiresAt]);

  const fetchAnalytics = async () => {
    try {
      setAnalyticsLoading(true);
      setAnalyticsError(null);

      // Use the same analytics API as the analytics page, with 7d period
      const response = await fetch("/api/analytics?period=7d&context=all");
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to fetch analytics");
      }

      setAnalyticsData(result.data);
    } catch (err) {
      setAnalyticsError(
        err instanceof Error ? err.message : "Failed to fetch analytics"
      );
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const fetchInsightsSummary = async () => {
    try {
      setInsightsLoading(true);
      // Fetch 7-day insights - the API will return summary if available or generate it synchronously
      const response = await fetch(
        "/api/analytics/insights?period=7d&context=all"
      );
      const result = await response.json();

      if (response.ok) {
        // Display summary immediately if available
        if (result.summary) {
          setInsightsSummary(result.summary);
        } else {
          // No summary available (no insights or generation failed)
          setInsightsSummary(null);
        }
      } else {
        setInsightsSummary(null);
      }
    } catch (err) {
      console.warn("Error fetching insights summary:", err);
      setInsightsSummary(null);
    } finally {
      setInsightsLoading(false);
    }
  };

  const fetchIdeas = async (forceRefresh = false) => {
    try {
      setIdeasLoading(true);
      const url = forceRefresh ? "/api/ideas?refresh=true" : "/api/ideas";
      const response = await fetch(url);
      const result = await response.json();

      if (response.ok) {
        if (result.ideas && result.ideas.length > 0) {
          setIdeas(result.ideas);
          setIdeasGeneratedAt(result.generated_at || null);
          setIdeasExpiresAt(result.expires_at || null);
          // Cooldown will be calculated from expires_at in useEffect
        } else {
          // No ideas available - might be cooldown or no preferences
          setIdeas([]);
          setIdeasGeneratedAt(null);
          setIdeasExpiresAt(null);
        }
      } else {
        // Handle cooldown error
        if (result.error === "cooldown") {
          // Keep existing ideas if available
          if (result.ideas && result.ideas.length > 0) {
            setIdeas(result.ideas);
            setIdeasGeneratedAt(result.generated_at || null);
            setIdeasExpiresAt(result.expires_at || null);
          }
        } else {
          console.warn("Failed to fetch ideas:", result.error);
          // Only clear if it's a real error (not cooldown)
          if (result.error !== "cooldown") {
            setIdeas([]);
            setIdeasGeneratedAt(null);
            setIdeasExpiresAt(null);
          }
        }
      }
    } catch (err) {
      console.warn("Error fetching ideas:", err);
      // Don't clear ideas on network error
    } finally {
      setIdeasLoading(false);
    }
  };

  const fetchPosts = async () => {
    try {
      setPostsLoading(true);
      // Fetch all posts for metrics
      const postsResponse = await fetch("/api/posts");
      const postsResult = await postsResponse.json();

      if (!postsResponse.ok) {
        throw new Error(postsResult.error || "Failed to fetch posts");
      }

      setPosts(postsResult.posts || []);

      // Fetch analytics after successful posts fetch
      await fetchAnalytics();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setPostsLoading(false);
    }
  };

  const fetchScheduledPosts = async () => {
    try {
      setScheduledPostsLoading(true);
      const scheduledResponse = await fetch("/api/dashboard/scheduled-posts");
      const scheduledResult = await scheduledResponse.json();

      if (scheduledResponse.ok) {
        setUpcomingScheduledPosts(scheduledResult.posts || []);
        setOrganizations(scheduledResult.organizations || {});
      } else {
        console.warn("Failed to fetch scheduled posts:", scheduledResult.error);
        setUpcomingScheduledPosts([]);
      }
    } catch (scheduledError) {
      console.warn("Error fetching scheduled posts:", scheduledError);
      setUpcomingScheduledPosts([]);
    } finally {
      setScheduledPostsLoading(false);
    }
  };

  // Calculate metrics from posts
  const totalPosts = posts.length;
  const publishedPosts = posts.filter(
    (post) => post.status === "PUBLISHED"
  ).length;
  const draftPosts = posts.filter((post) => post.status === "DRAFT").length;
  const scheduledPosts = posts.filter(
    (post) => post.status === "SCHEDULED"
  ).length;
  const archivedPosts = posts.filter(
    (post) => post.status === "ARCHIVED"
  ).length;

  const formatScheduledDate = (dateString: string) => {
    return formatDateTime(dateString);
  };

  // Skeleton component for metric cards
  const MetricCardSkeleton = () => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 animate-pulse"></div>
        <div className="h-4 w-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
      </CardHeader>
      <CardContent>
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-16 mb-2 animate-pulse"></div>
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-32 animate-pulse"></div>
      </CardContent>
    </Card>
  );

  // Skeleton component for publishing schedule
  const PublishingScheduleSkeleton = () => (
    <Card>
      <CardHeader>
        <div className="space-y-2">
          <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-40 animate-pulse"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-64 animate-pulse"></div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-20 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"
            ></div>
          ))}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <PageWrapper>
      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                Error loading posts
              </h3>
              <p className="text-sm text-red-600 dark:text-red-300 mt-1">
                {error}
              </p>
            </div>
            <Button onClick={fetchPosts} size="sm" variant="outline">
              Try Again
            </Button>
          </div>
        </div>
      )}
      <div className="mb-8">
        <PageTitle>Dashboard</PageTitle>
        <PageDescription>
          Track your posts and content performance
        </PageDescription>
      </div>

      {/* Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {postsLoading ? (
          <>
            <MetricCardSkeleton />
            <MetricCardSkeleton />
            <MetricCardSkeleton />
            <MetricCardSkeleton />
          </>
        ) : (
          <>
            <Link href="/posts">
              <Card className="hover:bg-gray-50 transition-colors cursor-pointer">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Posts
                  </CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalPosts}</div>
                  <p className="text-xs text-muted-foreground">
                    All posts created
                  </p>
                </CardContent>
              </Card>
            </Link>

            <Link href="/posts/published">
              <Card className="hover:bg-gray-50 transition-colors cursor-pointer">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Published
                  </CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {publishedPosts}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Successfully published
                  </p>
                </CardContent>
              </Card>
            </Link>

            <Link href="/posts/draft">
              <Card className="hover:bg-gray-50 transition-colors cursor-pointer">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Drafts</CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-yellow-600">
                    {draftPosts}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Work in progress
                  </p>
                </CardContent>
              </Card>
            </Link>

            <Link href="/posts/scheduled">
              <Card className="hover:bg-gray-50 transition-colors cursor-pointer">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Scheduled
                  </CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">
                    {scheduledPosts}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Ready to publish
                  </p>
                </CardContent>
              </Card>
            </Link>
          </>
        )}
      </div>

      {/* Ideas Showcase */}
      <IdeasShowcase
        title="Content Ideas"
        description="Pop the bubbles to discover creative content strategies and inspiration for your posts"
        ideas={ideas}
        loading={ideasLoading}
        cooldownRemaining={cooldownRemaining}
        generatedAt={ideasGeneratedAt}
        onRefresh={() => fetchIdeas(true)}
        burstInterval={4000}
        ideaDisplayDuration={3000}
        className="mb-8"
        showDebug={false}
      />

      {/* Publishing Schedule */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {scheduledPostsLoading ? (
          <PublishingScheduleSkeleton />
        ) : (
          <Card>
            <CardHeader>
              <CardTitleWithIcon
                icon={Calendar}
                title="Publishing schedule"
                description="Upcoming scheduled posts for the next 7 days"
              />
            </CardHeader>
            <CardContent>
              {upcomingScheduledPosts.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">
                    No posts scheduled for the next 7 days
                  </p>
                  {posts.filter((p) => p.status === "SCHEDULED").length > 0 && (
                    <div className="mt-4">
                      <Link
                        href="/posts/scheduled"
                        className="text-blue-600 hover:text-blue-800 underline text-sm"
                      >
                        View all scheduled posts →
                      </Link>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col space-y-2">
                  {upcomingScheduledPosts.map((post) => (
                    <Link key={post.id} href={`/posts/${post.id}`}>
                      <div className="flex items-start justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 hover:border-gray-300 transition-colors duration-200 cursor-pointer">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-900 line-clamp-2">
                            {post.content && post.content.trim().length > 0
                              ? truncateContent(post.content, 120)
                              : post.two_para_summary &&
                                post.two_para_summary.trim().length > 0
                              ? truncateContent(post.two_para_summary, 120)
                              : "No content"}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-gray-600 font-medium">
                              {formatScheduledDate(
                                post.status === "PUBLISHED" && post.published_at
                                  ? post.published_at
                                  : post.scheduled_publish_date!
                              )}
                            </span>
                            <span className="text-xs text-gray-500">
                              • {getOrganizationName(post, organizations)}
                            </span>
                          </div>
                        </div>
                        <div className="ml-2 flex-shrink-0">
                          <Calendar className="h-4 w-4 text-gray-500" />
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* 7-Day Insights Summary */}
        <Card>
          <CardHeader>
            <CardTitleWithIcon
              icon={BarChart3}
              title="7-Day Insights"
              description="Key takeaways from your recent performance"
            />
          </CardHeader>
          <CardContent>
            {insightsLoading ? (
              <div className="text-center py-8">
                <div className="animate-pulse space-y-2">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mx-auto"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3 mx-auto"></div>
                </div>
              </div>
            ) : insightsSummary ? (
              <div className="py-4">
                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                  {insightsSummary}
                </p>
                <div className="mt-4">
                  <Link
                    href="/analytics"
                    className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline"
                  >
                    View full analytics →
                  </Link>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground text-sm">
                  No insights available yet. Publish some posts to see analytics
                  insights.
                </p>
                {publishedPosts > 0 && (
                  <div className="mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={fetchInsightsSummary}
                    >
                      Generate Insights
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Analytics - Full Width */}
      <div className="mt-8">
        <AnalyticsWidget
          data={analyticsData}
          loading={analyticsLoading}
          error={analyticsError}
        />
      </div>
    </PageWrapper>
  );
}
