"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { CardTitleWithIcon } from "@/components/ui/card-title-with-icon";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";
import { PieChart as PieChartIcon } from "lucide-react";

interface EngagementBreakdownProps {
  likes: number;
  comments: number;
  shares: number;
}

const COLORS = ["#3b82f6", "#10b981", "#f59e0b"];

export function EngagementBreakdown({
  likes,
  comments,
  shares,
}: EngagementBreakdownProps) {
  const data = [
    { name: "Likes", value: likes },
    { name: "Comments", value: comments },
    { name: "Shares", value: shares },
  ];

  const totalEngagement = likes + comments + shares;

  const renderCustomLegend = (props: any) => {
    const { payload } = props;
    if (!payload) return null;

    return (
      <div className="flex flex-wrap justify-center gap-4 mt-4">
        {payload.map((entry: any, index: number) => (
          <div
            key={`legend-${index}`}
            className="flex items-center gap-2"
          >
            <span
              className="inline-block w-3 h-3 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-sm">{entry.value}</span>
          </div>
        ))}
      </div>
    );
  };

  if (totalEngagement === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitleWithIcon
            icon={PieChartIcon}
            title="Engagement Breakdown"
          />
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center">
            <p className="text-sm text-gray-500">
              No engagement data available
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
          icon={PieChartIcon}
          title="Engagement Breakdown"
        />
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={(props: any) =>
                `${props.name}: ${(props.percent * 100).toFixed(0)}%`
              }
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip />
            <Legend content={renderCustomLegend} />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
