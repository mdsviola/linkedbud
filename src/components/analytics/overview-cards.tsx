"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface OverviewCardsProps {
  data: {
    impressions: number;
    engagement: number;
    engagementRate: number;
    previousPeriod?: {
      impressions: number;
      engagement: number;
      engagementRate: number;
    };
  };
}

const formatNumber = (num: number): string => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + "M";
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + "K";
  }
  return num.toString();
};

const formatPercentage = (rate: number): string => {
  return (rate * 100).toFixed(2) + "%";
};

const calculateTrend = (
  current: number,
  previous: number
): { value: number; icon: React.ReactNode; color: string } => {
  if (!previous || previous === 0) {
    return {
      value: 0,
      icon: <Minus className="h-4 w-4 text-gray-500" />,
      color: "text-gray-500",
    };
  }
  const change = ((current - previous) / previous) * 100;

  if (change > 0) {
    return {
      value: change,
      icon: <TrendingUp className="h-4 w-4 text-green-600" />,
      color: "text-green-600",
    };
  }
  if (change < 0) {
    return {
      value: Math.abs(change),
      icon: <TrendingDown className="h-4 w-4 text-red-600" />,
      color: "text-red-600",
    };
  }
  return {
    value: 0,
    icon: <Minus className="h-4 w-4 text-gray-500" />,
    color: "text-gray-500",
  };
};

export function OverviewCards({ data }: OverviewCardsProps) {
  const impressionsTrend = calculateTrend(
    data.impressions,
    data.previousPeriod?.impressions || 0
  );
  const engagementTrend = calculateTrend(
    data.engagement,
    data.previousPeriod?.engagement || 0
  );
  const rateTrend = calculateTrend(
    data.engagementRate,
    data.previousPeriod?.engagementRate || 0
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {/* Total Impressions */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">
            Impressions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-gray-900 mb-1">
            {formatNumber(data.impressions)}
          </div>
          <div
            className={`text-xs flex items-center gap-1 ${impressionsTrend.color}`}
          >
            {impressionsTrend.icon}
            {impressionsTrend.value > 0 &&
              `${impressionsTrend.value.toFixed(1)}%`}
            {impressionsTrend.value === 0 && "No change"}
          </div>
        </CardContent>
      </Card>

      {/* Total Engagement */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">
            Engagement
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-gray-900 mb-1">
            {formatNumber(data.engagement)}
          </div>
          <div
            className={`text-xs flex items-center gap-1 ${engagementTrend.color}`}
          >
            {engagementTrend.icon}
            {engagementTrend.value > 0 &&
              `${engagementTrend.value.toFixed(1)}%`}
            {engagementTrend.value === 0 && "No change"}
          </div>
        </CardContent>
      </Card>

      {/* Average Engagement Rate */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">
            Avg. Rate
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-gray-900 mb-1">
            {formatPercentage(data.engagementRate)}
          </div>
          <div className={`text-xs flex items-center gap-1 ${rateTrend.color}`}>
            {rateTrend.icon}
            {rateTrend.value > 0 && `${rateTrend.value.toFixed(1)}%`}
            {rateTrend.value === 0 && "No change"}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
