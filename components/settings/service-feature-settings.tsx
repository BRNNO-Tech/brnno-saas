'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  getServiceFeatureConfig,
  updateServiceFeatureConfig,
} from '@/lib/actions/service-features'
import type { FeatureCategory, FeatureOption } from '@/lib/features/master-features'
import { MASTER_FEATURES } from '@/lib/features/master-features'
import { toast } from 'sonner'
import { Plus, Pencil, Trash2, RotateCcw } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'

const ICON_OPTIONS = [
  { value: 'droplets', label: 'Droplets' },
  { value: 'sparkles', label: 'Sparkles' },
  { value: 'wind', label: 'Wind' },
  { value: 'disc', label: 'Disc' },
  { value: 'trash', label: 'Trash' },
  { value: 'shield-check', label: 'Shield' },
]

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '')
}

export default function ServiceFeatureSettings() {
  const [config, setConfig] = useState<FeatureCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [categoryModal, setCategoryModal] = useState<'add' | 'edit' | null>(null)
  const [optionModal, setOptionModal] = useState<'add' | 'edit' | null>(null)
  const [editingCategoryIndex, setEditingCategoryIndex] = useState<number | null>(null)
  const [editingOption, setEditingOption] = useState<{ catIndex: number; optIndex: number } | null>(null)
  const [categoryLabel, setCategoryLabel] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [optionLabel, setOptionLabel] = useState('')
  const [optionId, setOptionId] = useState('')
  const [optionIcon, setOptionIcon] = useState('sparkles')
  const [optionEmoji, setOptionEmoji] = useState('')

  useEffect(() => {
    getServiceFeatureConfig().then(setConfig).finally(() => setLoading(false))
  }, [])

  const openAddCategory = () => {
    setCategoryLabel('')
    setCategoryId('')
    setCategoryModal('add')
  }

  const openEditCategory = (index: number) => {
    const cat = config[index]
    setCategoryLabel(cat.category_label)
    setCategoryId(cat.category_id)
    setEditingCategoryIndex(index)
    setCategoryModal('edit')
  }

  const saveCategory = () => {
    if (!categoryLabel.trim()) return
    const id = categoryModal === 'add' ? slugify(categoryLabel) || `cat_${Date.now()}` : categoryId
    if (categoryModal === 'add') {
      setConfig((prev) => [
        ...prev,
        { category_id: id, category_label: categoryLabel.trim(), options: [] },
      ])
    } else if (editingCategoryIndex !== null) {
      setConfig((prev) => {
        const next = [...prev]
        next[editingCategoryIndex] = {
          ...next[editingCategoryIndex],
          category_id: id,
          category_label: categoryLabel.trim(),
        }
        return next
      })
    }
    setCategoryModal(null)
    setEditingCategoryIndex(null)
  }

  const deleteCategory = (index: number) => {
    if (!confirm('Delete this category and all its options?')) return
    setConfig((prev) => prev.filter((_, i) => i !== index))
  }

  const openAddOption = (catIndex: number) => {
    const cat = config[catIndex]
    setOptionLabel('')
    setOptionId('')
    setOptionIcon('sparkles')
    setOptionEmoji('')
    setEditingOption({ catIndex, optIndex: -1 })
    setOptionModal('add')
  }

  const openEditOption = (catIndex: number, optIndex: number) => {
    const opt = config[catIndex].options[optIndex]
    setOptionLabel(opt.label)
    setOptionId(opt.id)
    setOptionIcon(opt.icon)
    setOptionEmoji(opt.emoji ?? '')
    setEditingOption({ catIndex, optIndex })
    setOptionModal('edit')
  }

  const saveOption = () => {
    if (!optionLabel.trim()) return
    const catIndex = editingOption?.catIndex ?? 0
    const newOpt: FeatureOption = {
      id: optionModal === 'add' ? `${config[catIndex].category_id}_${slugify(optionLabel)}` || `opt_${Date.now()}` : optionId,
      label: optionLabel.trim(),
      icon: optionIcon,
      ...(optionEmoji.trim() ? { emoji: optionEmoji.trim() } : {}),
    }
    if (optionModal === 'add') {
      setConfig((prev) => {
        const next = [...prev]
        next[catIndex] = {
          ...next[catIndex],
          options: [...next[catIndex].options, newOpt],
        }
        return next
      })
    } else if (editingOption && editingOption.optIndex >= 0) {
      setConfig((prev) => {
        const next = [...prev]
        next[editingOption.catIndex].options = [...next[editingOption.catIndex].options]
        next[editingOption.catIndex].options[editingOption.optIndex] = newOpt
        return next
      })
    }
    setOptionModal(null)
    setEditingOption(null)
  }

  const deleteOption = (catIndex: number, optIndex: number) => {
    if (!confirm('Remove this option?')) return
    setConfig((prev) => {
      const next = [...prev]
      next[catIndex] = {
        ...next[catIndex],
        options: next[catIndex].options.filter((_, i) => i !== optIndex),
      }
      return next
    })
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await updateServiceFeatureConfig(config)
      toast.success('What\'s Included options saved.')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const handleReset = () => {
    if (!confirm('Reset to default exterior/interior options? This cannot be undone.')) return
    setConfig(JSON.parse(JSON.stringify(MASTER_FEATURES)))
    toast.info('Reset to defaults. Click Save to apply.')
  }

  if (loading) {
    return <div className="p-4 text-sm text-muted-foreground">Loading...</div>
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>What&apos;s Included Options</CardTitle>
          <CardDescription>
            Edit the exterior and interior options shown when creating or editing a service. You can add an optional emoji (paste one, e.g. 🫧) for each option.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {config.map((category, catIndex) => (
            <div key={category.category_id} className="rounded-lg border p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">
                  {category.category_label}
                </h3>
                <div className="flex gap-2">
                  <Button type="button" variant="ghost" size="icon" onClick={() => openEditCategory(catIndex)} aria-label="Edit category">
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button type="button" variant="ghost" size="icon" onClick={() => deleteCategory(catIndex)} aria-label="Delete category">
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                  <Button type="button" variant="outline" size="sm" onClick={() => openAddOption(catIndex)}>
                    <Plus className="h-4 w-4 mr-1" />
                    Add option
                  </Button>
                </div>
              </div>
              <ul className="space-y-2">
                {category.options.map((opt, optIndex) => (
                  <li key={opt.id} className="flex items-center justify-between py-2 px-3 rounded-md bg-muted/50">
                    <span className="flex items-center gap-2">
                      {opt.emoji && <span className="text-lg">{opt.emoji}</span>}
                      <span className="text-sm font-medium">{opt.label}</span>
                    </span>
                    <div className="flex gap-1">
                      <Button type="button" variant="ghost" size="icon" onClick={() => openEditOption(catIndex, optIndex)} aria-label="Edit option">
                        <Pencil className="h-3 w-3" />
                      </Button>
                      <Button type="button" variant="ghost" size="icon" onClick={() => deleteOption(catIndex, optIndex)} aria-label="Delete option">
                        <Trash2 className="h-3 w-3 text-destructive" />
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div className="flex flex-wrap gap-2 pt-4">
            <Button type="button" variant="outline" onClick={openAddCategory}>
              <Plus className="h-4 w-4 mr-2" />
              Add category
            </Button>
            <Button type="button" variant="outline" onClick={handleReset}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset to defaults
            </Button>
            <Button type="button" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : 'Save changes'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Category modal */}
      <Dialog open={categoryModal !== null} onOpenChange={() => { setCategoryModal(null); setEditingCategoryIndex(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{categoryModal === 'add' ? 'Add category' : 'Edit category'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Category name (e.g. Exterior Care)</Label>
              <Input
                value={categoryLabel}
                onChange={(e) => setCategoryLabel(e.target.value)}
                placeholder="Exterior Care"
              />
            </div>
            {categoryModal === 'edit' && (
              <div>
                <Label>ID (used in options; avoid changing)</Label>
                <Input
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  placeholder="ext"
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCategoryModal(null)}>Cancel</Button>
            <Button onClick={saveCategory}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Option modal */}
      <Dialog open={optionModal !== null} onOpenChange={() => { setOptionModal(null); setEditingOption(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{optionModal === 'add' ? 'Add option' : 'Edit option'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Label</Label>
              <Input
                value={optionLabel}
                onChange={(e) => setOptionLabel(e.target.value)}
                placeholder="Hand Wash"
              />
            </div>
            {optionModal === 'edit' && (
              <div>
                <Label>ID (used when saving service; avoid changing)</Label>
                <Input
                  value={optionId}
                  onChange={(e) => setOptionId(e.target.value)}
                  placeholder="ext_wash"
                />
              </div>
            )}
            <div>
              <Label>Icon</Label>
              <select
                className="w-full h-9 rounded-md border border-input bg-background px-3"
                value={optionIcon}
                onChange={(e) => setOptionIcon(e.target.value)}
              >
                {ICON_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div>
              <Label>Emoji (optional — paste one, e.g. 🫧)</Label>
              <Input
                value={optionEmoji}
                onChange={(e) => setOptionEmoji(e.target.value)}
                placeholder="🫧"
                maxLength={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOptionModal(null)}>Cancel</Button>
            <Button onClick={saveOption}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
