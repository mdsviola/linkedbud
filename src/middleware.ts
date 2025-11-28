import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function middleware(request: NextRequest) {
  // Skip middleware for API routes
  if (request.nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          request.cookies.set({
            name,
            value,
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: any) {
          request.cookies.set({
            name,
            value: "",
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value: "",
            ...options,
          });
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    // Check if user is admin
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    const isAdmin = profile?.role === "admin";

    // Redirect authenticated users from landing page to appropriate dashboard
    if (request.nextUrl.pathname === "/") {
      if (isAdmin) {
        return NextResponse.redirect(new URL("/admin", request.url));
      } else {
        return NextResponse.redirect(new URL("/dashboard", request.url));
      }
    }

    // Redirect authenticated users away from auth pages
    // Exception: allow access to reset-password page (needed for password reset flow)
    if (request.nextUrl.pathname.startsWith("/auth/") && request.nextUrl.pathname !== "/auth/reset-password") {
      if (isAdmin) {
        return NextResponse.redirect(new URL("/admin", request.url));
      } else {
        return NextResponse.redirect(new URL("/dashboard", request.url));
      }
    }

    // Define public routes that authenticated users should not access
    const publicRoutes = [
      "/about",
      "/comparison",
      "/faq",
      "/features",
      "/pricing",
      "/privacy",
      "/try-free",
      "/legal",
    ];

    // Redirect authenticated users away from public pages
    const isPublicRoute = publicRoutes.some((route) =>
      request.nextUrl.pathname.startsWith(route)
    );
    // Exception: allow access to invite accept pages (needed for collaboration invites)
    const isInviteAcceptRoute = request.nextUrl.pathname.startsWith("/invite/accept");
    if (isPublicRoute && !isInviteAcceptRoute) {
      if (isAdmin) {
        return NextResponse.redirect(new URL("/admin", request.url));
      } else {
        return NextResponse.redirect(new URL("/dashboard", request.url));
      }
    }

    // Define regular user routes that admins should not access
    const regularUserRoutes = [
      "/dashboard",
      "/articles",
      "/posts",
      "/settings",
      "/subscription",
      "/pricing",
    ];

    // Redirect admin users away from regular user routes to admin dashboard
    const isRegularUserRoute = regularUserRoutes.some((route) =>
      request.nextUrl.pathname.startsWith(route)
    );
    if (isAdmin && isRegularUserRoute) {
      return NextResponse.redirect(new URL("/admin", request.url));
    }

    // Don't redirect users from /onboarding
    if (request.nextUrl.pathname === "/onboarding") {
      return NextResponse.next();
    }

    // Redirect regular users away from admin routes to dashboard
    if (!isAdmin && request.nextUrl.pathname.startsWith("/admin")) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
