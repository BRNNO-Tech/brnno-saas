'use client'

import { useState, useEffect, useRef } from 'react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Search, X } from 'lucide-react'
import { getLeads } from '@/lib/actions/leads'
import Link from 'next/link'
import { cn } from '@/lib/utils'

interface SearchModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SearchModal({ open, onOpenChange }: SearchModalProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      inputRef.current?.focus()
    }
  }, [open])

  useEffect(() => {
    if (!query.trim()) {
      setResults([])
      return
    }

    const searchLeads = async () => {
      setLoading(true)
      try {
        const allLeads = await getLeads('all')
        const searchTerm = query.toLowerCase()
        const filtered = allLeads.filter((lead: any) => {
          const name = lead.name?.toLowerCase() || ''
          const phone = lead.phone?.toLowerCase() || ''
          const email = lead.email?.toLowerCase() || ''
          const source = lead.source?.toLowerCase() || ''
          return name.includes(searchTerm) || 
                 phone.includes(searchTerm) || 
                 email.includes(searchTerm) ||
                 source.includes(searchTerm)
        })
        setResults(filtered.slice(0, 10)) // Limit to 10 results
      } catch (error) {
        console.error('Error searching leads:', error)
      } finally {
        setLoading(false)
      }
    }

    const debounceTimer = setTimeout(searchLeads, 300)
    return () => clearTimeout(debounceTimer)
  }, [query])

  const handleResultClick = () => {
    setQuery('')
    setResults([])
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] p-0">
        <div className="p-4 border-b border-zinc-200/50 dark:border-white/10">
          <div className="flex items-center gap-3">
            <Search className="h-5 w-5 text-zinc-500 dark:text-zinc-400" />
            <Input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search leads, phone, tags…"
              className="flex-1 border-0 focus-visible:ring-0 text-base"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        <div className="max-h-[400px] overflow-y-auto">
          {loading && (
            <div className="p-8 text-center text-sm text-zinc-500 dark:text-zinc-400">
              Searching...
            </div>
          )}

          {!loading && query && results.length === 0 && (
            <div className="p-8 text-center text-sm text-zinc-500 dark:text-zinc-400">
              No leads found matching "{query}"
            </div>
          )}

          {!loading && !query && (
            <div className="p-8 text-center text-sm text-zinc-500 dark:text-zinc-400">
              Start typing to search leads by name, phone, email, or source
            </div>
          )}

          {!loading && results.length > 0 && (
            <div className="divide-y divide-zinc-200/50 dark:divide-white/10">
              {results.map((lead) => (
                <Link
                  key={lead.id}
                  href={`/dashboard/leads/${lead.id}`}
                  onClick={handleResultClick}
                  className="block p-4 hover:bg-zinc-50 dark:hover:bg-white/5 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-zinc-900 dark:text-white truncate">
                        {lead.name}
                      </p>
                      <div className="flex items-center gap-3 mt-1 text-sm text-zinc-600 dark:text-white/55">
                        {lead.phone && <span>{lead.phone}</span>}
                        {lead.email && <span>{lead.email}</span>}
                        {lead.source && (
                          <span className="text-xs px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800">
                            {lead.source}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className={cn(
                      "ml-4 px-2 py-1 rounded text-xs font-medium",
                      lead.score === 'hot' && "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
                      lead.score === 'warm' && "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
                      lead.score === 'cold' && "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                    )}>
                      {lead.score || 'cold'}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
