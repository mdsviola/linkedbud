"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { CardTitleWithIcon } from "@/components/ui/card-title-with-icon";
import { BarChart3 } from "lucide-react";
import { OverviewCards } from "@/components/analytics/overview-cards";

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

interface AnalyticsWidgetProps {
  data: AnalyticsData | null;
  loading: boolean;
  error: string | null;
}

export function AnalyticsWidget({
  data,
  loading,
  error,
}: AnalyticsWidgetProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitleWithIcon
            icon={BarChart3}
            title="Analytics"
            description="Performance metrics from the past 7 days"
          />
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="animate-pulse">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 bg-gray-200 rounded-lg mb-4" />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitleWithIcon
            icon={BarChart3}
            title="Analytics"
            description="Performance metrics from the past 7 days"
          />
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <p className="text-red-600 mb-4">{error}</p>
            <p className="text-gray-500 text-sm">
              Analytics will appear here once you publish posts and metrics are
              collected.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card>
        <CardHeader>
          <CardTitleWithIcon
            icon={BarChart3}
            title="Analytics"
            description="Performance metrics from the past 7 days"
          />
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <p className="text-gray-600 text-sm mb-1">
              No analytics data available
            </p>
            <p className="text-gray-500 text-xs">
              Analytics will appear here once you publish posts
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitleWithIcon
          icon={BarChart3}
          title="Analytics"
          description="Performance metrics from the past 7 days"
        />
      </CardHeader>
      <CardContent>
        {/* Overview Cards */}
        <OverviewCards data={data.currentPeriod} />
      </CardContent>
    </Card>
  );
}
