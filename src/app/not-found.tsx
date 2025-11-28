import Link from "next/link";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/marketing/components/site-header";
import { SiteFooter } from "@/marketing/components/site-footer";
import { Container } from "@/marketing/components/common";
import { SectionHeader } from "@/marketing/components/ui";
import { PageWrapper } from "@/components/ui/page-wrapper";
import { AuthenticatedNotFoundContent } from "@/components/not-found-content";
import { AuthenticatedLayoutClient } from "@/app/(authenticated)/authenticated-layout-client";
import { AdminProvider } from "@/contexts/admin-context";
import { getUser } from "@/lib/auth";
import { isAdmin } from "@/lib/admin-auth";
import { Home, ArrowLeft } from "lucide-react";

export default async function NotFound() {
  const user = await getUser();
  const userIsAdmin = user ? await isAdmin(user.id) : false;

  if (user) {
    return (
      <AdminProvider>
        <AuthenticatedLayoutClient>
          <PageWrapper maxWidth="4xl" padding="lg">
            <AuthenticatedNotFoundContent isAdmin={userIsAdmin} />
          </PageWrapper>
        </AuthenticatedLayoutClient>
      </AdminProvider>
    );
  }

  // Show public not-found page for unauthenticated users
  return (
    <div className="relative flex min-h-screen flex-col bg-[radial-gradient(circle_at_top,_rgba(241,245,255,0.7),_rgba(255,255,255,0.95))] text-slate-900 dark:bg-[radial-gradient(circle_at_top,_rgba(2,6,23,0.9),_rgba(15,23,42,0.95))] dark:text-white">
      <SiteHeader />
      <main className="flex-1">
        <div className="relative">
          <section className="pb-24 pt-20 sm:pt-32">
            <Container width="narrow" className="text-center">
              <div className="space-y-12">
                <div className="space-y-6">
                  <h1 className="text-8xl font-bold text-blue-600 dark:text-blue-400 sm:text-9xl">
                    404
                  </h1>
                  <SectionHeader
                    align="center"
                    as="h2"
                    title="Page Not Found"
                    description="Sorry, we couldn't find the page you're looking for. The page might have been moved, deleted, or doesn't exist."
                  />
                </div>

                <div className="flex flex-col items-center justify-center gap-4 sm:flex-row sm:items-center">
                  <Button
                    asChild
                    size="lg"
                    className="h-12 rounded-md px-8 text-base bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                  >
                    <Link href="/">
                      <Home className="mr-2 h-4 w-4" />
                      Go Home
                    </Link>
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    size="lg"
                    className="h-12 rounded-md px-8 text-base border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:hover:bg-slate-900"
                  >
                    <Link href="/auth/signin">
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Sign In
                    </Link>
                  </Button>
                </div>

                <div className="pt-4">
                  <p className="text-sm text-slate-500 dark:text-slate-500">
                    Need help?{" "}
                    <Link
                      href="/about"
                      className="text-blue-600 hover:underline dark:text-blue-400"
                    >
                      Contact us
                    </Link>
                  </p>
                </div>
              </div>
            </Container>
          </section>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
