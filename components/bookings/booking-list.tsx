'use client'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Phone, Mail, Calendar, DollarSign, Clock, User } from 'lucide-react'

type Lead = {
  id: string
  name: string
  phone: string | null
  email: string | null
  interested_in_service_name: string | null
  estimated_value: number | null
  created_at: string
  last_contacted_at: string | null
  status: string
  score: string
}

export default function BookingList({ 
  leads, 
  type,
  onLeadClick
}: { 
  leads: Lead[]
  type: 'new' | 'incomplete' | 'following-up' | 'booked' | 'not-interested'
  onLeadClick?: (lead: Lead) => void
}) {
  if (leads.length === 0) {
    return (
      <Card className="p-12 text-center">
        <p className="text-zinc-600 dark:text-zinc-400">
          {type === 'new' && 'No new bookings yet'}
          {type === 'incomplete' && 'No incomplete bookings - great job!'}
          {type === 'following-up' && 'No follow-ups needed'}
          {type === 'booked' && 'No bookings yet'}
          {type === 'not-interested' && 'No lost leads'}
        </p>
      </Card>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {leads.map((lead) => {
        const daysSince = Math.floor(
          (Date.now() - new Date(lead.created_at).getTime()) / (1000 * 60 * 60 * 24)
        )
        
        const hoursSinceContact = lead.last_contacted_at
          ? Math.floor((Date.now() - new Date(lead.last_contacted_at).getTime()) / (1000 * 60 * 60))
          : null

        return (
          <Card key={lead.id} className="p-4 hover:shadow-lg transition-all">
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h3 className="font-bold text-zinc-900 dark:text-zinc-50">
                  {lead.name}
                </h3>
                {lead.interested_in_service_name && (
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    {lead.interested_in_service_name}
                  </p>
                )}
              </div>
              {lead.estimated_value && (
                <span className="text-lg font-bold text-green-600">
                  ${lead.estimated_value}
                </span>
              )}
            </div>

            {/* Status Indicator */}
            <div className="mb-3 pb-3 border-b border-zinc-200 dark:border-zinc-700">
              {type === 'incomplete' && (
                <p className="text-xs text-orange-600 dark:text-orange-400 flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Started booking {daysSince === 0 ? 'today' : `${daysSince}d ago`}
                </p>
              )}
              {type === 'following-up' && hoursSinceContact && (
                <p className="text-xs text-blue-600 dark:text-blue-400 flex items-center gap-1">
                  <Mail className="h-3 w-3" />
                  Last contact: {hoursSinceContact}h ago
                </p>
              )}
              {type === 'booked' && (
                <p className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                  ✅ Booked successfully
                </p>
              )}
              {type === 'new' && (
                <p className="text-xs text-purple-600 dark:text-purple-400 flex items-center gap-1">
                  🆕 New inquiry
                </p>
              )}
            </div>

            {/* Contact Info */}
            <div className="space-y-2 mb-3 text-xs text-zinc-600 dark:text-zinc-400">
              {lead.phone && (
                <p className="flex items-center gap-2">
                  <Phone className="h-3 w-3" />
                  {lead.phone}
                </p>
              )}
              {lead.email && (
                <p className="flex items-center gap-2 truncate">
                  <Mail className="h-3 w-3" />
                  {lead.email}
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-2 justify-between">
              <div className="flex gap-2">
                {lead.phone && (
                  <a href={`tel:${lead.phone}`}>
                    <Button size="sm" variant="outline" className="h-8">
                      <Phone className="h-3 w-3" />
                    </Button>
                  </a>
                )}
                {lead.email && (
                  <a href={`mailto:${lead.email}`}>
                    <Button size="sm" variant="outline" className="h-8">
                      <Mail className="h-3 w-3" />
                    </Button>
                  </a>
                )}
              </div>
              
              <Button 
                size="sm" 
                className={type === 'booked' ? "h-8" : "h-8"}
                variant={type === 'booked' ? "outline" : "default"}
                onClick={() => onLeadClick?.(lead)}
              >
                {type === 'booked' ? (
                  'View'
                ) : (
                  <>
                    <Calendar className="h-3 w-3 mr-1" />
                    Schedule
                  </>
                )}
              </Button>
            </div>
          </Card>
        )
      })}
    </div>
  )
}
