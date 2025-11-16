"use client";

import { motion } from "framer-motion";
import { Container } from "@/marketing/components/common";
import { SectionHeader } from "@/marketing/components/ui";
import type { CompetitorData } from "@/marketing/data/comparisons";
import { fadeInUp } from "@/lib/motion-variants";

type ComparisonHeroSectionProps = {
  competitor: CompetitorData;
};

// ComparisonHeroSection renders the hero section for comparison pages
export function ComparisonHeroSection({ competitor }: ComparisonHeroSectionProps) {
  return (
    <section className="relative overflow-hidden pb-24 pt-20 sm:pt-32 bg-white dark:bg-slate-950">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-x-0 top-0 h-[200px] bg-slate-50 dark:bg-slate-900" />
      </div>

      <Container className="relative z-10">
        <motion.div
          {...fadeInUp({ delay: 0, distance: 30 })}
          className="mx-auto max-w-4xl text-center"
        >
          <SectionHeader
            align="center"
            as="h1"
            eyebrow={`linkedbud vs ${competitor.displayName}`}
            title={competitor.heroTitle}
            description={competitor.heroDescription}
          />
        </motion.div>
      </Container>
    </section>
  );
}

