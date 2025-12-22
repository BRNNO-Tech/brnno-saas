'use client'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Trash2, FileText, Edit } from 'lucide-react'
import { deleteQuote, updateQuoteStatus, convertQuoteToInvoice } from '@/lib/actions/quotes'
import EditQuoteDialog from './edit-quote-dialog'
import { useState } from 'react'

type Quote = {
  id: string
  status: string
  total: number
  created_at: string
  client_id: string | null
  client: { name: string } | null
  quote_items: any[]
}

export default function QuoteList({ quotes }: { quotes: Quote[] }) {
  const [editingQuote, setEditingQuote] = useState<Quote | null>(null)

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this quote?')) return
    
    try {
      await deleteQuote(id)
    } catch (error) {
      console.error('Error deleting quote:', error)
      alert('Failed to delete quote')
    }
  }

  async function handleStatusChange(id: string, status: 'draft' | 'sent' | 'approved') {
    try {
      await updateQuoteStatus(id, status)
    } catch (error) {
      console.error('Error updating quote:', error)
      alert('Failed to update quote')
    }
  }

  async function handleConvertToInvoice(id: string) {
    if (!confirm('Convert this quote to an invoice?')) return
    
    try {
      await convertQuoteToInvoice(id)
      alert('Quote converted to invoice!')
    } catch (error) {
      console.error('Error converting quote:', error)
      alert('Failed to convert quote')
    }
  }

  if (quotes.length === 0) {
    return (
      <Card className="p-12 text-center">
        <p className="text-zinc-600 dark:text-zinc-400">
          No quotes yet. Create your first quote to get started.
        </p>
      </Card>
    )
  }

  return (
    <>
      <div className="space-y-4">
        {quotes.map((quote) => (
          <Card key={quote.id} className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="mb-2 flex items-center gap-3">
                  <h3 className="font-semibold text-lg">
                    {quote.client?.name || 'No client'}
                  </h3>
                  <Badge variant={
                    quote.status === 'approved' ? 'default' :
                    quote.status === 'sent' ? 'secondary' :
                    'outline'
                  }>
                    {quote.status}
                  </Badge>
                </div>
                
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  {quote.quote_items?.length || 0} item(s) • Created {new Date(quote.created_at).toLocaleDateString()}
                </p>
                
                <p className="mt-2 text-xl font-semibold">
                  ${quote.total.toFixed(2)}
                </p>
              </div>
              
              <div className="flex items-center gap-2">
                {quote.status === 'draft' && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleStatusChange(quote.id, 'sent')}
                  >
                    Mark as Sent
                  </Button>
                )}
                
                {quote.status === 'sent' && (
                  <Button
                    size="sm"
                    onClick={() => handleConvertToInvoice(quote.id)}
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    Convert to Invoice
                  </Button>
                )}
                
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setEditingQuote(quote)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDelete(quote.id)}
                >
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {editingQuote && (
        <EditQuoteDialog
          quote={editingQuote}
          open={!!editingQuote}
          onOpenChange={(open) => !open && setEditingQuote(null)}
        />
      )}
    </>
  )
}

