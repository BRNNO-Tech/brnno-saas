'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { getBusinessId } from './utils'

// Find matching template by job title (trim + case-insensitive) and insert items into a checklist
async function applyTemplateToChecklist(
  supabase: Awaited<ReturnType<typeof createClient>>,
  checklistId: string,
  jobTitle: string,
  businessId: string
) {
  const { data: templates } = await supabase
    .from('checklist_templates')
    .select(`
      *,
      items:checklist_template_items(*)
    `)
    .eq('business_id', businessId)

  const jobTitleNorm = (jobTitle ?? '').trim().toLowerCase()
  const template = (templates ?? []).find(
    (t) => (t.service_name ?? '').trim().toLowerCase() === jobTitleNorm
  )

  if (!template?.items || !Array.isArray(template.items)) return

  const items = (template.items as Array<{
    id: string
    inventory_item_id: string | null
    item_name: string
    item_type: string
    estimated_quantity: number | null
  }>).map((item) => ({
    checklist_id: checklistId,
    template_item_id: item.id,
    inventory_item_id: item.inventory_item_id,
    item_name: item.item_name,
    item_type: item.item_type,
    estimated_quantity: item.estimated_quantity,
    is_checked: false
  }))

  await supabase.from('job_checklist_items').insert(items)
}

// Get or create checklist for a job
export async function getJobChecklist(jobId: string) {
  const supabase = await createClient()

  let { data: checklist } = await supabase
    .from('job_checklists')
    .select(`
      *,
      items:job_checklist_items(*)
    `)
    .eq('job_id', jobId)
    .single()

  const { data: job } = await supabase
    .from('jobs')
    .select('title, business_id')
    .eq('id', jobId)
    .single()

  if (!job) throw new Error('Job not found')

  if (!checklist) {
    const { data: newChecklist } = await supabase
      .from('job_checklists')
      .insert({ job_id: jobId })
      .select()
      .single()

    if (!newChecklist) throw new Error('Failed to create checklist')

    await applyTemplateToChecklist(
      supabase,
      newChecklist.id,
      job.title ?? '',
      job.business_id
    )

    const { data: completeChecklist } = await supabase
      .from('job_checklists')
      .select(`
        *,
        items:job_checklist_items(*)
      `)
      .eq('id', newChecklist.id)
      .single()

    checklist = completeChecklist
  } else {
    const itemCount = Array.isArray(checklist.items) ? checklist.items.length : 0
    if (itemCount === 0) {
      await applyTemplateToChecklist(
        supabase,
        checklist.id,
        job.title ?? '',
        job.business_id
      )
      const { data: refreshed } = await supabase
        .from('job_checklists')
        .select(`
          *,
          items:job_checklist_items(*)
        `)
        .eq('id', checklist.id)
        .single()
      if (refreshed) checklist = refreshed
    }
  }

  return checklist
}

export async function toggleChecklistItem(
  itemId: string,
  isChecked: boolean
) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('job_checklist_items')
    .update({
      is_checked: isChecked,
      checked_at: isChecked ? new Date().toISOString() : null
    })
    .eq('id', itemId)

  if (error) throw error

  revalidatePath('/dashboard/jobs')
  revalidatePath('/dashboard/schedule')
}

export async function startJobChecklist(checklistId: string) {
  const supabase = await createClient()

  const { data: checklist, error: fetchError } = await supabase
    .from('job_checklists')
    .select('job_id')
    .eq('id', checklistId)
    .single()

  if (fetchError || !checklist) throw new Error('Checklist not found')

  const { error } = await supabase
    .from('job_checklists')
    .update({
      status: 'in_progress',
      started_at: new Date().toISOString()
    })
    .eq('id', checklistId)

  if (error) throw error

  await supabase
    .from('jobs')
    .update({ status: 'in_progress' })
    .eq('id', checklist.job_id)

  revalidatePath('/dashboard/jobs')
  revalidatePath('/dashboard/schedule')
}

export async function completeJobChecklist(
  checklistId: string,
  inventoryUsage: Array<{
    itemId: string
    quantityUsed: number
  }>
) {
  const supabase = await createClient()
  const businessId = await getBusinessId()

  await supabase
    .from('job_checklists')
    .update({
      status: 'completed',
      completed_at: new Date().toISOString()
    })
    .eq('id', checklistId)

  const { data: checklist } = await supabase
    .from('job_checklists')
    .select('job_id')
    .eq('id', checklistId)
    .single()

  for (const usage of inventoryUsage) {
    const { data: item } = await supabase
      .from('inventory_items')
      .select('current_stock, unit_cost')
      .eq('id', usage.itemId)
      .single()

    if (item) {
      const current = Number(item.current_stock) ?? 0
      const newStock = current - usage.quantityUsed

      await supabase
        .from('inventory_items')
        .update({ current_stock: newStock })
        .eq('id', usage.itemId)

      const cost =
        item.unit_cost != null
          ? Number(item.unit_cost) * usage.quantityUsed
          : null

      await supabase.from('inventory_usage').insert({
        business_id: businessId,
        inventory_item_id: usage.itemId,
        job_id: checklist?.job_id ?? undefined,
        quantity_used: usage.quantityUsed,
        cost
      })
    }
  }

  await supabase
    .from('jobs')
    .update({
      status: 'completed',
      completed_at: new Date().toISOString()
    })
    .eq('id', checklist?.job_id)

  revalidatePath('/dashboard/jobs')
  revalidatePath('/dashboard/schedule')
  revalidatePath('/dashboard/inventory')
}
