'use client'

import { useState } from 'react'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import { LeadSlideOut } from '@/components/leads/inbox/lead-slide-out'
import { LeadsInboxLayout } from '@/components/leads/inbox/leads-inbox-layout'
import BookingList from '@/components/bookings/booking-list'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card } from '@/components/ui/card'
import { DollarSign, AlertCircle, TrendingUp, Phone } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

interface Lead {
  id: string
  name: string
  phone: string | null
  email: string | null
  interested_in_service_name: string | null
  estimated_value: number | null
  score: 'hot' | 'warm' | 'cold'
  status: string
  last_contacted_at: string | null
  created_at: string
  job_id: string | null
  interactions?: Array<{
    id: string
    type: string
    direction: string
    content: string
    outcome: string | null
    created_at: string
  }>
}

interface LeadsRecoveryCommandCenterProps {
  allLeads: Lead[]
  newLeads: Lead[]
  incompleteLeads: Lead[]
  followingUpLeads: Lead[]
  bookedLeads: Lead[]
  notInterestedLeads: Lead[]
  needsActionLeads: Lead[]
  overviewStats: {
    recoveredRevenue: number
    bookingsFromRecovery: number
    atRiskLeads: number
  }
  isStarter: boolean
  leadLimitInfo: {
    canAdd: boolean
  }
  maxLeads: number
  canUseAutomation: boolean
  canUseInbox?: boolean
}

export function LeadsRecoveryCommandCenter({
  allLeads,
  newLeads,
  incompleteLeads,
  followingUpLeads,
  bookedLeads,
  notInterestedLeads,
  needsActionLeads,
  overviewStats,
  isStarter,
  leadLimitInfo,
  maxLeads,
  canUseAutomation,
  canUseInbox = false,
}: LeadsRecoveryCommandCenterProps) {
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const [inboxSelectedLeadId, setInboxSelectedLeadId] = useState<string | null>(null)

  const handleLeadClick = (lead: any) => {
    // Convert lead to match LeadSlideOut interface
    const convertedLead: Lead = {
      ...lead,
      score: (lead.score === 'hot' || lead.score === 'warm' || lead.score === 'cold') 
        ? lead.score 
        : 'cold' as 'hot' | 'warm' | 'cold',
    }
    setSelectedLead(convertedLead)
    setIsSheetOpen(true)
  }

  const handleCloseSheet = () => {
    setIsSheetOpen(false)
    setSelectedLead(null)
  }

  return (
    <>
      <div className="p-4 sm:p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Bookings</h1>
            <p className="text-zinc-600 dark:text-zinc-400">
              Track new bookings and follow up with interested customers
            </p>
          </div>
          <div className="flex gap-2">
            {canUseAutomation && (
              <Link href="/dashboard/leads/sequences">
              <Button variant="outline" size="sm">
                ⚡ Auto Follow-Up
              </Button>
              </Link>
            )}
          </div>
        </div>

        {/* Starter Plan Warning */}
        {isStarter && !leadLimitInfo.canAdd && (
          <Card className="p-4 border-amber-500 bg-amber-50 dark:bg-amber-950">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold text-amber-900 dark:text-amber-100">
                  Lead Limit Reached
                </p>
                <p className="text-sm text-amber-800 dark:text-amber-200 mt-1">
                  You've reached your limit of {maxLeads} bookings. Upgrade to Pro for unlimited bookings and automation.
                </p>
                <Link href="/pricing">
                  <Button size="sm" variant="outline" className="mt-2 border-amber-600 text-amber-900 hover:bg-amber-100">
                    Upgrade to Pro
                  </Button>
                </Link>
              </div>
            </div>
          </Card>
        )}

        {/* Key Metrics - Simplified to 3 Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          {/* Recovered Revenue */}
          <Card className="p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Recovered</h3>
              <DollarSign className="h-5 w-5 text-green-600" />
            </div>
            <p className="text-3xl font-bold text-green-600">
              ${overviewStats.recoveredRevenue.toLocaleString()}
            </p>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">
              {overviewStats.bookingsFromRecovery} booking{overviewStats.bookingsFromRecovery !== 1 ? 's' : ''} this month
            </p>
          </Card>

          {/* Needs Action */}
          <Card className="p-6 border-l-4 border-orange-500">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Needs Action</h3>
              <AlertCircle className="h-5 w-5 text-orange-600" />
            </div>
            <p className="text-3xl font-bold text-orange-600">
              {needsActionLeads.length}
            </p>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">
              Follow up ASAP
            </p>
          </Card>

          {/* Booked Today */}
          <Card className="p-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Booked</h3>
              <TrendingUp className="h-5 w-5 text-blue-600" />
            </div>
            <p className="text-3xl font-bold text-blue-600">
              {bookedLeads.length}
            </p>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">
              Total successful bookings
            </p>
          </Card>
        </div>

        {/* Action Items - Only show if there are actions needed */}
        {needsActionLeads.length > 0 && (
          <Card className="p-6 bg-orange-50 dark:bg-orange-950 border-orange-200 dark:border-orange-800">
            <div className="flex items-start gap-3 mb-4">
              <AlertCircle className="h-6 w-6 text-orange-600 mt-1" />
              <div>
                <h3 className="font-bold text-lg text-orange-900 dark:text-orange-100">
                  {needsActionLeads.length} Booking{needsActionLeads.length !== 1 ? 's Need' : ' Needs'} Your Attention
                </h3>
                <p className="text-sm text-orange-800 dark:text-orange-200">
                  These customers are interested but haven't booked yet. Follow up now to close the deal!
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {needsActionLeads.slice(0, 3).map((lead: any) => {
                const hoursSinceContact = lead.last_contacted_at
                  ? Math.round((Date.now() - new Date(lead.last_contacted_at).getTime()) / (1000 * 60 * 60))
                  : null

                return (
                  <Card key={lead.id} className="p-4 bg-white dark:bg-zinc-900">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold text-zinc-900 dark:text-zinc-50">
                          {lead.name}
                        </h4>
                        <p className="text-sm text-zinc-600 dark:text-zinc-400">
                          {lead.interested_in_service_name || 'Interested in service'}
                        </p>
                        <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                          {hoursSinceContact !== null
                            ? `Last contact: ${hoursSinceContact}h ago`
                            : 'Not contacted yet'}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        {lead.phone && (
                          <a href={`tel:${lead.phone}`}>
                            <Button size="sm" variant="outline">
                              <Phone className="h-4 w-4 mr-1" />
                              Call
                            </Button>
                          </a>
                        )}
                        <Button size="sm" onClick={() => canUseInbox ? setInboxSelectedLeadId(lead.id) : handleLeadClick(lead)}>
                          View
                        </Button>
                      </div>
                    </div>
                  </Card>
                )
              })}
            </div>

            {needsActionLeads.length > 3 && (
              <p className="text-sm text-orange-700 dark:text-orange-300 mt-3 text-center">
                +{needsActionLeads.length - 3} more need attention
              </p>
            )}
          </Card>
        )}

        {/* Pro: Inbox 3-panel layout; Starter: Pipeline tabs */}
        {canUseInbox ? (
          <LeadsInboxLayout
            leads={allLeads as any}
            selectedLeadId={inboxSelectedLeadId}
            onSelectedLeadIdChange={setInboxSelectedLeadId}
          />
        ) : (
          <>
            <Card className="p-6">
              <h2 className="text-xl font-bold mb-4">All Bookings</h2>

              <Tabs defaultValue="incomplete" className="space-y-4">
                <TabsList>
                  <TabsTrigger value="new">
                    New ({newLeads.length})
                  </TabsTrigger>
                  <TabsTrigger value="incomplete">
                    <span className="flex items-center gap-2">
                      Incomplete ({incompleteLeads.length})
                      {incompleteLeads.length > 0 && (
                        <span className="h-2 w-2 rounded-full bg-orange-500 animate-pulse" />
                      )}
                    </span>
                  </TabsTrigger>
                  <TabsTrigger value="following-up">
                    Following Up ({followingUpLeads.length})
                  </TabsTrigger>
                  <TabsTrigger value="booked">
                    ✅ Booked ({bookedLeads.length})
                  </TabsTrigger>
                  <TabsTrigger value="not-interested">
                    Not Interested ({notInterestedLeads.length})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="new">
                  <BookingList leads={newLeads} type="new" onLeadClick={handleLeadClick} />
                </TabsContent>

                <TabsContent value="incomplete">
                  <BookingList leads={incompleteLeads} type="incomplete" onLeadClick={handleLeadClick} />
                </TabsContent>

                <TabsContent value="following-up">
                  <BookingList leads={followingUpLeads} type="following-up" onLeadClick={handleLeadClick} />
                </TabsContent>

                <TabsContent value="booked">
                  <BookingList leads={bookedLeads} type="booked" onLeadClick={handleLeadClick} />
                </TabsContent>

                <TabsContent value="not-interested">
                  <BookingList leads={notInterestedLeads} type="not-interested" onLeadClick={handleLeadClick} />
                </TabsContent>
              </Tabs>
            </Card>
          </>
        )}
      </div>

      {/* Lead Sheet - only for Starter (pipeline list + Needs Action View); Pro uses inbox panel only */}
      {!canUseInbox && (
        <Sheet open={isSheetOpen} onOpenChange={(open) => {
          if (!open) handleCloseSheet()
        }}>
          <SheetContent side="right" className="w-96 max-w-[28rem] p-0 [&>button]:hidden">
            <SheetTitle className="sr-only">
              {selectedLead ? `Lead Details - ${selectedLead.name}` : 'Lead Details'}
            </SheetTitle>
            {selectedLead && (
              <LeadSlideOut
                lead={selectedLead}
                onClose={handleCloseSheet}
              />
            )}
          </SheetContent>
        </Sheet>
      )}
    </>
  )
}
