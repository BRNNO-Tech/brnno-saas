'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Plus, ClipboardList } from 'lucide-react'
import { CreateTemplateModal } from './create-template-modal'
import { TemplateCard } from './template-card'
import { useRouter } from 'next/navigation'

interface ChecklistTemplatesProps {
  initialTemplates: any[]
}

export function ChecklistTemplates({ initialTemplates }: ChecklistTemplatesProps) {
  const [templates, setTemplates] = useState(initialTemplates)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const router = useRouter()

  useEffect(() => {
    setTemplates(initialTemplates)
  }, [initialTemplates])

  function handleCloseCreateModal() {
    setShowCreateModal(false)
    router.refresh()
  }

  function handleUpdate() {
    router.refresh()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ClipboardList className="h-6 w-6 text-[var(--dash-blue)]" />
          <span className="font-dash-condensed font-bold text-lg text-[var(--dash-text)]">
            {templates.length} Template{templates.length !== 1 ? 's' : ''}
          </span>
        </div>
        <Button
          onClick={() => setShowCreateModal(true)}
          className="bg-[var(--dash-amber)] text-[var(--dash-black)] font-dash-condensed font-bold hover:opacity-90"
        >
          <Plus className="mr-2 h-4 w-4" />
          Create Template
        </Button>
      </div>

      {templates.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {templates.map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              onUpdate={handleUpdate}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-[var(--dash-border)] bg-[var(--dash-surface)] py-12 text-center">
          <ClipboardList className="mx-auto mb-4 h-12 w-12 text-[var(--dash-text-muted)]" />
          <p className="mb-2 font-dash-condensed font-bold text-[var(--dash-text)]">
            No checklist templates yet
          </p>
          <p className="mb-4 font-dash-mono text-[11px] text-[var(--dash-text-muted)]">
            Create templates for your service types to auto-generate checklists
          </p>
          <Button
            onClick={() => setShowCreateModal(true)}
            className="bg-[var(--dash-amber)] text-[var(--dash-black)] font-dash-condensed font-bold hover:opacity-90"
          >
            <Plus className="mr-2 h-4 w-4" />
            Create Your First Template
          </Button>
        </div>
      )}

      {showCreateModal && (
        <CreateTemplateModal
          open={showCreateModal}
          onClose={handleCloseCreateModal}
        />
      )}
    </div>
  )
}
