import type { Metadata } from "next";
import Script from "next/script";
import { Container } from "@/marketing/components/common";
import { SectionHeader } from "@/marketing/components/ui";
import {
  CTASection,
  FeatureDeepDiveSection,
  FeaturesSection,
  InsightsSection,
} from "@/marketing/components/sections";
import {
  generateSoftwareApplicationSchema,
  generateWebPageSchema,
  generateBreadcrumbListSchema,
} from "@/lib/seo/schemas";

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://linkedbud.com";

export const metadata: Metadata = {
  title: "Linkedbud features — LinkedIn-native ideation, drafting, analytics",
  description:
    "Explore Linkedbud's end-to-end workflows for LinkedIn growth: idea generation, AI drafting, collaborative scheduling, and deep analytics.",
  keywords: [
    "Linkedbud features",
    "LinkedIn tools features",
    "AI content creation tools",
    "social media management features",
    "LinkedIn scheduler features",
    "content analytics",
  ],
  openGraph: {
    title: "Linkedbud features — LinkedIn-native ideation, drafting, analytics",
    description:
      "See how Linkedbud powers LinkedIn content from the first spark of an idea to performance insights that fuel the next post.",
    url: `${baseUrl}/features`,
    type: "website",
    locale: "en_US",
    siteName: "Linkedbud",
    images: [
      {
        url: `${baseUrl}/og-image.png`,
        width: 1200,
        height: 630,
        alt: "Linkedbud features - LinkedIn-native ideation, drafting, analytics",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Linkedbud features — LinkedIn-native ideation, drafting, analytics",
    description:
      "See how Linkedbud powers LinkedIn content from the first spark of an idea to performance insights that fuel the next post.",
    images: [`${baseUrl}/og-image.png`],
  },
  alternates: {
    canonical: `${baseUrl}/features`,
  },
};

export default function FeaturesPage() {
  const breadcrumbSchema = generateBreadcrumbListSchema([
    { name: "Home", url: baseUrl },
    { name: "Features", url: `${baseUrl}/features` },
  ]);
  const softwareSchema = generateSoftwareApplicationSchema({
    description:
      "LinkedIn-native ideation, AI drafting, collaborative scheduling, and deep analytics for end-to-end LinkedIn content workflows.",
  });

  const webPageSchema = generateWebPageSchema(
    "Linkedbud Features",
    "Explore Linkedbud's end-to-end workflows for LinkedIn growth: idea generation, AI drafting, collaborative scheduling, and deep analytics.",
    `${baseUrl}/features`
  );

  return (
    <>
      <Script
        id="software-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(softwareSchema),
        }}
      />
      <Script
        id="breadcrumb-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbSchema),
        }}
      />
      <Script
        id="features-page-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(webPageSchema),
        }}
      />
      <div className="relative">
        <section className="pb-10 pt-20">
          <Container width="narrow" className="text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-blue-500 dark:text-sky-400">
              Product overview
            </p>
            <SectionHeader
              align="center"
              as="h1"
              title="Everything you need to build a standout LinkedIn presence."
              description="Linkedbud connects ideation, creation, scheduling, and analysis into one calm interface that respects LinkedIn's unique rhythm. The result: consistent content, clear collaboration, and measurable growth."
            />
          </Container>
        </section>

        <FeaturesSection />
        <FeatureDeepDiveSection />
        <InsightsSection />
        <CTASection />
      </div>
    </>
  );
}

