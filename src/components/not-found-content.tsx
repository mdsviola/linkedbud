import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PageTitle } from "@/components/ui/page-title";
import { PageDescription } from "@/components/ui/page-description";
import { Home, ArrowLeft } from "lucide-react";

interface NotFoundContentProps {
  isAdmin?: boolean;
}

export function AuthenticatedNotFoundContent({ isAdmin = false }: NotFoundContentProps) {
  return (
    <div className="flex min-h-[calc(100vh-12rem)] flex-col items-center justify-center">
      <div className="w-full max-w-2xl space-y-8 text-center">
        <div className="space-y-6">
          <h1 className="text-8xl font-bold text-blue-600 dark:text-blue-400 sm:text-9xl">
            404
          </h1>
          <div className="space-y-2">
            <PageTitle className="text-3xl sm:text-4xl">Page Not Found</PageTitle>
            <PageDescription className="mx-auto max-w-xl text-base">
              The page you&apos;re looking for doesn&apos;t exist or has been moved. Let&apos;s get you back to your dashboard.
            </PageDescription>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Button asChild size="lg" className="h-12 px-8">
            <Link href={isAdmin ? "/admin" : "/dashboard"}>
              <Home className="mr-2 h-4 w-4" />
              Go to {isAdmin ? "Admin " : ""}Dashboard
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="h-12 px-8">
            <Link href={isAdmin ? "/admin/users" : "/posts"}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              {isAdmin ? "View Users" : "View Posts"}
            </Link>
          </Button>
        </div>

        <div className="pt-4">
          <p className="text-sm text-gray-500">
            If you believe this is an error, please{" "}
            <Link
              href={isAdmin ? "/admin" : "/settings"}
              className="text-blue-600 hover:underline dark:text-blue-400"
            >
              contact support
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

