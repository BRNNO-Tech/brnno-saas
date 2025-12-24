'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getLeads(filter?: 'hot' | 'warm' | 'cold' | 'all') {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: business } = await supabase
    .from('businesses')
    .select('id')
    .eq('owner_id', user.id)
    .single()

  if (!business) throw new Error('No business found')

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

  const { data: business } = await supabase
    .from('businesses')
    .select('id')
    .eq('owner_id', user.id)
    .single()

  if (!business) throw new Error('No business found')

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
    score: 'warm',
  }

  const {
    data,
    error,
  } = await supabase
    .from('leads')
    .insert(leadData)
    .select()
    .single()

  if (error) throw error

  revalidatePath('/dashboard/leads')
  return data
}

export async function updateLeadStatus(
  id: string,
  status: 'new' | 'contacted' | 'quoted' | 'nurturing' | 'converted' | 'lost'
) {
  const supabase = await createClient()

  const updates: Record<string, unknown> = { status }

  if (status === 'contacted') {
    updates.last_contacted_at = new Date().toISOString()
  }

  const { error } = await supabase
    .from('leads')
    .update(updates)
    .eq('id', id)

  if (error) throw error

  if (status === 'contacted') {
    // Get current follow_up_count and increment
    const { data: lead } = await supabase
      .from('leads')
      .select('follow_up_count')
      .eq('id', id)
      .single()

    if (lead) {
      const { error: incrementError } = await supabase
        .from('leads')
        .update({
          follow_up_count: (lead.follow_up_count || 0) + 1,
        })
        .eq('id', id)

      if (incrementError) throw incrementError
    }
  }

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

  const { data: business } = await supabase
    .from('businesses')
    .select('id')
    .eq('owner_id', user.id)
    .single()

  if (!business) throw new Error('No business found')

  const { error } = await supabase.from('lead_interactions').insert({
    lead_id: leadId,
    business_id: business.id,
    type,
    direction: 'outbound',
    content,
    outcome: outcome || null,
  })

  if (error) throw error

  // Get current follow_up_count and increment
  const { data: lead } = await supabase
    .from('leads')
    .select('follow_up_count')
    .eq('id', leadId)
    .single()

  // Update lead's last_contacted_at and increment follow_up_count
  const { error: updateError } = await supabase
    .from('leads')
    .update({
      last_contacted_at: new Date().toISOString(),
      follow_up_count: lead ? (lead.follow_up_count || 0) + 1 : 1,
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

  const { data: business } = await supabase
    .from('businesses')
    .select('id')
    .eq('owner_id', user.id)
    .single()

  if (!business) throw new Error('No business found')

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

