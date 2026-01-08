export const dynamic = 'force-dynamic'

import { getQuotes } from '@/lib/actions/quotes'
import CreateQuoteButton from '@/components/quotes/create-quote-button'
import QuoteList from '@/components/quotes/quote-list'
import { canUseAdvancedQuotes } from '@/lib/actions/permissions'
import UpgradePrompt from '@/components/upgrade-prompt'

export default async function QuotesPage() {
  const canUseAdvanced = await canUseAdvancedQuotes()
  
  // Starter plan can still view basic quotes, but advanced features are gated
  // We'll show a notice but allow basic quote viewing
  
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
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">
            Quotes
          </h1>
          <p className="mt-2 text-zinc-600 dark:text-zinc-400">
            Create and manage quotes
          </p>
        </div>
        <CreateQuoteButton />
      </div>
      
      {!canUseAdvanced && (
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-800 dark:bg-yellow-900/20">
          <p className="text-sm text-yellow-800 dark:text-yellow-300">
            <strong>Upgrade to Pro</strong> to unlock advanced quote features like custom templates, automated follow-ups, and PDF exports.
          </p>
        </div>
      )}
      
      <QuoteList quotes={quotes} canUseAdvanced={canUseAdvanced} />
    </div>
  )
}

