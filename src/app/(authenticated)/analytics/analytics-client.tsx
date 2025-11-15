"use client";

import { useState, useEffect, useRef } from "react";
import { PageWrapper } from "@/components/ui/page-wrapper";
import { PageTitle } from "@/components/ui/page-title";
import { PageDescription } from "@/components/ui/page-description";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardHeader,
  CardDescription,
} from "@/components/ui/card";
import { OverviewCards } from "@/components/analytics/overview-cards";
import { TimeSeriesChart } from "@/components/analytics/time-series-chart";
import { EngagementBreakdown } from "@/components/analytics/engagement-breakdown";
import { ContentInsights } from "@/components/analytics/content-insights";
import { TopPostsTable } from "@/components/analytics/top-posts-table";
import { AnalyticsInsights } from "@/components/analytics/analytics-insights";
import { createClientClient } from "@/lib/supabase-client";
import { Sparkles, Trophy } from "lucide-react";
import { CardTitleWithIcon } from "@/components/ui/card-title-with-icon";
import { DatePicker } from "@/components/ui/date-picker";

interface Organization {
  id: number;
  linkedin_org_id: string;
  org_name: string | null;
  org_vanity_name: string | null;
}

export function AnalyticsClient() {
  const [period, setPeriod] = useState("30d");
  const [context, setContext] = useState<string>("all"); // Can be "all", "personal", or organization ID
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [tableLoading, setTableLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);
  const [customStartDate, setCustomStartDate] = useState<string>("");
  const [customEndDate, setCustomEndDate] = useState<string>("");
  const [sortColumn, setSortColumn] = useState<"impressions" | "likes" | "comments" | "shares" | "engagementRate">("impressions");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const initialLoadRef = useRef(true);
  const prevFiltersRef = useRef({ period, context, customStartDate, customEndDate });

  useEffect(() => {
    fetchOrganizations();
  }, []);

  useEffect(() => {
    fetchAnalytics();
  }, [period, context, customStartDate, customEndDate, sortColumn, sortDirection]);

  // Clear custom dates when switching away from custom period
  useEffect(() => {
    if (period !== "custom") {
      setCustomStartDate("");
      setCustomEndDate("");
    }
  }, [period]);

  const fetchOrganizations = async () => {
    try {
      const supabase = createClientClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { data: orgData, error: orgError } = await supabase
        .from("linkedin_organizations")
        .select("*")
        .eq("user_id", user.id)
        .order("org_name", { ascending: true });

      if (!orgError && orgData) {
        setOrganizations(orgData);
      }
    } catch (err) {
      console.error("Failed to fetch organizations:", err);
    }
  };

  const fetchAnalytics = async () => {
    // Don't fetch if custom period is selected but dates aren't complete
    if (period === "custom" && (!customStartDate || !customEndDate)) {
      return;
    }

    // Check if this is a sort-only change (filters haven't changed, only sort params)
    const filtersChanged = 
      prevFiltersRef.current.period !== period ||
      prevFiltersRef.current.context !== context ||
      prevFiltersRef.current.customStartDate !== customStartDate ||
      prevFiltersRef.current.customEndDate !== customEndDate;
    
    const isSortOnlyChange = 
      !initialLoadRef.current && 
      !filtersChanged && 
      data !== null;
    
    try {
      if (isSortOnlyChange) {
        setTableLoading(true);
      } else {
        setLoading(true);
      }
      setError(null);

      let url = `/api/analytics?period=${period}&context=${context}&sortColumn=${sortColumn}&sortDirection=${sortDirection}`;
      
      // Add custom date range if period is custom and dates are selected
      if (period === "custom" && customStartDate && customEndDate) {
        url += `&startDate=${customStartDate}&endDate=${customEndDate}`;
      }

      const response = await fetch(url);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to fetch analytics");
      }

      setData(result.data);
      initialLoadRef.current = false;
      
      // Update previous filters after successful fetch
      prevFiltersRef.current = { period, context, customStartDate, customEndDate };
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch analytics"
      );
    } finally {
      if (isSortOnlyChange) {
        setTableLoading(false);
      } else {
        setLoading(false);
      }
    }
  };

  return (
    <PageWrapper>
      <div className="mb-8">
        <PageTitle>Analytics</PageTitle>
        <PageDescription>
          Track your post performance and engagement metrics
        </PageDescription>
      </div>

      {/* Filters */}
      <div className="mb-8 space-y-4">
        <div className="flex flex-wrap gap-6 items-end">
          {/* Period Selector */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Time Period
            </label>
            <Tabs value={period} onValueChange={setPeriod}>
              <TabsList>
                <TabsTrigger value="custom">Custom</TabsTrigger>
                <TabsTrigger value="7d">7 Days</TabsTrigger>
                <TabsTrigger value="30d">30 Days</TabsTrigger>
                <TabsTrigger value="90d">90 Days</TabsTrigger>
                <TabsTrigger value="all">All Time</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Context Selector */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Context
            </label>
            <Tabs value={context} onValueChange={setContext}>
              <TabsList className="flex-wrap">
                <TabsTrigger value="all">All Posts</TabsTrigger>
                <TabsTrigger value="personal">Personal</TabsTrigger>
                {organizations.map((org) => (
                  <TabsTrigger
                    key={org.linkedin_org_id}
                    value={org.linkedin_org_id}
                  >
                    {org.org_name || org.linkedin_org_id}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>
        </div>

        {/* Custom Date Range Selector */}
        {period === "custom" && (
          <div className="space-y-2">
            <div className="flex gap-4 items-end">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Start Date
                </label>
                <DatePicker
                  value={customStartDate}
                  onChange={setCustomStartDate}
                  max={customEndDate || undefined}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  End Date
                </label>
                <DatePicker
                  value={customEndDate}
                  onChange={setCustomEndDate}
                  min={customStartDate || undefined}
                />
              </div>
            </div>
            {(!customStartDate || !customEndDate) && (
              <p className="text-sm text-gray-500">
                Please select both start and end dates to view analytics
              </p>
            )}
          </div>
        )}
      </div>

      {loading ? (
        <div className="space-y-6">
          <div className="animate-pulse">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-48 bg-gray-200 rounded-lg mb-6" />
            ))}
          </div>
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <p className="text-red-600 mb-4">{error}</p>
          <p className="text-gray-500 text-sm">
            Analytics will appear here once you publish posts and metrics are
            collected.
          </p>
        </div>
      ) : data ? (
        <div className="space-y-8">
          {/* Overview Cards */}
          <OverviewCards data={data.currentPeriod} />

          {/* Time Series Chart */}
          <TimeSeriesChart data={data.timeSeriesData} />

          {/* Engagement Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <EngagementBreakdown
              likes={data.currentPeriod.topPostsByImpressions.reduce(
                (sum: number, p: { likes?: number }) => sum + (p.likes || 0),
                0
              )}
              comments={data.currentPeriod.topPostsByImpressions.reduce(
                (sum: number, p: { comments?: number }) => sum + (p.comments || 0),
                0
              )}
              shares={data.currentPeriod.topPostsByImpressions.reduce(
                (sum: number, p: { shares?: number }) => sum + (p.shares || 0),
                0
              )}
            />

            <ContentInsights
              postsByStatus={data.postsByStatus}
              avgImpressions={
                data.currentPeriod.postCount > 0
                  ? data.currentPeriod.impressions /
                    data.currentPeriod.postCount
                  : 0
              }
              avgEngagementRate={data.currentPeriod.engagementRate}
            />
          </div>

          {/* Analytics Section */}
          <Card>
            <CardHeader>
              <CardTitleWithIcon
                icon={Trophy}
                title="Top Posts"
              />
              <CardDescription>
                Analyze your best performing posts by impressions and engagement
                rate, with AI-powered insights to help you optimize your content
                strategy.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-8">
                {/* Impressions Section */}
                <div className="border-b border-gray-200 pb-6 last:border-0 last:pb-0">
                  <TopPostsTable
                    posts={data.currentPeriod.topPostsByImpressions}
                    sortBy="impressions"
                    title=""
                    noCard={true}
                    sortColumn={sortColumn}
                    sortDirection={sortDirection}
                    loading={tableLoading}
                    onSortChange={(column, direction) => {
                      setSortColumn(column);
                      setSortDirection(direction);
                    }}
                  />
                </div>

                {/* AI Insights Section */}
                <div>
                  <div className="mb-4 space-y-1.5">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-blue-600 dark:text-blue-500" />
                      <h3 className="text-2xl font-semibold leading-none tracking-tight text-slate-900 dark:text-white">
                        Insights
                      </h3>
                    </div>
                    <p className="text-sm text-muted-foreground text-slate-600 dark:text-slate-300 ml-7">
                      powered by AI
                    </p>
                  </div>
                  <AnalyticsInsights
                    period={period}
                    context={context}
                    startDate={period === "custom" ? customStartDate : undefined}
                    endDate={period === "custom" ? customEndDate : undefined}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : null}
    </PageWrapper>
  );
}
