"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { CardTitleWithIcon } from "@/components/ui/card-title-with-icon";
import { Badge } from "@/components/ui/badge";
import { LinkedInPostMetrics } from "@/lib/linkedin";
import { formatMetrics, calculateMetricsTrend } from "@/lib/linkedin-metrics";
import { PostMetricsChartModal } from "@/components/post-metrics-chart-modal";
import { BarChart3, TrendingUp, TrendingDown, Minus } from "lucide-react";

interface PostMetricsDisplayProps {
  linkedinPostId: string;
  className?: string;
}

interface MetricsData {
  latest: LinkedInPostMetrics;
  history?: LinkedInPostMetrics[];
}

export function PostMetricsDisplay({
  linkedinPostId,
  className = "",
}: PostMetricsDisplayProps) {
  const [metrics, setMetrics] = useState<MetricsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chartModalOpen, setChartModalOpen] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState<string>("");

  const fetchMetrics = async (includeHistory = false) => {
    try {
      setError(null);
      const response = await fetch(
        `/api/linkedin/metrics?linkedinPostId=${linkedinPostId}&includeHistory=${includeHistory}`
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to fetch metrics");
      }

      const data = await response.json();
      setMetrics(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch metrics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics(true);
  }, [linkedinPostId]);

  const handleMetricClick = (metricKey: string) => {
    setSelectedMetric(metricKey);
    setChartModalOpen(true);
  };

  if (loading) {
    return (
      <Card className={`${className}`}>
        <CardHeader>
          <CardTitleWithIcon
            icon={BarChart3}
            title="Post Performance"
            titleClassName="text-lg"
          />
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            <span className="ml-3 text-sm text-gray-600">
              Loading metrics...
            </span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={`${className}`}>
        <CardHeader>
          <CardTitleWithIcon
            icon={BarChart3}
            title="Post Performance"
            titleClassName="text-lg"
          />
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-red-600 text-sm mb-4">{error}</p>
            <p className="text-gray-500 text-xs">
              Metrics will be available once the post has been published and
              data is collected.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!metrics?.latest) {
    return (
      <Card className={`${className}`}>
        <CardHeader>
          <CardTitleWithIcon
            icon={BarChart3}
            title="Post Performance"
            titleClassName="text-lg"
          />
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-gray-500 text-sm mb-3">
              No metrics available for this post
            </p>
            <p className="text-gray-400 text-xs">
              Metrics will appear here once the post has been published and data
              is collected.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const formattedMetrics = formatMetrics(metrics.latest);
  const hasHistory = metrics.history && metrics.history.length > 1;
  const trend =
    hasHistory && metrics.history
      ? calculateMetricsTrend(
          metrics.latest,
          metrics.history[metrics.history.length - 2]
        )
      : null;

  const formatTrend = (value: number) => {
    if (value === 0) return "";
    const sign = value > 0 ? "+" : "";
    return `${sign}${value}`;
  };

  const getTrendIcon = (value: number) => {
    if (value > 0) return <TrendingUp className="h-3 w-3 text-green-600" />;
    if (value < 0) return <TrendingDown className="h-3 w-3 text-red-600" />;
    return <Minus className="h-3 w-3 text-gray-500" />;
  };

  const getTrendColor = (value: number) => {
    if (value > 0) return "text-green-600";
    if (value < 0) return "text-red-600";
    return "text-gray-500";
  };

  const primaryMetrics = [
    {
      key: "impressions",
      label: "Impressions",
      value: formattedMetrics.impressions,
    },
    { key: "likes", label: "Likes", value: formattedMetrics.likes },
    { key: "comments", label: "Comments", value: formattedMetrics.comments },
    { key: "shares", label: "Shares", value: formattedMetrics.shares },
    { key: "clicks", label: "Clicks", value: formattedMetrics.clicks },
  ];

  return (
    <>
      <Card className={`${className}`}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitleWithIcon
              icon={BarChart3}
              title="Post Performance"
              titleClassName="text-lg"
            />
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">
                Updated: {metrics.latest && 'fetched_at' in metrics.latest 
                  ? new Date((metrics.latest as any).fetched_at).toLocaleString()
                  : 'Recently'}
              </span>
              {hasHistory && (
                <Badge variant="secondary" className="text-xs">
                  Historical Data Available
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Primary Metrics */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3">
              Primary Metrics
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {primaryMetrics.map((metric) => (
                <div
                  key={metric.key}
                  className="group cursor-pointer p-4 rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-sm transition-all duration-200"
                  onClick={() => handleMetricClick(metric.key)}
                >
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                      {metric.value}
                    </div>
                    <div className="text-xs text-gray-500 mb-1">
                      {metric.label}
                    </div>
                    {trend && (
                      <div
                        className={`text-xs flex items-center justify-center gap-1 ${getTrendColor(
                          trend[metric.key as keyof typeof trend]
                        )}`}
                      >
                        {getTrendIcon(trend[metric.key as keyof typeof trend])}
                        {formatTrend(trend[metric.key as keyof typeof trend])}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Engagement Rate - Separate Section */}
          <div className="border-t pt-4">
            <h4 className="text-sm font-medium text-gray-700 mb-3">
              Engagement Rate
            </h4>
            <div className="max-w-xs">
              <div
                className="group cursor-pointer p-4 rounded-lg border border-gray-200 hover:border-indigo-300 hover:shadow-sm transition-all duration-200"
                onClick={() => handleMetricClick("engagementRate")}
              >
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">
                    {formattedMetrics.engagementRate}
                  </div>
                  <div className="text-xs text-gray-500 mb-1">
                    Engagement Rate
                  </div>
                  {trend && (
                    <div
                      className={`text-xs flex items-center justify-center gap-1 ${getTrendColor(
                        trend.engagementRate
                      )}`}
                    >
                      {getTrendIcon(trend.engagementRate)}
                      {formatTrend(trend.engagementRate)}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Click hint */}
          <div className="text-center">
            <p className="text-xs text-gray-400">
              Click on any metric to view detailed analytics
            </p>
          </div>
        </CardContent>
      </Card>

      <PostMetricsChartModal
        isOpen={chartModalOpen}
        onClose={() => setChartModalOpen(false)}
        linkedinPostId={linkedinPostId}
        selectedMetric={selectedMetric}
      />
    </>
  );
}
