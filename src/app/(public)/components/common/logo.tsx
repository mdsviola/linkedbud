import Link from "next/link";

type SiteLogoProps = {
  withLabel?: boolean;
  href?: string;
};

// SiteLogo renders the linkedbud text with optional link.
export function SiteLogo({ withLabel = true, href = "/" }: SiteLogoProps) {
  const label = (
    <span className="text-xl font-bold text-gray-900 dark:text-gray-100">
      {withLabel ? "linkedbud" : null}
    </span>
  );

  return href ? <Link href={href}>{label}</Link> : label;
}

