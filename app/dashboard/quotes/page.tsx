export const dynamic = 'force-dynamic'

import { getQuotes } from '@/lib/actions/quotes'
import CreateQuoteButton from '@/components/quotes/create-quote-button'
import QuoteList from '@/components/quotes/quote-list'

export default async function QuotesPage() {
  let quotes
  try {
    quotes = await getQuotes()
  } catch (error) {
    console.error('Error loading quotes:', error)
    return (
      <div className="p-6">
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 dark:border-red-800 dark:bg-red-900/20">
          <h2 className="text-lg font-semibold text-red-800 dark:text-red-400">
            Unable to load quotes
          </h2>
          <p className="mt-2 text-sm text-red-600 dark:text-red-300">
            {error instanceof Error ? error.message : 'An error occurred while loading quotes.'}
          </p>
        </div>
      </div>
    )
  }
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">
            Quotes
          </h1>
          <p className="mt-2 text-zinc-400">
            Create and manage quotes
          </p>
        </div>
        <CreateQuoteButton />
      </div>
      
      <QuoteList quotes={quotes} />
    </div>
  )
}

