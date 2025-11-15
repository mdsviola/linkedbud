import type { Metadata } from "next";
import Script from "next/script";
import {
  generateWebPageSchema,
  generateBreadcrumbListSchema,
} from "@/lib/seo/schemas";
import Link from "next/link";

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://linkedbud.com";

export const metadata: Metadata = {
  title: "LinkedIn API Compliance - Linkedbud",
  description:
    "Linkedbud's compliance documentation for LinkedIn API usage. Learn about our API integrations, data handling, and security practices.",
  keywords: [
    "LinkedIn API compliance",
    "LinkedIn API terms",
    "LinkedIn developer platform",
    "LinkedIn data privacy",
    "LinkedIn API security",
  ],
  openGraph: {
    title: "LinkedIn API Compliance - Linkedbud",
    description:
      "Linkedbud's compliance documentation for LinkedIn API usage. Learn about our API integrations, data handling, and security practices.",
    url: `${baseUrl}/legal/linkedin-api`,
    type: "website",
    locale: "en_US",
    siteName: "Linkedbud",
    images: [
      {
        url: `${baseUrl}/og-image.png`,
        width: 1200,
        height: 630,
        alt: "LinkedIn API Compliance - Linkedbud",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "LinkedIn API Compliance - Linkedbud",
    description:
      "Linkedbud's compliance documentation for LinkedIn API usage. Learn about our API integrations, data handling, and security practices.",
    images: [`${baseUrl}/og-image.png`],
  },
  alternates: {
    canonical: `${baseUrl}/legal/linkedin-api`,
  },
};

export default function LinkedInAPICompliancePage() {
  const breadcrumbSchema = generateBreadcrumbListSchema([
    { name: "Home", url: baseUrl },
    { name: "Legal", url: `${baseUrl}/legal` },
    { name: "LinkedIn API Compliance", url: `${baseUrl}/legal/linkedin-api` },
  ]);
  const webPageSchema = generateWebPageSchema(
    "LinkedIn API Compliance - Linkedbud",
    "Linkedbud's compliance documentation for LinkedIn API usage",
    `${baseUrl}/legal/linkedin-api`
  );

  return (
    <>
      <Script
        id="breadcrumb-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbSchema),
        }}
      />
      <Script
        id="linkedin-api-compliance-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(webPageSchema),
        }}
      />
      <div className="relative">
        <section className="pb-10 pt-20">
          <div className="mx-auto max-w-3xl px-6 text-center lg:px-8">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-blue-500 dark:text-sky-400">
              LinkedIn API Compliance
            </p>
            <h1 className="mt-6 text-4xl font-semibold text-slate-900 sm:text-5xl dark:text-white">
              LinkedIn API Compliance Documentation
            </h1>
            <p className="mt-6 text-base leading-relaxed text-slate-600 dark:text-slate-300">
              Complete transparency about how Linkedbud uses LinkedIn&apos;s APIs
              to power your content creation and analytics workflows.
            </p>
          </div>
        </section>

        <section className="pb-20">
          <div className="mx-auto max-w-4xl space-y-8 px-6 lg:px-8">
            <div className="rounded-3xl border border-slate-200/70 bg-white/80 p-8 text-left text-sm leading-relaxed text-slate-600 shadow-sm backdrop-blur dark:border-slate-800/70 dark:bg-slate-900/60 dark:text-slate-300">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                Overview
              </h2>
              <p className="mb-4">
                Linkedbud is a LinkedIn content creation and analytics co-pilot
                that helps users ideate, write, schedule, and analyze LinkedIn
                posts. We use LinkedIn&apos;s Community Management API
                (Marketing API) to publish posts to personal profiles and
                organization pages, and to fetch post performance analytics.
              </p>
              <p className="mb-4">
                <strong className="text-slate-900 dark:text-white">
                  Important:
                </strong>{" "}
                Linkedbud focuses exclusively on content creation and analytics.
                We do not perform lead generation, scraping, mass outreach, or
                automated messaging. Our product helps you create better
                content—nothing more.
              </p>
            </div>

            <div className="rounded-3xl border border-slate-200/70 bg-white/80 p-8 text-left text-sm leading-relaxed text-slate-600 shadow-sm backdrop-blur dark:border-slate-800/70 dark:bg-slate-900/60 dark:text-slate-300">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                APIs and Scopes We Request
              </h2>

              <h3 className="text-base font-semibold text-slate-900 dark:text-white mt-4 mb-2">
                Personal Account Scopes
              </h3>
              <ul className="list-disc list-inside space-y-2 mb-4 ml-4">
                <li>
                  <code className="bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                    w_member_social
                  </code>{" "}
                  — Publish posts to your personal LinkedIn profile
                </li>
                <li>
                  <code className="bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                    openid
                  </code>{" "}
                  — Identify your LinkedIn account (via OpenID Connect)
                </li>
                <li>
                  <code className="bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                    profile
                  </code>{" "}
                  — Retrieve basic profile information (name, profile picture)
                  for display in our UI
                </li>
                <li>
                  <code className="bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                    email
                  </code>{" "}
                  — Optional scope for account verification (if required by
                  LinkedIn)
                </li>
              </ul>

              <h3 className="text-base font-semibold text-slate-900 dark:text-white mt-4 mb-2">
                Community Management API Scopes (Organization Pages)
              </h3>
              <p className="mb-2">
                These scopes are part of LinkedIn&apos;s Community Management
                API and are only requested when you explicitly choose to connect
                organization pages you administer. They enable both analytics
                retrieval and post management for organization pages:
              </p>
              <ul className="list-disc list-inside space-y-2 mb-4 ml-4">
                <li>
                  <code className="bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                    r_organization_admin
                  </code>{" "}
                  — Enumerate organization pages you administer (for access
                  control)
                </li>
                <li>
                  <code className="bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                    r_organization_social
                  </code>{" "}
                  — Read organization page post data and statistics
                </li>
                <li>
                  <code className="bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                    w_organization_social
                  </code>{" "}
                  — Publish posts to organization pages you administer
                </li>
                <li>
                  <code className="bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                    r_member_postAnalytics
                  </code>{" "}
                  — Read post performance metrics for member-created content
                </li>
                <li>
                  <code className="bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                    r_organization_followers
                  </code>{" "}
                  — Read aggregate follower counts for organization pages
                </li>
                <li>
                  <code className="bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                    r_organization_social_feed
                  </code>{" "}
                  — Access organization page feed data
                </li>
                <li>
                  <code className="bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                    w_organization_social_feed
                  </code>{" "}
                  — Post to organization page feeds
                </li>
                <li>
                  <code className="bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                    w_member_social_feed
                  </code>{" "}
                  — Post to member feeds
                </li>
                <li>
                  <code className="bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                    r_basicprofile
                  </code>{" "}
                  — Basic profile information access
                </li>
                <li>
                  <code className="bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                    r_1st_connections_size
                  </code>{" "}
                  — Aggregate connection count (for analytics)
                </li>
              </ul>

              <p className="mt-4 text-xs text-slate-500 dark:text-slate-400">
                <strong>Note:</strong> We request only the minimum scopes
                necessary to enable our core functionality. We do not request
                messaging scopes, lead generation scopes, or any permissions
                unrelated to content publishing and analytics.
              </p>
            </div>

            <div className="rounded-3xl border border-slate-200/70 bg-white/80 p-8 text-left text-sm leading-relaxed text-slate-600 shadow-sm backdrop-blur dark:border-slate-800/70 dark:bg-slate-900/60 dark:text-slate-300">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                What Data We Access and Why
              </h2>

              <h3 className="text-base font-semibold text-slate-900 dark:text-white mt-4 mb-2">
                Identity Information
              </h3>
              <ul className="list-disc list-inside space-y-2 mb-4 ml-4">
                <li>
                  <strong>LinkedIn Member ID</strong> — Required to construct
                  author URNs (urn:li:person:...) for publishing posts.
                  Retrieved via OpenID Connect /userinfo endpoint.
                </li>
                <li>
                  <strong>Basic Profile Fields</strong> — Name and profile
                  picture URL, displayed in our UI to show which LinkedIn
                  account is connected.
                </li>
              </ul>

              <h3 className="text-base font-semibold text-slate-900 dark:text-white mt-4 mb-2">
                Content Data
              </h3>
              <ul className="list-disc list-inside space-y-2 mb-4 ml-4">
                <li>
                  <strong>Post Content</strong> — Text content you draft in
                  Linkedbud and choose to publish to LinkedIn. This is your
                  content, not data we scrape from LinkedIn.
                </li>
                <li>
                  <strong>LinkedIn Post IDs</strong> — Unique identifiers
                  returned by LinkedIn when posts are published. We store these
                  to fetch analytics and display post status.
                </li>
              </ul>

              <h3 className="text-base font-semibold text-slate-900 dark:text-white mt-4 mb-2">
                Organization Data
              </h3>
              <ul className="list-disc list-inside space-y-2 mb-4 ml-4">
                <li>
                  <strong>Organization IDs and Names</strong> — For organization
                  pages you administer, we store IDs and display names so you
                  can select which page to post to.
                </li>
              </ul>

              <h3 className="text-base font-semibold text-slate-900 dark:text-white mt-4 mb-2">
                Analytics Data
              </h3>
              <ul className="list-disc list-inside space-y-2 mb-4 ml-4">
                <li>
                  <strong>Post Metrics</strong> — Aggregated performance data:
                  impressions, reactions (likes), comments, shares, clicks,
                  engagement rate, follower counts. This is aggregate data, not
                  individual user viewing behavior.
                </li>
              </ul>

              <p className="mt-4 text-xs text-slate-500 dark:text-slate-400">
                <strong>What We Don&apos;t Access:</strong> We do not access
                your LinkedIn inbox, private messages, connection lists for
                marketing purposes, or email addresses for lead generation. We
                do not scrape LinkedIn profiles or automate viewing of other
                users&apos; profiles.
              </p>
            </div>

            <div className="rounded-3xl border border-slate-200/70 bg-white/80 p-8 text-left text-sm leading-relaxed text-slate-600 shadow-sm backdrop-blur dark:border-slate-800/70 dark:bg-slate-900/60 dark:text-slate-300">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                How Publishing Works
              </h2>
              <p className="mb-4">
                When you create a post in Linkedbud and choose to publish it to
                LinkedIn:
              </p>
              <ol className="list-decimal list-inside space-y-2 mb-4 ml-4">
                <li>
                  We construct a UGC Post request using the LinkedIn UGC Posts
                  API.
                </li>
                <li>
                  For personal posts: We use your LinkedIn member ID to
                  construct an author URN (urn:li:person:{"{id}"}).
                </li>
                <li>
                  For organization posts: We use the organization URN
                  (urn:li:organization:{"{id}"}) for pages you administer.
                </li>
                <li>
                  We send the post content to LinkedIn&apos;s API endpoint:{" "}
                  <code className="bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                    POST https://api.linkedin.com/v2/ugcPosts
                  </code>
                </li>
                <li>
                  LinkedIn returns a post ID, which we store to enable analytics
                  fetching and status tracking.
                </li>
              </ol>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                All publishing is initiated by explicit user action. We do not
                automatically publish content without your consent.
              </p>
            </div>

            <div className="rounded-3xl border border-slate-200/70 bg-white/80 p-8 text-left text-sm leading-relaxed text-slate-600 shadow-sm backdrop-blur dark:border-slate-800/70 dark:bg-slate-900/60 dark:text-slate-300">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                How Analytics Work
              </h2>
              <p className="mb-4">
                We fetch post performance metrics using LinkedIn&apos;s
                analytics APIs:
              </p>
              <ul className="list-disc list-inside space-y-2 mb-4 ml-4">
                <li>
                  <strong>Personal Posts:</strong> Uses the{" "}
                  <code className="bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                    memberCreatorPostAnalytics
                  </code>{" "}
                  endpoint to fetch aggregated metrics (impressions, reactions,
                  comments, shares, members reached).
                </li>
                <li>
                  <strong>Organization Posts:</strong> Uses the{" "}
                  <code className="bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                    organizationalEntityShareStatistics
                  </code>{" "}
                  endpoint to fetch aggregated metrics (impressions, likes,
                  comments, shares, clicks).
                </li>
              </ul>
              <p className="mb-4">
                We store these aggregated metrics in our database to power your
                analytics dashboard. This data represents aggregate counts, not
                individual user viewing behavior.
              </p>
            </div>

            <div className="rounded-3xl border border-slate-200/70 bg-white/80 p-8 text-left text-sm leading-relaxed text-slate-600 shadow-sm backdrop-blur dark:border-slate-800/70 dark:bg-slate-900/60 dark:text-slate-300">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                Data Storage and Security
              </h2>

              <h3 className="text-base font-semibold text-slate-900 dark:text-white mt-4 mb-2">
                Storage
              </h3>
              <p className="mb-4">
                All data is stored in secure, encrypted databases with
                encryption at rest. All API communication uses HTTPS/TLS
                encryption in transit.
              </p>

              <h3 className="text-base font-semibold text-slate-900 dark:text-white mt-4 mb-2">
                What We Store
              </h3>
              <ul className="list-disc list-inside space-y-2 mb-4 ml-4">
                <li>
                  <strong>Access Tokens</strong> — Stored securely in our
                  backend systems, server-side only. Never exposed to
                  client-side code or stored in browser storage.
                </li>
                <li>
                  <strong>Organization Data</strong> — Organization IDs and
                  names that you have access to administer, stored securely for
                  the purpose of enabling organization page posting.
                </li>
                <li>
                  <strong>Post Data</strong> — Your drafted content and LinkedIn
                  post IDs returned by LinkedIn, stored to enable analytics
                  fetching and status tracking.
                </li>
                <li>
                  <strong>Metrics Data</strong> — Aggregated post metrics
                  snapshots stored to power your analytics dashboard and
                  historical reporting.
                </li>
              </ul>

              <h3 className="text-base font-semibold text-slate-900 dark:text-white mt-4 mb-2">
                Security Practices
              </h3>
              <ul className="list-disc list-inside space-y-2 mb-4 ml-4">
                <li>OAuth 2.0 authorization flow (industry standard)</li>
                <li>
                  Access tokens stored server-side only (never in browser
                  cookies, localStorage, or client-side code)
                </li>
                <li>
                  All API requests made server-side through secure backend
                  endpoints
                </li>
                <li>
                  Credentials managed through secure environment configuration
                  (not hardcoded)
                </li>
                <li>
                  Token expiration tracking and user notifications for
                  reconnection
                </li>
              </ul>
            </div>

            <div className="rounded-3xl border border-slate-200/70 bg-white/80 p-8 text-left text-sm leading-relaxed text-slate-600 shadow-sm backdrop-blur dark:border-slate-800/70 dark:bg-slate-900/60 dark:text-slate-300">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                Data Retention and Deletion
              </h2>

              <h3 className="text-base font-semibold text-slate-900 dark:text-white mt-4 mb-2">
                Retention Periods
              </h3>
              <ul className="list-disc list-inside space-y-2 mb-4 ml-4">
                <li>
                  <strong>Access Tokens:</strong> Retained while your LinkedIn
                  integration is active. Deleted immediately when you disconnect
                  LinkedIn or delete your Linkedbud account.
                </li>
                <li>
                  <strong>Organization Data:</strong> Retained while your
                  organization integration is active. Deleted when you
                  disconnect organizations or delete your account.
                </li>
                <li>
                  <strong>Post IDs and Metrics:</strong> Retained to provide
                  historical analytics while your account is active. Deleted
                  upon account deletion or upon your request.
                </li>
                <li>
                  <strong>Draft Content:</strong> Retained while your account is
                  active. Deleted upon account deletion or upon your request.
                </li>
              </ul>

              <h3 className="text-base font-semibold text-slate-900 dark:text-white mt-4 mb-2">
                How to Delete Your Data
              </h3>
              <ul className="list-disc list-inside space-y-2 mb-4 ml-4">
                <li>
                  <strong>In Linkedbud:</strong> Go to Settings → Integrations →
                  Disconnect LinkedIn. This immediately deletes stored access
                  tokens and organization mappings.
                </li>
                <li>
                  <strong>On LinkedIn:</strong> You can revoke Linkedbud&apos;s
                  access at any time via LinkedIn Settings & Privacy → Data
                  privacy → Other applications → Permitted services.
                </li>
                <li>
                  <strong>Account Deletion:</strong> Deleting your Linkedbud
                  account removes all LinkedIn-related data we store (tokens,
                  organization mappings, post IDs, metrics, drafts).
                </li>
              </ul>
            </div>

            <div className="rounded-3xl border border-slate-200/70 bg-white/80 p-8 text-left text-sm leading-relaxed text-slate-600 shadow-sm backdrop-blur dark:border-slate-800/70 dark:bg-slate-900/60 dark:text-slate-300">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                What We Don&apos;t Do
              </h2>
              <p className="mb-4">
                To ensure compliance with LinkedIn&apos;s Terms and best
                practices:
              </p>
              <ul className="list-disc list-inside space-y-2 mb-4 ml-4">
                <li>
                  We do not scrape LinkedIn profiles or automate viewing of
                  profiles
                </li>
                <li>
                  We do not send automated connection requests or messages
                </li>
                <li>
                  We do not harvest contact information for lead generation or
                  CRM enrichment
                </li>
                <li>
                  We do not use LinkedIn data for advertising or retargeting
                </li>
                <li>
                  We do not share LinkedIn data with third parties for marketing
                  purposes
                </li>
              </ul>
            </div>

            <div className="rounded-3xl border border-slate-200/70 bg-white/80 p-8 text-left text-sm leading-relaxed text-slate-600 shadow-sm backdrop-blur dark:border-slate-800/70 dark:bg-slate-900/60 dark:text-slate-300">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                Disclosures
              </h2>
              <p className="mb-4">
                <strong className="text-slate-900 dark:text-white">
                  Powered by LinkedIn API
                </strong>
              </p>
              <p className="mb-4">
                Linkedbud is not affiliated with, endorsed by, or sponsored by
                LinkedIn. LinkedIn, the LinkedIn logo, and related marks are
                trademarks of LinkedIn Corporation.
              </p>
              <p className="mb-4">
                Your use of LinkedIn data through Linkedbud is subject to
                LinkedIn&apos;s Terms of Service and API Terms of Use.
              </p>

              <h3 className="text-base font-semibold text-slate-900 dark:text-white mt-4 mb-2">
                Relevant LinkedIn Policies
              </h3>
              <ul className="list-disc list-inside space-y-2 mb-4 ml-4">
                <li>
                  <a
                    href="https://www.linkedin.com/legal/l/api-terms-of-use"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline dark:text-blue-400"
                  >
                    LinkedIn API Terms of Use
                  </a>
                </li>
                <li>
                  <a
                    href="https://www.linkedin.com/legal/l/marketing-api-terms"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline dark:text-blue-400"
                  >
                    LinkedIn Marketing Developer Platform Terms
                  </a>
                </li>
                <li>
                  <a
                    href="https://brand.linkedin.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline dark:text-blue-400"
                  >
                    LinkedIn Brand Guidelines
                  </a>
                </li>
              </ul>
            </div>

            <div className="rounded-3xl border border-blue-200/70 bg-blue-50/80 p-8 text-left text-sm leading-relaxed text-slate-600 dark:border-blue-800/70 dark:bg-blue-900/20">
              <p className="text-sm text-slate-700 dark:text-slate-300">
                <strong className="text-slate-900 dark:text-white">
                  Questions or Concerns?
                </strong>
              </p>
              <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">
                If you have questions about our LinkedIn API usage or data
                handling practices, please contact us at{" "}
                <a
                  href="mailto:privacy@linkedbud.com"
                  className="text-blue-600 hover:underline dark:text-blue-400"
                >
                  privacy@linkedbud.com
                </a>
                .
              </p>
            </div>

            <div className="pt-4">
              <Link
                href="/privacy"
                className="text-blue-600 hover:underline dark:text-blue-400 text-sm"
              >
                ← Back to Privacy Policy
              </Link>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
