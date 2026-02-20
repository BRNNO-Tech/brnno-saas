'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

/**
 * Checklist-linked inventory actions.
 * Uses schema: inventory_items (category, unit, current_stock, minimum_stock, unit_cost, supplier).
 * See migration 20250130000000_job_checklist_inventory.sql
 */

async function getBusinessId() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: business } = await supabase
    .from('businesses')
    .select('id')
    .eq('owner_id', user.id)
    .single()

  if (!business) throw new Error('Business not found')
  return business.id
}

export async function getChecklistInventoryItems() {
  const { isDemoMode } = await import('@/lib/demo/utils')
  if (await isDemoMode()) return []

  const supabase = await createClient()
  const businessId = await getBusinessId()

  const { data, error } = await supabase
    .from('inventory_items')
    .select('*')
    .eq('business_id', businessId)
    .order('category', { ascending: true })
    .order('name', { ascending: true })

  if (error) throw error
  return data || []
}

export async function createChecklistInventoryItem(formData: {
  name: string
  category: 'product' | 'tool' | 'supply'
  unit: string
  current_stock: number
  minimum_stock: number
  unit_cost?: number
  supplier?: string
  notes?: string
}) {
  const supabase = await createClient()
  const businessId = await getBusinessId()

  const { data, error } = await supabase
    .from('inventory_items')
    .insert({
      business_id: businessId,
      ...formData
    })
    .select()
    .single()

  if (error) throw error

  revalidatePath('/dashboard/inventory')
  return data
}

export async function updateChecklistInventoryItem(
  id: string,
  updates: {
    name?: string
    current_stock?: number
    minimum_stock?: number
    unit_cost?: number
    supplier?: string
    notes?: string
  }
) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('inventory_items')
    .update(updates)
    .eq('id', id)

  if (error) throw error

  revalidatePath('/dashboard/inventory')
}

export async function deleteChecklistInventoryItem(id: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('inventory_items')
    .delete()
    .eq('id', id)

  if (error) throw error

  revalidatePath('/dashboard/inventory')
}

export async function adjustChecklistInventoryStock(
  itemId: string,
  adjustment: number,
  reason: string
) {
  const supabase = await createClient()
  const businessId = await getBusinessId()

  const { data: item } = await supabase
    .from('inventory_items')
    .select('current_stock')
    .eq('id', itemId)
    .single()

  if (!item) throw new Error('Item not found')

  const newStock = (Number(item.current_stock) ?? 0) + adjustment
  await supabase
    .from('inventory_items')
    .update({ current_stock: newStock })
    .eq('id', itemId)

  if (adjustment < 0) {
    await supabase
      .from('inventory_usage')
      .insert({
        business_id: businessId,
        inventory_item_id: itemId,
        quantity_used: Math.abs(adjustment),
        notes: reason
      })
  }

  revalidatePath('/dashboard/inventory')
}

export async function getChecklistLowStockItems() {
  const supabase = await createClient()
  const businessId = await getBusinessId()

  const { data, error } = await supabase
    .from('inventory_items')
    .select('*')
    .eq('business_id', businessId)

  if (error) throw error

  const items = data || []
  return items.filter(
    (item) =>
      Number(item.current_stock) <= Number(item.minimum_stock)
  )
}
