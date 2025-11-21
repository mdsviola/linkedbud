import type { Metadata } from "next";
import Script from "next/script";
import Link from "next/link";
import React from "react";
import { formatDateOnly } from "@/lib/utils";
import {
  generateOrganizationSchema,
  generateWebPageSchema,
} from "@/lib/seo/schemas";

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://linkedbud.com";

export const metadata: Metadata = {
  title: "Privacy Policy | linkedbud",
  description:
    "linkedbud's privacy policy covering data collection, usage, security, and your rights. Learn how we protect your personal information and comply with GDPR and other privacy regulations.",
  keywords: [
    "linkedbud privacy policy",
    "data security",
    "privacy compliance",
    "GDPR compliance",
    "data protection",
  ],
  openGraph: {
    title: "Privacy Policy | linkedbud",
    description:
      "linkedbud's privacy policy covering data collection, usage, security, and your rights.",
    url: `${baseUrl}/privacy`,
    type: "website",
    locale: "en_US",
    siteName: "linkedbud",
    images: [
      {
        url: `${baseUrl}/og-image.png`,
        width: 1200,
        height: 630,
        alt: "linkedbud Privacy Policy",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Privacy Policy | linkedbud",
    description:
      "linkedbud's privacy policy covering data collection, usage, security, and your rights.",
    images: [`${baseUrl}/og-image.png`],
  },
  alternates: {
    canonical: `${baseUrl}/privacy`,
  },
};

type Section = {
  title: string;
  content: string | React.ReactNode;
};

const sections: Section[] = [
  {
    title: "1. Information We Collect",
    content: (
      <>
        <p className="mb-4">
          We collect information you provide directly to us, information from
          third-party services you connect, and technical information about your
          use of our service.
        </p>
        <h4 className="font-semibold text-slate-900 dark:text-white mb-2 mt-4">
          Account Information
        </h4>
        <p className="mb-4">
          When you create an linkedbud account, we collect your email address,
          name, and password. We use this information to create and manage your
          account, authenticate you, and communicate with you about our
          services.
        </p>
        <h4 className="font-semibold text-slate-900 dark:text-white mb-2 mt-4">
          Content and Workspace Data
        </h4>
        <p className="mb-4">
          We store content you create within linkedbud, including draft posts,
          scheduled content, preferences, and settings. This data is stored to
          provide our core functionality and allow you to access your work
          across devices.
        </p>
        <h4 className="font-semibold text-slate-900 dark:text-white mb-2 mt-4">
          Third-Party Service Data
        </h4>
        <p className="mb-4">
          When you connect third-party social media accounts to linkedbud, we
          access and store information necessary to provide our services, such
          as account identifiers, profile information, and content you authorize
          us to publish. This data is accessed only with your explicit consent
          through the third-party service&apos;s authorization process.
        </p>
        <h4 className="font-semibold text-slate-900 dark:text-white mb-2 mt-4">
          Usage and Technical Information
        </h4>
        <p className="mb-4">
          We automatically collect information about how you use linkedbud,
          including device information, IP address, browser type, and usage
          patterns. We use this data to improve our services, diagnose technical
          issues, and ensure security.
        </p>
        <h4 className="font-semibold text-slate-900 dark:text-white mb-2 mt-4">
          Payment Information
        </h4>
        <p className="mb-4">
          Payment processing is handled by third-party payment processors
          (LemonSqueezy). We do not store your full payment card details. We
          only receive and store payment confirmation and subscription status
          information.
        </p>
      </>
    ),
  },
  {
    title: "2. How We Use Your Information",
    content: (
      <>
        <p className="mb-4">We use the information we collect to:</p>
        <ul className="list-disc list-inside space-y-2 mb-4 ml-4">
          <li>Provide, maintain, and improve our services</li>
          <li>Process your transactions and manage your subscription</li>
          <li>
            Send you service-related communications, including updates, security
            alerts, and support messages
          </li>
          <li>Respond to your inquiries and provide customer support</li>
          <li>
            Detect, prevent, and address technical issues and security threats
          </li>
          <li>
            Comply with legal obligations and enforce our terms of service
          </li>
          <li>
            Analyze usage patterns to improve our service quality and user
            experience
          </li>
        </ul>
        <p className="mb-4 text-xs text-slate-500 dark:text-slate-400">
          We do not use your information for advertising purposes, nor do we
          sell your personal data to third parties.
        </p>
      </>
    ),
  },
  {
    title: "3. Data Sharing and Disclosure",
    content: (
      <>
        <p className="mb-4">
          We do not sell, trade, or rent your personal information to third
          parties. We share your information only in the following
          circumstances:
        </p>
        <h4 className="font-semibold text-slate-900 dark:text-white mb-2 mt-4">
          Service Providers
        </h4>
        <p className="mb-4">
          We work with trusted service providers who assist us in operating our
          service, such as hosting providers (Supabase, Vercel), payment
          processors (LemonSqueezy), and email services (Resend). These
          providers are contractually obligated to protect your information and
          use it only for the purposes we specify.
        </p>
        <h4 className="font-semibold text-slate-900 dark:text-white mb-2 mt-4">
          Legal Requirements
        </h4>
        <p className="mb-4">
          We may disclose your information if required by law, court order, or
          government regulation, or if we believe disclosure is necessary to
          protect our rights, your safety, or the safety of others.
        </p>
        <h4 className="font-semibold text-slate-900 dark:text-white mb-2 mt-4">
          Business Transfers
        </h4>
        <p className="mb-4">
          In the event of a merger, acquisition, or sale of assets, your
          information may be transferred as part of that transaction. We will
          notify you of any such change in ownership or control of your
          information.
        </p>
        <h4 className="font-semibold text-slate-900 dark:text-white mb-2 mt-4">
          With Your Consent
        </h4>
        <p className="mb-4">
          We may share your information with third parties when you have given
          us explicit consent to do so.
        </p>
      </>
    ),
  },
  {
    title: "4. Data Security",
    content: (
      <>
        <p className="mb-4">
          We implement industry-standard security measures to protect your
          personal information:
        </p>
        <ul className="list-disc list-inside space-y-2 mb-4 ml-4">
          <li>
            <strong>Encryption:</strong> All data is encrypted in transit using
            HTTPS/TLS and encrypted at rest in our databases
          </li>
          <li>
            <strong>Access Controls:</strong> Access to personal data is
            restricted to authorized personnel who need it to perform their job
            duties
          </li>
          <li>
            <strong>Authentication:</strong> Secure authentication mechanisms
            protect your account
          </li>
          <li>
            <strong>Regular Security Reviews:</strong> We conduct regular
            security assessments and updates
          </li>
          <li>
            <strong>Infrastructure:</strong> We rely on trusted cloud providers
            with strong security practices
          </li>
        </ul>
        <p className="mb-4 text-xs text-slate-500 dark:text-slate-400">
          While we strive to protect your information, no method of transmission
          over the internet or electronic storage is 100% secure. We cannot
          guarantee absolute security, but we work diligently to protect your
          data.
        </p>
      </>
    ),
  },
  {
    title: "5. Data Retention",
    content: (
      <>
        <p className="mb-4">
          We retain your personal information for as long as necessary to
          provide our services and fulfill the purposes outlined in this privacy
          policy, unless a longer retention period is required by law.
        </p>
        <ul className="list-disc list-inside space-y-2 mb-4 ml-4">
          <li>
            <strong>Account Data:</strong> Retained while your account is active
            and for a reasonable period after account closure to comply with
            legal obligations
          </li>
          <li>
            <strong>Content Data:</strong> Retained while your account is
            active. You can delete your content at any time
          </li>
          <li>
            <strong>Third-Party Service Data:</strong> Deleted immediately upon
            disconnection of the third-party service or account deletion
          </li>
          <li>
            <strong>Usage Data:</strong> Aggregated and anonymized usage data
            may be retained indefinitely for analytics purposes
          </li>
        </ul>
        <p className="mb-4">
          When you delete your account, we will delete or anonymize your
          personal information within 30 days, except where we are required to
          retain it for legal purposes.
        </p>
      </>
    ),
  },
  {
    title: "6. Your Rights and Choices",
    content: (
      <>
        <p className="mb-4">
          Depending on your location, you may have the following rights
          regarding your personal information:
        </p>
        <ul className="list-disc list-inside space-y-2 mb-4 ml-4">
          <li>
            <strong>Access:</strong> Request access to your personal information
            we hold
          </li>
          <li>
            <strong>Correction:</strong> Request correction of inaccurate or
            incomplete information
          </li>
          <li>
            <strong>Deletion:</strong> Request deletion of your personal
            information (subject to legal retention requirements)
          </li>
          <li>
            <strong>Portability:</strong> Request a copy of your data in a
            structured, machine-readable format
          </li>
          <li>
            <strong>Restriction:</strong> Request restriction of processing of
            your personal information
          </li>
          <li>
            <strong>Objection:</strong> Object to processing of your personal
            information for certain purposes
          </li>
          <li>
            <strong>Withdraw Consent:</strong> Withdraw consent where processing
            is based on consent
          </li>
        </ul>
        <p className="mb-4">
          To exercise these rights, please contact us at{" "}
          <a
            href="mailto:privacy@linkedbud.com"
            className="text-blue-600 hover:underline dark:text-blue-400"
          >
            privacy@linkedbud.com
          </a>
          . We will respond to your request within 30 days.
        </p>
        <p className="mb-4">
          You can also manage much of your information directly through your
          linkedbud account settings, including disconnecting third-party
          services and deleting your content.
        </p>
      </>
    ),
  },
  {
    title: "7. International Data Transfers",
    content: (
      <>
        <p className="mb-4">
          Your information may be transferred to and processed in countries
          other than your country of residence. These countries may have data
          protection laws that differ from those in your country.
        </p>
        <p className="mb-4">
          When we transfer your information internationally, we implement
          appropriate safeguards, including:
        </p>
        <ul className="list-disc list-inside space-y-2 mb-4 ml-4">
          <li>
            Standard contractual clauses approved by relevant data protection
            authorities
          </li>
          <li>
            Ensuring the receiving country has adequate data protection laws
          </li>
          <li>Other legally recognized transfer mechanisms</li>
        </ul>
        <p className="mb-4">
          By using our service, you consent to the transfer of your information
          as described in this policy.
        </p>
      </>
    ),
  },
  {
    title: "8. Children's Privacy",
    content: (
      <>
        <p className="mb-4">
          linkedbud is not intended for children under the age of 18. We do not
          knowingly collect personal information from children under 18. If we
          become aware that we have collected personal information from a child
          under 18, we will take steps to delete such information promptly.
        </p>
        <p className="mb-4">
          If you are a parent or guardian and believe your child has provided us
          with personal information, please contact us at{" "}
          <a
            href="mailto:privacy@linkedbud.com"
            className="text-blue-600 hover:underline dark:text-blue-400"
          >
            privacy@linkedbud.com
          </a>
          .
        </p>
      </>
    ),
  },
  {
    title: "9. Changes to This Privacy Policy",
    content: (
      <>
        <p className="mb-4">
          We may update this privacy policy from time to time to reflect changes
          in our practices, technology, legal requirements, or other factors.
          When we make changes, we will:
        </p>
        <ul className="list-disc list-inside space-y-2 mb-4 ml-4">
          <li>
            Update the &quot;Last Updated&quot; date at the top of this policy
          </li>
          <li>
            Notify you of material changes by email or through a prominent
            notice in our service
          </li>
          <li>Post the updated policy on this page</li>
        </ul>
        <p className="mb-4">
          Your continued use of our service after changes become effective
          constitutes acceptance of the updated policy. If you do not agree with
          the changes, you may delete your account and stop using our service.
        </p>
      </>
    ),
  },
  {
    title: "10. Contact Us",
    content: (
      <>
        <p className="mb-4">
          If you have questions, concerns, or requests regarding this privacy
          policy or our data practices, please contact us:
        </p>
        <p className="mb-4">
          <strong>Email:</strong>{" "}
          <a
            href="mailto:privacy@linkedbud.com"
            className="text-blue-600 hover:underline dark:text-blue-400"
          >
            privacy@linkedbud.com
          </a>
        </p>
        <p className="mb-4">
          <strong>Data Controller:</strong> linkedbud
        </p>
        <p className="mb-4">
          If you are located in the European Economic Area (EEA) or United
          Kingdom, you also have the right to lodge a complaint with your local
          data protection authority.
        </p>
      </>
    ),
  },
];

export default function PrivacyPage() {
  const organizationSchema = generateOrganizationSchema({
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "Privacy",
      email: "privacy@linkedbud.com",
    },
  });

  const webPageSchema = generateWebPageSchema(
    "Privacy Policy | linkedbud",
    "linkedbud's privacy policy covering data collection, usage, security, and your rights.",
    `${baseUrl}/privacy`
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
        id="privacy-page-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(webPageSchema),
        }}
      />
      <div className="relative">
        <section className="pb-10 pt-20">
          <div className="mx-auto max-w-3xl px-6 text-center lg:px-8">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-blue-500 dark:text-sky-400">
              Privacy Policy
            </p>
            <h1 className="mt-6 text-4xl font-semibold text-slate-900 sm:text-5xl dark:text-white">
              Your trust matters to us.
            </h1>
            <p className="mt-6 text-base leading-relaxed text-slate-600 dark:text-slate-300">
              This privacy policy explains how linkedbud collects, uses, stores,
              and protects your personal information. We are committed to
              transparency and protecting your privacy.
            </p>
            <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
              <strong>Last Updated:</strong>{" "}
              {formatDateOnly(new Date(), "long")}
            </p>
          </div>
        </section>

        <section className="pb-20">
          <div className="mx-auto max-w-4xl space-y-8 px-6 lg:px-8">
            {sections.map((section) => (
              <div
                key={section.title}
                className="rounded-3xl border border-slate-200/70 bg-white/80 p-8 text-left text-sm leading-relaxed text-slate-600 shadow-sm backdrop-blur dark:border-slate-800/70 dark:bg-slate-900/60 dark:text-slate-300"
              >
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                  {section.title}
                </h2>
                {typeof section.content === "string" ? (
                  <p className="mt-3">{section.content}</p>
                ) : (
                  section.content
                )}
              </div>
            ))}

            {/* Third-Party API Addendum Section */}
            <div className="rounded-3xl border border-blue-200/70 bg-blue-50/80 p-8 text-left text-sm leading-relaxed text-slate-600 shadow-sm backdrop-blur dark:border-blue-800/70 dark:bg-blue-900/20">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                11. Third-Party Service Integration Addendum
              </h2>
              <p className="mb-4">
                This section provides additional details about how linkedbud
                processes personal data obtained through third-party social
                media platform APIs (including but not limited to
                LinkedIn&apos;s APIs). This supplements our general privacy
                policy above and provides specific information required for
                compliance with third-party platform terms.
              </p>

              <h3 className="text-base font-semibold text-slate-900 dark:text-white mt-4 mb-2">
                Data Controller and Contact
              </h3>
              <p className="mb-4">
                <strong>Data Controller:</strong> linkedbud
                <br />
                <strong>Contact for Data Protection Inquiries:</strong>{" "}
                <a
                  href="mailto:privacy@linkedbud.com"
                  className="text-blue-600 hover:underline dark:text-blue-400"
                >
                  privacy@linkedbud.com
                </a>
              </p>

              <h3 className="text-base font-semibold text-slate-900 dark:text-white mt-4 mb-2">
                Data Collected from LinkedIn
              </h3>
              <ul className="list-disc list-inside space-y-2 mb-4 ml-4">
                <li>
                  <strong>Identity Information:</strong> LinkedIn Member ID (via
                  OpenID Connect), basic profile information (name, profile
                  picture) displayed in our UI
                </li>
                <li>
                  <strong>Organization Data:</strong> Organization IDs and names
                  for organization pages you administer
                </li>
                <li>
                  <strong>Content:</strong> Post text you draft in linkedbud and
                  choose to publish to LinkedIn, LinkedIn post IDs
                </li>
                <li>
                  <strong>Analytics:</strong> Aggregated post metrics
                  (impressions, reactions/likes, comments, shares, clicks,
                  engagement rate), follower counts
                </li>
              </ul>
              <p className="mb-4 text-xs text-slate-500 dark:text-slate-400">
                <strong>What We Don&apos;t Collect:</strong> We do not collect
                or process private messages, connection lists for marketing
                purposes, or email addresses for lead generation.
              </p>

              <h3 className="text-base font-semibold text-slate-900 dark:text-white mt-4 mb-2">
                Purposes and Legal Bases
              </h3>
              <ul className="list-disc list-inside space-y-2 mb-4 ml-4">
                <li>
                  <strong>Providing Services:</strong> To enable content
                  creation, scheduling, publishing, and analytics features you
                  request (Legal Basis: Performance of a contract — GDPR Article
                  6(1)(b))
                </li>
                <li>
                  <strong>Improving Services:</strong> To maintain and improve
                  the reliability and security of our LinkedIn integration
                  (Legal Basis: Legitimate interests — GDPR Article 6(1)(f))
                </li>
                <li>
                  <strong>Legal Compliance:</strong> To comply with legal
                  obligations and respond to data subject requests (Legal Basis:
                  Legal obligation — GDPR Article 6(1)(c))
                </li>
              </ul>
              <p className="mb-4 text-xs text-slate-500 dark:text-slate-400">
                We do not use LinkedIn data for profiling unrelated to service
                provision, advertising, or lead generation.
              </p>

              <h3 className="text-base font-semibold text-slate-900 dark:text-white mt-4 mb-2">
                Data Storage, Security, and Retention
              </h3>
              <p className="mb-2">
                <strong>Storage:</strong> All LinkedIn-related data is stored in
                Supabase (PostgreSQL) with encryption at rest. All API
                communication uses HTTPS/TLS encryption in transit. Access
                tokens and LinkedIn identifiers are stored server-side only,
                never in client-side code.
              </p>
              <p className="mb-4">
                <strong>Retention:</strong> Access tokens are retained while
                your LinkedIn integration is active, and deleted immediately
                upon disconnect or account deletion. Organization data is
                retained while your organization integration is active. Post IDs
                and aggregated metrics are retained to provide analytics while
                your account is active, and deleted upon account deletion or
                upon your request. Draft content is retained while your account
                is active, and deleted upon account deletion or upon your
                request.
              </p>

              <h3 className="text-base font-semibold text-slate-900 dark:text-white mt-4 mb-2">
                Data Sharing and International Transfers
              </h3>
              <p className="mb-4">
                We do not sell LinkedIn data. We share LinkedIn data only with
                our service providers (hosting and infrastructure providers like
                Supabase and Vercel) who process it on our behalf under data
                processing agreements and appropriate safeguards. If your data
                is transferred internationally, such transfers are safeguarded
                by standard contractual clauses or equivalent mechanisms.
              </p>

              <h3 className="text-base font-semibold text-slate-900 dark:text-white mt-4 mb-2">
                Your Rights (GDPR)
              </h3>
              <p className="mb-4">
                Under GDPR, you have the right to access, rectify, erase,
                restrict processing, object to processing, and data portability
                with respect to your LinkedIn data processed by linkedbud. To
                exercise these rights, contact us at{" "}
                <a
                  href="mailto:privacy@linkedbud.com"
                  className="text-blue-600 hover:underline dark:text-blue-400"
                >
                  privacy@linkedbud.com
                </a>
                . You also have the right to lodge a complaint with your local
                supervisory authority.
              </p>

              <h3 className="text-base font-semibold text-slate-900 dark:text-white mt-4 mb-2">
                Revocation and Deletion
              </h3>
              <p className="mb-4">
                You can revoke linkedbud&apos;s access to your LinkedIn data at
                any time:
              </p>
              <ul className="list-disc list-inside space-y-2 mb-4 ml-4">
                <li>
                  <strong>In linkedbud:</strong> Go to Settings → Integrations →
                  Disconnect LinkedIn. This immediately deletes stored access
                  tokens and organization mappings.
                </li>
                <li>
                  <strong>On LinkedIn:</strong> LinkedIn Settings & Privacy →
                  Data privacy → Other applications → Permitted services →
                  Revoke access for linkedbud.
                </li>
                <li>
                  <strong>Account Deletion:</strong> Deleting your linkedbud
                  account removes all LinkedIn-related data we store (tokens,
                  organization mappings, post IDs, metrics, drafts).
                </li>
              </ul>
              <p className="mb-4 text-xs text-slate-500 dark:text-slate-400">
                <strong>Note:</strong> Deleting data in linkedbud does not
                automatically delete content you have already published to
                LinkedIn. You can remove such content directly on LinkedIn.
              </p>

              <h3 className="text-base font-semibold text-slate-900 dark:text-white mt-4 mb-2">
                Third-Party Terms
              </h3>
              <p className="mb-4">
                Your use of LinkedIn data through linkedbud is also subject to
                LinkedIn&apos;s terms and policies:
              </p>
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

              <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
                <p className="text-sm text-slate-700 dark:text-slate-300">
                  For complete details about our LinkedIn API usage, see our{" "}
                  <Link
                    href="/legal/linkedin-api"
                    className="text-blue-600 hover:underline dark:text-blue-400 font-medium"
                  >
                    LinkedIn API Compliance Documentation
                  </Link>
                  .
                </p>
              </div>
            </div>

            <p className="text-sm text-slate-500 dark:text-slate-400">
              Full legal terms are available upon request. Email
              privacy@linkedbud.com for detailed documentation.
            </p>
          </div>
        </section>
      </div>
    </>
  );
}
