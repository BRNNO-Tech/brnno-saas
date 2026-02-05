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
      <div className="rounded-2xl border border-zinc-200 bg-white p-4 transition-all hover:shadow-md dark:border-zinc-700 dark:bg-zinc-900">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">
              {template.service_name}
            </h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              {items.length} item{items.length !== 1 ? 's' : ''}
            </p>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setShowEditModal(true)}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleDuplicate}>
                <Copy className="mr-2 h-4 w-4" />
                Duplicate
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleDelete} variant="destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="space-y-2">
          {products.length > 0 && (
            <div className="flex items-center gap-2 text-sm">
              <Package className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <span className="text-zinc-600 dark:text-zinc-400">
                {products.length} product{products.length !== 1 ? 's' : ''}
              </span>
            </div>
          )}
          {tools.length > 0 && (
            <div className="flex items-center gap-2 text-sm">
              <Wrench className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <span className="text-zinc-600 dark:text-zinc-400">
                {tools.length} tool{tools.length !== 1 ? 's' : ''}
              </span>
            </div>
          )}
          {tasks.length > 0 && (
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              <span className="text-zinc-600 dark:text-zinc-400">
                {tasks.length} task{tasks.length !== 1 ? 's' : ''}
              </span>
            </div>
          )}
        </div>

        {items.length > 0 && (
          <div className="mt-4 border-t border-zinc-200 pt-4 dark:border-zinc-700">
            <p className="mb-2 text-xs text-zinc-500 dark:text-zinc-400">Items:</p>
            <div className="space-y-1">
              {items.slice(0, 3).map((item: any) => (
                <p key={item.id} className="text-xs text-zinc-700 dark:text-zinc-300">
                  • {item.item_name}
                  {item.estimated_quantity != null &&
                    ` (${item.estimated_quantity} ${item.inventory_item?.unit ?? 'units'})`}
                </p>
              ))}
              {items.length > 3 && (
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
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
