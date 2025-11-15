/**
 * SEO Schema Utilities
 * Helper functions for generating JSON-LD structured data schemas
 */

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://linkedbud.com";

export interface OrganizationSchema {
  "@context": string;
  "@type": "Organization";
  name: string;
  url: string;
  logo?: string;
  description?: string;
  contactPoint?: {
    "@type": "ContactPoint";
    contactType: string;
    email?: string;
  };
  sameAs?: string[];
}

export interface SoftwareApplicationSchema {
  "@context": string;
  "@type": "SoftwareApplication";
  name: string;
  description: string;
  url: string;
  applicationCategory: string;
  operatingSystem: string;
  offers?: {
    "@type": "Offer";
    price: string;
    priceCurrency: string;
  };
  aggregateRating?: {
    "@type": "AggregateRating";
    ratingValue: string;
    ratingCount: string;
  };
}

export interface FAQPageSchema {
  "@context": string;
  "@type": "FAQPage";
  mainEntity: Array<{
    "@type": "Question";
    name: string;
    acceptedAnswer: {
      "@type": "Answer";
      text: string;
    };
  }>;
}

export interface WebPageSchema {
  "@context": string;
  "@type": "WebPage";
  name: string;
  description: string;
  url: string;
  inLanguage: string;
  image?: string | {
    "@type": "ImageObject";
    url: string;
    width?: number;
    height?: number;
  };
  isPartOf?: {
    "@type": "WebSite";
    name: string;
    url: string;
  };
}

export interface ProductSchema {
  "@context": string;
  "@type": "Product";
  name: string;
  description: string;
  url: string;
  offers: {
    "@type": "AggregateOffer";
    offerCount: number;
    lowPrice: string;
    highPrice: string;
    priceCurrency: string;
  };
}

export interface WebSiteSchema {
  "@context": string;
  "@type": "WebSite";
  name: string;
  url: string;
  description?: string;
  potentialAction?: {
    "@type": "SearchAction";
    target: {
      "@type": "EntryPoint";
      urlTemplate: string;
    };
    "query-input": string;
  };
}

export interface BreadcrumbListSchema {
  "@context": string;
  "@type": "BreadcrumbList";
  itemListElement: Array<{
    "@type": "ListItem";
    position: number;
    name: string;
    item?: string;
  }>;
}

/**
 * Generate Organization JSON-LD schema
 */
export function generateOrganizationSchema(
  overrides?: Partial<OrganizationSchema>
): OrganizationSchema {
  // Allow sameAs to be passed via overrides, or use empty array as default
  const defaultSameAs: string[] = [];

  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Linkedbud",
    url: baseUrl,
    // Use a square logo for Organization schema (favicon/icon, not the OG image)
    logo: `${baseUrl}/android-chrome-192x192.png`,
    description:
      "AI-powered LinkedIn assistant for teams who want to ideate, create, and schedule standout posts in record time.",
    sameAs: defaultSameAs,
    ...overrides,
  };
}

/**
 * Generate SoftwareApplication JSON-LD schema
 */
export function generateSoftwareApplicationSchema(
  overrides?: Partial<SoftwareApplicationSchema>
): SoftwareApplicationSchema {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Linkedbud",
    description:
      "AI-powered LinkedIn assistant that helps you ideate, craft, and schedule powerful LinkedIn content with AI guidance and insight-rich analytics.",
    url: baseUrl,
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    ...overrides,
  };
}

/**
 * Generate FAQPage JSON-LD schema from FAQ items
 */
export function generateFAQPageSchema(
  faqItems: Array<{ question: string; answer: string }>
): FAQPageSchema {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqItems.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}

/**
 * Generate WebPage JSON-LD schema
 */
export function generateWebPageSchema(
  name: string,
  description: string,
  url: string,
  options?: {
    image?: string | {
      url: string;
      width?: number;
      height?: number;
    };
    overrides?: Partial<WebPageSchema>;
  }
): WebPageSchema {
  const image = options?.image
    ? typeof options.image === "string"
      ? options.image
      : {
          "@type": "ImageObject" as const,
          url: options.image.url,
          ...(options.image.width && { width: options.image.width }),
          ...(options.image.height && { height: options.image.height }),
        }
    : undefined;

  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name,
    description,
    url,
    inLanguage: "en-US",
    ...(image && { image }),
    isPartOf: {
      "@type": "WebSite",
      name: "Linkedbud",
      url: baseUrl,
    },
    ...options?.overrides,
  };
}

/**
 * Generate Product JSON-LD schema with pricing tiers
 */
export function generateProductSchema(
  name: string,
  description: string,
  url: string,
  pricingTiers: Array<{ price: number; currency?: string }>
): ProductSchema {
  const prices = pricingTiers.map((tier) => tier.price);
  const currency = pricingTiers[0]?.currency || "USD";

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name,
    description,
    url,
    offers: {
      "@type": "AggregateOffer",
      offerCount: pricingTiers.length,
      lowPrice: Math.min(...prices).toString(),
      highPrice: Math.max(...prices).toString(),
      priceCurrency: currency,
    },
  };
}

/**
 * Generate WebSite JSON-LD schema with search action
 */
export function generateWebSiteSchema(
  overrides?: Partial<WebSiteSchema>
): WebSiteSchema {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Linkedbud",
    url: baseUrl,
    description:
      "AI-powered LinkedIn assistant for teams who want to ideate, create, and schedule standout posts in record time.",
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${baseUrl}/?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
    ...overrides,
  };
}

/**
 * Generate BreadcrumbList JSON-LD schema
 */
export function generateBreadcrumbListSchema(
  items: Array<{ name: string; url?: string }>
): BreadcrumbListSchema {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      ...(item.url && { item: item.url }),
    })),
  };
}

/**
 * Render JSON-LD script tag
 */
export function renderJsonLdScript(schema: object): string {
  return JSON.stringify(schema, null, 2);
}
