"use client";

import { motion } from "framer-motion";

import { Container } from "@/marketing/components/common";
import { InsightCard, SectionHeader } from "@/marketing/components/ui";
import { INSIGHT_CARDS } from "@/marketing/data/features";
import { fadeIn, fadeInUp } from "@/lib/motion-variants";

const INSIGHT_BULLETS = [
  "Auto-surface breakout posts and suggested follow-ups.",
  "Instant insights on hooks, formats, and topics that convert.",
  "Export-ready summaries for leadership and clients.",
];

// InsightsSection communicates analytics-driven benefits with supporting metrics.
export function InsightsSection() {
  return (
    <section className="relative overflow-hidden py-24">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-slate-50 to-transparent dark:via-slate-950" />
      <Container className="relative z-10 flex flex-col gap-12 lg:flex-row lg:items-center">
        <motion.div
          {...fadeIn({ delay: 0.1 })}
          className="max-w-xl space-y-6"
        >
          <SectionHeader
            eyebrow="Intelligent insights"
            title="Understand what works, before you schedule the next post."
            description="Linkedbud captures engagement signals, topic velocity, and audience reactions to uncover the narrative threads your network loves. Translate analytics into clear next steps without spreadsheets."
          />
          <ul className="space-y-3 text-sm text-slate-600 dark:text-slate-300">
            {INSIGHT_BULLETS.map((bullet) => (
              <li key={bullet} className="flex items-start gap-3">
                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-blue-600 dark:bg-blue-500" />
                {bullet}
              </li>
            ))}
          </ul>
        </motion.div>

        <div className="relative z-10 grid gap-8 lg:grid-cols-3">
          {INSIGHT_CARDS.map((card, index) => (
            <motion.div key={card.title} {...fadeInUp({ delay: index * 0.1, distance: 30 })}>
              <InsightCard {...card} />
            </motion.div>
          ))}
        </div>
      </Container>
    </section>
  );
}

