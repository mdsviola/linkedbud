import type { Testimonial } from "@/marketing/types/marketing";

// TestimonialCard renders a quote with author attribution.
type TestimonialCardProps = Testimonial;

export function TestimonialCard({ quote, author, role }: TestimonialCardProps) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-8 text-sm text-slate-600 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
      <p className="font-semibold text-slate-800 dark:text-white">“{quote}”</p>
      <p className="mt-4 text-xs uppercase tracking-wide text-slate-600 dark:text-slate-400">
        {author} • {role}
      </p>
    </div>
  );
}

