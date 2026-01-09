'use server'

import { createClient } from '@/lib/supabase/server'
import { isDemoMode } from '@/lib/demo/utils'
import { MOCK_LEADS } from '@/lib/demo/mock-data'

export async function setFollowUpReminder(leadId: string, date: string) {
  if (await isDemoMode()) {
    // In demo mode, just return without error
    return
  }

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
  if (await isDemoMode()) {
    // Return mock leads that need follow-up for demo
    const today = new Date().toISOString().split('T')[0]
    return MOCK_LEADS.filter(lead => {
      // In demo mode, show some leads as needing follow-up
      // Use leads that are not converted/lost and have been created recently
      const isRecent = new Date(lead.created_at) >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      return lead.status !== 'converted' && 
             lead.status !== 'lost' && 
             isRecent &&
             (lead.id === 'demo-lead-1' || lead.id === 'demo-lead-2' || lead.id === 'demo-lead-4')
    }).map(lead => ({
      ...lead,
      next_follow_up_date: today,
      reminder_sent: false,
    }))
  }

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
  if (await isDemoMode()) {
    // In demo mode, just return without error
    return
  }

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
