import { ReactNode } from "react";
import { SiteFooter } from "@/marketing/components/site-footer";
import { SiteHeader } from "@/marketing/components/site-header";

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex min-h-screen flex-col bg-[radial-gradient(circle_at_top,_rgba(241,245,255,0.7),_rgba(255,255,255,0.95))] text-slate-900 dark:bg-[radial-gradient(circle_at_top,_rgba(2,6,23,0.9),_rgba(15,23,42,0.95))] dark:text-white">
      {/* Analytics snippet placeholder */}
      {/* <script defer src="https://analytics.linkedbud.com/script.js" data-website-id="..." /> */}
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  );
}

