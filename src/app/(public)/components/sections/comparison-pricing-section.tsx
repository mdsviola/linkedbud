"use client";

import { motion } from "framer-motion";
import { Container } from "@/marketing/components/common";
import { SectionHeader } from "@/marketing/components/ui";
import type { CompetitorData } from "@/marketing/data/comparisons";
import { PRICING_PLANS } from "@/marketing/data/pricing";
import { fadeInUp } from "@/lib/motion-variants";
import type { FeatureSection } from "@/marketing/types/marketing";

type ComparisonPricingSectionProps = {
  competitor: CompetitorData;
};

// ComparisonPricingSection renders the pricing comparison
export function ComparisonPricingSection({ competitor }: ComparisonPricingSectionProps) {
  // Use Creator Pro plan for comparison, fallback to first highlighted plan
  const linkedbudStarterPlan = PRICING_PLANS.find((plan) => plan.name === "Creator Pro") ||
    PRICING_PLANS.find((plan) => plan.name === "Starter") || // Legacy fallback
    PRICING_PLANS.find((plan) => plan.highlighted) ||
    PRICING_PLANS[0];

  return (
    <section className="relative overflow-hidden py-24">
      <div className="pointer-events-none absolute inset-0 bg-slate-50 dark:bg-slate-950" />
      <Container className="relative z-10">
        <div className="mx-auto max-w-3xl text-center">
          <SectionHeader
            align="center"
            eyebrow="Pricing comparison"
            title={`The best value-for-money compared to ${competitor.displayName}`}
            description={
              competitor.pricing.notes ||
              `linkedbud offers comprehensive features at competitive pricing compared to ${competitor.displayName}.`
            }
          />
        </div>

        <div className="mt-14 grid gap-8 md:grid-cols-2">
          {/* linkedbud Pricing */}
          <motion.div
            {...fadeInUp({ delay: 0.1, distance: 40 })}
            className="group relative overflow-hidden rounded-lg border-2 border-blue-600 bg-white p-8 shadow-sm transition duration-300 hover:shadow dark:border-blue-500 dark:bg-slate-900"
          >
            <div className="mb-6">
              <h3 className="text-2xl font-semibold text-slate-900 dark:text-white">linkedbud</h3>
              <p className="mt-2 text-3xl font-bold text-blue-600 dark:text-blue-400">
                {linkedbudStarterPlan?.price || "Custom"}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                {linkedbudStarterPlan?.description || linkedbudStarterPlan?.tagline || "For founders and teams who want a full LinkedIn command center."}
              </p>
            </div>
            {Array.isArray(linkedbudStarterPlan?.features) && linkedbudStarterPlan.features.length > 0 && typeof linkedbudStarterPlan.features[0] === "object" && "title" in linkedbudStarterPlan.features[0] ? (
              // Render FeatureSection array
              <div className="space-y-4">
                {(linkedbudStarterPlan.features as FeatureSection[]).map((section) => (
                  <div key={section.title} className="space-y-2">
                    <h4 className="font-semibold text-slate-900 dark:text-white text-sm mb-2">
                      {section.title}
                    </h4>
                    <ul className="space-y-2">
                      {section.items.map((item, index) => (
                        <li key={index} className="flex items-start gap-3 text-sm text-slate-700 dark:text-slate-300">
                          <span className="mt-1 h-1.5 w-1.5 rounded-full bg-blue-600 dark:bg-blue-500 flex-shrink-0" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            ) : (
              // Render string array
              <ul className="space-y-3">
                {(linkedbudStarterPlan?.features as string[]).map((feature, index) => (
                  <li key={index} className="flex items-start gap-3 text-sm text-slate-700 dark:text-slate-300">
                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-blue-600 dark:bg-blue-500 flex-shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            )}
          </motion.div>

          {/* Competitor Pricing */}
          <motion.div
            {...fadeInUp({ delay: 0.15, distance: 40 })}
            className="group relative overflow-hidden rounded-lg border border-slate-200 bg-white p-8 shadow-sm transition duration-300 hover:border-slate-300 hover:shadow dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700"
          >
            <div className="mb-6">
              <h3 className="text-2xl font-semibold text-slate-900 dark:text-white">
                {competitor.displayName}
              </h3>
              <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">
                {competitor.pricing.startingPrice}
              </p>
              {competitor.pricing.popularPlan && (
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                  {competitor.pricing.popularPlan}: {competitor.pricing.popularPlanPrice}
                </p>
              )}
            </div>
            <div className="space-y-3">
              <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                {competitor.pricing.notes || "Limited feature set compared to linkedbud."}
              </p>
            </div>
          </motion.div>
        </div>

        <motion.p
          {...fadeInUp({ delay: 0.2, distance: 16 })}
          className="mt-6 text-center text-xs text-slate-500 dark:text-slate-400"
        >
          * Under a reasonable use policy. Usage may be capped if the system is exploited or abused.
        </motion.p>
      </Container>
    </section>
  );
}

