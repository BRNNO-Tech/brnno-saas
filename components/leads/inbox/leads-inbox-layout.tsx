'use client'

import { useState, useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'
import { LeadsList } from './leads-list'
import { LeadSlideOut } from './lead-slide-out'
import { markLeadAsRead } from '@/lib/actions/leads'
import { useRouter } from 'next/navigation'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface Lead {
  id: string
  name: string
  email: string | null
  phone: string | null
  source: string | null
  interested_in_service_id: string | null
  interested_in_service_name: string | null
  estimated_value: number | null
  notes: string | null
  score: 'hot' | 'warm' | 'cold'
  status: string
  last_contacted_at: string | null
  follow_up_count: number
  created_at: string
  viewed_at: string | null
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

type Category = 'never' | 'booked' | 'warm' | 'hot'

interface LeadsInboxLayoutProps {
  leads: Lead[]
}

export function LeadsInboxLayout({ leads }: LeadsInboxLayoutProps) {
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null)
  const [activeCategory, setActiveCategory] = useState<Category>('never')
  const router = useRouter()
  const processedLeadsRef = useRef<Set<string>>(new Set())

  // Clear selection when category changes
  useEffect(() => {
    setSelectedLeadId(null)
  }, [activeCategory])

  // Categorize leads
  const categorizeLeads = (allLeads: Lead[]) => {
    const categorized = {
      never: [] as Lead[],
      booked: [] as Lead[],
      warm: [] as Lead[],
      hot: [] as Lead[],
    }

    allLeads.forEach((lead) => {
      // Booked leads (status is 'booked' or has job_id) - these are fully completed bookings
      if (lead.status === 'booked' || lead.job_id) {
        categorized.booked.push(lead)
      }
      // Never contacted (no last_contacted_at) - leads that haven't been reached out to
      else if (!lead.last_contacted_at) {
        categorized.never.push(lead)
      }
      // Hot leads (high priority)
      else if (lead.score === 'hot') {
        categorized.hot.push(lead)
      }
      // Warm leads (medium priority) or cold leads that have been contacted
      else if (lead.score === 'warm' || lead.score === 'cold') {
        categorized.warm.push(lead)
      }
      // Default fallback - any other leads go to never
      else {
        categorized.never.push(lead)
      }
    })

    return categorized
  }

  const categorizedLeads = categorizeLeads(leads)
  const leadsList = categorizedLeads[activeCategory]
  const selectedLead = selectedLeadId ? leadsList.find(l => l.id === selectedLeadId) : null

  // Mark lead as read when selected
  useEffect(() => {
    if (!selectedLeadId) return
    
    // Skip if we've already processed this lead
    if (processedLeadsRef.current.has(selectedLeadId)) return
    
    // Only mark as read if the lead is in the current category's list
    const lead = leadsList.find(l => l.id === selectedLeadId)
    if (!lead) {
      // Lead not in current category, don't try to mark as read
      return
    }
    
    // If already viewed, mark as processed and skip
    if (lead.viewed_at) {
      processedLeadsRef.current.add(selectedLeadId)
      return
    }
    
    // Mark this lead as being processed
    processedLeadsRef.current.add(selectedLeadId)
    
    // Mark as read - wrap in try-catch to handle errors gracefully
    markLeadAsRead(selectedLeadId)
      .then(() => {
        // Refresh the page data
        router.refresh()
      })
      .catch(error => {
        console.error('Error marking lead as read:', error)
        // Remove from processed set on error so we can retry
        processedLeadsRef.current.delete(selectedLeadId)
        // Don't show error to user - this is a background operation
      })
  }, [selectedLeadId, leadsList, router])

  const handleLeadDeleted = (deletedLeadId: string) => {
    // Clear selection if deleted lead was selected
    if (selectedLeadId === deletedLeadId) {
      setSelectedLeadId(null)
    }
    router.refresh()
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-4">
      {/* Left Column: List of leads with category tabs */}
      <div className="w-[28rem] flex-shrink-0 border-r border-zinc-200/50 dark:border-white/10 flex flex-col overflow-hidden">
        {/* Category Tabs */}
        <div className="border-b border-zinc-200/50 dark:border-white/10 p-2">
          <Tabs value={activeCategory} onValueChange={(v) => setActiveCategory(v as Category)}>
            <TabsList className="grid w-full grid-cols-4 h-auto p-0 bg-transparent">
              <TabsTrigger
                value="never"
                className="text-xs data-[state=active]:bg-violet-500/10 data-[state=active]:text-violet-700 dark:data-[state=active]:text-violet-300 transition-all duration-150 hover:bg-zinc-100 dark:hover:bg-white/5 py-1.5"
              >
                Never
                {categorizedLeads.never.length > 0 && (
                  <span className="ml-1.5 text-[10px] bg-violet-500/20 text-violet-700 dark:text-violet-300 px-1.5 py-0.5 rounded-full">
                    {categorizedLeads.never.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger
                value="booked"
                className="text-xs data-[state=active]:bg-emerald-500/10 data-[state=active]:text-emerald-700 dark:data-[state=active]:text-emerald-300 transition-all duration-150 hover:bg-zinc-100 dark:hover:bg-white/5 py-1.5"
              >
                Booked
                {categorizedLeads.booked.length > 0 && (
                  <span className="ml-1.5 text-[10px] bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 px-1.5 py-0.5 rounded-full">
                    {categorizedLeads.booked.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger
                value="warm"
                className="text-xs data-[state=active]:bg-orange-500/10 data-[state=active]:text-orange-700 dark:data-[state=active]:text-orange-300 transition-all duration-150 hover:bg-zinc-100 dark:hover:bg-white/5 py-1.5"
              >
                Warm
                {categorizedLeads.warm.length > 0 && (
                  <span className="ml-1.5 text-[10px] bg-orange-500/20 text-orange-700 dark:text-orange-300 px-1.5 py-0.5 rounded-full">
                    {categorizedLeads.warm.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger
                value="hot"
                className="text-xs data-[state=active]:bg-red-500/10 data-[state=active]:text-red-700 dark:data-[state=active]:text-red-300 transition-all duration-150 hover:bg-zinc-100 dark:hover:bg-white/5 py-1.5"
              >
                Hot
                {categorizedLeads.hot.length > 0 && (
                  <span className="ml-1.5 text-[10px] bg-red-500/20 text-red-700 dark:text-red-300 px-1.5 py-0.5 rounded-full">
                    {categorizedLeads.hot.length}
                  </span>
                )}
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        
        {/* Leads List */}
        <div className="flex-1 overflow-y-auto">
          <LeadsList
            leads={leadsList}
            selectedLeadId={selectedLeadId}
            onSelectLead={setSelectedLeadId}
          />
        </div>
      </div>

      {/* Right Column: Slide-out */}
      <div className={cn(
        "hidden xl:block w-[32rem] flex-shrink-0 border-l border-zinc-200/50 dark:border-white/10 overflow-hidden transition-all duration-300 ease-in-out",
        selectedLead 
          ? "opacity-100 translate-x-0" 
          : "opacity-0 translate-x-full pointer-events-none w-0"
      )}>
        {selectedLead && (
          <LeadSlideOut
            lead={selectedLead}
            onClose={() => setSelectedLeadId(null)}
            onDelete={handleLeadDeleted}
          />
        )}
      </div>

      {/* Mobile: Slide-out as Modal/Drawer */}
      {selectedLead && (
        <div className="xl:hidden fixed inset-0 z-50 bg-black/50 dark:bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="absolute right-0 top-0 bottom-0 w-full max-w-md bg-white dark:bg-zinc-900 shadow-xl animate-in slide-in-from-right duration-300">
            <LeadSlideOut
              lead={selectedLead}
              onClose={() => setSelectedLeadId(null)}
              onDelete={handleLeadDeleted}
            />
          </div>
        </div>
      )}
    </div>
  )
}
