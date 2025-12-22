'use client'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Mail, Phone, Trash2, UserPlus, MessageSquare } from 'lucide-react'
import { deleteLead, updateLeadStatus, convertLeadToClient } from '@/lib/actions/leads'

type Lead = {
  id: string
  name: string
  email: string | null
  phone: string | null
  source: string | null
  interested_in: string | null
  notes: string | null
  status: string
  follow_up_date: string | null
  created_at: string
}

export default function LeadList({ leads }: { leads: Lead[] }) {
  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this lead?')) return
    
    try {
      await deleteLead(id)
    } catch (error) {
      console.error('Error deleting lead:', error)
      alert('Failed to delete lead')
    }
  }

  async function handleStatusChange(id: string, status: 'new' | 'contacted' | 'quoted' | 'converted' | 'lost') {
    try {
      await updateLeadStatus(id, status)
    } catch (error) {
      console.error('Error updating lead:', error)
      alert('Failed to update lead')
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

  if (leads.length === 0) {
    return (
      <Card className="p-12 text-center">
        <p className="text-zinc-600 dark:text-zinc-400">
          No leads yet. Add your first lead to get started.
        </p>
      </Card>
    )
  }

  // Group by status
  const newLeads = leads.filter(l => l.status === 'new')
  const contactedLeads = leads.filter(l => l.status === 'contacted')
  const quotedLeads = leads.filter(l => l.status === 'quoted')
  const convertedLeads = leads.filter(l => l.status === 'converted')
  const lostLeads = leads.filter(l => l.status === 'lost')

  return (
    <div className="space-y-6">
      {/* New Leads */}
      {newLeads.length > 0 && (
        <div>
          <h2 className="mb-3 text-lg font-semibold">New Leads ({newLeads.length})</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {newLeads.map((lead) => (
              <LeadCard
                key={lead.id}
                lead={lead}
                onDelete={handleDelete}
                onStatusChange={handleStatusChange}
                onConvert={handleConvert}
              />
            ))}
          </div>
        </div>
      )}

      {/* Contacted Leads */}
      {contactedLeads.length > 0 && (
        <div>
          <h2 className="mb-3 text-lg font-semibold">Contacted ({contactedLeads.length})</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {contactedLeads.map((lead) => (
              <LeadCard
                key={lead.id}
                lead={lead}
                onDelete={handleDelete}
                onStatusChange={handleStatusChange}
                onConvert={handleConvert}
              />
            ))}
          </div>
        </div>
      )}

      {/* Quoted Leads */}
      {quotedLeads.length > 0 && (
        <div>
          <h2 className="mb-3 text-lg font-semibold">Quoted ({quotedLeads.length})</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {quotedLeads.map((lead) => (
              <LeadCard
                key={lead.id}
                lead={lead}
                onDelete={handleDelete}
                onStatusChange={handleStatusChange}
                onConvert={handleConvert}
              />
            ))}
          </div>
        </div>
      )}

      {/* Other statuses collapsed */}
      {(convertedLeads.length > 0 || lostLeads.length > 0) && (
        <details className="rounded-lg border p-4">
          <summary className="cursor-pointer font-semibold">
            Converted/Lost Leads ({convertedLeads.length + lostLeads.length})
          </summary>
          <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[...convertedLeads, ...lostLeads].map((lead) => (
              <LeadCard
                key={lead.id}
                lead={lead}
                onDelete={handleDelete}
                onStatusChange={handleStatusChange}
                onConvert={handleConvert}
              />
            ))}
          </div>
        </details>
      )}
    </div>
  )
}

function LeadCard({ 
  lead, 
  onDelete, 
  onStatusChange, 
  onConvert 
}: { 
  lead: Lead
  onDelete: (id: string) => void
  onStatusChange: (id: string, status: any) => void
  onConvert: (id: string) => void
}) {
  return (
    <Card className="p-6">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h3 className="font-semibold text-lg">{lead.name}</h3>
          <Badge variant={
            lead.status === 'new' ? 'default' :
            lead.status === 'contacted' ? 'secondary' :
            lead.status === 'quoted' ? 'outline' :
            lead.status === 'converted' ? 'default' :
            'destructive'
          } className="mt-1">
            {lead.status}
          </Badge>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onDelete(lead.id)}
        >
          <Trash2 className="h-4 w-4 text-red-500" />
        </Button>
      </div>
      
      <div className="space-y-2 text-sm mb-4">
        {lead.phone && (
          <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
            <Phone className="h-4 w-4" />
            <span>{lead.phone}</span>
          </div>
        )}
        {lead.email && (
          <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
            <Mail className="h-4 w-4" />
            <span>{lead.email}</span>
          </div>
        )}
        {lead.source && (
          <p className="text-zinc-600 dark:text-zinc-400">
            Source: {lead.source}
          </p>
        )}
        {lead.interested_in && (
          <p className="text-zinc-600 dark:text-zinc-400">
            Interested in: {lead.interested_in}
          </p>
        )}
        {lead.follow_up_date && (
          <p className="text-zinc-600 dark:text-zinc-400">
            Follow-up: {new Date(lead.follow_up_date).toLocaleDateString()}
          </p>
        )}
        {lead.notes && (
          <p className="mt-3 text-zinc-600 dark:text-zinc-400">
            {lead.notes}
          </p>
        )}
      </div>

      <div className="flex gap-2">
        {lead.status === 'new' && (
          <Button
            size="sm"
            variant="outline"
            className="flex-1"
            onClick={() => onStatusChange(lead.id, 'contacted')}
          >
            <MessageSquare className="mr-2 h-4 w-4" />
            Contacted
          </Button>
        )}
        {lead.status === 'contacted' && (
          <Button
            size="sm"
            variant="outline"
            className="flex-1"
            onClick={() => onStatusChange(lead.id, 'quoted')}
          >
            Quoted
          </Button>
        )}
        {(lead.status === 'quoted' || lead.status === 'contacted') && (
          <Button
            size="sm"
            className="flex-1"
            onClick={() => onConvert(lead.id)}
          >
            <UserPlus className="mr-2 h-4 w-4" />
            Convert
          </Button>
        )}
        {lead.status !== 'lost' && lead.status !== 'converted' && (
          <Button
            size="sm"
            variant="destructive"
            onClick={() => onStatusChange(lead.id, 'lost')}
          >
            Lost
          </Button>
        )}
      </div>
    </Card>
  )
}

