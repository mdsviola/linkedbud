import type { InsightCard as InsightCardType } from "@/marketing/types/marketing";

// InsightCard pairs a metric with supporting narrative copy.
type InsightCardProps = InsightCardType;

export function InsightCard({
  title,
  metric,
  metricLabel,
  description,
}: InsightCardProps) {
  return (
    <div className="group relative overflow-hidden rounded-lg border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 min-w-0 hover:shadow transition">
      <div className="space-y-3 min-w-0">
        <p className="text-sm font-medium uppercase tracking-wide text-blue-600 dark:text-blue-400">
          {title}
        </p>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-3xl font-semibold text-slate-900 dark:text-white">
            {metric}
          </span>
          <span className="text-xs uppercase tracking-wide text-slate-600 dark:text-slate-400">
            {metricLabel}
          </span>
        </div>
        <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300 break-words">
          {description}
        </p>
      </div>
    </div>
  );
}
