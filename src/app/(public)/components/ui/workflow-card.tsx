import type { WorkflowStep } from "@/marketing/types/marketing";

// WorkflowCard outlines one stage of the linkedbud operating rhythm.
type WorkflowCardProps = WorkflowStep & {
  index: number;
};

export function WorkflowCard({ accent, title, description, index }: WorkflowCardProps) {
  return (
    <div className="group relative overflow-hidden rounded-lg border border-slate-200 bg-white p-8 shadow-sm transition hover:border-slate-300 hover:shadow dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center gap-4 text-sm font-semibold uppercase tracking-wide text-blue-600 dark:text-blue-400">
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-blue-200 bg-blue-50 text-blue-600 dark:border-slate-700 dark:bg-slate-800 dark:text-blue-400">
          {String(index + 1).padStart(2, "0")}
        </span>
        {accent}
      </div>
      <h3 className="mt-4 text-2xl font-semibold text-slate-900 dark:text-white">{title}</h3>
      <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">{description}</p>
    </div>
  );
}

