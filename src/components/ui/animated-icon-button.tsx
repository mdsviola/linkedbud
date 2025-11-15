"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface AnimatedIconButtonProps {
  icon: ReactNode;
  text: string;
  onClick: () => void;
  disabled?: boolean;
  variant?:
    | "default"
    | "destructive"
    | "outline"
    | "secondary"
    | "ghost"
    | "link";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
}

export function AnimatedIconButton({
  icon,
  text,
  onClick,
  disabled = false,
  variant = "outline",
  size = "sm",
  className,
}: AnimatedIconButtonProps) {
  return (
    <div className="relative group">
      <Button
        variant={variant}
        size={size}
        onClick={onClick}
        disabled={disabled}
        className={cn(
          "flex items-center justify-center p-2 transition-all duration-200",
          "hover:scale-105 active:scale-95",
          className
        )}
      >
        {icon}
      </Button>

      {/* Animated tooltip text */}
      <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 z-50">
        <div className="bg-gray-900 text-white text-xs px-2 py-1 rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
          {text}
          {/* Arrow pointing down */}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-2 border-r-2 border-t-2 border-transparent border-t-gray-900"></div>
        </div>
      </div>
    </div>
  );
}
