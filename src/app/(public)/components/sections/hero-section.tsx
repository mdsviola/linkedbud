"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Play } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Container } from "@/marketing/components/common";
import { StatsGrid } from "@/marketing/components/ui";
import { HERO_STATS } from "@/marketing/data/hero";
import { createStaggeredFadeVariants, fadeInUp } from "@/lib/motion-variants";
import { LinkedInPostModal } from "@/marketing/components/ui/linkedin-post-modal";

// HeroSection renders the primary landing page hero with headline, actions, and product preview.
const heroVariants = createStaggeredFadeVariants();

export function HeroSection() {
  return (
    <section className="relative overflow-hidden pb-24 pt-20 sm:pt-32 bg-white dark:bg-slate-950">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-x-0 top-0 h-[200px] bg-slate-50 dark:bg-slate-900" />
      </div>

      <Container className="grid items-center gap-16 lg:grid-cols-[1.1fr,0.9fr]">
        <div className="relative z-10 space-y-10">
          <motion.h1
            initial="hidden"
            animate="visible"
            custom={0}
            variants={heroVariants}
            className="text-4xl font-semibold leading-tight text-slate-900 sm:text-5xl lg:text-6xl dark:text-white"
          >
            Your intelligent LinkedIn co-pilot.
          </motion.h1>

          <motion.p
            initial="hidden"
            animate="visible"
            custom={1}
            variants={heroVariants}
            className="max-w-xl text-lg leading-relaxed text-slate-600 dark:text-slate-300"
          >
            linkedbud helps you ideate, craft, and schedule powerful LinkedIn
            content. AI suggestions stay on-brand, analytics reveal what works,
            and publishing happens while you sleep.
          </motion.p>

          <motion.div
            initial="hidden"
            animate="visible"
            custom={2}
            variants={heroVariants}
            className="flex flex-col items-start gap-4 sm:flex-row sm:items-center"
          >
            <Button
              asChild
              size="lg"
              className="h-12 rounded-md px-8 text-base bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
            >
              <Link href="/try-free">Try Free</Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="h-12 rounded-md border border-slate-300 bg-white px-7 text-base text-slate-700 transition hover:bg-slate-50 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              <Link href="#demo" className="inline-flex items-center gap-2">
                <Play className="h-4 w-4 fill-current" />
                Watch demo
              </Link>
            </Button>
          </motion.div>

          <motion.div
            initial="hidden"
            animate="visible"
            custom={3}
            variants={heroVariants}
          >
            <StatsGrid stats={HERO_STATS} />
          </motion.div>
        </div>

        <motion.div
          {...fadeInUp({ delay: 0.2, distance: 50 })}
          className="relative"
        >
          <LinkedInPostModal
            draftText={`🚀 Most LinkedIn posts fall flat because they forget one thing: consistency beats perfection every single time.\n\nHere's the reality: The founders and operators who dominate LinkedIn aren't spending hours crafting each post. They're showing up consistently with insights that matter. We built linkedbud to turn today's tech headlines into actionable content—so you can stay visible, stay relevant, and build your authority without the burnout.`}
            userName="Erlich Bachman"
            userInitials="EB"
            startTypingDelay={800}
            typingSpeed={25}
          />
        </motion.div>
      </Container>
    </section>
  );
}
