'use server'

import { createClient } from '@/lib/supabase/server'

export async function setFollowUpReminder(leadId: string, date: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('leads')
    .update({
      next_follow_up_date: date,
      reminder_sent: false,
    })
    .eq('id', leadId)

  if (error) throw error
}

export async function getLeadsNeedingFollowUp() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: business, error: businessError } = await supabase
    .from('businesses')
    .select('id')
    .eq('owner_id', user.id)
    .single()

  if (businessError || !business) {
    throw new Error('No business found. Please complete your business setup in Settings.')
  }

  const today = new Date().toISOString().split('T')[0]

  const { data: leads, error } = await supabase
    .from('leads')
    .select('*')
    .eq('business_id', business.id)
    .lte('next_follow_up_date', today)
    .neq('status', 'converted')
    .neq('status', 'lost')
    .is('reminder_sent', false)

  if (error) throw error
  return leads || []
}

export async function snoozeReminder(leadId: string, days: number) {
  const supabase = await createClient()

  const newDate = new Date()
  newDate.setDate(newDate.getDate() + days)

  const { error } = await supabase
    .from('leads')
    .update({
      next_follow_up_date: newDate.toISOString().split('T')[0],
      reminder_sent: false,
    })
    .eq('id', leadId)

  if (error) throw error
}
