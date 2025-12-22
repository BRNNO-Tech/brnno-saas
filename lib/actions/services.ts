'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { getBusinessId } from './utils'

export async function getServices() {
  const supabase = await createClient()
  const businessId = await getBusinessId()
  
  const { data: services, error } = await supabase
    .from('services')
    .select('*')
    .eq('business_id', businessId)
    .order('created_at', { ascending: false })
  
  if (error) throw error
  return services || []
}

export async function addService(formData: FormData) {
  const supabase = await createClient()
  const businessId = await getBusinessId()
  
  const serviceData = {
    business_id: businessId,
    name: formData.get('name') as string,
    description: formData.get('description') as string || null,
    price: formData.get('price') ? parseFloat(formData.get('price') as string) : null,
    duration_minutes: formData.get('duration_minutes') ? parseInt(formData.get('duration_minutes') as string) : null,
  }
  
  const { error } = await supabase
    .from('services')
    .insert(serviceData)
  
  if (error) throw error
  
  revalidatePath('/dashboard/services')
}

export async function updateService(id: string, formData: FormData) {
  const supabase = await createClient()
  
  const serviceData = {
    name: formData.get('name') as string,
    description: formData.get('description') as string || null,
    price: formData.get('price') ? parseFloat(formData.get('price') as string) : null,
    duration_minutes: formData.get('duration_minutes') ? parseInt(formData.get('duration_minutes') as string) : null,
  }
  
  const { error } = await supabase
    .from('services')
    .update(serviceData)
    .eq('id', id)
  
  if (error) throw error
  
  revalidatePath('/dashboard/services')
}

export async function deleteService(id: string) {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('services')
    .delete()
    .eq('id', id)
  
  if (error) throw error
  
  revalidatePath('/dashboard/services')
}

