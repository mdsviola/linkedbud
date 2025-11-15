"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DatePicker } from "@/components/ui/date-picker";
import { toast } from "@/hooks/use-toast";
import { TimeSlotSelector } from "@/components/ui/time-slot-selector";
import { Calendar, Clock } from "lucide-react";

interface SchedulePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSchedule: (scheduledDate: string, publishTarget: string) => Promise<void>;
  currentScheduledDate?: string | null;
  currentPublishTarget?: string | null;
  organizations?: Array<{ linkedin_org_id: string; org_name: string | null }>;
  isSubmitting?: boolean;
  error?: string;
}

export function SchedulePostModal({
  isOpen,
  onClose,
  onSchedule,
  currentScheduledDate,
  currentPublishTarget,
  organizations = [],
  isSubmitting = false,
  error,
}: SchedulePostModalProps) {
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [publishTarget, setPublishTarget] = useState("personal");
  const [validationError, setValidationError] = useState("");

  // Show toast when error prop changes
  useEffect(() => {
    if (error) {
      toast({
        title: "Scheduling Error",
        description: error,
        variant: "destructive",
      });
    }
  }, [error]);

  // Show toast when validation error occurs
  useEffect(() => {
    if (validationError) {
      toast({
        title: "Validation Error",
        description: validationError,
        variant: "destructive",
      });
    }
  }, [validationError]);

  // Convert UTC date to local date and time format and set publish target
  useEffect(() => {
    if (currentScheduledDate) {
      const utcDate = new Date(currentScheduledDate);
      // Convert to local timezone
      const year = utcDate.getFullYear();
      const month = String(utcDate.getMonth() + 1).padStart(2, "0");
      const day = String(utcDate.getDate()).padStart(2, "0");
      const hours = String(utcDate.getHours()).padStart(2, "0");
      const minutes = String(utcDate.getMinutes()).padStart(2, "0");

      setSelectedDate(`${year}-${month}-${day}`);
      setSelectedTime(`${hours}:${minutes}`);
    } else {
      // Default to 1 hour from now
      const oneHourFromNow = new Date(Date.now() + 60 * 60 * 1000);
      const year = oneHourFromNow.getFullYear();
      const month = String(oneHourFromNow.getMonth() + 1).padStart(2, "0");
      const day = String(oneHourFromNow.getDate()).padStart(2, "0");
      const hours = oneHourFromNow.getHours();
      const minutes = oneHourFromNow.getMinutes();

      // Round to nearest 30-minute slot
      const roundedMinutes = Math.round(minutes / 30) * 30;
      const adjustedHours = roundedMinutes === 60 ? hours + 1 : hours;
      const finalHours = adjustedHours >= 24 ? 0 : adjustedHours;
      const finalMinutes = roundedMinutes === 60 ? 0 : roundedMinutes;

      setSelectedDate(`${year}-${month}-${day}`);
      setSelectedTime(
        `${String(finalHours).padStart(2, "0")}:${String(finalMinutes).padStart(
          2,
          "0"
        )}`
      );
    }

    // Set publish target from current value or default to personal
    if (currentPublishTarget) {
      setPublishTarget(currentPublishTarget);
    } else {
      setPublishTarget("personal");
    }
  }, [currentScheduledDate, currentPublishTarget, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError("");

    if (!selectedDate || !selectedTime) {
      setValidationError("Please select both a date and time");
      return;
    }

    // Combine date and time into a datetime string
    const localDateTime = `${selectedDate}T${selectedTime}`;
    const selectedDateTime = new Date(localDateTime);
    const now = new Date();

    if (selectedDateTime <= now) {
      setValidationError("Scheduled date must be in the future");
      return;
    }

    // Convert local time to UTC
    const utcIsoString = selectedDateTime.toISOString();

    try {
      await onSchedule(utcIsoString, publishTarget);
    } catch (err) {
      // Error handling is done in the parent component
      console.error("Failed to schedule post:", err);
    }
  };

  const handleClearSchedule = async () => {
    try {
      await onSchedule("", "personal"); // Empty string to clear the schedule
    } catch (err) {
      console.error("Failed to clear schedule:", err);
    }
  };

  const formatDisplayDate = (utcDateString: string) => {
    const date = new Date(utcDateString);
    return date.toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZoneName: "short",
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Schedule Post
          </DialogTitle>
          <DialogDescription>
            Choose when you want this post to be published. The post will
            automatically be published at the scheduled time.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {currentScheduledDate && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-sm text-blue-800">
                <strong>Currently scheduled for:</strong>{" "}
                {formatDisplayDate(currentScheduledDate)}
              </p>
            </div>
          )}

          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="scheduled-date" className="text-sm font-medium">
                Scheduled Date
              </label>
              <DatePicker
                value={selectedDate}
                onChange={setSelectedDate}
                min={new Date().toISOString().slice(0, 10)}
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="scheduled-time" className="text-sm font-medium">
                Scheduled Time
              </label>
              <TimeSlotSelector
                value={selectedTime}
                onChange={setSelectedTime}
                disabled={isSubmitting}
              />
            </div>

            {validationError && (
              <p className="text-sm text-red-600">{validationError}</p>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="publish-target" className="text-sm font-medium">
              Publish to Account
            </label>
            <select
              id="publish-target"
              value={publishTarget}
              onChange={(e) => setPublishTarget(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isSubmitting}
            >
              <option value="personal">Personal Profile</option>
              {organizations.map((org) => (
                <option key={org.linkedin_org_id} value={org.linkedin_org_id}>
                  {org.org_name || `Organization ${org.linkedin_org_id}`}
                </option>
              ))}
            </select>
          </div>

          <DialogFooter className="flex gap-2">
            {currentScheduledDate && (
              <Button
                type="button"
                variant="outline"
                onClick={handleClearSchedule}
                disabled={isSubmitting}
                className="text-red-600 hover:text-red-700"
              >
                Clear Schedule
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !selectedDate || !selectedTime}
            >
              {isSubmitting ? "Scheduling..." : "Schedule Post"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
