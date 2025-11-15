"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { CardTitleWithIcon } from "@/components/ui/card-title-with-icon";
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
import { BarChart3 } from "lucide-react";

interface TimeSeriesChartProps {
  data: {
    date: string;
    impressions: number;
    likes: number;
    comments: number;
    shares: number;
  }[];
}

export function TimeSeriesChart({ data }: TimeSeriesChartProps) {
  const [hiddenLines, setHiddenLines] = useState<Set<string>>(new Set());

  const toggleLine = (dataKey: string) => {
    setHiddenLines((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(dataKey)) {
        newSet.delete(dataKey);
      } else {
        newSet.add(dataKey);
      }
      return newSet;
    });
  };

  const renderCustomLegend = (props: any) => {
    const { payload } = props;
    if (!payload) return null;

    return (
      <div className="flex flex-wrap justify-center gap-4 mt-4">
        {payload.map((entry: any, index: number) => {
          const isHidden = hiddenLines.has(entry.dataKey);
          return (
            <div
              key={`legend-${index}`}
              onClick={() => toggleLine(entry.dataKey)}
              className="flex items-center gap-2 cursor-pointer opacity-60 hover:opacity-100 transition-opacity"
              style={{ opacity: isHidden ? 0.3 : 1 }}
            >
              <span
                className="inline-block w-3 h-3 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-sm">{entry.value}</span>
            </div>
          );
        })}
      </div>
    );
  };

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitleWithIcon
            icon={BarChart3}
            title="Impressions Over Time"
          />
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center">
            <p className="text-sm text-gray-500">
              No data available for the selected period
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Format dates for better display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  // Transform data to include formatted dates
  const chartData = data.map((item) => ({
    ...item,
    formattedDate: formatDate(item.date),
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitleWithIcon
          icon={BarChart3}
          title="Impressions Over Time"
        />
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="formattedDate"
              stroke="#6b7280"
              tick={{ fontSize: 12 }}
              angle={-45}
              textAnchor="end"
              height={60}
            />
            <YAxis stroke="#6b7280" tick={{ fontSize: 12 }} />
            <Tooltip
              contentStyle={{
                backgroundColor: "#ffffff",
                border: "1px solid #e5e7eb",
                borderRadius: "8px",
              }}
            />
            <Legend content={renderCustomLegend} />
            <Line
              type="monotone"
              dataKey="impressions"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={{ fill: "#3b82f6", r: 4 }}
              name="Impressions"
              hide={hiddenLines.has("impressions")}
            />
            <Line
              type="monotone"
              dataKey="likes"
              stroke="#10b981"
              strokeWidth={2}
              dot={{ fill: "#10b981", r: 4 }}
              name="Likes"
              hide={hiddenLines.has("likes")}
            />
            <Line
              type="monotone"
              dataKey="comments"
              stroke="#f59e0b"
              strokeWidth={2}
              dot={{ fill: "#f59e0b", r: 4 }}
              name="Comments"
              hide={hiddenLines.has("comments")}
            />
            <Line
              type="monotone"
              dataKey="shares"
              stroke="#8b5cf6"
              strokeWidth={2}
              dot={{ fill: "#8b5cf6", r: 4 }}
              name="Shares"
              hide={hiddenLines.has("shares")}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
