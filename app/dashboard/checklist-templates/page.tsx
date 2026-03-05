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
    <div className="w-full pb-20 md:pb-0 space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="font-dash-condensed font-extrabold text-2xl uppercase tracking-wide text-[var(--dash-text)]">
            Checklist Templates
          </h1>
          <p className="font-dash-mono text-[11px] text-[var(--dash-text-muted)] uppercase tracking-wider mt-0.5">
            Create templates for different service types
          </p>
        </div>
      </div>

      <ChecklistTemplates initialTemplates={templates} />
    </div>
  )
}
