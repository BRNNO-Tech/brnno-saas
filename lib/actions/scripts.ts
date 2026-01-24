'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export interface Script {
  id: string
  business_id: string
  name: string
  category: 'new_lead_instant_reply' | 'quote_follow_up' | 'missed_call_text_back' | 'shopping_around' | 'incentive_offer' | 'break_up_message' | 'reactivation' | 'custom'
  channel: 'sms' | 'email'
  body: string
  subject?: string | null
  tone: 'friendly' | 'premium' | 'direct'
  cta_style: 'booking_link' | 'question' | 'both' | 'none'
  is_ab_test: boolean
  ab_variant?: 'A' | 'B' | null
  parent_script_id?: string | null
  is_active: boolean
  usage_count: number
  reply_count: number
  booking_count: number
  total_revenue: number
  avg_time_to_book?: number | null
  created_at: string
  updated_at: string
}

export interface ScriptFormData {
  name: string
  category: Script['category']
  channel: Script['channel']
  body: string
  subject?: string
  tone: Script['tone']
  cta_style: Script['cta_style']
  is_ab_test?: boolean
  ab_variant?: 'A' | 'B'
  parent_script_id?: string
  is_active?: boolean
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

export async function getScripts(category?: string): Promise<Script[]> {
  // Check if in demo mode
  const { isDemoMode } = await import('@/lib/demo/utils')
  if (await isDemoMode()) {
    // Return empty array for demo mode (scripts are optional)
    return []
  }

  try {
    const supabase = await createClient()
    const businessId = await getBusinessId()

    let query = supabase
      .from('scripts')
      .select('*')
      .eq('business_id', businessId)
      .order('created_at', { ascending: false })

    if (category) {
      query = query.eq('category', category)
    }

    const { data: scripts, error } = await query

    if (error) {
      // Check if table doesn't exist (common when migration hasn't been run)
      if (error.code === '42P01' || error.message?.includes('does not exist')) {
        console.warn('Scripts table does not exist. Please run the migration: database/create_scripts_tables.sql')
        return []
      }
      throw error
    }
    return scripts || []
  } catch (error) {
    // Only log meaningful errors
    if (error instanceof Error && error.message) {
      console.error('Error fetching scripts:', error.message)
    } else if (typeof error === 'object' && error !== null && Object.keys(error).length > 0) {
      console.error('Error fetching scripts:', error)
    }
    return []
  }
}

export async function getScript(id: string): Promise<Script | null> {
  try {
    const supabase = await createClient()
    const businessId = await getBusinessId()

    const { data: script, error } = await supabase
      .from('scripts')
      .select('*')
      .eq('id', id)
      .eq('business_id', businessId)
      .single()

    if (error || !script) return null
    return script
  } catch (error) {
    console.error('Error fetching script:', error)
    return null
  }
}

export async function createScript(data: ScriptFormData): Promise<{ id: string } | null> {
  try {
    const supabase = await createClient()
    const businessId = await getBusinessId()

    const { data: script, error } = await supabase
      .from('scripts')
      .insert({
        business_id: businessId,
        name: data.name,
        category: data.category,
        channel: data.channel,
        body: data.body,
        subject: data.subject || null,
        tone: data.tone,
        cta_style: data.cta_style,
        is_ab_test: data.is_ab_test || false,
        ab_variant: data.ab_variant || null,
        parent_script_id: data.parent_script_id || null,
        is_active: data.is_active ?? true,
      })
      .select('id')
      .single()

    if (error || !script) {
      console.error('Error creating script:', error)
      return null
    }

    revalidatePath('/dashboard/leads/scripts')
    return { id: script.id }
  } catch (error) {
    console.error('Error creating script:', error)
    return null
  }
}

export async function updateScript(
  id: string,
  data: Partial<ScriptFormData>
): Promise<boolean> {
  try {
    const supabase = await createClient()
    const businessId = await getBusinessId()

    // Verify script belongs to business
    const { data: existing } = await supabase
      .from('scripts')
      .select('id')
      .eq('id', id)
      .eq('business_id', businessId)
      .single()

    if (!existing) {
      throw new Error('Script not found')
    }

    const updateData: any = {}
    if (data.name !== undefined) updateData.name = data.name
    if (data.category !== undefined) updateData.category = data.category
    if (data.channel !== undefined) updateData.channel = data.channel
    if (data.body !== undefined) updateData.body = data.body
    if (data.subject !== undefined) updateData.subject = data.subject || null
    if (data.tone !== undefined) updateData.tone = data.tone
    if (data.cta_style !== undefined) updateData.cta_style = data.cta_style
    if (data.is_ab_test !== undefined) updateData.is_ab_test = data.is_ab_test
    if (data.ab_variant !== undefined) updateData.ab_variant = data.ab_variant || null
    if (data.parent_script_id !== undefined) updateData.parent_script_id = data.parent_script_id || null
    if (data.is_active !== undefined) updateData.is_active = data.is_active

    const { error } = await supabase
      .from('scripts')
      .update(updateData)
      .eq('id', id)

    if (error) throw error

    revalidatePath('/dashboard/leads/scripts')
    revalidatePath(`/dashboard/leads/scripts/${id}`)
    return true
  } catch (error) {
    console.error('Error updating script:', error)
    return false
  }
}

export async function deleteScript(id: string): Promise<boolean> {
  try {
    const supabase = await createClient()
    const businessId = await getBusinessId()

    // Verify script belongs to business
    const { data: existing } = await supabase
      .from('scripts')
      .select('id')
      .eq('id', id)
      .eq('business_id', businessId)
      .single()

    if (!existing) {
      throw new Error('Script not found')
    }

    const { error } = await supabase
      .from('scripts')
      .delete()
      .eq('id', id)

    if (error) throw error

    revalidatePath('/dashboard/leads/scripts')
    return true
  } catch (error) {
    console.error('Error deleting script:', error)
    return false
  }
}

export async function duplicateScript(id: string): Promise<{ id: string } | null> {
  try {
    const script = await getScript(id)
    if (!script) return null

    const { id: newId } = await createScript({
      name: `${script.name} (Copy)`,
      category: script.category,
      channel: script.channel,
      body: script.body,
      subject: script.subject || undefined,
      tone: script.tone,
      cta_style: script.cta_style,
      is_ab_test: false, // Start fresh
      is_active: false, // Start inactive
    }) || {}

    return newId ? { id: newId } : null
  } catch (error) {
    console.error('Error duplicating script:', error)
    return null
  }
}

export async function trackScriptUsage(
  scriptId: string,
  leadId?: string,
  interactionId?: string
): Promise<boolean> {
  try {
    const supabase = await createClient()
    const businessId = await getBusinessId()

    // Verify script belongs to business
    const { data: script } = await supabase
      .from('scripts')
      .select('id')
      .eq('id', scriptId)
      .eq('business_id', businessId)
      .single()

    if (!script) {
      throw new Error('Script not found')
    }

    const { error } = await supabase
      .from('script_usages')
      .insert({
        script_id: scriptId,
        lead_id: leadId || null,
        interaction_id: interactionId || null,
      })

    if (error) throw error
    return true
  } catch (error) {
    console.error('Error tracking script usage:', error)
    return false
  }
}
