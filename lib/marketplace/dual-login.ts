import { createClient } from '@/lib/supabase/client'

/**
 * Dual login helper for Supabase + Firebase Marketplace
 * When a user logs into Supabase (SaaS), this ensures they're also
 * authenticated in Firebase Marketplace if they have a marketplace account
 */
export async function handleDualLogin(email: string, password: string) {
  const supabase = createClient()

  // 1. Log into Supabase (SaaS)
  const { data: supabaseData, error: supabaseError } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (supabaseError) {
    throw new Error(`Supabase login failed: ${supabaseError.message}`)
  }

  if (!supabaseData.user) {
    throw new Error('Supabase login failed: No user returned')
  }

  // 2. Check if user has Firebase marketplace account
  const firebaseUserId = supabaseData.user.user_metadata?.firebase_user_id
  const marketplaceUserId = supabaseData.user.user_metadata?.marketplace_user_id
  const userType = supabaseData.user.user_metadata?.user_type

  // 3. If they have a marketplace account, prepare for Firebase auth
  // Note: Actual Firebase authentication would be handled by your Firebase client SDK
  // This is just a helper to check if they need dual auth
  const hasMarketplaceAccount = !!(firebaseUserId || marketplaceUserId)

  if (hasMarketplaceAccount) {
    console.log('User has marketplace account, Firebase auth should be handled separately')
    
    // Option A: Use Firebase Custom Token (requires backend API)
    // You would call your API to get a custom token:
    // const customToken = await fetch('/api/auth/firebase-token', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ supabaseUserId: supabaseData.user.id })
    // }).then(r => r.json())
    
    // Then sign in with Firebase:
    // await signInWithCustomToken(auth, customToken)
    
    // Option B: If Firebase credentials match Supabase credentials,
    // you can use signInWithEmailAndPassword directly
    // This requires storing Firebase credentials or using a bridge API
  }

  return {
    supabaseUser: supabaseData.user,
    session: supabaseData.session,
    hasMarketplaceAccount,
    userType: userType || 'client', // 'client' from Supabase, 'customer' from Firebase
    firebaseUserId: firebaseUserId || marketplaceUserId
  }
}

/**
 * Check if current user has marketplace access
 */
export async function checkMarketplaceAccess() {
  const supabase = createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { hasAccess: false, userType: null }
  }

  const firebaseUserId = user.user_metadata?.firebase_user_id
  const marketplaceUserId = user.user_metadata?.marketplace_user_id
  const userType = user.user_metadata?.user_type

  return {
    hasAccess: !!(firebaseUserId || marketplaceUserId),
    userType: userType || 'client',
    firebaseUserId: firebaseUserId || marketplaceUserId
  }
}
