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
const competitor = getCompetitorData("taplio")!;

export const metadata: Metadata = {
  title: competitor.seoTitle,
  description: competitor.seoDescription,
  keywords: [
    "Linkedbud vs Taplio",
    "LinkedIn content tools comparison",
    "Taplio alternative",
    "LinkedIn content creation",
    "AI LinkedIn tools",
  ],
  openGraph: {
    title: competitor.seoTitle,
    description: competitor.seoDescription,
    url: `${baseUrl}/comparison/taplio`,
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
    canonical: `${baseUrl}/comparison/taplio`,
  },
};

export default function TaplioComparisonPage() {
  const webpageSchema = generateWebPageSchema(
    competitor.seoTitle,
    competitor.seoDescription,
    `${baseUrl}/comparison/taplio`
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

