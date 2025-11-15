import type { Metadata } from "next";
import Script from "next/script";
import Link from "next/link";
import Image from "next/image";
import { Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Container } from "@/marketing/components/common";
import {
  generateOrganizationSchema,
  generateWebPageSchema,
} from "@/lib/seo/schemas";

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://linkedbud.com";

export const metadata: Metadata = {
  title: {
    absolute: "Try Linkedbud Free - Your AI LinkedIn Co-Pilot",
  },
  description:
    "Start creating standout LinkedIn content with AI. Free sign-up, no credit card required. Get 3 free draft generations per month, forever.",
  keywords: [
    "LinkedIn",
    "AI content creation",
    "free LinkedIn tool",
    "LinkedIn scheduler",
    "content automation",
  ],
  openGraph: {
    title: "Try Linkedbud Free - Your AI LinkedIn Co-Pilot",
    description:
      "Start creating standout LinkedIn content with AI. Free sign-up, no credit card required.",
    url: `${baseUrl}/try-free`,
    siteName: "Linkedbud",
    locale: "en_US",
    images: [
      {
        url: `${baseUrl}/og-image.png`,
        width: 1200,
        height: 630,
        alt: "Linkedbud dashboard preview",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Try Linkedbud Free - Your AI LinkedIn Co-Pilot",
    description:
      "Start creating standout LinkedIn content with AI. Free sign-up, no credit card required.",
    images: [`${baseUrl}/og-image.png`],
  },
  alternates: {
    canonical: `${baseUrl}/try-free`,
  },
};

const benefits = [
  "AI-powered content creation that stays on-brand",
  "Schedule and publish posts automatically",
  "Track performance with insight-rich analytics",
];

export default function TryFreePage() {
  const organizationSchema = generateOrganizationSchema();
  const webpageSchema = generateWebPageSchema(
    "Try Linkedbud Free - Your AI LinkedIn Co-Pilot",
    "Start creating standout LinkedIn content with AI. Free sign-up, no credit card required.",
    `${baseUrl}/try-free`
  );

  return (
    <>
      <Script
        id="organization-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(organizationSchema),
        }}
      />
      <Script
        id="webpage-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(webpageSchema),
        }}
      />
      <div className="relative min-h-screen bg-white dark:bg-slate-950">
        <Container className="py-16 sm:py-24">
          <div className="mx-auto max-w-4xl">
            {/* Hero Section */}
            <div className="text-center mb-16">
              <h1 className="text-5xl font-semibold leading-tight text-slate-900 sm:text-6xl lg:text-7xl dark:text-white mb-6">
                Your AI LinkedIn Co-Pilot
              </h1>
              <p className="text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto mb-8">
                Create, schedule, and analyze standout LinkedIn content with AI.
                Start free, no credit card required.
              </p>

              {/* Benefits List */}
              <div className="flex flex-col items-center gap-4 mb-10">
                {benefits.map((benefit, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 text-lg text-slate-700 dark:text-slate-300"
                  >
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                    <span>{benefit}</span>
                  </div>
                ))}
              </div>

              {/* CTA Button */}
              <Button
                asChild
                size="lg"
                className="h-14 rounded-md px-10 text-lg font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl transition-all"
              >
                <Link href="/auth/signup">Try Free</Link>
              </Button>
              <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
                No credit card required • 3 free drafts per month, forever
              </p>
            </div>

            {/* Dashboard Screenshot */}
            <div className="relative rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden shadow-2xl bg-slate-50 dark:bg-slate-900">
              <div className="relative w-full">
                <Image
                  src="/dashboard_screenshot.png"
                  alt="Linkedbud Dashboard"
                  width={1200}
                  height={800}
                  className="w-full h-auto"
                  priority
                />
              </div>
            </div>
          </div>
        </Container>
      </div>
    </>
  );
}
