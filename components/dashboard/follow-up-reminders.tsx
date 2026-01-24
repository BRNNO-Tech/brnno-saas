'use client'

import { useEffect, useState } from 'react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Bell, Clock, Phone } from 'lucide-react'
import {
  getLeadsNeedingFollowUp,
  snoozeReminder,
} from '@/lib/actions/lead-reminders'
import Link from 'next/link'

export default function FollowUpReminders() {
  const [leads, setLeads] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadReminders() {
      try {
        const data = await getLeadsNeedingFollowUp()
        setLeads(data)
      } catch (error) {
        console.error('Error loading reminders:', error)
      } finally {
        setLoading(false)
      }
    }
    loadReminders()
  }, [])

  async function handleSnooze(leadId: string, days: number) {
    try {
      await snoozeReminder(leadId, days)
      setLeads(leads.filter((l) => l.id !== leadId))
    } catch (error) {
      console.error('Error snoozing reminder:', error)
      alert('Failed to snooze reminder')
    }
  }

  if (loading) return null
  if (leads.length === 0) return null

  return (
    <Card className="border-orange-200 dark:border-orange-800">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5 animate-pulse text-orange-600" />
          <CardTitle className="text-orange-900 dark:text-orange-100">
            Follow-up Reminders ({leads.length})
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {leads.slice(0, 5).map((lead) => (
          <div
            key={lead.id}
            className="flex items-start gap-3 rounded-lg border border-orange-200 bg-orange-50 p-3 dark:border-orange-800 dark:bg-orange-950"
          >
            <Clock className="mt-0.5 h-5 w-5 text-orange-600" />
            <div className="flex-1">
              <p className="font-medium">{lead.name}</p>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                {lead.interested_in_service_name &&
                  `Interested in: ${lead.interested_in_service_name}`}
              </p>
              <p className="text-xs text-zinc-600 dark:text-zinc-400">
                Follow up scheduled:{' '}
                {new Date(lead.next_follow_up_date!).toLocaleDateString()}
              </p>
            </div>
            <div className="flex gap-2">
              <Link href={`/dashboard/leads/${lead.id}`}>
                <Button size="sm" variant="outline">
                  <Phone className="mr-1 h-3 w-3" />
                  Call
                </Button>
              </Link>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleSnooze(lead.id, 1)}
              >
                Snooze
              </Button>
            </div>
          </div>
        ))}
        {leads.length > 5 && (
          <Link href="/dashboard/leads">
            <Button variant="outline" className="w-full">
              View All {leads.length} Reminders
            </Button>
          </Link>
        )}
      </CardContent>
    </Card>
  )
}
