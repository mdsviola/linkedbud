import Link from "next/link";

import { Button } from "@/components/ui/button";

// CTASection composes the shared marketing call-to-action banner structure.
type CTAButton = {
  label: string;
  href: string;
  variant?: "primary" | "secondary";
};

type CTASectionProps = {
  eyebrow?: string;
  title: string;
  description: string;
  primaryCta: CTAButton;
  secondaryCta?: CTAButton;
};

export function CTASection({
  eyebrow,
  title,
  description,
  primaryCta,
  secondaryCta,
}: CTASectionProps) {
  return (
    <section className="relative isolate overflow-hidden pb-20">
      <div className="mx-auto max-w-6xl px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-lg border border-blue-600 bg-blue-600 px-8 py-16 text-center text-white shadow-sm">
          <div className="relative z-10 mx-auto max-w-3xl space-y-6">
            {eyebrow ? (
              <p className="text-xs font-semibold uppercase tracking-[0.4em] text-white">{eyebrow}</p>
            ) : null}
            <h2 className="text-3xl font-semibold leading-tight sm:text-4xl text-white">{title}</h2>
            <p className="text-base text-white">{description}</p>
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button
                asChild
                size="lg"
                className="h-12 rounded-md bg-white px-8 text-base font-semibold text-blue-600 shadow-sm hover:bg-blue-50"
              >
                <Link href={primaryCta.href}>{primaryCta.label}</Link>
              </Button>
              {secondaryCta ? (
                <Button
                  asChild
                  size="lg"
                  variant="ghost"
                  className="h-12 rounded-md border border-white/30 bg-transparent px-8 text-base text-white hover:bg-white/10"
                >
                  <Link href={secondaryCta.href}>{secondaryCta.label}</Link>
                </Button>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

