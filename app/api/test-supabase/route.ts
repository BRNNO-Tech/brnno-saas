import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  try {
    // Check environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    const results: any = {
      timestamp: new Date().toISOString(),
      environment: {
        url: supabaseUrl ? '✅ Set' : '❌ Missing',
        anonKey: supabaseAnonKey ? '✅ Set' : '❌ Missing',
        serviceKey: supabaseServiceKey ? '✅ Set' : '❌ Missing',
      },
      tests: {}
    }

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json({
        ...results,
        error: 'Missing required environment variables',
        message: 'Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY'
      }, { status: 400 })
    }

    // Validate URL format
    try {
      new URL(supabaseUrl)
      results.tests.urlFormat = '✅ Valid'
    } catch {
      return NextResponse.json({
        ...results,
        error: 'Invalid Supabase URL format'
      }, { status: 400 })
    }

    // Test 1: Connection with anon key
    const supabase = createClient(supabaseUrl, supabaseAnonKey)
    
    try {
      const { data, error } = await supabase
        .from('businesses')
        .select('id')
        .limit(1)

      if (error) {
        results.tests.anonConnection = {
          status: '⚠️ Error',
          message: error.message,
          code: error.code,
          details: error.details
        }
        
        // Check if it's a permissions issue (which is normal with RLS)
        if (error.code === 'PGRST116' || error.message.includes('permission') || error.message.includes('RLS')) {
          results.tests.anonConnection.note = 'This is normal if Row Level Security (RLS) is enabled'
        }
      } else {
        results.tests.anonConnection = {
          status: '✅ Connected',
          message: 'Successfully connected to Supabase',
          dataCount: data?.length || 0
        }
      }
    } catch (error: any) {
      results.tests.anonConnection = {
        status: '❌ Failed',
        message: error.message
      }
    }

    // Test 2: Auth connection
    try {
      const { data: authData, error: authError } = await supabase.auth.getSession()
      
      if (authError) {
        results.tests.authConnection = {
          status: '⚠️ Error',
          message: authError.message
        }
      } else {
        results.tests.authConnection = {
          status: '✅ Connected',
          message: 'Auth service is accessible',
          hasSession: !!authData.session
        }
      }
    } catch (error: any) {
      results.tests.authConnection = {
        status: '❌ Failed',
        message: error.message
      }
    }

    // Test 3: Service role key (if available)
    if (supabaseServiceKey) {
      try {
        const serviceClient = createClient(supabaseUrl, supabaseServiceKey)
        const { data: serviceData, error: serviceError } = await serviceClient
          .from('businesses')
          .select('id')
          .limit(1)

        if (serviceError) {
          results.tests.serviceConnection = {
            status: '⚠️ Error',
            message: serviceError.message
          }
        } else {
          results.tests.serviceConnection = {
            status: '✅ Connected',
            message: 'Service role key works',
            dataCount: serviceData?.length || 0
          }
        }
      } catch (error: any) {
        results.tests.serviceConnection = {
          status: '❌ Failed',
          message: error.message
        }
      }
    }

    // Overall status
    const allTestsPassed = Object.values(results.tests).every((test: any) => 
      test.status === '✅ Connected' || test.status === '✅ Valid'
    )

    return NextResponse.json({
      ...results,
      overall: allTestsPassed ? '✅ All tests passed' : '⚠️ Some issues detected',
      summary: {
        urlConfigured: !!supabaseUrl,
        anonKeyConfigured: !!supabaseAnonKey,
        serviceKeyConfigured: !!supabaseServiceKey,
        connectionWorking: results.tests.anonConnection?.status === '✅ Connected'
      }
    })

  } catch (error: any) {
    return NextResponse.json({
      error: 'Unexpected error',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 })
  }
}
