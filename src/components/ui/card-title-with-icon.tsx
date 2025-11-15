import * as React from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface CardTitleWithIconProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: LucideIcon;
  title: string;
  description?: string;
  iconClassName?: string;
  titleClassName?: string;
  descriptionClassName?: string;
}

export const CardTitleWithIcon = React.forwardRef<HTMLDivElement, CardTitleWithIconProps>(
  (
    {
      icon: Icon,
      title,
      description,
      iconClassName,
      titleClassName,
      descriptionClassName,
      className,
      ...props
    },
    ref
  ) => {
    return (
      <div ref={ref} className={cn("space-y-1.5", className)} {...props}>
        <div className="flex items-center gap-2">
          {Icon && (
            <Icon
              className={cn(
                "h-5 w-5 text-blue-600 dark:text-blue-500",
                iconClassName
              )}
            />
          )}
          <h3
            className={cn(
              "text-2xl font-semibold leading-none tracking-tight text-slate-900 dark:text-white",
              titleClassName
            )}
          >
            {title}
          </h3>
        </div>
        {description && (
          <p
            className={cn(
              "text-sm text-muted-foreground text-slate-600 dark:text-slate-300",
              descriptionClassName
            )}
          >
            {description}
          </p>
        )}
      </div>
    );
  }
);

CardTitleWithIcon.displayName = "CardTitleWithIcon";

