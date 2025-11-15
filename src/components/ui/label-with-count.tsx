import * as React from "react";
import { cn } from "@/lib/utils";

export interface LabelWithCountProps
  extends React.HTMLAttributes<HTMLSpanElement> {
  label?: string; // Required when unit is not provided
  count: number;
  unit?: string; // Optional unit like "posts" - if provided, format will be "(count unit)" instead of "label (count)"
  countClassName?: string; // Optional custom className for the count
  labelClassName?: string; // Optional custom className for the label
}

/**
 * A reusable component for displaying a label with a count.
 * The count is displayed in a different color from the label.
 * 
 * @example
 * <LabelWithCount label="Published" count={5} />
 * // Renders: Published (5)
 * 
 * @example
 * <LabelWithCount count={10} unit="posts" />
 * // Renders: (10 posts)
 */
export function LabelWithCount({
  label,
  count,
  unit,
  countClassName,
  labelClassName,
  className,
  ...props
}: LabelWithCountProps) {
  // If unit is provided, render as "(count unit)" format
  if (unit) {
    return (
      <span className={cn("text-sm text-gray-500", className)} {...props}>
        (
        <span className={cn("text-gray-700 font-medium", countClassName)}>
          {count}
        </span>{" "}
        {unit})
      </span>
    );
  }

  // If no label is provided, render as just "(count)" format
  if (!label) {
    return (
      <span className={cn("text-xs text-gray-500", className)} {...props}>
        (
        <span className={cn("text-gray-500", countClassName)}>
          {count}
        </span>
        )
      </span>
    );
  }

  // Otherwise, render as "label (count)" format
  return (
    <span className={cn("text-xl font-semibold text-gray-900", className)} {...props}>
      <span className={cn("text-gray-900", labelClassName)}>{label}</span>{" "}
      <span className={cn("text-gray-500 font-normal", countClassName)}>
        ({count})
      </span>
    </span>
  );
}

