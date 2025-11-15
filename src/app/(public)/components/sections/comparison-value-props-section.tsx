"use client";

import { motion } from "framer-motion";
import { Container } from "@/marketing/components/common";
import { SectionHeader } from "@/marketing/components/ui";
import type { CompetitorData } from "@/marketing/data/comparisons";
import { fadeInUp } from "@/lib/motion-variants";

type ComparisonValuePropsSectionProps = {
  competitor: CompetitorData;
};

// ComparisonValuePropsSection renders the value proposition highlights
export function ComparisonValuePropsSection({ competitor }: ComparisonValuePropsSectionProps) {
  return (
    <section className="relative z-10 border-t border-slate-200 bg-white py-20 dark:border-slate-800 dark:bg-slate-950">
      <Container className="flex flex-col gap-12">
        <SectionHeader
          align="center"
          eyebrow="Why choose Linkedbud"
          title={`Why choose Linkedbud over ${competitor.displayName}?`}
          description="Linkedbud provides unique advantages that make it the better choice for teams serious about LinkedIn growth."
        />

        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {competitor.valueProps.map((prop, index) => (
            <motion.div
              key={index}
              {...fadeInUp({ delay: index * 0.08, distance: 40 })}
              className="group relative overflow-hidden rounded-lg border border-slate-200 bg-white p-8 shadow-sm transition duration-300 hover:border-slate-300 hover:shadow dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700"
            >
              <div className="mb-4 text-4xl">{prop.icon}</div>
              <h3 className="mt-5 text-xl font-semibold text-slate-900 dark:text-white">{prop.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">{prop.description}</p>
            </motion.div>
          ))}
        </div>
      </Container>
    </section>
  );
}

