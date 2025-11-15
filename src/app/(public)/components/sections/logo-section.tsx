"use client";

import { motion } from "framer-motion";

import { Container } from "@/marketing/components/common";
import { LogoCloud } from "@/marketing/components/ui";
import { fadeInUp } from "@/lib/motion-variants";

type LogoSectionProps = {
  teams?: string[];
};

// LogoSection displays the partner and customer logo cloud.
// If no teams array is passed, the component is hidden.
export function LogoSection({ teams }: LogoSectionProps) {
  // If teams prop is not provided or is empty, hide the component
  if (!teams || teams.length === 0) {
    return null;
  }

  return (
    <section className="py-12">
      <Container className="text-center">
        <p className="text-xs font-medium uppercase tracking-[0.35em] text-slate-600 dark:text-slate-400">
          Trusted by growth-minded teams
        </p>
        <motion.div {...fadeInUp({ delay: 0.1, distance: 16 })}>
          <LogoCloud logos={teams} />
        </motion.div>
      </Container>
    </section>
  );
}

