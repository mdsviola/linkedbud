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
  title: "linkedbud features — Article discovery, AI drafting, scheduling, analytics",
  description:
    "Explore linkedbud's features for LinkedIn content: article discovery from RSS feeds, AI-powered post generation, scheduling, and performance analytics.",
  keywords: [
    "linkedbud features",
    "LinkedIn tools features",
    "AI content creation tools",
    "social media management features",
    "LinkedIn scheduler features",
    "content analytics",
  ],
  openGraph: {
    title: "linkedbud features — Article discovery, AI drafting, scheduling, analytics",
    description:
      "Discover articles, generate LinkedIn posts with AI, schedule publication, and track performance with detailed analytics.",
    url: `${baseUrl}/features`,
    type: "website",
    locale: "en_US",
    siteName: "linkedbud",
    images: [
      {
        url: `${baseUrl}/og-image.png`,
        width: 1200,
        height: 630,
        alt: "linkedbud features - Article discovery, AI drafting, scheduling, analytics",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "linkedbud features — Article discovery, AI drafting, scheduling, analytics",
    description:
      "Discover articles, generate LinkedIn posts with AI, schedule publication, and track performance with detailed analytics.",
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
      "Article discovery from RSS feeds, AI-powered LinkedIn post generation, scheduling, and performance analytics for LinkedIn content workflows.",
  });

  const webPageSchema = generateWebPageSchema(
    "linkedbud Features",
    "Explore linkedbud's features for LinkedIn content: article discovery from RSS feeds, AI-powered post generation, scheduling, and performance analytics.",
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
              description="linkedbud connects article discovery, AI-powered content creation, scheduling, and analytics into one interface. Discover relevant content, generate posts, schedule publication, and track performance—all in one place."
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

