"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Loader2,
  Search,
  MessageSquare,
  Image as ImageIcon,
  Calendar,
  ChevronRight,
  AlertCircle,
  Lightbulb,
  MoreHorizontal,
} from "lucide-react";
import { formatDateTime } from "@/lib/utils";
import { useDebounce } from "@/hooks/useDebounce";

interface FeedbackSubmission {
  id: number;
  user_id: string;
  email: string;
  type: "issue" | "idea" | "other";
  message: string;
  screenshot_url: string | null;
  device_info: Record<string, any> | null;
  status: "new" | "reviewed" | "resolved";
  created_at: string;
  updated_at: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface FeedbackResponse {
  feedback: FeedbackSubmission[];
  pagination: Pagination;
}

export function FeedbackClient() {
  const [feedback, setFeedback] = useState<FeedbackSubmission[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("new");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  // Debounce search term for server-side search
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  const fetchFeedback = useCallback(
    async (page = 1, append = false) => {
      try {
        setLoading(true);
        const params = new URLSearchParams({
          page: page.toString(),
          limit: "20",
        });

        if (statusFilter !== "all") {
          params.append("status", statusFilter);
        }
        if (typeFilter !== "all") {
          params.append("type", typeFilter);
        }
        if (debouncedSearchTerm) {
          params.append("search", debouncedSearchTerm);
        }

        const response = await fetch(
          `/api/admin/feedback?${params.toString()}`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch feedback");
        }

        const data: FeedbackResponse = await response.json();
        if (append) {
          setFeedback((prev) => [...prev, ...data.feedback]);
        } else {
          setFeedback(data.feedback);
        }
        setPagination(data.pagination);
      } catch (error) {
        console.error("Error fetching feedback:", error);
      } finally {
        setLoading(false);
      }
    },
    [statusFilter, typeFilter, debouncedSearchTerm]
  );

  // Fetch feedback when filters change
  useEffect(() => {
    setPagination((prev) => ({ ...prev, page: 1 }));
    fetchFeedback(1, false);
  }, [fetchFeedback]);

  const handleLoadMore = () => {
    if (pagination.page < pagination.totalPages && !loading) {
      fetchFeedback(pagination.page + 1, true);
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "issue":
        return "bg-red-100 text-red-800";
      case "idea":
        return "bg-purple-100 text-purple-800";
      case "other":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "new":
        return "bg-blue-100 text-blue-800";
      case "reviewed":
        return "bg-yellow-100 text-yellow-800";
      case "resolved":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "issue":
        return AlertCircle;
      case "idea":
        return Lightbulb;
      case "other":
        return MoreHorizontal;
      default:
        return MoreHorizontal;
    }
  };

  const getMessageSnippet = (message: string, maxLength: number = 150) => {
    if (message.length <= maxLength) return message;
    return message.substring(0, maxLength).trim() + "...";
  };

  if (loading && feedback.length === 0) {
    return (
      <div className="animate-pulse">
        {/* Filters Skeleton */}
        <div className="flex flex-col gap-4 mb-6">
          <div className="h-10 bg-gray-200 rounded w-full max-w-md"></div>
          <div className="flex flex-col gap-2">
            <div className="h-5 bg-gray-200 rounded w-32"></div>
            <div className="flex gap-2">
              <div className="h-8 bg-gray-200 rounded w-16"></div>
              <div className="h-8 bg-gray-200 rounded w-20"></div>
              <div className="h-8 bg-gray-200 rounded w-24"></div>
              <div className="h-8 bg-gray-200 rounded w-24"></div>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <div className="h-5 bg-gray-200 rounded w-24"></div>
            <div className="flex gap-2">
              <div className="h-8 bg-gray-200 rounded w-16"></div>
              <div className="h-8 bg-gray-200 rounded w-20"></div>
              <div className="h-8 bg-gray-200 rounded w-20"></div>
              <div className="h-8 bg-gray-200 rounded w-20"></div>
            </div>
          </div>
        </div>
        {/* Feedback List Skeleton */}
        <div className="grid gap-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-20 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Filters */}
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search by email, message, or user ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
          <div className="flex flex-col gap-2 flex-1">
            <div className="text-sm font-medium text-gray-700">Status</div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={statusFilter === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter("all")}
              >
                All
              </Button>
              <Button
                variant={statusFilter === "new" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter("new")}
              >
                New
              </Button>
              <Button
                variant={statusFilter === "reviewed" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter("reviewed")}
              >
                Reviewed
              </Button>
              <Button
                variant={statusFilter === "resolved" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter("resolved")}
              >
                Resolved
              </Button>
            </div>
          </div>
          <div className="flex flex-col gap-2 flex-1">
            <div className="text-sm font-medium text-gray-700">Type</div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={typeFilter === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setTypeFilter("all")}
              >
                All
              </Button>
              <Button
                variant={typeFilter === "issue" ? "default" : "outline"}
                size="sm"
                onClick={() => setTypeFilter("issue")}
              >
                <div className="h-2 w-2 rounded-full bg-red-500 mr-1.5" />
                Issue
              </Button>
              <Button
                variant={typeFilter === "idea" ? "default" : "outline"}
                size="sm"
                onClick={() => setTypeFilter("idea")}
              >
                <div className="h-2 w-2 rounded-full bg-purple-500 mr-1.5" />
                Idea
              </Button>
              <Button
                variant={typeFilter === "other" ? "default" : "outline"}
                size="sm"
                onClick={() => setTypeFilter("other")}
              >
                <div className="h-2 w-2 rounded-full bg-gray-500 mr-1.5" />
                Other
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="text-sm text-gray-600 mb-4">
        Showing {feedback.length} of {pagination.total} feedback submissions
      </div>

      {/* Feedback List */}
      <div className="grid gap-3">
        {feedback.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No feedback submissions found</p>
            </CardContent>
          </Card>
        ) : (
          feedback.map((item) => (
            <Link key={item.id} href={`/admin/feedback/${item.id}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <div
                          className={`h-2 w-2 rounded-full flex-shrink-0 ${
                            item.type === "issue"
                              ? "bg-red-500"
                              : item.type === "idea"
                              ? "bg-purple-500"
                              : "bg-gray-500"
                          }`}
                        />
                        <span className="font-medium text-gray-900 truncate">
                          {item.email}
                        </span>
                        <Badge className={getTypeColor(item.type)}>
                          {(() => {
                            const Icon = getTypeIcon(item.type);
                            return (
                              <>
                                <Icon className="h-3 w-3 mr-1" />
                                {item.type}
                              </>
                            );
                          })()}
                        </Badge>
                        <Badge className={getStatusColor(item.status)}>
                          {item.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">
                        {getMessageSnippet(item.message)}
                      </p>
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Calendar className="h-3 w-3" />
                        <span>{formatDateTime(item.created_at)}</span>
                        {item.screenshot_url && (
                          <>
                            <span className="mx-1">•</span>
                            <ImageIcon className="h-3 w-3" />
                            <span>Screenshot</span>
                          </>
                        )}
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-gray-400 flex-shrink-0" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))
        )}
      </div>

      {/* Load More Button */}
      {pagination.page < pagination.totalPages && (
        <div className="flex justify-center mt-6">
          <Button onClick={handleLoadMore} disabled={loading} variant="outline">
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Loading...
              </>
            ) : (
              "Load More"
            )}
          </Button>
        </div>
      )}
    </>
  );
}
