"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { CardTitleWithIcon } from "@/components/ui/card-title-with-icon";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Trophy, Eye, ArrowUp, ArrowDown, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";

type SortColumn = "impressions" | "likes" | "comments" | "shares" | "engagementRate";
type SortDirection = "asc" | "desc";

interface TopPostsTableProps {
  posts: Array<{
    postId: number;
    linkedinPostId: string;
    excerpt: string;
    publishedAt: string;
    impressions: number;
    likes: number;
    comments: number;
    shares: number;
    engagementRate: number;
    organizationId: string | null;
    organizationName: string | null;
  }>;
  sortBy?: "impressions" | "engagement";
  title?: string;
  noCard?: boolean;
  sortColumn?: SortColumn;
  sortDirection?: SortDirection;
  loading?: boolean;
  onSortChange?: (column: SortColumn, direction: SortDirection) => void;
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

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

export function TopPostsTable({
  posts,
  sortBy,
  title,
  noCard = false,
  sortColumn = "impressions",
  sortDirection = "desc",
  loading = false,
  onSortChange,
}: TopPostsTableProps) {
  const router = useRouter();
  const defaultTitle =
    sortBy === "impressions"
      ? "Top Posts by Impressions"
      : sortBy === "engagement"
      ? "Top Posts by Engagement Rate"
      : "Top Posts";
  // Only use defaultTitle if title is undefined (not explicitly provided)
  // If title is empty string, don't show title
  const displayTitle = title !== undefined ? title : defaultTitle;
  
  // Use Eye icon for Impressions, Trophy for Top Posts
  const titleIcon = displayTitle === "Impressions" ? Eye : Trophy;

  const handleSort = (column: SortColumn) => {
    if (!onSortChange) return;
    
    if (sortColumn === column) {
      // Toggle direction if clicking the same column
      onSortChange(column, sortDirection === "asc" ? "desc" : "asc");
    } else {
      // Set new column and default to descending
      onSortChange(column, "desc");
    }
  };

  const SortableHeader = ({
    column,
    label,
  }: {
    column: SortColumn;
    label: string;
  }) => {
    const isActive = sortColumn === column;
    return (
      <TableHead
        className={`text-right ${onSortChange ? "cursor-pointer hover:bg-gray-100 transition-colors select-none" : ""}`}
        onClick={(e) => {
          e.stopPropagation();
          handleSort(column);
        }}
      >
        <div className="flex items-center justify-end gap-1">
          <span>{label}</span>
          {isActive ? (
            sortDirection === "asc" ? (
              <ArrowUp className="h-4 w-4" />
            ) : (
              <ArrowDown className="h-4 w-4" />
            )
          ) : (
            <div className="h-4 w-4 opacity-30">
              <ArrowUp className="h-4 w-4" />
            </div>
          )}
        </div>
      </TableHead>
    );
  };

  const tableContent =
    !posts || posts.length === 0 ? (
      <div className="text-center py-12">
        <p className="text-sm text-gray-500">
          No posts available for the selected period
        </p>
      </div>
    ) : (
      <div className="overflow-x-auto relative">
        {loading && (
          <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex items-center justify-center">
            <div className="flex items-center gap-2 text-gray-600">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span className="text-sm font-medium">Loading...</span>
            </div>
          </div>
        )}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[300px]">Post</TableHead>
              <TableHead className="w-[120px]">Context</TableHead>
              <SortableHeader column="impressions" label="Impressions" />
              <SortableHeader column="likes" label="Likes" />
              <SortableHeader column="comments" label="Comments" />
              <SortableHeader column="shares" label="Shares" />
              <SortableHeader column="engagementRate" label="Eng. Rate" />
              <TableHead className="text-right">Published</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {posts.map((post) => (
              <TableRow 
                key={post.postId} 
                className="hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => router.push(`/posts/${post.postId}`)}
              >
                <TableCell>
                  <div className="font-medium text-sm line-clamp-2">
                    {post.excerpt}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={post.organizationId ? "secondary" : "default"} className="text-xs">
                    {post.organizationName || "Personal"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right font-mono text-sm">
                  {formatNumber(post.impressions)}
                </TableCell>
                <TableCell className="text-right font-mono text-sm">
                  {formatNumber(post.likes)}
                </TableCell>
                <TableCell className="text-right font-mono text-sm">
                  {formatNumber(post.comments)}
                </TableCell>
                <TableCell className="text-right font-mono text-sm">
                  {formatNumber(post.shares)}
                </TableCell>
                <TableCell className="text-right font-mono text-sm">
                  {(post.engagementRate * 100).toFixed(2)}%
                </TableCell>
                <TableCell className="text-right text-sm text-gray-500">
                  {formatDate(post.publishedAt)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );

  if (noCard) {
    const IconComponent = titleIcon;
    return (
      <div>
        {displayTitle && (
          <div className="flex items-center gap-2 mb-4">
            <IconComponent className="h-5 w-5 text-blue-600" />
            <h3 className="text-2xl font-semibold leading-none tracking-tight">{displayTitle}</h3>
          </div>
        )}
        {tableContent}
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitleWithIcon
          icon={titleIcon}
          title={displayTitle}
        />
      </CardHeader>
      <CardContent>{tableContent}</CardContent>
    </Card>
  );
}
