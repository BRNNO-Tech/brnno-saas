'use client'

import { useState } from 'react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  ArrowLeft,
  Phone,
  Mail,
  MessageSquare,
  UserPlus,
  Trash2,
  Plus,
  Calendar,
  DollarSign,
  TrendingUp,
  Briefcase,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  deleteLead,
  updateLeadStatus,
  convertLeadToClient,
} from '@/lib/actions/leads'
import { setFollowUpReminder } from '@/lib/actions/lead-reminders'
import AddInteractionDialog from './add-interaction-dialog'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

type Lead = {
  id: string
  name: string
  email: string | null
  phone: string | null
  source: string | null
  interested_in_service_name: string | null
  estimated_value: number | null
  booking_progress: number
  abandoned_at_step: string | null
  preferred_date: string | null
  preferred_time: string | null
  score: string
  status: string
  last_contacted_at: string | null
  next_follow_up_date: string | null
  follow_up_count: number
  notes: string | null
  created_at: string
  job_id: string | null
  interested_service?: {
    name: string
    price: number
    description: string | null
  } | null
  interactions?: Array<{
    id: string
    type: string
    direction: string
    content: string
    outcome: string | null
    created_at: string
  }>
}

export default function LeadDetailView({ lead }: { lead: Lead }) {
  const router = useRouter()
  const [showInteractionDialog, setShowInteractionDialog] = useState(false)
  const [showReminderDialog, setShowReminderDialog] = useState(false)

  async function handleDelete() {
    if (!confirm('Delete this lead permanently?')) return

    try {
      await deleteLead(lead.id)
      router.push('/dashboard/leads')
    } catch (error) {
      console.error('Error deleting lead:', error)
      alert('Failed to delete lead')
    }
  }

  async function handleStatusChange(
    status: 'new' | 'in_progress' | 'quoted' | 'nurturing' | 'booked' | 'lost'
  ) {
    try {
      await updateLeadStatus(lead.id, status)
      router.refresh()
    } catch (error) {
      console.error('Error updating status:', error)
      alert('Failed to update status')
    }
  }

  async function handleScheduleJob() {
    if (!confirm('Schedule a job for this lead?')) return

    try {
      await convertLeadToClient(lead.id)
      alert('Lead scheduled! Redirecting to clients...')
      router.push('/dashboard/customers')
    } catch (error) {
      console.error('Error scheduling job:', error)
      alert('Failed to schedule job')
    }
  }

  const timeSinceCreated = Math.floor(
    (Date.now() - new Date(lead.created_at).getTime()) / (1000 * 60 * 60)
  )
  const isUrgent = lead.score === 'hot' && timeSinceCreated < 2

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold">{lead.name}</h1>
              {/* Step 7: Source chip */}
              {lead.source && (
                <Badge variant="outline">
                  {lead.source === 'booking' ? 'Booking' : 
                   lead.source === 'quote' ? 'Quick Quote' : 
                   'Manual'}
                </Badge>
              )}
              {lead.estimated_value != null && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <DollarSign className="h-3 w-3" />
                  ${lead.estimated_value.toFixed(2)}
                </Badge>
              )}
            </div>
            <p className="text-zinc-600 dark:text-zinc-400">
              Lead created{' '}
              {timeSinceCreated < 1
                ? 'less than an hour ago'
                : `${timeSinceCreated} hours ago`}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {/* Show "View Job" for booking leads, "Schedule Job" for manual leads */}
          {lead.status !== 'booked' && lead.status !== 'lost' && (
            lead.source === 'booking' && lead.job_id ? (
              <Link href={`/dashboard/jobs/${lead.job_id}`}>
                <Button>
                  <Briefcase className="mr-2 h-4 w-4" />
                  View Job
                </Button>
              </Link>
            ) : lead.source !== 'booking' ? (
              <Button onClick={handleScheduleJob}>
                <Calendar className="mr-2 h-4 w-4" />
                Schedule Job
              </Button>
            ) : null
          )}
          <Button variant="destructive" onClick={handleDelete}>
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column - Lead Info */}
        <div className="space-y-6 lg:col-span-1">
          {/* Contact Info */}
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {lead.phone && (
                <div className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-zinc-600" />
                  <div>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">
                      Phone
                    </p>
                    <a
                      href={`tel:${lead.phone}`}
                      className="font-medium hover:underline"
                    >
                      {lead.phone}
                    </a>
                  </div>
                </div>
              )}

              {lead.email && (
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-zinc-600" />
                  <div>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">
                      Email
                    </p>
                    <a
                      href={`mailto:${lead.email}`}
                      className="font-medium hover:underline"
                    >
                      {lead.email}
                    </a>
                  </div>
                </div>
              )}

              {/* Step 7: Source chip */}
              {lead.source && (
                <div className="flex items-center gap-3">
                  <TrendingUp className="h-5 w-5 text-zinc-600" />
                  <div>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">
                      Source
                    </p>
                    <Badge variant="outline" className="mt-1">
                      {lead.source === 'booking' ? 'Booking' : 
                       lead.source === 'quote' ? 'Quick Quote' : 
                       'Manual'}
                    </Badge>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Step 6: Lead Info - Highlight source, value, time, status (removed score/temperature/nurturing) */}
          <Card>
            <CardHeader>
              <CardTitle>Lead Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Source - Step 7 */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-zinc-600 dark:text-zinc-400">
                  Source
                </span>
                <Badge variant="outline" className="capitalize">
                  {lead.source === 'booking' ? 'Booking' : 
                   lead.source === 'quote' ? 'Quick Quote' : 
                   lead.source || 'Manual'}
                </Badge>
              </div>

              {/* Status */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-zinc-600 dark:text-zinc-400">
                  Status
                </span>
                <Badge variant="secondary" className="capitalize">
                  {lead.status === 'booked' ? 'Booked' :
                   lead.status === 'in_progress' ? 'In Progress' :
                   lead.status === 'quoted' ? 'Quoted' :
                   lead.status === 'viewed' ? 'Viewed' :
                   lead.status === 'abandoned' ? 'Abandoned' :
                   lead.status.replace('_', ' ')}
                </Badge>
              </div>

              {/* Quote Value */}
              {lead.estimated_value && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-zinc-600 dark:text-zinc-400">
                    Quote Value
                  </span>
                  <span className="font-semibold text-green-600">
                    ${lead.estimated_value.toFixed(2)}
                  </span>
                </div>
              )}

              {/* Time since last activity */}
              {lead.last_contacted_at && (
                <div>
                  <p className="mb-1 text-sm text-zinc-600 dark:text-zinc-400">
                    Last Activity
                  </p>
                  <p className="text-sm font-medium">
                    {new Date(lead.last_contacted_at).toLocaleString()}
                  </p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-500 mt-1">
                    {Math.floor((Date.now() - new Date(lead.last_contacted_at).getTime()) / (1000 * 60 * 60))} hours ago
                  </p>
                </div>
              )}

              {/* Conversion Status */}
              {lead.status === 'booked' && lead.job_id && (
                <div className="pt-2 border-t">
                  <Link href={`/dashboard/jobs/${lead.job_id}`}>
                    <Button variant="outline" className="w-full">
                      <Briefcase className="mr-2 h-4 w-4" />
                      View Job
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Interest */}
          {lead.interested_in_service_name && (
            <Card>
              <CardHeader>
                <CardTitle>Interest</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="mb-1 text-sm text-zinc-600 dark:text-zinc-400">
                    Service
                  </p>
                  <p className="font-semibold">
                    {lead.interested_in_service_name}
                  </p>
                  {lead.interested_service?.description && (
                    <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                      {lead.interested_service.description}
                    </p>
                  )}
                </div>

                {lead.estimated_value && (
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="text-sm text-zinc-600 dark:text-zinc-400">
                        Estimated Value
                      </p>
                      <p className="text-xl font-bold text-green-600">
                        ${lead.estimated_value.toFixed(2)}
                      </p>
                    </div>
                  </div>
                )}

                {lead.booking_progress > 0 && (
                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <p className="text-sm text-zinc-600 dark:text-zinc-400">
                        Conversion Progress
                      </p>
                      <span className="text-sm font-medium">
                        {lead.booking_progress}%
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-zinc-200 dark:bg-zinc-700">
                      <div
                        className="h-2 rounded-full bg-blue-600"
                        style={{ width: `${lead.booking_progress}%` }}
                      />
                    </div>
                    {lead.abandoned_at_step && (
                      <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
                        Abandoned at:{' '}
                        {lead.abandoned_at_step.replace('_', ' ')}
                      </p>
                    )}
                  </div>
                )}

                {(lead.preferred_date || lead.preferred_time) && (
                  <div className="flex items-start gap-2">
                    <Calendar className="mt-0.5 h-5 w-5 text-zinc-600" />
                    <div>
                      <p className="text-sm text-zinc-600 dark:text-zinc-400">
                        Preferred Date/Time
                      </p>
                      <p className="font-medium">
                        {lead.preferred_date &&
                          new Date(
                            lead.preferred_date
                          ).toLocaleDateString()}
                        {lead.preferred_time &&
                          ` at ${lead.preferred_time}`}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Notes */}
          {lead.notes && (
            <Card>
              <CardHeader>
                <CardTitle>Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap text-sm">{lead.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column - Timeline & Actions */}
        <div className="space-y-6 lg:col-span-2">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {lead.phone && (
                <Button variant="outline" asChild>
                  <a href={`tel:${lead.phone}`}>
                    <Phone className="mr-2 h-4 w-4" />
                    Call
                  </a>
                </Button>
              )}
              {lead.phone && (
                <Button variant="outline" asChild>
                  <a href={`sms:${lead.phone}`}>
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Text
                  </a>
                </Button>
              )}
              {lead.email && (
                <Button variant="outline" asChild>
                  <a href={`mailto:${lead.email}`}>
                    <Mail className="mr-2 h-4 w-4" />
                    Email
                  </a>
                </Button>
              )}
              <Button onClick={() => setShowInteractionDialog(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Log Interaction
              </Button>
              <Dialog open={showReminderDialog} onOpenChange={setShowReminderDialog}>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <Calendar className="mr-2 h-4 w-4" />
                    Set Reminder
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Set Follow-up Reminder</DialogTitle>
                  </DialogHeader>
                  <form
                    onSubmit={async (e) => {
                      e.preventDefault()
                      const formData = new FormData(e.currentTarget)
                      const date = formData.get('date') as string
                      try {
                        await setFollowUpReminder(lead.id, date)
                        setShowReminderDialog(false)
                        router.refresh()
                      } catch (error) {
                        console.error('Error setting reminder:', error)
                        alert('Failed to set reminder')
                      }
                    }}
                  >
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="reminder-date">Follow-up Date</Label>
                        <Input
                          id="reminder-date"
                          name="date"
                          type="date"
                          required
                          min={new Date().toISOString().split('T')[0]}
                        />
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setShowReminderDialog(false)}
                        >
                          Cancel
                        </Button>
                        <Button type="submit">Set Reminder</Button>
                      </div>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>

          {/* Step 4: Status Actions - Simplified based on lead type */}
          {(() => {
            const isManual = lead.source !== 'booking' && lead.source !== 'quote'
            const isBooking = lead.source === 'booking'
            const isQuote = lead.source === 'quote'
            
            // Manual leads: New → In Progress → Quoted → Lost
            if (isManual && lead.status !== 'booked' && lead.status !== 'lost') {
              return (
                <Card>
                  <CardHeader>
                    <CardTitle>Update Status</CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-wrap gap-2">
                    {lead.status === 'new' && (
                      <Button onClick={() => handleStatusChange('in_progress')}>
                        Mark as In Progress
                      </Button>
                    )}
                    {lead.status === 'in_progress' && (
                      <Button onClick={() => handleStatusChange('quoted')}>
                        Mark as Quoted
                      </Button>
                    )}
                    <Button
                      variant="destructive"
                      onClick={() => handleStatusChange('lost')}
                    >
                      Mark as Lost
                    </Button>
                  </CardContent>
                </Card>
              )
            }
            
            // Auto leads (booking/quote): Quoted → Viewed → Booked → Abandoned
            if ((isBooking || isQuote) && lead.status !== 'booked' && lead.status !== 'lost') {
              return (
                <Card>
                  <CardHeader>
                    <CardTitle>Update Status</CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-wrap gap-2">
                    {lead.status === 'quoted' && (
                      <Button onClick={() => handleStatusChange('in_progress')}>
                        Mark as Engaged
                      </Button>
                    )}
                    {lead.status === 'viewed' && lead.job_id && (
                      <Link href={`/dashboard/jobs/${lead.job_id}`}>
                        <Button>
                          <Briefcase className="mr-2 h-4 w-4" />
                          View Job
                        </Button>
                      </Link>
                    )}
                    <Button
                      variant="destructive"
                      onClick={() => handleStatusChange('lost')}
                    >
                      Mark as Abandoned
                    </Button>
                  </CardContent>
                </Card>
              )
            }
            
            return null
          })()}

          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>Activity Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Lead created */}
                <div className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900">
                      <UserPlus className="h-4 w-4 text-blue-600" />
                    </div>
                    <div className="mt-2 w-px flex-1 bg-zinc-200 dark:bg-zinc-700" />
                  </div>
                  <div className="flex-1 pb-8">
                    <p className="font-medium">Lead created</p>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">
                      {new Date(lead.created_at).toLocaleString()}
                    </p>
                    {lead.source && (
                      <p className="text-sm text-zinc-600 dark:text-zinc-400">
                        Source: {lead.source}
                      </p>
                    )}
                  </div>
                </div>

                {/* Interactions */}
                {lead.interactions && lead.interactions.length > 0 ? (
                  lead.interactions.map((interaction, index) => (
                    <div key={interaction.id} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800">
                          {interaction.type === 'call' && (
                            <Phone className="h-4 w-4" />
                          )}
                          {interaction.type === 'sms' && (
                            <MessageSquare className="h-4 w-4" />
                          )}
                          {interaction.type === 'email' && (
                            <Mail className="h-4 w-4" />
                          )}
                          {interaction.type === 'note' && (
                            <span className="text-xs">📝</span>
                          )}
                        </div>
                        {index < lead.interactions!.length - 1 && (
                          <div className="mt-2 w-px flex-1 bg-zinc-200 dark:bg-zinc-700" />
                        )}
                      </div>
                      <div className="flex-1 pb-8">
                        <p className="capitalize font-medium">
                          {interaction.type}
                        </p>
                        <p className="text-sm text-zinc-600 dark:text-zinc-400">
                          {new Date(interaction.created_at).toLocaleString()}
                        </p>
                        {interaction.content && (
                          <p className="mt-2 whitespace-pre-wrap text-sm">
                            {interaction.content}
                          </p>
                        )}
                        {interaction.outcome && (
                          <Badge
                            variant="outline"
                            className="mt-2 capitalize"
                          >
                            {interaction.outcome.replace('_', ' ')}
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="py-8 text-center text-sm text-zinc-600 dark:text-zinc-400">
                    No interactions yet. Log your first interaction above!
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Add Interaction Dialog */}
      <AddInteractionDialog
        leadId={lead.id}
        open={showInteractionDialog}
        onOpenChange={setShowInteractionDialog}
      />
    </div>
  )
}

