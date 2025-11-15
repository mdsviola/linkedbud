import { AccordionItem } from "@/components/ui/accordion";

import type { FAQItemData } from "@/marketing/types/marketing";

// FAQItem wraps the shared accordion item styling for marketing FAQs.
type FAQItemProps = FAQItemData & {
  defaultOpen?: boolean;
};

export function FAQItem({ question, answer, defaultOpen = false }: FAQItemProps) {
  return (
    <AccordionItem
      title={question}
      defaultOpen={defaultOpen}
      className="rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900"
    >
      <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">{answer}</p>
    </AccordionItem>
  );
}

