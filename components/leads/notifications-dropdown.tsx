'use client'

import { useState, useEffect } from 'react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { Bell, AlertCircle, MessageSquare, CheckCircle, X, Briefcase } from 'lucide-react'
import { getLeads } from '@/lib/actions/leads'
import Link from 'next/link'
import { cn } from '@/lib/utils'

export function NotificationsDropdown() {
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<Array<{
    type: 'failure' | 'reply' | 'booking' | 'new_lead' | 'new_job'
    message: string
    leadId?: string
    jobId?: string
    leadName?: string
    jobTitle?: string
    timestamp: string
  }>>([])
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    async function loadNotifications() {
      try {
        const allLeads = await getLeads('all')
        
        // Calculate notifications
        const notifs: typeof notifications = []
        const last24h = new Date()
        last24h.setHours(last24h.getHours() - 24)
        
        // Get new jobs from last 24h
        try {
          const { getJobs } = await import('@/lib/actions/jobs')
          const jobs = await getJobs()
          const newJobs = jobs.filter((job: any) => {
            const jobDate = new Date(job.created_at || job.scheduled_date)
            return jobDate > last24h && job.status !== 'completed' && job.status !== 'cancelled'
          })
          
          newJobs.forEach((job: any) => {
            notifs.push({
              type: 'new_job',
              message: `New job: ${job.title || 'Untitled'}`,
              jobId: job.id,
              jobTitle: job.title || 'Untitled',
              timestamp: job.created_at || job.scheduled_date,
            })
          })
        } catch (error) {
          console.warn('Error loading jobs for notifications:', error)
        }
        
        // Process each lead
        for (const lead of allLeads) {
          // New leads (created in last 24h, not booked)
          const leadDate = new Date(lead.created_at)
          if (leadDate > last24h && lead.status !== 'booked' && !lead.job_id) {
            notifs.push({
              type: 'new_lead',
              message: `New lead: ${lead.name}`,
              leadId: lead.id,
              leadName: lead.name,
              timestamp: lead.created_at,
            })
          }

          // Get full lead data with interactions
          try {
            const { getLead } = await import('@/lib/actions/leads')
            const fullLead = await getLead(lead.id)
            
            // Failed messages (interactions with failed status)
            if (fullLead.interactions) {
              fullLead.interactions.forEach((interaction: any) => {
                if (interaction.outcome === 'failed') {
                  notifs.push({
                    type: 'failure',
                    message: `Message failed to send to ${lead.name}`,
                    leadId: lead.id,
                    leadName: lead.name,
                    timestamp: interaction.created_at,
                  })
                }
              })
            }

            // Recent replies (inbound interactions in last 24h)
            if (fullLead.interactions) {
              fullLead.interactions.forEach((interaction: any) => {
                if (interaction.direction === 'inbound') {
                  const interactionDate = new Date(interaction.created_at)
                  if (interactionDate > last24h) {
                    notifs.push({
                      type: 'reply',
                      message: `${lead.name} replied`,
                      leadId: lead.id,
                      leadName: lead.name,
                      timestamp: interaction.created_at,
                    })
                  }
                }
              })
            }
          } catch (error) {
            // Skip leads that fail to load
            console.warn(`Failed to load lead ${lead.id}:`, error)
          }

          // Recent bookings (status changed to booked in last 24h)
          if (lead.status === 'booked') {
            const leadDate = new Date(lead.created_at)
            if (leadDate > last24h) {
              notifs.push({
                type: 'booking',
                message: `${lead.name} booked`,
                leadId: lead.id,
                leadName: lead.name,
                timestamp: lead.created_at,
              })
            }
          }
        }

        // Sort by timestamp (newest first)
        notifs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        
        setNotifications(notifs.slice(0, 10)) // Limit to 10 most recent
        setUnreadCount(notifs.length)
      } catch (error) {
        console.error('Error loading notifications:', error)
      }
    }

    if (open) {
      loadNotifications()
    }
  }, [open])

  const getIcon = (type: string) => {
    switch (type) {
      case 'failure':
        return <AlertCircle className="h-4 w-4 text-red-500" />
      case 'reply':
        return <MessageSquare className="h-4 w-4 text-blue-500" />
      case 'booking':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'new_lead':
        return <Bell className="h-4 w-4 text-violet-500" />
      case 'new_job':
        return <Briefcase className="h-4 w-4 text-cyan-500" />
      default:
        return <Bell className="h-4 w-4" />
    }
  }

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    return date.toLocaleDateString()
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative rounded-2xl border border-zinc-200/50 dark:border-white/10 bg-white/50 dark:bg-white/5 text-zinc-600 dark:text-white/70 hover:bg-zinc-100 dark:hover:bg-white/10 transition-colors"
          suppressHydrationWarning
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="p-4 border-b border-zinc-200/50 dark:border-white/10">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm">Notifications</h3>
            {unreadCount > 0 && (
              <span className="text-xs text-zinc-600 dark:text-zinc-400">
                {unreadCount} new
              </span>
            )}
          </div>
        </div>
        <div className="max-h-[400px] overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-sm text-zinc-500 dark:text-zinc-400">
              No notifications
            </div>
          ) : (
            <div className="divide-y divide-zinc-200/50 dark:divide-white/10">
              {notifications.map((notif, index) => {
                const href = notif.jobId 
                  ? `/dashboard/jobs/${notif.jobId}`
                  : notif.leadId 
                  ? `/dashboard/leads/${notif.leadId}`
                  : '#'
                
                return (
                  <Link
                    key={`${notif.type}-${notif.jobId || notif.leadId || index}`}
                    href={href}
                    onClick={() => setOpen(false)}
                    className="block p-4 hover:bg-zinc-50 dark:hover:bg-white/5 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      {getIcon(notif.type)}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-zinc-900 dark:text-white">
                          {notif.message}
                        </p>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                          {formatTime(notif.timestamp)}
                        </p>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
