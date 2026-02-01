import { createClient } from '@/lib/supabase/server'
import { ChecklistTemplates } from '@/components/checklists/checklist-templates'

export const dynamic = 'force-dynamic'

async function getTemplates() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data: business } = await supabase
    .from('businesses')
    .select('id')
    .eq('owner_id', user.id)
    .single()

  if (!business) return []

  const { data: templates } = await supabase
    .from('checklist_templates')
    .select(`
      *,
      items:checklist_template_items(
        *,
        inventory_item:inventory_items(name, unit)
      )
    `)
    .eq('business_id', business.id)
    .order('created_at', { ascending: false })

  return templates || []
}

export default async function ChecklistTemplatesPage() {
  const templates = await getTemplates()

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">
          Checklist Templates
        </h1>
        <p className="mt-1 text-zinc-600 dark:text-zinc-400">
          Create templates for different service types
        </p>
      </div>

      <ChecklistTemplates initialTemplates={templates} />
    </div>
  )
}
