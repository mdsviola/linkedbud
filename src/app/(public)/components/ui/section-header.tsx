import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

// SectionHeader standardises headings, optional eyebrows, and descriptions across sections.
type SectionHeaderProps = {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  align?: "left" | "center";
  badgeClassName?: string;
  className?: string;
  as?: "h1" | "h2" | "h3" | "h4";
};

export function SectionHeader({
  eyebrow,
  title,
  description,
  align = "left",
  badgeClassName,
  className,
  as = "h2",
}: SectionHeaderProps) {
  const HeadingTag = as;
  return (
    <div
      className={cn(
        "space-y-4",
        align === "center" && "mx-auto text-center",
        align === "center" ? "max-w-3xl" : "max-w-3xl lg:max-w-none",
        className,
      )}
    >
      {eyebrow ? (
        <span
          className={cn(
            "inline-flex w-fit rounded-md border border-slate-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300",
            badgeClassName,
          )}
        >
          {eyebrow}
        </span>
      ) : null}
      <HeadingTag className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
        {title}
      </HeadingTag>
      {description ? (
        <p className="text-base leading-relaxed text-slate-600 dark:text-slate-300">{description}</p>
      ) : null}
    </div>
  );
}

