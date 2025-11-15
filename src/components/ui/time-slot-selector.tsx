"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface TimeSlotSelectorProps {
  value: string; // Format: "HH:MM"
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
}

export function TimeSlotSelector({
  value,
  onChange,
  disabled = false,
  className,
}: TimeSlotSelectorProps) {
  // Generate 30-minute time slots
  const timeSlots = React.useMemo(() => {
    const slots = [];
    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const timeString = `${hour.toString().padStart(2, "0")}:${minute
          .toString()
          .padStart(2, "0")}`;
        const displayTime = new Date(
          `2000-01-01T${timeString}`
        ).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        });
        slots.push({
          value: timeString,
          display: displayTime,
        });
      }
    }
    return slots;
  }, []);

  return (
    <div className={cn("relative", className)}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
      >
        <option value="">Select time</option>
        {timeSlots.map((slot) => (
          <option key={slot.value} value={slot.value}>
            {slot.display}
          </option>
        ))}
      </select>
    </div>
  );
}
