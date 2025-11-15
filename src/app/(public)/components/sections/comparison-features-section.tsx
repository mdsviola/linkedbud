"use client";

import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { Check, X } from "lucide-react";
import { Container } from "@/marketing/components/common";
import { SectionHeader } from "@/marketing/components/ui";
import type { CompetitorData } from "@/marketing/data/comparisons";
import { fadeInUp } from "@/lib/motion-variants";
import { cn } from "@/lib/utils";

type ComparisonFeaturesSectionProps = {
  competitor: CompetitorData;
};

// Helper function to render feature value
function renderFeatureValue(value: boolean | string): ReactNode {
  if (typeof value === "boolean") {
    return value ? (
      <Check className="h-5 w-5 text-green-600 dark:text-green-400" />
    ) : (
      <X className="h-5 w-5 text-slate-400" />
    );
  }
  return <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{value}</span>;
}

// ComparisonFeaturesSection renders the feature comparison table
export function ComparisonFeaturesSection({ competitor }: ComparisonFeaturesSectionProps) {
  return (
    <section className="relative z-10 border-t border-slate-200 bg-white py-20 dark:border-slate-800 dark:bg-slate-950">
      <Container className="flex flex-col gap-12">
        <SectionHeader
          align="center"
          eyebrow="Feature comparison"
          title={`${competitor.displayName} vs Linkedbud`}
          description="When comparing functionalities, Linkedbud offers a comprehensive LinkedIn command center with collaborative features and advanced analytics that set it apart."
        />

        <motion.div
          {...fadeInUp({ delay: 0.1, distance: 30 })}
          className="mx-auto w-full max-w-4xl overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900"
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900">
                  <th className="px-6 py-4 text-center text-sm font-semibold text-slate-900 dark:text-white">
                    Features
                  </th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-slate-900 dark:text-white">
                    Linkedbud
                  </th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-slate-900 dark:text-white">
                    {competitor.displayName}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {competitor.features.map((feature, index) => (
                  <tr
                    key={feature.feature}
                    className={cn(
                      "transition-colors hover:bg-slate-50 dark:hover:bg-slate-900/50",
                      index % 2 === 0 ? "bg-white dark:bg-slate-950" : "bg-slate-50/50 dark:bg-slate-900/50"
                    )}
                  >
                    <td className="px-6 py-4 text-center text-sm font-medium text-slate-900 dark:text-white">
                      {feature.feature}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center">
                        {renderFeatureValue(feature.linkedbud)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center">
                        {renderFeatureValue(feature.competitor)}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      </Container>
    </section>
  );
}

