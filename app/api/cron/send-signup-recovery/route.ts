import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendSignupRecoveryEmail } from '@/lib/email'

export async function GET(request: NextRequest) {
  // Verify cron secret (optional - only if CRON_SECRET is set)
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  
  // Only require auth if CRON_SECRET is configured
  if (cronSecret) {
    if (!authHeader || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY || !process.env.NEXT_PUBLIC_SUPABASE_URL) {
    console.error('SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_URL is not set')
    return NextResponse.json(
      { error: 'Server configuration error' },
      { status: 500 }
    )
  }

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  try {
    // Find abandoned signups that need recovery emails
    // Criteria:
    // - Not converted
    // - Abandoned at least 1 hour ago
    // - Recovery emails sent < 3
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()

    const { data: abandonedLeads, error } = await supabaseAdmin
      .from('signup_leads')
      .select('*')
      .eq('converted', false)
      .not('abandoned_at', 'is', null)
      .lt('abandoned_at', oneHourAgo)
      .or('recovery_emails_sent.is.null,recovery_emails_sent.lt.3')
      .limit(50)

    if (error) {
      console.error('Error fetching abandoned leads:', error)
      throw error
    }

    if (!abandonedLeads || abandonedLeads.length === 0) {
      return NextResponse.json({ 
        success: true, 
        processed: 0,
        message: 'No abandoned leads to process'
      })
    }

    let processed = 0
    let sent = 0

    // Process each abandoned lead
    for (const lead of abandonedLeads) {
      processed++

      // Calculate hours since abandonment
      const abandonedAt = new Date(lead.abandoned_at)
      const hoursSinceAbandoned = (Date.now() - abandonedAt.getTime()) / (1000 * 60 * 60)
      const emailsSent = lead.recovery_emails_sent || 0

      // Determine if we should send based on timing:
      // - First email: 1 hour after abandonment
      // - Second email: 24 hours after abandonment
      // - Third email: 72 hours after abandonment
      const shouldSend = 
        (emailsSent === 0 && hoursSinceAbandoned >= 1) ||
        (emailsSent === 1 && hoursSinceAbandoned >= 24) ||
        (emailsSent === 2 && hoursSinceAbandoned >= 72)

      if (shouldSend) {
        try {
          await sendSignupRecoveryEmail(lead.email, lead.name, lead.current_step)
          sent++

          // Update recovery email count
          const { error: updateError } = await supabaseAdmin
            .from('signup_leads')
            .update({
              recovery_emails_sent: emailsSent + 1,
              last_recovery_email_at: new Date().toISOString(),
            })
            .eq('id', lead.id)

          if (updateError) {
            console.error(`Failed to update lead ${lead.id}:`, updateError)
          }
        } catch (emailError) {
          console.error(`Failed to send recovery email to ${lead.email}:`, emailError)
        }
      }
    }

    return NextResponse.json({ 
      success: true, 
      processed,
      sent,
      message: `Processed ${processed} leads, sent ${sent} recovery emails`
    })
  } catch (error: any) {
    console.error('Recovery email cron error:', error)
    return NextResponse.json(
      { 
        error: error.message || 'Failed to process recovery emails',
        details: error 
      },
      { status: 500 }
    )
  }
}

