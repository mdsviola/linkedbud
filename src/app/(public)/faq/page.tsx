import type { Metadata } from "next";
import Script from "next/script";
import { Container } from "@/marketing/components/common";
import { SectionHeader } from "@/marketing/components/ui";
import { CTASection, FAQSection } from "@/marketing/components/sections";
import { FAQ_ITEMS } from "@/marketing/data/faq";
import {
  generateFAQPageSchema,
  generateWebPageSchema,
  generateBreadcrumbListSchema,
} from "@/lib/seo/schemas";

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://linkedbud.com";

export const metadata: Metadata = {
  title: "Linkedbud FAQ — Answers for your LinkedIn workflow",
  description:
    "Find answers about Linkedbud's AI LinkedIn assistant: collaboration, integrations, security, pricing, and early access roadmap.",
  keywords: [
    "Linkedbud FAQ",
    "LinkedIn tools questions",
    "AI content creation help",
    "social media management FAQ",
    "LinkedIn scheduler support",
  ],
  openGraph: {
    title: "Linkedbud FAQ — Answers for your LinkedIn workflow",
    description:
      "Find answers about Linkedbud's AI LinkedIn assistant: collaboration, integrations, security, pricing, and early access roadmap.",
    url: `${baseUrl}/faq`,
    type: "website",
    locale: "en_US",
    siteName: "Linkedbud",
    images: [
      {
        url: `${baseUrl}/og-image.png`,
        width: 1200,
        height: 630,
        alt: "Linkedbud FAQ - Answers for your LinkedIn workflow",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Linkedbud FAQ — Answers for your LinkedIn workflow",
    description:
      "Find answers about Linkedbud's AI LinkedIn assistant: collaboration, integrations, security, pricing, and early access roadmap.",
    images: [`${baseUrl}/og-image.png`],
  },
  alternates: {
    canonical: `${baseUrl}/faq`,
  },
};

export default function FAQPage() {
  const breadcrumbSchema = generateBreadcrumbListSchema([
    { name: "Home", url: baseUrl },
    { name: "FAQ", url: `${baseUrl}/faq` },
  ]);
  const faqSchema = generateFAQPageSchema(FAQ_ITEMS);
  const webPageSchema = generateWebPageSchema(
    "Linkedbud FAQ",
    "Find answers about Linkedbud's AI LinkedIn assistant: collaboration, integrations, security, pricing, and early access roadmap.",
    `${baseUrl}/faq`
  );

  return (
    <>
      <Script
        id="faq-page-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(faqSchema),
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
        id="faq-webpage-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(webPageSchema),
        }}
      />
      <div className="relative">
        <section className="pb-6 pt-20">
          <Container width="narrow" className="text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-blue-500 dark:text-sky-400">
              FAQ
            </p>
            <SectionHeader
              align="center"
              as="h1"
              title="Answers for creators who live on LinkedIn."
              description="We gathered the most common questions from founders, consultants, and marketing teams exploring Linkedbud. Need something else? Email us anytime."
            />
          </Container>
        </section>

        <FAQSection />
        <CTASection />
      </div>
    </>
  );
}
