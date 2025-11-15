import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Client-side Supabase client
export const createClientClient = () => {
  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}

// Legacy client for backward compatibility
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey)

