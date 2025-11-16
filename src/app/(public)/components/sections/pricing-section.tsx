"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";

import { Container } from "@/marketing/components/common";
import { PricingCard, ValuePropCard } from "@/marketing/components/ui";
import { PRICING_PLANS, PRICING_VALUE_PROPS } from "@/marketing/data/pricing";
import { fadeInUp } from "@/lib/motion-variants";

type PricingSectionProps = {
  showBackground?: boolean;
};

// Get icon(s) for each subscription tier
const getTierIcon = (planName: string): string | string[] => {
  const name = planName.toLowerCase();
  if (name === "free") {
    return ["🐄✋"];
  } else if (name === "creator lite" || name === "lite") {
    return "🪙";
  } else if (name === "creator pro" || name === "starter") {
    return "👑";
  } else if (name === "growth") {
    return "📈";
  }
  // Default fallback
  return "👑";
};

// PricingCardWrapper handles animation for cards that may already be in view on mount
function PricingCardWrapper({
  plan,
  icon,
  index,
}: {
  plan: (typeof PRICING_PLANS)[0];
  icon: string | string[];
  index: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.1, margin: "0px" });
  const [shouldAnimate, setShouldAnimate] = useState(false);

  // Check if element is in view on mount (after layout)
  useEffect(() => {
    // Use requestAnimationFrame to ensure layout is complete
    const checkVisibility = () => {
      if (ref.current) {
        const rect = ref.current.getBoundingClientRect();
        const isVisible =
          rect.top < window.innerHeight &&
          rect.bottom > 0 &&
          rect.left < window.innerWidth &&
          rect.right > 0;
        if (isVisible) {
          setShouldAnimate(true);
        }
      }
    };

    // Check immediately and after next frame to catch any layout changes
    checkVisibility();
    requestAnimationFrame(checkVisibility);
  }, []);

  // Also trigger animation when useInView detects it
  useEffect(() => {
    if (isInView) {
      setShouldAnimate(true);
    }
  }, [isInView]);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={shouldAnimate || isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
      transition={{ duration: 0.6, delay: index * 0.08, ease: "easeOut" }}
    >
      <PricingCard
        {...plan}
        icon={icon}
        badgeIcon={plan.badge ? "👑" : undefined}
      />
    </motion.div>
  );
}

// PricingSection presents plan tiers, callouts, and supporting guarantees.
export function PricingSection({ showBackground = true }: PricingSectionProps) {
  return (
    <section
      className={`${
        showBackground ? "relative overflow-hidden pt-8 pb-24" : "pt-8 pb-16"
      }`}
    >
      {showBackground ? (
        <div className="pointer-events-none absolute inset-0 bg-slate-50 dark:bg-slate-950" />
      ) : null}
      <Container className="relative z-10">
        <div className="grid gap-8 md:grid-cols-2">
          {PRICING_PLANS.map((plan, index) => {
            const icon = getTierIcon(plan.name);
            return (
              <PricingCardWrapper
                key={plan.name}
                plan={plan}
                icon={icon}
                index={index}
              />
            );
          })}
        </div>

        <motion.p
          {...fadeInUp({ delay: 0.1, distance: 16 })}
          className="mt-10 text-center text-sm text-slate-600 dark:text-slate-400"
        >
          Need a bespoke setup?{" "}
          <a
            href="mailto:hello@linkedbud.com"
            className="text-blue-600 underline underline-offset-4 dark:text-sky-400"
          >
            Let&apos;s talk.
          </a>
        </motion.p>

        <motion.p
          {...fadeInUp({ delay: 0.12, distance: 16 })}
          className="mt-2 text-center text-xs text-slate-500 dark:text-slate-400"
        >
          * Under a reasonable use policy. Usage may be capped if the system is exploited or abused.
        </motion.p>

        {PRICING_VALUE_PROPS.length ? (
          <section className="mt-16 rounded-lg border border-slate-200 bg-white p-10 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="grid gap-6 lg:grid-cols-3">
              {PRICING_VALUE_PROPS.map((prop) => (
                <ValuePropCard key={prop.title} {...prop} />
              ))}
            </div>
          </section>
        ) : null}
      </Container>
    </section>
  );
}
