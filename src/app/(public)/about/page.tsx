import type { Metadata } from "next";
import Script from "next/script";
import { Container } from "@/marketing/components/common";
import { SectionHeader } from "@/marketing/components/ui";
import { AboutStorySection, CTASection } from "@/marketing/components/sections";
import {
  generateOrganizationSchema,
  generateWebPageSchema,
  generateBreadcrumbListSchema,
} from "@/lib/seo/schemas";

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://linkedbud.com";

export const metadata: Metadata = {
  title: "About linkedbud — Our mission for LinkedIn storytellers",
  description:
    "Learn about linkedbud, the team building AI-assisted workflows that help professionals share better ideas faster on LinkedIn.",
  keywords: [
    "About linkedbud",
    "LinkedIn tools",
    "AI content creation",
    "social media management",
    "company mission",
  ],
  openGraph: {
    title: "About linkedbud — Our mission for LinkedIn storytellers",
    description:
      "linkedbud is built by operators and creators who believe LinkedIn deserves tooling designed for modern storytelling.",
    url: `${baseUrl}/about`,
    type: "website",
    locale: "en_US",
    siteName: "linkedbud",
    images: [
      {
        url: `${baseUrl}/og-image.png`,
        width: 1200,
        height: 630,
        alt: "About linkedbud - Our mission for LinkedIn storytellers",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "About linkedbud — Our mission for LinkedIn storytellers",
    description:
      "linkedbud is built by operators and creators who believe LinkedIn deserves tooling designed for modern storytelling.",
    images: [`${baseUrl}/og-image.png`],
  },
  alternates: {
    canonical: `${baseUrl}/about`,
  },
};

export default function AboutPage() {
  const organizationSchema = generateOrganizationSchema();
  const breadcrumbSchema = generateBreadcrumbListSchema([
    { name: "Home", url: baseUrl },
    { name: "About", url: `${baseUrl}/about` },
  ]);
  const webPageSchema = generateWebPageSchema(
    "About linkedbud",
    "Learn about linkedbud, the team building AI-assisted workflows that help professionals share better ideas faster on LinkedIn.",
    `${baseUrl}/about`
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
        id="breadcrumb-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbSchema),
        }}
      />
      <Script
        id="about-page-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(webPageSchema),
        }}
      />
      <div className="relative">
        <section className="pb-12 pt-20">
          <Container width="narrow" className="text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-blue-500 dark:text-sky-400">
              Our story
            </p>
            <SectionHeader
              align="center"
              as="h1"
              title="Helping professionals share better ideas, faster."
              description="linkedbud builds calm, intelligent workflows for the creators who power LinkedIn: founders, operators, and marketers with something to say."
            />
          </Container>
        </section>

        <Container className="pb-20">
          <AboutStorySection />
        </Container>

        <CTASection />
      </div>
    </>
  );
}
