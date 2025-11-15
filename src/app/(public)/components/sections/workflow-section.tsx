"use client";

import { motion } from "framer-motion";

import { Container } from "@/marketing/components/common";
import {
  SectionHeader,
  TestimonialCard,
  WorkflowCard,
} from "@/marketing/components/ui";
import {
  WORKFLOW_STEPS,
  WORKFLOW_TESTIMONIAL,
} from "@/marketing/data/workflow";
import { fadeInUp, slideInFromRight } from "@/lib/motion-variants";

// WorkflowSection outlines Linkedbud's three-step operating rhythm and supporting testimonial.
export function WorkflowSection() {
  return (
    <section className="relative overflow-hidden py-24">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-slate-50 to-transparent dark:via-slate-950" />
      <Container className="relative z-10 grid gap-16 lg:grid-cols-[1fr,1.1fr]">
        <div className="space-y-6">
          <motion.div {...fadeInUp({ distance: 16 })}>
            <SectionHeader
              title="A calm command center for every stage of LinkedIn content."
              description="Build a repeatable rhythm that pairs strategic ideation with automated publishing. Linkedbud keeps your brand voice consistent across founders, leaders, and marketing teams."
            />
          </motion.div>
          {/* <motion.div {...fadeInUp({ delay: 0.18, distance: 16 })}>
            <TestimonialCard {...WORKFLOW_TESTIMONIAL} />
          </motion.div>*/}
        </div>

        <div className="space-y-6">
          {WORKFLOW_STEPS.map((step, index) => (
            <motion.div
              key={step.title}
              {...slideInFromRight({ delay: index * 0.08 })}
            >
              <WorkflowCard index={index} {...step} />
            </motion.div>
          ))}
        </div>
      </Container>
    </section>
  );
}
