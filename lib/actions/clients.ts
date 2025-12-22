'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { getBusinessId } from './utils'

export async function getClients() {
  const supabase = await createClient()
  const businessId = await getBusinessId()
  
  const { data: clients, error } = await supabase
    .from('clients')
    .select('*')
    .eq('business_id', businessId)
    .order('created_at', { ascending: false })
  
  if (error) throw error
  return clients || []
}

export async function addClient(formData: FormData) {
  const supabase = await createClient()
  const businessId = await getBusinessId()
  
  const clientData = {
    business_id: businessId,
    name: formData.get('name') as string,
    email: formData.get('email') as string || null,
    phone: formData.get('phone') as string || null,
    notes: formData.get('notes') as string || null,
  }
  
  const { error } = await supabase
    .from('clients')
    .insert(clientData)
  
  if (error) throw error
  
  revalidatePath('/dashboard/clients')
}

export async function updateClient(id: string, formData: FormData) {
  const supabase = await createClient()
  
  const clientData = {
    name: formData.get('name') as string,
    email: formData.get('email') as string || null,
    phone: formData.get('phone') as string || null,
    notes: formData.get('notes') as string || null,
  }
  
  const { error } = await supabase
    .from('clients')
    .update(clientData)
    .eq('id', id)
  
  if (error) throw error
  
  revalidatePath('/dashboard/clients')
}

export async function deleteClient(id: string) {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('clients')
    .delete()
    .eq('id', id)
  
  if (error) throw error
  
  revalidatePath('/dashboard/clients')
}

