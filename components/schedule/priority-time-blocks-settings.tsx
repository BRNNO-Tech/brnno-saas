'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Plus, Trash2, Clock, Calendar } from 'lucide-react'
import { toast } from 'sonner'

type PriorityBlock = {
    id: string
    name: string
    days: string[] // ['monday', 'tuesday', etc.]
    start_time: string // "12:00"
    end_time: string // "14:00"
    priority_for: string // "maintenance", "quick_details", "vip_customers", "new_customers", etc.
    fallback_hours: number // Hours before slot opens to everyone (e.g., 24)
    enabled: boolean
}

const DAYS = [
    { value: 'monday', label: 'Monday' },
    { value: 'tuesday', label: 'Tuesday' },
    { value: 'wednesday', label: 'Wednesday' },
    { value: 'thursday', label: 'Thursday' },
    { value: 'friday', label: 'Friday' },
    { value: 'saturday', label: 'Saturday' },
    { value: 'sunday', label: 'Sunday' },
]

const PRIORITY_TYPES = [
    { value: 'maintenance', label: 'Maintenance Jobs' },
    { value: 'quick_details', label: 'Quick Details' },
    { value: 'full_details', label: 'Full Details' },
    { value: 'vip_customers', label: 'VIP Customers' },
    { value: 'new_customers', label: 'New Customers' },
    { value: 'returning_customers', label: 'Returning Customers' },
    { value: 'ceramic_coating', label: 'Ceramic Coating' },
    { value: 'paint_correction', label: 'Paint Correction' },
    { value: 'custom', label: 'Custom' },
]

export default function PriorityTimeBlocksSettings({ businessId }: { businessId: string }) {
    const [blocks, setBlocks] = useState<PriorityBlock[]>([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [editingBlock, setEditingBlock] = useState<PriorityBlock | null>(null)
    const [showAddForm, setShowAddForm] = useState(false)

    // Form state for new/edit block
    const [formName, setFormName] = useState('')
    const [formDays, setFormDays] = useState<string[]>([])
    const [formStartTime, setFormStartTime] = useState('12:00')
    const [formEndTime, setFormEndTime] = useState('14:00')
    const [formPriorityFor, setFormPriorityFor] = useState('maintenance')
    const [formCustomPriority, setFormCustomPriority] = useState('')
    const [formFallbackHours, setFormFallbackHours] = useState(24)

    // Load existing blocks
    useEffect(() => {
        loadBlocks()
    }, [businessId])

    async function loadBlocks() {
        try {
            setLoading(true)
            const response = await fetch(`/api/priority-blocks?businessId=${businessId}`)
            if (response.ok) {
                const data = await response.json()
                setBlocks(data.blocks || [])
            }
        } catch (error) {
            console.error('Error loading priority blocks:', error)
            toast.error('Failed to load priority blocks')
        } finally {
            setLoading(false)
        }
    }

    function resetForm() {
        setFormName('')
        setFormDays([])
        setFormStartTime('12:00')
        setFormEndTime('14:00')
        setFormPriorityFor('maintenance')
        setFormCustomPriority('')
        setFormFallbackHours(24)
        setEditingBlock(null)
        setShowAddForm(false)
    }

    function startEdit(block: PriorityBlock) {
        setEditingBlock(block)
        setFormName(block.name)
        setFormDays(block.days)
        setFormStartTime(block.start_time)
        setFormEndTime(block.end_time)
        setFormPriorityFor(block.priority_for)
        setFormFallbackHours(block.fallback_hours)
        setShowAddForm(true)
    }

    async function handleSave() {
        // Validation
        if (!formName.trim()) {
            toast.error('Please enter a name for this priority block')
            return
        }
        if (formDays.length === 0) {
            toast.error('Please select at least one day')
            return
        }
        if (!formStartTime || !formEndTime) {
            toast.error('Please set start and end times')
            return
        }

        const priorityValue = formPriorityFor === 'custom' ? formCustomPriority : formPriorityFor
        if (!priorityValue.trim()) {
            toast.error('Please specify what this time block is for')
            return
        }

        setSaving(true)
        try {
            const blockData: Partial<PriorityBlock> = {
                name: formName.trim(),
                days: formDays,
                start_time: formStartTime,
                end_time: formEndTime,
                priority_for: priorityValue.trim(),
                fallback_hours: formFallbackHours,
                enabled: true,
            }

            const url = editingBlock
                ? `/api/priority-blocks/${editingBlock.id}`
                : '/api/priority-blocks'

            const response = await fetch(url, {
                method: editingBlock ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...blockData, businessId }),
            })

            if (!response.ok) {
                throw new Error('Failed to save priority block')
            }

            toast.success(editingBlock ? 'Priority block updated!' : 'Priority block created!')
            resetForm()
            loadBlocks()
        } catch (error) {
            console.error('Error saving priority block:', error)
            toast.error('Failed to save priority block')
        } finally {
            setSaving(false)
        }
    }

    async function handleDelete(blockId: string) {
        if (!confirm('Are you sure you want to delete this priority block?')) return

        try {
            const response = await fetch(`/api/priority-blocks/${blockId}`, {
                method: 'DELETE',
            })

            if (!response.ok) {
                throw new Error('Failed to delete priority block')
            }

            toast.success('Priority block deleted')
            loadBlocks()
        } catch (error) {
            console.error('Error deleting priority block:', error)
            toast.error('Failed to delete priority block')
        }
    }

    async function toggleBlock(blockId: string, enabled: boolean) {
        try {
            const response = await fetch(`/api/priority-blocks/${blockId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ enabled }),
            })

            if (!response.ok) {
                throw new Error('Failed to update priority block')
            }

            toast.success(enabled ? 'Priority block enabled' : 'Priority block disabled')
            loadBlocks()
        } catch (error) {
            console.error('Error toggling priority block:', error)
            toast.error('Failed to update priority block')
        }
    }

    if (loading) {
        return <div className="p-6">Loading priority blocks...</div>
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Priority Time Blocks</CardTitle>
                <CardDescription>
                    Reserve specific time slots for certain types of jobs or customers. If slots don't fill with priority bookings, they'll automatically open to everyone.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Existing Blocks */}
                {blocks.length > 0 && (
                    <div className="space-y-3">
                        {blocks.map((block) => (
                            <div
                                key={block.id}
                                className="flex items-center justify-between rounded-lg border p-4 bg-zinc-50 dark:bg-zinc-900"
                            >
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <h4 className="font-semibold">{block.name}</h4>
                                        <div className={`h-2 w-2 rounded-full ${block.enabled ? 'bg-green-500' : 'bg-zinc-400'}`} />
                                    </div>
                                    <div className="flex flex-wrap items-center gap-3 text-sm text-zinc-600 dark:text-zinc-400">
                                        <div className="flex items-center gap-1">
                                            <Calendar className="h-4 w-4" />
                                            <span>{block.days.map((d) => d.slice(0, 3).toUpperCase()).join(', ')}</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Clock className="h-4 w-4" />
                                            <span>{block.start_time} - {block.end_time}</span>
                                        </div>
                                        <div className="px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900 text-xs font-medium">
                                            {block.priority_for.replace('_', ' ')}
                                        </div>
                                        <span className="text-xs">Opens to all after {block.fallback_hours}h</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => toggleBlock(block.id, !block.enabled)}
                                    >
                                        {block.enabled ? 'Disable' : 'Enable'}
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => startEdit(block)}
                                    >
                                        Edit
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleDelete(block.id)}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {blocks.length === 0 && !showAddForm && (
                    <div className="rounded-lg border border-dashed border-zinc-300 dark:border-zinc-700 p-6 text-center">
                        <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-2">
                            No priority time blocks configured
                        </p>
                        <p className="text-xs text-zinc-500 dark:text-zinc-500">
                            Create priority blocks to reserve specific times for certain types of jobs
                        </p>
                    </div>
                )}

                <Separator />

                {/* Add/Edit Form */}
                {showAddForm ? (
                    <div className="space-y-4 rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20 p-4">
                        <h3 className="font-semibold text-lg">
                            {editingBlock ? 'Edit Priority Block' : 'New Priority Block'}
                        </h3>

                        {/* Name */}
                        <div>
                            <Label htmlFor="block_name">Block Name *</Label>
                            <Input
                                id="block_name"
                                value={formName}
                                onChange={(e) => setFormName(e.target.value)}
                                placeholder="e.g., Maintenance Priority Hours"
                                className="mt-1"
                            />
                        </div>

                        {/* Days */}
                        <div>
                            <Label>Days *</Label>
                            <div className="grid grid-cols-4 gap-2 mt-2">
                                {DAYS.map((day) => (
                                    <label
                                        key={day.value}
                                        className="flex items-center gap-2 text-sm cursor-pointer"
                                    >
                                        <input
                                            type="checkbox"
                                            checked={formDays.includes(day.value)}
                                            onChange={(e) => {
                                                if (e.target.checked) {
                                                    setFormDays([...formDays, day.value])
                                                } else {
                                                    setFormDays(formDays.filter((d) => d !== day.value))
                                                }
                                            }}
                                            className="h-4 w-4 rounded"
                                        />
                                        {day.label}
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Time Range */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="start_time">Start Time *</Label>
                                <Input
                                    id="start_time"
                                    type="time"
                                    value={formStartTime}
                                    onChange={(e) => setFormStartTime(e.target.value)}
                                    className="mt-1"
                                />
                            </div>
                            <div>
                                <Label htmlFor="end_time">End Time *</Label>
                                <Input
                                    id="end_time"
                                    type="time"
                                    value={formEndTime}
                                    onChange={(e) => setFormEndTime(e.target.value)}
                                    className="mt-1"
                                />
                            </div>
                        </div>

                        {/* Priority Type */}
                        <div>
                            <Label htmlFor="priority_for">Priority For *</Label>
                            <Select value={formPriorityFor} onValueChange={setFormPriorityFor}>
                                <SelectTrigger id="priority_for" className="mt-1">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {PRIORITY_TYPES.map((type) => (
                                        <SelectItem key={type.value} value={type.value}>
                                            {type.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {formPriorityFor === 'custom' && (
                                <Input
                                    value={formCustomPriority}
                                    onChange={(e) => setFormCustomPriority(e.target.value)}
                                    placeholder="Enter custom priority type"
                                    className="mt-2"
                                />
                            )}
                        </div>

                        {/* Fallback Hours */}
                        <div>
                            <Label htmlFor="fallback_hours">Open to Everyone After (hours)</Label>
                            <Input
                                id="fallback_hours"
                                type="number"
                                min="0"
                                max="168"
                                value={formFallbackHours}
                                onChange={(e) => setFormFallbackHours(parseInt(e.target.value) || 0)}
                                className="mt-1"
                            />
                            <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">
                                If this time slot isn't booked by priority customers, it opens to everyone this many hours before the appointment. Set to 0 to keep it always priority-only.
                            </p>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2 justify-end">
                            <Button variant="outline" onClick={resetForm} disabled={saving}>
                                Cancel
                            </Button>
                            <Button onClick={handleSave} disabled={saving}>
                                {saving ? 'Saving...' : editingBlock ? 'Update Block' : 'Create Block'}
                            </Button>
                        </div>
                    </div>
                ) : (
                    <Button onClick={() => setShowAddForm(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Priority Block
                    </Button>
                )}

                {/* Info Box */}
                <div className="rounded-lg bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 p-4">
                    <p className="text-sm text-blue-900 dark:text-blue-100">
                        <strong>How it works:</strong> Priority blocks reserve specific time slots for certain types of jobs or customers. For example, you can reserve 12-2pm daily for maintenance jobs. If those slots aren't filled, they automatically open to everyone based on your fallback setting.
                    </p>
                </div>
            </CardContent>
        </Card>
    )
}
