import type { LucideIcon } from "lucide-react";

// FeatureCard displays an icon, title, and description with hover affordances.
type FeatureCardProps = {
  icon: LucideIcon;
  title: string;
  description: string;
};

export function FeatureCard({ icon: Icon, title, description }: FeatureCardProps) {
  return (
    <div className="group relative overflow-hidden rounded-lg border border-slate-200 bg-white p-8 shadow-sm transition duration-300 hover:border-slate-300 hover:shadow dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700">
      <Icon className="h-10 w-10 text-blue-600 dark:text-blue-500" />
      <h3 className="mt-5 text-xl font-semibold text-slate-900 dark:text-white">{title}</h3>
      <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">{description}</p>
    </div>
  );
}

