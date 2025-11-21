"use client";

import { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { formatDateTime } from "@/lib/utils";
import {
  Loader2,
  Sparkles,
  TrendingUp,
  MessageCircle,
  Lightbulb,
  BarChart3,
} from "lucide-react";
import type { AnalyticsInsight } from "@/lib/openai";

interface AnalyticsInsightsProps {
  period: string;
  context: string;
  startDate?: string;
  endDate?: string;
}

interface AnalyticsInsightsResponse {
  insights: AnalyticsInsight[];
  generatedAt: string;
  expiresAt: string;
  cached: boolean;
  error?: string;
}

const categoryIcons = {
  topics: TrendingUp,
  engagement: MessageCircle,
  themes: Lightbulb,
  metrics: BarChart3,
};

const categoryColors = {
  topics: "text-blue-600 dark:text-blue-500",
  engagement: "text-green-600 dark:text-green-500",
  themes: "text-purple-600 dark:text-purple-500",
  metrics: "text-orange-600 dark:text-orange-500",
};

const categoryBgColors = {
  topics: "bg-blue-50 dark:bg-blue-950/20",
  engagement: "bg-green-50 dark:bg-green-950/20",
  themes: "bg-purple-50 dark:bg-purple-950/20",
  metrics: "bg-orange-50 dark:bg-orange-950/20",
};

export function AnalyticsInsights({
  period,
  context,
  startDate,
  endDate,
}: AnalyticsInsightsProps) {
  const [insights, setInsights] = useState<AnalyticsInsight[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generatedAt, setGeneratedAt] = useState<string | null>(null);
  const [cached, setCached] = useState(false);

  useEffect(() => {
    fetchInsights();
  }, [period, context, startDate, endDate]);

  const fetchInsights = async () => {
    setLoading(true);
    setError(null);

    try {
      let url = `/api/analytics/insights?period=${period}&context=${context}`;

      if (period === "custom" && startDate && endDate) {
        url += `&startDate=${startDate}&endDate=${endDate}`;
      }

      const response = await fetch(url);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          (result as { error?: string }).error || "Failed to fetch insights"
        );
      }

      const typedResult = result as AnalyticsInsightsResponse;

      setInsights(typedResult.insights || []);
      setGeneratedAt(typedResult.generatedAt);
      setCached(typedResult.cached);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch insights");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex flex-col items-center gap-3 max-w-md text-center">
          <Loader2 className="h-6 w-6 animate-spin text-blue-600 dark:text-blue-500" />
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
            Generating AI insights...
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 px-4">
            This may take several minutes. Please keep this page open while we
            analyze your posts and generate insights.
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 dark:text-red-400 mb-2">{error}</p>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Insights will appear here once you have published posts with metrics.
        </p>
      </div>
    );
  }

  if (insights.length === 0) {
    return (
      <div className="text-center py-12">
        <Sparkles className="h-8 w-8 text-gray-400 dark:text-gray-500 mx-auto mb-3" />
        <p className="text-sm text-gray-500 dark:text-gray-400">
          No insights available yet. Publish more posts and collect metrics to
          generate insights.
        </p>
      </div>
    );
  }

  // Group insights by category
  const insightsByCategory = insights.reduce((acc, insight) => {
    if (!acc[insight.category]) {
      acc[insight.category] = [];
    }
    acc[insight.category].push(insight);
    return acc;
  }, {} as Record<string, AnalyticsInsight[]>);

  const categoryOrder: Array<keyof typeof categoryIcons> = [
    "topics",
    "engagement",
    "themes",
    "metrics",
  ];

  return (
    <div className="space-y-6">
      {categoryOrder.map((category) => {
        const categoryInsights = insightsByCategory[category] || [];
        if (categoryInsights.length === 0) return null;

        const Icon = categoryIcons[category];
        const colorClass = categoryColors[category];
        const bgClass = categoryBgColors[category];

        return (
          <div key={category} className="space-y-3">
            <div className="flex items-center gap-2">
              <div className={`p-2 rounded-lg ${bgClass}`}>
                <Icon className={`h-4 w-4 ${colorClass}`} />
              </div>
              <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 capitalize">
                {category === "topics"
                  ? "Top Performing Topics"
                  : category === "engagement"
                  ? "Engagement Patterns"
                  : category === "themes"
                  ? "Content Themes"
                  : "Metric Insights"}
              </h4>
            </div>
            <div className="space-y-4 ml-11">
              {categoryInsights.map((insight, index) => (
                <div
                  key={`${insight.title}-${index}`}
                  className="border-l-2 border-gray-200 dark:border-gray-700 pl-4 py-2"
                >
                  <h5 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                    {insight.title}
                  </h5>
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed"
                      components={{
                        p: ({ children }) => (
                          <p className="mb-2 last:mb-0">{children}</p>
                        ),
                        strong: ({ children }) => (
                          <strong className="font-semibold text-gray-900 dark:text-gray-100">
                            {children}
                          </strong>
                        ),
                        ul: ({ children }) => (
                          <ul className="list-disc list-inside mb-2 space-y-1">
                            {children}
                          </ul>
                        ),
                        ol: ({ children }) => (
                          <ol className="list-decimal list-inside mb-2 space-y-1">
                            {children}
                          </ol>
                        ),
                        li: ({ children }) => (
                          <li className="text-sm">{children}</li>
                        ),
                      }}
                    >
                      {insight.content}
                    </ReactMarkdown>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {generatedAt && (
        <div className="pt-4 border-t border-gray-200 dark:border-gray-700 mt-6">
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
            {cached ? "Cached insights" : "Fresh insights"} generated{" "}
            {formatDateTime(generatedAt)}
          </p>
        </div>
      )}
    </div>
  );
}
