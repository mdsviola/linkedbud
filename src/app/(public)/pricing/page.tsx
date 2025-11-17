import type { Metadata } from "next";
import Script from "next/script";
import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase-server";
import { Container } from "@/marketing/components/common";
import { SectionHeader } from "@/marketing/components/ui";
import {
  CTASection,
  FAQSection,
  PricingSection,
} from "@/marketing/components/sections";
import {
  generateProductSchema,
  generateWebPageSchema,
  generateBreadcrumbListSchema,
} from "@/lib/seo/schemas";
import { getPricingConfig } from "@/lib/pricing-config";

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://linkedbud.com";

export const metadata: Metadata = {
  title: "linkedbud pricing — Flexible plans for LinkedIn growth",
  description:
    "Compare linkedbud pricing plans. Start free, then unlock AI drafting, collaboration, and analytics designed for LinkedIn teams.",
  keywords: [
    "linkedbud pricing",
    "LinkedIn tools pricing",
    "social media management cost",
    "AI content creation plans",
    "LinkedIn scheduler pricing",
  ],
  openGraph: {
    title: "linkedbud pricing — Flexible plans for LinkedIn growth",
    description:
      "Choose the linkedbud plan that matches your LinkedIn goals. Seamless upgrades, transparent pricing, and a scale plan for teams.",
    url: `${baseUrl}/pricing`,
    type: "website",
    locale: "en_US",
    siteName: "linkedbud",
    images: [
      {
        url: `${baseUrl}/og-image.png`,
        width: 1200,
        height: 630,
        alt: "linkedbud pricing - Flexible plans for LinkedIn growth",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "linkedbud pricing — Flexible plans for LinkedIn growth",
    description:
      "Choose the linkedbud plan that matches your LinkedIn goals. Seamless upgrades, transparent pricing, and a scale plan for teams.",
    images: [`${baseUrl}/og-image.png`],
  },
  alternates: {
    canonical: `${baseUrl}/pricing`,
  },
};

export default async function PricingPage() {
  // Check if user is authenticated and redirect them to subscription page
  const supabase = createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/subscription");
  }

  // Generate structured data for pricing
  const breadcrumbSchema = generateBreadcrumbListSchema([
    { name: "Home", url: baseUrl },
    { name: "Pricing", url: `${baseUrl}/pricing` },
  ]);
  // Get pricing from config to generate schema
  const pricingConfig = getPricingConfig();
  const freePrice = 0;
  const litePrice =
    typeof pricingConfig.tiers.LITE.monthlyPrice === "number"
      ? pricingConfig.tiers.LITE.monthlyPrice
      : 9;
  const starterPrice =
    typeof pricingConfig.tiers.PRO.monthlyPrice === "number"
      ? pricingConfig.tiers.PRO.monthlyPrice
      : 19;
  const growthPrice =
    typeof pricingConfig.tiers.GROWTH.monthlyPrice === "number"
      ? pricingConfig.tiers.GROWTH.monthlyPrice
      : 39;
  const productSchema = generateProductSchema(
    "linkedbud",
    "AI-powered LinkedIn assistant with flexible pricing plans",
    `${baseUrl}/pricing`,
    [
      { price: freePrice, currency: pricingConfig.currency },
      { price: litePrice, currency: pricingConfig.currency },
      { price: starterPrice, currency: pricingConfig.currency },
      { price: growthPrice, currency: pricingConfig.currency },
    ]
  );

  const webPageSchema = generateWebPageSchema(
    "linkedbud Pricing",
    "Compare linkedbud pricing plans. Start free, then unlock AI drafting, collaboration, and analytics designed for LinkedIn teams.",
    `${baseUrl}/pricing`
  );

  return (
    <>
      <Script
        id="product-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(productSchema),
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
        id="pricing-page-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(webPageSchema),
        }}
      />
      <div className="relative">
        <section className="pb-6 pt-20">
          <Container width="narrow" className="text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-blue-500 dark:text-sky-400">
              Pricing
            </p>
            <SectionHeader
              align="center"
              as="h1"
              title="Plans that scale with your momentum."
              description="Start with the essentials, then graduate to a shared command center with scheduling and analytics superpowers. Upgrade or pause whenever you need."
            />
          </Container>
        </section>

        <PricingSection />
        <FAQSection />
        <CTASection />
      </div>
    </>
  );
}
