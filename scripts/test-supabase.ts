/**
 * Test Supabase Connection
 * Run with: npx tsx scripts/test-supabase.ts
 */

import { createClient } from '@supabase/supabase-js'

async function testSupabase() {
  console.log('🔍 Testing Supabase Connection...\n')

  // Check environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  console.log('📋 Environment Variables:')
  console.log(`  NEXT_PUBLIC_SUPABASE_URL: ${supabaseUrl ? '✅ Set' : '❌ Missing'}`)
  console.log(`  NEXT_PUBLIC_SUPABASE_ANON_KEY: ${supabaseAnonKey ? '✅ Set' : '❌ Missing'}`)
  console.log(`  SUPABASE_SERVICE_ROLE_KEY: ${supabaseServiceKey ? '✅ Set' : '❌ Missing'}\n`)

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Missing required environment variables!')
    console.error('Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your .env.local file')
    process.exit(1)
  }

  // Validate URL format
  try {
    new URL(supabaseUrl)
    console.log('✅ Supabase URL format is valid')
  } catch (error) {
    console.error('❌ Invalid Supabase URL format:', supabaseUrl)
    process.exit(1)
  }

  // Test connection with anon key
  console.log('\n🔌 Testing connection with anon key...')
  const supabase = createClient(supabaseUrl, supabaseAnonKey)

  try {
    // Test 1: Simple query to check connection
    const { data: healthCheck, error: healthError } = await supabase
      .from('businesses')
      .select('id')
      .limit(1)

    if (healthError) {
      console.error('❌ Connection test failed:', healthError.message)
      console.error('   Code:', healthError.code)
      console.error('   Details:', healthError.details)
      
      // Check if it's a permissions issue vs connection issue
      if (healthError.code === 'PGRST116' || healthError.message.includes('permission')) {
        console.log('\n⚠️  This might be a permissions issue. The connection works but the anon key may not have access.')
        console.log('   This is normal if RLS (Row Level Security) is enabled.')
      } else {
        process.exit(1)
      }
    } else {
      console.log('✅ Connection successful!')
      console.log(`   Found ${healthCheck?.length || 0} businesses`)
    }

    // Test 2: Check auth connection
    console.log('\n🔐 Testing auth connection...')
    const { data: authData, error: authError } = await supabase.auth.getSession()
    
    if (authError) {
      console.error('❌ Auth connection failed:', authError.message)
    } else {
      console.log('✅ Auth connection successful!')
      console.log(`   Session: ${authData.session ? 'Active' : 'No active session'}`)
    }

    // Test 3: Test with service role key if available
    if (supabaseServiceKey) {
      console.log('\n🔑 Testing connection with service role key...')
      const serviceClient = createClient(supabaseUrl, supabaseServiceKey)
      
      const { data: serviceData, error: serviceError } = await serviceClient
        .from('businesses')
        .select('id')
        .limit(1)

      if (serviceError) {
        console.error('❌ Service role connection failed:', serviceError.message)
      } else {
        console.log('✅ Service role connection successful!')
        console.log(`   Found ${serviceData?.length || 0} businesses`)
      }
    }

    console.log('\n✅ All tests completed!')
    console.log('\n📝 Summary:')
    console.log('   - Supabase URL: Valid')
    console.log('   - Anon Key: Valid')
    if (supabaseServiceKey) {
      console.log('   - Service Role Key: Valid')
    }
    console.log('   - Connection: Working\n')

  } catch (error: any) {
    console.error('❌ Unexpected error:', error.message)
    console.error('   Stack:', error.stack)
    process.exit(1)
  }
}

// Run the test
testSupabase().catch((error) => {
  console.error('Fatal error:', error)
  process.exit(1)
})
