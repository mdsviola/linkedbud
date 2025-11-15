import type { HeroStat } from "@/marketing/types/marketing";

// StatsGrid renders a compact list of hero metrics and labels.
type StatsGridProps = {
  stats: HeroStat[];
};

export function StatsGrid({ stats }: StatsGridProps) {
  return (
    <dl className="grid grid-cols-2 gap-6 sm:flex sm:flex-wrap sm:gap-10">
      {stats.map((stat) => (
        <div key={stat.label} className="space-y-1">
          <dt className="text-sm font-medium text-slate-600 dark:text-slate-400">{stat.label}</dt>
          <dd className="text-2xl font-semibold text-slate-900 dark:text-white">{stat.value}</dd>
        </div>
      ))}
    </dl>
  );
}

