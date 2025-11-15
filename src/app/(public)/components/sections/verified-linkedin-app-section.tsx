"use client";

import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";

import { Container } from "@/marketing/components/common";
import { fadeInUp } from "@/lib/motion-variants";

// LinkedIn logo SVG following brand guidelines (blue #0077b5, minimum 21px height)
// Using the LinkedIn wordmark logo for better recognition
const LinkedInLogo = () => (
  <svg
    width="140"
    height="32"
    viewBox="0 0 140 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-label="LinkedIn"
    role="img"
  >
    {/* LinkedIn "in" icon */}
    <path
      d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.317V9.75h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9.75h3.564v10.702zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"
      fill="#0077b5"
    />
    {/* LinkedIn wordmark text */}
    <text
      x="32"
      y="20"
      fill="#0077b5"
      fontSize="18"
      fontWeight="600"
      fontFamily="Arial, sans-serif"
    >
      LinkedIn
    </text>
  </svg>
);

// VerifiedLinkedInAppSection displays information about Linkedbud being a verified LinkedIn app.
export function VerifiedLinkedInAppSection() {
  return (
    <section className="relative overflow-hidden py-16 border-t border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
      <Container className="relative z-10">
        <motion.div
          {...fadeInUp({ delay: 0.1, distance: 16 })}
          className="mx-auto max-w-2xl"
        >
          <div className="flex flex-col items-center gap-6 text-center">
            <div className="flex items-center gap-4">
              <LinkedInLogo />
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Verified App
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-base leading-relaxed text-slate-600 dark:text-slate-300">
                LinkedIn verified apps meet strict security and compliance
                standards, ensuring your data is protected and we follow
                LinkedIn&apos;s platform policies.
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                We&apos;re currently in the process of obtaining official
                verification from LinkedIn.
              </p>
            </div>
          </div>
        </motion.div>
      </Container>

      {/* Coming Soon Overlay */}
      <div className="absolute inset-0 z-20 flex items-center justify-center backdrop-blur-xs bg-white/60 dark:bg-slate-950/60">
        <div className="inline-flex items-center gap-2 rounded-lg border-2 border-blue-300 dark:border-blue-700 bg-blue-50/90 dark:bg-blue-900/40 backdrop-blur-md px-6 py-3 shadow-lg">
          <span className="text-lg font-semibold text-blue-700 dark:text-blue-300">
            Coming Soon
          </span>
        </div>
      </div>
    </section>
  );
}
