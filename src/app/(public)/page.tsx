import type { Metadata } from "next";
import Script from "next/script";
import {
  CTASection,
  FAQSection,
  FeaturesSection,
  HeroSection,
  InsightsSection,
  LogoSection,
  VerifiedLinkedInAppSection,
  WorkflowSection,
} from "@/marketing/components/sections";
import {
  generateOrganizationSchema,
  generateSoftwareApplicationSchema,
  generateWebPageSchema,
} from "@/lib/seo/schemas";

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://linkedbud.com";

export const metadata: Metadata = {
  title: {
    absolute: "linkedbud - Your intelligent LinkedIn co-pilot",
  },
  description:
    "linkedbud is the AI-powered LinkedIn assistant for teams who want to ideate, create, and schedule standout posts in record time.",
  keywords: [
    "LinkedIn",
    "AI content creation",
    "social media management",
    "LinkedIn scheduler",
    "content automation",
    "LinkedIn marketing",
  ],
  openGraph: {
    title: "linkedbud - Your intelligent LinkedIn co-pilot",
    description:
      "linkedbud helps you ideate, draft, and schedule LinkedIn content with AI guidance and insight-rich analytics.",
    url: `${baseUrl}/`,
    siteName: "linkedbud",
    locale: "en_US",
    images: [
      {
        url: `${baseUrl}/og-image.png`,
        width: 1200,
        height: 630,
        alt: "linkedbud marketing site preview",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "linkedbud - Your intelligent LinkedIn co-pilot",
    description:
      "Automate LinkedIn ideation, drafting, and scheduling with linkedbud's AI command center for modern teams.",
    images: [`${baseUrl}/og-image.png`],
  },
  alternates: {
    canonical: `${baseUrl}/`,
  },
};

export default function LandingPage() {
  const organizationSchema = generateOrganizationSchema();
  const softwareSchema = generateSoftwareApplicationSchema();
  const webpageSchema = generateWebPageSchema(
    "linkedbud - Your intelligent LinkedIn co-pilot",
    "linkedbud is the AI-powered LinkedIn assistant for teams who want to ideate, create, and schedule standout posts in record time.",
    `${baseUrl}/`,
    {
      image: {
        url: `${baseUrl}/og-image.png`,
        width: 1200,
        height: 630,
      },
    }
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
        id="software-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(softwareSchema),
        }}
      />
      <Script
        id="webpage-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(webpageSchema),
        }}
      />
      <div className="relative">
        <HeroSection />
        <LogoSection teams={[]} />
        <FeaturesSection />
        <VerifiedLinkedInAppSection />
        <InsightsSection />
        <WorkflowSection />
        <FAQSection className="bg-transparent" />
        <CTASection />
      </div>
    </>
  );
}
