'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
// Using native select for now
import {
  Plus,
  Trash2,
  Save,
  MessageSquare,
  Mail,
  Clock,
  GitBranch,
  Tag,
  Settings,
  Bell,
  Loader2,
} from 'lucide-react'
import { createSequence, updateSequence, enrollLeadInSequence, type Sequence, type SequenceStep } from '@/lib/actions/sequences'
import { getLeads } from '@/lib/actions/leads'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { StepEditor } from './step-editor'

interface SequenceEditorProps {
  mode: 'create' | 'edit'
  sequence?: Sequence
}

export function SequenceEditor({ mode, sequence }: SequenceEditorProps) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [name, setName] = useState(sequence?.name || '')
  const [description, setDescription] = useState(sequence?.description || '')
  const [triggerType, setTriggerType] = useState<Sequence['trigger_type']>(
    sequence?.trigger_type || 'booking_abandoned'
  )
  const [enabled, setEnabled] = useState(sequence?.enabled || false)
  const [stopOnReply, setStopOnReply] = useState(sequence?.stop_on_reply ?? true)
  const [stopOnBooking, setStopOnBooking] = useState(sequence?.stop_on_booking ?? true)
  const [respectBusinessHours, setRespectBusinessHours] = useState(sequence?.respect_business_hours ?? true)
  const [steps, setSteps] = useState<SequenceStep[]>(sequence?.steps || [])
  const [selectedStepIndex, setSelectedStepIndex] = useState<number | null>(null)
  
  // Manual enrollment state
  const [leads, setLeads] = useState<any[]>([])
  const [selectedLeadId, setSelectedLeadId] = useState<string>('')
  const [enrolling, setEnrolling] = useState(false)
  const [loadingLeads, setLoadingLeads] = useState(false)

  const triggerOptions = [
    { value: 'booking_abandoned', label: 'Booking Abandoned' },
    { value: 'quote_sent', label: 'Quote Sent' },
    { value: 'no_response', label: 'No Response (7 days)' },
    { value: 'missed_call', label: 'Missed Call' },
    { value: 'post_service', label: 'Post-Service' },
    { value: 'custom', label: 'Custom Trigger' },
  ]

  // Load leads for manual enrollment
  useEffect(() => {
    if (mode === 'edit' && sequence?.id) {
      loadLeads()
    }
  }, [mode, sequence?.id])

  async function loadLeads() {
    setLoadingLeads(true)
    try {
      const allLeads = await getLeads('all')
      setLeads(allLeads || [])
    } catch (error) {
      console.error('Error loading leads:', error)
      toast.error('Failed to load leads')
    } finally {
      setLoadingLeads(false)
    }
  }

  async function handleEnrollLead() {
    if (!selectedLeadId || !sequence?.id) {
      toast.error('Please select a lead')
      return
    }

    setEnrolling(true)
    try {
      const success = await enrollLeadInSequence(selectedLeadId, sequence.id)
      if (success) {
        toast.success('Lead enrolled successfully!')
        setSelectedLeadId('')
        // Refresh the page to update enrollment count
        router.refresh()
      } else {
        toast.error('Failed to enroll lead. Lead may already be enrolled.')
      }
    } catch (error) {
      console.error('Error enrolling lead:', error)
      toast.error('Failed to enroll lead')
    } finally {
      setEnrolling(false)
    }
  }

  const handleAddStep = (stepType: SequenceStep['step_type']) => {
    const newStep: SequenceStep = {
      step_order: steps.length,
      step_type: stepType,
      message_template: '',
      delay_value: stepType === 'wait' ? 24 : null,
      delay_unit: stepType === 'wait' ? 'hours' : null,
      channel: stepType === 'send_sms' ? 'sms' : stepType === 'send_email' ? 'email' : null,
      subject: stepType === 'send_email' ? '' : null,
    }
    setSteps([...steps, newStep])
    setSelectedStepIndex(steps.length)
  }

  const handleUpdateStep = (index: number, updates: Partial<SequenceStep>) => {
    const updatedSteps = [...steps]
    updatedSteps[index] = { ...updatedSteps[index], ...updates }
    setSteps(updatedSteps)
  }

  const handleDeleteStep = (index: number) => {
    const updatedSteps = steps.filter((_, i) => i !== index)
    // Reorder steps
    const reorderedSteps = updatedSteps.map((step, i) => ({
      ...step,
      step_order: i,
    }))
    setSteps(reorderedSteps)
    if (selectedStepIndex === index) {
      setSelectedStepIndex(null)
    } else if (selectedStepIndex !== null && selectedStepIndex > index) {
      setSelectedStepIndex(selectedStepIndex - 1)
    }
  }

  const handleMoveStep = (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === steps.length - 1)
    ) {
      return
    }

    const newIndex = direction === 'up' ? index - 1 : index + 1
    const updatedSteps = [...steps]
    ;[updatedSteps[index], updatedSteps[newIndex]] = [
      updatedSteps[newIndex],
      updatedSteps[index],
    ]
    const reorderedSteps = updatedSteps.map((step, i) => ({
      ...step,
      step_order: i,
    }))
    setSteps(reorderedSteps)
    setSelectedStepIndex(newIndex)
  }

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error('Please enter a sequence name')
      return
    }

    if (steps.length === 0) {
      toast.error('Please add at least one step to the sequence')
      return
    }

    // Validate steps
    for (const step of steps) {
      if (step.step_type === 'send_sms' || step.step_type === 'send_email') {
        if (!step.message_template.trim()) {
          toast.error('All message steps must have a message template')
          return
        }
      }
      if (step.step_type === 'wait' && (!step.delay_value || !step.delay_unit)) {
        toast.error('Wait steps must have a delay value and unit')
        return
      }
    }

    setSaving(true)
    try {
      const sequenceData = {
        name: name.trim(),
        description: description.trim() || undefined,
        trigger_type: triggerType,
        enabled: mode === 'edit' ? enabled : false, // New sequences start disabled
        stop_on_reply: stopOnReply,
        stop_on_booking: stopOnBooking,
        respect_business_hours: respectBusinessHours,
        steps: steps.map((step, index) => ({
          ...step,
          step_order: index,
        })),
      }

      if (mode === 'create') {
        const result = await createSequence(sequenceData)
        if (result) {
          toast.success('Sequence created successfully')
          router.push(`/dashboard/leads/sequences/${result.id}`)
        } else {
          toast.error('Failed to create sequence')
        }
      } else if (sequence) {
        const success = await updateSequence(sequence.id, sequenceData)
        if (success) {
          toast.success('Sequence updated successfully')
          router.refresh()
        } else {
          toast.error('Failed to update sequence')
        }
      }
    } catch (error) {
      console.error('Error saving sequence:', error)
      toast.error('An error occurred while saving')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Left Column: Sequence Settings */}
      <div className="lg:col-span-1 space-y-6">
        <Card className="border-zinc-200/50 dark:border-white/10 bg-white/80 dark:bg-white/5">
          <CardHeader>
            <CardTitle>Sequence Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Booking Abandoned Follow-up"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What this sequence does..."
                className="mt-1"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="trigger">Trigger *</Label>
              <select
                id="trigger"
                value={triggerType}
                onChange={(e) => setTriggerType(e.target.value as any)}
                className="mt-1 block w-full rounded-md border border-zinc-200/50 dark:border-white/10 bg-white dark:bg-zinc-900 px-3 py-2 text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500/50"
              >
                {triggerOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="stop-on-reply">Stop if Lead Replies</Label>
                  <p className="text-xs text-zinc-600 dark:text-white/55 mt-0.5">
                    Automatically pause sequence when lead responds
                  </p>
                </div>
                <Switch
                  id="stop-on-reply"
                  checked={stopOnReply}
                  onCheckedChange={setStopOnReply}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="stop-on-booking">Stop if Lead Books</Label>
                  <p className="text-xs text-zinc-600 dark:text-white/55 mt-0.5">
                    Automatically pause sequence when lead books
                  </p>
                </div>
                <Switch
                  id="stop-on-booking"
                  checked={stopOnBooking}
                  onCheckedChange={setStopOnBooking}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="respect-hours">Respect Business Hours</Label>
                  <p className="text-xs text-zinc-600 dark:text-white/55 mt-0.5">
                    Only send messages during business hours
                  </p>
                </div>
                <Switch
                  id="respect-hours"
                  checked={respectBusinessHours}
                  onCheckedChange={setRespectBusinessHours}
                />
              </div>

              {mode === 'edit' && (
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="enabled">Enable Sequence</Label>
                    <p className="text-xs text-zinc-600 dark:text-white/55 mt-0.5">
                      When enabled, leads matching the trigger will be automatically enrolled and the sequence will process steps
                    </p>
                  </div>
                  <Switch
                    id="enabled"
                    checked={enabled}
                    onCheckedChange={setEnabled}
                  />
                </div>
              )}
            </div>

            {/* Manual Enrollment Section */}
            {mode === 'edit' && sequence?.id && (
              <div className="border-t border-zinc-200/50 dark:border-white/10 pt-6 mt-6">
                <div className="mb-4">
                  <Label>Manually Enroll Lead</Label>
                  <p className="text-xs text-zinc-600 dark:text-white/55 mt-0.5">
                    Select a lead by name to enroll in this sequence (sequence must be enabled)
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <select
                    value={selectedLeadId}
                    onChange={(e) => setSelectedLeadId(e.target.value)}
                    disabled={loadingLeads || enrolling}
                    className="flex-1 min-w-0 rounded-md border border-zinc-200/50 dark:border-white/10 bg-white dark:bg-zinc-900 px-3 py-2 text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500/50 disabled:opacity-50"
                  >
                    <option value="">Select a lead by name...</option>
                    {leads
                      .filter(lead => lead.name) // Only show leads with names
                      .sort((a, b) => (a.name || '').localeCompare(b.name || '')) // Sort alphabetically by name
                      .map((lead) => (
                        <option key={lead.id} value={lead.id}>
                          {lead.name}
                        </option>
                      ))}
                  </select>
                  <Button
                    onClick={handleEnrollLead}
                    disabled={!selectedLeadId || enrolling || loadingLeads}
                    className="bg-violet-600 hover:bg-violet-700 text-white whitespace-nowrap shrink-0"
                  >
                    {enrolling ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Enrolling...
                      </>
                    ) : (
                      'Enroll Lead'
                    )}
                  </Button>
                </div>
                {!enabled && (
                  <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">
                    Note: Sequence is disabled. Enable it above to start processing enrolled leads automatically.
                  </p>
                )}
              </div>
            )}

            <Button
              onClick={handleSave}
              disabled={saving || !name.trim()}
              className="w-full bg-violet-600 hover:bg-violet-700 text-white"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  {mode === 'create' ? 'Create Sequence' : 'Save Changes'}
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Right Column: Flow Builder */}
      <div className="lg:col-span-2 space-y-6">
        {/* Add Steps */}
        <Card className="border-zinc-200/50 dark:border-white/10 bg-white/80 dark:bg-white/5">
          <CardHeader>
            <CardTitle>Add Steps</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleAddStep('send_sms')}
                className="flex flex-col items-center gap-1 h-auto py-3"
              >
                <MessageSquare className="h-4 w-4" />
                <span className="text-xs">Send SMS</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleAddStep('send_email')}
                className="flex flex-col items-center gap-1 h-auto py-3"
              >
                <Mail className="h-4 w-4" />
                <span className="text-xs">Send Email</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleAddStep('wait')}
                className="flex flex-col items-center gap-1 h-auto py-3"
              >
                <Clock className="h-4 w-4" />
                <span className="text-xs">Wait</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleAddStep('condition')}
                className="flex flex-col items-center gap-1 h-auto py-3"
              >
                <GitBranch className="h-4 w-4" />
                <span className="text-xs">Condition</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleAddStep('add_tag')}
                className="flex flex-col items-center gap-1 h-auto py-3"
              >
                <Tag className="h-4 w-4" />
                <span className="text-xs">Add Tag</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleAddStep('change_status')}
                className="flex flex-col items-center gap-1 h-auto py-3"
              >
                <Settings className="h-4 w-4" />
                <span className="text-xs">Change Status</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleAddStep('notify_user')}
                className="flex flex-col items-center gap-1 h-auto py-3"
              >
                <Bell className="h-4 w-4" />
                <span className="text-xs">Notify User</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Flow Builder */}
        <Card className="border-zinc-200/50 dark:border-white/10 bg-white/80 dark:bg-white/5">
          <CardHeader>
            <CardTitle>Sequence Flow</CardTitle>
            {steps.length === 0 && (
              <p className="text-sm text-zinc-600 dark:text-white/55 mt-1">
                Add steps above to build your sequence
              </p>
            )}
          </CardHeader>
          <CardContent>
            {steps.length === 0 ? (
              <div className="text-center py-12 text-zinc-500 dark:text-zinc-400">
                <p className="text-sm">No steps yet</p>
                <p className="text-xs mt-1">Click the buttons above to add steps</p>
              </div>
            ) : (
              <div className="space-y-3">
                {steps.map((step, index) => (
                  <div
                    key={index}
                    className={`relative rounded-xl border p-4 transition-all cursor-pointer ${
                      selectedStepIndex === index
                        ? 'border-violet-500/50 bg-violet-500/10 dark:bg-violet-500/10'
                        : 'border-zinc-200/50 dark:border-white/10 bg-white/50 dark:bg-white/5 hover:border-zinc-300 dark:hover:border-white/20'
                    }`}
                    onClick={() => setSelectedStepIndex(index)}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 flex-1">
                        {/* Step Number */}
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-500/10 dark:bg-violet-500/20 text-violet-700 dark:text-violet-300 font-semibold text-sm flex-shrink-0">
                          {index + 1}
                        </div>

                        {/* Step Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline" className="capitalize">
                              {step.step_type.replace('_', ' ')}
                            </Badge>
                            {step.step_type === 'wait' && step.delay_value && step.delay_unit && (
                              <span className="text-xs text-zinc-600 dark:text-white/55">
                                {step.delay_value} {step.delay_unit}
                              </span>
                            )}
                          </div>
                          {(step.step_type === 'send_sms' || step.step_type === 'send_email') && (
                            <p className="text-sm text-zinc-700 dark:text-white/70 line-clamp-2">
                              {step.message_template || 'No message template'}
                            </p>
                          )}
                          {step.step_type === 'add_tag' && step.tag_name && (
                            <p className="text-sm text-zinc-700 dark:text-white/70">
                              Tag: {step.tag_name}
                            </p>
                          )}
                          {step.step_type === 'change_status' && step.status_value && (
                            <p className="text-sm text-zinc-700 dark:text-white/70">
                              Status: {step.status_value}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {index > 0 && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleMoveStep(index, 'up')
                            }}
                          >
                            ↑
                          </Button>
                        )}
                        {index < steps.length - 1 && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleMoveStep(index, 'down')
                            }}
                          >
                            ↓
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-600 hover:text-red-700"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteStep(index)
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Connector Line */}
                    {index < steps.length - 1 && (
                      <div className="absolute left-8 top-full w-px h-3 bg-zinc-200 dark:bg-zinc-700" />
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Step Editor */}
        {selectedStepIndex !== null && steps[selectedStepIndex] && (
          <StepEditor
            step={steps[selectedStepIndex]}
            stepIndex={selectedStepIndex}
            onUpdate={(updates) => handleUpdateStep(selectedStepIndex, updates)}
            onClose={() => setSelectedStepIndex(null)}
          />
        )}
      </div>
    </div>
  )
}
