import { createReadOnlyServerClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'

export async function requireAdmin() {
  const supabase = createReadOnlyServerClient()
  
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    redirect('/auth/signin')
  }

  // Check if user has admin role
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profileError || !profile || profile.role !== 'admin') {
    redirect('/dashboard')
  }

  return user
}

export async function isAdmin(userId: string): Promise<boolean> {
  const supabase = createReadOnlyServerClient()
  
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single()

  return !error && profile?.role === 'admin'
}
