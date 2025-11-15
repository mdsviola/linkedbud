import type { HTMLAttributes, ReactNode } from "react";

import { cn } from "@/lib/utils";

// Container constrains content width and applies consistent horizontal padding.
type ContainerWidth = "default" | "narrow" | "wide";

const widthMap: Record<ContainerWidth, string> = {
  narrow: "max-w-3xl",
  default: "max-w-6xl",
  wide: "max-w-7xl",
};

type ContainerProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  width?: ContainerWidth;
};

export function Container({
  children,
  className,
  width = "default",
  ...props
}: ContainerProps) {
  return (
    <div
      className={cn("mx-auto px-6 lg:px-8", widthMap[width], className)}
      {...props}
    >
      {children}
    </div>
  );
}

