"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface DatePickerProps {
  value: string; // Format: "YYYY-MM-DD"
  onChange: (value: string) => void;
  min?: string; // Format: "YYYY-MM-DD"
  max?: string; // Format: "YYYY-MM-DD"
  disabled?: boolean;
  className?: string;
}

export function DatePicker({
  value,
  onChange,
  min,
  max,
  disabled = false,
  className,
}: DatePickerProps) {
  return (
    <div className={cn("relative", className)}>
      <input
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        min={min}
        max={max}
        disabled={disabled}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
      />
    </div>
  );
}
