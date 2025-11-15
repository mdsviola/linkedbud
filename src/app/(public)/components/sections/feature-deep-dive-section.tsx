"use client";

import { motion } from "framer-motion";

import { Container } from "@/marketing/components/common";
import { SectionHeader } from "@/marketing/components/ui";
import { FEATURE_DEEP_DIVE_SECTIONS } from "@/marketing/data/features";
import { scaleFadeIn, fadeInUp } from "@/lib/motion-variants";

// FeatureDeepDiveSection showcases the ideate, create, and grow workflows in detail.
export function FeatureDeepDiveSection() {
  return (
    <section className="py-24">
      <Container>
        <SectionHeader
          eyebrow="Crafted end-to-end"
          title="Three workflows, one calm workspace."
          description="The Linkedbud suite guides your team from the moment an industry insight hits your inbox to the second your next post goes live."
        />

        <div className="mt-16 space-y-12">
          {FEATURE_DEEP_DIVE_SECTIONS.map((feature, index) => (
            <motion.div
              key={feature.headline}
              {...scaleFadeIn({ delay: index * 0.1 })}
              className="grid items-start gap-10 overflow-hidden rounded-lg border border-slate-200 bg-white p-10 shadow-sm dark:border-slate-800 dark:bg-slate-900 lg:grid-cols-[1.1fr,0.9fr]"
            >
              <div className="space-y-4">
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-blue-600 dark:text-blue-400">
                  {feature.name}
                </p>
                <h3 className="text-2xl font-semibold text-slate-900 dark:text-white">{feature.headline}</h3>
                <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">{feature.body}</p>
                <ul className="mt-6 space-y-3 text-sm text-slate-600 dark:text-slate-300">
                  {feature.highlights.map((highlight) => (
                    <li key={highlight} className="flex items-start gap-2">
                      <span className="mt-1 h-1.5 w-1.5 rounded-full bg-blue-600 dark:bg-blue-500" />
                      <span>{highlight}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <motion.div
                {...fadeInUp({})}
                className="relative overflow-hidden rounded-lg border border-blue-200 bg-blue-50 p-8 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
              >
                <div className="space-y-4">
                  <p className="text-xs uppercase tracking-[0.32em] text-blue-600 dark:text-blue-400">UI snapshot</p>
                  <p className="text-base font-semibold text-slate-900 dark:text-white">{feature.illustration}</p>
                  <p className="text-sm leading-relaxed text-slate-600/80 dark:text-slate-300/80">
                    Glimpse into the modular canvas that makes building posts feel effortless.
                  </p>
                </div>
              </motion.div>
            </motion.div>
          ))}
        </div>
      </Container>
    </section>
  );
}

