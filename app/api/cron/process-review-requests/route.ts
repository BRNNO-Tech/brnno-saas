import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

function hasAnyModule(modules: Record<string, unknown> | null | undefined): boolean {
  if (!modules || typeof modules !== 'object') return false
  return Object.entries(modules).some(([key, value]) => {
    if (key === 'leadRecovery') {
      return value && typeof value === 'object' && (value as { enabled?: boolean }).enabled === true
    }
    return value === true
  })
}

/**
 * Cron job to process pending review requests (send email + optional SMS).
 * Should be called hourly via Vercel Cron.
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    return NextResponse.json({ error: 'Missing Supabase credentials' }, { status: 500 })
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const now = new Date().toISOString()

  try {
    const { data: requests, error: fetchError } = await supabase
      .from('review_requests')
      .select(`
        *,
        business:businesses(*)
      `)
      .eq('status', 'pending')
      .lte('send_at', now)

    if (fetchError) {
      console.error('[process-review-requests] Fetch error:', fetchError)
      return NextResponse.json({ error: 'Failed to fetch review requests' }, { status: 500 })
    }

    if (!requests || requests.length === 0) {
      return NextResponse.json({ message: 'No pending review requests', processed: 0, sent: 0, failed: 0 })
    }

    let sent = 0
    let failed = 0

    const startOfMonth = (() => {
      const d = new Date()
      d.setUTCDate(1)
      d.setUTCHours(0, 0, 0, 0)
      return d.toISOString()
    })()

    for (const req of requests) {
      const business = req.business as any
      const businessId = req.business_id
      const billingPlan = business?.billing_plan
      const modules = business?.modules as Record<string, unknown> | null | undefined

      // Plan check: skip free plan with no modules
      const isPro = billingPlan === 'pro'
      const hasModule = hasAnyModule(modules)
      if (!isPro && !hasModule) {
        console.log('[process-review-requests] skipped: free plan business', businessId)
        continue
      }

      // Monthly cap: Free = 0 (skip); Pro without reviews = 100/month; Pro with reviews module = 500/month
      const hasReviewsModule = modules?.reviews === true
      const monthlyCap = !isPro ? 0 : hasReviewsModule ? 500 : 100
      if (monthlyCap > 0) {
        const { count } = await supabase
          .from('review_requests')
          .select('id', { count: 'exact', head: true })
          .eq('business_id', businessId)
          .eq('status', 'sent')
          .gte('sent_at', startOfMonth)
        if ((count ?? 0) >= monthlyCap) {
          console.log('[process-review-requests] skipped: monthly limit reached for', businessId)
          continue
        }
      }

      const fromName = business?.name ?? business?.sender_name ?? 'Our team'
      const fromEmail = process.env.RESEND_FROM_EMAIL ?? 'noreply@brnno.com'

      const subdomain = business?.subdomain
      const appUrl =
        process.env.APP_URL ||
        (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) ||
        process.env.NEXT_PUBLIC_APP_URL ||
        ''
      const reviewLink =
        appUrl && subdomain
          ? `${appUrl.replace(/\/$/, '')}/${subdomain}/review?token=${req.id}`
          : req.review_link || '#'

      try {
        let sentEmail = false
        let sentSMS = false

        // 1. Send email to customer_email (internal review form link)
        if (req.customer_email && resend) {
          const firstName = req.customer_name?.split(' ')[0] || 'there'
          const html = `
            <p>Hi ${firstName},</p>
            <p>We hope you're happy with your recent service. Your feedback helps us improve and helps other customers find us.</p>
            <p>Would you take a moment to leave us a review?</p>
            <p style="margin-top: 24px;">
              <a href="${reviewLink}" style="display: inline-block; padding: 12px 24px; background: #18181b; color: #fff; text-decoration: none; border-radius: 8px; font-weight: 500;">Leave a review</a>
            </p>
            <p style="margin-top: 24px; color: #71717a; font-size: 14px;">Thank you,<br/>${fromName}</p>
          `
          await resend.emails.send({
            from: `${fromName} <${fromEmail}>`,
            to: req.customer_email,
            subject: 'How was your detailing service?',
            html,
          })
          sentEmail = true
        }

        // 2. If customer_phone exists, send SMS via business Twilio (same pattern as process-sequences)
        if (req.customer_phone) {
          const { sendSMS } = await import('@/lib/sms/providers')
          const { getTwilioCredentials } = await import('@/lib/actions/twilio-subaccounts')
          const subaccountCreds = await getTwilioCredentials(businessId)
          const businessWithSMS = business as any
          const smsProvider = businessWithSMS?.sms_provider || 'twilio'
          const config: any = { provider: smsProvider }

          if (smsProvider === 'twilio') {
            if (subaccountCreds?.accountSid && subaccountCreds?.authToken && subaccountCreds?.phoneNumber) {
              config.twilioAccountSid = subaccountCreds.accountSid
              config.twilioAuthToken = subaccountCreds.authToken
              config.twilioPhoneNumber = subaccountCreds.phoneNumber
            } else if (businessWithSMS?.twilio_account_sid) {
              config.twilioAccountSid = businessWithSMS.twilio_account_sid
              config.twilioAuthToken = process.env.TWILIO_AUTH_TOKEN
              config.twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER
            } else {
              config.twilioAccountSid = process.env.TWILIO_ACCOUNT_SID
              config.twilioAuthToken = process.env.TWILIO_AUTH_TOKEN
              config.twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER
            }
          } else if (smsProvider === 'surge') {
            config.surgeApiKey = businessWithSMS?.surge_api_key
            config.surgeAccountId = businessWithSMS?.surge_account_id
          }

          const smsBody = reviewLink
            ? `${fromName}: How was your recent service? We'd love your feedback: ${reviewLink}`
            : `${fromName}: How was your recent service? We'd love your feedback — reply to this message or reach out to us.`

          const result = await sendSMS(config, {
            to: req.customer_phone,
            body: smsBody,
            fromName: businessWithSMS?.sender_name || fromName,
          })
          if (result.success) sentSMS = true
          else console.error('[process-review-requests] SMS failed for request', req.id, result.error)
        }

        if (sentEmail || sentSMS) {
          await supabase
            .from('review_requests')
            .update({ status: 'sent', sent_at: now })
            .eq('id', req.id)
          sent++
        } else {
          await supabase
            .from('review_requests')
            .update({ status: 'failed' })
            .eq('id', req.id)
          failed++
          console.error('[process-review-requests] No channel sent for request', req.id, '(no email or SMS sent)')
        }
      } catch (err) {
        console.error('[process-review-requests] Failed for request', req.id, err)
        await supabase
          .from('review_requests')
          .update({ status: 'failed' })
          .eq('id', req.id)
        failed++
      }
    }

    console.log('[process-review-requests] Summary:', { processed: requests.length, sent, failed })
    return NextResponse.json({
      message: 'Processed review requests',
      processed: requests.length,
      sent,
      failed,
    })
  } catch (error) {
    console.error('[process-review-requests] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
