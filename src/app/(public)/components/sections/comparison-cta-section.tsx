"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Container } from "@/marketing/components/common";
import type { CompetitorData } from "@/marketing/data/comparisons";

type ComparisonCTASectionProps = {
  competitor: CompetitorData;
};

// ComparisonCTASection renders the CTA section for comparison pages
export function ComparisonCTASection({ competitor }: ComparisonCTASectionProps) {
  return (
    <section className="relative isolate overflow-hidden pb-20">
      <div className="mx-auto max-w-6xl px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-lg border border-blue-600 bg-blue-600 px-8 py-16 text-center text-white shadow-sm">
          <div className="relative z-10 mx-auto max-w-3xl space-y-6">
            <p className="text-xs font-semibold uppercase tracking-[0.4em] text-white">
              Ready to switch from {competitor.displayName}?
            </p>
            <h2 className="text-3xl font-semibold leading-tight sm:text-4xl text-white">
              Linkedbud gives your team a repeatable system for standout posts and measurable growth.
            </h2>
            <p className="text-base text-white">
              Join Linkedbud to unlock AI-guided ideation, voice-aware drafting, and scheduling superpowers built for LinkedIn.
            </p>
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button
                asChild
                size="lg"
                className="h-12 rounded-md bg-white px-8 text-base font-semibold text-blue-600 shadow-sm hover:bg-blue-50"
              >
                <Link href="/try-free">Try Free</Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="ghost"
                className="h-12 rounded-md border border-white/30 bg-transparent px-8 text-base text-white hover:bg-white/10"
              >
                <Link href="/pricing">View Pricing</Link>
              </Button>
            </div>
            <p className="pt-4 text-sm text-white/80">No credit card required • 3 free drafts per month, forever</p>
          </div>
        </div>
      </div>
    </section>
  );
}

