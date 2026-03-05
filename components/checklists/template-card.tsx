'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Package, Wrench, CheckCircle, MoreVertical, Pencil, Trash2, Copy } from 'lucide-react'
import { EditTemplateModal } from './edit-template-modal'
import { toast } from 'sonner'

interface TemplateCardProps {
  template: any
  onUpdate: () => void
}

export function TemplateCard({ template, onUpdate }: TemplateCardProps) {
  const [showEditModal, setShowEditModal] = useState(false)

  const items = template.items ?? []
  const products = items.filter((i: any) => i.item_type === 'product')
  const tools = items.filter((i: any) => i.item_type === 'tool')
  const tasks = items.filter((i: any) => i.item_type === 'task')

  async function handleDelete() {
    if (!confirm(`Delete template for "${template.service_name}"?`)) return
    try {
      const response = await fetch(`/api/checklist-templates/${template.id}`, {
        method: 'DELETE',
      })
      if (!response.ok) throw new Error('Failed to delete')
      toast.success('Template deleted')
      onUpdate()
    } catch (error) {
      console.error('Error deleting template:', error)
      toast.error('Failed to delete template')
    }
  }

  async function handleDuplicate() {
    try {
      const response = await fetch(`/api/checklist-templates/${template.id}/duplicate`, {
        method: 'POST',
      })
      if (!response.ok) throw new Error('Failed to duplicate')
      toast.success('Template duplicated')
      onUpdate()
    } catch (error) {
      console.error('Error duplicating template:', error)
      toast.error('Failed to duplicate template')
    }
  }

  return (
    <>
      <div className="rounded-2xl border border-[var(--dash-border)] bg-[var(--dash-surface)] p-4 transition-all hover:border-[var(--dash-border-bright)]">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h3 className="font-dash-condensed font-bold text-lg text-[var(--dash-text)]">
              {template.service_name}
            </h3>
            <p className="font-dash-mono text-[11px] text-[var(--dash-text-muted)]">
              {items.length} item{items.length !== 1 ? 's' : ''}
            </p>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-[var(--dash-text-muted)] hover:text-[var(--dash-amber)] hover:bg-[var(--dash-graphite)]">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-[var(--dash-graphite)] border-[var(--dash-border)]">
              <DropdownMenuItem onClick={() => setShowEditModal(true)} className="font-dash-mono text-[12px] text-[var(--dash-text)] focus:bg-[var(--dash-surface)] focus:text-[var(--dash-amber)]">
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleDuplicate} className="font-dash-mono text-[12px] text-[var(--dash-text)] focus:bg-[var(--dash-surface)] focus:text-[var(--dash-amber)]">
                <Copy className="mr-2 h-4 w-4" />
                Duplicate
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleDelete} variant="destructive" className="font-dash-mono text-[12px] focus:bg-[var(--dash-red)]/20 focus:text-[var(--dash-red)]">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="space-y-2">
          {products.length > 0 && (
            <div className="flex items-center gap-2 font-dash-mono text-[11px] text-[var(--dash-text-muted)]">
              <Package className="h-4 w-4 text-[var(--dash-blue)]" />
              <span>
                {products.length} product{products.length !== 1 ? 's' : ''}
              </span>
            </div>
          )}
          {tools.length > 0 && (
            <div className="flex items-center gap-2 font-dash-mono text-[11px] text-[var(--dash-text-muted)]">
              <Wrench className="h-4 w-4 text-[var(--dash-green)]" />
              <span>
                {tools.length} tool{tools.length !== 1 ? 's' : ''}
              </span>
            </div>
          )}
          {tasks.length > 0 && (
            <div className="flex items-center gap-2 font-dash-mono text-[11px] text-[var(--dash-text-muted)]">
              <CheckCircle className="h-4 w-4 text-[var(--dash-amber)]" />
              <span>
                {tasks.length} task{tasks.length !== 1 ? 's' : ''}
              </span>
            </div>
          )}
        </div>

        {items.length > 0 && (
          <div className="mt-4 border-t border-[var(--dash-border)] pt-4">
            <p className="mb-2 font-dash-mono text-[10px] uppercase tracking-wider text-[var(--dash-text-muted)]">Items</p>
            <div className="space-y-1">
              {items.slice(0, 3).map((item: any) => (
                <p key={item.id} className="font-dash-mono text-[11px] text-[var(--dash-text)]">
                  • {item.item_name}
                  {item.estimated_quantity != null &&
                    ` (${item.estimated_quantity} ${item.inventory_item?.unit ?? 'units'})`}
                </p>
              ))}
              {items.length > 3 && (
                <p className="font-dash-mono text-[11px] text-[var(--dash-text-muted)]">
                  +{items.length - 3} more...
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {showEditModal && (
        <EditTemplateModal
          open={showEditModal}
          onClose={() => {
            setShowEditModal(false)
            onUpdate()
          }}
          template={template}
        />
      )}
    </>
  )
}
