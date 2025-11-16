import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { Toaster } from "@/components/ui/toast";
import NextTopLoader from "nextjs-toploader";
import { CookieConsentModal } from "@/components/cookie-consent-modal";
import { FeedbackWidget } from "@/components/feedback-widget";
import { generateWebSiteSchema } from "@/lib/seo/schemas";

const inter = Inter({ subsets: ["latin"] });

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://linkedbud.com";

// Google Search Console verification meta tag (optional)
const googleSiteVerification = process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION;

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: "linkedbud - AI-Powered Content Creation",
    template: "%s | linkedbud",
  },
  description:
    "AI-powered LinkedIn assistant for creating, scheduling, and analyzing posts. Start free with unlimited drafts.",
  keywords: [
    "LinkedIn",
    "AI content creation",
    "social media management",
    "LinkedIn scheduler",
    "content automation",
    "social media tools",
    "AI writing assistant",
    "LinkedIn marketing",
  ],
  authors: [{ name: "linkedbud" }],
  creator: "linkedbud",
  verification: googleSiteVerification
    ? {
        google: googleSiteVerification,
      }
    : undefined,
  openGraph: {
    type: "website",
    locale: "en_US",
    url: baseUrl,
    siteName: "linkedbud",
    title: "linkedbud - AI-Powered LinkedIn Content Creation",
    description:
      "AI-powered LinkedIn assistant for creating, scheduling, and analyzing posts. Start free with unlimited drafts.",
    images: [
      {
        url: `${baseUrl}/og-image.png`,
        width: 1200,
        height: 630,
        alt: "linkedbud - AI-Powered LinkedIn Content Creation",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "linkedbud - AI-Powered LinkedIn Content Creation",
    description:
      "AI-powered LinkedIn assistant for creating, scheduling, and analyzing posts. Start free with unlimited drafts.",
    images: [`${baseUrl}/og-image.png`],
  },
  alternates: {
    canonical: baseUrl,
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/android-chrome-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/android-chrome-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
    // Site icon for Google search results (preferred size: 192x192 or 512x512)
    shortcut: [{ url: "/android-chrome-192x192.png", sizes: "192x192", type: "image/png" }],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const websiteSchema = generateWebSiteSchema();

  return (
    <html lang="en">
      <body className={inter.className}>
        <Script
          id="website-schema"
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(websiteSchema),
          }}
        />
        <NextTopLoader
          color="#3b82f6"
          height={3}
          showSpinner={false}
          speed={200}
          easing="ease"
        />
        {children}
        <Toaster />
        <CookieConsentModal />
        <FeedbackWidget />
      </body>
    </html>
  );
}
