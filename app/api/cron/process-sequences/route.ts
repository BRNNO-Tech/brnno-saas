import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

/**
 * Cron job to process sequence steps
 * Should be called every 5-15 minutes via Vercel Cron or similar
 */
export async function GET(request: NextRequest) {
  // Verify cron secret
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

  try {
    // Get all active enrollments
    // Query: sequence_enrollments WHERE status = 'active', with sequence + lead joined. No timing filter here.
    const { data: enrollments, error: enrollError } = await supabase
      .from('sequence_enrollments')
      .select(`
        *,
        sequence:sequences(*),
        lead:leads(*)
      `)
      .eq('status', 'active')

    if (enrollError) {
      console.error('Error fetching enrollments:', enrollError)
      return NextResponse.json({ error: 'Failed to fetch enrollments' }, { status: 500 })
    }

    if (!enrollments || enrollments.length === 0) {
      return NextResponse.json({ message: 'No active enrollments to process', processed: 0 })
    }

    let processed = 0

    for (const enrollment of enrollments) {
      try {
        // Get the current step
        const { data: step, error: stepError } = await supabase
          .from('sequence_steps')
          .select('*')
          .eq('sequence_id', enrollment.sequence_id)
          .eq('step_order', enrollment.current_step_order)
          .single()

        if (stepError || !step) {
          // No more steps, mark as completed
          await supabase
            .from('sequence_enrollments')
            .update({ status: 'completed', completed_at: new Date().toISOString() })
            .eq('id', enrollment.id)
          continue
        }

        // Check if step should be executed now
        const shouldExecute = await shouldExecuteStep(enrollment, step, supabase)

        if (!shouldExecute) {
          continue
        }

        // Execute the step
        if (step.step_type === 'send_sms' || step.step_type === 'send_email') {
          // Cron has no user session; load business by sequence's business_id
          const businessId = enrollment.sequence?.business_id
          if (!businessId) {
            console.error(`Enrollment ${enrollment.id}: missing sequence.business_id`)
            continue
          }
          const { data: business, error: businessError } = await supabase
            .from('businesses')
            .select('*')
            .eq('id', businessId)
            .single()
          if (businessError) {
            console.error('[process-sequences] businesses query error (406 = column missing):', {
              message: businessError.message,
              hint: (businessError as any).hint,
              details: (businessError as any).details,
              code: (businessError as any).code,
              full: businessError,
            })
            continue
          }
          if (!business) {
            console.error(`Enrollment ${enrollment.id}: business not found`)
            continue
          }
          await executeMessageStep(enrollment, step, supabase, business)
        } else if (step.step_type === 'wait') {
          // Wait steps are handled by shouldExecuteStep
          // Just move to next step
          await supabase
            .from('sequence_enrollments')
            .update({ current_step_order: enrollment.current_step_order + 1 })
            .eq('id', enrollment.id)
        } else {
          // Other step types (condition, add_tag, change_status, notify_user)
          await executeOtherStep(enrollment, step, supabase)
        }

        processed++
      } catch (error) {
        console.error(`Error processing enrollment ${enrollment.id}:`, error)
      }
    }

    return NextResponse.json({ message: 'Processed sequences', processed })
  } catch (error) {
    console.error('Error processing sequences:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function shouldExecuteStep(enrollment: any, step: any, supabase: any): Promise<boolean> {
  // Check if this is a wait step and if enough time has passed
  if (step.step_type === 'wait') {
    const enrolledAt = new Date(enrollment.enrolled_at)
    const delayMs = getDelayInMs(step.delay_value, step.delay_unit)
    const executeAt = new Date(enrolledAt.getTime() + delayMs)

    return new Date() >= executeAt
  }

  // For message steps, check if already executed
  const { data: execution, error: executionError } = await supabase
    .from('sequence_step_executions')
    .select('id')
    .eq('enrollment_id', enrollment.id)
    .eq('step_id', step.id)
    .single()

  if (executionError) {
    console.error('[process-sequences] sequence_step_executions query error (406 = column missing):', {
      message: executionError.message,
      hint: (executionError as any).hint,
      details: (executionError as any).details,
      code: (executionError as any).code,
      full: executionError,
    })
  }

  return !execution
}

function getDelayInMs(value: number | null, unit: string | null): number {
  if (!value) return 0

  const multipliers: Record<string, number> = {
    minutes: 60 * 1000,
    hours: 60 * 60 * 1000,
    days: 24 * 60 * 60 * 1000,
  }

  return value * (multipliers[unit || 'hours'] || multipliers.hours)
}

async function executeMessageStep(
  enrollment: any,
  step: any,
  supabase: any,
  business?: any
) {
  const lead = enrollment.lead
  if (!lead) return

  // Use passed-in business (cron) or load from session (e.g. manual trigger with auth)
  if (!business) {
    const { getBusiness } = await import('@/lib/actions/business')
    business = await getBusiness()
  }
  if (!business) return

  // Type assertion for properties
  const businessWithSMS = business as any

  // Calculate days since enrolled
  const enrolledAt = new Date(enrollment.enrolled_at)
  const now = new Date()
  const daysSinceEnrolled = Math.floor((now.getTime() - enrolledAt.getTime()) / (1000 * 60 * 60 * 24))

  // Get previous messages sent to this lead
  const { data: previousExecutions, error: previousExecutionsError } = await supabase
    .from('sequence_step_executions')
    .select('message_sent')
    .eq('enrollment_id', enrollment.id)
    .not('message_sent', 'is', null)
    .order('created_at', { ascending: true })
    .limit(3)

  if (previousExecutionsError) {
    console.error('[process-sequences] sequence_step_executions (previous messages) query error (406 = column missing):', {
      message: previousExecutionsError.message,
      hint: (previousExecutionsError as any).hint,
      details: (previousExecutionsError as any).details,
      code: (previousExecutionsError as any).code,
      full: previousExecutionsError,
    })
  }

  const previousMessages = previousExecutions?.map((e: any) => e.message_sent).filter(Boolean) || []

  // Generate AI message
  let message: string
  const channel = step.step_type === 'send_sms' ? 'sms' : 'email'

  try {
    const { generateAIMessage, getMessageContext } = await import('@/lib/ai/generate-message')

    const messageContext = await getMessageContext(
      enrollment.current_step_order,
      step.step_type,
      step.message_template,
      daysSinceEnrolled
    )

    messageContext.previousMessages = previousMessages

    // Generate AI message with new signature
    message = await generateAIMessage(
      lead,
      {
        name: business.name,
        sender_name: businessWithSMS.sender_name,
        phone: business.phone,
        default_tone: businessWithSMS.default_tone
      },
      messageContext,
      channel
    )

    console.log(`AI generated ${channel} message for lead ${lead.id}:`, message)
  } catch (error) {
    console.error('AI generation failed, using template:', error)
    // Fallback to template if AI fails (template may be empty — AI generates at send time)
    const template = step.message_template || ''
    message = template
      .replace(/{name}/g, lead.name || 'there')
      .replace(/{service}/g, lead.interested_in_service_name || 'service')
    if (!message.trim()) {
      message = `Following up from ${business?.name ?? 'BRNNO'} — reach out if you have any questions.`
    }
  }

  if (step.step_type === 'send_sms' && lead.phone) {
    // Import SMS sending function and subaccount credentials
    const { sendSMS } = await import('@/lib/sms/providers')
    const { getTwilioCredentials } = await import('@/lib/actions/twilio-subaccounts')

    const businessId = business.id
    const subaccountCreds = await getTwilioCredentials(businessId)

    // Type assertion for SMS-related properties that may not be in the base type
    const businessWithSMS = business as any

    // Determine SMS provider and build config
    const smsProvider = businessWithSMS.sms_provider || 'twilio'
    const config: any = { provider: smsProvider }

    if (smsProvider === 'twilio') {
      // Priority: (1) business subaccount, (2) business twilio_account_sid + env, (3) master env
      if (subaccountCreds?.accountSid && subaccountCreds?.authToken && subaccountCreds?.phoneNumber) {
        config.twilioAccountSid = subaccountCreds.accountSid
        config.twilioAuthToken = subaccountCreds.authToken
        config.twilioPhoneNumber = subaccountCreds.phoneNumber
      } else if (businessWithSMS.twilio_account_sid) {
        config.twilioAccountSid = businessWithSMS.twilio_account_sid
        config.twilioAuthToken = process.env.TWILIO_AUTH_TOKEN
        config.twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER
      } else {
        config.twilioAccountSid = process.env.TWILIO_ACCOUNT_SID
        config.twilioAuthToken = process.env.TWILIO_AUTH_TOKEN
        config.twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER
      }
    } else if (smsProvider === 'surge') {
      config.surgeApiKey = businessWithSMS.surge_api_key
      config.surgeAccountId = businessWithSMS.surge_account_id
    }

    const result = await sendSMS(config, {
      to: lead.phone,
      body: message,
      fromName: businessWithSMS.sender_name || business.name || 'BRNNO',
    })

    // Record execution WITH the generated message
    await supabase.from('sequence_step_executions').insert({
      enrollment_id: enrollment.id,
      step_id: step.id,
      status: result.success ? 'sent' : 'failed',
      error_message: result.error || null,
      message_sent: message // Store the AI-generated message
    })

    // Move to next step if successful
    if (result.success) {
      await supabase
        .from('sequence_enrollments')
        .update({ current_step_order: enrollment.current_step_order + 1 })
        .eq('id', enrollment.id)
    }
  } else if (step.step_type === 'send_email' && lead.email) {
    try {
      const fromEmail = process.env.RESEND_FROM_EMAIL ?? 'noreply@brnno.com'
      const fromName = business?.name ?? 'BRNNO'

      await resend.emails.send({
        from: `${fromName} <${fromEmail}>`,
        to: lead.email,
        subject: step.subject ?? `Following up from ${fromName}`,
        html: `<p>${message}</p>`,
      })

      await supabase.from('sequence_step_executions').insert({
        enrollment_id: enrollment.id,
        step_id: step.id,
        status: 'sent',
        message_sent: message,
      })

      await supabase
        .from('sequence_enrollments')
        .update({ current_step_order: enrollment.current_step_order + 1 })
        .eq('id', enrollment.id)
    } catch (error) {
      console.error('[process-sequences] Email send failed:', error)
      await supabase.from('sequence_step_executions').insert({
        enrollment_id: enrollment.id,
        step_id: step.id,
        status: 'failed',
        error_message: String(error),
      })
    }
  }
}

async function executeOtherStep(enrollment: any, step: any, supabase: any) {
  const leadId = enrollment.lead_id
  const businessId = enrollment.sequence?.business_id

  if (step.step_type === 'change_status' && step.status_value) {
    await supabase
      .from('leads')
      .update({ status: step.status_value })
      .eq('id', leadId)
      .eq('business_id', businessId)
  } else if (step.step_type === 'notify_user' && businessId) {
    const lead = enrollment.lead as { name?: string; phone?: string; email?: string; status?: string } | undefined
    const { data: business } = await supabase
      .from('businesses')
      .select('email, name')
      .eq('id', businessId)
      .single()

    if (business?.email && lead) {
      const subject = 'Lead needs attention'
      const body = [
        `Lead: ${lead.name ?? '—'}`,
        `Phone: ${lead.phone ?? '—'}`,
        `Email: ${lead.email ?? '—'}`,
        `Status: ${lead.status ?? '—'}`,
      ].join('\n')
      try {
        const fromEmail = process.env.RESEND_FROM_EMAIL ?? 'noreply@brnno.com'
        const fromName = business?.name ?? 'BRNNO'
        await resend.emails.send({
          from: `${fromName} <${fromEmail}>`,
          to: business.email,
          subject,
          html: `<p>${body.replace(/\n/g, '<br/>')}</p>`,
        })
      } catch (err) {
        console.error('[process-sequences] notify_user email failed:', err)
      }
    }
  }

  // Advance to next step (change_status, notify_user, condition, add_tag)
  await supabase
    .from('sequence_enrollments')
    .update({ current_step_order: enrollment.current_step_order + 1 })
    .eq('id', enrollment.id)
}
