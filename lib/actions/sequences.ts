'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { hasAIAutoLead } from './twilio-subaccounts'

export interface SequenceStep {
  id?: string
  step_order: number
  step_type: 'send_sms' | 'send_email' | 'wait' | 'condition' | 'add_tag' | 'change_status' | 'notify_user'
  delay_value?: number | null
  delay_unit?: 'minutes' | 'hours' | 'days' | null
  channel?: 'sms' | 'email' | null
  subject?: string | null
  message_template: string
  condition_type?: 'replied' | 'clicked_booking' | 'no_reply' | 'custom' | null
  condition_config?: Record<string, any> | null
  tag_name?: string | null
  status_value?: string | null
  notification_config?: Record<string, any> | null
}

export interface Sequence {
  id: string
  business_id: string
  name: string
  description?: string | null
  trigger_type: 'booking_abandoned' | 'quote_sent' | 'no_response' | 'missed_call' | 'post_service' | 'custom'
  trigger_config?: Record<string, any> | null
  enabled: boolean
  stop_on_reply: boolean
  stop_on_booking: boolean
  respect_business_hours: boolean
  created_at: string
  updated_at: string
  steps?: SequenceStep[]
  active_enrollments?: number
  conversion_rate?: number
}

async function getBusinessId() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: business, error } = await supabase
    .from('businesses')
    .select('id')
    .eq('owner_id', user.id)
    .single()

  if (error || !business) throw new Error('Business not found')
  return business.id
}

export async function getSequences(): Promise<Sequence[]> {
  // Check if in demo mode
  const { isDemoMode } = await import('@/lib/demo/utils')
  if (await isDemoMode()) {
    // Return empty array for demo mode (sequences are optional)
    return []
  }

  try {
    const supabase = await createClient()
    const businessId = await getBusinessId()

    // Note: Email sequences are available to all users
    // Only SMS sequences require AI Auto Lead add-on (checked when sequence runs)

    const { data: sequences, error } = await supabase
      .from('sequences')
      .select('*')
      .eq('business_id', businessId)
      .order('created_at', { ascending: false })

    if (error) throw error

    // Get step counts and enrollment stats for each sequence
    const sequencesWithStats = await Promise.all(
      (sequences || []).map(async (seq) => {
        let activeCount = 0
        let conversionRate = 0

        try {
          // Get active enrollments count
          const { count: activeCountResult, error: activeError } = await supabase
            .from('sequence_enrollments')
            .select('*', { count: 'exact', head: true })
            .eq('sequence_id', seq.id)
            .eq('status', 'active')

          if (!activeError) {
            activeCount = activeCountResult || 0
          }

          // Get conversion stats (leads that completed sequence and booked)
          const { data: completedEnrollments, error: completedError } = await supabase
            .from('sequence_enrollments')
            .select('lead_id')
            .eq('sequence_id', seq.id)
            .eq('status', 'completed')

          if (!completedError && completedEnrollments && completedEnrollments.length > 0) {
            const leadIds = completedEnrollments.map(e => e.lead_id)
            const { count: bookedCount, error: bookedError } = await supabase
              .from('leads')
              .select('*', { count: 'exact', head: true })
              .in('id', leadIds)
              .eq('status', 'booked')

            if (!bookedError && bookedCount !== null) {
              conversionRate = bookedCount > 0 && completedEnrollments.length > 0
                ? (bookedCount / completedEnrollments.length) * 100
                : 0
            }
          }
        } catch (statsError) {
          // Silently fail stats calculation - tables might not exist yet
          console.warn('Error calculating sequence stats:', statsError)
        }

        return {
          ...seq,
          active_enrollments: activeCount,
          conversion_rate: conversionRate,
        }
      })
    )

    return sequencesWithStats as Sequence[]
  } catch (error) {
    console.error('Error fetching sequences:', error)
    return []
  }
}

export async function getSequence(id: string): Promise<Sequence | null> {
  try {
    const { isDemoMode } = await import('@/lib/demo/utils')
    const { getMockSequence } = await import('@/lib/demo/mock-data')
    if (await isDemoMode()) {
      return getMockSequence(id)
    }

    const supabase = await createClient()
    const businessId = await getBusinessId()

    const { data: sequence, error } = await supabase
      .from('sequences')
      .select('*')
      .eq('id', id)
      .eq('business_id', businessId)
      .single()

    if (error || !sequence) return null

    // Get steps
    const { data: steps, error: stepsError } = await supabase
      .from('sequence_steps')
      .select('*')
      .eq('sequence_id', id)
      .order('step_order', { ascending: true })

    if (stepsError) {
      console.error('Error fetching sequence steps:', stepsError)
    }

    return {
      ...sequence,
      steps: steps || [],
    } as Sequence
  } catch (error) {
    console.error('Error fetching sequence:', error)
    return null
  }
}

export async function createSequence(data: {
  name: string
  description?: string
  trigger_type: Sequence['trigger_type']
  trigger_config?: Record<string, any>
  enabled?: boolean
  stop_on_reply?: boolean
  stop_on_booking?: boolean
  respect_business_hours?: boolean
  steps?: SequenceStep[]
}): Promise<{ id: string } | null> {
  try {
    const supabase = await createClient()
    const businessId = await getBusinessId()

    // Check if sequence has SMS steps and requires AI Auto Lead
    const hasSMSSteps = data.steps?.some(step => step.step_type === 'send_sms' || step.channel === 'sms')
    if (hasSMSSteps) {
      const hasAccess = await hasAIAutoLead(businessId)
      if (!hasAccess) {
        throw new Error('AI Auto Lead add-on required for SMS sequences. Email sequences are available to all users.')
      }
    }

    const { data: sequence, error } = await supabase
      .from('sequences')
      .insert({
        business_id: businessId,
        name: data.name,
        description: data.description || null,
        trigger_type: data.trigger_type,
        trigger_config: data.trigger_config || {},
        enabled: data.enabled ?? false,
        stop_on_reply: data.stop_on_reply ?? true,
        stop_on_booking: data.stop_on_booking ?? true,
        respect_business_hours: data.respect_business_hours ?? true,
      })
      .select('id')
      .single()

    if (error || !sequence) {
      console.error('Error creating sequence:', error)
      return null
    }

    // Insert steps if provided
    if (data.steps && data.steps.length > 0) {
      const stepsToInsert = data.steps.map(step => ({
        sequence_id: sequence.id,
        step_order: step.step_order,
        step_type: step.step_type,
        delay_value: step.delay_value || null,
        delay_unit: step.delay_unit || null,
        channel: step.channel || null,
        subject: step.subject || null,
        message_template: step.message_template,
        condition_type: step.condition_type || null,
        condition_config: step.condition_config || {},
        tag_name: step.tag_name || null,
        status_value: step.status_value || null,
        notification_config: step.notification_config || {},
      }))

      const { error: stepsError } = await supabase
        .from('sequence_steps')
        .insert(stepsToInsert)

      if (stepsError) {
        console.error('Error creating sequence steps:', stepsError)
      }
    }

    revalidatePath('/dashboard/leads/sequences')
    return { id: sequence.id }
  } catch (error) {
    console.error('Error creating sequence:', error)
    return null
  }
}

export async function updateSequence(
  id: string,
  data: {
    name?: string
    description?: string
    trigger_type?: Sequence['trigger_type']
    trigger_config?: Record<string, any>
    enabled?: boolean
    stop_on_reply?: boolean
    stop_on_booking?: boolean
    respect_business_hours?: boolean
    steps?: SequenceStep[]
  }
): Promise<boolean> {
  try {
    const supabase = await createClient()
    const businessId = await getBusinessId()

    // Verify sequence belongs to business
    const { data: existing } = await supabase
      .from('sequences')
      .select('id')
      .eq('id', id)
      .eq('business_id', businessId)
      .single()

    if (!existing) {
      throw new Error('Sequence not found')
    }

    // Update sequence
    const updateData: any = {}
    if (data.name !== undefined) updateData.name = data.name
    if (data.description !== undefined) updateData.description = data.description
    if (data.trigger_type !== undefined) updateData.trigger_type = data.trigger_type
    if (data.trigger_config !== undefined) updateData.trigger_config = data.trigger_config
    if (data.enabled !== undefined) updateData.enabled = data.enabled
    if (data.stop_on_reply !== undefined) updateData.stop_on_reply = data.stop_on_reply
    if (data.stop_on_booking !== undefined) updateData.stop_on_booking = data.stop_on_booking
    if (data.respect_business_hours !== undefined) updateData.respect_business_hours = data.respect_business_hours

    if (Object.keys(updateData).length > 0) {
      const { error } = await supabase
        .from('sequences')
        .update(updateData)
        .eq('id', id)

      if (error) throw error
    }

    // Update steps if provided
    if (data.steps !== undefined) {
      // Delete existing steps
      await supabase
        .from('sequence_steps')
        .delete()
        .eq('sequence_id', id)

      // Insert new steps
      if (data.steps.length > 0) {
        const stepsToInsert = data.steps.map(step => ({
          sequence_id: id,
          step_order: step.step_order,
          step_type: step.step_type,
          delay_value: step.delay_value || null,
          delay_unit: step.delay_unit || null,
          channel: step.channel || null,
          subject: step.subject || null,
          message_template: step.message_template,
          condition_type: step.condition_type || null,
          condition_config: step.condition_config || {},
          tag_name: step.tag_name || null,
          status_value: step.status_value || null,
          notification_config: step.notification_config || {},
        }))

        const { error: stepsError } = await supabase
          .from('sequence_steps')
          .insert(stepsToInsert)

        if (stepsError) throw stepsError
      }
    }

    revalidatePath('/dashboard/leads/sequences')
    revalidatePath(`/dashboard/leads/sequences/${id}`)
    return true
  } catch (error) {
    console.error('Error updating sequence:', error)
    return false
  }
}

export async function deleteSequence(id: string): Promise<boolean> {
  try {
    const supabase = await createClient()
    const businessId = await getBusinessId()

    // Verify sequence belongs to business
    const { data: existing } = await supabase
      .from('sequences')
      .select('id')
      .eq('id', id)
      .eq('business_id', businessId)
      .single()

    if (!existing) {
      throw new Error('Sequence not found')
    }

    // Delete sequence (cascade will delete steps and enrollments)
    const { error } = await supabase
      .from('sequences')
      .delete()
      .eq('id', id)

    if (error) throw error

    revalidatePath('/dashboard/leads/sequences')
    return true
  } catch (error) {
    console.error('Error deleting sequence:', error)
    return false
  }
}

export async function toggleSequence(id: string, enabled: boolean): Promise<boolean> {
  try {
    const supabase = await createClient()
    const businessId = await getBusinessId()

    const { error } = await supabase
      .from('sequences')
      .update({ enabled })
      .eq('id', id)
      .eq('business_id', businessId)

    if (error) throw error

    revalidatePath('/dashboard/leads/sequences')
    return true
  } catch (error) {
    console.error('Error toggling sequence:', error)
    return false
  }
}

export async function duplicateSequence(id: string): Promise<{ id: string } | null> {
  try {
    const sequence = await getSequence(id)
    if (!sequence) return null

    const { id: newId } = await createSequence({
      name: `${sequence.name} (Copy)`,
      description: sequence.description || undefined,
      trigger_type: sequence.trigger_type,
      trigger_config: sequence.trigger_config || undefined,
      enabled: false, // Always start disabled
      stop_on_reply: sequence.stop_on_reply,
      stop_on_booking: sequence.stop_on_booking,
      respect_business_hours: sequence.respect_business_hours,
      steps: sequence.steps || [],
    }) || {}

    return newId ? { id: newId } : null
  } catch (error) {
    console.error('Error duplicating sequence:', error)
    return null
  }
}

/**
 * Enroll a lead into a sequence
 */
export async function enrollLeadInSequence(leadId: string, sequenceId: string): Promise<boolean> {
  try {
    const supabase = await createClient()
    const businessId = await getBusinessId()

    // Verify sequence exists and is enabled
    const { data: sequence, error: seqError } = await supabase
      .from('sequences')
      .select('id, enabled')
      .eq('id', sequenceId)
      .eq('business_id', businessId)
      .single()

    if (seqError || !sequence) {
      console.log('Sequence not found:', sequenceId)
      return false
    }

    // Allow enrollment even if sequence is disabled (user can enable it later)
    // The cron job will only process enabled sequences, so this is fine

    // Check if already enrolled
    const { data: existing } = await supabase
      .from('sequence_enrollments')
      .select('id')
      .eq('sequence_id', sequenceId)
      .eq('lead_id', leadId)
      .single()

    if (existing) {
      console.log('Lead already enrolled in sequence:', leadId, sequenceId)
      return false
    }

    // Create enrollment
    const { error: enrollError } = await supabase
      .from('sequence_enrollments')
      .insert({
        sequence_id: sequenceId,
        lead_id: leadId,
        current_step_order: 0,
        status: 'active',
      })

    if (enrollError) {
      console.error('Error enrolling lead:', enrollError)
      return false
    }

    console.log('Lead enrolled in sequence:', leadId, sequenceId)
    return true
  } catch (error) {
    console.error('Error enrolling lead in sequence:', error)
    return false
  }
}

/**
 * Check and enroll leads into sequences based on triggers
 * Call this when events occur (booking abandoned, quote sent, etc.)
 */
export async function checkAndEnrollSequences(
  leadId: string,
  triggerType: Sequence['trigger_type'],
  triggerData?: Record<string, any>
): Promise<void> {
  try {
    const supabase = await createClient()
    const businessId = await getBusinessId()

    // Find enabled sequences that match this trigger
    const { data: sequences, error } = await supabase
      .from('sequences')
      .select('id')
      .eq('business_id', businessId)
      .eq('enabled', true)
      .eq('trigger_type', triggerType)

    if (error || !sequences || sequences.length === 0) {
      return
    }

    // Enroll lead in each matching sequence
    for (const sequence of sequences) {
      await enrollLeadInSequence(leadId, sequence.id)
    }
  } catch (error) {
    console.error('Error checking and enrolling sequences:', error)
  }
}
