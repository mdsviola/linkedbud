"use client";

import { motion } from "framer-motion";

import { Container } from "@/marketing/components/common";
import { FeatureCard, SectionHeader } from "@/marketing/components/ui";
import { FEATURE_GRID_ITEMS } from "@/marketing/data/features";
import { fadeInUp } from "@/lib/motion-variants";

// FeaturesSection highlights the core Linkedbud capabilities for the landing page.
export function FeaturesSection() {
  return (
    <section className="relative z-10 border-t border-slate-200 bg-white py-20 dark:border-slate-800 dark:bg-slate-950">
      <Container className="flex flex-col gap-12">
        <SectionHeader
          eyebrow="Built for LinkedIn momentum"
          title="Every workflow in Linkedbud is tuned to spark ideas, ship drafts, and measure traction."
          description="From ideation to post-launch performance, Linkedbud gives modern teams a single command center for everything LinkedIn."
        />

        <div className="grid gap-8 sm:grid-cols-2">
          {FEATURE_GRID_ITEMS.map((feature, index) => (
            <motion.div
              key={feature.title}
              {...fadeInUp({ delay: index * 0.08, distance: 40 })}
            >
              <FeatureCard {...feature} />
            </motion.div>
          ))}
        </div>
      </Container>
    </section>
  );
}

