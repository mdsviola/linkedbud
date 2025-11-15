import { ReactNode } from "react";

interface PageWrapperProps {
  children: ReactNode;
  className?: string;
  maxWidth?: "4xl" | "6xl" | "full";
  padding?: "sm" | "md" | "lg" | "xl";
}

export function PageWrapper({
  children,
  className = "",
  maxWidth = "6xl",
  padding = "md",
}: PageWrapperProps) {
  const maxWidthClasses = {
    "4xl": "max-w-4xl",
    "6xl": "max-w-6xl",
    full: "max-w-full",
  };

  const paddingClasses = {
    sm: "p-3",
    md: "p-6",
    lg: "p-8",
    xl: "p-12",
  };

  return (
    <div className={`${paddingClasses[padding]} ${className}`}>
      <div className={`${maxWidthClasses[maxWidth]} mx-auto`}>{children}</div>
    </div>
  );
}
