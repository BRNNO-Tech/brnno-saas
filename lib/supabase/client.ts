import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // Provide fallback empty strings during build if env vars are missing
  // They will be set at runtime in Vercel
  return createBrowserClient(
    supabaseUrl || '',
    supabaseAnonKey || ''
  )
}

