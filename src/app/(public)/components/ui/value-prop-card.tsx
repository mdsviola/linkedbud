import type { PricingValueProp } from "@/marketing/types/marketing";

// ValuePropCard communicates supporting pricing guarantees.
type ValuePropCardProps = PricingValueProp;

export function ValuePropCard({ title, description }: ValuePropCardProps) {
  return (
    <div className="space-y-3 text-left">
      <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{title}</h3>
      <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">{description}</p>
    </div>
  );
}

