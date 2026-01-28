import { createClient as createSupabaseClient } from '@supabase/supabase-js'

/**
 * Service Role Client - Bypasses Row Level Security (RLS)
 * 
 * WARNING: This client has ADMIN privileges. Only use for:
 * - Server-side operations requiring elevated permissions
 * - Operations that need to bypass RLS policies
 * - Admin actions like account deletion, worker job updates
 * 
 * NEVER expose this client to the browser or client-side code.
 */
export function createClient() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceRoleKey) {
        throw new Error(
            'Missing Supabase environment variables. ' +
            'Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your environment.'
        )
    }

    return createSupabaseClient(supabaseUrl, supabaseServiceRoleKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    })
}
