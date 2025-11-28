import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Container } from "@/marketing/components/common";
import { SectionHeader } from "@/marketing/components/ui";
import { Home, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
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
  );
}

