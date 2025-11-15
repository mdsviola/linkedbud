"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Container, SiteLogo } from "@/marketing/components/common";
import { ThemeToggle } from "./theme-toggle";
import { NAV_LINKS } from "@/marketing/data/navigation";

export function SiteHeader() {
  const [open, setOpen] = useState(false);

  const handleNav = () => setOpen((prev) => !prev);

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
      <Container className="flex h-20 items-center justify-between">
        <SiteLogo />

        <nav className="hidden items-center gap-10 text-sm font-medium text-slate-600 dark:text-slate-300 md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="transition hover:text-slate-900 dark:hover:text-white"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <ThemeToggle />
          <Button asChild variant="ghost" className="text-sm">
            <Link href="/auth/signin">Sign in</Link>
          </Button>
          <Button asChild className="text-sm">
            <Link href="/try-free">Try Free</Link>
          </Button>
        </div>

        <div className="flex items-center gap-3 md:hidden">
          <ThemeToggle />
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={handleNav}
            type="button"
            aria-label="Toggle navigation menu"
            className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-700 shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </motion.button>
        </div>
      </Container>

      <AnimatePresence>
        {open && (
          <motion.nav
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="border-y border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 md:hidden"
          >
            <Container className="flex flex-col gap-2 py-6 text-base font-medium text-slate-600 dark:text-slate-300">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="rounded-lg px-2 py-2 transition hover:bg-slate-100/60 hover:text-slate-900 dark:hover:bg-slate-800/60 dark:hover:text-white"
                >
                  {link.label}
                </Link>
              ))}
              <Link
                href="/auth/signin"
                onClick={() => setOpen(false)}
                className="rounded-lg px-2 py-2 transition hover:bg-slate-100/60 hover:text-slate-900 dark:hover:bg-slate-800/60 dark:hover:text-white"
              >
                Sign in
              </Link>
              <Link
                href="/try-free"
                onClick={() => setOpen(false)}
                className="rounded-lg bg-blue-600 px-2 py-3 text-center text-white shadow-sm transition hover:bg-blue-700"
              >
                Try Free
              </Link>
            </Container>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}

