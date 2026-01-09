'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { getTierFromBusiness, getMaxLeads } from '@/lib/permissions'

/**
 * Calculates lead score (hot/warm/cold) based on multiple factors
 */
function calculateLeadScore(lead: {
  estimated_value?: number | null
  status: string
  follow_up_count?: number
  created_at: string
  email?: string | null
  phone?: string | null
  last_contacted_at?: string | null
}): 'hot' | 'warm' | 'cold' {
  let score = 0

  // Status scoring (highest impact)
  const statusScores: Record<string, number> = {
    quoted: 30,        // Highest priority - they're ready to buy
    contacted: 20,    // Actively engaged
    new: 10,          // Fresh lead
    nurturing: 5,     // Long-term follow-up
    converted: 0,     // Already converted
    lost: -10,        // Not interested
  }
  score += statusScores[lead.status] || 0

  // Estimated value scoring
  if (lead.estimated_value) {
    if (lead.estimated_value >= 1000) score += 25      // High value = hot
    else if (lead.estimated_value >= 500) score += 15 // Medium value = warm
    else if (lead.estimated_value >= 100) score += 5  // Low value = still warm
  }

  // Recency scoring (newer is hotter)
  const daysSinceCreated = Math.floor(
    (Date.now() - new Date(lead.created_at).getTime()) / (1000 * 60 * 60 * 24)
  )
  if (daysSinceCreated <= 1) score += 20      // Created today = hot
  else if (daysSinceCreated <= 3) score += 15  // Last 3 days = hot
  else if (daysSinceCreated <= 7) score += 10  // Last week = warm
  else if (daysSinceCreated <= 14) score += 5  // Last 2 weeks = warm
  else if (daysSinceCreated > 30) score -= 10  // Over a month old = colder

  // Follow-up activity scoring (more interactions = hotter)
  const followUpCount = lead.follow_up_count || 0
  if (followUpCount >= 3) score += 15        // Multiple touchpoints = hot
  else if (followUpCount >= 2) score += 10    // Some engagement = warm
  else if (followUpCount === 1) score += 5    // Initial contact = warm

  // Contact info completeness (has both email and phone = warmer)
  const hasEmail = !!lead.email
  const hasPhone = !!lead.phone
  if (hasEmail && hasPhone) score += 10      // Complete contact info
  else if (hasEmail || hasPhone) score += 5  // Partial contact info

  // Recent contact scoring (contacted recently = hotter)
  if (lead.last_contacted_at) {
    const daysSinceContact = Math.floor(
      (Date.now() - new Date(lead.last_contacted_at).getTime()) / (1000 * 60 * 60 * 24)
    )
    if (daysSinceContact <= 1) score += 15   // Contacted today = hot
    else if (daysSinceContact <= 3) score += 10 // Contacted this week = warm
    else if (daysSinceContact > 14) score -= 5  // No contact in 2+ weeks = colder
  }

  // Determine final score
  if (score >= 50) return 'hot'    // High engagement, high value, recent
  if (score >= 25) return 'warm'    // Moderate engagement
  return 'cold'                      // Low engagement or old lead
}

export async function getLeads(filter?: 'hot' | 'warm' | 'cold' | 'all') {
  const { isDemoMode } = await import('@/lib/demo/utils')
  const { getMockLeads } = await import('@/lib/demo/mock-data')
  
  if (await isDemoMode()) {
    const leads = getMockLeads()
    if (filter && filter !== 'all') {
      return leads.filter(l => l.score === filter)
    }
    return leads
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

  let query = supabase
    .from('leads')
    .select(
      `
      *,
      interested_service:services(name, price)
    `
    )
    .eq('business_id', business.id)
    .order('created_at', { ascending: false })

  if (filter && filter !== 'all') {
    query = query.eq('score', filter)
  }

  const {
    data: leads,
    error,
  } = await query

  if (error) throw error
  return leads
}

export async function getLead(id: string) {
  const supabase = await createClient()

  const {
    data: lead,
    error,
  } = await supabase
    .from('leads')
    .select(
      `
      *,
      interested_service:services(name, price, description),
      interactions:lead_interactions(*)
    `
    )
    .eq('id', id)
    .single()

  if (error) throw error
  return lead
}

export async function createLead(formData: FormData) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: business, error: businessError } = await supabase
    .from('businesses')
    .select('id, subscription_plan, subscription_status')
    .eq('owner_id', user.id)
    .single()

  if (businessError || !business) {
    throw new Error('No business found. Please complete your business setup in Settings.')
  }

  // Check lead limit for Starter plan
  const tier = getTierFromBusiness(business)
  const maxLeads = getMaxLeads(tier)
  
  if (maxLeads > 0) {
    // Count current leads
    const { count } = await supabase
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .eq('business_id', business.id)
    
    const currentCount = count || 0
    if (currentCount >= maxLeads) {
      throw new Error(`You've reached your limit of ${maxLeads} leads. Upgrade to Pro for unlimited leads.`)
    }
  }

  const serviceId = formData.get('interested_in_service_id') as string
  let serviceName: string | null = null
  let estimatedValue: number | null = null

  if (serviceId) {
    const { data: service } = await supabase
      .from('services')
      .select('name, price')
      .eq('id', serviceId)
      .single()

    if (service) {
      serviceName = service.name
      estimatedValue = service.price as number
    }
  }

  const leadData = {
    business_id: business.id,
    name: formData.get('name') as string,
    email: (formData.get('email') as string) || null,
    phone: (formData.get('phone') as string) || null,
    source: (formData.get('source') as string) || null,
    interested_in_service_id: serviceId || null,
    interested_in_service_name: serviceName,
    estimated_value: estimatedValue,
    notes: (formData.get('notes') as string) || null,
    status: 'new',
    follow_up_count: 0,
    created_at: new Date().toISOString(),
  }

  // Calculate initial score
  const calculatedScore = calculateLeadScore(leadData)

  const leadDataWithScore = {
    ...leadData,
    score: calculatedScore,
  }

  const {
    data,
    error,
  } = await supabase
    .from('leads')
    .insert(leadDataWithScore)
    .select()
    .single()

  if (error) {
    console.error('Error creating lead:', error)
    throw new Error(error.message || 'Failed to create lead. Please try again.')
  }

  revalidatePath('/dashboard/leads')
  return data
}

export async function updateLeadStatus(
  id: string,
  status: 'new' | 'contacted' | 'quoted' | 'nurturing' | 'converted' | 'lost'
) {
  const supabase = await createClient()

  // Get current lead data for score calculation
  const { data: currentLead, error: fetchError } = await supabase
    .from('leads')
    .select('estimated_value, follow_up_count, created_at, email, phone, last_contacted_at')
    .eq('id', id)
    .single()

  if (fetchError) throw fetchError

  const updates: Record<string, unknown> = { status }

  if (status === 'contacted') {
    updates.last_contacted_at = new Date().toISOString()
  }

  // Recalculate score with new status
  const updatedLeadData = {
    ...currentLead,
    status,
    last_contacted_at: status === 'contacted' ? new Date().toISOString() : currentLead.last_contacted_at,
  }
  const newScore = calculateLeadScore(updatedLeadData)
  updates.score = newScore

  if (status === 'contacted') {
    // Get current follow_up_count and increment
    const { data: lead } = await supabase
      .from('leads')
      .select('follow_up_count')
      .eq('id', id)
      .single()

    if (lead) {
      const newFollowUpCount = (lead.follow_up_count || 0) + 1
      updates.follow_up_count = newFollowUpCount

      // Recalculate score with updated follow_up_count
      const leadWithFollowUp = {
        ...updatedLeadData,
        follow_up_count: newFollowUpCount,
      }
      updates.score = calculateLeadScore(leadWithFollowUp)
    }
  }

  const { error } = await supabase
    .from('leads')
    .update(updates)
    .eq('id', id)

  if (error) throw error

  revalidatePath('/dashboard/leads')
}

export async function addLeadInteraction(
  leadId: string,
  type: 'call' | 'sms' | 'email' | 'note',
  content: string,
  outcome?: string
) {
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

  const { error } = await supabase.from('lead_interactions').insert({
    lead_id: leadId,
    business_id: business.id,
    type,
    direction: 'outbound',
    content,
    outcome: outcome || null,
  })

  if (error) throw error

  // Get current lead data for score calculation
  const { data: lead } = await supabase
    .from('leads')
    .select('estimated_value, status, follow_up_count, created_at, email, phone, last_contacted_at')
    .eq('id', leadId)
    .single()

  if (!lead) throw new Error('Lead not found')

  const newFollowUpCount = (lead.follow_up_count || 0) + 1
  const newLastContactedAt = new Date().toISOString()

  // Recalculate score with updated interaction data
  const updatedLeadData = {
    ...lead,
    follow_up_count: newFollowUpCount,
    last_contacted_at: newLastContactedAt,
  }
  const newScore = calculateLeadScore(updatedLeadData)

  // Update lead's last_contacted_at, increment follow_up_count, and recalculate score
  const { error: updateError } = await supabase
    .from('leads')
    .update({
      last_contacted_at: newLastContactedAt,
      follow_up_count: newFollowUpCount,
      score: newScore,
    })
    .eq('id', leadId)

  if (updateError) throw updateError

  revalidatePath('/dashboard/leads')
}

export async function convertLeadToClient(leadId: string) {
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

  const {
    data: lead,
    error: leadError,
  } = await supabase
    .from('leads')
    .select('*')
    .eq('id', leadId)
    .single()

  if (leadError) throw leadError

  const {
    data: client,
    error: clientError,
  } = await supabase
    .from('clients')
    .insert({
      business_id: business.id,
      name: lead.name,
      email: lead.email,
      phone: lead.phone,
      notes: lead.notes,
    })
    .select()
    .single()

  if (clientError) throw clientError

  const { error: updateLeadError } = await supabase
    .from('leads')
    .update({
      status: 'converted',
      converted_to_client_id: client.id,
      converted_at: new Date().toISOString(),
    })
    .eq('id', leadId)

  if (updateLeadError) throw updateLeadError

  revalidatePath('/dashboard/leads')
  revalidatePath('/dashboard/clients')

  return client
}

export async function deleteLead(id: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('leads')
    .delete()
    .eq('id', id)

  if (error) throw error

  revalidatePath('/dashboard/leads')
}

