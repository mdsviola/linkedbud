"use client";

import { CTASection as CTASectionBase } from "@/marketing/components/ui";

// CTASection encapsulates the shared marketing call-to-action banner.
export function CTASection() {
  return (
    <CTASectionBase
      eyebrow="Ready to grow on LinkedIn?"
      title="linkedbud gives your team a repeatable system for standout posts and measurable growth."
      description="Join the early access list to unlock AI-guided ideation, voice-aware drafting, and scheduling superpowers built for LinkedIn."
      primaryCta={{ label: "Try Free", href: "/try-free" }}
      secondaryCta={{ label: "Explore the product", href: "/features" }}
    />
  );
}

