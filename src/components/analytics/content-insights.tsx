"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Calendar, Archive, Clock } from "lucide-react";

interface ContentInsightsProps {
  postsByStatus: {
    published: number;
    scheduled: number;
    draft: number;
    archived: number;
  };
  avgImpressions: number;
  avgEngagementRate: number;
}

const formatNumber = (num: number): string => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(2) + "M";
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(2) + "K";
  }
  return num.toFixed(2).toString();
};

export function ContentInsights({
  postsByStatus,
  avgImpressions,
  avgEngagementRate,
}: ContentInsightsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Post Status Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-gray-600">
            Posts by Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-green-600" />
              <span className="text-sm text-gray-700">Published</span>
            </div>
            <span className="text-lg font-bold text-green-600">
              {postsByStatus.published}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-blue-600" />
              <span className="text-sm text-gray-700">Scheduled</span>
            </div>
            <span className="text-lg font-bold text-blue-600">
              {postsByStatus.scheduled}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-yellow-600" />
              <span className="text-sm text-gray-700">Draft</span>
            </div>
            <span className="text-lg font-bold text-yellow-600">
              {postsByStatus.draft}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Archive className="h-4 w-4 text-gray-600" />
              <span className="text-sm text-gray-700">Archived</span>
            </div>
            <span className="text-lg font-bold text-gray-600">
              {postsByStatus.archived}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Average Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-gray-600">
            Average Performance
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-700">Avg. Impressions</span>
            <span className="text-lg font-bold text-gray-900">
              {formatNumber(avgImpressions)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-700">Avg. Engagement Rate</span>
            <span className="text-lg font-bold text-gray-900">
              {formatNumber(avgEngagementRate * 100)}%
            </span>
          </div>
          <div className="pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-500 text-center">
              Average performance metrics per post
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
