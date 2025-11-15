import { createClient } from "@supabase/supabase-js";
import { createServerClient as createSSRServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Server-side Supabase client with service role
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Server component client (read-only for server components)
export const createServerClient = () => {
  const cookieStore = cookies();

  return createSSRServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      set(name: string, value: string, options: any) {
        // Only allow cookie modification in Route Handlers and Server Actions
        // This will throw an error if called from server components
        cookieStore.set({ name, value, ...options });
      },
      remove(name: string, options: any) {
        // Only allow cookie modification in Route Handlers and Server Actions
        // This will throw an error if called from server components
        cookieStore.set({ name, value: "", ...options });
      },
    },
  });
};

// Read-only server client for server components (no cookie modification)
export const createReadOnlyServerClient = () => {
  const cookieStore = cookies();

  return createSSRServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      set() {
        // No-op for read-only client
      },
      remove() {
        // No-op for read-only client
      },
    },
  });
};

// API route client (for use in API routes)
export const createAPIClient = () => {
  return createClient(supabaseUrl, supabaseAnonKey);
};

// API route client with request cookies (for authentication in API routes)
export const createAPIClientWithCookies = (request: Request) => {
  const cookieStore = new Map();

  // Extract cookies from the request
  const cookieHeader = request.headers.get("cookie");
  if (cookieHeader) {
    cookieHeader.split(";").forEach((cookie) => {
      const [name, value] = cookie.trim().split("=");
      if (name && value) {
        cookieStore.set(name, value);
      }
    });
  }

  return createSSRServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name);
      },
      set() {
        // No-op for API routes
      },
      remove() {
        // No-op for API routes
      },
    },
  });
};
