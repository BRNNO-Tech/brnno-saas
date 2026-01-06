'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { getBusinessId } from './utils'

export async function getServices() {
  const supabase = await createClient()
  const businessId = await getBusinessId()
  
  const { data: services, error } = await supabase
    .from('services')
    .select('id, name, description, price, duration_minutes, created_at, updated_at')
    .eq('business_id', businessId)
    .order('created_at', { ascending: false })
  
  if (error) throw error
  return services || []
}

export async function addService(formData: FormData) {
  const supabase = await createClient()
  const businessId = await getBusinessId()
  
  // Convert hours to minutes for storage
  const durationHours = formData.get('duration_minutes') ? parseFloat(formData.get('duration_minutes') as string) : null
  const durationMinutes = durationHours ? Math.round(durationHours * 60) : null

  const serviceData = {
    business_id: businessId,
    name: formData.get('name') as string,
    description: formData.get('description') as string || null,
    price: formData.get('price') ? parseFloat(formData.get('price') as string) : null,
    duration_minutes: durationMinutes,
  }
  
  const { error } = await supabase
    .from('services')
    .insert(serviceData)
  
  if (error) throw error
  
  revalidatePath('/dashboard/services')
}

export async function updateService(id: string, formData: FormData) {
  const supabase = await createClient()
  
  // Convert hours to minutes for storage
  const durationHours = formData.get('duration_minutes') ? parseFloat(formData.get('duration_minutes') as string) : null
  const durationMinutes = durationHours ? Math.round(durationHours * 60) : null

  const serviceData = {
    name: formData.get('name') as string,
    description: formData.get('description') as string || null,
    price: formData.get('price') ? parseFloat(formData.get('price') as string) : null,
    duration_minutes: durationMinutes,
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

