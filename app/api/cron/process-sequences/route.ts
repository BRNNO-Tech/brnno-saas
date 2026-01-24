import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

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
          await executeMessageStep(enrollment, step, supabase)
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
  const { data: execution } = await supabase
    .from('sequence_step_executions')
    .select('id')
    .eq('enrollment_id', enrollment.id)
    .eq('step_id', step.id)
    .single()

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

async function executeMessageStep(enrollment: any, step: any, supabase: any) {
  const lead = enrollment.lead
  if (!lead) return

  // Replace template variables
  let message = step.message_template
  message = message.replace(/{name}/g, lead.name || 'there')
  message = message.replace(/{service}/g, lead.interested_in_service_name || 'service')

  if (step.step_type === 'send_sms' && lead.phone) {
    // Import SMS sending function
    const { sendSMS } = await import('@/lib/sms/providers')
    const { getBusiness } = await import('@/lib/actions/business')
    
    const business = await getBusiness()
    if (!business) return

    // Type assertion for SMS-related properties that may not be in the base type
    const businessWithSMS = business as any

    // Determine SMS provider and build config
    const smsProvider = businessWithSMS.sms_provider || 'twilio'
    const config: any = { provider: smsProvider }
    
    if (smsProvider === 'twilio') {
      config.twilioAccountSid = businessWithSMS.twilio_account_sid || process.env.TWILIO_ACCOUNT_SID
      config.twilioAuthToken = process.env.TWILIO_AUTH_TOKEN
      config.twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER
    } else if (smsProvider === 'surge') {
      config.surgeApiKey = businessWithSMS.surge_api_key
      config.surgeAccountId = businessWithSMS.surge_account_id
    }

    const result = await sendSMS(config, {
      to: lead.phone,
      body: message,
      fromName: businessWithSMS.sender_name || business.name || 'BRNNO',
    })

    // Record execution
    await supabase.from('sequence_step_executions').insert({
      enrollment_id: enrollment.id,
      step_id: step.id,
      status: result.success ? 'sent' : 'failed',
      error_message: result.error || null,
    })

    // Move to next step if successful
    if (result.success) {
      await supabase
        .from('sequence_enrollments')
        .update({ current_step_order: enrollment.current_step_order + 1 })
        .eq('id', enrollment.id)
    }
  } else if (step.step_type === 'send_email' && lead.email) {
    // Email sending would go here
    // For now, just mark as executed
    await supabase.from('sequence_step_executions').insert({
      enrollment_id: enrollment.id,
      step_id: step.id,
      status: 'sent',
    })

    await supabase
      .from('sequence_enrollments')
      .update({ current_step_order: enrollment.current_step_order + 1 })
      .eq('id', enrollment.id)
  }
}

async function executeOtherStep(enrollment: any, step: any, supabase: any) {
  // Handle other step types (condition, add_tag, change_status, notify_user)
  // For now, just move to next step
  await supabase
    .from('sequence_enrollments')
    .update({ current_step_order: enrollment.current_step_order + 1 })
    .eq('id', enrollment.id)
}
