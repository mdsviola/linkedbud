import type { Metadata } from "next";
import Script from "next/script";
import {
  ComparisonHeroSection,
  ComparisonFeaturesSection,
  ComparisonPricingSection,
  ComparisonValuePropsSection,
  ComparisonCTASection,
} from "@/marketing/components/sections";
import { getCompetitorData } from "@/marketing/data/comparisons";
import { generateWebPageSchema } from "@/lib/seo/schemas";

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://linkedbud.com";
const competitor = getCompetitorData("easygen")!;

export const metadata: Metadata = {
  title: competitor.seoTitle,
  description: competitor.seoDescription,
  keywords: [
    "Linkedbud vs EasyGen",
    "LinkedIn content tools comparison",
    "EasyGen alternative",
    "LinkedIn content creation",
    "AI LinkedIn tools",
  ],
  openGraph: {
    title: competitor.seoTitle,
    description: competitor.seoDescription,
    url: `${baseUrl}/comparison/easygen`,
    siteName: "Linkedbud",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: `${baseUrl}/og-image.png`,
        width: 1200,
        height: 630,
        alt: `${competitor.seoTitle}`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: competitor.seoTitle,
    description: competitor.seoDescription,
    images: [`${baseUrl}/og-image.png`],
  },
  alternates: {
    canonical: `${baseUrl}/comparison/easygen`,
  },
};

export default function EasyGenComparisonPage() {
  const webpageSchema = generateWebPageSchema(
    competitor.seoTitle,
    competitor.seoDescription,
    `${baseUrl}/comparison/easygen`
  );

  return (
    <>
      <Script
        id="comparison-page-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(webpageSchema),
        }}
      />
      <div className="relative">
        <ComparisonHeroSection competitor={competitor} />
        <ComparisonFeaturesSection competitor={competitor} />
        <ComparisonPricingSection competitor={competitor} />
        <ComparisonValuePropsSection competitor={competitor} />
        <ComparisonCTASection competitor={competitor} />
      </div>
    </>
  );
}

