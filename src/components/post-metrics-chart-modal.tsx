"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { LinkedInPostMetrics } from "@/lib/linkedin";
import { formatMetrics } from "@/lib/linkedin-metrics";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface PostMetricsChartModalProps {
  isOpen: boolean;
  onClose: () => void;
  linkedinPostId: string;
  selectedMetric: string;
}

type TimePeriod = "3d" | "7d" | "30d" | "custom";

interface ChartData {
  date: string;
  rawDate: string;
  impressions: number;
  likes: number;
  comments: number;
  shares: number;
  clicks: number;
  engagementRate: number;
}

export function PostMetricsChartModal({
  isOpen,
  onClose,
  linkedinPostId,
  selectedMetric,
}: PostMetricsChartModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timePeriod, setTimePeriod] = useState<TimePeriod>("3d");
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>([
    selectedMetric,
  ]);
  const [customStartDate, setCustomStartDate] = useState<string>("");
  const [customEndDate, setCustomEndDate] = useState<string>("");

  const availableMetrics = [
    { key: "impressions", label: "Impressions", color: "#3b82f6" },
    { key: "likes", label: "Likes", color: "#10b981" },
    { key: "comments", label: "Comments", color: "#8b5cf6" },
    { key: "shares", label: "Shares", color: "#f59e0b" },
    { key: "clicks", label: "Clicks", color: "#ef4444" },
  ];

  const engagementMetrics = [
    { key: "engagementRate", label: "Engagement Rate", color: "#6366f1" },
  ];

  const fetchChartData = async () => {
    try {
      setLoading(true);
      setError(null);

      let url = `/api/linkedin/metrics?linkedinPostId=${linkedinPostId}&includeHistory=true`;

      if (timePeriod === "custom") {
        if (!customStartDate || !customEndDate) {
          setError("Please select both start and end dates for custom range");
          return;
        }
        // For custom range, we'll fetch all data and filter on the client side
        // since the API doesn't support date range filtering yet
        url += "&days=365"; // Get up to a year of data
      } else {
        const days = timePeriod === "3d" ? 3 : timePeriod === "7d" ? 7 : 30;
        url += `&days=${days}`;
      }

      const response = await fetch(url);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to fetch chart data");
      }

      const data = await response.json();

      if (data.history && data.history.length > 0) {
        let formattedData: ChartData[] = data.history.map(
          (
            metric: LinkedInPostMetrics & {
              fetched_at?: string;
              engagement_rate?: number;
            }
          ) => ({
            date: new Date(metric.fetched_at || Date.now()).toLocaleString(
              "en-US",
              {
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
                timeZone: "UTC",
              }
            ),
            rawDate: metric.fetched_at || new Date().toISOString(), // Keep raw date for filtering
            impressions: metric.impressions,
            likes: metric.likes,
            comments: metric.comments,
            shares: metric.shares,
            clicks: metric.clicks,
            engagementRate:
              ("engagement_rate" in metric
                ? (metric as any).engagement_rate
                : 0) || 0,
          })
        );

        // Filter by custom date range if selected
        if (timePeriod === "custom" && customStartDate && customEndDate) {
          const startDate = new Date(customStartDate);
          const endDate = new Date(customEndDate);

          formattedData = formattedData.filter((item) => {
            const itemDate = new Date(item.rawDate);
            return itemDate >= startDate && itemDate <= endDate;
          });
        }

        setChartData(formattedData);
      } else {
        setChartData([]);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch chart data"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchChartData();
    }
  }, [isOpen, timePeriod, customStartDate, customEndDate]);

  // Update selected metrics when the selectedMetric prop changes
  useEffect(() => {
    setSelectedMetrics([selectedMetric]);
  }, [selectedMetric]);

  const toggleMetric = (metricKey: string) => {
    setSelectedMetrics((prev) => {
      // If toggling engagement rate, remove all other metrics
      if (metricKey === "engagementRate") {
        return prev.includes(metricKey)
          ? prev.filter((m) => m !== metricKey)
          : [metricKey];
      }

      // If toggling any other metric, remove engagement rate
      const newMetrics = prev.includes(metricKey)
        ? prev.filter((m) => m !== metricKey)
        : [...prev, metricKey];

      // Remove engagement rate if it's present
      return newMetrics.filter((m) => m !== "engagementRate");
    });
  };

  const renderChart = () => {
    if (chartData.length === 0) {
      return (
        <div className="h-64 flex items-center justify-center text-gray-500">
          No data available for the selected period
        </div>
      );
    }

    // Prepare data for Recharts
    const chartDataFormatted = chartData.map((data) => ({
      ...data,
      engagementRate: data.engagementRate * 100, // Convert to percentage for display
    }));

    // Define colors for each metric
    const colors = {
      impressions: "#3b82f6", // blue-500
      likes: "#10b981", // emerald-500
      comments: "#8b5cf6", // violet-500
      shares: "#f59e0b", // amber-500
      clicks: "#ef4444", // red-500
      engagementRate: "#6366f1", // indigo-500
    };

    return (
      <div className="h-64 w-full overflow-hidden">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartDataFormatted}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="date" stroke="#6b7280" fontSize={12} />
            <YAxis
              stroke="#6b7280"
              fontSize={12}
              tickFormatter={(value) => {
                // Format numbers with K/M suffixes
                if (value >= 1000000) {
                  return `${(value / 1000000).toFixed(1)}M`;
                } else if (value >= 1000) {
                  return `${(value / 1000).toFixed(1)}K`;
                }
                return value.toString();
              }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "white",
                border: "1px solid #e5e7eb",
                borderRadius: "6px",
                boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                maxWidth: "200px",
                overflow: "hidden",
              }}
              wrapperStyle={{
                outline: "none",
                zIndex: 1000,
              }}
              allowEscapeViewBox={{ x: false, y: false }}
              formatter={(value: number, name: string) => {
                if (name === "engagementRate") {
                  return [`${value.toFixed(2)}%`, name];
                }
                return [value.toLocaleString(), name];
              }}
            />
            <Legend />

            {/* Render lines for selected metrics */}
            {selectedMetrics.map((metricKey) => {
              const metric = [...availableMetrics, ...engagementMetrics].find(
                (m) => m.key === metricKey
              );
              if (!metric) return null;

              return (
                <Line
                  key={metricKey}
                  type="monotone"
                  dataKey={metricKey}
                  stroke={colors[metricKey as keyof typeof colors]}
                  strokeWidth={2}
                  dot={false}
                  activeDot={false}
                  name={metric.label}
                />
              );
            })}
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl sm:max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="mb-6 text-left">
          <DialogTitle>Post Performance Analytics</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Time period selector */}
          <div className="space-y-3">
            <div className="space-y-2">
              <span className="text-sm font-medium">Time Period</span>
              <div className="flex flex-wrap gap-2">
                {(["3d", "7d", "30d", "custom"] as TimePeriod[]).map(
                  (period) => (
                    <Button
                      key={period}
                      variant={timePeriod === period ? "default" : "outline"}
                      size="sm"
                      onClick={() => setTimePeriod(period)}
                    >
                      {period === "custom"
                        ? "Custom"
                        : `Last ${
                            period === "3d"
                              ? "3 days"
                              : period === "7d"
                              ? "7 days"
                              : "30 days"
                          }`}
                    </Button>
                  )
                )}
              </div>
            </div>

            {/* Custom date range fields */}
            {timePeriod === "custom" && (
              <div className="flex flex-wrap gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Start Date</label>
                  <Input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="w-full min-w-[180px] sm:w-40 pr-10"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">End Date</label>
                  <Input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="w-full min-w-[180px] sm:w-40 pr-10"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Metric toggles */}
          <div className="space-y-3">
            <div>
              <h4 className="text-sm font-medium mb-2">Primary Metrics</h4>
              <div className="flex flex-wrap gap-2">
                {availableMetrics.map((metric) => (
                  <Button
                    key={metric.key}
                    variant={
                      selectedMetrics.includes(metric.key)
                        ? "default"
                        : "outline"
                    }
                    size="sm"
                    onClick={() => toggleMetric(metric.key)}
                    className="flex items-center gap-2"
                  >
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: metric.color }}
                    />
                    {metric.label}
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium mb-2">Engagement Rate</h4>
              <div className="flex flex-wrap gap-2">
                {engagementMetrics.map((metric) => (
                  <Button
                    key={metric.key}
                    variant={
                      selectedMetrics.includes(metric.key)
                        ? "default"
                        : "outline"
                    }
                    size="sm"
                    onClick={() => toggleMetric(metric.key)}
                    className="flex items-center gap-2"
                  >
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: metric.color }}
                    />
                    {metric.label}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          {/* Chart */}
          <div className="border rounded-lg p-4">
            {loading ? (
              <div className="h-64 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              </div>
            ) : error ? (
              <div className="h-64 flex items-center justify-center text-red-600">
                {error}
              </div>
            ) : (
              renderChart()
            )}
          </div>

          {/* Chart legend */}
          {chartData.length > 0 && (
            <div className="flex flex-wrap gap-4 text-sm">
              {selectedMetrics.map((metricKey) => {
                const metric = [...availableMetrics, ...engagementMetrics].find(
                  (m) => m.key === metricKey
                );
                if (!metric) return null;

                const latestData = chartData[chartData.length - 1];
                const value =
                  metricKey === "engagementRate"
                    ? `${(
                        (latestData[metricKey as keyof ChartData] as number) *
                        100
                      ).toFixed(2)}%`
                    : latestData[
                        metricKey as keyof ChartData
                      ]?.toLocaleString();

                return (
                  <div key={metricKey} className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: metric.color }}
                    />
                    <span className="font-medium">{metric.label}:</span>
                    <span className="text-gray-600">{value}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
