'use client'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Mail,
  Phone,
  Trash2,
  MessageSquare,
  Eye,
  DollarSign,
  Calendar,
  Briefcase,
} from 'lucide-react'
import {
  deleteLead,
  convertLeadToClient,
} from '@/lib/actions/leads'
import Link from 'next/link'

type Lead = {
  id: string
  name: string
  email: string | null
  phone: string | null
  source: string | null
  interested_in_service_name: string | null
  estimated_value: number | null
  booking_progress: number
  score: string
  status: string
  last_contacted_at: string | null
  follow_up_count: number
  created_at: string
  job_id: string | null
  viewed_at: string | null
  interested_service?: {
    name: string
    price: number
  } | null
}

export default function LeadList({
  leads,
  type,
}: {
  leads: Lead[]
  type: 'hot' | 'warm' | 'cold' | 'booked' | 'lost'
}) {
  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this lead?')) return
    
    try {
      await deleteLead(id)
    } catch (error) {
      console.error('Error deleting lead:', error)
      alert('Failed to delete lead')
    }
  }

  async function handleConvert(id: string) {
    if (!confirm('Convert this lead to a client?')) return
    
    try {
      await convertLeadToClient(id)
      alert('Lead converted to client!')
    } catch (error) {
      console.error('Error converting lead:', error)
      alert('Failed to convert lead')
    }
  }

  // Sort leads: Hot leads first
  const sortedLeads = [...leads].sort((a, b) => {
    if (a.score === 'hot' && b.score !== 'hot') return -1
    if (b.score === 'hot' && a.score !== 'hot') return 1
    return 0
  })

  if (leads.length === 0) {
    return (
      <Card className="p-12 text-center">
        <p className="text-zinc-600 dark:text-zinc-400">
          No {type} leads yet.
        </p>
      </Card>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {sortedLeads.map((lead) => {
        const timeSinceCreated = Math.floor(
          (Date.now() - new Date(lead.created_at).getTime()) /
          (1000 * 60 * 60)
        )
        const isHot = lead.score === 'hot'
        const isManual = lead.source !== 'booking' && lead.source !== 'quote'
        
        // Format timestamp: "1h ago" instead of "1 hours ago"
        const timeAgo = timeSinceCreated < 1 
          ? '<1h ago' 
          : timeSinceCreated < 24
          ? `${timeSinceCreated}h ago`
          : `${Math.floor(timeSinceCreated / 24)}d ago`

        // Progress bar color: shifts from blue to green as it approaches 100%
        const progressColor = lead.booking_progress >= 80
          ? 'bg-green-600'
          : lead.booking_progress >= 50
          ? 'bg-blue-500'
          : 'bg-blue-400'

        // Get source label (only show once, not duplicated)
        const sourceLabel = lead.source === 'booking' 
          ? 'Booking' 
          : lead.source === 'quote' 
          ? 'Quick Quote' 
          : 'Manual'

        return (
          <Card
            key={lead.id}
            className={`relative p-5 transition-all ${
              isHot 
                ? 'border-2 border-orange-500 shadow-lg shadow-orange-500/20 ring-2 ring-orange-500/30' 
                : 'border'
            }`}
          >
            {/* Header */}
            <div className="mb-3 flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="mb-1.5 flex items-center gap-2">
                  <h3 className="text-lg font-semibold text-zinc-900 dark:text-white truncate">
                    {lead.name}
                  </h3>
                </div>
                {/* Source badge - only once, subtle */}
                {lead.source && (
                  <Badge 
                    variant="outline" 
                    className={`text-[10px] px-1.5 py-0 ${
                      isManual ? 'text-zinc-500 border-zinc-300' : ''
                    }`}
                  >
                    {sourceLabel}
                  </Badge>
                )}
              </div>
              <div className="flex gap-1 ml-2">
                <Link href={`/dashboard/leads/${lead.id}`}>
                  <Button variant="ghost" size="icon" className="h-7 w-7">
                    <Eye className="h-3.5 w-3.5" />
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => handleDelete(lead.id)}
                >
                  <Trash2 className="h-3.5 w-3.5 text-red-500" />
                </Button>
              </div>
            </div>
            
            {/* Key Info - Tier 1 */}
            <div className="mb-3 space-y-2">
              {/* Service + Price */}
              <div className="flex items-center justify-between">
                {lead.interested_in_service_name && (
                  <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate flex-1">
                    {lead.interested_in_service_name}
                  </p>
                )}
                {lead.estimated_value && (
                  <div className="flex items-center gap-1 font-semibold text-green-600 dark:text-green-400 ml-2">
                    <DollarSign className="h-3.5 w-3.5" />
                    <span className="text-sm">${Number(lead.estimated_value).toFixed(0)}</span>
                  </div>
                )}
              </div>

              {/* Booking Readiness Progress */}
              {lead.booking_progress > 0 && (
                <div>
                  <div className="mb-1 flex items-center justify-between">
                    <p className="text-[10px] font-medium text-zinc-600 dark:text-zinc-400">
                      Booking readiness
                    </p>
                    <span className="text-[10px] text-zinc-500">{lead.booking_progress}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-zinc-200 dark:bg-zinc-700">
                    <div
                      className={`h-1.5 rounded-full transition-all ${progressColor}`}
                      style={{ width: `${lead.booking_progress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Contact Info - Collapsed by default, show icons */}
            <div className="mb-3 flex items-center gap-3">
              {lead.phone && (
                <a 
                  href={`tel:${lead.phone}`}
                  className="group relative flex items-center"
                  title={lead.phone}
                >
                  <Phone className="h-4 w-4 text-zinc-500 group-hover:text-zinc-900 dark:group-hover:text-zinc-100 transition-colors" />
                  <span className="ml-1.5 text-xs text-zinc-600 dark:text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity">
                    {lead.phone}
                  </span>
                </a>
              )}
              {lead.email && (
                <a 
                  href={`mailto:${lead.email}`}
                  className="group relative flex items-center"
                  title={lead.email}
                >
                  <Mail className="h-4 w-4 text-zinc-500 group-hover:text-zinc-900 dark:group-hover:text-zinc-100 transition-colors" />
                  <span className="ml-1.5 text-xs text-zinc-600 dark:text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity truncate max-w-[120px]">
                    {lead.email}
                  </span>
                </a>
              )}
            </div>

            {/* Timestamp - Shortened */}
            <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mb-3">
              {timeAgo}
            </p>

            {/* Primary Action - Larger for Hot leads */}
            {(() => {
              const isManual = lead.source !== 'booking' && lead.source !== 'quote'
              
              // Manual leads: New/In Progress/Quoted → Schedule Job
              if (isManual && lead.status !== 'booked' && lead.status !== 'lost') {
                return (
                  <Button
                    size={isHot ? "default" : "sm"}
                    className={`w-full ${isHot ? 'text-base py-2.5' : ''}`}
                    onClick={() => handleConvert(lead.id)}
                  >
                    <Calendar className={`mr-1.5 ${isHot ? 'h-4 w-4' : 'h-3 w-3'}`} />
                    Schedule Job
                  </Button>
                )
              }
              
              // Quoted (not viewed) → Follow Up
              if (lead.status === 'quoted' && !lead.viewed_at) {
                return (
                  <Link href={`/dashboard/leads/${lead.id}`} className="w-full">
                    <Button 
                      size={isHot ? "default" : "sm"} 
                      variant="outline" 
                      className={`w-full ${isHot ? 'text-base py-2.5' : ''}`}
                    >
                      <MessageSquare className={`mr-1.5 ${isHot ? 'h-4 w-4' : 'h-3 w-3'}`} />
                      Follow Up
                    </Button>
                  </Link>
                )
              }
              
              // Viewed (not booked) → Follow Up
              if (lead.viewed_at && lead.status !== 'booked' && lead.status !== 'lost') {
                return (
                  <Link href={`/dashboard/leads/${lead.id}`} className="w-full">
                    <Button 
                      size={isHot ? "default" : "sm"} 
                      variant="outline" 
                      className={`w-full ${isHot ? 'text-base py-2.5' : ''}`}
                    >
                      <MessageSquare className={`mr-1.5 ${isHot ? 'h-4 w-4' : 'h-3 w-3'}`} />
                      Follow Up
                    </Button>
                  </Link>
                )
              }
              
              // Booked → View Job
              if (lead.status === 'booked' && lead.job_id) {
                return (
                  <Link href={`/dashboard/jobs/${lead.job_id}`} className="w-full">
                    <Button 
                      size={isHot ? "default" : "sm"} 
                      className={`w-full ${isHot ? 'text-base py-2.5' : ''}`}
                    >
                      <Briefcase className={`mr-1.5 ${isHot ? 'h-4 w-4' : 'h-3 w-3'}`} />
                      View Job
                    </Button>
                  </Link>
                )
              }
              
              return null
            })()}
          </Card>
        )
      })}
    </div>
  )
}
