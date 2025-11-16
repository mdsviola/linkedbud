"use client";

import { motion } from "framer-motion";

import { Container } from "@/marketing/components/common";
import { SectionHeader } from "@/marketing/components/ui";
import { COMPANY_MILESTONES, COMPANY_VALUES } from "@/marketing/data/about";
import { fadeInUp, scaleFadeIn } from "@/lib/motion-variants";

// AboutStorySection shares the linkedbud origin narrative, values, and timeline.
export function AboutStorySection() {
  return (
    <div className="space-y-20">
      <motion.section
        {...scaleFadeIn({})}
        className="relative overflow-hidden rounded-lg border border-slate-200 bg-white px-10 py-16 shadow-sm dark:border-slate-800 dark:bg-slate-900"
      >
        <Container className="relative z-10 grid gap-12 lg:grid-cols-[1.1fr,0.9fr]">
          <div className="space-y-6">
            <SectionHeader
              title="We believe LinkedIn deserves tools crafted for modern storytellers."
              description="linkedbud was born from teams who needed to contribute ideas, share wins, and build authority without spending hours crafting each post. We blend thoughtful design with an AI layer that keeps your voice at the center. Our mission is to help professionals share better ideas faster—so the best voices stay in the conversation, not buried in drafts."
            />
          </div>

          <motion.div
            {...scaleFadeIn({})}
            className="grid gap-4 rounded-lg border border-blue-200 bg-blue-50 p-6 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
          >
            {COMPANY_VALUES.map((value) => (
              <div key={value.title} className="rounded-lg bg-white p-4 shadow-sm dark:bg-slate-900">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{value.title}</h2>
                <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">{value.description}</p>
              </div>
            ))}
          </motion.div>
        </Container>
      </motion.section>

      <section className="space-y-10">
        <Container>
          <motion.div {...fadeInUp({ distance: 16 })}>
            <SectionHeader as="h2" title="From idea to platform" />
          </motion.div>
        </Container>
        <Container>
          <div className="relative border-l border-slate-200 dark:border-slate-800">
            {COMPANY_MILESTONES.map((milestone, index) => (
              <motion.div
                key={milestone.year}
                {...fadeInUp({ delay: index * 0.1, distance: 30 })}
                className={`relative ml-8 border border-slate-200 bg-white px-6 py-6 text-sm text-slate-600 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 ${
                  index < COMPANY_MILESTONES.length - 1 ? "mb-12" : ""
                }`}
              >
                <span className="absolute -left-[3.375rem] top-1/2 -translate-x-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-md border border-blue-200 bg-white px-2 text-xs font-semibold text-blue-600 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-blue-400">
                  {milestone.year}
                </span>
                <h3 className="text-base font-semibold text-slate-900 dark:text-white">{milestone.title}</h3>
                <p className="mt-2 leading-relaxed">{milestone.description}</p>
              </motion.div>
            ))}
          </div>
        </Container>
      </section>
    </div>
  );
}

