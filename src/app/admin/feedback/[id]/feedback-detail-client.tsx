"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BackButton } from "@/components/ui/back-button";
import {
  Loader2,
  Image as ImageIcon,
  Calendar,
  User,
  ExternalLink,
  MessageSquare,
  ChevronDown,
} from "lucide-react";
import { formatDateTimeLong } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

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

interface FeedbackDetailResponse {
  feedback: FeedbackSubmission;
}

export function FeedbackDetailClient({ feedbackId }: { feedbackId: string }) {
  const [feedback, setFeedback] = useState<FeedbackSubmission | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const [imageError, setImageError] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchFeedback = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch(`/api/admin/feedback/${feedbackId}`);

        if (!response.ok) {
          if (response.status === 404) {
            setError("Feedback not found");
          } else {
            setError("Failed to load feedback");
          }
          return;
        }

        const data: FeedbackDetailResponse = await response.json();
        setFeedback(data.feedback);
      } catch (err) {
        console.error("Error fetching feedback:", err);
        setError("Failed to load feedback");
      } finally {
        setLoading(false);
      }
    };

    fetchFeedback();
  }, [feedbackId]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setStatusDropdownOpen(false);
      }
    };

    if (statusDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [statusDropdownOpen]);

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

  const handleStatusUpdate = async (
    newStatus: "new" | "reviewed" | "resolved"
  ) => {
    if (!feedback || feedback.status === newStatus) {
      setStatusDropdownOpen(false);
      return;
    }

    try {
      setUpdatingStatus(true);
      setStatusDropdownOpen(false);

      const response = await fetch(`/api/admin/feedback/${feedbackId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update status");
      }

      const data: FeedbackDetailResponse = await response.json();
      setFeedback(data.feedback);

      toast({
        title: "Status updated successfully",
        description: `Feedback status has been changed to ${newStatus}`,
      });
    } catch (err) {
      console.error("Error updating status:", err);
      toast({
        title: "Failed to update status",
        description:
          err instanceof Error
            ? err.message
            : "An error occurred while updating the status",
        variant: "destructive",
      });
    } finally {
      setUpdatingStatus(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (error || !feedback) {
    return (
      <>
        <div className="mb-6">
          <BackButton href="/admin/feedback">Back to Feedback List</BackButton>
        </div>
        <Card>
          <CardContent className="p-8 text-center">
            <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">{error || "Feedback not found"}</p>
          </CardContent>
        </Card>
      </>
    );
  }

  return (
    <>
      {/* Back button positioned above the content */}
      <div className="mb-6">
        <BackButton href="/admin/feedback">Back to Feedback List</BackButton>
      </div>

      <div className="space-y-6">
        {/* Feedback Details */}
        <Card>
          <CardContent className="p-6 space-y-6">
            {/* Metadata */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Email:</span>
                <span className="ml-2 text-gray-900 font-medium">
                  {feedback.email}
                </span>
              </div>
              <div>
                <span className="text-gray-500">Type:</span>
                <Badge className={`ml-2 ${getTypeColor(feedback.type)}`}>
                  {feedback.type}
                </Badge>
              </div>
              <div className="md:col-span-2">
                <span className="text-gray-500">Status:</span>
                <div className="flex items-center gap-3 mt-2">
                  <Badge className={getStatusColor(feedback.status)}>
                    {feedback.status}
                  </Badge>
                  <div className="relative" ref={dropdownRef}>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setStatusDropdownOpen(!statusDropdownOpen)}
                      disabled={updatingStatus}
                    >
                      {updatingStatus ? (
                        <>
                          <Loader2 className="h-3 w-3 mr-1.5 animate-spin" />
                          Updating...
                        </>
                      ) : (
                        <>
                          Update status
                          <ChevronDown className="h-3 w-3 ml-1.5" />
                        </>
                      )}
                    </Button>

                    {/* Dropdown Menu */}
                    {statusDropdownOpen && !updatingStatus && (
                      <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-10">
                        <div className="py-1">
                          <button
                            onClick={() => handleStatusUpdate("new")}
                            className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center gap-2 ${
                              feedback.status === "new"
                                ? "bg-blue-50 text-blue-700 font-medium"
                                : "text-gray-700"
                            }`}
                          >
                            <div className="h-2 w-2 rounded-full bg-blue-500" />
                            New
                          </button>
                          <button
                            onClick={() => handleStatusUpdate("reviewed")}
                            className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center gap-2 ${
                              feedback.status === "reviewed"
                                ? "bg-yellow-50 text-yellow-700 font-medium"
                                : "text-gray-700"
                            }`}
                          >
                            <div className="h-2 w-2 rounded-full bg-yellow-500" />
                            Reviewed
                          </button>
                          <button
                            onClick={() => handleStatusUpdate("resolved")}
                            className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center gap-2 ${
                              feedback.status === "resolved"
                                ? "bg-green-50 text-green-700 font-medium"
                                : "text-gray-700"
                            }`}
                          >
                            <div className="h-2 w-2 rounded-full bg-green-500" />
                            Resolved
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div>
                <span className="text-gray-500">Submitted:</span>
                <span className="ml-2 text-gray-900">
                  {formatDateTimeLong(feedback.created_at)}
                </span>
              </div>
              <div className="md:col-span-2">
                <span className="text-gray-500">User ID:</span>
                <span className="ml-2 font-mono text-xs text-gray-900">
                  {feedback.user_id}
                </span>
              </div>
            </div>

            {/* Message */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Message
              </h4>
              <p className="text-gray-900 whitespace-pre-wrap bg-gray-50 p-4 rounded-lg">
                {feedback.message}
              </p>
            </div>

            {/* Screenshot */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <ImageIcon className="h-4 w-4" />
                Screenshot
              </h4>
              {feedback.screenshot_url ? (
                <div className="relative">
                  {imageError ? (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-sm text-red-600">
                        Failed to load screenshot
                      </p>
                      <p className="text-xs text-red-500 mt-1">
                        URL: {feedback.screenshot_url}
                      </p>
                    </div>
                  ) : (
                    <div
                      className="relative w-full"
                      style={{ minHeight: "200px", maxHeight: "600px" }}
                    >
                      <Image
                        src={feedback.screenshot_url}
                        alt="Feedback screenshot"
                        fill
                        className="rounded-lg border border-gray-200 object-contain"
                        unoptimized
                        onError={() => {
                          console.error(
                            "Error loading screenshot:",
                            feedback.screenshot_url
                          );
                          setImageError(true);
                        }}
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        className="absolute top-2 right-2"
                        onClick={() =>
                          window.open(feedback.screenshot_url!, "_blank")
                        }
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Open in New Tab
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No screenshot provided</p>
              )}
            </div>

            {/* Device Information */}
            {feedback.device_info && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Device Information
                </h4>
                <pre className="p-4 bg-gray-50 rounded-lg text-xs overflow-x-auto">
                  {JSON.stringify(feedback.device_info, null, 2)}
                </pre>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
