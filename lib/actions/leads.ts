'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { getBusinessId } from './utils'

export async function getLeads() {
  const supabase = await createClient()
  const businessId = await getBusinessId()
  
  const { data: leads, error } = await supabase
    .from('leads')
    .select('*')
    .eq('business_id', businessId)
    .order('created_at', { ascending: false })
  
  if (error) throw error
  return leads || []
}

export async function addLead(formData: FormData) {
  const supabase = await createClient()
  const businessId = await getBusinessId()
  
  const leadData = {
    business_id: businessId,
    name: formData.get('name') as string,
    email: formData.get('email') as string || null,
    phone: formData.get('phone') as string || null,
    source: formData.get('source') as string || null,
    interested_in: formData.get('interested_in') as string || null,
    notes: formData.get('notes') as string || null,
    status: 'new',
    follow_up_date: formData.get('follow_up_date') as string || null,
  }
  
  const { error } = await supabase
    .from('leads')
    .insert(leadData)
  
  if (error) throw error
  
  revalidatePath('/dashboard/leads')
}

export async function updateLeadStatus(id: string, status: 'new' | 'contacted' | 'quoted' | 'converted' | 'lost') {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('leads')
    .update({ status })
    .eq('id', id)
  
  if (error) throw error
  
  revalidatePath('/dashboard/leads')
}

export async function convertLeadToClient(leadId: string) {
  const supabase = await createClient()
  const businessId = await getBusinessId()
  
  // Get lead
  const { data: lead, error: leadError } = await supabase
    .from('leads')
    .select('*')
    .eq('id', leadId)
    .single()
  
  if (leadError) throw leadError
  
  // Create client from lead
  const { error: clientError } = await supabase
    .from('clients')
    .insert({
      business_id: businessId,
      name: lead.name,
      email: lead.email,
      phone: lead.phone,
      notes: lead.notes
    })
  
  if (clientError) throw clientError
  
  // Update lead status
  await updateLeadStatus(leadId, 'converted')
  
  revalidatePath('/dashboard/leads')
  revalidatePath('/dashboard/clients')
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

