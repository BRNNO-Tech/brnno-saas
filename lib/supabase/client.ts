import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // Validate environment variables at runtime
  if (!supabaseUrl || !supabaseAnonKey) {
    const error = new Error(
      'Missing Supabase environment variables. ' +
      'Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your Vercel project settings.'
    )
    console.error('Supabase Client Error:', error.message)
    throw error // Throw instead of returning invalid client
  }

  // Validate URL format
  try {
    new URL(supabaseUrl)
  } catch {
    console.error('Invalid Supabase URL:', supabaseUrl)
    throw new Error('Invalid Supabase URL format')
  }

  // Warn when pointing at local Supabase (often causes "Failed to fetch" if not running)
  if (typeof window !== 'undefined' && supabaseUrl && (supabaseUrl.includes('127.0.0.1') || supabaseUrl.includes('localhost'))) {
    console.warn(
      '[Supabase] Using local URL:',
      supabaseUrl,
      '— If you see "Failed to fetch" on login, use the real project in .env.local and restart dev server (clear .next if needed).'
    )
  }

  return createBrowserClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      db: {
        schema: 'public'
      },
      global: {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      }
    }
  )
}

