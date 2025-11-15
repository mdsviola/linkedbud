import Link from "next/link";
import { Linkedin, X } from "lucide-react";

import { Container, SiteLogo } from "@/marketing/components/common";
import { FOOTER_LINKS, COMPARISON_LINKS } from "@/marketing/data/navigation";

export function SiteFooter() {
  return (
    <footer className="border-t border-slate-200 bg-white py-10 dark:border-slate-800 dark:bg-slate-950">
      <Container className="grid gap-8 text-sm text-slate-600 dark:text-slate-400 md:grid-cols-[auto,1fr] md:items-center">
        <div>
          <SiteLogo />
          <p className="mt-3 max-w-xs text-sm text-slate-600 dark:text-slate-400">
            LinkedIn-native workflows that help you ideate, create, and schedule posts with confidence.
          </p>
        </div>

        <div className="flex flex-col-reverse justify-between gap-6 md:flex-row md:items-start">
          <div className="flex flex-col gap-6">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-500">
                Company
              </p>
              <nav className="flex flex-wrap items-center gap-x-6 gap-y-3">
                {FOOTER_LINKS.map((link) => {
                  const isExternal = link.href.startsWith("http") || link.href.startsWith("mailto:");
                  return isExternal ? (
                    <a
                      key={link.href}
                      href={link.href}
                      className="transition hover:text-slate-900 dark:hover:text-white"
                    >
                      {link.label}
                    </a>
                  ) : (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="transition hover:text-slate-900 dark:hover:text-white"
                    >
                      {link.label}
                    </Link>
                  );
                })}
              </nav>
            </div>
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-500">
                Comparisons
              </p>
              <nav className="flex flex-wrap items-center gap-x-6 gap-y-2">
                {COMPARISON_LINKS.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="text-xs transition hover:text-slate-900 dark:hover:text-white"
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
            </div>
          </div>
          <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
            <Link
              href="https://www.linkedin.com"
              aria-label="Linkedbud on LinkedIn"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600 transition hover:border-primary hover:text-primary dark:border-slate-800 dark:bg-slate-800 dark:text-slate-200"
            >
              <Linkedin className="h-4 w-4" />
            </Link>
            <Link
              href="https://x.com"
              aria-label="Linkedbud on X"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600 transition hover:border-primary hover:text-primary dark:border-slate-800 dark:bg-slate-800 dark:text-slate-200"
            >
              <X className="h-4 w-4" />
            </Link>
          </div>
        </div>

        <p className="text-xs text-slate-600 dark:text-slate-400 md:col-span-2">
          © {new Date().getFullYear()} Linkedbud. Crafted for creators who live on LinkedIn.
        </p>
      </Container>
    </footer>
  );
}

