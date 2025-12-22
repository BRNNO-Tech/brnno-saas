import { getQuotes } from '@/lib/actions/quotes'
import CreateQuoteButton from '@/components/quotes/create-quote-button'
import QuoteList from '@/components/quotes/quote-list'

export default async function QuotesPage() {
  const quotes = await getQuotes()
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
            Quotes
          </h1>
          <p className="mt-2 text-zinc-600 dark:text-zinc-400">
            Create and manage quotes
          </p>
        </div>
        <CreateQuoteButton />
      </div>
      
      <QuoteList quotes={quotes} />
    </div>
  )
}

